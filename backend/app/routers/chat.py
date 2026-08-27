from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.database import get_db
from app.auth import verify_token
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from app.ws.manager import manager

router = APIRouter(prefix="/chat", tags=["Chat"])
security = HTTPBearer()

# ============= SCHEMAS =============

class MensajeCreate(BaseModel):
    id_sala: int
    mensaje: str

class SalaCreate(BaseModel):
    id_tienda: int

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
        raise HTTPException(status_code=401, detail="Token invÃ¡lido")
    return int(payload.get("sub"))

def get_current_user_rol(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invÃ¡lido")
    return payload.get("rol")


# ============= ENDPOINTS =============@router.get("/salas")
def obtener_salas_usuario(user_id: int = Depends(get_current_user), rol: str = Depends(get_current_user_rol)):
    """Obtiene todas las salas de chat del usuario (comprador, vendedor o admin)"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        rol_lower = (rol or '').lower()
        if rol_lower == 'vendedor':
            filtro = "t.id_usuario = %s"
        else:
            filtro = "sc.id_usuario = %s"

        query = f"""
            SELECT
                sc.id_sala,
                sc.id_usuario,
                sc.id_tienda,
                t.nombre_tienda,
                u.nombre_usuario as nombre_comprador,
                u.rol as rol_comprador,
                m.mensaje as ultimo_mensaje,
                DATE_FORMAT(m.enviado_en, '%Y-%m-%d %H:%i:%S') as fecha_ultimo_mensaje,
                (
                    SELECT COUNT(*) 
                    FROM mensajes m2 
                    WHERE m2.id_sala = sc.id_sala 
                      AND m2.mensaje_leido = FALSE 
                      AND m2.id_remitente != %s
                ) as no_leidos
            FROM salasChats sc
            LEFT JOIN tiendas t ON sc.id_tienda = t.id_tienda
            LEFT JOIN usuarios u ON sc.id_usuario = u.id_usuario
            LEFT JOIN mensajes m ON sc.id_sala = m.id_sala
                AND m.enviado_en = (
                    SELECT MAX(enviado_en) 
                    FROM mensajes 
                    WHERE id_sala = sc.id_sala
                )
            WHERE {filtro} AND m.mensaje IS NOT NULL
            GROUP BY sc.id_sala, sc.id_usuario, sc.id_tienda, t.nombre_tienda, u.nombre_usuario, u.rol, m.mensaje, m.enviado_en
            ORDER BY m.enviado_en DESC
        """
        cursor.execute(query, (user_id, user_id))
        salas = cursor.fetchall()
        
        return {"salas": salas}
    finally:
        cursor.close()
        db.close()
        
@router.post("/salas")
def crear_sala_chat(data: SalaCreate, user_id: int = Depends(get_current_user)):
    """Crea una nueva sala de chat entre usuario y tienda"""
    id_tienda = data.id_tienda
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
def obtener_mensajes_sala(
    id_sala: int,
    limit: int = 50,
    offset: int = 0,
    user_id: int = Depends(get_current_user),
    rol: str = Depends(get_current_user_rol),
):
    """Obtiene los mensajes de una sala de chat, solo si el usuario pertenece a ella o es admin"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que la sala existe y obtener sus dueños (comprador y tienda)
        cursor.execute("""
            SELECT sc.id_usuario as id_comprador, t.id_usuario as id_vendedor
            FROM salasChats sc
            JOIN tiendas t ON sc.id_tienda = t.id_tienda
            WHERE sc.id_sala = %s
        """, (id_sala,))
        sala = cursor.fetchone()

        if not sala:
            raise HTTPException(status_code=404, detail="Sala no encontrada")

        es_admin = (rol or '').lower() in ('admin', 'administrador')
        es_comprador_dueno = rol != 'vendedor' and user_id == sala['id_comprador']
        es_vendedor_dueno = rol == 'vendedor' and user_id == sala['id_vendedor']

        if not (es_comprador_dueno or es_vendedor_dueno or es_admin):
            raise HTTPException(status_code=403, detail="No tienes acceso a esta sala")

        query = """
            SELECT 
                m.id_mensaje,
                m.id_sala,
                m.id_remitente,
                u.nombre_usuario as nombre_remitente,
                m.mensaje,
                DATE_FORMAT(m.enviado_en, '%Y-%m-%d %H:%i:%S') as enviado_en,
                m.mensaje_leido
            FROM mensajes m
            JOIN usuarios u ON m.id_remitente = u.id_usuario
            WHERE m.id_sala = %s
            ORDER BY m.enviado_en DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (id_sala, limit, offset))
        mensajes = cursor.fetchall()
        mensajes.reverse()
        return {"mensajes": mensajes}
    except HTTPException:
        raise
    finally:
        cursor.close()
        db.close()

def _obtener_participantes_sala(cursor, id_sala: int):
    """Devuelve {'id_comprador': ..., 'id_vendedor': ...} o None si la sala no existe."""
    cursor.execute("""
        SELECT sc.id_usuario AS id_comprador, t.id_usuario AS id_vendedor
        FROM salasChats sc
        JOIN tiendas t ON sc.id_tienda = t.id_tienda
        WHERE sc.id_sala = %s
    """, (id_sala,))
    return cursor.fetchone()


def _guardar_mensaje_sync(id_sala: int, user_id: int, texto: str) -> dict:
    """Valida acceso, inserta el mensaje y devuelve todo lo necesario para
    responder por REST y/o transmitir por WS. Corre en threadpool (bloqueante)."""
    if not texto.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
    if len(texto) > 500:
        raise HTTPException(status_code=400, detail="El mensaje es muy largo (máximo 500 caracteres)")

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT sc.id_usuario as id_comprador, t.id_usuario as id_vendedor
            FROM salasChats sc
            JOIN tiendas t ON sc.id_tienda = t.id_tienda
            WHERE sc.id_sala = %s
        """, (id_sala,))
        sala_info = cursor.fetchone()
        if not sala_info:
            raise HTTPException(status_code=404, detail="Sala no encontrada")

        es_participante = (user_id == sala_info['id_comprador'] or user_id == sala_info['id_vendedor'])
        if not es_participante:
            cursor.execute("SELECT rol FROM usuarios WHERE id_usuario = %s", (user_id,))
            u_check = cursor.fetchone()
            if not u_check or (u_check.get('rol') or '').lower() not in ('admin', 'administrador'):
                raise HTTPException(status_code=403, detail="No tienes acceso a esta sala")

        cursor.execute("""
            INSERT INTO mensajes
            (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
            VALUES (%s, %s, %s, NOW(), FALSE)
        """, (id_sala, user_id, texto))
        db.commit()
        mensaje_id = cursor.lastrowid

        cursor.execute("""
            UPDATE salasChats SET actualizado_en = NOW() WHERE id_sala = %s
        """, (id_sala,))
        db.commit()

        cursor.execute("""
            SELECT m.id_mensaje, m.id_sala, m.id_remitente,
                   u.nombre_usuario AS nombre_remitente,
                   m.mensaje,
                   DATE_FORMAT(m.enviado_en, '%Y-%m-%d %H:%i:%S') AS enviado_en,
                   m.mensaje_leido
            FROM mensajes m
            JOIN usuarios u ON m.id_remitente = u.id_usuario
            WHERE m.id_mensaje = %s
        """, (mensaje_id,))
        mensaje_completo = cursor.fetchone()

        participantes = _obtener_participantes_sala(cursor, id_sala)
        destinatario_id = None
        if participantes:
            destinatario_id = (
                participantes["id_vendedor"]
                if user_id == participantes["id_comprador"]
                else participantes["id_comprador"]
            )

        # Insertar notificación persistente en BD para el destinatario
        if destinatario_id is not None:
            remitente = mensaje_completo.get("nombre_remitente", "Alguien")
            preview = texto[:80] + ("…" if len(texto) > 80 else "")
            try:
                cursor.execute("""
                    SELECT id_notificacion
                    FROM notificaciones
                    WHERE id_usuario = %s
                      AND tipo = 'mensaje'
                      AND id_referencia = %s
                      AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                    ORDER BY fecha_creacion DESC
                    LIMIT 1
                """, (destinatario_id, id_sala))
                existe = cursor.fetchone()

                if not existe:
                    cursor.execute("""
                        INSERT INTO notificaciones
                        (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                        VALUES (%s, 'mensaje', %s, %s, %s, FALSE, NOW())
                    """, (destinatario_id, f"Nuevo mensaje de {remitente}", preview, id_sala))
                    db.commit()
            except Exception:
                pass  # No interrumpir el flujo si la notificación falla

        return {"mensaje": mensaje_completo, "destinatario_id": destinatario_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()


async def enviar_y_notificar(id_sala: int, user_id: int, texto: str) -> dict:
    resultado = await run_in_threadpool(_guardar_mensaje_sync, id_sala, user_id, texto)
    mensaje = resultado["mensaje"]
    destinatario_id = resultado["destinatario_id"]

    payload_ws = {"tipo": "nuevo_mensaje", "mensaje": mensaje}

    if destinatario_id is not None:
        await manager.enviar_a_usuario(destinatario_id, payload_ws)

    return mensaje


@router.post("/mensajes")
async def enviar_mensaje(data: MensajeCreate, user_id: int = Depends(get_current_user)):
    """Envía un mensaje en una sala de chat (y lo transmite en vivo si el otro está conectado)"""
    mensaje = await enviar_y_notificar(data.id_sala, user_id, data.mensaje)
    return {
        "ok": True,
        "id_mensaje": mensaje["id_mensaje"],
        "mensaje": "Mensaje enviado"
    }

@router.put("/mensajes/{id_mensaje}/leer")
def marcar_mensaje_leido(
    id_mensaje: int,
    user_id: int = Depends(get_current_user),
    rol: str = Depends(get_current_user_rol),
):
    """Marca un mensaje como leído, solo si el usuario pertenece a la sala o es admin"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT sc.id_usuario as id_comprador, t.id_usuario as id_vendedor, m.id_sala
            FROM mensajes m
            JOIN salasChats sc ON m.id_sala = sc.id_sala
            JOIN tiendas t ON sc.id_tienda = t.id_tienda
            WHERE m.id_mensaje = %s
        """, (id_mensaje,))
        info = cursor.fetchone()

        if not info:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")

        es_admin = (rol or '').lower() in ('admin', 'administrador')
        es_comprador_dueno = rol != 'vendedor' and user_id == info['id_comprador']
        es_vendedor_dueno = rol == 'vendedor' and user_id == info['id_vendedor']

        if not (es_comprador_dueno or es_vendedor_dueno or es_admin):
            raise HTTPException(status_code=403, detail="No tienes acceso a este mensaje")

        cursor.execute("""
            UPDATE mensajes 
            SET mensaje_leido = TRUE 
            WHERE id_mensaje = %s
        """, (id_mensaje,))

        db.commit()
        return {"ok": True, "mensaje": "Mensaje marcado como leído"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.put("/salas/{id_sala}/marcar-leidos")
def marcar_sala_leida(
    id_sala: int,
    user_id: int = Depends(get_current_user),
    rol: str = Depends(get_current_user_rol),
):
    """Marca como leídos los mensajes de una sala que el usuario no envió"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT sc.id_usuario as id_comprador, t.id_usuario as id_vendedor
            FROM salasChats sc
            JOIN tiendas t ON sc.id_tienda = t.id_tienda
            WHERE sc.id_sala = %s
        """, (id_sala,))
        sala = cursor.fetchone()

        if not sala:
            raise HTTPException(status_code=404, detail="Sala no encontrada")

        es_admin = (rol or '').lower() in ('admin', 'administrador')
        es_comprador_dueno = rol != 'vendedor' and user_id == sala['id_comprador']
        es_vendedor_dueno = rol == 'vendedor' and user_id == sala['id_vendedor']

        if not (es_comprador_dueno or es_vendedor_dueno or es_admin):
            raise HTTPException(status_code=403, detail="No tienes acceso a esta sala")

        cursor.execute("""
            UPDATE mensajes 
            SET mensaje_leido = TRUE 
            WHERE id_sala = %s AND id_remitente != %s
        """, (id_sala, user_id))

        db.commit()
        return {"ok": True, "mensaje": "Sala marcada como leída"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    payload = verify_token(token) if token else None

    if not payload:
        await websocket.accept()
        await websocket.close(code=4401)
        return

    user_id = int(payload.get("sub"))
    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            tipo = data.get("tipo")

            if tipo == "mensaje":
                id_sala = data.get("id_sala")
                texto = data.get("mensaje", "")
                try:
                    mensaje = await enviar_y_notificar(id_sala, user_id, texto)
                    # ConfirmaciÃ³n al remitente (para que su UI actualice el estado "enviado")
                    await websocket.send_json({"tipo": "mensaje_enviado", "mensaje": mensaje})
                except HTTPException as e:
                    await websocket.send_json({"tipo": "error", "detalle": e.detail})

            elif tipo == "ping":
                await websocket.send_json({"tipo": "pong"})

    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)
    except Exception:
        await manager.disconnect(user_id, websocket)
