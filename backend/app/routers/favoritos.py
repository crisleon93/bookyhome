from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import verify_token
from app.database import get_db

router = APIRouter(prefix="/favoritos", tags=["Favoritos"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))


LIBRO_SELECT = """
    SELECT f.id_favorito, f.id_libro, f.fecha,
           l.titulo, l.autor_libro, l.descripcion_libro, l.precio_libro, l.stock,
           c.nombre_categoria, t.nombre_tienda,
           (SELECT url_imagen FROM imagenes_libro WHERE id_libro = l.id_libro LIMIT 1) AS imagen_url
    FROM favoritos f
    INNER JOIN libros l ON l.id_libro = f.id_libro
    LEFT JOIN categorias c ON c.id_categoria = l.id_categoria
    LEFT JOIN tiendas t ON t.id_tienda = l.id_tienda
"""


@router.get("")
def listar_favoritos(user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Migra la lista automática creada por versiones anteriores de la interfaz.
        # Desde ahora, los favoritos y las listas personalizadas son conceptos separados.
        cursor.execute(
            "SELECT id_lista FROM lista_deseos WHERE id_usuario = %s AND nombre_lista = %s AND publica = FALSE",
            (user_id, "Mis favoritos"),
        )
        listas_anteriores = cursor.fetchall() or []
        for lista in listas_anteriores:
            cursor.execute(
                "INSERT INTO favoritos (id_usuario, id_libro, fecha) "
                "SELECT %s, ldl.id_libro, CURDATE() FROM lista_deseos_libros ldl "
                "WHERE ldl.id_lista = %s AND NOT EXISTS ("
                "SELECT 1 FROM favoritos f WHERE f.id_usuario = %s AND f.id_libro = ldl.id_libro)",
                (user_id, lista["id_lista"], user_id),
            )
            cursor.execute("DELETE FROM lista_deseos_libros WHERE id_lista = %s", (lista["id_lista"],))
            cursor.execute("DELETE FROM lista_deseos WHERE id_lista = %s", (lista["id_lista"],))
        if listas_anteriores:
            db.commit()
        cursor.execute(f"{LIBRO_SELECT} WHERE f.id_usuario = %s ORDER BY f.id_favorito DESC", (user_id,))
        return cursor.fetchall() or []
    finally:
        cursor.close()
        db.close()


@router.post("/{id_libro}")
def agregar_favorito(id_libro: int, user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_libro FROM libros WHERE id_libro = %s", (id_libro,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Libro no encontrado")

        cursor.execute("SELECT id_favorito FROM favoritos WHERE id_usuario = %s AND id_libro = %s", (user_id, id_libro))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El libro ya está en favoritos")

        cursor.execute("INSERT INTO favoritos (id_usuario, id_libro, fecha) VALUES (%s, %s, CURDATE())", (user_id, id_libro))
        db.commit()
        return {"ok": True, "id_favorito": cursor.lastrowid}
    finally:
        cursor.close()
        db.close()


@router.delete("/{id_libro}")
def eliminar_favorito(id_libro: int, user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM favoritos WHERE id_usuario = %s AND id_libro = %s", (user_id, id_libro))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="El libro no está en favoritos")
        db.commit()
        return {"ok": True}
    finally:
        cursor.close()
        db.close()
