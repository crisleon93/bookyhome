import os
from app.database import get_db
from app.auth import hash_password, verify_password

# ========================
# Funciones de usuario
# ========================

def crear_usuario(nombre: str, email: str, password: str, telefono: str, rol: str = "usuario", token_verificacion: str = None):
    """Crea una cuenta nueva y guarda sus datos en la base de datos."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Intentar insertar con columnas de verificación de email
        try:
            cursor.execute(
                """INSERT INTO usuarios 
                   (nombre_usuario, correo_usuario, contrasena_usuario, telefono, rol, estado_usuario, email_verificado, token_verificacion, fecha_registro) 
                   VALUES (%s, %s, %s, %s, %s, 'Activo', FALSE, %s, CURDATE())""",
                (nombre, email, hash_password(password), telefono, rol, token_verificacion)
            )
        except Exception as insert_error:
            # Si falla por columnas faltantes, usar la estructura original
            if "Unknown column" in str(insert_error):
                cursor.execute(
                    """INSERT INTO usuarios 
                       (nombre_usuario, correo_usuario, contrasena_usuario, telefono, rol, estado_usuario, fecha_registro) 
                       VALUES (%s, %s, %s, %s, %s, 'Activo', CURDATE())""",
                    (nombre, email, hash_password(password), telefono, rol)
                )
            else:
                raise insert_error
        db.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()

def obtener_usuario_por_email(email: str):
    """Busca un usuario por su correo electrónico."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Intentar seleccionar con email_verificado
        try:
            query = """
                SELECT id_usuario, nombre_usuario, correo_usuario, contrasena_usuario, rol, estado_usuario, email_verificado
                FROM usuarios
                WHERE correo_usuario = %s
            """
            cursor.execute(query, (email,))
        except Exception as select_error:
            # Si falla por columnas faltantes, usar la estructura original
            if "Unknown column" in str(select_error):
                query = """
                    SELECT id_usuario, nombre_usuario, correo_usuario, contrasena_usuario, rol, estado_usuario
                    FROM usuarios
                    WHERE correo_usuario = %s
                """
                cursor.execute(query, (email,))
            else:
                raise select_error
        user = cursor.fetchone()
        # Si no tiene email_verificado, asumir que está verificado (compatibilidad)
        if user and "email_verificado" not in user:
            user["email_verificado"] = True
        return user
    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        cursor.close()
        db.close()


def obtener_usuario_por_id(id_usuario: int):
    """Busca un usuario por su ID y devuelve sus datos de rol y estado."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT id_usuario, nombre_usuario, correo_usuario, rol, estado_usuario
            FROM usuarios
            WHERE id_usuario = %s
        """
        cursor.execute(query, (id_usuario,))
        return cursor.fetchone()
    except Exception as e:
        print(f"Error al obtener usuario por id: {e}")
        return None
    finally:
        cursor.close()
        db.close()

def login_usuario(email: str, password: str):
    """Valida la contraseña de un usuario y devuelve sus datos si es correcto."""
    user = obtener_usuario_por_email(email)
    if not user or not verify_password(password, user["contrasena_usuario"]):
        return None
    return user

def obtener_todos_usuarios():
    """Recupera todos los usuarios registrados en el sistema."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario, nombre_usuario, correo_usuario, rol, telefono, foto_perfil, estado_usuario, email_verificado, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM usuarios ORDER BY id_usuario ASC")
    usuarios = cursor.fetchall()
    cursor.close()
    db.close()
    return usuarios

def actualizar_password(id_usuario: str, nueva_password: str):
    """Actualiza la contraseña de un usuario con hash seguro."""
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
    """Obtiene el correo de un usuario según su id."""
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
    """Cambia el estado del usuario entre Activo y Bloqueado."""
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

def verificar_email_usuario(token: str):
    """Verifica el correo de un usuario usando el token de verificación."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Intentar actualizar con columnas de verificación
        try:
            cursor.execute(
                "UPDATE usuarios SET email_verificado = TRUE, fecha_verificacion = CURDATE(), token_verificacion = NULL WHERE token_verificacion = %s",
                (token,)
            )
        except Exception as update_error:
            # Si falla por columnas faltantes, no hacer nada (compatibilidad)
            if "Unknown column" in str(update_error):
                # En modo compatibilidad, asumir que el email ya está verificado
                return {"ok": True, "modo_compatibilidad": True}
            else:
                raise update_error
        db.commit()
        if cursor.rowcount > 0:
            return {"ok": True}
        return {"ok": False, "error": "Token inválido o expirado"}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()

def obtener_usuario_por_token(token: str):
    """Busca un usuario por su token de verificación."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Intentar buscar con token_verificacion
        try:
            cursor.execute(
                "SELECT id_usuario, correo_usuario FROM usuarios WHERE token_verificacion = %s",
                (token,)
            )
        except Exception as select_error:
            # Si falla por columnas faltantes, retornar None (compatibilidad)
            if "Unknown column" in str(select_error):
                return None
            else:
                raise select_error
        user = cursor.fetchone()
        return user
    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        cursor.close()
        db.close()