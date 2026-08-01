import logging
from app.database import get_db


def obtener_tipos_impulso():
    """Retorna todos los tipos de impulso activos disponibles para contratar."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT t.id_tipo_impulso, t.nombre, t.descripcion, t.precio, t.duracion_dias, t.tipo
            FROM tipos_impulso t
            INNER JOIN (
                SELECT MIN(id_tipo_impulso) AS id_tipo_impulso
                FROM tipos_impulso
                WHERE activo = 1
                GROUP BY tipo
            ) unicos ON t.id_tipo_impulso = unicos.id_tipo_impulso
            WHERE t.activo = 1
            ORDER BY t.precio ASC
        """)
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener tipos de impulso: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def obtener_impulsos_tienda(id_tienda: int):
    """Retorna todos los impulsos contratados por la tienda con sus métricas."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                ic.id_impulso, ic.id_tienda, ic.id_tipo_impulso,
                ic.id_libro, ic.id_categoria,
                ic.fecha_inicio, ic.fecha_fin,
                ic.monto_pagado, ic.estado,
                ic.impresiones, ic.clics, ic.ventas_generadas,
                ti.nombre AS nombre_impulso, ti.tipo, ti.duracion_dias,
                l.titulo AS titulo_libro
            FROM impulsos_contratados ic
            INNER JOIN tipos_impulso ti ON ic.id_tipo_impulso = ti.id_tipo_impulso
            LEFT JOIN libros l ON ic.id_libro = l.id_libro
            WHERE ic.id_tienda = %s
            ORDER BY ic.fecha_inicio DESC
        """, (id_tienda,))
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener impulsos de tienda {id_tienda}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def contratar_impulso(id_tienda: int, id_tipo_impulso: int, id_libro: int = None, id_categoria: int = None, descuento_pct: float = 0):
    """
    Contrata un impulso para la tienda.
    Aplica el descuento del plan de suscripción si corresponde.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que el tipo de impulso existe y está activo
        cursor.execute("""
            SELECT id_tipo_impulso, precio, duracion_dias, tipo
            FROM tipos_impulso
            WHERE id_tipo_impulso = %s AND activo = 1
        """, (id_tipo_impulso,))
        tipo = cursor.fetchone()
        if not tipo:
            return {"ok": False, "error": "Tipo de impulso no disponible"}

        # Validar que libro requerido (excepto tipo email/banner)
        if tipo["tipo"] in ("home", "libro_dia") and not id_libro:
            return {"ok": False, "error": "Este tipo de impulso requiere seleccionar un libro"}

        # Calcular monto con descuento del plan
        precio_base = float(tipo["precio"])
        descuento = descuento_pct / 100 if descuento_pct > 0 else 0
        monto_pagado = round(precio_base * (1 - descuento), 2)

        # Fechas
        cursor.execute("SELECT NOW() as ahora")
        ahora = cursor.fetchone()["ahora"]
        cursor.execute(f"SELECT DATE_ADD('{ahora}', INTERVAL {tipo['duracion_dias']} DAY) as fin")
        fecha_fin = cursor.fetchone()["fin"]

        cursor.execute("""
            INSERT INTO impulsos_contratados
                (id_tienda, id_tipo_impulso, id_libro, id_categoria, fecha_inicio, fecha_fin, monto_pagado, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Activo')
        """, (id_tienda, id_tipo_impulso, id_libro, id_categoria, ahora, fecha_fin, monto_pagado))
        db.commit()

        id_impulso = cursor.lastrowid
        cursor.execute("""
            SELECT ic.*, ti.nombre AS nombre_impulso, ti.tipo, l.titulo AS titulo_libro
            FROM impulsos_contratados ic
            INNER JOIN tipos_impulso ti ON ic.id_tipo_impulso = ti.id_tipo_impulso
            LEFT JOIN libros l ON ic.id_libro = l.id_libro
            WHERE ic.id_impulso = %s
        """, (id_impulso,))
        return {"ok": True, "impulso": cursor.fetchone(), "descuento_aplicado": descuento_pct}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al contratar impulso para tienda {id_tienda}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def cancelar_impulso(id_impulso: int, id_tienda: int):
    """Cancela un impulso activo de la tienda."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE impulsos_contratados SET estado = 'Cancelado'
            WHERE id_impulso = %s AND id_tienda = %s AND estado = 'Activo'
        """, (id_impulso, id_tienda))
        db.commit()
        if cursor.rowcount == 0:
            return {"ok": False, "error": "Impulso no encontrado o ya no está activo"}
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al cancelar impulso {id_impulso}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
