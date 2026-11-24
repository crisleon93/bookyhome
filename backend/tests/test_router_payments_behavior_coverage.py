import asyncio
from datetime import datetime
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
    monkeypatch.setattr(payments, "is_smtp_configured", lambda: True)
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
    import app.database as database
    import app.models.libro as book_model
    import app.models.payments as payment_model
    import app.models.tiendas as store_model

    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: {"items": [{"id_libro": 3}]})
    monkeypatch.setattr(book_model, "obtener_libro_por_id", lambda _book: {"id_tienda": 8})
    monkeypatch.setattr(store_model, "obtener_tienda_por_id", lambda _store: {"id_usuario": 12})
    assert payments._resolver_vendedor(7, 4) == 12

    monkeypatch.setattr(store_model, "obtener_tienda_por_id", lambda _store: None)
    assert payments._resolver_vendedor(7, 4) == 7

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = []
    monkeypatch.setattr(database, "get_db", lambda: db)
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


def test_current_user_rejects_invalid_token_and_resolver_handles_exceptions(monkeypatch):
    credentials = MagicMock(credentials="bad-token")
    monkeypatch.setattr(payments, "verify_token", lambda _token: None)
    with pytest.raises(HTTPException) as rejected:
        payments.get_current_user(credentials)
    assert rejected.value.status_code == 401

    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: (_ for _ in ()).throw(RuntimeError("db down")))
    assert payments._resolver_vendedor(7, 4) == 7


def test_order_details_and_transfer_lookup_cover_success(monkeypatch):
    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: {
        "id_orden": 4,
        "items": [{"id_libro": 2}],
    })
    assert payments.get_order_details(4, {"sub": "7"})["id_orden"] == 4

    import app.database as database
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.side_effect = [
        [{"id_tienda": 8, "nombre_tienda": None, "id_vendedor": 12, "nombre_usuario": None}],
        [{"id_metodo": 1, "es_principal": True, "banco": "Banco"}],
    ]
    monkeypatch.setattr(database, "get_db", lambda: db)

    result = payments.get_order_seller_transfer_details(4, {"sub": "7"})
    assert result["ok"] is True
    assert result["vendedores"][0]["tiene_cuenta"] is True
    assert result["vendedores"][0]["nombre_tienda"] == "Librería Aliada"
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_transfer_lookup_covers_database_cart_fallback_and_errors(monkeypatch):
    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: {"items": []})
    import app.database as database
    import app.models.carrito as cart_model

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.side_effect = [
        [{"id_libro": 3}],
        [{"id_tienda": 8, "nombre_tienda": "Central", "id_vendedor": 12, "nombre_usuario": "Vendedor"}],
        [],
    ]
    monkeypatch.setattr(database, "get_db", lambda: db)
    monkeypatch.setattr(cart_model, "obtener_carrito", lambda _uid: [{"id_libro": 9}])

    result = payments.get_order_seller_transfer_details(4, {"sub": "7"})
    assert result["ok"] is True
    assert len(result["vendedores"]) == 1

    cursor.fetchall.side_effect = RuntimeError("seller query failed")
    result = payments.get_order_seller_transfer_details(4, {"sub": "7"})
    assert result["ok"] is False
    assert "seller query failed" in result["error"]

    monkeypatch.setattr(database, "get_db", lambda: (_ for _ in ()).throw(RuntimeError("database unavailable")))
    monkeypatch.setattr(cart_model, "obtener_carrito", lambda _uid: (_ for _ in ()).throw(RuntimeError("cart unavailable")))
    result = payments.get_order_seller_transfer_details(4, {"sub": "7"})
    assert result == {"ok": True, "vendedores": []}


def test_cancel_pending_database_and_store_errors_are_handled(monkeypatch):
    import app.database as database
    import app.models.payments as payment_model

    monkeypatch.setattr(database, "get_db", lambda: (_ for _ in ()).throw(RuntimeError("database unavailable")))
    with pytest.raises(HTTPException) as database_error:
        payments.cancelar_mis_pendientes({"sub": "7"})
    assert database_error.value.status_code == 500

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = []
    monkeypatch.setattr(database, "get_db", lambda: db)
    monkeypatch.setattr(payment_model, "_load_store", lambda _path: (_ for _ in ()).throw(RuntimeError("bad store")))
    result = payments.cancelar_mis_pendientes({"sub": "7"})
    assert result["ok"] is True
    assert result["canceladas"] == 0


def test_shipping_lookup_missing_order_row_and_domestic_cost(monkeypatch):
    import app.database as database
    import app.models.payments as payment_model

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = []
    monkeypatch.setattr(database, "get_db", lambda: db)
    result = payments.actualizar_costo_envio(5, {"tipo_entrega": "domicilio"}, {"sub": "7"})
    assert result == {"ok": False, "error": "Orden no encontrada"}

    cursor.fetchall.return_value = [{"id_tienda": 4, "nombre_tienda": "Central", "tarifa_envio": "10"}]
    cursor.fetchone.return_value = None
    result = payments.actualizar_costo_envio(5, {"tipo_entrega": "domicilio"}, {"sub": "7"})
    assert result == {"ok": False, "error": "Orden no encontrada"}

    cursor.fetchone.return_value = {"total": 110, "costo_envio": 10}
    store = {"7": [{"id_orden": 5, "total": 110}]}
    monkeypatch.setattr(payment_model, "_load_store", lambda _path: store)
    monkeypatch.setattr(payment_model, "_save_store", lambda _path, value: store.update(value))
    result = payments.actualizar_costo_envio(5, {"tipo_entrega": "domicilio"}, {"sub": "7"})
    assert result["costo_envio"] == 10
    assert result["total"] == 110


def test_shipping_database_exception_is_translated(monkeypatch):
    import app.database as database
    monkeypatch.setattr(database, "get_db", lambda: (_ for _ in ()).throw(RuntimeError("shipping db down")))
    with pytest.raises(HTTPException) as failed:
        payments.actualizar_costo_envio(5, None, {"sub": "7"})
    assert failed.value.status_code == 500
    assert "shipping db down" in failed.value.detail


def test_admin_orders_normalize_database_rows_and_merge_store_fallback(monkeypatch):
    import app.database as database
    import app.models.payments as payment_model

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor

    def row(order_id, state, **overrides):
        data = {
            "id_orden": order_id,
            "id_usuario": 7,
            "fecha_orden": datetime(2026, 1, order_id),
            "total": 100,
            "estado_orden": state,
            "tipo_entrega": "domicilio",
            "estado_retiro": "reservado",
            "pin_retiro": "1234",
            "fecha_limite_retiro": datetime(2026, 2, order_id),
            "metodo_pago": "Tarjeta",
            "costo_envio": 5,
            "comprador": " Ana ",
            "email_comprador": "ana@example.test",
            "telefono_comprador": "300",
            "foto_comprador": "/ana.jpg",
            "vendedor_tienda": "Librería",
            "foto_vendedor": "/tienda.jpg",
            "telefono_tienda": "301",
            "numero_guia": "G-1",
            "empresa_mensajeria": "Correo",
            "estado_envio": "En camino",
            "fecha_despacho": datetime(2026, 1, order_id),
            "fecha_estimada_entrega": datetime(2026, 2, order_id),
            "direccion_completa": "Calle 1",
            "ciudad_destino": "Bogotá",
            "departamento_destino": "Cundinamarca",
            "total_items": 2,
        }
        data.update(overrides)
        return data

    cursor.fetchall.return_value = [
        row(1, "pagado"),
        row(2, "enviada"),
        row(3, "entregado"),
        row(4, "cancelada"),
        row(5, "en revisión"),
        row(
            6,
            None,
            fecha_orden=None,
            total=None,
            tipo_entrega=None,
            estado_retiro=None,
            pin_retiro=None,
            fecha_limite_retiro=None,
            metodo_pago=None,
            costo_envio=None,
            comprador=None,
            id_usuario=None,
            email_comprador=None,
            telefono_comprador=None,
            foto_comprador=None,
            vendedor_tienda=None,
            foto_vendedor=None,
            telefono_tienda=None,
            numero_guia=None,
            empresa_mensajeria=None,
            estado_envio=None,
            fecha_despacho=None,
            fecha_estimada_entrega=None,
            direccion_completa=None,
            ciudad_destino=None,
            departamento_destino=None,
            total_items=0,
        ),
    ]
    monkeypatch.setattr(database, "get_db", lambda **_kwargs: db)
    monkeypatch.setattr(payment_model, "_load_store", lambda _path: {
        "7": [{"id_orden": 1, "fecha": "duplicada"}, {"id_orden": 10, "fecha": "2026-03-01"}],
    })

    result = payments.get_all_orders_admin({"rol": "admin"})
    by_id = {order["id_orden"]: order for order in result}

    assert by_id[1]["estado"] == "pagada"
    assert by_id[2]["estado"] == "enviada"
    assert by_id[3]["estado"] == "entregada"
    assert by_id[4]["estado"] == "cancelada"
    assert by_id[5]["estado"] == "en revisión"
    assert by_id[6]["nombre_usuario"] == "Usuario #None"
    assert by_id[6]["estado_envio"] == "pendiente"
    assert by_id[6]["empresa_mensajeria"] == "Retiro en Tienda"
    assert by_id[6]["total_items"] == 1
    assert by_id[10]["id_usuario_propietario"] == 7
    assert len(result) == 7
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_admin_orders_and_items_handle_access_and_database_failures(monkeypatch):
    import app.database as database

    with pytest.raises(HTTPException) as forbidden:
        payments.get_all_orders_admin({"rol": "comprador"})
    assert forbidden.value.status_code == 403
    with pytest.raises(HTTPException) as items_forbidden:
        payments.get_admin_order_items(3, {"rol": "comprador"})
    assert items_forbidden.value.status_code == 403

    monkeypatch.setattr(
        database,
        "get_db",
        lambda **_kwargs: (_ for _ in ()).throw(RuntimeError("admin database unavailable")),
    )
    assert payments.get_admin_order_items(3, {"rol": "admin"}) == []


def test_admin_orders_still_returns_database_rows_when_json_store_fails(monkeypatch):
    import app.database as database
    import app.models.payments as payment_model

    db = MagicMock()
    cursor = MagicMock()
    cursor.fetchall.return_value = []
    db.cursor.return_value = cursor
    monkeypatch.setattr(database, "get_db", lambda **_kwargs: db)
    monkeypatch.setattr(
        payment_model,
        "_load_store",
        lambda _path: (_ for _ in ()).throw(RuntimeError("store unavailable")),
    )

    assert payments.get_all_orders_admin({"rol": "administrador"}) == []
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_admin_order_items_formats_defaults_and_sends_confirmation_errors(monkeypatch):
    import app.database as database

    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = [
        {
            "id_detalle": 1,
            "id_orden": 8,
            "id_libro": 4,
            "cantidad": "2",
            "precio_unitario": "15000",
            "precio_final": "25000",
            "titulo": "Libro",
            "autor_libro": "Autora",
            "isbn": "ISBN-4",
            "nombre_tienda": "Librería",
            "imagen_portada": "/portada.jpg",
        },
        {
            "id_detalle": 2,
            "id_orden": 8,
            "id_libro": 5,
            "cantidad": 1,
            "precio_unitario": "9000",
            "precio_final": None,
            "titulo": None,
            "autor_libro": None,
            "isbn": None,
            "nombre_tienda": None,
            "imagen_portada": None,
        },
    ]
    monkeypatch.setattr(database, "get_db", lambda **_kwargs: db)

    items = payments.get_admin_order_items(8, {"rol": "administrador"})
    assert items[0]["precio_final"] == 25000
    assert items[1] == {
        "id_detalle": 2,
        "id_orden": 8,
        "id_libro": 5,
        "cantidad": 1,
        "precio_unitario": 9000.0,
        "precio_final": 9000.0,
        "titulo": "Libro #5",
        "autor_libro": "",
        "isbn": "",
        "nombre_tienda": "Librería BookyHome",
        "imagen_portada": "",
    }
    cursor.close.assert_called_once()
    db.close.assert_called_once()

    monkeypatch.setattr(payments, "obtener_orden", lambda *_args: {"id_orden": 8})
    monkeypatch.setattr(payments, "obtener_email_usuario", lambda _user: "buyer@example.test")
    monkeypatch.setattr(payments, "is_smtp_configured", lambda: True)
    send = AsyncMock(side_effect=RuntimeError("SMTP unavailable"))
    monkeypatch.setattr(payments, "enviar_email_confirmacion", send)
    with pytest.raises(HTTPException) as mail_error:
        asyncio.run(payments.send_order_confirmation(8, {"sub": "7"}))
    assert mail_error.value.status_code == 503
    send.assert_awaited_once()
