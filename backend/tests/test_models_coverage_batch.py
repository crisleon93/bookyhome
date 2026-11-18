import json
from unittest.mock import MagicMock, patch


def _mock_db(fetchone_values=()):
    db = MagicMock()
    cursor = MagicMock()
    cursor.fetchone.side_effect = list(fetchone_values)
    cursor.fetchall.return_value = []
    cursor.lastrowid = 41
    db.cursor.return_value = cursor
    return db, cursor


def test_cart_checkout_persists_order_details_and_empties_cart(tmp_path, monkeypatch):
    import app.models.carrito as cart

    cart_file = tmp_path / "cart.json"
    order_file = tmp_path / "orders.json"
    item = {
        "id_libro": 12, "titulo": "Libro", "precio_libro": 25000,
        "cantidad": 2, "id_variante": 3,
    }
    cart_file.write_text(json.dumps({"7": [item]}))
    order_file.write_text(json.dumps({}))
    monkeypatch.setattr(cart, "CART_FILE", str(cart_file))
    monkeypatch.setattr(cart, "ORDER_FILE", str(order_file))
    db, cursor = _mock_db([{"id_direccion": 9}])
    monkeypatch.setattr(cart, "get_db", lambda: db)

    result = cart.checkout_carrito(7, id_direccion=9, tipo_entrega="retiro_tienda")

    assert result["ok"] is True
    assert result["order"]["subtotal"] == 50000
    assert result["order"]["total"] == 50000
    assert result["order"]["id_orden_db"] == 41
    assert cart.obtener_carrito(7) == []
    assert len(json.loads(order_file.read_text())["7"]) == 1
    assert cursor.execute.call_count == 3
    db.commit.assert_called_once()


def test_direct_cart_order_keeps_cart_and_rejects_missing_book(tmp_path, monkeypatch):
    import app.models.carrito as cart

    cart_file = tmp_path / "cart.json"
    order_file = tmp_path / "orders.json"
    cart_file.write_text(json.dumps({"1": [
        {"id_libro": 5, "titulo": "Test", "precio_libro": 20000, "cantidad": 1},
        {"id_libro": 6, "titulo": "Otro", "precio_libro": 15000, "cantidad": 1},
    ]}))
    order_file.write_text(json.dumps({}))
    monkeypatch.setattr(cart, "CART_FILE", str(cart_file))
    monkeypatch.setattr(cart, "ORDER_FILE", str(order_file))
    result = cart.crear_orden_directa(1, {}, tipo_entrega="retiro_tienda")
    assert result["ok"] is False
    assert cart.obtener_carrito(1)

    db, cursor = _mock_db([None])
    monkeypatch.setattr(cart, "get_db", lambda: db)
    result = cart.crear_orden_directa(
        1,
        {
            "id_libro": 5, "titulo": "Test", "precio_libro": 20000,
            "cantidad": 2, "autor": "Autora",
        },
        tipo_entrega="retiro_tienda",
    )
    assert result["ok"] is True
    assert result["order"]["total"] == 40000
    assert result["order"]["items"][0]["autor_libro"] == "Autora"
    assert [item["id_libro"] for item in cart.obtener_carrito(1)] == [6]
    assert len(json.loads(order_file.read_text())["1"]) == 1
    assert cursor.execute.call_count == 3
    db.commit.assert_called_once()
    assert cart_file.exists()


def test_store_listing_state_change_and_id_lookup(monkeypatch):
    import app.models.tiendas as stores

    db, cursor = _mock_db()
    cursor.fetchall.return_value = [{"id_tienda": 2}]
    cursor.fetchone.side_effect = [
        {"id_tienda": 2, "id_usuario": 7, "nombre_tienda": "Libreria"},
        {"id_usuario": 1, "nombre_usuario": "Admin"},
        None,
    ]
    monkeypatch.setattr(stores, "get_db", lambda: db)

    assert stores.obtener_tiendas() == [{"id_tienda": 2}]
    assert stores.actualizar_estado_tienda(2, "suspendida", motivo="Reglas", admin_user_id=1) == {
        "ok": True, "mensaje_enviado": True,
    }
    assert cursor.execute.call_count >= 8
    assert db.commit.call_count >= 4
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2

    cursor.fetchone.side_effect = None
    cursor.fetchone.return_value = {"id_tienda": 2}
    assert stores.obtener_tienda_por_id(2) == {"id_tienda": 2}
    assert cursor.execute.call_args.args[1] == (2,)


def test_store_state_change_returns_not_found_without_updating(monkeypatch):
    import app.models.tiendas as stores

    db, cursor = _mock_db([None])
    monkeypatch.setattr(stores, "get_db", lambda: db)
    result = stores.actualizar_estado_tienda(99, "activa")
    assert result == {"ok": False, "error": "Tienda no encontrada"}
    assert cursor.execute.call_count == 1
    db.commit.assert_not_called()


def test_user_lookup_legacy_email_and_verification_token_paths(monkeypatch):
    import app.models.usuarios as users

    db, cursor = _mock_db([{
        "id_usuario": 4, "correo_usuario": "buyer@example.com",
    }])
    cursor.execute.side_effect = [
        Exception("Unknown column 'email_verificado'"),
        None,
        Exception("Unknown column 'token_verificacion'"),
        None,
    ]
    monkeypatch.setattr(users, "get_db", lambda: db)

    usuario = users.obtener_usuario_por_email("buyer@example.com")
    assert usuario["email_verificado"] is True
    assert users.obtener_usuario_por_token("legacy-token") is None

    cursor.execute.side_effect = None
    cursor.rowcount = 0
    assert users.verificar_email_usuario("invalid") == {
        "ok": False, "error": "Token inválido o expirado",
    }
    cursor.rowcount = 1
    assert users.verificar_email_usuario("valid") == {"ok": True}
    assert db.commit.call_count == 2
    assert cursor.close.call_count == 4


def test_user_id_lookup_and_email_lookup_missing_records(monkeypatch):
    import app.models.usuarios as users

    db, cursor = _mock_db([None, None])
    monkeypatch.setattr(users, "get_db", lambda: db)
    assert users.obtener_usuario_por_id(404) is None
    assert users.obtener_email_usuario(404) is None
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_pickup_lifecycle_updates_json_and_sends_relevant_notifications(tmp_path, monkeypatch):
    import app.models.payments as payments

    order_file = tmp_path / "orders.json"
    order_file.write_text(json.dumps({"5": [{
        "id_orden": 11, "id_orden_db": 111, "total": 36000, "estado": "pagado",
    }]}))
    monkeypatch.setattr(payments, "ORDER_FILE", str(order_file))

    db_reserve, reserve_cursor = _mock_db([{
        "id_vendedor": 8, "nombre_tienda": "Libreria", "direccion": "Calle 1",
        "telefono": "123", "comprador_nombre": "Comprador",
    }])
    db_arrival, arrival_cursor = _mock_db([{
        "id_vendedor": 8, "cliente_nombre": "Comprador", "pin_retiro": "1234",
    }])
    db_enable, enable_cursor = _mock_db([{"id_usuario": 5}])
    db_delivery, delivery_cursor = _mock_db([{"id_usuario": 5, "total": 36000}])
    database_mocks = [db_reserve, db_arrival, db_enable, db_delivery]
    with patch("app.database.get_db", side_effect=database_mocks):
        reserved = payments.reservar_retiro(5, 11)
        arrived = payments.notificar_llegada_tienda(5, 11)
        enabled = payments.habilitar_pago_retiro(8, 11)
        delivered = payments.confirmar_entrega_retiro(8, 11, es_efectivo=True)

    assert reserved["tienda"]["nombre_tienda"] == "Libreria"
    assert reserved["order"]["estado_retiro"] == "reservado"
    assert arrived["estado_retiro"] == "en_tienda"
    assert enabled["estado_retiro"] == "habilitado_pago"
    assert delivered["estado_retiro"] == "entregado"
    final_order = json.loads(order_file.read_text())["5"][0]
    assert final_order["estado"] == "entregada"
    assert final_order["metodo_pago"] == "Efectivo en Tienda"
    assert all(db.commit.called for db in database_mocks)
    assert all(cursor.close.called for cursor in (
        reserve_cursor, arrival_cursor, enable_cursor, delivery_cursor,
    ))
