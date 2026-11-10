from fastapi import APIRouter, HTTPException, Query
from app.database import get_db

router = APIRouter(prefix="/api")


@router.get("/stored/libros")
def listar_libros_sp(limite: int = Query(12, ge=1, le=50)):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                l.id_libro,
                l.id_tienda,
                l.titulo,
                l.autor_libro,
                l.descripcion_libro AS descripcion,
                l.isbn,
                l.estado_libro AS estado,
                c.nombre_categoria,
                t.nombre_tienda,
                u.correo_usuario AS email_vendedor,
                l.precio_libro,
                l.stock,
                l.oculto,
                (SELECT ROUND(AVG(r.calificacion), 1) FROM resenas_libros r WHERE r.id_libro = l.id_libro) AS promedio_calificacion,
                (SELECT COUNT(r.id_resena) FROM resenas_libros r WHERE r.id_libro = l.id_libro) AS total_resenas,
                (SELECT url_imagen FROM imagenes_libro
                 WHERE id_libro = l.id_libro
                 ORDER BY es_principal DESC, id_imagen ASC
                 LIMIT 1) AS imagen
            FROM libros l
            INNER JOIN categorias c ON l.id_categoria = c.id_categoria
            INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
            INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
            WHERE l.oculto = 0 AND l.stock > 0
            ORDER BY l.fecha_listado DESC
            LIMIT %s
        """, (limite,))

        results = cursor.fetchall()

        cursor.close()
        conn.close()

        return results

    except Exception as e:
        print("Error:", e)
        raise HTTPException(
            status_code=500,
            detail="Error al ejecutar stored procedure"
        )


@router.get("/stored/libros/{id_libro}")
def obtener_libro(id_libro: int):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                l.*,
                c.nombre_categoria,
                t.nombre_tienda,
                (SELECT url_imagen FROM imagenes_libro
                 WHERE id_libro = l.id_libro
                 ORDER BY id_imagen ASC LIMIT 1) AS imagen_url
            FROM libros l
            INNER JOIN categorias c
                ON l.id_categoria = c.id_categoria
            INNER JOIN tiendas t
                ON l.id_tienda = t.id_tienda
            WHERE l.id_libro = %s
        """, (id_libro,))

        libro = cursor.fetchone()

        cursor.close()
        conn.close()

        if not libro:
            raise HTTPException(
                status_code=404,
                detail="Libro no encontrado"
            )

        return libro

    except HTTPException:
        raise

    except Exception as e:
        print("Error:", e)
        raise HTTPException(
            status_code=500,
            detail="Error al obtener libro"
        )


@router.get("/mis-libros/{id_usuario}")
def mis_libros(id_usuario: int):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                l.*,
                c.nombre_categoria,
                t.nombre_tienda
            FROM libros l
            INNER JOIN categorias c
                ON l.id_categoria = c.id_categoria
            INNER JOIN tiendas t
                ON l.id_tienda = t.id_tienda
            WHERE t.id_usuario = %s
            ORDER BY l.fecha_listado DESC
        """, (id_usuario,))

        libros = cursor.fetchall()

        cursor.close()
        conn.close()

        return libros

    except Exception as e:
        print("Error:", e)
        return []