import logging
from app.database import get_db


def obtener_planes():
    """Retorna todos los planes de herramientas disponibles."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_plan, nombre_plan, precio_mensual,
                   estadisticas_basicas, estadisticas_avanzadas,
                   exportar_reportes, soporte_prioritario,
                   historial_meses, impulsos_con_descuento, descripcion
            FROM planes_herramientas
            ORDER BY precio_mensual ASC
        """)
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener planes de herramientas: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def obtener_suscripcion_activa_herramientas(id_tienda: int):
    """Retorna la suscripción activa de herramientas de una tienda, unida con el plan."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                sh.id_suscripcion, sh.id_tienda, sh.id_plan, sh.fecha_inicio,
                sh.fecha_fin, sh.renovacion_automatica, sh.estado,
                sh.metodo_pago, sh.monto_pagado,
                ph.nombre_plan, ph.precio_mensual,
                ph.estadisticas_basicas, ph.estadisticas_avanzadas,
                ph.exportar_reportes, ph.soporte_prioritario,
                ph.historial_meses, ph.impulsos_con_descuento, ph.descripcion
            FROM suscripciones_herramientas sh
            INNER JOIN planes_herramientas ph ON sh.id_plan = ph.id_plan
            WHERE sh.id_tienda = %s AND sh.estado = 'Activa'
            ORDER BY sh.fecha_fin DESC
            LIMIT 1
        """, (id_tienda,))
        return cursor.fetchone()
    except Exception as e:
        logging.error(f"Error al obtener suscripción activa de tienda {id_tienda}: {e}")
        return None
    finally:
        cursor.close()
        db.close()


def suscribir_plan(id_tienda: int, id_plan: int, fecha_inicio: str, fecha_fin: str, metodo_pago: str = "", monto_pagado: float = 0):
    """
    Suscribe una tienda a un plan de herramientas.
    Si ya tiene una suscripción activa, la cancela antes de crear la nueva.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que el plan existe
        cursor.execute("SELECT id_plan, precio_mensual FROM planes_herramientas WHERE id_plan = %s", (id_plan,))
        plan = cursor.fetchone()
        if not plan:
            return {"ok": False, "error": "El plan seleccionado no existe"}

        # Cancelar suscripción activa anterior
        cursor.execute(
            "UPDATE suscripciones_herramientas SET estado = 'Cancelada' WHERE id_tienda = %s AND estado = 'Activa'",
            (id_tienda,)
        )

        # Crear nueva suscripción
        cursor.execute("""
            INSERT INTO suscripciones_herramientas
                (id_tienda, id_plan, fecha_inicio, fecha_fin, estado, metodo_pago, monto_pagado)
            VALUES (%s, %s, %s, %s, 'Activa', %s, %s)
        """, (id_tienda, id_plan, fecha_inicio, fecha_fin, metodo_pago, monto_pagado))
        db.commit()

        id_suscripcion = cursor.lastrowid
        # Retornar la suscripción con el plan unido
        cursor.execute("""
            SELECT sh.*, ph.nombre_plan, ph.precio_mensual, ph.descripcion
            FROM suscripciones_herramientas sh
            INNER JOIN planes_herramientas ph ON sh.id_plan = ph.id_plan
            WHERE sh.id_suscripcion = %s
        """, (id_suscripcion,))
        return {"ok": True, "suscripcion": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al suscribir tienda {id_tienda} al plan {id_plan}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def cancelar_suscripcion_herramientas(id_tienda: int):
    """Cancela la suscripción activa de herramientas de una tienda."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE suscripciones_herramientas SET estado = 'Cancelada' WHERE id_tienda = %s AND estado = 'Activa'",
            (id_tienda,)
        )
        db.commit()
        if cursor.rowcount == 0:
            return {"ok": False, "error": "No tienes suscripción activa para cancelar"}
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al cancelar suscripción de tienda {id_tienda}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
