from app.database import get_db
from app.auth import hash_password

def crear_libreria(nombre, nombre_libreria, direccion, telefono, email, password, token_verificacion=None):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            INSERT INTO usuarios
            (nombre_usuario, correo_usuario, contrasena_usuario, rol, fecha_registro,
             email_verificado, token_verificacion)
            VALUES (%s, %s, %s, %s, CURDATE(), FALSE, %s)
            """,
            (nombre, email, hash_password(password), "vendedor", token_verificacion)
        )

        id_usuario = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO tiendas
            (id_usuario, nombre_tienda, direccion, telefono, fecha_creacion, estado_tienda)
            VALUES (%s, %s, %s, %s, CURDATE(), 'activa')
            """,
            (id_usuario, nombre_libreria, direccion, telefono)
        )

        db.commit()
        return {"ok": True}

    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}

    finally:
        cursor.close()
        db.close()


def obtener_tiendas():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                t.id_tienda,
                t.id_usuario,
                t.nombre_tienda,
                t.direccion,
                t.telefono,
                t.fecha_creacion,
                t.estado_tienda,
                u.correo_usuario AS email_contacto,
                u.nombre_usuario AS nombre_dueno
            FROM tiendas t
            JOIN usuarios u ON u.id_usuario = t.id_usuario
            ORDER BY t.id_tienda
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


from datetime import datetime

def actualizar_estado_tienda(id_tienda: int, nuevo_estado: str, motivo: str = None, admin_user_id: int = None):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # 1. Obtener tienda y usuario dueño
        cursor.execute("""
            SELECT t.id_tienda, t.nombre_tienda, t.id_usuario, u.nombre_usuario, u.correo_usuario
            FROM tiendas t
            JOIN usuarios u ON t.id_usuario = u.id_usuario
            WHERE t.id_tienda = %s
        """, (id_tienda,))
        tienda = cursor.fetchone()
        if not tienda:
            return {"ok": False, "error": "Tienda no encontrada"}

        # 2. Actualizar estado
        query = "UPDATE tiendas SET estado_tienda = %s WHERE id_tienda = %s"
        cursor.execute(query, (nuevo_estado, id_tienda))
        db.commit()

        mensaje_enviado = False

        # 3. Si el nuevo estado es 'suspendida', crear o recuperar sala de chat con el vendedor y enviar el mensaje
        if nuevo_estado == "suspendida":
            id_vendedor = tienda["id_usuario"]
            nombre_tienda = tienda["nombre_tienda"]

            # Identificar remitente admin
            remitente_id = admin_user_id
            admin_nombre = "Administración BookyHome"

            if remitente_id:
                cursor.execute("SELECT id_usuario, nombre_usuario FROM usuarios WHERE id_usuario = %s", (remitente_id,))
                row_admin = cursor.fetchone()
                if row_admin:
                    admin_nombre = row_admin.get("nombre_usuario") or "Administración BookyHome"
            else:
                cursor.execute("SELECT id_usuario, nombre_usuario FROM usuarios WHERE LOWER(rol) IN ('admin', 'administrador') ORDER BY id_usuario ASC LIMIT 1")
                row_admin = cursor.fetchone()
                if row_admin:
                    remitente_id = row_admin["id_usuario"]
                    admin_nombre = row_admin.get("nombre_usuario") or "Administración BookyHome"
                else:
                    remitente_id = 1

            # Buscar si ya existe una sala entre este admin y la tienda
            cursor.execute("""
                SELECT id_sala FROM salasChats
                WHERE id_usuario = %s AND id_tienda = %s
            """, (remitente_id, id_tienda))
            sala_existente = cursor.fetchone()

            if sala_existente:
                id_sala = sala_existente["id_sala"]
            else:
                cursor.execute("""
                    INSERT INTO salasChats (id_usuario, id_tienda, creado_en, actualizado_en)
                    VALUES (%s, %s, NOW(), NOW())
                """, (remitente_id, id_tienda))
                db.commit()
                id_sala = cursor.lastrowid

            motivo_limpio = (motivo or "Incumplimiento de las políticas y términos de servicio de la plataforma.").strip()
            texto_mensaje = (
                f"🚫 Notificación de Suspensión:\n"
                f"Tu librería '{nombre_tienda}' ha sido suspendida.\n\n"
                f"Motivo: {motivo_limpio}\n\n"
                f"Puedes responder a este chat para comunicarte con administración."
            )
            if len(texto_mensaje) > 500:
                texto_mensaje = texto_mensaje[:497] + "..."

            # Insertar mensaje en BD
            cursor.execute("""
                INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
                VALUES (%s, %s, %s, NOW(), FALSE)
            """, (id_sala, remitente_id, texto_mensaje))
            db.commit()
            mensaje_id = cursor.lastrowid

            # Actualizar fecha de la sala
            cursor.execute("UPDATE salasChats SET actualizado_en = NOW() WHERE id_sala = %s", (id_sala,))
            db.commit()

            # Insertar notificación para el vendedor
            preview = f"Motivo: {motivo_limpio[:80]}"
            try:
                cursor.execute("""
                    INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                    VALUES (%s, 'mensaje', '⚠️ Librería suspendida por administración', %s, %s, FALSE, NOW())
                """, (id_vendedor, preview, id_sala))
                db.commit()
            except Exception as notif_e:
                print(f"Error insertando notificación de suspensión: {notif_e}", flush=True)

            # Notificación en tiempo real por WebSocket
            try:
                from app.ws.manager import manager
                import asyncio
                payload_ws = {
                    "tipo": "nuevo_mensaje",
                    "mensaje": {
                        "id_mensaje": mensaje_id,
                        "id_sala": id_sala,
                        "id_remitente": remitente_id,
                        "nombre_remitente": admin_nombre,
                        "mensaje": texto_mensaje,
                        "enviado_en": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "mensaje_leido": False
                    }
                }
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(manager.enviar_a_usuario(id_vendedor, payload_ws))
                except RuntimeError:
                    pass
            except Exception as ws_e:
                print(f"Error WS suspensión: {ws_e}", flush=True)

            mensaje_enviado = True

        return {"ok": True, "mensaje_enviado": mensaje_enviado}
    except Exception as e:
        db.rollback()
        print(f"❌ Error interno en SQL: {e}", flush=True)
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
        
def obtener_tienda_por_usuario(id_usuario: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Usamos los nombres de columna reales de tu tabla tiendas
        query = """
            SELECT id_tienda, id_usuario, nombre_tienda, direccion, telefono, estado_tienda 
            FROM tiendas 
            WHERE id_usuario = %s
        """
        cursor.execute(query, (id_usuario,))
        return cursor.fetchone() # Retorna el diccionario o None si no existe
    except Exception as e:
        print(f"❌ Error al obtener tienda por usuario: {e}", flush=True)
        return None
    finally:
        cursor.close()
        db.close()


def actualizar_tienda(id_usuario: int, nombre_tienda: str, direccion: str, telefono: str):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE tiendas
            SET nombre_tienda = %s, direccion = %s, telefono = %s
            WHERE id_usuario = %s
        """, (nombre_tienda, direccion, telefono, id_usuario))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def obtener_tienda_por_id(id_tienda: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM tiendas WHERE id_tienda = %s
        """, (id_tienda,))
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()