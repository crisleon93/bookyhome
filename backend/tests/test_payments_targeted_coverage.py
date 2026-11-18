import json
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import app.models.payments as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_store_helpers_and_single_order_database_hydration(tmp_path, monkeypatch):
    missing = tmp_path / "missing.json"
    broken = tmp_path / "broken.json"
    broken.write_text("{", encoding="utf-8")
    assert mod._load_store(str(missing)) == {}
    assert mod._load_store(str(broken)) == {}

    saved = tmp_path / "saved.json"
    mod._save_store(str(saved), {"a": "á"})
    assert json.loads(saved.read_text(encoding="utf-8")) == {"a": "á"}

    monkeypatch.setattr(mod, "ORDER_FILE", str(missing))
    db, cursor = _db()
    cursor.fetchone.return_value = {
        "id_orden": 12, "estado_orden": "enviado", "total": "125.50",
        "costo_envio": "5", "tipo_entrega": "domicilio", "estado_retiro": "en_tienda",
        "pin_retiro": "1234", "fecha_limite_retiro": datetime(2030, 1, 1),
        "metodo_pago": "tarjeta", "nombre_tienda": "Librería", "direccion_tienda": None,
        "telefono_tienda": None, "numero_guia": "G-12", "empresa_mensajeria": "Envíos",
        "estado_envio": "En camino",
    }
    cursor.fetchall.side_effect = [
        [{
            "id_libro": 4, "titulo": "Libro", "autor_libro": "Ana", "cantidad": 2,
            "precio_unitario": "50", "precio_final": "100", "imagen_url": "/img.jpg",
        }],
        [{"id_tienda": 7, "nombre_tienda": "Librería", "tarifa_envio": "8.5"}],
    ]
    with patch("app.database.get_db", return_value=db):
        order = mod.obtener_orden(5, 12)

    assert order["estado"] == "enviado"
    assert order["items"][0]["precio_final"] == 100
    assert order["tienda_retiro"]["direccion"] == "Punto principal de la librería"
    assert order["envio"]["numero_guia"] == "G-12"
    assert order["desglose_envio"][0]["costo"] == 8.5
    assert order["desglose_financiero"]["comision_bookyhome"] == 18.82
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_order_history_links_legacy_orders_and_imports_database_orders(tmp_path, monkeypatch):
    local_file = tmp_path / "orders.json"
    local_file.write_text(json.dumps({
        "3": [{
            "id_orden": 90, "total": 25, "fecha": "2025-01-01",
            "items": [{"id_libro": 4, "cantidad": 1}],
        }]
    }), encoding="utf-8")
    monkeypatch.setattr(mod, "ORDER_FILE", str(local_file))

    db, cursor = _db()
    base = {
        "estado_orden": "Pagada", "total": 25, "fecha_orden": datetime(2025, 1, 1),
        "tipo_entrega": "domicilio", "estado_retiro": None, "pin_retiro": None,
        "fecha_limite_retiro": None, "metodo_pago": "tarjeta", "id_empresa": 2,
        "empresa_mensajeria": "Correo", "numero_guia": "G-7", "estado_envio": None,
        "fecha_despacho": datetime(2025, 1, 2), "nombre_tienda": "Tienda",
        "direccion": "Calle 1", "telefono_tienda": "300", "firma_items": "4:1",
    }
    matched = dict(base, id_orden=7)
    unmatched = dict(base, id_orden=8, total=40, firma_items="9:2", numero_guia=None)
    cursor.fetchall.side_effect = [
        [matched, unmatched],
        [{
            "id_libro": 9, "cantidad": 2, "precio_unitario": "20",
            "precio_final": "40", "titulo": "Nuevo", "autor_libro": "Autor",
            "nombre_tienda": "Tienda", "imagen_url": "/nuevo.jpg",
        }],
    ]
    cursor.fetchone.side_effect = [
        {"url_imagen": "/portada.jpg"},
        {"nombre_tienda": "Tienda"},
    ]
    with patch("app.models.envios.limpiar_envios_no_pagados"), \
         patch("app.database.get_db", return_value=db):
        result = mod.obtener_ordenes_usuario(3)

    assert len(result) == 2
    linked = next(order for order in result if order["id_orden"] == 90)
    imported = next(order for order in result if order["id_orden"] == 8)
    assert linked["id_orden_db"] == 7
    assert linked["items"][0]["imagen_url"] == "/portada.jpg"
    assert linked["envio"]["url_rastreo"]
    assert imported["items"][0]["total"] == 40
    assert imported["estado"] == "pagado"
    assert json.loads(local_file.read_text(encoding="utf-8"))["3"][0]["id_orden_db"] == 7
    db.close.assert_called_once()


def test_payment_direct_lookup_coupon_and_invalid_state(tmp_path, monkeypatch):
    order_file = tmp_path / "orders.json"
    payment_file = tmp_path / "payments.json"
    order_file.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))
    monkeypatch.setattr(mod, "PAYMENT_FILE", str(payment_file))
    db, cursor = _db()
    cursor.fetchone.return_value = {
        "id_orden": 4, "total": 100, "estado_orden": "pendiente",
        "tipo_entrega": None, "pin_retiro": None, "estado_retiro": None,
    }
    cursor.fetchall.side_effect = [
        [{"id_libro": 2}],
        [{"id_vendedor": 8, "nombre_tienda": "Tienda"}],
    ]
    with patch("app.database.get_db", return_value=db):
        result = mod.registrar_pago(
            3, 4, 0, "tarjeta", coupon_code="PROMO", tipo_entrega="retiro_tienda",
            id_direccion=11,
        )
    assert result["ok"] is True
    assert result["transaction"]["monto"] == 100
    assert result["order"]["cupon_aplicado"] == "PROMO"
    assert result["order"]["id_direccion"] == 11
    assert json.loads(payment_file.read_text(encoding="utf-8"))[0]["estado"] == "aprobado"

    order_file.write_text(json.dumps({"3": [{"id_orden": 5, "estado": "cancelada"}]}), encoding="utf-8")
    assert "estado" in mod.registrar_pago(3, 5, 1, "tarjeta")["error"]


def test_pickup_notifications_and_completion_update_json_and_database(tmp_path, monkeypatch):
    order_file = tmp_path / "orders.json"
    order_file.write_text(json.dumps({"3": [{
        "id_orden": 6, "id_orden_db": 6, "total": 50,
        "estado": "pendiente", "items": [],
    }]}), encoding="utf-8")
    monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))
    db, cursor = _db()
    cursor.fetchone.return_value = {
        "id_vendedor": 9, "nombre_tienda": "Librería", "direccion": "Calle",
        "telefono": "300", "comprador_nombre": "Comprador", "pin_retiro": "4321",
        "id_usuario": 3, "total": 50,
    }
    with patch("app.database.get_db", return_value=db):
        reserved = mod.reservar_retiro(3, 6)
        arrived = mod.notificar_llegada_tienda(3, 6)
        enabled = mod.habilitar_pago_retiro(9, 6)
        delivered = mod.confirmar_entrega_retiro(9, 6, es_efectivo=True)

    assert reserved["tienda"]["nombre_tienda"] == "Librería"
    assert arrived["estado_retiro"] == "en_tienda"
    assert enabled["estado_retiro"] == "habilitado_pago"
    assert delivered["estado_retiro"] == "entregado"
    saved = json.loads(order_file.read_text(encoding="utf-8"))["3"][0]
    assert saved["estado"] == "entregada"
    assert saved["metodo_pago"] == "Efectivo en Tienda"
    assert db.commit.call_count == 4
    assert db.close.call_count == 4
