from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from app.database import get_db
from app.auth import verify_token
import os
import json
from datetime import datetime

router = APIRouter(prefix="/perfil", tags=["Perfil Usuario"])
security = HTTPBearer()

class ActualizarEstadoOrden(BaseModel):
    estado: str = Field(..., description="Nuevo estado de la orden (pagado, enviado, entregada, cancelada)")

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
        raise HTTPException(status_code=401, detail="Token invÃ¡lido")
    return int(payload.get("sub"))

# ============= ENDPOINTS =============

@router.get("/direcciones")
def listar_direcciones(user_id: int = Depends(get_current_user)):
    """Obtiene las direcciones de envÃ­o del usuario autenticado"""
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
                departamento,
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
    """Crea una nueva direcciÃ³n de envÃ­o para el usuario"""
    if not data.direccion or not str(data.direccion).strip():
        raise HTTPException(status_code=400, detail="La direcciÃ³n es obligatoria")

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        if data.es_principal:
            cursor.execute("UPDATE direcciones_envio SET es_principal = FALSE WHERE id_usuario = %s", (user_id,))

        detalle = [part for part in [
            str(data.direccion).strip(),
        ] if part]
        direccion_completa = ", ".join(detalle)
        alias = str(data.alias_direccion).strip() if data.alias_direccion else "DirecciÃ³n"

        cursor.execute(
            """
            INSERT INTO direcciones_envio (
                id_usuario, alias_direccion, direccion_completa, ciudad, departamento, codigo_postal, es_principal
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, alias, direccion_completa, data.ciudad.strip() if data.ciudad else None, data.departamento.strip() if data.departamento else None, data.codigo_postal.strip() if data.codigo_postal else None, 1 if data.es_principal else 0),
        )
        db.commit()
        cursor.execute(
            """
            SELECT id_direccion, id_usuario, alias_direccion, direccion_completa AS direccion, ciudad, departamento, codigo_postal, es_principal
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
    """Actualiza una direcciÃ³n de envÃ­o del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_direccion FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, user_id),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="DirecciÃ³n no encontrada")

        if data.es_principal is not None and data.es_principal:
            cursor.execute("UPDATE direcciones_envio SET es_principal = FALSE WHERE id_usuario = %s", (user_id,))

        campos = []
        valores = []

        if data.alias_direccion is not None:
            campos.append("alias_direccion = %s")
            valores.append(data.alias_direccion.strip() if data.alias_direccion else "DirecciÃ³n")

        if data.direccion is not None:
            campos.append("direccion_completa = %s")
            detalle = [part for part in [
                str(data.direccion).strip(),
            ] if part]
            valores.append(", ".join(detalle))

        if data.ciudad is not None:
            campos.append("ciudad = %s")
            valores.append(data.ciudad.strip() if data.ciudad else None)

        if data.departamento is not None:
            campos.append("departamento = %s")
            valores.append(data.departamento.strip() if data.departamento else None)

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
            SELECT id_direccion, id_usuario, alias_direccion, direccion_completa AS direccion, ciudad, departamento, codigo_postal, es_principal
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
    """Elimina una direcciÃ³n de envÃ­o del usuario"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_direccion, es_principal FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, user_id),
        )
        direccion = cursor.fetchone()
        if not direccion:
            raise HTTPException(status_code=404, detail="DirecciÃ³n no encontrada")

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
        return {"ok": True, "mensaje": "DirecciÃ³n eliminada correctamente"}
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
                banner_perfil,
                banner_color,
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
        # Construir query dinÃ¡mico
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
    """Obtiene el perfil pÃºblico de cualquier usuario (sin datos sensibles)"""
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

        # Para cada compra, buscar items digitales comprados
        for compra in compras:
            cursor.execute("""
                SELECT do.id_variante, l.titulo, lv.archivo_digital_url
                FROM detalle_orden do
                JOIN libros l ON do.id_libro = l.id_libro
                LEFT JOIN libro_variantes lv ON do.id_variante = lv.id_variante
                WHERE do.id_orden = %s AND lv.tipo_tapa = 'Digital' AND lv.archivo_digital_url IS NOT NULL
            """, (compra['id_orden'],))
            compra['items_digitales'] = cursor.fetchall()
        
        return {"total": len(compras), "compras": compras}
    finally:
        cursor.close()
        db.close()


@router.post("/banner")
async def subir_banner_perfil(file: UploadFile = File(...), user_id: int = Depends(get_current_user)):
    """Sube imagen de banner de perfil del usuario"""
    try:
        os.makedirs("uploads/banners", exist_ok=True)
        filename = f"banner_{user_id}_{datetime.now().timestamp()}.jpg"
        filepath = f"uploads/banners/{filename}"
        with open(filepath, "wb") as f:
            contents = await file.read()
            f.write(contents)
        db = get_db()
        cursor = db.cursor()
        try:
            cursor.execute("UPDATE usuarios SET banner_perfil = %s, banner_color = NULL WHERE id_usuario = %s", (filepath, user_id))
            db.commit()
        finally:
            cursor.close()
            db.close()
        return {"ok": True, "mensaje": "Banner subido", "url": filepath, "tipo": "imagen"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BannerColorData(BaseModel):
    banner_color: str  # color CSS: hex, gradiente, etc.

@router.patch("/banner-color")
def guardar_banner_color(data: BannerColorData, user_id: int = Depends(get_current_user)):
    """Guarda un color o gradiente CSS como banner, elimina imagen si había"""
    try:
        db = get_db()
        cursor = db.cursor()
        try:
            cursor.execute("UPDATE usuarios SET banner_color = %s, banner_perfil = NULL WHERE id_usuario = %s", (data.banner_color, user_id))
            db.commit()
        finally:
            cursor.close()
            db.close()
        return {"ok": True, "mensaje": "Color de banner guardado", "banner_color": data.banner_color}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    """Endpoint de estadÃ­sticas de usuario"""
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        # Obtener estadÃ­sticas de compras
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
        
        # Calcular nivel de fidelizaciÃ³n
        if total_gastado >= 300000:
            nivel_fidelizacion = 'Platino'
        elif total_gastado >= 150000:
            nivel_fidelizacion = 'Oro'
        elif total_gastado >= 50000:
            nivel_fidelizacion = 'Plata'
        else:
            nivel_fidelizacion = 'Bronce'
        
        # Obtener categorÃ­as favoritas
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
        db.close()

@router.put("/ordenes/{id_orden}/estado")
def actualizar_estado_orden(id_orden: int, data: ActualizarEstadoOrden, user_id: int = Depends(get_current_user)):
    """Actualiza el estado de una orden en MySQL (solo vendedores, solo sus propias Ã³rdenes)"""

    # La recepción solo puede ser confirmada por el comprador desde su panel.
    estados_validos = ["pagado", "enviado", "cancelada"]
    if data.estado.lower() not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado no vÃ¡lido. Estados vÃ¡lidos: {', '.join(estados_validos)}"
        )

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # 1. Verificar que el usuario tiene tienda
        cursor.execute("SELECT id_tienda FROM tiendas WHERE id_usuario = %s", (user_id,))
        tienda = cursor.fetchone()
        if not tienda:
            raise HTTPException(status_code=403, detail="Solo vendedores pueden actualizar estados de Ã³rdenes")

        # 2. Verificar que la orden existe y contiene al menos un libro de esta tienda
        cursor.execute("""
            SELECT COUNT(*) AS coincidencias
            FROM detalle_orden do
            JOIN libros l ON l.id_libro = do.id_libro
            WHERE do.id_orden = %s AND l.id_tienda = %s
        """, (id_orden, tienda['id_tienda']))
        row = cursor.fetchone()
        if not row or row['coincidencias'] == 0:
            raise HTTPException(
                status_code=403,
                detail="Esta orden no contiene libros de tu tienda"
            )

        # 3. Actualizar el estado en MySQL
        cursor.execute(
            "UPDATE ordenes_compra SET estado_orden = %s WHERE id_orden = %s",
            (data.estado.lower(), id_orden)
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        # 4. Obtener informaciÃ³n de la orden y comprador para crear notificaciÃ³n
        cursor.execute("""
            SELECT oc.id_usuario, oc.total, t.nombre_tienda
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            JOIN libros l ON l.id_libro = do.id_libro
            JOIN tiendas t ON t.id_tienda = l.id_tienda
            WHERE oc.id_orden = %s AND t.id_tienda = %s
            LIMIT 1
        """, (id_orden, tienda['id_tienda']))
        
        orden_info = cursor.fetchone()
        
        if orden_info:
            # 5. Crear notificaciÃ³n para el comprador
            estado_msg = {
                'pagado': 'ha sido pagado y estÃ¡ siendo preparado',
                'enviado': 'ha sido enviado y estÃ¡ en camino',
                'cancelada': 'ha sido cancelado'
            }
            
            cursor.execute("""
                INSERT INTO notificaciones 
                (id_usuario, tipo, titulo, cuerpo, id_referencia, fecha_creacion)
                VALUES (%s, 'pedido', %s, %s, %s, NOW())
            """, (
                orden_info['id_usuario'],
                f'Estado de pedido actualizado',
                f'Tu pedido #{id_orden} de la tienda "{orden_info["nombre_tienda"]}" {estado_msg.get(data.estado.lower(), "ha sido actualizado")}',
                id_orden
            ))
        
        db.commit()

    finally:
        cursor.close()
        db.close()

    # 4. Sincronizar tambiÃ©n en orders.json para mantener consistencia con el flujo del comprador
    try:
        import json, os
        storage_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        order_file = os.path.join(storage_dir, 'orders.json')
        if os.path.exists(order_file):
            with open(order_file, 'r', encoding='utf-8') as f:
                orders = json.load(f)
            for user_orders in orders.values():
                for order in user_orders:
                    if order.get('id_orden') == id_orden:
                        order['estado'] = data.estado.lower()
            with open(order_file, 'w', encoding='utf-8') as f:
                json.dump(orders, f, indent=2, ensure_ascii=False)
    except Exception:
        pass  # No es crÃ­tico â€” MySQL es la fuente de verdad

    return {"success": True, "mensaje": f"Estado actualizado a {data.estado.lower()}"}


@router.post("/ordenes/{id_orden}/confirmar-entrega")
def confirmar_entrega(id_orden: int, user_id: int = Depends(get_current_user)):
    """El comprador confirma la recepción de una orden que ya está en camino."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_orden, fecha_orden, estado_orden FROM ordenes_compra WHERE id_orden = %s AND id_usuario = %s",
            (id_orden, user_id),
        )
        orden = cursor.fetchone()
        if orden and str(orden["estado_orden"]).lower() != "enviado":
            raise HTTPException(status_code=409, detail="Solo puedes confirmar pedidos que estén en camino")
        if orden:
            cursor.execute("UPDATE ordenes_compra SET estado_orden = 'entregada' WHERE id_orden = %s", (id_orden,))
            cursor.execute("UPDATE envios SET estado_envio = 'Entregado' WHERE id_orden = %s", (id_orden,))
            db.commit()
    finally:
        cursor.close()
        db.close()

    fecha_confirmacion = datetime.utcnow().isoformat() + "Z"
    # Mantener el historial mostrado al comprador sincronizado con MySQL.
    try:
        storage_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        order_file = os.path.join(storage_dir, 'orders.json')
        if os.path.exists(order_file):
            with open(order_file, 'r', encoding='utf-8') as file:
                orders = json.load(file)
            orden_local_encontrada = False
            for order in orders.get(str(user_id), []):
                if order.get('id_orden_db') == id_orden or (order.get('id_orden_db') is None and order.get('id_orden') == id_orden):
                    if str(order.get('estado', '')).lower() != 'enviado':
                        raise HTTPException(status_code=409, detail="Solo puedes confirmar pedidos que estén en camino")
                    order['estado'] = 'entregada'
                    order['fecha_entrega_confirmada'] = fecha_confirmacion
                    if order.get('envio'):
                        order['envio']['estado_envio'] = 'Entregado'
                    orden_local_encontrada = True
            if not orden and not orden_local_encontrada:
                raise HTTPException(status_code=404, detail="Orden no encontrada")
            with open(order_file, 'w', encoding='utf-8') as file:
                json.dump(orders, file, indent=2, ensure_ascii=False)
    except HTTPException:
        raise
    except Exception:
        pass

    return {"success": True, "fecha_confirmacion": fecha_confirmacion}

# ============= ENDPOINTS DE CALIFICACIONES DE TIENDAS =============

class CalificacionTiendaCreate(BaseModel):
    id_tienda: int
    calificacion: int  # 1-5
    comentario: str

@router.get("/calificaciones/tienda/{id_tienda}")
def obtener_calificaciones_tienda(id_tienda: int):
    """Obtiene todas las calificaciones de una tienda con mÃ©tricas agregadas"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Obtener calificaciones individuales
        query = """
            SELECT 
                ct.id_calificacion,
                ct.id_usuario,
                u.nombre_usuario,
                ct.id_tienda,
                t.nombre_tienda,
                ct.calificacion,
                ct.comentario,
                ct.fecha_calificacion
            FROM calificaciones_tiendas ct
            JOIN usuarios u ON ct.id_usuario = u.id_usuario
            JOIN tiendas t ON ct.id_tienda = t.id_tienda
            WHERE ct.id_tienda = %s
            ORDER BY ct.fecha_calificacion DESC
        """
        cursor.execute(query, (id_tienda,))
        calificaciones = cursor.fetchall()
        
        # Calcular mÃ©tricas directamente
        cursor.execute("""
            SELECT 
                ROUND(AVG(ct.calificacion), 2) AS calificacion_media,
                COUNT(ct.id_calificacion) AS total_opiniones,
                SUM(CASE WHEN ct.calificacion = 5 THEN 1 ELSE 0 END) AS total_5_estrellas
            FROM calificaciones_tiendas ct
            WHERE ct.id_tienda = %s
        """, (id_tienda,))
        metricas = cursor.fetchone()
        
        # Calcular distribuciÃ³n de estrellas
        distribucion = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for cal in calificaciones:
            estrellas = cal["calificacion"]
            if estrellas in distribucion:
                distribucion[estrellas] += 1
        
        return {
            "promedio": round(metricas["calificacion_media"], 1) if metricas and metricas["calificacion_media"] else 0,
            "total": metricas["total_opiniones"] if metricas else 0,
            "total_5_estrellas": metricas["total_5_estrellas"] if metricas else 0,
            "distribucion": distribucion,
            "calificaciones": calificaciones
        }
    finally:
        cursor.close()
        db.close()

@router.post("/calificaciones/tienda")
def crear_calificacion_tienda(data: CalificacionTiendaCreate, user_id: int = Depends(get_current_user)):
    """Crea una nueva calificaciÃ³n de tienda (valida compra entregada desde MySQL)"""
    
    # Validar calificaciÃ³n
    if data.calificacion < 1 or data.calificacion > 5:
        raise HTTPException(status_code=400, detail="CalificaciÃ³n debe estar entre 1 y 5")
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # 1. Verificar que el usuario haya comprado en esa tienda con estado entregada
        cursor.execute("""
            SELECT COUNT(DISTINCT oc.id_orden) as compras_entregadas
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            JOIN libros l ON l.id_libro = do.id_libro
            WHERE oc.id_usuario = %s 
              AND l.id_tienda = %s
              AND LOWER(oc.estado_orden) = 'entregada'
        """, (user_id, data.id_tienda))
        
        result = cursor.fetchone()
        ha_comprado_entregada = result and result['compras_entregadas'] > 0
        
        if not ha_comprado_entregada:
            raise HTTPException(
                status_code=403, 
                detail="Solo puedes calificar tiendas donde hayas realizado compras entregadas"
            )
        
        # 2. Verificar si ya hizo calificaciÃ³n a esta tienda
        cursor.execute("""
            SELECT id_calificacion FROM calificaciones_tiendas 
            WHERE id_usuario = %s AND id_tienda = %s
        """, (user_id, data.id_tienda))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Ya hiciste una calificaciÃ³n de esta tienda")
        
        # 3. Crear calificaciÃ³n
        cursor.execute("""
            INSERT INTO calificaciones_tiendas 
            (id_usuario, id_tienda, calificacion, comentario, fecha_calificacion)
            VALUES (%s, %s, %s, %s, NOW())
        """, (user_id, data.id_tienda, data.calificacion, data.comentario))
        
        # 4. Obtener informaciÃ³n del usuario y la tienda para la notificaciÃ³n
        cursor.execute("""
            SELECT u.nombre_usuario, t.nombre_tienda, t.id_usuario as id_vendedor
            FROM usuarios u, tiendas t
            WHERE u.id_usuario = %s AND t.id_tienda = %s
        """, (user_id, data.id_tienda))
        
        info = cursor.fetchone()
        
        if info:
            # 5. Crear notificaciÃ³n para el vendedor
            cursor.execute("""
                INSERT INTO notificaciones 
                (id_usuario, tipo, titulo, cuerpo, id_referencia, fecha_creacion)
                VALUES (%s, 'resena', %s, %s, %s, NOW())
            """, (
                info['id_vendedor'],
                'Nueva calificaciÃ³n recibida',
                f'{info["nombre_usuario"]} calificÃ³ tu tienda "{info["nombre_tienda"]}" con {data.calificacion} estrellas',
                data.id_tienda
            ))
        
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

@router.get("/calificaciones/tienda/{id_tienda}/usuario-puede-calificar")
def usuario_puede_calificar_tienda(id_tienda: int, user_id: int = Depends(get_current_user)):
    """Verifica si el usuario puede calificar una tienda (ha comprado entregada y no ha calificado antes)"""
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # 1. Verificar si ya calificÃ³
        cursor.execute("""
            SELECT id_calificacion FROM calificaciones_tiendas 
            WHERE id_usuario = %s AND id_tienda = %s
        """, (user_id, id_tienda))
        ya_califico = cursor.fetchone() is not None

        # 2. Verificar que haya comprado en esta tienda con estado entregada
        cursor.execute("""
            SELECT COUNT(DISTINCT oc.id_orden) as compras_entregadas
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            JOIN libros l ON l.id_libro = do.id_libro
            WHERE oc.id_usuario = %s 
              AND l.id_tienda = %s
              AND LOWER(oc.estado_orden) = 'entregada'
        """, (user_id, id_tienda))
        
        result = cursor.fetchone()
        ha_comprado_entregada = result and result['compras_entregadas'] > 0

        return {
            "puede_calificar": ha_comprado_entregada and not ya_califico,
            "ha_comprado": ha_comprado_entregada,
            "ya_califico": ya_califico
        }
    finally:
        cursor.close()
        db.close()

@router.put("/calificaciones/tienda/{id_calificacion}")
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
        
        # Obtener informaciÃ³n para la notificaciÃ³n
        cursor.execute("""
            SELECT u.nombre_usuario, t.nombre_tienda, t.id_usuario as id_vendedor, ct.id_tienda
            FROM calificaciones_tiendas ct
            JOIN usuarios u ON u.id_usuario = ct.id_usuario
            JOIN tiendas t ON t.id_tienda = ct.id_tienda
            WHERE ct.id_calificacion = %s
        """, (id_calificacion,))
        
        info = cursor.fetchone()
        
        if info:
            # Crear notificaciÃ³n para el vendedor sobre la actualizaciÃ³n
            cursor.execute("""
                INSERT INTO notificaciones 
                (id_usuario, tipo, titulo, cuerpo, id_referencia, fecha_creacion)
                VALUES (%s, 'resena', %s, %s, %s, NOW())
            """, (
                info['id_vendedor'],
                'CalificaciÃ³n actualizada',
                f'{info["nombre_usuario"]} actualizÃ³ su calificaciÃ³n de tu tienda "{info["nombre_tienda"]}" a {data.calificacion} estrellas',
                info['id_tienda']
            ))
        
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


@router.get("/calificaciones-tienda/{id_tienda}")
def obtener_calificaciones_tienda_vendedor(id_tienda: int, user_id: int = Depends(get_current_user)):
    """Obtiene todas las calificaciones de una tienda (solo el propietario puede verlas)"""
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que el usuario es propietario de la tienda
        cursor.execute("SELECT id_usuario FROM tiendas WHERE id_tienda = %s", (id_tienda,))
        tienda = cursor.fetchone()
        
        if not tienda:
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
        if tienda["id_usuario"] != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver estas calificaciones")
        
        # Obtener calificaciones individuales
        cursor.execute("""
            SELECT 
                ct.id_calificacion,
                ct.id_usuario,
                u.nombre_usuario,
                ct.id_tienda,
                ct.calificacion,
                ct.comentario,
                ct.fecha_calificacion
            FROM calificaciones_tiendas ct
            JOIN usuarios u ON ct.id_usuario = u.id_usuario
            WHERE ct.id_tienda = %s
            ORDER BY ct.fecha_calificacion DESC
        """, (id_tienda,))
        calificaciones = cursor.fetchall()
        
        # Calcular mÃ©tricas
        cursor.execute("""
            SELECT 
                ROUND(AVG(ct.calificacion), 2) AS promedio,
                COUNT(ct.id_calificacion) AS total,
                SUM(CASE WHEN ct.calificacion = 5 THEN 1 ELSE 0 END) AS total_5_estrellas,
                SUM(CASE WHEN ct.calificacion = 4 THEN 1 ELSE 0 END) AS total_4_estrellas,
                SUM(CASE WHEN ct.calificacion = 3 THEN 1 ELSE 0 END) AS total_3_estrellas,
                SUM(CASE WHEN ct.calificacion = 2 THEN 1 ELSE 0 END) AS total_2_estrellas,
                SUM(CASE WHEN ct.calificacion = 1 THEN 1 ELSE 0 END) AS total_1_estrellas
            FROM calificaciones_tiendas ct
            WHERE ct.id_tienda = %s
        """, (id_tienda,))
        metricas = cursor.fetchone()
        
        # Formato de respuesta
        distribucion = {
            5: metricas["total_5_estrellas"] if metricas else 0,
            4: metricas["total_4_estrellas"] if metricas else 0,
            3: metricas["total_3_estrellas"] if metricas else 0,
            2: metricas["total_2_estrellas"] if metricas else 0,
            1: metricas["total_1_estrellas"] if metricas else 0,
        }
        
        return {
            "promedio": round(metricas["promedio"], 1) if metricas and metricas["promedio"] else 0,
            "total": metricas["total"] if metricas else 0,
            "distribucion": distribucion,
            "calificaciones": calificaciones,
            "recientes": calificaciones[:5] if calificaciones else []
        }
    finally:
        cursor.close()
        db.close()
