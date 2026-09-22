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


def obtener_impulsos_activos_publicos():
    """
    Retorna los libros e info de tiendas con impulsos activos y vigentes.
    Usado por el catálogo y el home para destacar libros impulsados.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                ic.id_impulso,
                ic.id_tienda,
                ic.id_libro,
                ic.id_categoria,
                ic.fecha_fin,
                ti.tipo         AS tipo_impulso,
                ti.nombre       AS nombre_impulso,
                l.titulo,
                l.autor_libro,
                l.precio_libro,
                l.stock,
                t.nombre_tienda,
                (SELECT url_imagen FROM imagenes_libro
                 WHERE id_libro = l.id_libro
                 ORDER BY es_principal DESC, id_imagen ASC LIMIT 1) AS imagen_url
            FROM impulsos_contratados ic
            INNER JOIN tipos_impulso ti ON ti.id_tipo_impulso = ic.id_tipo_impulso
            LEFT JOIN libros l ON l.id_libro = ic.id_libro
            LEFT JOIN tiendas t ON t.id_tienda = ic.id_tienda
            WHERE ic.estado = 'Activo'
              AND NOW() BETWEEN ic.fecha_inicio AND ic.fecha_fin
              AND ti.activo = 1
            ORDER BY ti.precio DESC, ic.fecha_inicio ASC
        """)
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener impulsos activos públicos: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def obtener_ids_libros_impulsados(tipo: str = None):
    """
    Retorna los id_libro de libros con impulso activo y vigente.
    Si tipo es 'home' o 'libro_dia' filtra por ese tipo.
    Usado por el catálogo para ordenar impulsados primero.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        tipo_filter = ""
        params = []
        if tipo:
            tipo_filter = "AND ti.tipo = %s"
            params.append(tipo)
        cursor.execute(f"""
            SELECT DISTINCT ic.id_libro
            FROM impulsos_contratados ic
            INNER JOIN tipos_impulso ti ON ti.id_tipo_impulso = ic.id_tipo_impulso
            WHERE ic.estado = 'Activo'
              AND NOW() BETWEEN ic.fecha_inicio AND ic.fecha_fin
              AND ic.id_libro IS NOT NULL
              AND ti.activo = 1
              {tipo_filter}
        """, params)
        rows = cursor.fetchall() or []
        return [r["id_libro"] for r in rows]
    except Exception as e:
        logging.error(f"Error al obtener ids de libros impulsados: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def registrar_impresion(id_impulso: int):
    """Incrementa el contador de impresiones de un impulso activo."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE impulsos_contratados
            SET impresiones = impresiones + 1
            WHERE id_impulso = %s AND estado = 'Activo'
        """, (id_impulso,))
        db.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logging.error(f"Error registrando impresión del impulso {id_impulso}: {e}")
        return False
    finally:
        cursor.close()
        db.close()


def registrar_clic(id_impulso: int):
    """Incrementa el contador de clics de un impulso activo."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE impulsos_contratados
            SET clics = clics + 1
            WHERE id_impulso = %s AND estado = 'Activo'
        """, (id_impulso,))
        db.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logging.error(f"Error registrando clic del impulso {id_impulso}: {e}")
        return False
    finally:
        cursor.close()
        db.close()


def expirar_impulsos_vencidos():
    """
    Tarea programada: cambia a 'Finalizado' los impulsos cuya fecha_fin ya pasó.
    Retorna el número de impulsos expirados.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE impulsos_contratados
            SET estado = 'Finalizado'
            WHERE estado = 'Activo' AND fecha_fin < NOW()
        """)
        db.commit()
        expirados = cursor.rowcount
        if expirados > 0:
            logging.info(f"[impulsos] {expirados} impulso(s) expirado(s) y marcado(s) como Finalizado.")
        return expirados
    except Exception as e:
        db.rollback()
        logging.error(f"Error al expirar impulsos vencidos: {e}")
        return 0
    finally:
        cursor.close()
        db.close()
