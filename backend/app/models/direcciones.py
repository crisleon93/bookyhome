import logging
from app.database import get_db


def obtener_direcciones_usuario(id_usuario: int):
    """Retorna todas las direcciones de envío de un usuario."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id_direccion, id_usuario, nombre_destinatario, telefono_contacto,
                   departamento, ciudad, direccion, codigo_postal, es_predeterminada, created_at
            FROM direcciones_envio
            WHERE id_usuario = %s
            ORDER BY es_predeterminada DESC, created_at DESC
            """,
            (id_usuario,)
        )
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener direcciones del usuario {id_usuario}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def crear_direccion(id_usuario: int, datos: dict):
    """
    Crea una nueva dirección de envío.
    Si es_predeterminada=True, quita la bandera de las demás.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        if datos.get("es_predeterminada"):
            cursor.execute(
                "UPDATE direcciones_envio SET es_predeterminada = 0 WHERE id_usuario = %s",
                (id_usuario,)
            )

        cursor.execute(
            """
            INSERT INTO direcciones_envio
                (id_usuario, nombre_destinatario, telefono_contacto, departamento, ciudad, direccion, codigo_postal, es_predeterminada)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                id_usuario,
                datos.get("nombre_destinatario", "").strip(),
                datos.get("telefono_contacto", "").strip(),
                datos.get("departamento", "").strip(),
                datos.get("ciudad", "").strip(),
                datos.get("direccion", "").strip(),
                datos.get("codigo_postal", "").strip(),
                bool(datos.get("es_predeterminada", False))
            )
        )
        db.commit()
        id_direccion = cursor.lastrowid
        cursor.execute(
            "SELECT * FROM direcciones_envio WHERE id_direccion = %s",
            (id_direccion,)
        )
        return {"ok": True, "direccion": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al crear dirección para usuario {id_usuario}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def actualizar_direccion(id_direccion: int, id_usuario: int, datos: dict):
    """Actualiza una dirección de envío del usuario."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que la dirección pertenece al usuario
        cursor.execute(
            "SELECT id_direccion FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, id_usuario)
        )
        if not cursor.fetchone():
            return {"ok": False, "error": "Dirección no encontrada"}

        if datos.get("es_predeterminada"):
            cursor.execute(
                "UPDATE direcciones_envio SET es_predeterminada = 0 WHERE id_usuario = %s",
                (id_usuario,)
            )

        campos = []
        valores = []
        for campo in ["nombre_destinatario", "telefono_contacto", "departamento", "ciudad", "direccion", "codigo_postal"]:
            if campo in datos:
                campos.append(f"{campo} = %s")
                valores.append(datos[campo].strip() if isinstance(datos[campo], str) else datos[campo])
        if "es_predeterminada" in datos:
            campos.append("es_predeterminada = %s")
            valores.append(bool(datos["es_predeterminada"]))

        if not campos:
            return {"ok": False, "error": "No hay campos para actualizar"}

        valores.extend([id_direccion, id_usuario])
        cursor.execute(
            f"UPDATE direcciones_envio SET {', '.join(campos)} WHERE id_direccion = %s AND id_usuario = %s",
            tuple(valores)
        )
        db.commit()
        cursor.execute("SELECT * FROM direcciones_envio WHERE id_direccion = %s", (id_direccion,))
        return {"ok": True, "direccion": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al actualizar dirección {id_direccion}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def eliminar_direccion(id_direccion: int, id_usuario: int):
    """Elimina una dirección de envío del usuario."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "DELETE FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, id_usuario)
        )
        db.commit()
        return {"ok": cursor.rowcount > 0, "error": "Dirección no encontrada" if cursor.rowcount == 0 else None}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al eliminar dirección {id_direccion}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def marcar_direccion_predeterminada(id_direccion: int, id_usuario: int):
    """Marca una dirección como predeterminada y desactiva las demás."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_direccion FROM direcciones_envio WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, id_usuario)
        )
        if not cursor.fetchone():
            return {"ok": False, "error": "Dirección no encontrada"}

        cursor.execute(
            "UPDATE direcciones_envio SET es_predeterminada = 0 WHERE id_usuario = %s",
            (id_usuario,)
        )
        cursor.execute(
            "UPDATE direcciones_envio SET es_predeterminada = 1 WHERE id_direccion = %s AND id_usuario = %s",
            (id_direccion, id_usuario)
        )
        db.commit()
        cursor.execute("SELECT * FROM direcciones_envio WHERE id_direccion = %s", (id_direccion,))
        return {"ok": True, "direccion": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al marcar dirección predeterminada {id_direccion}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
