from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

import app.routers.quejas as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_order_store_uses_json_order_and_falls_back_to_store(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [{"id_tienda": 6}, {"id_tienda": 6}]
    order = {"id_orden": 4, "items": [{"id_libro": 8}]}
    with patch("app.models.payments.obtener_ordenes_usuario", return_value=[order]), \
         patch("app.models.payments.obtener_orden") as get_one:
        assert mod._order_store(cursor, 4, 2) == {"id_tienda": 6}
    get_one.assert_not_called()
    assert "id_libro IN (%s)" in cursor.execute.call_args_list[0].args[0]


def test_order_store_falls_back_to_database_order_and_shipping(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_orden": 4, "estado_orden": "pagado"},
        {"id_tienda": 7},
        {"id_tienda": 7},
    ]
    with patch("app.models.payments.obtener_ordenes_usuario", side_effect=RuntimeError()), \
         patch("app.models.payments.obtener_orden", side_effect=RuntimeError()):
        assert mod._order_store(cursor, 4, 2) == {"id_tienda": 7}
    assert cursor.execute.call_count == 3


def test_customer_complaints_enrich_order_items_and_default_on_failure(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_orden": 1}, {"id_orden": 2}]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with patch("app.models.payments.obtener_orden", side_effect=[
        {"items": [{"titulo": "Libro", "imagen_url": "cover.jpg"}]},
        RuntimeError("unavailable"),
    ]):
        result = mod.mis_quejas({"sub": "5"})
    assert result[0]["titulo_libro"] == "Libro"
    assert result[0]["total_items"] == 1
    assert result[1]["imagen_libro"] is None
    assert result[1]["total_items"] == 0
    cursor.close.assert_called_once()
    db.close.assert_called_once()


@pytest.mark.anyio
async def test_create_complaint_validates_required_fields_and_order(monkeypatch):
    with pytest.raises(HTTPException) as empty:
        await mod.crear_queja(1, " ", "detalle", user={"sub": "2"})
    assert empty.value.status_code == 400

    with pytest.raises(HTTPException) as invalid_file:
        await mod.crear_queja(
            1, "Motivo", "detalle",
            evidencia=MagicMock(filename="payload.txt", content_type="text/plain"),
            user={"sub": "2"},
        )
    assert invalid_file.value.status_code == 400

    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with patch.object(mod, "_order_store", return_value=None):
        with pytest.raises(HTTPException) as missing:
            await mod.crear_queja(1, "Motivo", "detalle", evidencia=None, user={"sub": "2"})
    assert missing.value.status_code == 404
    db.rollback.assert_called_once()


@pytest.mark.anyio
async def test_create_complaint_saves_and_notifies_participants(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [None, {"id_tienda": 6}, {"id_usuario": 7}]
    cursor.fetchall.return_value = [{"id_usuario": 1}, {"id_usuario": 2}]
    cursor.lastrowid = 22
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with patch.object(mod, "_order_store", return_value={"id_tienda": None}):
        result = await mod.crear_queja(
            14, "Motivo", " Detalle ", evidencia=None, user={"sub": "5"},
        )

    assert result == {"ok": True, "id_solicitud": 22}
    insert = cursor.execute.call_args_list[2]
    assert insert.args[1] == (6, 5, 14, "Motivo", "Detalle", None)
    assert cursor.execute.call_count >= 7
    db.commit.assert_called_once()


def test_cancel_complaint_requires_open_owned_record(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [None, {"id_solicitud": 1, "estado": "Resuelto"}, {"estado": "Abierto"}]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    with pytest.raises(HTTPException) as missing:
        mod.cancelar_queja(1, {"sub": "2"})
    assert missing.value.status_code == 404
    with pytest.raises(HTTPException) as closed:
        mod.cancelar_queja(1, {"sub": "2"})
    assert closed.value.status_code == 400
    assert mod.cancelar_queja(1, {"sub": "2"}) == {"ok": True}
    db.commit.assert_called_once()


def test_complaint_access_and_conversation_for_customer_vendor_and_admin(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_solicitud": 9, "tipo_solicitud": "reclamo", "id_comprador": 2, "id_vendedor": 7},
        {"id_solicitud": 9, "tipo_solicitud": "reclamo", "id_comprador": 2, "id_vendedor": 7},
        {"id_solicitud": 9, "tipo_solicitud": "soporte", "id_comprador": 2, "id_vendedor": 7},
    ]
    cursor.fetchall.return_value = [{"mensaje": "mensaje"}]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    assert mod.mensajes_reclamo(9, {"sub": "2"}) == [{"mensaje": "mensaje"}]
    assert mod.enviar_mensaje_reclamo(9, mod.MensajeReclamo(mensaje=" hola "), {"sub": "7"}) == {"ok": True}
    assert cursor.execute.call_args_list[3].args[1] == (9, 7, "hola")
    with pytest.raises(HTTPException) as wrong_type:
        mod.mensajes_reclamo(9, {"sub": "1", "rol": "admin"})
    assert wrong_type.value.status_code == 400


def test_create_support_notifies_admins_and_admin_resolution_validates_role(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.side_effect = [[{"id_usuario": 1}], []]
    cursor.lastrowid = 13
    monkeypatch.setattr(mod, "get_db", lambda: db)

    created = mod.crear_soporte(
        mod.SoporteCrear(asunto=" Ayuda ", descripcion=" Necesito soporte ", categoria="cuenta"),
        {"sub": "4"},
    )
    assert created == {"ok": True, "id_solicitud": 13}
    assert db.commit.call_count == 1

    with pytest.raises(HTTPException) as forbidden:
        mod.resolver_queja(13, mod.Resolucion(estado="Resuelto", respuesta="Listo"), {"sub": "4", "rol": "comprador"})
    assert forbidden.value.status_code == 403

    cursor.fetchone.return_value = {
        "tipo_solicitud": "soporte", "id_comprador": 4, "id_vendedor": None,
    }
    assert mod.resolver_queja(
        13, mod.Resolucion(estado="Resuelto", respuesta="Listo"), {"sub": "1", "rol": "admin"},
    ) == {"ok": True}
    assert db.commit.call_count == 2
