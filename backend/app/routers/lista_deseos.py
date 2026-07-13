from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import verify_token

router = APIRouter(prefix="/lista-deseos", tags=["Lista de Deseos"])
security = HTTPBearer()


class ListaDeseosCrear(BaseModel):
    nombre_lista: str
    publica: bool = False


class ListaDeseosActualizar(BaseModel):
    nombre_lista: Optional[str] = None
    publica: Optional[bool] = None


class LibroListaDeseosCrear(BaseModel):
    id_libro: int
    nota: Optional[str] = None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))


def _verificar_propiedad_lista(cursor, id_lista: int, user_id: int):
    cursor.execute(
        "SELECT id_lista, id_usuario, nombre_lista, publica, fecha_creacion FROM lista_deseos WHERE id_lista = %s AND id_usuario = %s",
        (id_lista, user_id),
    )
    lista = cursor.fetchone()
    if not lista:
        raise HTTPException(status_code=404, detail="Lista de deseos no encontrada")
    return lista


LIBRO_SELECT = """
    SELECT
        ldl.id_item,
        ldl.id_lista,
        ldl.id_libro,
        ldl.nota,
        ldl.fecha_agregado,
        l.titulo,
        l.autor_libro,
        l.descripcion_libro,
        l.precio_libro,
        l.stock,
        l.estado_libro,
        c.nombre_categoria,
        t.nombre_tienda,
        (SELECT url_imagen FROM imagenes_libro WHERE id_libro = l.id_libro LIMIT 1) AS imagen_url
    FROM lista_deseos_libros ldl
    INNER JOIN libros l ON ldl.id_libro = l.id_libro
    LEFT JOIN categorias c ON l.id_categoria = c.id_categoria
    LEFT JOIN tiendas t ON l.id_tienda = t.id_tienda
"""


@router.get("")
def listar_listas(user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                ld.id_lista,
                ld.id_usuario,
                ld.nombre_lista,
                ld.publica,
                ld.fecha_creacion,
                COUNT(ldl.id_item) AS total_libros
            FROM lista_deseos ld
            LEFT JOIN lista_deseos_libros ldl ON ld.id_lista = ldl.id_lista
            WHERE ld.id_usuario = %s
            GROUP BY ld.id_lista, ld.id_usuario, ld.nombre_lista, ld.publica, ld.fecha_creacion
            ORDER BY ld.fecha_creacion DESC
            """,
            (user_id,),
        )
        return cursor.fetchall() or []
    finally:
        cursor.close()
        db.close()


@router.post("")
def crear_lista(data: ListaDeseosCrear, user_id: int = Depends(get_current_user)):
    nombre = data.nombre_lista.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre de la lista es obligatorio")

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO lista_deseos (id_usuario, nombre_lista, publica) VALUES (%s, %s, %s)",
            (user_id, nombre, data.publica),
        )
        db.commit()
        id_lista = cursor.lastrowid
        cursor.execute(
            "SELECT id_lista, id_usuario, nombre_lista, publica, fecha_creacion FROM lista_deseos WHERE id_lista = %s",
            (id_lista,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()


@router.put("/{id_lista}")
def actualizar_lista(id_lista: int, data: ListaDeseosActualizar, user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        _verificar_propiedad_lista(cursor, id_lista, user_id)

        campos = []
        valores = []
        if data.nombre_lista is not None:
            nombre = data.nombre_lista.strip()
            if not nombre:
                raise HTTPException(status_code=400, detail="El nombre de la lista es obligatorio")
            campos.append("nombre_lista = %s")
            valores.append(nombre)
        if data.publica is not None:
            campos.append("publica = %s")
            valores.append(data.publica)

        if not campos:
            raise HTTPException(status_code=400, detail="No hay cambios para aplicar")

        valores.extend([id_lista, user_id])
        cursor.execute(
            f"UPDATE lista_deseos SET {', '.join(campos)} WHERE id_lista = %s AND id_usuario = %s",
            tuple(valores),
        )
        db.commit()
        cursor.execute(
            "SELECT id_lista, id_usuario, nombre_lista, publica, fecha_creacion FROM lista_deseos WHERE id_lista = %s",
            (id_lista,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()


@router.delete("/{id_lista}")
def eliminar_lista(id_lista: int, user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        _verificar_propiedad_lista(cursor, id_lista, user_id)
        cursor.execute("DELETE FROM lista_deseos_libros WHERE id_lista = %s", (id_lista,))
        cursor.execute("DELETE FROM lista_deseos WHERE id_lista = %s AND id_usuario = %s", (id_lista, user_id))
        db.commit()
        return {"ok": True, "mensaje": "Lista eliminada"}
    finally:
        cursor.close()
        db.close()


@router.get("/{id_lista}/libros")
def listar_libros_lista(id_lista: int, user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        _verificar_propiedad_lista(cursor, id_lista, user_id)
        cursor.execute(
            f"{LIBRO_SELECT} WHERE ldl.id_lista = %s ORDER BY ldl.fecha_agregado DESC",
            (id_lista,),
        )
        return cursor.fetchall() or []
    finally:
        cursor.close()
        db.close()


@router.post("/{id_lista}/libros")
def agregar_libro_lista(id_lista: int, data: LibroListaDeseosCrear, user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        _verificar_propiedad_lista(cursor, id_lista, user_id)

        cursor.execute("SELECT id_libro FROM libros WHERE id_libro = %s", (data.id_libro,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Libro no encontrado")

        cursor.execute(
            "SELECT id_item FROM lista_deseos_libros WHERE id_lista = %s AND id_libro = %s",
            (id_lista, data.id_libro),
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El libro ya está en esta lista")

        cursor.execute(
            "INSERT INTO lista_deseos_libros (id_lista, id_libro, nota) VALUES (%s, %s, %s)",
            (id_lista, data.id_libro, data.nota),
        )
        db.commit()
        cursor.execute(
            f"{LIBRO_SELECT} WHERE ldl.id_lista = %s AND ldl.id_libro = %s",
            (id_lista, data.id_libro),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()


@router.delete("/{id_lista}/libros/{id_libro}")
def eliminar_libro_lista(id_lista: int, id_libro: int, user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        _verificar_propiedad_lista(cursor, id_lista, user_id)
        cursor.execute(
            "DELETE FROM lista_deseos_libros WHERE id_lista = %s AND id_libro = %s",
            (id_lista, id_libro),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="El libro no está en esta lista")
        db.commit()
        return {"ok": True, "mensaje": "Libro eliminado de la lista"}
    finally:
        cursor.close()
        db.close()
