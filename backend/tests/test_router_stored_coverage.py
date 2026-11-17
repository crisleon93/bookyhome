import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock

import app.routers.stored as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_list_books_passes_limit_and_closes_resources(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_libro": 3}]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    assert mod.listar_libros_sp(7) == [{"id_libro": 3}]
    cursor.execute.assert_called_once()
    assert cursor.execute.call_args.args[1] == (7,)
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_list_books_translates_database_error(monkeypatch):
    db, cursor = _db()
    cursor.execute.side_effect = RuntimeError("offline")
    monkeypatch.setattr(mod, "get_db", lambda: db)

    with pytest.raises(HTTPException) as error:
        mod.listar_libros_sp()

    assert error.value.status_code == 500
    assert error.value.detail == "Error al ejecutar stored procedure"


def test_get_book_returns_record_and_not_found(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [{"id_libro": 2}, None]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    assert mod.obtener_libro(2) == {"id_libro": 2}
    with pytest.raises(HTTPException) as error:
        mod.obtener_libro(99)
    assert error.value.status_code == 404
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_get_book_translates_database_error(monkeypatch):
    db, cursor = _db()
    cursor.execute.side_effect = RuntimeError("offline")
    monkeypatch.setattr(mod, "get_db", lambda: db)

    with pytest.raises(HTTPException) as error:
        mod.obtener_libro(2)
    assert error.value.status_code == 500
    assert error.value.detail == "Error al obtener libro"


def test_my_books_returns_rows_or_empty_on_error(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_libro": 4}]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    assert mod.mis_libros(12) == [{"id_libro": 4}]
    assert cursor.execute.call_args.args[1] == (12,)

    cursor.execute.side_effect = RuntimeError("offline")
    assert mod.mis_libros(12) == []
