from app.database import get_db
from datetime import date

# ──────────────────────────────────────────────
#  CREAR LIBRO
# ──────────────────────────────────────────────
def crear_libro(id_tienda: int, id_categoria: int, titulo: str, autor: str,
                descripcion: str, precio: float, stock: int, estado: str):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO libros (id_tienda, id_categoria, titulo, autor_libro,
                                descripcion_libro, precio_libro, stock,
                                estado_libro, fecha_publicacion, fecha_listado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            id_tienda, id_categoria, titulo, autor,
            descripcion, precio, stock,
            estado, date.today(), date.today()
        ))
        db.commit()
        return {"ok": True, "id_libro": cursor.lastrowid}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  AGREGAR IMAGEN AL LIBRO
# ──────────────────────────────────────────────
def agregar_imagen_libro(id_libro: int, url_imagen: str):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO imagenes_libro (id_libro, url_imagen)
            VALUES (%s, %s)
        """, (id_libro, url_imagen))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  OBTENER LIBROS DE UNA TIENDA
# ──────────────────────────────────────────────
def obtener_libros_por_tienda(id_tienda: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT l.*, c.nombre_categoria,
                   GROUP_CONCAT(i.url_imagen) AS imagenes
            FROM libros l
            LEFT JOIN categorias c ON l.id_categoria = c.id_categoria
            LEFT JOIN imagenes_libro i ON l.id_libro = i.id_libro
            WHERE l.id_tienda = %s
            GROUP BY l.id_libro
            ORDER BY l.fecha_listado DESC
        """, (id_tienda,))
        libros = cursor.fetchall()
        # Convertir imagenes de string CSV a lista
        for libro in libros:
            libro["imagenes"] = libro["imagenes"].split(",") if libro["imagenes"] else []
        return libros
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  OBTENER TIENDA DEL USUARIO AUTENTICADO
# ──────────────────────────────────────────────
def obtener_tienda_por_usuario(id_usuario: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM tiendas WHERE id_usuario = %s LIMIT 1
        """, (id_usuario,))
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  OBTENER TODAS LAS CATEGORÍAS
# ──────────────────────────────────────────────
def obtener_categorias():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM categorias ORDER BY nombre_categoria")
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  EDITAR LIBRO
# ──────────────────────────────────────────────
def editar_libro(id_libro: int, id_tienda: int, id_categoria: int, titulo: str,
                 autor: str, descripcion: str, precio: float, stock: int, estado: str):
    db = get_db()
    cursor = db.cursor()
    try:
        # Verificar que el libro pertenece a la tienda del vendedor
        cursor.execute("SELECT id_tienda FROM libros WHERE id_libro = %s", (id_libro,))
        row = cursor.fetchone()
        if not row or row[0] != id_tienda:
            return {"ok": False, "error": "No autorizado"}

        cursor.execute("""
            UPDATE libros
            SET id_categoria = %s, titulo = %s, autor_libro = %s,
                descripcion_libro = %s, precio_libro = %s,
                stock = %s, estado_libro = %s
            WHERE id_libro = %s
        """, (id_categoria, titulo, autor, descripcion, precio, stock, estado, id_libro))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  ELIMINAR LIBRO
# ──────────────────────────────────────────────
def eliminar_libro(id_libro: int, id_tienda: int):
    db = get_db()
    cursor = db.cursor()
    try:
        # Verificar que el libro pertenece a la tienda
        cursor.execute("SELECT id_tienda FROM libros WHERE id_libro = %s", (id_libro,))
        row = cursor.fetchone()
        if not row or row[0] != id_tienda:
            return {"ok": False, "error": "No autorizado"}

        # Eliminar imágenes primero (FK)
        cursor.execute("DELETE FROM imagenes_libro WHERE id_libro = %s", (id_libro,))
        cursor.execute("DELETE FROM libros WHERE id_libro = %s", (id_libro,))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  ACTUALIZAR STOCK
# ──────────────────────────────────────────────
def actualizar_stock(id_libro: int, id_tienda: int, nuevo_stock: int):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT id_tienda FROM libros WHERE id_libro = %s", (id_libro,))
        row = cursor.fetchone()
        if not row or row[0] != id_tienda:
            return {"ok": False, "error": "No autorizado"}

        cursor.execute("UPDATE libros SET stock = %s WHERE id_libro = %s", (nuevo_stock, id_libro))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  STATS DE VENTAS DEL VENDEDOR
# ──────────────────────────────────────────────
def obtener_stats_ventas(id_tienda: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Total vendido hoy
        cursor.execute("""
            SELECT COALESCE(SUM(d.precio_final * d.cantidad), 0) AS total_hoy,
                   COUNT(DISTINCT o.id_orden) AS ordenes_hoy
            FROM detalle_orden d
            JOIN libros l ON d.id_libro = l.id_libro
            JOIN ordenes_compra o ON d.id_orden = o.id_orden
            WHERE l.id_tienda = %s
              AND DATE(o.fecha_orden) = CURDATE()
              AND o.estado_orden NOT IN ('cancelada', 'rechazada')
        """, (id_tienda,))
        hoy = cursor.fetchone()

        # Total vendido este mes
        cursor.execute("""
            SELECT COALESCE(SUM(d.precio_final * d.cantidad), 0) AS total_mes,
                   COUNT(DISTINCT o.id_orden) AS ordenes_mes
            FROM detalle_orden d
            JOIN libros l ON d.id_libro = l.id_libro
            JOIN ordenes_compra o ON d.id_orden = o.id_orden
            WHERE l.id_tienda = %s
              AND MONTH(o.fecha_orden) = MONTH(CURDATE())
              AND YEAR(o.fecha_orden)  = YEAR(CURDATE())
              AND o.estado_orden NOT IN ('cancelada', 'rechazada')
        """, (id_tienda,))
        mes = cursor.fetchone()

        # Total vendido esta semana
        cursor.execute("""
            SELECT COALESCE(SUM(d.precio_final * d.cantidad), 0) AS total_semana
            FROM detalle_orden d
            JOIN libros l ON d.id_libro = l.id_libro
            JOIN ordenes_compra o ON d.id_orden = o.id_orden
            WHERE l.id_tienda = %s
              AND YEARWEEK(o.fecha_orden, 1) = YEARWEEK(CURDATE(), 1)
              AND o.estado_orden NOT IN ('cancelada', 'rechazada')
        """, (id_tienda,))
        semana = cursor.fetchone()

        return {
            "total_hoy":      float(hoy["total_hoy"]),
            "ordenes_hoy":    int(hoy["ordenes_hoy"]),
            "total_semana":   float(semana["total_semana"]),
            "total_mes":      float(mes["total_mes"]),
            "ordenes_mes":    int(mes["ordenes_mes"]),
        }
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  TOP 5 LIBROS MÁS VENDIDOS
# ──────────────────────────────────────────────
def obtener_top_vendidos(id_tienda: int, limite: int = 5):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT l.id_libro, l.titulo, l.autor_libro, l.precio_libro,
                   l.estado_libro, c.nombre_categoria,
                   COALESCE(SUM(d.cantidad), 0)          AS unidades_vendidas,
                   COALESCE(SUM(d.precio_final * d.cantidad), 0) AS total_generado,
                   GROUP_CONCAT(DISTINCT i.url_imagen)   AS imagenes
            FROM libros l
            LEFT JOIN categorias c      ON l.id_categoria  = c.id_categoria
            LEFT JOIN imagenes_libro i  ON l.id_libro      = i.id_libro
            LEFT JOIN detalle_orden d   ON l.id_libro      = d.id_libro
            LEFT JOIN ordenes_compra o  ON d.id_orden      = o.id_orden
                AND o.estado_orden NOT IN ('cancelada', 'rechazada')
            WHERE l.id_tienda = %s
            GROUP BY l.id_libro
            ORDER BY unidades_vendidas DESC
            LIMIT %s
        """, (id_tienda, limite))
        libros = cursor.fetchall()
        for libro in libros:
            libro["imagenes"] = libro["imagenes"].split(",") if libro["imagenes"] else []
            libro["unidades_vendidas"] = int(libro["unidades_vendidas"])
            libro["total_generado"]    = float(libro["total_generado"])
        return libros
    finally:
        cursor.close()
        db.close()
    
# ──────────────────────────────────────────────
#  VALIDAR DISPONIBILIDAD 
#  Verifica que haya stock suficiente antes de comprar
# ──────────────────────────────────────────────
def validar_disponibilidad(id_libro: int, cantidad: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT titulo, stock
            FROM libros
            WHERE id_libro = %s
        """, (id_libro,))
        libro = cursor.fetchone()

        if not libro:
            return {"disponible": False, "error": "Libro no encontrado"}

        if libro["stock"] <= 0:
            return {"disponible": False, "error": "Este libro no tiene stock disponible", "stock_actual": 0}

        if libro["stock"] < cantidad:
            return {
                "disponible": False,
                "error": f"Solo hay {libro['stock']} unidad(es) disponible(s)",
                "stock_actual": libro["stock"]
            }

        return {"disponible": True, "stock_actual": libro["stock"], "titulo": libro["titulo"]}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  DESCONTAR STOCK AL CONFIRMAR COMPRA 
# ──────────────────────────────────────────────
def descontar_stock(id_libro: int, cantidad: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Bloquea la fila mientras hace la operación
        # para evitar que dos compras simultáneas
        # descuenten el mismo stock (race condition)
        cursor.execute("""
            SELECT stock FROM libros
            WHERE id_libro = %s
            FOR UPDATE
        """, (id_libro,))
        libro = cursor.fetchone()

        if not libro:
            return {"ok": False, "error": "Libro no encontrado"}

        if libro["stock"] < cantidad:
            return {
                "ok": False,
                "error": f"Stock insuficiente. Disponible: {libro['stock']}, solicitado: {cantidad}"
            }

        cursor.execute("""
            UPDATE libros
            SET stock = stock - %s
            WHERE id_libro = %s
        """, (cantidad, id_libro))
        db.commit()

        return {"ok": True, "stock_restante": libro["stock"] - cantidad}

    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  ALERTAS DE STOCK BAJO
#  Lee la vista vista_alerta_stock
#  Umbral por defecto: libros con stock <= 3
# ──────────────────────────────────────────────
def obtener_alertas_stock(id_tienda: int, umbral: int = 3):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT v.titulo, v.nombre_tienda, v.stock
            FROM vista_alerta_stock v
            JOIN libros l ON l.titulo = v.titulo
            JOIN tiendas t ON t.nombre_tienda = v.nombre_tienda
            WHERE t.id_tienda = %s
              AND v.stock <= %s
            ORDER BY v.stock ASC
        """, (id_tienda, umbral))
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()