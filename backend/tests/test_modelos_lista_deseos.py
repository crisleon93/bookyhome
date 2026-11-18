"""Pruebas unitarias del modelo de listas de deseos con una BD simulada."""

from unittest.mock import MagicMock

import pytest

import app.models.lista_deseos as modelo


@pytest.fixture
def db_mock(monkeypatch):
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    monkeypatch.setattr(modelo, "get_db", lambda: db)
    return db, cursor


def test_obtener_listas_retorna_resultados_y_cierra_recursos(db_mock):
    db, cursor = db_mock
    cursor.fetchall.return_value = [{"id_lista": 3, "nombre_lista": "Lecturas"}]

    assert modelo.obtener_listas_usuario(8) == [{"id_lista": 3, "nombre_lista": "Lecturas"}]
    cursor.execute.assert_called_once()
    assert cursor.execute.call_args.args[1] == (8,)
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_obtener_listas_devuelve_lista_vacia_si_hay_error(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("db unavailable")

    assert modelo.obtener_listas_usuario(8) == []
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_crear_lista_limpia_nombre_y_retorna_registro(db_mock):
    db, cursor = db_mock
    cursor.lastrowid = 12
    cursor.fetchone.return_value = {"id_lista": 12, "nombre_lista": "Favoritos"}

    result = modelo.crear_lista_deseos(4, "  Favoritos  ", True)

    assert result == {"ok": True, "lista": {"id_lista": 12, "nombre_lista": "Favoritos"}}
    assert cursor.execute.call_args_list[0].args[1] == (4, "Favoritos", True)
    db.commit.assert_called_once()


def test_crear_lista_revierte_la_transaccion_si_falla(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("insert failed")

    result = modelo.crear_lista_deseos(4, "Lista")

    assert result == {"ok": False, "error": "insert failed"}
    db.rollback.assert_called_once()


def test_actualizar_lista_rechaza_datos_vacios_sin_consultar(db_mock):
    db, cursor = db_mock

    assert modelo.actualizar_lista_deseos(2, 4, {}) == {
        "ok": False,
        "error": "No hay campos para actualizar",
    }
    cursor.execute.assert_not_called()
    db.commit.assert_not_called()


def test_actualizar_lista_actualiza_nombre_y_visibilidad(db_mock):
    db, cursor = db_mock
    cursor.fetchone.return_value = {"id_lista": 2, "nombre_lista": "Nuevas"}

    result = modelo.actualizar_lista_deseos(
        2, 4, {"nombre_lista": "  Nuevas  ", "publica": True}
    )

    assert result["ok"] is True
    query, params = cursor.execute.call_args_list[0].args
    assert "nombre_lista = %s, publica = %s" in query
    assert params == ("Nuevas", True, 2, 4)
    db.commit.assert_called_once()


def test_actualizar_lista_revierte_la_transaccion_si_falla(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("update failed")

    result = modelo.actualizar_lista_deseos(2, 4, {"publica": True})

    assert result == {"ok": False, "error": "update failed"}
    db.rollback.assert_called_once()


def test_eliminar_lista_no_borra_si_no_pertenece_al_usuario(db_mock):
    db, cursor = db_mock
    cursor.fetchone.return_value = None

    assert modelo.eliminar_lista_deseos(5, 9) == {
        "ok": False,
        "error": "Lista no encontrada",
    }
    assert cursor.execute.call_count == 1
    db.commit.assert_not_called()


def test_eliminar_lista_revierte_si_falla_el_borrado(db_mock):
    db, cursor = db_mock
    cursor.fetchone.return_value = {"id_lista": 5}
    cursor.execute.side_effect = [None, RuntimeError("delete failed")]

    result = modelo.eliminar_lista_deseos(5, 9)

    assert result == {"ok": False, "error": "delete failed"}
    db.rollback.assert_called_once()


def test_eliminar_lista_borra_items_y_lista(db_mock):
    db, cursor = db_mock
    cursor.fetchone.return_value = {"id_lista": 5}

    assert modelo.eliminar_lista_deseos(5, 9) == {"ok": True}
    assert cursor.execute.call_count == 3
    db.commit.assert_called_once()


def test_obtener_libros_lista_devuelve_resultados(db_mock):
    db, cursor = db_mock
    cursor.fetchall.return_value = [{"id_libro": 10, "titulo": "Cuentos"}]

    assert modelo.obtener_libros_lista(6) == [{"id_libro": 10, "titulo": "Cuentos"}]
    assert cursor.execute.call_args.args[1] == (6,)
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_obtener_libros_lista_devuelve_lista_vacia_si_hay_error(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("query failed")

    assert modelo.obtener_libros_lista(6) == []
    cursor.close.assert_called_once()
    db.close.assert_called_once()


@pytest.mark.parametrize(
    ("fetch_result", "expected"),
    [(None, False), ((7,), True)],
)
def test_libro_en_lista_indica_si_existe(db_mock, fetch_result, expected):
    db, cursor = db_mock
    cursor.fetchone.return_value = fetch_result

    assert modelo.libro_en_lista(2, 7) is expected
    assert cursor.execute.call_args.args[1] == (2, 7)
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_agregar_libro_a_lista_guarda_nota_y_devuelve_item(db_mock):
    db, cursor = db_mock
    cursor.fetchone.return_value = {"id_item": 3, "nota": "Leer pronto"}

    result = modelo.agregar_libro_lista(2, 7, "Leer pronto")

    assert result == {"ok": True, "item": {"id_item": 3, "nota": "Leer pronto"}}
    assert cursor.execute.call_args_list[0].args[1] == (2, 7, "Leer pronto")
    db.commit.assert_called_once()


def test_agregar_libro_revierte_si_falla_el_insert(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("insert failed")

    result = modelo.agregar_libro_lista(2, 7, "Leer pronto")

    assert result == {"ok": False, "error": "insert failed"}
    db.rollback.assert_called_once()


def test_quitar_libro_retorna_false_si_no_hubo_filas(db_mock):
    db, cursor = db_mock
    cursor.rowcount = 0

    assert modelo.quitar_libro_lista(2, 7) == {"ok": False}
    db.commit.assert_called_once()


def test_quitar_libro_revierte_si_falla_el_delete(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("delete failed")

    assert modelo.quitar_libro_lista(2, 7) == {
        "ok": False,
        "error": "delete failed",
    }
    db.rollback.assert_called_once()
