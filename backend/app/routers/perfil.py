from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.auth import verify_token
import os
from datetime import datetime

router = APIRouter(prefix="/perfil", tags=["Perfil Usuario"])
security = HTTPBearer()

# ============= SCHEMAS =============

class PerfilActualizar(BaseModel):
    nombre_usuario: str = None
    telefono: str = None
    ciudad: str = None
    direccion: str = None
    fecha_nacimiento: str = None  # YYYY-MM-DD

class PreferenciasUsuario(BaseModel):
    notificaciones_promociones: bool = True
    notificaciones_pedidos: bool = True
    notificaciones_novedades: bool = False

class PerfilRespuesta(BaseModel):
    id_usuario: int
    nombre_usuario: str
    correo_usuario: str
    telefono: str
    rol: str
    fecha_registro: str

# ============= HELPERS =============

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))

# ============= ENDPOINTS =============

@router.get("/mi-perfil")
def obtener_perfil(user_id: int = Depends(get_current_user)):
    """Obtiene el perfil del usuario logueado"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                id_usuario,
                nombre_usuario,
                correo_usuario,
                telefono,
                rol,
                DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro,
                foto_perfil,
                preferencias
            FROM usuarios
            WHERE id_usuario = %s
        """
        cursor.execute(query, (user_id,))
        usuario = cursor.fetchone()
        
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Parse preferencias si existen
        if usuario.get('preferencias'):
            import json
            usuario['preferencias'] = json.loads(usuario['preferencias'])
        else:
            usuario['preferencias'] = {
                'notificaciones_promociones': True,
                'notificaciones_pedidos': True,
                'notificaciones_novedades': False
            }
        
        return usuario
    finally:
        cursor.close()
        db.close()

@router.put("/actualizar")
def actualizar_perfil(data: PerfilActualizar, user_id: int = Depends(get_current_user)):
    """Actualiza el perfil del usuario"""
    
    db = get_db()
    cursor = db.cursor()
    try:
        # Construir query dinámico
        campos = []
        valores = []
        
        if data.nombre_usuario:
            campos.append("nombre_usuario = %s")
            valores.append(data.nombre_usuario)
        
        if data.telefono:
            campos.append("telefono = %s")
            valores.append(data.telefono)
        
        if not campos:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")
        
        valores.append(user_id)
        
        query = f"UPDATE usuarios SET {', '.join(campos)} WHERE id_usuario = %s"
        cursor.execute(query, valores)
        db.commit()
        
        return {"ok": True, "mensaje": "Perfil actualizado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.get("/{user_id}")
def obtener_perfil_publico(user_id: int):
    """Obtiene el perfil público de cualquier usuario (sin datos sensibles)"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                id_usuario,
                nombre_usuario,
                fecha_registro,
                (SELECT AVG(calificacion) FROM calificaciones_tiendas WHERE id_usuario = %s) as calificacion_promedio,
                (SELECT COUNT(*) FROM calificaciones_tiendas WHERE id_usuario = %s) as total_calificaciones
            FROM usuarios
            WHERE id_usuario = %s
        """
        cursor.execute(query, (user_id, user_id, user_id))
        usuario = cursor.fetchone()
        
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return usuario
    finally:
        cursor.close()
        db.close()

@router.get("/historial/compras")
def obtener_historial_compras(user_id: int = Depends(get_current_user)):
    """Obtiene el historial de compras del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                oc.id_orden,
                oc.fecha_orden,
                oc.total,
                oc.estado_orden,
                COUNT(do.id_detalle) as cantidad_items,
                GROUP_CONCAT(l.titulo SEPARATOR ', ') as libros
            FROM ordenes_compra oc
            LEFT JOIN detalle_orden do ON oc.id_orden = do.id_orden
            LEFT JOIN libros l ON do.id_libro = l.id_libro
            WHERE oc.id_usuario = %s
            GROUP BY oc.id_orden
            ORDER BY oc.fecha_orden DESC
            LIMIT 20
        """
        cursor.execute(query, (user_id,))
        compras = cursor.fetchall()
        
        return {"total": len(compras), "compras": compras}
    finally:
        cursor.close()
        db.close()

@router.post("/foto-perfil")
async def subir_foto_perfil(file: UploadFile = File(...), user_id: int = Depends(get_current_user)):
    """Sube foto de perfil del usuario"""
    
    try:
        os.makedirs("uploads/perfiles", exist_ok=True)
        
        filename = f"usuario_{user_id}_{datetime.now().timestamp()}.jpg"
        filepath = f"uploads/perfiles/{filename}"
        
        with open(filepath, "wb") as f:
            contents = await file.read()
            f.write(contents)
        
        # Actualizar la URL en la base de datos
        db = get_db()
        cursor = db.cursor()
        try:
            query = "UPDATE usuarios SET foto_perfil = %s WHERE id_usuario = %s"
            cursor.execute(query, (filepath, user_id))
            db.commit()
        finally:
            cursor.close()
            db.close()
        
        return {
            "ok": True,
            "mensaje": "Foto de perfil subida",
            "url": filepath
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/preferencias")
def actualizar_preferencias(data: PreferenciasUsuario, user_id: int = Depends(get_current_user)):
    """Actualiza las preferencias del usuario"""
    import json
    
    db = get_db()
    cursor = db.cursor()
    try:
        preferencias_json = json.dumps({
            'notificaciones_promociones': data.notificaciones_promociones,
            'notificaciones_pedidos': data.notificaciones_pedidos,
            'notificaciones_novedades': data.notificaciones_novedades
        })
        
        query = "UPDATE usuarios SET preferencias = %s WHERE id_usuario = %s"
        cursor.execute(query, (preferencias_json, user_id))
        db.commit()
        
        return {"ok": True, "mensaje": "Preferencias actualizadas correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
