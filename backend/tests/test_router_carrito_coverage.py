"""Casos de contrato para las rutas del carrito.

Estas pruebas llaman las funciones del router directamente y sustituyen el
modelo de persistencia. Así se valida la normalización que hace la capa HTTP
sin depender del archivo JSON usado por el modelo.
"""

import pytest
from fastapi import HTTPException

import app.routers.carrito as carrito


def test_current_user_and_user_id_validate_the_token(monkeypatch):
    credentials = type("Credentials", (), {"credentials": "token"})()

    monkeypatch.setattr(carrito, "verify_token", lambda _: None)
    with pytest.raises(HTTPException) as error:
        carrito.get_current_user(credentials)
    assert error.value.status_code == 401

    monkeypatch.setattr(carrito, "verify_token", lambda _: {"sub": "17"})
    assert carrito.get_current_user(credentials) == {"sub": "17"}
    assert carrito._get_user_id({"sub": "17"}) == 17


def test_cart_routes_delegate_with_the_authenticated_user(monkeypatch):
    calls = {}

    monkeypatch.setattr(carrito, "obtener_carrito", lambda user_id: [{"id_libro": user_id}])
    monkeypatch.setattr(carrito, "agregar_al_carrito", lambda user_id, item: calls.update(add=(user_id, item)) or item)
    monkeypatch.setattr(carrito, "eliminar_item_carrito", lambda user_id, book_id: calls.update(remove=(user_id, book_id)) or {"ok": True})
    monkeypatch.setattr(carrito, "vaciar_carrito", lambda user_id: calls.update(clear=user_id) or {"ok": True})

    user = {"sub": "9"}
    assert carrito.get_my_carrito(user) == [{"id_libro": 9}]
    item = carrito.add_to_cart(
        {"id_libro": "11", "cantidad": 0, "precio_libro": "24500", "titulo": "El libro"}, user
    )
    assert item["id_libro"] == 11
    assert item["cantidad"] == 1
    assert item["precio_libro"] == 24500.0
    assert calls["add"] == (9, item)
    assert carrito.remove_from_cart(11, user) == {"ok": True}
    assert calls["remove"] == (9, 11)
    assert carrito.clear_my_cart(user) == {"ok": True}
    assert calls["clear"] == 9


def test_cart_rejects_missing_book_and_converts_checkout_failures(monkeypatch):
    user = {"sub": "9"}
    with pytest.raises(HTTPException) as missing_book:
        carrito.add_to_cart({}, user)
    assert missing_book.value.status_code == 400

    checkout_calls = []
    monkeypatch.setattr(
        carrito, "checkout_carrito",
        lambda *args: checkout_calls.append(args) or {"ok": True, "orden": 3},
    )
    assert carrito.checkout({"id_direccion": 4, "tipo_entrega": "retiro"}, user)["orden"] == 3
    assert checkout_calls == [(9, 4, "retiro")]

    monkeypatch.setattr(carrito, "checkout_carrito", lambda *_: {"ok": False, "error": "Sin existencias"})
    with pytest.raises(HTTPException) as checkout_error:
        carrito.checkout(None, user)
    assert checkout_error.value.status_code == 400
    assert checkout_error.value.detail == "Sin existencias"


def test_update_cart_quantity_endpoint(monkeypatch):
    calls = []
    monkeypatch.setattr(
        carrito,
        "actualizar_cantidad_carrito",
        lambda user_id, book_id, cantidad: calls.append((user_id, book_id, cantidad)) or [{"id_libro": book_id, "cantidad": cantidad}],
    )

    user = {"sub": "15"}
    # Falla si falta 'cantidad'
    with pytest.raises(HTTPException) as missing_field:
        carrito.update_cart_quantity(5, {}, user)
    assert missing_field.value.status_code == 400

    # Actualiza correctamente con cantidad válida
    result = carrito.update_cart_quantity(5, {"cantidad": 3}, user)
    assert result == [{"id_libro": 5, "cantidad": 3}]
    assert calls == [(15, 5, 3)]


def test_direct_checkout_passes_payload_and_surfaces_model_errors(monkeypatch):
    received = []
    user = {"sub": "9"}
    monkeypatch.setattr(
        carrito, "crear_orden_directa",
        lambda *args: received.append(args) or {"ok": True, "orden": 8},
    )

    payload = {"id_libro": 2, "id_direccion": 5}
    assert carrito.checkout_directo(payload, user)["orden"] == 8
    assert received == [(9, payload, 5, "domicilio")]

    monkeypatch.setattr(carrito, "crear_orden_directa", lambda *_: {"ok": False, "error": "Pago rechazado"})
    with pytest.raises(HTTPException) as error:
        carrito.checkout_directo({"id_libro": 2}, user)
    assert error.value.status_code == 400
    assert error.value.detail == "Pago rechazado"
