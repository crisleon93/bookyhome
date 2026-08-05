from app.database import get_db

def guardar_push_token(id_usuario: int, token: str):
    """Guarda o actualiza el token de un dispositivo para un usuario."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO push_tokens (id_usuario, expo_push_token)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE actualizado_en = NOW()
        """, (id_usuario, token))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()

def obtener_tokens_usuario(id_usuario: int) -> list[str]:
    """Devuelve todos los tokens Expo activos de un usuario."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT expo_push_token FROM push_tokens WHERE id_usuario = %s",
            (id_usuario,)
        )
        filas = cursor.fetchall()
        return [f["expo_push_token"] for f in filas]
    finally:
        cursor.close()
        db.close()

def eliminar_push_token(token: str):
    """Elimina un token inválido (cuando Expo reporta DeviceNotRegistered)."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM push_tokens WHERE expo_push_token = %s", (token,))
        db.commit()
    finally:
        cursor.close()
        db.close()