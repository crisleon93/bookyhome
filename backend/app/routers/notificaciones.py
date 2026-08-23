from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.database import get_db
from app.auth import verify_token
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"], redirect_slashes=False)
security = HTTPBearer()

# ============= ENUMS =============

class TipoNotificacion(str, Enum):
    mensaje = "mensaje"
    resena = "resena"
    oferta = "oferta"
    pedido = "pedido"
    entrega = "entrega"
    pago = "pago"
    sistema = "sistema"

# ============= SCHEMAS =============

class NotificacionCreate(BaseModel):
    tipo: TipoNotificacion
    titulo: str
    cuerpo: str
    id_referencia: int | None = None

class NotificacionResponse(BaseModel):
    id_notificacion: int
    id_usuario: int
    tipo: str
    titulo: str
    cuerpo: str
    id_referencia: int | None
    leida: bool
    fecha_creacion: str

# ============= HELPERS =============

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))

# ============= ENDPOINTS =============

@router.get("")
def obtener_notificaciones_usuario(
    user_id: int = Depends(get_current_user),
    solo_no_leidas: bool = False,
    limit: int = 50,
    offset: int = 0
):
    """Obtiene notificaciones del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                n.id_notificacion,
                n.id_usuario,
                n.tipo,
                n.titulo,
                n.cuerpo,
                n.cuerpo AS descripcion,
                n.id_referencia,
                n.id_referencia AS referencia_id,
                n.leida,
                n.fecha_creacion
            FROM notificaciones n
            WHERE n.id_usuario = %s
        """
        params = [user_id]
        
        if solo_no_leidas:
            query += " AND n.leida = FALSE"
        
        query += " ORDER BY n.fecha_creacion DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        notificaciones = cursor.fetchall()
        
        # Formatear fechas en Python
        for notif in notificaciones:
            if notif["fecha_creacion"]:
                notif["fecha_creacion"] = notif["fecha_creacion"].strftime("%Y-%m-%d %H:%M:%S")
        
        # Contar total no leídas
        cursor.execute("""
            SELECT COUNT(*) as total FROM notificaciones 
            WHERE id_usuario = %s AND leida = FALSE
        """, (user_id,))
        no_leidas = cursor.fetchone()
        
        return {
            "notificaciones": notificaciones,
            "no_leidas": no_leidas["total"] if no_leidas else 0
        }
    finally:
        cursor.close()
        db.close()


@router.post("")
def crear_notificacion(data: NotificacionCreate, user_id: int = Depends(get_current_user)):
    """Crea una notificación para el usuario actual (sistema)"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO notificaciones 
            (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
            VALUES (%s, %s, %s, %s, %s, FALSE, NOW())
        """, (user_id, data.tipo.value, data.titulo, data.cuerpo, data.id_referencia))
        
        db.commit()
        notif_id = cursor.lastrowid
        
        return {
            "ok": True,
            "id_notificacion": notif_id,
            "mensaje": "Notificación creada"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.put("/{id_notificacion}/leer")
def marcar_notificacion_leida(id_notificacion: int, user_id: int = Depends(get_current_user)):
    """Marca una notificación como leída"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            UPDATE notificaciones 
            SET leida = TRUE 
            WHERE id_notificacion = %s AND id_usuario = %s
        """, (id_notificacion, user_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        db.commit()
        
        return {"ok": True, "mensaje": "Notificación marcada como leída"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.put("/marcar-todas-leidas")
def marcar_todas_leidas(user_id: int = Depends(get_current_user)):
    """Marca todas las notificaciones como leídas"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            UPDATE notificaciones 
            SET leida = TRUE 
            WHERE id_usuario = %s AND leida = FALSE
        """, (user_id,))
        
        db.commit()
        
        return {"ok": True, "mensaje": "Todas las notificaciones marcadas como leídas"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.delete("/{id_notificacion}")
def eliminar_notificacion(id_notificacion: int, user_id: int = Depends(get_current_user)):
    """Elimina una notificación"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            DELETE FROM notificaciones 
            WHERE id_notificacion = %s AND id_usuario = %s
        """, (id_notificacion, user_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        db.commit()
        
        return {"ok": True, "mensaje": "Notificación eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
