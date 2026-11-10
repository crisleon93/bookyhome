import logging
from datetime import date
from app.database import get_db


# ========================
# Consultas de Suscripciones
# ========================

def obtener_suscripcion_activa(id_tienda: int):
    """Retorna la suscripción activa de una tienda, o None si no tiene."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id_suscripcion, id_tienda, plan_suscripcion, estado_suscripcion,
                   fecha_inicio, fecha_fin, precio_pagado, metodo_pago
            FROM suscripciones_tienda
            WHERE id_tienda = %s AND estado_suscripcion = 'activa'
            ORDER BY fecha_fin DESC
            LIMIT 1
            """,
            (id_tienda,)
        )
        return cursor.fetchone()
    except Exception as e:
        logging.error(f"Error al obtener suscripción activa de tienda {id_tienda}: {e}")
        return None
    finally:
        cursor.close()
        db.close()


def obtener_historial_suscripciones(id_tienda: int):
    """Retorna el historial completo de suscripciones de una tienda."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id_suscripcion, id_tienda, plan_suscripcion, estado_suscripcion,
                   fecha_inicio, fecha_fin, precio_pagado, metodo_pago
            FROM suscripciones_tienda
            WHERE id_tienda = %s
            ORDER BY fecha_inicio DESC
            """,
            (id_tienda,)
        )
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener historial de suscripciones de tienda {id_tienda}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def verificar_vigencia(id_tienda: int) -> bool:
    """
    Retorna True si la tienda tiene una suscripción activa y vigente (fecha_fin >= hoy).
    Retorna False en cualquier otro caso.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id_suscripcion
            FROM suscripciones_tienda
            WHERE id_tienda = %s
              AND estado_suscripcion = 'activa'
              AND fecha_fin >= CURDATE()
            LIMIT 1
            """,
            (id_tienda,)
        )
        return cursor.fetchone() is not None
    except Exception as e:
        logging.error(f"Error al verificar vigencia de suscripción de tienda {id_tienda}: {e}")
        return False
    finally:
        cursor.close()
        db.close()


def crear_suscripcion(id_tienda: int, datos: dict):
    """
    Crea una nueva suscripción para una tienda.
    datos debe incluir: plan_suscripcion, fecha_inicio, fecha_fin, precio_pagado, metodo_pago.
    Si ya tiene una activa, cancela la anterior automáticamente.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Cancelar la suscripción activa anterior si existe
        cursor.execute(
            """
            UPDATE suscripciones_tienda
            SET estado_suscripcion = 'cancelada'
            WHERE id_tienda = %s AND estado_suscripcion = 'activa'
            """,
            (id_tienda,)
        )

        cursor.execute(
            """
            INSERT INTO suscripciones_tienda
                (id_tienda, plan_suscripcion, estado_suscripcion, fecha_inicio, fecha_fin, precio_pagado, metodo_pago)
            VALUES (%s, %s, 'activa', %s, %s, %s, %s)
            """,
            (
                id_tienda,
                datos.get("plan_suscripcion", "basico"),
                datos.get("fecha_inicio", date.today()),
                datos.get("fecha_fin"),
                datos.get("precio_pagado", 0),
                datos.get("metodo_pago", ""),
            )
        )
        db.commit()
        id_suscripcion = cursor.lastrowid
        cursor.execute(
            "SELECT * FROM suscripciones_tienda WHERE id_suscripcion = %s",
            (id_suscripcion,)
        )
        return {"ok": True, "suscripcion": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al crear suscripción para tienda {id_tienda}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def cancelar_suscripcion(id_suscripcion: int, id_tienda: int):
    """Cambia el estado de la suscripción a 'cancelada'."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            UPDATE suscripciones_tienda
            SET estado_suscripcion = 'cancelada'
            WHERE id_suscripcion = %s AND id_tienda = %s AND estado_suscripcion = 'activa'
            """,
            (id_suscripcion, id_tienda)
        )
        db.commit()
        if cursor.rowcount == 0:
            return {"ok": False, "error": "Suscripción no encontrada o ya cancelada"}
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al cancelar suscripción {id_suscripcion}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def expirar_suscripciones_vencidas():
    """
    Tarea de mantenimiento: marca como 'expirada' toda suscripción activa cuya fecha_fin ya pasó.
    Útil para ejecutar periódicamente con un cron job.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            UPDATE suscripciones_tienda
            SET estado_suscripcion = 'expirada'
            WHERE estado_suscripcion = 'activa' AND fecha_fin < CURDATE()
            """
        )
        db.commit()
        logging.info(f"Suscripciones expiradas actualizadas: {cursor.rowcount}")
        return {"ok": True, "actualizadas": cursor.rowcount}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al expirar suscripciones vencidas: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
