from app.database import get_db  

def obtener_carrito(id_usuario):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT * FROM vista_carrito_usuario
    WHERE id_usuario = %s
    """

    cursor.execute(query, (id_usuario,))
    data = cursor.fetchall()

    conn.close()
    return data