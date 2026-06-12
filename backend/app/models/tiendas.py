from app.database import get_db
from app.auth import hash_password

def crear_libreria(nombre, nombre_libreria, direccion, telefono, email, password):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # 1. Creamos el usuario con rol vendedor (CORREGIDA LA Ñ en contrasena_usuario)
        cursor.execute(
            """INSERT INTO usuarios 
               (nombre_usuario, correo_usuario, contrasena_usuario, rol, fecha_registro) 
               VALUES (%s, %s, %s, %s, CURDATE())""",
            (nombre, email, hash_password(password), "vendedor")
        )
        id_usuario = cursor.lastrowid
        
        # 2. Creamos la tienda ligada a ese ID (AGREGADO EL CAMPO TELEFONO)
        cursor.execute(
            """INSERT INTO tiendas 
               (id_usuario, nombre_tienda, direccion, telefono, fecha_creacion) 
               VALUES (%s, %s, %s, %s, CURDATE())""",
            (id_usuario, nombre_libreria, direccion, telefono)
        )
        
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback() # Buena práctica: deshace cambios si algo falla a mitad de camino
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()