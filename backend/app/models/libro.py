from app.database import get_db
from datetime import date
import re

# ──────────────────────────────────────────────
#  CREAR LIBRO
# ──────────────────────────────────────────────
def crear_libro(id_tienda: int, id_categoria: int, titulo: str, autor: str,
                descripcion: str, precio: float, stock: int, estado: str, isbn: str = None):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO libros (id_tienda, id_categoria, titulo, autor_libro, isbn,
                                descripcion_libro, precio_libro, stock,
                                estado_libro, fecha_publicacion, fecha_listado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            id_tienda, id_categoria, titulo, autor, isbn,
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
            GROUP BY l.id_libro, c.nombre_categoria
            ORDER BY l.fecha_listado DESC
        """, (id_tienda,))
        libros = cursor.fetchall()
        
        for libro in libros:
            if "oculto" in libro:
                libro["oculto"] = 1 if libro["oculto"] else 0
            libro["imagenes"] = libro["imagenes"].split(",") if libro["imagenes"] else []
        return libros
    finally:
        cursor.close()
        db.close()

def obtener_libros_visibles_por_tienda(id_tienda: int):
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
              AND l.oculto = 0  -- 🎯 CANDADO: Filtra para que NO salgan los ocultos en el catálogo
            GROUP BY l.id_libro, c.nombre_categoria
            ORDER BY l.fecha_listado DESC
        """, (id_tienda,))
        libros = cursor.fetchall()
        
        for libro in libros:
            libro["imagenes"] = libro["imagenes"].split(",") if libro["imagenes"] else []
        return libros
    finally:
        cursor.close()
        db.close()

# ──────────────────────────────────────────────
#  OBTENER LIBRO POR ID
# ──────────────────────────────────────────────
def obtener_libro_por_id(id_libro: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM libros WHERE id_libro = %s
        """, (id_libro,))
        return cursor.fetchone()
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
                 autor: str, descripcion: str, precio: float, stock: int, estado: str, isbn: str = None):
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
            SET id_categoria = %s, titulo = %s, autor_libro = %s, isbn = %s,
                descripcion_libro = %s, precio_libro = %s,
                stock = %s, estado_libro = %s
            WHERE id_libro = %s
        """, (id_categoria, titulo, autor, isbn, descripcion, precio, stock, estado, id_libro))
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
        cursor.execute("SELECT id_tienda FROM libros WHERE id_libro = %s", (id_libro,))
        row = cursor.fetchone()
        
        if not row:
            return {"ok": False, "error": "El libro no existe"}
            
        tienda_libro = row.get("id_tienda") if isinstance(row, dict) else row[0]
        
        if tienda_libro != id_tienda:
            return {"ok": False, "error": "No autorizado"}

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

def eliminar_libro_por_admin(id_libro: int):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "SELECT COUNT(*) FROM detalle_orden WHERE id_libro = %s", (id_libro,)
        )
        tiene_ordenes = cursor.fetchone()[0] > 0

        if tiene_ordenes:
            cursor.execute(
                "UPDATE libros SET oculto = 1 WHERE id_libro = %s", (id_libro,)
            )
            db.commit()
            return {
                "ok": True,
                "modo": "ocultado",
                "mensaje": "El libro tiene compras registradas, no se puede eliminar. Se ha ocultado permanentemente."
            }

        # Sin órdenes asociadas: se puede eliminar físicamente sin riesgo
        cursor.execute("DELETE FROM carrito_compras WHERE id_libro = %s", (id_libro,))
        cursor.execute("DELETE FROM oferta_libros WHERE id_libro = %s", (id_libro,))
        cursor.execute("DELETE FROM imagenes_libro WHERE id_libro = %s", (id_libro,))
        cursor.execute("DELETE FROM libros WHERE id_libro = %s", (id_libro,))
        db.commit()
        return {"ok": True, "modo": "eliminado"}

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
            GROUP BY l.id_libro, l.titulo, l.autor_libro, l.precio_libro, l.estado_libro, c.nombre_categoria
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

# ──────────────────────────────────────────────
#  OCULTAR / MOSTRAR LIBRO (admin)
# ──────────────────────────────────────────────
def ocultar_libro(id_libro: int, ocultar_estado: bool, id_tienda: int = None):
    db = get_db()
    cursor = db.cursor()
    try:
        # Convertimos el booleano (True/False) al entero que entiende MySQL (1/0)
        valor_oculto = 1 if ocultar_estado else 0
        
        # Si se pasa id_tienda, es un vendedor y aseguramos que el libro sea suyo
        if id_tienda is not None and id_tienda != 0:
            query = "UPDATE libros SET oculto = %s WHERE id_libro = %s AND id_tienda = %s"
            cursor.execute(query, (valor_oculto, id_libro, id_tienda))
        else:
            # Si no hay id_tienda, es el administrador modificando el catálogo global
            query = "UPDATE libros SET oculto = %s WHERE id_libro = %s"
            cursor.execute(query, (valor_oculto, id_libro))
            
        db.commit()
        
        # Si no se afectó ninguna fila, es porque el libro no existe o el id_tienda no coincide
        if cursor.rowcount == 0:
            return {"ok": False, "error": "El libro no existe o no tienes permisos sobre él"}
            
        return {"ok": True}
    except Exception as e:
        db.rollback()
        print(f"❌ Error en SQL ocultar_libro: {e}", flush=True)
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()

# ──────────────────────────────────────────────
#  VENDEDOR - PEDIDOS Y VENTAS DESDE MYSQL
# ──────────────────────────────────────────────
def obtener_pedidos_tienda(id_tienda: int):
    """
    Devuelve los pedidos que contienen al menos un libro de la tienda indicada.
    La fuente de verdad es MySQL: ordenes_compra → detalle_orden → libros,
    filtrando por libros.id_tienda. Esto garantiza que cada vendedor solo
    vea los pedidos que realmente le pertenecen.
    """
    from app.models.envios import EMPRESAS_MENSAJERIA, limpiar_envios_no_pagados
    limpiar_envios_no_pagados()

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Traer todos los ítems de órdenes que corresponden a libros de esta tienda,
        # junto con los datos del comprador y la orden.
        cursor.execute("""
            SELECT
                oc.id_orden,
                oc.fecha_orden            AS fecha,
                oc.estado_orden           AS estado,
                oc.total                  AS total_orden,
                oc.id_usuario             AS id_comprador,
                u.nombre_usuario          AS cliente,
                u.correo_usuario          AS correo_cliente,
                u.foto_perfil             AS foto_perfil_cliente,
                do.id_libro,
                do.cantidad,
                do.precio_unitario        AS precio_libro,
                do.porcentaje_descuento,
                do.precio_final,
                l.titulo,
                l.autor_libro,
                (SELECT url_imagen
                 FROM imagenes_libro
                 WHERE id_libro = l.id_libro AND es_principal = 1
                 LIMIT 1)                 AS imagen
            FROM ordenes_compra oc
            JOIN detalle_orden   do ON do.id_orden  = oc.id_orden
            JOIN libros          l  ON l.id_libro   = do.id_libro
            JOIN usuarios        u  ON u.id_usuario = oc.id_usuario
            WHERE l.id_tienda = %s
            ORDER BY oc.fecha_orden DESC
        """, (id_tienda,))
        filas = cursor.fetchall()

        # Consultar envíos registrados para las órdenes de esta tienda.
        # La tabla envios ya tiene id_tienda, no se necesita JOIN adicional.
        cursor.execute("""
            SELECT id_orden, estado_envio, numero_guia,
                   empresa_mensajeria, id_empresa,
                   fecha_estimada_entrega, costo_envio
            FROM envios
            WHERE id_tienda = %s
        """, (id_tienda,))
        envios_map = {row["id_orden"]: row for row in cursor.fetchall()}

    finally:
        cursor.close()
        db.close()

    # Agrupar filas por id_orden
    ordenes: dict = {}
    for fila in filas:
        id_orden = fila["id_orden"]
        if id_orden not in ordenes:
            ordenes[id_orden] = {
                "id_orden":       id_orden,
                "id_orden_unico": f"{fila['id_comprador']}-{id_orden}",
                "codigo_compra":  f"BH-{fila['id_comprador']}-{id_orden}",
                "id_comprador":   fila["id_comprador"],
                "fecha":          fila["fecha"].isoformat() if hasattr(fila["fecha"], "isoformat") else fila["fecha"],
                "estado":         fila["estado"],
                "cliente":        fila["cliente"],
                "correo_cliente": fila["correo_cliente"],
                "foto_perfil_cliente": fila["foto_perfil_cliente"],
                "items":          [],
                "total_tienda":   0.0,
                "total_orden":    float(fila["total_orden"] or 0),
                "envio":          None,
            }

        precio = float(fila["precio_libro"] or 0)
        cant   = int(fila["cantidad"] or 1)
        ordenes[id_orden]["items"].append({
            "id_libro":   fila["id_libro"],
            "titulo":     fila["titulo"],
            "autor_libro": fila["autor_libro"],
            "precio_libro": precio,
            "cantidad":   cant,
            "imagen":     fila["imagen"],
        })
        ordenes[id_orden]["total_tienda"] += precio * cant

    # Mantener visible la guía durante todo el ciclo posterior al pago.
    for id_orden, pedido in ordenes.items():
        if str(pedido["estado"]).lower() in ("pagado", "enviado", "entregada") and id_orden in envios_map:
            e = envios_map[id_orden]
            empresa = next(
                (empresa for empresa in EMPRESAS_MENSAJERIA if empresa["id_empresa"] == e["id_empresa"]),
                {},
            )
            pedido["envio"] = {
                "id_empresa":             e["id_empresa"],
                "empresa_mensajeria":     e["empresa_mensajeria"],
                "sitio_web":              empresa.get("sitio_web"),
                "url_rastreo":            empresa.get("url_rastreo", empresa.get("sitio_web")),
                "numero_guia":            e["numero_guia"],
                "estado_envio":           e["estado_envio"],
                "fecha_estimada_entrega": str(e["fecha_estimada_entrega"]) if e["fecha_estimada_entrega"] else None,
                "costo_envio":            float(e["costo_envio"] or 0),
            }

    return sorted(ordenes.values(), key=lambda p: p.get("fecha", ""), reverse=True)

def obtener_ventas_tienda(id_tienda: int):
    pedidos = obtener_pedidos_tienda(id_tienda)
    ventas = []
    for p in pedidos:
        # El registro de ventas solo incluye órdenes pagadas, enviadas o
        # entregadas. Las pendientes y canceladas se gestionan desde Pedidos,
        # no desde Ventas.
        if str(p.get("estado", "")).lower() not in ("pagado", "enviado", "entregada"):
            continue
        for item in p["items"]:
            ventas.append({
                "id_orden": p["id_orden"],
                "fecha": p["fecha"],
                "estado": p["estado"],
                "cliente": p["cliente"],
                "correo_cliente": p["correo_cliente"],
                "id_libro": item["id_libro"],
                "titulo": item["titulo"],
                "autor_libro": item["autor_libro"],
                "imagen": item.get("imagen"),
                "foto_perfil_cliente": p.get("foto_perfil_cliente"),
                "precio_libro": item["precio_libro"],
                "cantidad": item["cantidad"],
                "total": item["precio_libro"] * item["cantidad"]
            })
    return ventas


# ──────────────────────────────────────────────
#  BUSCAR LIBRO POR ISBN
# ──────────────────────────────────────────────
def buscar_libro_por_isbn(isbn: str):
    """
    Busca libros por ISBN en todo el catálogo.
    Retorna una lista de libros con el mismo ISBN de diferentes vendedores,
    ordenados por precio ascendente para comparación.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT l.*, t.nombre_tienda, t.id_tienda, c.nombre_categoria,
                   GROUP_CONCAT(i.url_imagen) AS imagenes
            FROM libros l
            LEFT JOIN tiendas t ON l.id_tienda = t.id_tienda
            LEFT JOIN categorias c ON l.id_categoria = c.id_categoria
            LEFT JOIN imagenes_libro i ON l.id_libro = i.id_libro
            WHERE l.isbn = %s AND l.oculto = 0
            GROUP BY l.id_libro, t.nombre_tienda, c.nombre_categoria
            ORDER BY l.precio_libro ASC
        """, (isbn,))
        libros = cursor.fetchall()
        
        for libro in libros:
            libro["imagenes"] = libro["imagenes"].split(",") if libro["imagenes"] else []
        return libros
    except Exception as e:
        return []
    finally:
        cursor.close()
        db.close()


# ──────────────────────────────────────────────
#  VALIDAR Y NORMALIZAR ISBN
# ──────────────────────────────────────────────
def validar_y_normalizar_isbn(isbn: str) -> str:
    """
    Valida y normaliza un ISBN (elimina guiones y espacios).
    Soporta ISBN-10 e ISBN-13.
    Retorna el ISBN normalizado o None si es inválido.
    """
    if not isbn:
        return None
    
    # Eliminar guiones y espacios
    isbn_limpio = re.sub(r'[-\s]', '', isbn.upper())
    
    # Validar formato ISBN-10 o ISBN-13
    if len(isbn_limpio) == 10:
        # ISBN-10: 9 dígitos + X o dígito de verificación
        if not re.match(r'^\d{9}[\dX]$', isbn_limpio):
            return None
    elif len(isbn_limpio) == 13:
        # ISBN-13: 13 dígitos
        if not re.match(r'^\d{13}$', isbn_limpio):
            return None
    else:
        return None
    
    return isbn_limpio
