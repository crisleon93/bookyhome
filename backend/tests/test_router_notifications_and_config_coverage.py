from datetime import datetime
from unittest.mock import MagicMock

from io import BytesIO
import pytest
from fastapi import HTTPException, UploadFile

import app.routers.notificaciones as notifications
import app.routers.tienda_configuracion as shop_config


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_notifications_listing_formats_dates_and_counts_unread(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{
        "id_notificacion": 4,
        "fecha_creacion": datetime(2026, 11, 1, 10, 30),
    }]
    cursor.fetchone.return_value = {"total": 3}
    monkeypatch.setattr(notifications, "get_db", lambda: db)

    result = notifications.obtener_notificaciones_usuario(7, solo_no_leidas=True, limit=10, offset=5)

    assert result["no_leidas"] == 3
    assert result["notificaciones"][0]["fecha_creacion"] == "2026-11-01 10:30:00"
    assert cursor.execute.call_args_list[0].args[1] == [7, 10, 5]
    assert "n.leida = FALSE" in cursor.execute.call_args_list[0].args[0]
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_notifications_create_read_and_delete_handle_errors(monkeypatch):
    db, cursor = _db()
    cursor.lastrowid = 15
    monkeypatch.setattr(notifications, "get_db", lambda: db)
    created = notifications.crear_notificacion(
        notifications.NotificacionCreate(tipo="pedido", titulo="Pedido", cuerpo="Actualizado"),
        7,
    )
    assert created["id_notificacion"] == 15
    db.commit.assert_called_once()

    cursor.rowcount = 0
    with pytest.raises(HTTPException) as missing:
        notifications.marcar_notificacion_leida(99, 7)
    assert missing.value.status_code == 404

    cursor.rowcount = 1
    assert notifications.marcar_notificacion_leida(15, 7)["ok"] is True
    assert notifications.eliminar_notificacion(15, 7)["ok"] is True
    assert db.commit.call_count == 3

    cursor.execute.side_effect = RuntimeError("insert unavailable")
    with pytest.raises(HTTPException) as failed:
        notifications.crear_notificacion(
            notifications.NotificacionCreate(tipo="sistema", titulo="x", cuerpo="y"),
            7,
        )
    assert failed.value.status_code == 500
    db.rollback.assert_called_once()


@pytest.mark.parametrize(
    ("filter_name", "where_clause"),
    [
        ("leidas", "leida = TRUE"),
        ("hoy", "DATE(fecha_creacion) = CURDATE()"),
        ("semana", "DATE_SUB(NOW(), INTERVAL 7 DAY)"),
        ("mes", "DATE_SUB(NOW(), INTERVAL 30 DAY)"),
        ("todas", "id_usuario = %s"),
    ],
)
def test_bulk_notification_delete_builds_expected_filter(monkeypatch, filter_name, where_clause):
    db, cursor = _db()
    cursor.rowcount = 2
    monkeypatch.setattr(notifications, "get_db", lambda: db)
    assert notifications.eliminar_notificaciones_masivo(filter_name, 8) == {
        "ok": True, "eliminadas": 2,
    }
    query = cursor.execute.call_args.args[0]
    assert where_clause in query
    assert cursor.execute.call_args.args[1] == [8]
    db.commit.assert_called_once()

    with pytest.raises(HTTPException) as invalid:
        notifications.eliminar_notificaciones_masivo("unknown", 8)
    assert invalid.value.status_code == 400


def test_shop_config_returns_defaults_updates_and_public_details(monkeypatch):
    with pytest.raises(HTTPException) as no_shop:
        shop_config.get_configuracion({"id_tienda": None})
    assert no_shop.value.status_code == 404

    monkeypatch.setattr(shop_config, "obtener_configuracion_tienda", lambda _store: None)
    assert shop_config.get_configuracion({"id_tienda": 3})["tarifa_envio"] == 0

    monkeypatch.setattr(shop_config, "obtener_configuracion_tienda", lambda _store: {"descripcion": "Libros"})
    assert shop_config.get_configuracion({"id_tienda": 3}) == {
        "descripcion": "Libros", "tarifa_envio": 0,
    }

    update = MagicMock(return_value={"ok": True})
    monkeypatch.setattr(shop_config, "actualizar_configuracion_tienda", update)
    assert shop_config.update_configuracion({"tarifa_envio": 10}, {"id_tienda": 3}) == {
        "mensaje": "Configuración actualizada con éxito",
    }
    update.assert_called_once_with(3, {"tarifa_envio": 10})

    monkeypatch.setattr("app.models.tiendas.obtener_tienda_por_id", lambda _store: {"id_tienda": 3})
    monkeypatch.setattr("app.models.libro.obtener_libros_por_tienda", lambda _store: [{"id_libro": 2}])
    assert shop_config.get_configuracion_publica(3)["libros"] == [{"id_libro": 2}]


def test_shop_config_upload_validates_store_type_and_image_path(monkeypatch, tmp_path):
    monkeypatch.setattr(shop_config, "UPLOAD_TIENDAS_DIR", str(tmp_path))
    with pytest.raises(HTTPException) as no_shop:
        shop_config.upload_tienda_image(
            UploadFile(filename="cover.jpg", file=BytesIO(b"image")), "logo", {},
        )
    assert no_shop.value.status_code == 403

    with pytest.raises(HTTPException) as invalid_type:
        shop_config.upload_tienda_image(
            UploadFile(filename="cover.jpg", file=BytesIO(b"image")),
            "avatar", {"id_tienda": 3},
        )
    assert invalid_type.value.status_code == 400

    with pytest.raises(HTTPException) as invalid_file:
        shop_config.upload_tienda_image(
            UploadFile(filename="cover.svg", file=BytesIO(b"image")),
            "logo", {"id_tienda": 3},
        )
    assert invalid_file.value.status_code == 400

    result = shop_config.upload_tienda_image(
        UploadFile(filename="../../cover.JPG", file=BytesIO(b"image")),
        "logo", {"id_tienda": 3},
    )
    assert result["url"].endswith(".jpg")
    saved_file = tmp_path / result["url"].replace("\\", "/").split("/")[-1]
    assert saved_file.name.startswith("tienda_3_logo_")
    assert saved_file.read_bytes() == b"image"
