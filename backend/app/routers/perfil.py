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

class DireccionBase(BaseModel):
    alias_direccion: str = None
    direccion: str = None
    ciudad: str = None
    codigo_postal: str = None
    departamento: str = None
    es_principal: bool = None

class DireccionCrear(DireccionBase):
    direccion: str
    es_principal: bool = False

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

class EstadisticasRespuesta(BaseModel):
    nivel_fidelizacion: str
    total_gastado: float
    num_compras: int
    ticket_promedio: float
    categorias_favoritas: list

# ============= HELPERS =============

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))

# ============= ENDPOINTS =============

@router.get("/direcciones")
def listar_direcciones(user_id: int = Depends(get_current_user)):
    """Obtiene las direcciones de envío del usuario autenticado"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT
                id_direccion,
                id_usuario,
                alias_direccion,
                direccion_completa AS direccion,
                ciudad,
                codigo_postal,
                es_principal
            FROM direcciones_envio
            WHERE id_usuario = %s
            ORDER BY es_principal DESC, id_direccion DESC
        """
        cursor.execute(query, (user_id,))
        direcciones = cursor.fetchall() or []
        return direcciones
    finally:
        cursor.close()
        db.close()

@router.post("/direcciones")
def crear_direccion(data: DireccionCrear, user_id: int = Depends(get_current_user)):
    """Crea una nueva dirección de envío para el usuario"""
    if not data.direccion or not str(data.direccion).strip():
        raise HTTPException(status_code=400, detail="La dirección es obligatoria")

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        if data.es_principal:
            cursor.execute("UPDATE direcciones_envio SET es_principal = FALSE WHERE id_usuario = %s", (user_id,))

        detalle = [part for part in [
            str(data.direccion).strip(),
        ] if part]
        direccion_completa = ", ".join(detalle)
        alias = str(data.alias_direccion).strip() if data.alias_direccion else "Dirección"

        cursor.execute(
            """
            INSERT INTO direcciones_envio (
                id_usuario, alias_direccion, direccion_completa, ciudad, codigo_postal, es_principal
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (user_id, alias, direccion_completa, data.ciudad.strip() if data.ciudad else None, data.codigo_postal.strip() if data.codigo_postal else None, 1 if data.es_principal else 0),
        )
        db.commit()
        cursor.execute(
            """
            SELECT id_direccion, id_usuario, alias_direccion, direccion_completa AS direccion, ciudad, codigo_postal, es_principal
            FROM direcciones_envio
            WHERE id_direccion = LAST_INSERT_ID()
            """
        )
        return cursor.fetchone()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        cursor.close()
        db.close()

@router.put("/direcciones/{id_direccion}")
def actualizar_direccion(id_direccion: int, data: DireccionBase, user_id: int = Depends(get_current_user)):
    """Actualiza una dirección de envío del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_direccion FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, user_id),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Dirección no encontrada")

        if data.es_principal is not None and data.es_principal:
            cursor.execute("UPDATE direcciones_envio SET es_principal = FALSE WHERE id_usuario = %s", (user_id,))

        campos = []
        valores = []

        if data.alias_direccion is not None:
            campos.append("alias_direccion = %s")
            valores.append(data.alias_direccion.strip() if data.alias_direccion else "Dirección")

        if data.direccion is not None:
            campos.append("direccion_completa = %s")
            detalle = [part for part in [
                str(data.direccion).strip(),
            ] if part]
            valores.append(", ".join(detalle))

        if data.ciudad is not None:
            campos.append("ciudad = %s")
            valores.append(data.ciudad.strip() if data.ciudad else None)

        if data.codigo_postal is not None:
            campos.append("codigo_postal = %s")
            valores.append(data.codigo_postal.strip() if data.codigo_postal else None)

        if data.es_principal is not None:
            campos.append("es_principal = %s")
            valores.append(1 if data.es_principal else 0)

        if not campos:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        valores.append(id_direccion)
        valores.append(user_id)
        query = f"UPDATE direcciones_envio SET {', '.join(campos)} WHERE id_direccion = %s AND id_usuario = %s"
        cursor.execute(query, valores)
        db.commit()

        cursor.execute(
            """
            SELECT id_direccion, id_usuario, alias_direccion, direccion_completa AS direccion, ciudad, codigo_postal, es_principal
            FROM direcciones_envio
            WHERE id_direccion = %s AND id_usuario = %s
            """,
            (id_direccion, user_id),
        )
        return cursor.fetchone()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        cursor.close()
        db.close()

@router.delete("/direcciones/{id_direccion}")
def eliminar_direccion(id_direccion: int, user_id: int = Depends(get_current_user)):
    """Elimina una dirección de envío del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_direccion, es_principal FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, user_id),
        )
        direccion = cursor.fetchone()
        if not direccion:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")

        cursor.execute("DELETE FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s", (id_direccion, user_id))
        if direccion.get("es_principal"):
            cursor.execute(
                """
                SELECT id_direccion FROM direcciones_envio
                WHERE id_usuario = %s
                ORDER BY id_direccion ASC
                LIMIT 1
                """,
                (user_id,),
            )
            siguiente = cursor.fetchone()
            if siguiente:
                cursor.execute(
                    "UPDATE direcciones_envio SET es_principal = TRUE WHERE id_direccion = %s AND id_usuario = %s",
                    (siguiente["id_direccion"], user_id),
                )
        db.commit()
        return {"ok": True, "mensaje": "Dirección eliminada correctamente"}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        cursor.close()
        db.close()

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
                fecha_registro as fecha_registro,
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
            GROUP BY oc.id_orden, oc.fecha_orden, oc.total, oc.estado_orden
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

@router.get("/estadisticas/usuario")
def obtener_estadisticas_reales(user_id: int = Depends(get_current_user)):
    """Endpoint de estadísticas de usuario"""
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        # Obtener estadísticas de compras
        query_compras = """
            SELECT 
                COUNT(o.id_orden) AS num_compras,
                IFNULL(SUM(o.total), 0) AS total_gastado,
                IFNULL(AVG(o.total), 0) AS ticket_promedio
            FROM ordenes_compra o
            WHERE o.id_usuario = %s 
            AND LOWER(o.estado_orden) != 'cancelada'
        """
        cursor.execute(query_compras, (user_id,))
        estadisticas = cursor.fetchone()
        
        # Valores por defecto
        num_compras = estadisticas['num_compras'] if estadisticas else 0
        total_gastado = float(estadisticas['total_gastado']) if estadisticas and estadisticas['total_gastado'] else 0
        ticket_promedio = float(estadisticas['ticket_promedio']) if estadisticas and estadisticas['ticket_promedio'] else 0
        
        # Calcular nivel de fidelización
        if total_gastado >= 300000:
            nivel_fidelizacion = 'Platino'
        elif total_gastado >= 150000:
            nivel_fidelizacion = 'Oro'
        elif total_gastado >= 50000:
            nivel_fidelizacion = 'Plata'
        else:
            nivel_fidelizacion = 'Bronce'
        
        # Obtener categorías favoritas
        query_categorias = """
            SELECT 
                c.nombre_categoria AS nombre,
                COUNT(do.id_detalle) AS conteo
            FROM detalle_orden do
            INNER JOIN libros l ON do.id_libro = l.id_libro
            INNER JOIN categorias c ON l.id_categoria = c.id_categoria
            INNER JOIN ordenes_compra o ON do.id_orden = o.id_orden
            WHERE o.id_usuario = %s 
            AND LOWER(o.estado_orden) != 'cancelada'
            GROUP BY c.id_categoria, c.nombre_categoria
            ORDER BY conteo DESC
            LIMIT 5
        """
        cursor.execute(query_categorias, (user_id,))
        categorias_favoritas = cursor.fetchall() or []
        
        resultado = {
            "nivel_fidelizacion": nivel_fidelizacion,
            "total_gastado": total_gastado,
            "num_compras": num_compras,
            "ticket_promedio": ticket_promedio,
            "categorias_favoritas": categorias_favoritas
        }
        
        cursor.close()
        db.close()
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
