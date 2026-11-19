from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
import app.routers.resenas as resenas


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_get_current_user_valid_and_invalid(monkeypatch):
    monkeypatch.setattr(resenas, "verify_token", lambda tok: {"sub": "15"} if tok == "good-token" else None)

    creds_ok = HTTPAuthorizationCredentials(scheme="Bearer", credentials="good-token")
    assert resenas.get_current_user(creds_ok) == 15

    creds_bad = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad-token")
    with pytest.raises(HTTPException) as exc:
        resenas.get_current_user(creds_bad)
    assert exc.value.status_code == 401
    assert "Token inválido" in exc.value.detail


def test_obtener_resenas_libro(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db)

    # Caso 1: con reseñas y promedio calculado
    cursor.fetchall.return_value = [
        {"id_resena": 1, "calificacion": 5, "comentario": "Excelente libro", "nombre_usuario": "Juan"},
        {"id_resena": 2, "calificacion": 4, "comentario": "Muy bueno", "nombre_usuario": "Maria"},
    ]
    cursor.fetchone.return_value = {"promedio": 4.5}

    res = resenas.obtener_resenas_libro(10)
    assert res["promedio"] == 4.5
    assert res["total"] == 2
    assert len(res["resenas"]) == 2

    # Caso 2: sin reseñas (promedio None)
    cursor.fetchall.return_value = []
    cursor.fetchone.return_value = {"promedio": None}

    res_empty = resenas.obtener_resenas_libro(99)
    assert res_empty["promedio"] == 0
    assert res_empty["total"] == 0
    assert res_empty["resenas"] == []


def test_crear_resena_validaciones(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db)

    # Calificación menor a 1
    with pytest.raises(HTTPException) as exc1:
        resenas.crear_resena(resenas.ResenaCreate(id_libro=1, calificacion=0, comentario="malo"), user_id=5)
    assert exc1.value.status_code == 400

    # Calificación mayor a 5
    with pytest.raises(HTTPException) as exc2:
        resenas.crear_resena(resenas.ResenaCreate(id_libro=1, calificacion=6, comentario="wow"), user_id=5)
    assert exc2.value.status_code == 400

    # Usuario no ha comprado el libro
    cursor.fetchone.return_value = {"comprado": 0}
    with pytest.raises(HTTPException) as exc3:
        resenas.crear_resena(resenas.ResenaCreate(id_libro=1, calificacion=5, comentario="bien"), user_id=5)
    assert exc3.value.status_code == 403
    assert "Solo puedes reseñar libros que hayas comprado" in exc3.value.detail

    # Usuario ya reseñó este libro
    cursor.fetchone.side_effect = [{"comprado": 1}, {"id_resena": 10}]
    with pytest.raises(HTTPException) as exc4:
        resenas.crear_resena(resenas.ResenaCreate(id_libro=1, calificacion=5, comentario="repetida"), user_id=5)
    assert exc4.value.status_code == 400
    assert "Ya hiciste una reseña" in exc4.value.detail


def test_crear_resena_exitosa_y_error(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db)

    # Éxito
    cursor.fetchone.side_effect = [{"comprado": 1}, None]
    res = resenas.crear_resena(resenas.ResenaCreate(id_libro=2, calificacion=4, comentario="Buen libro"), user_id=7)
    assert res["ok"] is True
    assert "Reseña creada exitosamente" in res["mensaje"]
    db.commit.assert_called_once()

    # Excepción no controlada dispara rollback
    db_err, cursor_err = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db_err)
    cursor_err.fetchone.side_effect = [{"comprado": 1}, None]
    cursor_err.execute.side_effect = [None, None, Exception("Error inesperado en BD")]
    with pytest.raises(HTTPException) as exc_db:
        resenas.crear_resena(resenas.ResenaCreate(id_libro=2, calificacion=4, comentario="Falla"), user_id=7)
    assert exc_db.value.status_code == 500
    db_err.rollback.assert_called_once()


def test_actualizar_resena(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db)

    # Calificación inválida
    with pytest.raises(HTTPException) as exc_val:
        resenas.actualizar_resena(1, resenas.ResenaCreate(id_libro=1, calificacion=0, comentario="x"), user_id=3)
    assert exc_val.value.status_code == 400

    # Reseña no existe
    cursor.fetchone.return_value = None
    with pytest.raises(HTTPException) as exc_nf:
        resenas.actualizar_resena(999, resenas.ResenaCreate(id_libro=1, calificacion=4, comentario="x"), user_id=3)
    assert exc_nf.value.status_code == 404

    # No es el propietario
    cursor.fetchone.return_value = {"id_usuario": 99}
    with pytest.raises(HTTPException) as exc_perm:
        resenas.actualizar_resena(1, resenas.ResenaCreate(id_libro=1, calificacion=4, comentario="x"), user_id=3)
    assert exc_perm.value.status_code == 403

    # Actualización exitosa
    cursor.fetchone.return_value = {"id_usuario": 3}
    res = resenas.actualizar_resena(1, resenas.ResenaCreate(id_libro=1, calificacion=5, comentario="Actualizado"), user_id=3)
    assert res["ok"] is True
    assert "Reseña actualizada" in res["mensaje"]
    db.commit.assert_called_once()

    # Error inesperado dispara rollback
    db_err, cursor_err = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db_err)
    cursor_err.fetchone.return_value = {"id_usuario": 3}
    cursor_err.execute.side_effect = [None, Exception("Fallo en update")]
    with pytest.raises(HTTPException) as exc_err:
        resenas.actualizar_resena(1, resenas.ResenaCreate(id_libro=1, calificacion=5, comentario="Actualizado"), user_id=3)
    assert exc_err.value.status_code == 500
    db_err.rollback.assert_called_once()


def test_eliminar_resena(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db)

    # Reseña no encontrada
    cursor.fetchone.return_value = None
    with pytest.raises(HTTPException) as exc_nf:
        resenas.eliminar_resena(88, user_id=2)
    assert exc_nf.value.status_code == 404

    # No es propietario
    cursor.fetchone.return_value = (99,)
    with pytest.raises(HTTPException) as exc_perm:
        resenas.eliminar_resena(88, user_id=2)
    assert exc_perm.value.status_code == 403

    # Eliminación exitosa
    cursor.fetchone.return_value = (2,)
    res = resenas.eliminar_resena(88, user_id=2)
    assert res["ok"] is True
    assert "Reseña eliminada" in res["mensaje"]
    db.commit.assert_called_once()

    # Error inesperado dispara rollback
    db_err, cursor_err = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db_err)
    cursor_err.fetchone.return_value = (2,)
    cursor_err.execute.side_effect = [None, Exception("Error al borrar")]
    with pytest.raises(HTTPException) as exc_err:
        resenas.eliminar_resena(88, user_id=2)
    assert exc_err.value.status_code == 500
    db_err.rollback.assert_called_once()
