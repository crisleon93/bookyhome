from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.database import get_db
from app.auth import verify_token
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])
security = HTTPBearer()

# ============= SCHEMAS =============

class MensajeCreate(BaseModel):
    id_sala: int
    mensaje: str

class MensajeResponse(BaseModel):
    id_mensaje: int
    id_sala: int
    id_remitente: int
    nombre_remitente: str
    mensaje: str
    enviado_en: str
    mensaje_leido: bool

class SalaChat(BaseModel):
    id_sala: int
    id_usuario: int
    id_tienda: int
    nombre_tienda: str
    ultimo_mensaje: str | None
    fecha_ultimo_mensaje: str | None
    no_leidos: int

# ============= HELPERS =============

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))

# ============= ENDPOINTS =============

@router.get("/salas")
def obtener_salas_usuario(user_id: int = Depends(get_current_user)):
    """Obtiene todas las salas de chat del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                sc.id_sala,
                sc.id_usuario,
                sc.id_tienda,
                t.nombre_tienda,
                m.mensaje as ultimo_mensaje,
                DATE_FORMAT(m.enviado_en, '%Y-%m-%d %H:%i:%s') as fecha_ultimo_mensaje,
                COUNT(CASE WHEN m.mensaje_leido = FALSE THEN 1 END) as no_leidos
            FROM salasChats sc
            LEFT JOIN tiendas t ON sc.id_tienda = t.id_tienda
            LEFT JOIN mensajes m ON sc.id_sala = m.id_sala 
                AND m.enviado_en = (
                    SELECT MAX(enviado_en) 
                    FROM mensajes 
                    WHERE id_sala = sc.id_sala
                )
            WHERE sc.id_usuario = %s
            GROUP BY sc.id_sala
            ORDER BY m.enviado_en DESC
        """
        cursor.execute(query, (user_id,))
        salas = cursor.fetchall()
        return {"salas": salas}
    finally:
        cursor.close()
        db.close()

@router.post("/salas")
def crear_sala_chat(id_tienda: int, user_id: int = Depends(get_current_user)):
    """Crea una nueva sala de chat entre usuario y tienda"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que la tienda existe
        cursor.execute("SELECT id_tienda FROM tiendas WHERE id_tienda = %s", (id_tienda,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
        # Verificar si ya existe una sala
        cursor.execute("""
            SELECT id_sala FROM salasChats 
            WHERE id_usuario = %s AND id_tienda = %s
        """, (user_id, id_tienda))
        sala_existente = cursor.fetchone()
        
        if sala_existente:
            return {"id_sala": sala_existente["id_sala"], "mensaje": "Sala existente"}
        
        # Crear sala
        cursor.execute("""
            INSERT INTO salasChats (id_usuario, id_tienda, creado_en, actualizado_en)
            VALUES (%s, %s, NOW(), NOW())
        """, (user_id, id_tienda))
        
        db.commit()
        sala_id = cursor.lastrowid
        
        return {
            "ok": True,
            "id_sala": sala_id,
            "mensaje": "Sala de chat creada"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.get("/salas/{id_sala}/mensajes")
def obtener_mensajes_sala(id_sala: int, limit: int = 50, offset: int = 0):
    """Obtiene los mensajes de una sala de chat"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                m.id_mensaje,
                m.id_sala,
                m.id_remitente,
                u.nombre_usuario as nombre_remitente,
                m.mensaje,
                DATE_FORMAT(m.enviado_en, '%Y-%m-%d %H:%i:%s') as enviado_en,
                m.mensaje_leido
            FROM mensajes m
            JOIN usuarios u ON m.id_remitente = u.id_usuario
            WHERE m.id_sala = %s
            ORDER BY m.enviado_en DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (id_sala, limit, offset))
        mensajes = cursor.fetchall()
        mensajes.reverse()  # Mostrar en orden cronológico
        return {"mensajes": mensajes}
    finally:
        cursor.close()
        db.close()

@router.post("/mensajes")
def enviar_mensaje(data: MensajeCreate, user_id: int = Depends(get_current_user)):
    """Envía un mensaje en una sala de chat"""
    
    # Validar mensaje no vacío
    if not data.mensaje.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
    
    if len(data.mensaje) > 500:
        raise HTTPException(status_code=400, detail="El mensaje es muy largo (máximo 500 caracteres)")
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que la sala existe y el usuario tiene acceso
        cursor.execute("""
            SELECT id_usuario FROM salasChats 
            WHERE id_sala = %s AND (id_usuario = %s 
                OR id_tienda IN (SELECT id_tienda FROM tiendas WHERE id_usuario = %s))
        """, (data.id_sala, user_id, user_id))
        
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="No tienes acceso a esta sala")
        
        # Crear mensaje
        cursor.execute("""
            INSERT INTO mensajes 
            (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
            VALUES (%s, %s, %s, NOW(), FALSE)
        """, (data.id_sala, user_id, data.mensaje))
        
        db.commit()
        mensaje_id = cursor.lastrowid
        
        # Actualizar timestamp de sala
        cursor.execute("""
            UPDATE salasChats SET actualizado_en = NOW() WHERE id_sala = %s
        """, (data.id_sala,))
        db.commit()
        
        return {
            "ok": True,
            "id_mensaje": mensaje_id,
            "mensaje": "Mensaje enviado"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.put("/mensajes/{id_mensaje}/leer")
def marcar_mensaje_leido(id_mensaje: int, user_id: int = Depends(get_current_user)):
    """Marca un mensaje como leído"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            UPDATE mensajes 
            SET mensaje_leido = TRUE 
            WHERE id_mensaje = %s
        """, (id_mensaje,))
        
        db.commit()
        
        return {"ok": True, "mensaje": "Mensaje marcado como leído"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.put("/salas/{id_sala}/marcar-leidos")
def marcar_sala_leida(id_sala: int, user_id: int = Depends(get_current_user)):
    """Marca todos los mensajes de una sala como leídos"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            UPDATE mensajes 
            SET mensaje_leido = TRUE 
            WHERE id_sala = %s
        """, (id_sala,))
        
        db.commit()
        
        return {"ok": True, "mensaje": "Sala marcada como leída"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
