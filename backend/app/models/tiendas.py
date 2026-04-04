from app.database import get_db
from app.auth import hash_password

def crear_libreria(nombre, nombre_libreria, direccion, email, password):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Primero creamos el usuario con rol vendedor
        cursor.execute(
            """INSERT INTO usuarios 
               (nombre_usuario, correo_usuario, contraseña_usuario, rol, fecha_registro) 
               VALUES (%s, %s, %s, %s, CURDATE())""",
            (nombre, email, hash_password(password), "vendedor")
        )
        id_usuario = cursor.lastrowid
        # Luego creamos la tienda ligada a ese ID
        cursor.execute(
            """INSERT INTO tiendas 
               (id_usuario, nombre_tienda, direccion, fecha_creacion) 
               VALUES (%s, %s, %s, CURDATE())""",
            (id_usuario, nombre_libreria, direccion)
        )
        db.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()