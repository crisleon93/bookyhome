import logging
from app.database import get_db

# ========================
# Lista de Deseos
# ========================

def obtener_listas_usuario(id_usuario: int):
    """Retorna todas las listas de deseos de un usuario con el conteo de libros."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                ld.id_lista,
                ld.id_usuario,
                ld.nombre_lista,
                ld.publica,
                ld.fecha_creacion,
                COUNT(ldl.id_item) AS total_libros
            FROM lista_deseos ld
            LEFT JOIN lista_deseos_libros ldl ON ld.id_lista = ldl.id_lista
            WHERE ld.id_usuario = %s
            GROUP BY ld.id_lista, ld.id_usuario, ld.nombre_lista, ld.publica, ld.fecha_creacion
            ORDER BY ld.fecha_creacion DESC
        """, (id_usuario,))
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener listas de deseos del usuario {id_usuario}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def crear_lista_deseos(id_usuario: int, nombre_lista: str, publica: bool = False):
    """Crea una nueva lista de deseos y retorna el registro creado."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO lista_deseos (id_usuario, nombre_lista, publica) VALUES (%s, %s, %s)",
            (id_usuario, nombre_lista.strip(), publica)
        )
        db.commit()
        id_lista = cursor.lastrowid
        cursor.execute(
            "SELECT id_lista, id_usuario, nombre_lista, publica, fecha_creacion FROM lista_deseos WHERE id_lista = %s",
            (id_lista,)
        )
        return {"ok": True, "lista": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al crear lista de deseos: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def actualizar_lista_deseos(id_lista: int, id_usuario: int, datos: dict):
    """Actualiza nombre o visibilidad de una lista de deseos."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        campos = []
        valores = []
        if "nombre_lista" in datos and datos["nombre_lista"]:
            campos.append("nombre_lista = %s")
            valores.append(datos["nombre_lista"].strip())
        if "publica" in datos:
            campos.append("publica = %s")
            valores.append(datos["publica"])

        if not campos:
            return {"ok": False, "error": "No hay campos para actualizar"}

        valores.extend([id_lista, id_usuario])
        cursor.execute(
            f"UPDATE lista_deseos SET {', '.join(campos)} WHERE id_lista = %s AND id_usuario = %s",
            tuple(valores)
        )
        db.commit()
        cursor.execute(
            "SELECT id_lista, id_usuario, nombre_lista, publica, fecha_creacion FROM lista_deseos WHERE id_lista = %s",
            (id_lista,)
        )
        return {"ok": True, "lista": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al actualizar lista {id_lista}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def eliminar_lista_deseos(id_lista: int, id_usuario: int):
    """Elimina una lista de deseos y todos sus libros asociados."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_lista FROM lista_deseos WHERE id_lista = %s AND id_usuario = %s", (id_lista, id_usuario))
        if not cursor.fetchone():
            return {"ok": False, "error": "Lista no encontrada"}
        cursor.execute("DELETE FROM lista_deseos_libros WHERE id_lista = %s", (id_lista,))
        cursor.execute("DELETE FROM lista_deseos WHERE id_lista = %s AND id_usuario = %s", (id_lista, id_usuario))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al eliminar lista {id_lista}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


# ========================
# Libros en Lista de Deseos
# ========================

_LIBRO_SELECT = """
    SELECT
        ldl.id_item, ldl.id_lista, ldl.id_libro, ldl.nota, ldl.fecha_agregado,
        l.titulo, l.autor_libro, l.descripcion_libro, l.precio_libro, l.stock, l.estado_libro,
        c.nombre_categoria, t.nombre_tienda,
        (SELECT url_imagen FROM imagenes_libro WHERE id_libro = l.id_libro LIMIT 1) AS imagen_url
    FROM lista_deseos_libros ldl
    INNER JOIN libros l ON ldl.id_libro = l.id_libro
    LEFT JOIN categorias c ON l.id_categoria = c.id_categoria
    LEFT JOIN tiendas t ON l.id_tienda = t.id_tienda
"""


def obtener_libros_lista(id_lista: int):
    """Retorna todos los libros de una lista de deseos."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(f"{_LIBRO_SELECT} WHERE ldl.id_lista = %s ORDER BY ldl.fecha_agregado DESC", (id_lista,))
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener libros de lista {id_lista}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def libro_en_lista(id_lista: int, id_libro: int) -> bool:
    """Verifica si un libro ya está en la lista de deseos."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "SELECT id_item FROM lista_deseos_libros WHERE id_lista = %s AND id_libro = %s",
            (id_lista, id_libro)
        )
        return cursor.fetchone() is not None
    finally:
        cursor.close()
        db.close()


def agregar_libro_lista(id_lista: int, id_libro: int, nota: str = None):
    """Agrega un libro a la lista de deseos."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO lista_deseos_libros (id_lista, id_libro, nota) VALUES (%s, %s, %s)",
            (id_lista, id_libro, nota)
        )
        db.commit()
        cursor.execute(f"{_LIBRO_SELECT} WHERE ldl.id_lista = %s AND ldl.id_libro = %s", (id_lista, id_libro))
        return {"ok": True, "item": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al agregar libro {id_libro} a lista {id_lista}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def quitar_libro_lista(id_lista: int, id_libro: int):
    """Quita un libro de la lista de deseos."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "DELETE FROM lista_deseos_libros WHERE id_lista = %s AND id_libro = %s",
            (id_lista, id_libro)
        )
        db.commit()
        return {"ok": cursor.rowcount > 0}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al quitar libro {id_libro} de lista {id_lista}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
