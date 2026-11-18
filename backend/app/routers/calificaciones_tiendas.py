from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.database import get_db
from app.auth import verify_token
from app.utils.router_helpers import obtener_resumen_calificaciones_tienda
import json
import os

router = APIRouter(prefix="/calificaciones", tags=["Calificaciones Tiendas"])
security = HTTPBearer()

# ============= SCHEMAS =============

class CalificacionTiendaCreate(BaseModel):
    id_tienda: int
    calificacion: int  # 1-5
    comentario: str

class CalificacionTiendaResponse(BaseModel):
    id_calificacion: int
    id_usuario: int
    nombre_usuario: str
    id_tienda: int
    nombre_tienda: str
    calificacion: int
    comentario: str
    fecha_calificacion: str

# ============= HELPERS =============

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invÃ¡lido")
    return int(payload.get("sub"))


def _usuario_compro_en_tienda_entregada(usuario_orders, id_tienda: int) -> bool:
    for order in usuario_orders:
        if order.get('estado', '').lower() != 'entregada':
            continue
        for item in order.get('items', []):
            db = get_db()
            cursor = db.cursor(dictionary=True)
            try:
                cursor.execute(
                    "SELECT id_tienda FROM libros WHERE id_libro = %s",
                    (item.get('id_libro'),),
                )
                libro = cursor.fetchone()
                if libro and libro['id_tienda'] == id_tienda:
                    return True
            finally:
                cursor.close()
                db.close()
    return False


# ============= ENDPOINTS =============

@router.get("/tienda/{id_tienda}")
def obtener_calificaciones_tienda(id_tienda: int):
    """Obtiene todas las calificaciones de una tienda con mÃ©tricas agregadas"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        return obtener_resumen_calificaciones_tienda(cursor, id_tienda)
    finally:
        cursor.close()
        db.close()

@router.post("/tienda")
def crear_calificacion_tienda(data: CalificacionTiendaCreate, user_id: int = Depends(get_current_user)):
    """Crea una nueva calificaciÃ³n de tienda"""
    
    # Validar calificaciÃ³n
    if data.calificacion < 1 or data.calificacion > 5:
        raise HTTPException(status_code=400, detail="CalificaciÃ³n debe estar entre 1 y 5")
    
    # Cargar orders.json para verificar la compra
    storage_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    order_file = os.path.join(storage_dir, 'orders.json')
    
    if not os.path.exists(order_file):
        raise HTTPException(status_code=404, detail="Archivo de Ã³rdenes no encontrado")
    
    try:
        with open(order_file, 'r', encoding='utf-8') as file:
            orders = json.load(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cargando Ã³rdenes: {str(e)}")
    
    # Verificar que el usuario haya comprado en esa tienda y estÃ© entregada
    usuario_orders = orders.get(str(user_id), [])
    ha_comprado_entregada = _usuario_compro_en_tienda_entregada(usuario_orders, data.id_tienda)
    
    if not ha_comprado_entregada:
        raise HTTPException(status_code=403, detail="Solo puedes calificar tiendas donde hayas realizado compras entregadas")
    
    # Verificar si ya calificÃ³ y crear calificaciÃ³n
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar si ya hizo calificaciÃ³n a esta tienda
        cursor.execute("""
            SELECT id_calificacion FROM calificaciones_tiendas 
            WHERE id_usuario = %s AND id_tienda = %s
        """, (user_id, data.id_tienda))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Ya hiciste una calificaciÃ³n de esta tienda")
        
        # Crear calificaciÃ³n
        cursor.execute("""
            INSERT INTO calificaciones_tiendas 
            (id_usuario, id_tienda, calificacion, comentario, fecha_calificacion)
            VALUES (%s, %s, %s, %s, NOW())
        """, (user_id, data.id_tienda, data.calificacion, data.comentario))
        
        db.commit()
        
        return {
            "ok": True,
            "mensaje": "CalificaciÃ³n creada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.put("/tienda/{id_calificacion}")
def actualizar_calificacion_tienda(id_calificacion: int, data: CalificacionTiendaCreate, user_id: int = Depends(get_current_user)):
    """Actualiza una calificaciÃ³n de tienda existente"""
    
    if data.calificacion < 1 or data.calificacion > 5:
        raise HTTPException(status_code=400, detail="CalificaciÃ³n debe estar entre 1 y 5")
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que sea propietario
        cursor.execute("SELECT id_usuario FROM calificaciones_tiendas WHERE id_calificacion = %s", (id_calificacion,))
        calificacion = cursor.fetchone()
        
        if not calificacion:
            raise HTTPException(status_code=404, detail="CalificaciÃ³n no encontrada")
        
        if calificacion["id_usuario"] != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para editar esta calificaciÃ³n")
        
        # Actualizar
        cursor.execute("""
            UPDATE calificaciones_tiendas 
            SET calificacion = %s, comentario = %s, fecha_calificacion = NOW()
            WHERE id_calificacion = %s
        """, (data.calificacion, data.comentario, id_calificacion))
        
        db.commit()
        
        return {"ok": True, "mensaje": "CalificaciÃ³n actualizada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.delete("/tienda/{id_calificacion}")
def eliminar_calificacion_tienda(id_calificacion: int, user_id: int = Depends(get_current_user)):
    """Elimina una calificaciÃ³n de tienda"""
    
    db = get_db()
    cursor = db.cursor()
    try:
        # Verificar que sea propietario
        cursor.execute("SELECT id_usuario FROM calificaciones_tiendas WHERE id_calificacion = %s", (id_calificacion,))
        calificacion = cursor.fetchone()
        
        if not calificacion:
            raise HTTPException(status_code=404, detail="CalificaciÃ³n no encontrada")
        
        if calificacion[0] != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta calificaciÃ³n")
        
        cursor.execute("DELETE FROM calificaciones_tiendas WHERE id_calificacion = %s", (id_calificacion,))
        db.commit()
        
        return {"ok": True, "mensaje": "CalificaciÃ³n eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.get("/tienda/{id_tienda}/usuario-puede-calificar")
def usuario_puede_calificar_tienda(id_tienda: int, user_id: int = Depends(get_current_user)):
    """Verifica si el usuario puede calificar una tienda (ha comprado y no ha calificado antes)"""
    
    # Cargar orders.json para verificar la compra
    storage_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    order_file = os.path.join(storage_dir, 'orders.json')
    
    if not os.path.exists(order_file):
        return {"puede_calificar": False, "ha_comprado": False, "ya_califico": False}
    
    try:
        with open(order_file, 'r', encoding='utf-8') as file:
            orders = json.load(file)
    except Exception as e:
        return {"puede_calificar": False, "ha_comprado": False, "ya_califico": False}
    
    # Verificar que el usuario haya comprado en esa tienda y estÃ© entregada
    usuario_orders = orders.get(str(user_id), [])
    
    ha_comprado_entregada = _usuario_compro_en_tienda_entregada(usuario_orders, id_tienda)
    
    # Verificar si ya calificÃ³
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_calificacion FROM calificaciones_tiendas 
            WHERE id_usuario = %s AND id_tienda = %s
        """, (user_id, id_tienda))
        
        ya_califico = cursor.fetchone() is not None
        
        resultado = {
            "puede_calificar": ha_comprado_entregada and not ya_califico,
            "ha_comprado": ha_comprado_entregada,
            "ya_califico": ya_califico
        }
        return resultado
    except Exception as e:
        return {"puede_calificar": False, "ha_comprado": ha_comprado_entregada, "ya_califico": False}
    finally:
        cursor.close()
        db.close() 
