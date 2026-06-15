from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter(prefix="/api")


@router.get("/stored/libros")
def listar_libros_sp():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.callproc("sp_listar_libros_disponibles")

        results = []

        for result in cursor.stored_results():
            results = result.fetchall()

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
                t.nombre_tienda
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