from app.database import get_db
from app.auth import hash_password

def crear_libreria(nombre, nombre_libreria, direccion, telefono, email, password):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            INSERT INTO usuarios
            (nombre_usuario, correo_usuario, contrasena_usuario, rol, fecha_registro)
            VALUES (%s, %s, %s, %s, CURDATE())
            """,
            (nombre, email, hash_password(password), "vendedor")
        )

        id_usuario = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO tiendas
            (id_usuario, nombre_tienda, direccion, telefono, fecha_creacion)
            VALUES (%s, %s, %s, %s, CURDATE())
            """,
            (id_usuario, nombre_libreria, direccion, telefono)
        )

        db.commit()

        return {"ok": True}

    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}

    finally:
        cursor.close()
        db.close()


def obtener_tiendas():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                id_tienda,
                nombre_tienda,
                direccion,
                telefono,
                fecha_creacion
            FROM tiendas
            ORDER BY id_tienda
        """)

        return cursor.fetchall()

    finally:
        cursor.close()
        db.close()


def actualizar_tienda(id_usuario: int, nombre_tienda: str, direccion: str, telefono: str):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE tiendas
            SET nombre_tienda = %s, direccion = %s, telefono = %s
            WHERE id_usuario = %s
        """, (nombre_tienda, direccion, telefono, id_usuario))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()