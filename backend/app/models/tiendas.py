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
            (id_usuario, nombre_tienda, direccion, telefono, fecha_creacion, estado_tienda)
            VALUES (%s, %s, %s, %s, CURDATE(), 'activa')
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
                t.id_tienda,
                t.nombre_tienda,
                t.direccion,
                t.telefono,
                t.fecha_creacion,
                t.estado_tienda,
                u.correo_usuario AS email_contacto,
                u.nombre_usuario AS nombre_dueno
            FROM tiendas t
            JOIN usuarios u ON u.id_usuario = t.id_usuario
            ORDER BY t.id_tienda
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


def actualizar_estado_tienda(id_tienda: int, nuevo_estado: str):
    db = get_db()
    cursor = db.cursor()
    try:
        query = "UPDATE tiendas SET estado_tienda = %s WHERE id_tienda = %s"
        
        cursor.execute(query, (nuevo_estado, id_tienda))
        db.commit()
        
        return {"ok": True}
    except Exception as e:
        db.rollback()
        print(f"❌ Error interno en SQL: {e}", flush=True)
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
        
def obtener_tienda_por_usuario(id_usuario: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Usamos los nombres de columna reales de tu tabla tiendas
        query = """
            SELECT id_tienda, id_usuario, nombre_tienda, direccion, telefono, estado_tienda 
            FROM tiendas 
            WHERE id_usuario = %s
        """
        cursor.execute(query, (id_usuario,))
        return cursor.fetchone() # Retorna el diccionario o None si no existe
    except Exception as e:
        print(f"❌ Error al obtener tienda por usuario: {e}", flush=True)
        return None
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


def obtener_tienda_por_id(id_tienda: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM tiendas WHERE id_tienda = %s
        """, (id_tienda,))
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()