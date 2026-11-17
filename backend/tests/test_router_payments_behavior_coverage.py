import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

import app.routers.payments as payments
from app.schemas import PagoRequest


def test_process_payment_checks_delivery_and_skips_duplicate_financial_entry(monkeypatch):
    with pytest.raises(HTTPException) as missing_address:
        payments.process_payment(
            PagoRequest(
                order_id=3, amount=100, payment_method="tarjeta",
                tipo_entrega="domicilio",
            ),
            {"sub": "7"},
        )
    assert missing_address.value.status_code == 400

    monkeypatch.setattr(payments, "registrar_pago", lambda **_kwargs: {
        "ok": True, "already_paid": True,
    })
    finance_hook = MagicMock()
    monkeypatch.setattr(payments, "registrar_ingreso_venta", finance_hook)
    result = payments.process_payment(
        PagoRequest(
            order_id=3, amount=100, payment_method="tarjeta",
            tipo_entrega="domicilio", id_direccion=9,
        ),
        {"sub": "7"},
    )
    assert result["already_paid"] is True
    finance_hook.assert_not_called()


def test_process_payment_registers_only_the_commissionable_shipping_amount(monkeypatch):
    monkeypatch.setattr(payments, "registrar_pago", lambda **_kwargs: {
        "ok": True, "order": {"costo_envio": 15},
    })
    monkeypatch.setattr(payments, "_resolver_vendedor", lambda *_args: 12)
    register_income = MagicMock()
    monkeypatch.setattr(payments, "registrar_ingreso_venta", register_income)

    data = PagoRequest(
        order_id=4, amount=100, payment_method="tarjeta",
        tipo_entrega="domicilio", id_direccion=2,
    )
    payments.process_payment(data, {"sub": "7"})
    register_income.assert_called_once_with(
        id_venta=4, monto_venta=85, id_vendedor=12, tipo_entrega="domicilio",
    )

    monkeypatch.setattr(payments, "registrar_pago", lambda **_kwargs: {
        "ok": False, "error": "payment rejected",
    })
    with pytest.raises(HTTPException) as rejected:
        payments.process_payment(data, {"sub": "7"})
    assert rejected.value.status_code == 400


def test_order_lookup_and_cancellation_translate_not_found_and_model_errors(monkeypatch):
    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: None)
    with pytest.raises(HTTPException) as missing:
        payments.get_order_details(2, {"sub": "7"})
    assert missing.value.status_code == 404

    monkeypatch.setattr(payments, "cancelar_orden", lambda *_args: {
        "ok": False, "error": "not cancellable",
    })
    with pytest.raises(HTTPException) as rejected:
        payments.cancel_order(2, None, {"sub": "7"})
    assert rejected.value.status_code == 400

    cancel = MagicMock(return_value={"ok": True})
    monkeypatch.setattr(payments, "cancelar_orden", cancel)
    assert payments.cancel_order(2, None, {"sub": "7"}) == {"ok": True}
    assert cancel.call_args.args[2] == "Cancelación solicitada por el comprador"


def test_send_confirmation_requires_order_and_email_then_sends_receipt(monkeypatch):
    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: None)
    with pytest.raises(HTTPException) as missing_order:
        asyncio.run(payments.send_order_confirmation(2, {"sub": "7"}))
    assert missing_order.value.status_code == 404

    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: {"id_orden": 2})
    monkeypatch.setattr(payments, "obtener_email_usuario", lambda _user: None)
    with pytest.raises(HTTPException) as missing_email:
        asyncio.run(payments.send_order_confirmation(2, {"sub": "7"}))
    assert missing_email.value.status_code == 404

    send = AsyncMock()
    monkeypatch.setattr(payments, "obtener_email_usuario", lambda _user: "buyer@example.test")
    monkeypatch.setattr(payments, "enviar_email_confirmacion", send)
    assert asyncio.run(payments.send_order_confirmation(2, {"sub": "7"}))["ok"] is True
    send.assert_awaited_once_with("buyer@example.test", {"id_orden": 2})


def test_pickup_endpoints_forward_user_and_payment_options(monkeypatch):
    reserve = MagicMock(return_value={"ok": True})
    arrival = MagicMock(return_value={"ok": True})
    enable = MagicMock(return_value={"ok": True})
    confirm = MagicMock(return_value={"ok": True})
    monkeypatch.setattr(payments, "reservar_retiro", reserve)
    monkeypatch.setattr(payments, "notificar_llegada_tienda", arrival)
    monkeypatch.setattr(payments, "habilitar_pago_retiro", enable)
    monkeypatch.setattr(payments, "confirmar_entrega_retiro", confirm)

    user = {"sub": "7"}
    payments.reserve_store_pickup(3, None, user)
    payments.notify_store_arrival(3, user)
    payments.enable_pickup_payment(3, user)
    payments.confirm_pickup_delivery(3, {"es_efectivo": True}, user)
    reserve.assert_called_once_with(7, 3, "Efectivo en Tienda")
    arrival.assert_called_once_with(7, 3)
    enable.assert_called_once_with(7, 3)
    confirm.assert_called_once_with(7, 3, True)


def test_cancel_pending_orders_updates_database_and_json_store(monkeypatch):
    import app.database as database
    import app.models.payments as payment_model

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = [{"id_orden": 2}, {"id_orden": 3}]
    cursor.rowcount = 2
    monkeypatch.setattr(database, "get_db", lambda: db)
    store = {"7": [
        {"id_orden": 2, "estado": "pendiente"},
        {"id_orden": 9, "estado": "pagado"},
    ]}
    monkeypatch.setattr(payment_model, "_load_store", lambda _path: store)
    save = MagicMock()
    monkeypatch.setattr(payment_model, "_save_store", save)

    result = payments.cancelar_mis_pendientes({"sub": "7"})
    assert result == {"ok": True, "canceladas": 2}
    assert store["7"][0]["estado_orden"] == "cancelada"
    assert store["7"][1]["estado"] == "pagado"
    save.assert_called_once()
    db.commit.assert_called_once()


def test_update_shipping_cost_recalculates_total_and_syncs_store(monkeypatch):
    import app.database as database
    import app.models.payments as payment_model

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = [
        {"id_tienda": 4, "nombre_tienda": "Librería Central", "tarifa_envio": 12},
    ]
    cursor.fetchone.return_value = {"total": 112, "costo_envio": 12}
    monkeypatch.setattr(database, "get_db", lambda: db)
    store = {"7": [{"id_orden": 5, "total": 112}]}
    monkeypatch.setattr(payment_model, "_load_store", lambda _path: store)
    monkeypatch.setattr(payment_model, "_save_store", lambda _path, value: store.update(value))

    result = payments.actualizar_costo_envio(
        5, {"tipo_entrega": "retiro_tienda"}, {"sub": "7"},
    )
    assert result["ok"] is True
    assert result["costo_envio"] == 0
    assert result["total"] == 100
    assert store["7"][0]["tipo_entrega"] == "retiro_tienda"
    db.commit.assert_called_once()


def test_seller_resolution_falls_back_and_admin_orders_are_sorted(monkeypatch):
    import app.models.libro as book_model
    import app.models.payments as payment_model
    import app.models.tiendas as store_model

    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: {"items": [{"id_libro": 3}]})
    monkeypatch.setattr(book_model, "obtener_libro_por_id", lambda _book: {"id_tienda": 8})
    monkeypatch.setattr(store_model, "obtener_tienda_por_id", lambda _store: {"id_usuario": 12})
    assert payments._resolver_vendedor(7, 4) == 12

    monkeypatch.setattr(store_model, "obtener_tienda_por_id", lambda _store: None)
    assert payments._resolver_vendedor(7, 4) == 7

    monkeypatch.setattr(payment_model, "_load_store", lambda _path: {
        "7": [{"id_orden": 1, "fecha": "2026-01-01"}],
        "8": [{"id_orden": 2, "fecha": "2026-02-01"}],
    })
    orders = payments.get_all_orders_admin({"rol": "administrador"})
    assert [order["id_orden"] for order in orders] == [2, 1]
    assert orders[0]["id_usuario_propietario"] == 8
    with pytest.raises(HTTPException) as forbidden:
        payments.get_all_orders_admin({"rol": "vendedor"})
    assert forbidden.value.status_code == 403
