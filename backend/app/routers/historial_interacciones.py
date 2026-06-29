from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.database import get_db
from app.auth import verify_token
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/historial", tags=["Historial"])
security = HTTPBearer()

# ============= ENUMS =============

class TipoInteraccion(str, Enum):
    visualizacion = "visualizacion"
    compra = "compra"
    resena = "resena"
    mensaje = "mensaje"
    favorito = "favorito"
    carrito = "carrito"

# ============= SCHEMAS =============

class InteraccionCreate(BaseModel):
    tipo: TipoInteraccion
    id_libro: int | None = None
    id_tienda: int | None = None
    descripcion: str | None = None

class InteraccionResponse(BaseModel):
    id_interaccion: int
    id_usuario: int
    tipo: str
    id_libro: int | None
    id_tienda: int | None
    descripcion: str | None
    fecha_interaccion: str

# ============= HELPERS =============

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))

# ============= ENDPOINTS =============

@router.get("/")
def obtener_historial_usuario(
    user_id: int = Depends(get_current_user),
    tipo: str | None = None,
    limit: int = 50,
    offset: int = 0
):
    """Obtiene el historial de interacciones del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                h.id_interaccion,
                h.id_usuario,
                h.tipo,
                h.id_libro,
                h.id_tienda,
                h.descripcion,
                h.fecha_interaccion as fecha_interaccion,
                l.titulo as nombre_libro,
                t.nombre_tienda
            FROM historial_interacciones h
            LEFT JOIN libros l ON h.id_libro = l.id_libro
            LEFT JOIN tiendas t ON h.id_tienda = t.id_tienda
            WHERE h.id_usuario = %s
        """
        params = [user_id]
        
        if tipo:
            query += " AND h.tipo = %s"
            params.append(tipo)
        
        query += " ORDER BY h.fecha_interaccion DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        historial = cursor.fetchall()
        
        return {"historial": historial}
    finally:
        cursor.close()
        db.close()

@router.post("/")
def registrar_interaccion(data: InteraccionCreate, user_id: int = Depends(get_current_user)):
    """Registra una interacción del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Validar datos según tipo
        if data.tipo in [TipoInteraccion.visualizacion, TipoInteraccion.compra, TipoInteraccion.resena] and not data.id_libro:
            raise HTTPException(status_code=400, detail=f"id_libro es requerido para {data.tipo}")
        
        if data.tipo in [TipoInteraccion.mensaje] and not data.id_tienda:
            raise HTTPException(status_code=400, detail=f"id_tienda es requerido para {data.tipo}")
        
        cursor.execute("""
            INSERT INTO historial_interacciones 
            (id_usuario, tipo, id_libro, id_tienda, descripcion, fecha_interaccion)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (user_id, data.tipo.value, data.id_libro, data.id_tienda, data.descripcion))
        
        db.commit()
        interaccion_id = cursor.lastrowid
        
        return {
            "ok": True,
            "id_interaccion": interaccion_id,
            "mensaje": "Interacción registrada"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.get("/estadisticas")
def obtener_estadisticas_historial(user_id: int = Depends(get_current_user)):
    """Obtiene estadísticas del historial de interacciones"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                tipo,
                COUNT(*) as total
            FROM historial_interacciones
            WHERE id_usuario = %s
            GROUP BY tipo
        """
        
        cursor.execute(query, (user_id,))
        estadisticas = cursor.fetchall()
        
        # Contar total
        cursor.execute("""
            SELECT COUNT(*) as total FROM historial_interacciones 
            WHERE id_usuario = %s
        """, (user_id,))
        total = cursor.fetchone()
        
        return {
            "total": total["total"],
            "por_tipo": estadisticas
        }
    finally:
        cursor.close()
        db.close()

@router.delete("/{id_interaccion}")
def eliminar_interaccion(id_interaccion: int, user_id: int = Depends(get_current_user)):
    """Elimina un registro del historial"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            DELETE FROM historial_interacciones 
            WHERE id_interaccion = %s AND id_usuario = %s
        """, (id_interaccion, user_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Interacción no encontrada")
        
        db.commit()
        
        return {"ok": True, "mensaje": "Interacción eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
