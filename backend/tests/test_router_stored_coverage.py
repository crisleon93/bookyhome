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

def test_list_books_preserves_http_exceptions(monkeypatch):
    db, cursor = _db()
    cursor.execute.side_effect = HTTPException(status_code=418, detail="database rejected request")
    monkeypatch.setattr(mod, "get_db", lambda: db)

    with pytest.raises(HTTPException) as error:
        mod.listar_libros_sp()

    assert error.value.status_code == 418
    assert error.value.detail == "database rejected request"


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


def test_list_books_admin_requires_valid_token(monkeypatch):
    from unittest.mock import MagicMock
    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)

    # Sin token → 401
    with pytest.raises(HTTPException) as exc:
        mod.listar_libros_sp(admin=True, authorization=None)
    assert exc.value.status_code == 401

    # Token con rol no-admin → 403
    monkeypatch.setattr(mod, "verify_token", lambda _t: {"rol": "comprador"})
    with pytest.raises(HTTPException) as exc:
        mod.listar_libros_sp(admin=True, authorization="Bearer fake-token")
    assert exc.value.status_code == 403


def test_list_books_admin_returns_all_books(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_libro": 1}, {"id_libro": 2}]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    monkeypatch.setattr(mod, "verify_token", lambda _t: {"rol": "admin"})

    result = mod.listar_libros_sp(admin=True, authorization="Bearer admin-token")
    assert len(result) == 2
    # La query admin no filtra por oculto ni por stock (no pasa el tuple de limite)
    call_args = cursor.execute.call_args
    # La query admin no tiene parámetros adicionales (sin límite)
    assert call_args.args[0].strip().endswith("DESC")
    assert len(call_args.args) == 1  # solo el SQL, sin parámetros tuple
    cursor.close.assert_called_once()
    db.close.assert_called_once()
