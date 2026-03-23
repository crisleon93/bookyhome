from app.database import get_db
from app.auth import hash_password, verify_password

# ===========================
# USUARIOS
# ===========================

def crear_usuario(nombre: str, email: str, password: str, rol: str = "usuario"):
    print("INTENTANDO CONECTAR A DB...")  # ← agregar
    db = get_db()
    print("CONECTADO A DB")  # ← agregar
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO usuarios 
               (nombre_usuario, correo_usuario, contraseña_usuario, rol, fecha_registro) 
               VALUES (%s, %s, %s, %s, CURDATE())""",
            (nombre, email, hash_password(password), rol)
        )
        db.commit()
        return {"ok": True}
    except Exception as e:
        print(f"ERROR EN CREAR USUARIO: {e}")  # ← agregar esta línea
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()

def obtener_usuario_por_email(email: str):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM usuarios WHERE correo_usuario = %s", (email,)
    )
    user = cursor.fetchone()
    cursor.close()
    db.close()
    return user

def login_usuario(email: str, password: str):
    user = obtener_usuario_por_email(email)
    if not user:
        return None
    if not verify_password(password, user["contraseña_usuario"]):
        return None
    return user

# ===========================
# LIBRERÍAS
# ===========================

def crear_libreria(nombre: str, nombre_libreria: str, direccion: str, email: str, password: str):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO usuarios 
               (nombre_usuario, correo_usuario, contraseña_usuario, rol, fecha_registro) 
               VALUES (%s, %s, %s, %s, CURDATE())""",
            (nombre, email, hash_password(password), "vendedor")
        )
        id_usuario = cursor.lastrowid
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
        
def obtener_todos_usuarios():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario, nombre_usuario, correo_usuario, rol, fecha_registro FROM usuarios")
    usuarios = cursor.fetchall()
    cursor.close()
    db.close()
    return usuarios      