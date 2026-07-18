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

    # Las compras activas del checkout se almacenan en orders.json; se valida

    # con esa misma fuente para que Mis compras y Quejas muestren lo mismo.

    from app.models.payments import obtener_orden

    orden = obtener_orden(id_usuario, id_orden)

    if not orden or str(orden.get("estado", "")).lower() != "pagado":

        return None

    libros = [item.get("id_libro") for item in orden.get("items", []) if item.get("id_libro")]

    if not libros:

        return None

    placeholders = ", ".join(["%s"] * len(libros))

    cursor.execute(f"SELECT id_tienda FROM libros WHERE id_libro IN ({placeholders}) LIMIT 1", tuple(libros))

    tienda = cursor.fetchone()

    if not tienda:

        return None

    return {"id_tienda": tienda["id_tienda"]}





@router.get("")

def mis_quejas(user=Depends(current_user)):

    db = get_db(); cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""

            SELECT id_solicitud, id_orden, asunto, descripcion, categoria,

                   estado, respuesta, evidencia_url, fecha_creacion, fecha_resolucion

            FROM solicitudes_soporte

            WHERE id_usuario = %s AND tipo_solicitud = 'reclamo'

            ORDER BY fecha_creacion DESC

        """, (int(user["sub"]),))

        return cursor.fetchall()

    finally:

        cursor.close(); db.close()





@router.post("")

async def crear_queja(

    id_orden: int = Form(...), motivo: str = Form(...), descripcion: str = Form(...),

    evidencia: UploadFile | None = File(None), user=Depends(current_user)

):

    if not motivo.strip() or not descripcion.strip():

        raise HTTPException(status_code=400, detail="El motivo y la descripción son obligatorios")

    if evidencia and evidencia.content_type not in {"image/jpeg", "image/png", "image/webp"}:

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

        if evidencia:

            extension = os.path.splitext(evidencia.filename or "")[1].lower() or ".jpg"

            filename = f"{uuid.uuid4().hex}{extension}"

            with open(os.path.join(UPLOAD_DIR, filename), "wb") as target:

                target.write(await evidencia.read())

            evidencia_url = f"/uploads/quejas/{filename}"

        cursor.execute("""

            INSERT INTO solicitudes_soporte

              (id_tienda, id_usuario, id_orden, asunto, descripcion, categoria, estado, evidencia_url, tipo_solicitud)

            VALUES (%s, %s, %s, %s, %s, 'reclamo', 'Abierto', %s, 'reclamo')

        """, (orden["id_tienda"], int(user["sub"]), id_orden, motivo.strip()[:150], descripcion.strip()[:2000], evidencia_url))

        id_solicitud = cursor.lastrowid

        # Notificar al vendedor (si existe) y a administradores
        try:
            id_vendedor = None
            if orden.get("id_tienda"):
                cursor.execute("SELECT id_usuario FROM tiendas WHERE id_tienda=%s", (orden.get("id_tienda"),))
                row = cursor.fetchone()
                if row:
                    id_vendedor = row.get("id_usuario")

            mensaje_vendedor = f"Nuevo reclamo recibido (#{id_solicitud}) para la orden #{id_orden}"
            if id_vendedor:
                cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'reclamo', 'Nuevo reclamo recibido', %s, %s)", (id_vendedor, mensaje_vendedor, id_solicitud))

            cursor.execute("SELECT id_usuario FROM usuarios WHERE rol IN ('admin','administrador')")
            admins = cursor.fetchall() or []
            mensaje_admin = f"Nueva solicitud de reclamo #{id_solicitud} creada por el usuario {user.get('sub')}"
            for a in admins:
                try:
                    cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'reclamo', 'Nueva solicitud de reclamo', %s, %s)", (a.get('id_usuario'), mensaje_admin, id_solicitud))
                except Exception:
                    pass
        except Exception:
            pass

        db.commit()

        return {"ok": True, "id_solicitud": id_solicitud}

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

                   s.estado, s.respuesta, s.evidencia_url, s.fecha_creacion,

                   u.nombre_usuario AS comprador

            FROM solicitudes_soporte s

            JOIN tiendas t ON t.id_tienda = s.id_tienda

            JOIN usuarios u ON u.id_usuario = s.id_usuario

            WHERE t.id_usuario=%s AND s.tipo_solicitud='reclamo'

            ORDER BY s.fecha_creacion DESC

        """, (int(user["sub"]),))

        return cursor.fetchall()

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

            cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'reclamo', 'Nueva respuesta de la librería', %s, %s)", (solicitud["id_comprador"], "La librería respondió a tu reclamo.", id_solicitud))

        elif int(user["sub"]) == solicitud["id_comprador"] and solicitud["id_vendedor"]:

            cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'reclamo', 'Nueva respuesta del comprador', %s, %s)", (solicitud["id_vendedor"], "El comprador respondió a un reclamo.", id_solicitud))

        db.commit()

        return {"ok": True}

    finally:

        cursor.close(); db.close()





@router.get("/soporte")

def mi_soporte(user=Depends(current_user)):

    db = get_db(); cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""

            SELECT id_solicitud, asunto, descripcion, categoria, estado, respuesta, fecha_creacion, fecha_resolucion

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
                        "INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'soporte', 'Nuevo ticket de soporte', %s, %s)",
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

            SELECT s.id_solicitud, s.id_orden, s.asunto, s.descripcion, s.categoria, s.tipo_solicitud, s.estado,

                   s.respuesta, s.evidencia_url, s.fecha_creacion, u.nombre_usuario AS comprador,

                   u.rol AS rol_usuario, t.nombre_tienda, t.id_usuario AS id_vendedor

            FROM solicitudes_soporte s

            JOIN usuarios u ON u.id_usuario = s.id_usuario

            LEFT JOIN tiendas t ON t.id_tienda = s.id_tienda

            WHERE s.tipo_solicitud IN ('reclamo', 'soporte')

            ORDER BY s.fecha_creacion DESC

        """)

        return cursor.fetchall()

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

        if ticket["id_vendedor"]:

            cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'reclamo', 'Reclamo requiere atención', %s, %s)", (ticket["id_vendedor"], f"El administrador revisó el reclamo #{id_solicitud}: {data.respuesta}", id_solicitud))

        cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s, 'soporte', 'Ticket actualizado', %s, %s)", (ticket["id_comprador"], f"El administrador actualizó tu solicitud #{id_solicitud}: {data.respuesta}", id_solicitud))

        db.commit()

        return {"ok": True}

    finally:

        cursor.close(); db.close()

