from app.database import get_db
from datetime import datetime


# ──────────────────────────────────────────────
#  CREAR OFERTA
# ──────────────────────────────────────────────
def crear_oferta(id_tienda: int, nombre: str, tipo: str,
                 valor: float, fecha_inicio: str, fecha_fin: str):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO ofertas
              (id_tienda, nombre_oferta, tipo_descuento,
               valor_descuento, fecha_inicio, fecha_fin)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (id_tienda, nombre, tipo, valor, fecha_inicio, fecha_fin))
        db.commit()
        return {"ok": True, "id_oferta": cursor.lastrowid}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  ASIGNAR LIBROS A UNA OFERTA
#  Recibe lista de id_libro y los vincula
# ──────────────────────────────────────────────
def asignar_libros_oferta(id_oferta: int, ids_libros: list[int]):
    db = get_db()
    cursor = db.cursor()
    try:
        # Elimina asignaciones previas para re-asignar limpio
        cursor.execute("DELETE FROM oferta_libros WHERE id_oferta = %s", (id_oferta,))
        for id_libro in ids_libros:
            cursor.execute("""
                INSERT INTO oferta_libros (id_oferta, id_libro)
                VALUES (%s, %s)
            """, (id_oferta, id_libro))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  OBTENER TODAS LAS OFERTAS DE UNA TIENDA
#  Incluye estado calculado: activa/proxima/vencida
# ──────────────────────────────────────────────
def obtener_ofertas_tienda(id_tienda: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT o.*,
                   COUNT(ol.id_libro) AS total_libros,
                   CASE
                     WHEN NOW() BETWEEN o.fecha_inicio AND o.fecha_fin THEN 'activa'
                     WHEN o.fecha_inicio > NOW()                       THEN 'proxima'
                     ELSE                                                   'vencida'
                   END AS estado
            FROM ofertas o
            LEFT JOIN oferta_libros ol ON o.id_oferta = ol.id_oferta
            WHERE o.id_tienda = %s
            GROUP BY o.id_oferta, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
            ORDER BY o.fecha_inicio DESC
        """, (id_tienda,))
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  OBTENER UNA OFERTA CON SUS LIBROS ASIGNADOS
# ──────────────────────────────────────────────
def obtener_oferta_detalle(id_oferta: int, id_tienda: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Datos de la oferta
        cursor.execute("""
            SELECT o.*,
                   CASE
                     WHEN NOW() BETWEEN o.fecha_inicio AND o.fecha_fin THEN 'activa'
                     WHEN o.fecha_inicio > NOW()                       THEN 'proxima'
                     ELSE                                                   'vencida'
                   END AS estado
            FROM ofertas o
            WHERE o.id_oferta = %s AND o.id_tienda = %s
        """, (id_oferta, id_tienda))
        oferta = cursor.fetchone()
        if not oferta:
            return None

        # Libros asignados a esta oferta
        cursor.execute("""
            SELECT l.id_libro, l.titulo, l.autor_libro,
                   l.precio_libro, l.stock,
                   GROUP_CONCAT(i.url_imagen) AS imagenes
            FROM oferta_libros ol
            JOIN libros l       ON ol.id_libro  = l.id_libro
            LEFT JOIN imagenes_libro i ON l.id_libro = i.id_libro
            WHERE ol.id_oferta = %s
            GROUP BY l.id_libro, l.titulo, l.autor_libro, l.precio_libro, l.stock
        """, (id_oferta,))
        libros = cursor.fetchall()
        for libro in libros:
            libro["imagenes"] = libro["imagenes"].split(",") if libro["imagenes"] else []

        oferta["libros"] = libros
        return oferta
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  EDITAR OFERTA
# ──────────────────────────────────────────────
def editar_oferta(id_oferta: int, id_tienda: int, nombre: str,
                  tipo: str, valor: float, fecha_inicio: str, fecha_fin: str):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT id_tienda FROM ofertas WHERE id_oferta = %s", (id_oferta,))
        row = cursor.fetchone()
        if not row or row[0] != id_tienda:
            return {"ok": False, "error": "No autorizado"}

        cursor.execute("""
            UPDATE ofertas
            SET nombre_oferta   = %s,
                tipo_descuento  = %s,
                valor_descuento = %s,
                fecha_inicio    = %s,
                fecha_fin       = %s
            WHERE id_oferta = %s
        """, (nombre, tipo, valor, fecha_inicio, fecha_fin, id_oferta))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  ELIMINAR OFERTA
# ──────────────────────────────────────────────
def eliminar_oferta(id_oferta: int, id_tienda: int):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT id_tienda FROM ofertas WHERE id_oferta = %s", (id_oferta,))
        row = cursor.fetchone()
        if not row or row[0] != id_tienda:
            return {"ok": False, "error": "No autorizado"}

        # Eliminar libros vinculados primero (FK)
        cursor.execute("DELETE FROM oferta_libros WHERE id_oferta = %s", (id_oferta,))
        cursor.execute("DELETE FROM ofertas WHERE id_oferta = %s", (id_oferta,))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  CALCULAR PRECIO CON DESCUENTO
#  Usado por el endpoint que consulta el comprador
#  tipo: "porcentaje" | "fijo" | "especial"
#  especial = 2x1 (se calcula sobre cantidad >= 2)
# ──────────────────────────────────────────────
def calcular_precio_con_descuento(precio: float, tipo: str,
                                  valor: float, cantidad: int = 1):
    if tipo == "porcentaje":
        descuento = precio * (valor / 100)
        return round(precio - descuento, 2)

    elif tipo == "fijo":
        return round(max(0, precio - valor), 2)

    elif tipo == "especial":
        # 2x1: por cada 2 unidades, pagas 1
        # Ej: 4 libros a $10.000 = pagas 2 → $20.000 total
        pagadas = (cantidad // 2) + (cantidad % 2)
        total   = pagadas * precio
        return round(total / cantidad, 2)  # precio unitario efectivo

    return precio


# ──────────────────────────────────────────────
#  OFERTA ACTIVA DE UN LIBRO
# ──────────────────────────────────────────────
def obtener_oferta_activa_libro(id_libro: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT o.id_oferta, o.nombre_oferta,
                   o.tipo_descuento, o.valor_descuento,
                   o.fecha_fin,
                   l.precio_libro
            FROM oferta_libros ol
            JOIN ofertas o ON ol.id_oferta = o.id_oferta
            JOIN libros  l ON ol.id_libro  = l.id_libro
            WHERE ol.id_libro = %s
              AND NOW() BETWEEN o.fecha_inicio AND o.fecha_fin
            ORDER BY o.fecha_fin ASC
            LIMIT 1
        """, (id_libro,))
        oferta = cursor.fetchone()
        if not oferta:
            return None

        precio_original  = float(oferta["precio_libro"])
        precio_descuento = calcular_precio_con_descuento(
            precio_original,
            oferta["tipo_descuento"],
            float(oferta["valor_descuento"])
        )
        oferta["precio_original"]  = precio_original
        oferta["precio_descuento"] = precio_descuento
        oferta["ahorro"]           = round(precio_original - precio_descuento, 2)
        return oferta
    finally:
        cursor.close()
        db.close()