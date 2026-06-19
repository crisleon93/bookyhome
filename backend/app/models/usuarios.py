import os
from app.database import get_db
from app.auth import hash_password, verify_password

def crear_usuario(nombre: str, email: str, password: str, telefono: str, rol: str = "usuario"):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO usuarios 
               (nombre_usuario, correo_usuario, contrasena_usuario, telefono, rol, estado_usuario, fecha_registro) 
               VALUES (%s, %s, %s, %s, %s, 'Activo', CURDATE())""",
            (nombre, email, hash_password(password), telefono, rol)
        )
        db.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()

def obtener_usuario_por_email(email: str):
    db = get_db()
    cursor = db.cursor(dictionary=True) 
    try:
        query = """
            SELECT id_usuario, nombre_usuario, correo_usuario, contrasena_usuario, rol, estado_usuario 
            FROM usuarios 
            WHERE correo_usuario = %s
        """
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        return user
    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        cursor.close()
        db.close()

def login_usuario(email: str, password: str):
    user = obtener_usuario_por_email(email)
    if not user or not verify_password(password, user["contrasena_usuario"]):
        return None
    return user

def obtener_todos_usuarios():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario, nombre_usuario, correo_usuario, rol, fecha_registro FROM usuarios")
    usuarios = cursor.fetchall()
    cursor.close()
    db.close()
    return usuarios

def actualizar_password(id_usuario: str, nueva_password: str):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE usuarios SET contrasena_usuario = %s WHERE id_usuario = %s",
            (hash_password(nueva_password), int(id_usuario))
        )
        db.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()

def obtener_email_usuario(id_usuario: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT correo_usuario FROM usuarios WHERE id_usuario = %s", 
        (id_usuario,)
    )
    user = cursor.fetchone()
    cursor.close()
    db.close()
    return user["correo_usuario"] if user else None

def bloquear_usuario(id_usuario: int, bloqueado: bool):
    db = get_db()
    cursor = db.cursor()
    try:
        estado = 'Bloqueado' if bloqueado else 'Activo'
        cursor.execute(
            "UPDATE usuarios SET estado_usuario = %s WHERE id_usuario = %s",
            (estado, id_usuario)
        )
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()