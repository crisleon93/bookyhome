import asyncio
import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, UploadFile

import app.routers.perfil as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_address_not_found_and_insert_failure_paths(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.return_value = None
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with pytest.raises(HTTPException) as absent:
        mod.actualizar_direccion(4, mod.DireccionBase(direccion="A"), 2)
    assert absent.value.status_code == 404

    cursor.execute.side_effect = [None, RuntimeError("insert failed")]
    with pytest.raises(HTTPException) as failed:
        mod.crear_direccion(mod.DireccionCrear(direccion="A"), 2)
    assert failed.value.status_code == 500
    db.rollback.assert_called_once()


def test_profile_lookup_missing_and_profile_save_failure(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.return_value = None
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with pytest.raises(HTTPException) as missing:
        mod.obtener_perfil(2)
    assert missing.value.status_code == 404

    cursor.execute.side_effect = RuntimeError("write failed")
    with pytest.raises(HTTPException) as save_error:
        mod.actualizar_perfil(mod.PerfilActualizar(nombre_usuario="Ana"), 2)
    assert save_error.value.status_code == 500
    db.rollback.assert_called_once()


def test_upload_endpoints_save_files_and_update_user(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)
    monkeypatch.setattr(mod, "_guardar_upload", lambda *_args: _completed())
    monkeypatch.setattr(mod, "os", SimpleNamespace(makedirs=lambda *_args, **_kwargs: None))
    upload = UploadFile(filename="cover.png", file=__import__("io").BytesIO(b"image"))

    banner = asyncio.run(mod.subir_banner_perfil(upload, 12))
    photo = asyncio.run(mod.subir_foto_perfil(upload, 12))
    assert banner["tipo"] == "imagen"
    assert banner["url"].startswith("uploads/banners/banner_12_")
    assert photo["url"].startswith("uploads/perfiles/usuario_12_")
    assert cursor.execute.call_count == 2
    assert db.commit.call_count == 2


async def _completed():
    return None


def test_order_state_is_automatic_and_delivery_updates_json(tmp_path, monkeypatch):
    with pytest.raises(HTTPException) as blocked:
        mod.actualizar_estado_orden(6, mod.ActualizarEstadoOrden(estado="entregada"), 3)
    assert blocked.value.status_code == 409

    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_orden": 6, "estado_orden": "enviado"},
        {"id_vendedor": 9, "nombre_tienda": "Tienda"},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    order_file = tmp_path / "orders.json"
    order_file.write_text(json.dumps({"3": [{
        "id_orden_db": 6, "estado": "enviado", "envio": {"estado_envio": "En camino"},
    }]}), encoding="utf-8")
    fake_os = SimpleNamespace(path=SimpleNamespace(
        dirname=lambda _path: str(tmp_path), join=lambda *_parts: str(order_file),
        exists=lambda _path: True,
    ))
    monkeypatch.setattr(mod, "os", fake_os)

    result = mod.confirmar_entrega(6, 3)
    assert result["success"] is True
    saved = json.loads(order_file.read_text(encoding="utf-8"))["3"][0]
    assert saved["estado"] == "entregada"
    assert saved["envio"]["estado_envio"] == "Entregado"
    assert db.commit.call_count == 1


def test_rating_create_eligibility_edit_and_owner_views(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)
    rating = mod.CalificacionTiendaCreate(id_tienda=4, calificacion=5, comentario="Muy bien")
    cursor.fetchone.side_effect = [
        {"compras_entregadas": 1}, None,
        {"nombre_usuario": "Ana", "nombre_tienda": "Tienda", "id_vendedor": 9},
    ]
    assert mod.crear_calificacion_tienda(rating, 3)["ok"] is True
    db.commit.assert_called_once()

    cursor.fetchall.return_value = []
    cursor.fetchone.side_effect = None
    cursor.fetchone.return_value = {"compras_entregadas": 1}
    assert mod.usuario_puede_calificar_tienda(4, 3)["puede_calificar"] is True

    cursor.fetchone.side_effect = [
        {"id_usuario": 3},
        {"nombre_usuario": "Ana", "nombre_tienda": "Tienda", "id_vendedor": 9, "id_tienda": 4},
    ]
    assert mod.actualizar_calificacion_tienda(2, rating, 3)["ok"] is True

    cursor.fetchone.side_effect = [
        {"id_usuario": 3},
        {"promedio": 4.5, "total": 2, "total_5_estrellas": 1,
         "total_4_estrellas": 1, "total_3_estrellas": 0, "total_2_estrellas": 0,
         "total_1_estrellas": 0},
    ]
    cursor.fetchall.return_value = [{"calificacion": 5}, {"calificacion": 4}]
    result = mod.obtener_calificaciones_tienda_vendedor(4, 3)
    assert result["promedio"] == 4.5
    assert len(result["recientes"]) == 2


def test_rating_rejects_nonowners_and_missing_purchase(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)
    rating = mod.CalificacionTiendaCreate(id_tienda=4, calificacion=4, comentario="")

    cursor.fetchone.return_value = {"compras_entregadas": 0}
    with pytest.raises(HTTPException) as no_purchase:
        mod.crear_calificacion_tienda(rating, 3)
    assert no_purchase.value.status_code == 403

    cursor.fetchone.return_value = {"id_usuario": 8}
    with pytest.raises(HTTPException) as forbidden:
        mod.actualizar_calificacion_tienda(2, rating, 3)
    assert forbidden.value.status_code == 403

    cursor.fetchone.return_value = None
    with pytest.raises(HTTPException) as missing:
        mod.obtener_calificaciones_tienda_vendedor(4, 3)
    assert missing.value.status_code == 404
