from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.database import get_db
from app.auth import verify_token
from datetime import datetime

router = APIRouter(prefix="/resenas", tags=["Reseñas"])
security = HTTPBearer()

# ============= SCHEMAS =============

class ResenaCreate(BaseModel):
    id_libro: int
    calificacion: int  # 1-5
    comentario: str

class ResenaResponse(BaseModel):
    id_resena: int
    id_usuario: int
    nombre_usuario: str
    id_libro: int
    calificacion: int
    comentario: str
    fecha_resena: str

# ============= HELPERS =============

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))

# ============= ENDPOINTS =============

@router.get("/libro/{id_libro}")
def obtener_resenas_libro(id_libro: int):
    """Obtiene todas las reseñas de un libro"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                r.id_resena,
                r.id_usuario,
                u.nombre_usuario,
                r.id_libro,
                r.calificacion,
                r.comentario,
                r.fecha_resena as fecha_resena
            FROM resenas_libros r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.id_libro = %s
            ORDER BY r.fecha_resena DESC
        """
        cursor.execute(query, (id_libro,))
        resenas = cursor.fetchall()
        
        # Calcular promedio
        cursor.execute("SELECT AVG(calificacion) as promedio FROM resenas_libros WHERE id_libro = %s", (id_libro,))
        promedio_result = cursor.fetchone()
        promedio = round(promedio_result["promedio"], 1) if promedio_result["promedio"] else 0
        
        return {
            "promedio": promedio,
            "total": len(resenas),
            "resenas": resenas
        }
    finally:
        cursor.close()
        db.close()

@router.post("/crear")
def crear_resena(data: ResenaCreate, user_id: int = Depends(get_current_user)):
    """Crea una nueva reseña"""
    
    # Validar calificación
    if data.calificacion < 1 or data.calificacion > 5:
        raise HTTPException(status_code=400, detail="Calificación debe estar entre 1 y 5")
    
    # Validar que el usuario haya comprado el libro
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT COUNT(*) as comprado FROM detalle_orden do
            JOIN ordenes_compra oc ON do.id_orden = oc.id_orden
                        WHERE oc.id_usuario = %s
                            AND do.id_libro = %s
                            AND (
                                        (
                                            LOWER(COALESCE(oc.tipo_entrega, 'domicilio')) = 'retiro_tienda'
                                            AND LOWER(COALESCE(oc.estado_retiro, '')) = 'entregada'
                                        )
                                        OR
                                        (
                                            LOWER(COALESCE(oc.tipo_entrega, 'domicilio')) <> 'retiro_tienda'
                                            AND LOWER(oc.estado_orden) = 'entregada'
                                        )
                                    )
        """, (user_id, data.id_libro))
        
        compra = cursor.fetchone()
        if not compra or compra["comprado"] == 0:
            raise HTTPException(status_code=403, detail="Solo puedes reseñar libros que hayas comprado")
        
        # Verificar si ya hizo reseña
        cursor.execute("""
            SELECT id_resena FROM resenas_libros 
            WHERE id_usuario = %s AND id_libro = %s
        """, (user_id, data.id_libro))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Ya hiciste una reseña de este libro")
        
        # Crear reseña
        cursor.execute("""
            INSERT INTO resenas_libros 
            (id_usuario, id_libro, calificacion, comentario, fecha_resena)
            VALUES (%s, %s, %s, %s, NOW())
        """, (user_id, data.id_libro, data.calificacion, data.comentario))

        cursor.execute("""
            INSERT INTO notificaciones
            (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
            SELECT t.id_usuario, 'resena', 'Nueva resena de libro',
                   CONCAT(u.nombre_usuario, ' dejo una resena de tu libro "', l.titulo,
                          '" con ', %s, ' estrellas'),
                   data_ref.id_resena, FALSE, NOW()
            FROM libros l
            JOIN tiendas t ON t.id_tienda = l.id_tienda
            JOIN usuarios u ON u.id_usuario = %s
            JOIN (SELECT id_resena FROM resenas_libros WHERE id_usuario = %s AND id_libro = %s ORDER BY id_resena DESC LIMIT 1) data_ref
            WHERE l.id_libro = %s
        """, (data.calificacion, user_id, user_id, data.id_libro, data.id_libro))
        
        db.commit()
        
        return {
            "ok": True,
            "mensaje": "Reseña creada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.put("/{id_resena}")
def actualizar_resena(id_resena: int, data: ResenaCreate, user_id: int = Depends(get_current_user)):
    """Actualiza una reseña existente"""
    
    if data.calificacion < 1 or data.calificacion > 5:
        raise HTTPException(status_code=400, detail="Calificación debe estar entre 1 y 5")
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que sea propietario
        cursor.execute("SELECT id_usuario FROM resenas_libros WHERE id_resena = %s", (id_resena,))
        resena = cursor.fetchone()
        
        if not resena:
            raise HTTPException(status_code=404, detail="Reseña no encontrada")
        
        if resena["id_usuario"] != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para editar esta reseña")
        
        # Actualizar
        cursor.execute("""
            UPDATE resenas_libros 
            SET calificacion = %s, comentario = %s, fecha_resena = NOW()
            WHERE id_resena = %s
        """, (data.calificacion, data.comentario, id_resena))

        cursor.execute("""
            INSERT INTO notificaciones
            (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
            SELECT t.id_usuario, 'resena', 'Resena de libro actualizada',
                   CONCAT(u.nombre_usuario, ' actualizo la resena de tu libro "', l.titulo,
                          '" a ', %s, ' estrellas'),
                   r.id_resena, FALSE, NOW()
            FROM resenas_libros r
            JOIN libros l ON l.id_libro = r.id_libro
            JOIN tiendas t ON t.id_tienda = l.id_tienda
            JOIN usuarios u ON u.id_usuario = r.id_usuario
            WHERE r.id_resena = %s
        """, (data.calificacion, id_resena))
        
        db.commit()
        
        return {"ok": True, "mensaje": "Reseña actualizada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.delete("/{id_resena}")
def eliminar_resena(id_resena: int, user_id: int = Depends(get_current_user)):
    """Elimina una reseña"""
    
    db = get_db()
    cursor = db.cursor()
    try:
        # Verificar que sea propietario
        cursor.execute("SELECT id_usuario FROM resenas_libros WHERE id_resena = %s", (id_resena,))
        resena = cursor.fetchone()
        
        if not resena:
            raise HTTPException(status_code=404, detail="Reseña no encontrada")
        
        if resena[0] != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta reseña")
        
        cursor.execute("DELETE FROM resenas_libros WHERE id_resena = %s", (id_resena,))
        db.commit()
        
        return {"ok": True, "mensaje": "Reseña eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
