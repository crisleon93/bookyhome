import os

import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from pydantic import BaseModel, Field



from app.auth import verify_token

from app.database import get_db



router = APIRouter(prefix="/quejas", tags=["Quejas y reclamos"])

security = HTTPBearer()

UPLOAD_DIR = "uploads/quejas"

os.makedirs(UPLOAD_DIR, exist_ok=True)





def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):

    payload = verify_token(credentials.credentials)

    if not payload:

        raise HTTPException(status_code=401, detail="Token inválido")

    return payload





def _order_store(cursor, id_orden, id_usuario):
    from app.models.payments import obtener_ordenes_usuario, obtener_orden
    try:
        ordenes = obtener_ordenes_usuario(id_usuario) or []
    except Exception:
        ordenes = []

    orden = next((o for o in ordenes if str(o.get("id_orden")) == str(id_orden) or str(o.get("id_orden_db")) == str(id_orden)), None)
    if not orden:
        try:
            orden = obtener_orden(id_usuario, id_orden)
        except Exception:
            orden = None

    if not orden:
        try:
            cursor.execute("SELECT id_orden, estado_orden FROM ordenes_compra WHERE id_orden=%s AND id_usuario=%s", (id_orden, id_usuario))
            db_ord = cursor.fetchone()
            if db_ord:
                orden = {"id_orden": db_ord["id_orden"], "estado": db_ord["estado_orden"]}
        except Exception:
            pass

    if not orden:
        return None

    id_tienda = None
    libros = [item.get("id_libro") for item in (orden.get("items", []) if orden else []) if item.get("id_libro")]
    if libros:
        try:
            placeholders = ", ".join(["%s"] * len(libros))
            cursor.execute(f"SELECT id_tienda FROM libros WHERE id_libro IN ({placeholders}) LIMIT 1", tuple(libros))
            tienda = cursor.fetchone()
            if tienda:
                id_tienda = tienda["id_tienda"]
        except Exception:
            pass

    if not id_tienda:
        try:
            cursor.execute("SELECT id_tienda FROM envios WHERE id_orden=%s LIMIT 1", (id_orden,))
            env = cursor.fetchone()
            if env:
                id_tienda = env["id_tienda"]
        except Exception:
            pass

    if not id_tienda:
        try:
            cursor.execute("""
                SELECT l.id_tienda FROM detalle_orden do
                JOIN libros l ON l.id_libro = do.id_libro
                WHERE do.id_orden = %s LIMIT 1
            """, (id_orden,))
            det = cursor.fetchone()
            if det:
                id_tienda = det["id_tienda"]
        except Exception:
            pass

    # Validar que id_tienda exista en tabla tiendas para no violar Foreign Key
    if id_tienda:
        try:
            cursor.execute("SELECT id_tienda FROM tiendas WHERE id_tienda=%s", (id_tienda,))
            if not cursor.fetchone():
                id_tienda = None
        except Exception:
            id_tienda = None

    return {"id_tienda": id_tienda}


@router.get("")
def mis_quejas(user=Depends(current_user)):
    db = get_db(); cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT ss.id_solicitud, ss.id_orden, ss.asunto, ss.descripcion, ss.categoria,
                   ss.estado, ss.respuesta, ss.evidencia_url, ss.fecha_creacion, ss.fecha_resolucion,
                   t.nombre_tienda,
                   ROW_NUMBER() OVER (ORDER BY ss.id_solicitud ASC) AS numero
            FROM solicitudes_soporte ss
            LEFT JOIN tiendas t ON t.id_tienda = ss.id_tienda
            WHERE ss.id_usuario = %s AND ss.tipo_solicitud = 'reclamo'
            ORDER BY ss.fecha_creacion DESC
        """, (int(user["sub"]),))
        rows = cursor.fetchall()
        from app.models.payments import obtener_orden
        uid = int(user["sub"])
        for row in rows:
            try:
                orden = obtener_orden(uid, row["id_orden"])
                if orden and orden.get("items"):
                    item0 = orden["items"][0]
                    row["imagen_libro"] = item0.get("imagen_url") or item0.get("imagen")
                    row["titulo_libro"] = item0.get("titulo") or item0.get("nombre_libro")
                    row["total_items"] = len(orden["items"])
                else:
                    row["imagen_libro"] = None
                    row["titulo_libro"] = None
                    row["total_items"] = 0
            except Exception:
                row["imagen_libro"] = None
                row["titulo_libro"] = None
                row["total_items"] = 0
        return rows
    finally:
        cursor.close(); db.close()


@router.post("")
async def crear_queja(
    id_orden: int = Form(...), motivo: str = Form(...), descripcion: str = Form(...),
    evidencia: UploadFile | None = File(None), user=Depends(current_user)
):
    if not motivo.strip() or not descripcion.strip():
        raise HTTPException(status_code=400, detail="El motivo y la descripción son obligatorios")

    if evidencia and evidencia.filename and evidencia.content_type not in {"image/jpeg", "image/png", "image/webp", "image/jpg"}:
        raise HTTPException(status_code=400, detail="La evidencia debe ser JPG, PNG o WEBP")

    db = get_db(); cursor = db.cursor(dictionary=True)
    try:
        orden = _order_store(cursor, id_orden, int(user["sub"]))
        if not orden:
            raise HTTPException(status_code=404, detail="La orden no pertenece a tu cuenta o aún no está pagada")

        cursor.execute("""
            SELECT id_solicitud FROM solicitudes_soporte
            WHERE id_usuario=%s AND id_orden=%s AND tipo_solicitud='reclamo'
              AND estado IN ('Abierto', 'En revisión')
            LIMIT 1
        """, (int(user["sub"]), id_orden))

        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Ya tienes un reclamo activo para esta compra")

        evidencia_url = None
        if evidencia and evidencia.filename:
            extension = os.path.splitext(evidencia.filename or "")[1].lower() or ".jpg"
            filename = f"{uuid.uuid4().hex}{extension}"
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            with open(os.path.join(UPLOAD_DIR, filename), "wb") as target:
                target.write(await evidencia.read())
            evidencia_url = f"/uploads/quejas/{filename}"

        # Fallback seguro para id_tienda si la base de datos requiere una tienda válida
        id_tienda_final = orden.get("id_tienda")
        if not id_tienda_final:
            try:
                cursor.execute("SELECT id_tienda FROM tiendas LIMIT 1")
                t_row = cursor.fetchone()
                if t_row:
                    id_tienda_final = t_row["id_tienda"]
            except Exception:
                id_tienda_final = None

        cursor.execute("""
            INSERT INTO solicitudes_soporte
              (id_tienda, id_usuario, id_orden, asunto, descripcion, categoria, prioridad, estado, evidencia_url, tipo_solicitud, fecha_creacion)
            VALUES (%s, %s, %s, %s, %s, 'reclamo', 'Normal', 'Abierto', %s, 'reclamo', NOW())
        """, (id_tienda_final, int(user["sub"]), id_orden, motivo.strip()[:150], descripcion.strip()[:2000], evidencia_url))

        id_solicitud = cursor.lastrowid

        # Notificar al vendedor (si existe), al comprador y a administradores
        try:
            # Al comprador
            cursor.execute("""
                INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                VALUES (%s, 'sistema', 'Reclamo registrado', %s, %s, FALSE, NOW())
            """, (int(user["sub"]), f"Tu solicitud de reclamo para la orden #{id_orden} ha sido registrada con éxito.", id_solicitud))

            id_vendedor = None
            if id_tienda_final:
                cursor.execute("SELECT id_usuario FROM tiendas WHERE id_tienda=%s", (id_tienda_final,))
                row = cursor.fetchone()
                if row:
                    id_vendedor = row.get("id_usuario")

            mensaje_vendedor = f"Nuevo reclamo recibido (#{id_solicitud}) para la orden #{id_orden}"
            if id_vendedor:
                cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion) VALUES (%s, 'sistema', 'Nuevo reclamo recibido', %s, %s, FALSE, NOW())", (id_vendedor, mensaje_vendedor, id_solicitud))

            cursor.execute("SELECT id_usuario FROM usuarios WHERE rol IN ('admin','administrador')")
            admins = cursor.fetchall() or []
            mensaje_admin = f"Nueva solicitud de reclamo #{id_solicitud} creada por el usuario {user.get('sub')}"
            for a in admins:
                try:
                    cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion) VALUES (%s, 'sistema', 'Nueva solicitud de reclamo', %s, %s, FALSE, NOW())", (a.get('id_usuario'), mensaje_admin, id_solicitud))
                except Exception:
                    pass
        except Exception as err:
            print(f"Error generando notificaciones de queja: {err}")

        db.commit()
        return {"ok": True, "id_solicitud": id_solicitud}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creando queja: {e}")
        raise HTTPException(status_code=500, detail=f"Error al registrar reclamo: {str(e)}")
    finally:
        cursor.close(); db.close()



@router.delete("/{id_solicitud}")
def cancelar_queja(id_solicitud: int, user=Depends(current_user)):
    db = get_db(); cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_solicitud, estado FROM solicitudes_soporte WHERE id_solicitud=%s AND id_usuario=%s AND tipo_solicitud='reclamo'",
            (id_solicitud, int(user["sub"]))
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Reclamo no encontrado")
        if row["estado"] not in ("Abierto",):
            raise HTTPException(status_code=400, detail="Solo puedes cancelar reclamos en estado Abierto")
        cursor.execute(
            "UPDATE solicitudes_soporte SET estado='Cerrado', respuesta='Cancelado por el usuario' WHERE id_solicitud=%s",
            (id_solicitud,)
        )
        db.commit()
        return {"ok": True}
    finally:
        cursor.close(); db.close()





class Resolucion(BaseModel):

    estado: str = Field(pattern="^(Resuelto|Rechazado|En revisión)$")

    respuesta: str = Field(min_length=3, max_length=2000)





class SoporteCrear(BaseModel):

    asunto: str = Field(min_length=3, max_length=150)

    descripcion: str = Field(min_length=5, max_length=2000)

    categoria: str = Field(default="tecnico", max_length=50)





class MensajeReclamo(BaseModel):

    mensaje: str = Field(min_length=1, max_length=2000)





def _acceso_reclamo(cursor, id_solicitud, user):

    cursor.execute("""

        SELECT s.id_solicitud, s.tipo_solicitud, s.id_usuario AS id_comprador,

               t.id_usuario AS id_vendedor

        FROM solicitudes_soporte s

        LEFT JOIN tiendas t ON t.id_tienda = s.id_tienda

        WHERE s.id_solicitud=%s

    """, (id_solicitud,))

    solicitud = cursor.fetchone()

    if not solicitud:

        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    usuario_id = int(user["sub"])

    es_admin = user.get("rol") in {"admin", "administrador"}

    if not es_admin and usuario_id not in {solicitud["id_comprador"], solicitud["id_vendedor"]}:

        raise HTTPException(status_code=403, detail="No tienes acceso a esta solicitud")

    return solicitud





@router.get("/vendedor")
def quejas_vendedor(user=Depends(current_user)):
    db = get_db(); cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT s.id_solicitud, s.id_orden, s.asunto, s.descripcion, s.categoria,
                   s.estado, s.respuesta, s.evidencia_url, s.fecha_creacion, s.fecha_resolucion,
                   s.id_usuario,
                   u.nombre_usuario AS comprador, u.correo_usuario AS correo_comprador,
                   t.nombre_tienda
            FROM solicitudes_soporte s
            JOIN tiendas t ON t.id_tienda = s.id_tienda
            JOIN usuarios u ON u.id_usuario = s.id_usuario
            WHERE (t.id_usuario = %s OR s.id_tienda IN (SELECT id_tienda FROM tiendas WHERE id_usuario = %s))
              AND s.tipo_solicitud = 'reclamo'
            ORDER BY s.fecha_creacion DESC
        """, (int(user["sub"]), int(user["sub"])))
        rows = cursor.fetchall()

        from app.models.payments import obtener_orden
        for row in rows:
            try:
                orden = obtener_orden(row["id_usuario"], row["id_orden"])
                if orden and orden.get("items"):
                    item0 = orden["items"][0]
                    row["imagen_libro"] = item0.get("imagen_url") or item0.get("imagen")
                    row["titulo_libro"] = item0.get("titulo") or item0.get("nombre_libro")
                    row["total_items"] = len(orden["items"])
                    row["total_orden"] = orden.get("total") or orden.get("monto_total")
                else:
                    row["imagen_libro"] = None
                    row["titulo_libro"] = None
                    row["total_items"] = 0
                    row["total_orden"] = None
            except Exception:
                row["imagen_libro"] = None
                row["titulo_libro"] = None
                row["total_items"] = 0
                row["total_orden"] = None

        return rows
    finally:
        cursor.close(); db.close()






@router.get("/{id_solicitud}/mensajes")

def mensajes_reclamo(id_solicitud: int, user=Depends(current_user)):

    db = get_db(); cursor = db.cursor(dictionary=True)

    try:

        solicitud = _acceso_reclamo(cursor, id_solicitud, user)

        if solicitud["tipo_solicitud"] != "reclamo":

            raise HTTPException(status_code=400, detail="Esta solicitud no tiene conversación de reclamo")

        cursor.execute("""

            SELECT m.id_mensaje, m.id_usuario, m.mensaje, m.fecha_creacion,

                   u.nombre_usuario, u.rol

            FROM mensajes_reclamo m JOIN usuarios u ON u.id_usuario=m.id_usuario

            WHERE m.id_solicitud=%s ORDER BY m.fecha_creacion ASC

        """, (id_solicitud,))

        return cursor.fetchall()

    finally:

        cursor.close(); db.close()





@router.post("/{id_solicitud}/mensajes")

def enviar_mensaje_reclamo(id_solicitud: int, data: MensajeReclamo, user=Depends(current_user)):

    db = get_db(); cursor = db.cursor(dictionary=True)

    try:

        solicitud = _acceso_reclamo(cursor, id_solicitud, user)

        if solicitud["tipo_solicitud"] != "reclamo":

            raise HTTPException(status_code=400, detail="Esta solicitud no tiene conversación de reclamo")

        cursor.execute("INSERT INTO mensajes_reclamo (id_solicitud, id_usuario, mensaje) VALUES (%s, %s, %s)", (id_solicitud, int(user["sub"]), data.mensaje.strip()))

        if int(user["sub"]) == solicitud["id_vendedor"]:
            cursor.execute("UPDATE solicitudes_soporte SET estado='En revisión' WHERE id_solicitud=%s AND estado='Abierto'", (id_solicitud,))
            cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion) VALUES (%s, 'sistema', 'Nueva respuesta de la librería', %s, %s, FALSE, NOW())", (solicitud["id_comprador"], "La librería respondió a tu reclamo.", id_solicitud))
        elif int(user["sub"]) == solicitud["id_comprador"] and solicitud["id_vendedor"]:
            cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion) VALUES (%s, 'sistema', 'Nueva respuesta del comprador', %s, %s, FALSE, NOW())", (solicitud["id_vendedor"], "El comprador respondió a un reclamo.", id_solicitud))
        elif user.get("rol") in {"admin", "administrador"}:
            if solicitud.get("id_vendedor"):
                cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion) VALUES (%s, 'sistema', 'Mensaje del administrador', %s, %s, FALSE, NOW())", (solicitud["id_vendedor"], f"El administrador envió un mensaje sobre el reclamo #{id_solicitud}.", id_solicitud))
            if solicitud.get("id_comprador"):
                cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion) VALUES (%s, 'sistema', 'Mensaje del administrador', %s, %s, FALSE, NOW())", (solicitud["id_comprador"], f"El administrador envió un mensaje en tu reclamo #{id_solicitud}.", id_solicitud))

        db.commit()

        return {"ok": True}

    finally:

        cursor.close(); db.close()





@router.get("/soporte")

def mi_soporte(user=Depends(current_user)):

    db = get_db(); cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""

            SELECT id_solicitud, asunto, descripcion, categoria, estado, respuesta, fecha_creacion, fecha_resolucion,
                   ROW_NUMBER() OVER (ORDER BY id_solicitud ASC) AS numero

            FROM solicitudes_soporte

            WHERE id_usuario=%s AND tipo_solicitud='soporte'

            ORDER BY fecha_creacion DESC

        """, (int(user["sub"]),))

        return cursor.fetchall()

    finally:

        cursor.close(); db.close()





@router.post("/soporte")

def crear_soporte(data: SoporteCrear, user=Depends(current_user)):

    db = get_db(); cursor = db.cursor()

    try:

        cursor.execute("""

            INSERT INTO solicitudes_soporte

              (id_tienda, id_usuario, asunto, descripcion, categoria, estado, tipo_solicitud)

            VALUES (NULL, %s, %s, %s, %s, 'Abierto', 'soporte')

        """, (int(user["sub"]), data.asunto.strip(), data.descripcion.strip(), data.categoria))

        id_solicitud = cursor.lastrowid

        # Notificar administradores sobre el nuevo ticket de soporte
        try:
            cursor.execute("SELECT id_usuario FROM usuarios WHERE rol IN ('admin','administrador')")
            admins = cursor.fetchall() or []
            mensaje_admin = f"Nuevo ticket de soporte #{id_solicitud} creado por el usuario {user.get('sub')}"
            for a in admins:
                try:
                    cursor.execute(
                        "INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'sistema', 'Nuevo ticket de soporte', %s, %s)",
                        (a.get('id_usuario'), mensaje_admin, id_solicitud)
                    )
                except Exception:
                    pass
        except Exception:
            pass

        db.commit()

        return {"ok": True, "id_solicitud": id_solicitud}

    finally:

        cursor.close(); db.close()





@router.get("/admin/todas")
def todas_las_quejas(user=Depends(current_user)):
    if user.get("rol") not in {"admin", "administrador"}:
        raise HTTPException(status_code=403, detail="Solo el administrador puede ver los reclamos")
    db = get_db(); cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT s.id_solicitud, s.id_usuario, s.id_orden, s.id_tienda, s.asunto, s.descripcion, s.categoria, s.tipo_solicitud, s.estado,
                   s.respuesta, s.evidencia_url, s.fecha_creacion,
                   ROW_NUMBER() OVER (PARTITION BY s.id_usuario, s.tipo_solicitud ORDER BY s.id_solicitud ASC) AS numero,
                   u.nombre_usuario AS comprador,
                   u.foto_perfil AS foto_comprador,
                   u.correo_usuario AS correo_comprador, u.rol AS rol_usuario, t.nombre_tienda, t.id_usuario AS id_vendedor,
                   t.telefono AS telefono_tienda, t.direccion AS direccion_tienda,
                   uv.nombre_usuario AS nombre_vendedor, uv.correo_usuario AS correo_vendedor
            FROM solicitudes_soporte s
            JOIN usuarios u ON u.id_usuario = s.id_usuario
            LEFT JOIN tiendas t ON t.id_tienda = s.id_tienda
            LEFT JOIN usuarios uv ON uv.id_usuario = t.id_usuario
            WHERE s.tipo_solicitud IN ('reclamo', 'soporte')
            ORDER BY s.fecha_creacion DESC
        """)
        rows = cursor.fetchall()

        from app.models.payments import obtener_orden
        for row in rows:
            try:
                if row.get("id_orden") and row.get("id_usuario"):
                    orden = obtener_orden(int(row["id_usuario"]), int(row["id_orden"]))
                    if orden and orden.get("items"):
                        item0 = orden["items"][0]
                        row["imagen_libro"] = item0.get("imagen_url") or item0.get("imagen")
                        row["titulo_libro"] = item0.get("titulo") or item0.get("nombre_libro")
                        row["total_items"] = len(orden["items"])
                        row["total_orden"] = orden.get("total")
            except Exception:
                pass

        return rows
    finally:
        cursor.close(); db.close()





@router.patch("/admin/{id_solicitud}")

def resolver_queja(id_solicitud: int, data: Resolucion, user=Depends(current_user)):

    if user.get("rol") not in {"admin", "administrador"}:

        raise HTTPException(status_code=403, detail="Solo el administrador puede resolver reclamos")

    db = get_db(); cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""

            SELECT s.tipo_solicitud, s.id_usuario AS id_comprador, t.id_usuario AS id_vendedor

            FROM solicitudes_soporte s

            LEFT JOIN tiendas t ON t.id_tienda = s.id_tienda

            WHERE s.id_solicitud=%s

        """, (id_solicitud,))

        ticket = cursor.fetchone()

        if not ticket: raise HTTPException(status_code=404, detail="Reclamo no encontrado")

        cursor.execute("UPDATE solicitudes_soporte SET estado=%s, respuesta=%s, fecha_resolucion=NOW() WHERE id_solicitud=%s", (data.estado, data.respuesta, id_solicitud))

        es_soporte = (ticket.get("tipo_solicitud") or "").lower() == "soporte"
        titulo_notif = "Ticket de soporte actualizado" if es_soporte else "Reclamo resuelto / actualizado"
        cuerpo_base = (
            f"Tu ticket #{id_solicitud} ha sido marcado como '{data.estado}': {data.respuesta}"
            if es_soporte
            else f"Tu reclamo #{id_solicitud} ha sido marcado como '{data.estado}': {data.respuesta}"
        )[:280]

        usuarios_notificar = set()
        if ticket.get("id_comprador"):
            usuarios_notificar.add(ticket["id_comprador"])
        if ticket.get("id_vendedor"):
            usuarios_notificar.add(ticket["id_vendedor"])

        for uid in usuarios_notificar:
            cursor.execute(
                "INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion) VALUES (%s, 'sistema', %s, %s, %s, FALSE, NOW())",
                (uid, titulo_notif, cuerpo_base, id_solicitud)
            )

        db.commit()
        return {"ok": True}
    finally:
        cursor.close(); db.close()


