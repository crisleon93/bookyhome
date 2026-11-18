import json
from unittest.mock import MagicMock, patch

import app.models.envios as mod


def _db_cursor():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_listar_empresas_y_cargar_archivos_ausentes_o_invalidos(tmp_path):
    orders_file = tmp_path / "orders.json"
    with patch.object(mod, "ORDER_FILE", str(orders_file)):
        assert len(mod.listar_empresas()) == 10
        assert mod._load_orders() == {}
        orders_file.write_text("{", encoding="utf-8")
        assert mod._load_orders() == {}
        orders_file.write_text('{"3": []}', encoding="utf-8")
        assert mod._load_orders() == {"3": []}
    with patch.object(mod, "ORDER_FILE", str(tmp_path)):
        assert mod._load_orders() == {}


def test_guardar_pedidos_serializa_json_utf8(tmp_path):
    orders_file = tmp_path / "orders.json"
    orders = {"1": [{"estado": "enviado", "tienda": "Librería"}]}
    with patch.object(mod, "ORDER_FILE", str(orders_file)):
        mod._save_orders(orders)

    assert json.loads(orders_file.read_text(encoding="utf-8")) == orders


def test_limpiar_envios_quita_guias_de_ordenes_no_pagadas_y_solo_guarda_si_cambia():
    orders = {
        "1": [
            {"estado": "pagado", "envio": {"numero_guia": "A"}},
            {"estado": "ENVIADO", "envio": {"numero_guia": "B"}},
            {"estado": "Entregado", "envio": {"numero_guia": "C"}},
        ],
        "2": [
            {"estado": "pendiente", "envio": {"numero_guia": "D"}},
            {"envio": {"numero_guia": "E"}},
        ],
    }
    with patch.object(mod, "_load_orders", return_value=orders), \
         patch.object(mod, "_save_orders") as save_orders:
        assert mod.limpiar_envios_no_pagados() is True

    assert [order.get("envio") for order in orders["1"]] == [
        {"numero_guia": "A"}, {"numero_guia": "B"}, {"numero_guia": "C"},
    ]
    assert all("envio" not in order for order in orders["2"])
    save_orders.assert_called_once_with(orders)

    with patch.object(mod, "_load_orders", return_value={"1": [{"estado": "pagado", "envio": {}}]}), \
         patch.object(mod, "_save_orders") as save_orders:
        assert mod.limpiar_envios_no_pagados() is False
    save_orders.assert_not_called()


def test_registrar_envio_rechaza_empresa_orden_inexistente_y_orden_no_pagada():
    with patch("app.database.get_db") as get_db:
        assert mod.registrar_envio(1, 2, 3, 999, "X") == (
            None, "La empresa de mensajería no es válida",
        )
        get_db.assert_not_called()

    db, cursor = _db_cursor()
    cursor.fetchone.return_value = None
    with patch("app.database.get_db", return_value=db):
        assert mod.registrar_envio(1, 2, 3, 1, "X") == (None, "Orden no encontrada")

    cursor.fetchone.return_value = {"estado_orden": "pendiente"}
    with patch("app.database.get_db", return_value=db):
        assert mod.registrar_envio(1, 2, 3, 1, "X") == (
            None, "La guía solo puede registrarse cuando el pedido esté pagado",
        )
    db.commit.assert_not_called()
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_registrar_envio_actualiza_mysql_y_sincroniza_por_id_de_bd():
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = {
        "estado_orden": "pagado",
        "nombre_tienda": "Librería Uno",
        "direccion": "Calle 10",
    }
    pedidos = {"7": [{"id_orden": "local-42", "id_orden_db": 42, "estado": "pagado"}]}
    with patch("app.database.get_db", return_value=db), \
         patch.object(mod, "_load_orders", return_value=pedidos), \
         patch.object(mod, "_save_orders") as save_orders:
        envio, error = mod.registrar_envio(7, 42, 3, 3, "GUIA-42")

    assert error is None
    assert envio["empresa_mensajeria"] == "Coordinadora"
    assert envio["url_rastreo"] == "https://www.coordinadora.com"
    assert envio["numero_guia"] == "GUIA-42"
    assert envio["origen"] == "Librería Uno · Calle 10"
    assert pedidos["7"][0]["estado"] == "enviado"
    assert pedidos["7"][0]["envio"] == envio
    save_orders.assert_called_once_with(pedidos)
    db.commit.assert_called_once()
    assert cursor.execute.call_count == 4


def test_registrar_envio_soporta_orden_json_legacy_y_notificacion_fallida():
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = {
        "estado_orden": "enviado",
        "nombre_tienda": "Librería Dos",
        "direccion": "",
    }
    pedidos = {"8": [{"id_orden": 43, "estado": "pagado"}]}
    cursor.execute.side_effect = [
        None, None, None, RuntimeError("notification table unavailable"),
    ]
    save_orders = MagicMock(side_effect=OSError("storage unavailable"))
    with patch("app.database.get_db", return_value=db), \
         patch.object(mod, "_load_orders", return_value=pedidos), \
         patch.object(mod, "_save_orders", new=save_orders):
        envio, error = mod.registrar_envio(8, 43, 4, 1, "GUIA-43")

    assert error is None
    assert envio["origen"] == "Librería Dos"
    assert pedidos["8"][0]["estado"] == "enviado"
    save_orders.assert_called_once_with(pedidos)
    db.commit.assert_called_once()
