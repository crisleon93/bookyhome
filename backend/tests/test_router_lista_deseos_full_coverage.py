from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
import app.routers.lista_deseos as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_get_current_user():
    creds = MagicMock(credentials="token")
    with patch("app.routers.lista_deseos.verify_token", return_value={"sub": "15"}):
        assert mod.get_current_user(creds) == 15

    with patch("app.routers.lista_deseos.verify_token", return_value=None):
        with pytest.raises(HTTPException) as exc:
            mod.get_current_user(creds)
        assert exc.value.status_code == 401


def test_verificar_propiedad_lista():
    db, cursor = _db()
    cursor.fetchone.return_value = None
    with pytest.raises(HTTPException) as exc404:
        mod._verificar_propiedad_lista(cursor, 1, 10)
    assert exc404.value.status_code == 404

    cursor.fetchone.return_value = {"id_lista": 1, "id_usuario": 10}
    assert mod._verificar_propiedad_lista(cursor, 1, 10) == {"id_lista": 1, "id_usuario": 10}


def test_listar_listas_and_crear_lista():
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_lista": 1, "nombre_lista": "Favoritos"}]
    with patch("app.routers.lista_deseos.get_db", return_value=db):
        res = mod.listar_listas(user_id=10)
        assert len(res) == 1

    # Crear lista con nombre vacio
    with pytest.raises(HTTPException) as exc_vacio:
        mod.crear_lista(mod.ListaDeseosCrear(nombre_lista="   ", publica=False), user_id=10)
    assert exc_vacio.value.status_code == 400

    # Crear lista exitoso
    cursor.lastrowid = 7
    cursor.fetchone.return_value = {"id_lista": 7, "nombre_lista": "Lectura"}
    with patch("app.routers.lista_deseos.get_db", return_value=db):
        created = mod.crear_lista(mod.ListaDeseosCrear(nombre_lista="Lectura", publica=True), user_id=10)
        assert created["id_lista"] == 7
        db.commit.assert_called_once()


def test_actualizar_lista():
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_lista": 1, "id_usuario": 10}, # verificar propiedad vacio
        {"id_lista": 1, "id_usuario": 10}, # verificar propiedad no fields
        {"id_lista": 1, "id_usuario": 10}, # verificar propiedad success
        {"id_lista": 1, "nombre_lista": "Nuevo", "publica": True}, # fetch updated
    ]

    with patch("app.routers.lista_deseos.get_db", return_value=db):
        # Empty name
        with pytest.raises(HTTPException) as exc_name:
            mod.actualizar_lista(1, mod.ListaDeseosActualizar(nombre_lista="   "), user_id=10)
        assert exc_name.value.status_code == 400

        # No fields
        with pytest.raises(HTTPException) as exc_nofields:
            mod.actualizar_lista(1, mod.ListaDeseosActualizar(), user_id=10)
        assert exc_nofields.value.status_code == 400

        # Success update
        res = mod.actualizar_lista(1, mod.ListaDeseosActualizar(nombre_lista="Nuevo", publica=True), user_id=10)
        assert res["nombre_lista"] == "Nuevo"
        db.commit.assert_called()


def test_eliminar_lista():
    db, cursor = _db()
    cursor.fetchone.return_value = {"id_lista": 5, "id_usuario": 10}

    with patch("app.routers.lista_deseos.get_db", return_value=db):
        res = mod.eliminar_lista(5, user_id=10)
        assert res == {"ok": True, "mensaje": "Lista eliminada"}
        db.commit.assert_called()


def test_listar_y_agregar_libros_lista():
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_lista": 5, "id_usuario": 10}, # verificar propiedad para listar
        {"id_lista": 5, "id_usuario": 10}, # verificar propiedad para agregar (not found)
        None, # libro no existe en libros
        {"id_lista": 5, "id_usuario": 10}, # verificar propiedad para agregar (duplicate)
        {"id_libro": 99}, # libro existe
        {"id_item": 1}, # libro ya esta en lista
        {"id_lista": 5, "id_usuario": 10}, # verificar propiedad para agregar (success)
        {"id_libro": 99}, # libro existe
        None, # libro no esta en lista
        {"id_item": 2, "id_libro": 99, "titulo": "Libro Agregado"}, # fetch agregado
    ]
    cursor.fetchall.return_value = [{"id_item": 1, "titulo": "Don Quijote"}]

    with patch("app.routers.lista_deseos.get_db", return_value=db):
        # Listar
        libros = mod.listar_libros_lista(5, user_id=10)
        assert len(libros) == 1

        # Agregar libro inexistente
        with pytest.raises(HTTPException) as exc_nofound:
            mod.agregar_libro_lista(5, mod.LibroListaDeseosCrear(id_libro=99), user_id=10)
        assert exc_nofound.value.status_code == 404

        # Agregar libro duplicado
        with pytest.raises(HTTPException) as exc_dup:
            mod.agregar_libro_lista(5, mod.LibroListaDeseosCrear(id_libro=99), user_id=10)
        assert exc_dup.value.status_code == 400

        # Agregar libro exitoso
        item = mod.agregar_libro_lista(5, mod.LibroListaDeseosCrear(id_libro=99, nota="Muy bueno"), user_id=10)
        assert item["titulo"] == "Libro Agregado"


def test_eliminar_libro_lista():
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_lista": 5, "id_usuario": 10}, # verificar propiedad no existe
        {"id_lista": 5, "id_usuario": 10}, # verificar propiedad success
    ]

    with patch("app.routers.lista_deseos.get_db", return_value=db):
        # Book not in list (rowcount == 0)
        cursor.rowcount = 0
        with pytest.raises(HTTPException) as exc404:
            mod.eliminar_libro_lista(5, 99, user_id=10)
        assert exc404.value.status_code == 404

        # Success delete
        cursor.rowcount = 1
        res = mod.eliminar_libro_lista(5, 99, user_id=10)
        assert res == {"ok": True, "mensaje": "Libro eliminado de la lista"}
