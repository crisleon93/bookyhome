import json
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

import app.routers.calificaciones_tiendas as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def _orders_path(tmp_path, monkeypatch, orders):
    router_dir = tmp_path / "routers"
    router_dir.mkdir(exist_ok=True)
    data_dir = tmp_path / "data"
    data_dir.mkdir(exist_ok=True)
    monkeypatch.setattr(mod, "__file__", str(router_dir / "calificaciones_tiendas.py"))
    (data_dir / "orders.json").write_text(json.dumps(orders), encoding="utf-8")


def test_get_store_ratings_returns_aggregate_and_star_distribution(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [
        {"calificacion": 5}, {"calificacion": 5}, {"calificacion": 2}, {"calificacion": 9},
    ]
    cursor.fetchone.return_value = {
        "calificacion_media": 4.0, "total_opiniones": 4, "total_5_estrellas": 2,
    }
    monkeypatch.setattr(mod, "get_db", lambda: db)

    result = mod.obtener_calificaciones_tienda(6)

    assert result["promedio"] == 4.0
    assert result["total"] == 4
    assert result["distribucion"] == {1: 0, 2: 1, 3: 0, 4: 0, 5: 2}
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_get_store_ratings_defaults_empty_metrics(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = []
    cursor.fetchone.return_value = None
    monkeypatch.setattr(mod, "get_db", lambda: db)

    result = mod.obtener_calificaciones_tienda(6)
    assert result["promedio"] == 0
    assert result["total"] == 0
    assert result["total_5_estrellas"] == 0


def test_create_rating_validates_score_missing_file_and_purchase(monkeypatch, tmp_path):
    invalid = mod.CalificacionTiendaCreate(id_tienda=4, calificacion=6, comentario="x")
    with pytest.raises(HTTPException) as error:
        mod.crear_calificacion_tienda(invalid, user_id=2)
    assert error.value.status_code == 400

    valid = mod.CalificacionTiendaCreate(id_tienda=4, calificacion=5, comentario="Bien")
    monkeypatch.setattr(mod.os.path, "exists", lambda _path: False)
    with pytest.raises(HTTPException) as missing:
        mod.crear_calificacion_tienda(valid, user_id=2)
    assert missing.value.status_code == 404

    monkeypatch.setattr(mod.os.path, "exists", lambda _path: True)
    _orders_path(tmp_path, monkeypatch, {
        "2": [{"estado": "pendiente", "items": [{"id_libro": 8}]}],
    })
    db, cursor = _db()
    cursor.fetchone.return_value = {"id_tienda": 4}
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with pytest.raises(HTTPException) as not_purchased:
        mod.crear_calificacion_tienda(valid, user_id=2)
    assert not_purchased.value.status_code == 403


def test_create_rating_persists_only_after_delivered_purchase(monkeypatch, tmp_path):
    _orders_path(tmp_path, monkeypatch, {
        "2": [{"estado": "entregada", "items": [{"id_libro": 8}]}],
    })
    db, cursor = _db()
    cursor.fetchone.side_effect = [{"id_tienda": 4}, None]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    payload = mod.CalificacionTiendaCreate(id_tienda=4, calificacion=5, comentario="Excelente")

    assert mod.crear_calificacion_tienda(payload, user_id=2)["ok"] is True
    assert cursor.execute.call_count == 3
    db.commit.assert_called_once()
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_create_rating_rejects_duplicate_review(monkeypatch, tmp_path):
    _orders_path(tmp_path, monkeypatch, {
        "2": [{"estado": "entregada", "items": [{"id_libro": 8}]}],
    })
    db, cursor = _db()
    cursor.fetchone.side_effect = [{"id_tienda": 4}, {"id_calificacion": 11}]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    payload = mod.CalificacionTiendaCreate(id_tienda=4, calificacion=5, comentario="Excelente")

    with pytest.raises(HTTPException) as error:
        mod.crear_calificacion_tienda(payload, user_id=2)
    assert error.value.status_code == 400
    db.commit.assert_not_called()


def test_update_and_delete_rating_enforce_owner_and_report_not_found(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_usuario": 3}, {"id_usuario": 2}, None,
        (3,), (2,), None,
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    payload = mod.CalificacionTiendaCreate(id_tienda=4, calificacion=4, comentario="Actualizada")

    with pytest.raises(HTTPException) as unauthorized_update:
        mod.actualizar_calificacion_tienda(8, payload, user_id=2)
    assert unauthorized_update.value.status_code == 403
    assert mod.actualizar_calificacion_tienda(8, payload, user_id=2)["ok"] is True
    with pytest.raises(HTTPException) as missing_update:
        mod.actualizar_calificacion_tienda(99, payload, user_id=2)
    assert missing_update.value.status_code == 404

    with pytest.raises(HTTPException) as unauthorized_delete:
        mod.eliminar_calificacion_tienda(8, user_id=2)
    assert unauthorized_delete.value.status_code == 403
    assert mod.eliminar_calificacion_tienda(8, user_id=2)["ok"] is True
    with pytest.raises(HTTPException) as missing_delete:
        mod.eliminar_calificacion_tienda(99, user_id=2)
    assert missing_delete.value.status_code == 404


def test_user_eligibility_handles_absent_order_file_and_previous_rating(monkeypatch, tmp_path):
    monkeypatch.setattr(mod.os.path, "exists", lambda _path: False)
    assert mod.usuario_puede_calificar_tienda(4, user_id=2) == {
        "puede_calificar": False, "ha_comprado": False, "ya_califico": False,
    }

    monkeypatch.setattr(mod.os.path, "exists", lambda _path: True)
    _orders_path(tmp_path, monkeypatch, {
        "2": [{"estado": "entregada", "items": [{"id_libro": 8}]}],
    })
    db, cursor = _db()
    cursor.fetchone.side_effect = [{"id_tienda": 4}, {"id_calificacion": 99}]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    assert mod.usuario_puede_calificar_tienda(4, user_id=2) == {
        "puede_calificar": False, "ha_comprado": True, "ya_califico": True,
    }
