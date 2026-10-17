"""
test_modelos_payments.py — Pruebas unitarias del modelo app.models.payments.

payments.py usa archivos JSON (orders.json, payments.json) como capa de
persistencia local, con sincronización a MySQL. Los tests usan tmp_path de
pytest para crear archivos temporales sin tocar los datos reales, y mockean
get_db para la parte MySQL.

Cubre: _normalizar_estado, registrar_pago, cancelar_orden.
"""

import json
import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path


# ---------------------------------------------------------------------------
# _normalizar_estado — función pura interna
# ---------------------------------------------------------------------------

class TestNormalizarEstado:
    def test_pagada_a_pagado(self):
        from app.models.payments import _normalizar_estado
        assert _normalizar_estado("pagada") == "pagado"

    def test_enviada_a_enviado(self):
        from app.models.payments import _normalizar_estado
        assert _normalizar_estado("enviada") == "enviado"

    def test_entregado_a_entregada(self):
        from app.models.payments import _normalizar_estado
        assert _normalizar_estado("entregado") == "entregada"

    def test_cancelado_a_cancelada(self):
        from app.models.payments import _normalizar_estado
        assert _normalizar_estado("cancelado") == "cancelada"

    def test_procesando_a_pagado(self):
        from app.models.payments import _normalizar_estado
        assert _normalizar_estado("Procesando") == "pagado"

    def test_estado_ya_normalizado_permanece(self):
        from app.models.payments import _normalizar_estado
        assert _normalizar_estado("pendiente") == "pendiente"

    def test_none_retorna_none(self):
        from app.models.payments import _normalizar_estado
        assert _normalizar_estado(None) is None


# ---------------------------------------------------------------------------
# registrar_pago — usa archivos JSON temporales
# ---------------------------------------------------------------------------

class TestRegistrarPago:
    def _orden_pendiente(self, id_orden=1, total=50000.0):
        return {
            "id_orden": id_orden,
            "id_orden_db": id_orden,
            "total": total,
            "estado": "pendiente",
            "estado_orden": "pendiente",
            "items": [],
        }

    def test_pago_exitoso_cambia_estado_a_pagado(self, tmp_path, monkeypatch):
        # Arrange — crear orders.json temporal con una orden pendiente
        order_file = tmp_path / "orders.json"
        payment_file = tmp_path / "payments.json"
        orden = self._orden_pendiente(id_orden=1, total=50000.0)
        order_file.write_text(json.dumps({"42": [orden]}))

        # Parchear las rutas de archivo y get_db
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))
        monkeypatch.setattr(mod, "PAYMENT_FILE", str(payment_file))

        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchall.return_value = []

        with patch("app.database.get_db", return_value=db_mock):
            # Act
            result = mod.registrar_pago(
                id_usuario=42, id_orden=1,
                amount=50000.0, payment_method="tarjeta"
            )

        # Assert
        assert result["ok"] is True
        assert result["transaction"]["estado"] == "aprobado"
        assert result["order"]["estado"] == "pagado"

    def test_orden_ya_pagada_retorna_already_paid(self, tmp_path, monkeypatch):
        order_file = tmp_path / "orders.json"
        payment_file = tmp_path / "payments.json"
        orden = self._orden_pendiente(id_orden=2)
        orden["estado"] = "pagado"
        orden["estado_orden"] = "pagado"
        order_file.write_text(json.dumps({"1": [orden]}))

        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))
        monkeypatch.setattr(mod, "PAYMENT_FILE", str(payment_file))

        result = mod.registrar_pago(1, 2, 50000.0, "efectivo")

        assert result["ok"] is True
        assert result.get("already_paid") is True

    def test_orden_no_encontrada_retorna_error(self, tmp_path, monkeypatch):
        order_file = tmp_path / "orders.json"
        payment_file = tmp_path / "payments.json"
        order_file.write_text(json.dumps({}))

        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))
        monkeypatch.setattr(mod, "PAYMENT_FILE", str(payment_file))

        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch("app.database.get_db", return_value=db_mock):
            result = mod.registrar_pago(1, 999, 50000.0, "tarjeta")

        assert result["ok"] is False
        assert "no encontrada" in result["error"].lower()

    def test_monto_excede_total_retorna_error(self, tmp_path, monkeypatch):
        order_file = tmp_path / "orders.json"
        payment_file = tmp_path / "payments.json"
        orden = self._orden_pendiente(id_orden=3, total=10000.0)
        order_file.write_text(json.dumps({"5": [orden]}))

        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))
        monkeypatch.setattr(mod, "PAYMENT_FILE", str(payment_file))

        result = mod.registrar_pago(5, 3, 99999.0, "tarjeta")

        assert result["ok"] is False
        assert "supera" in result["error"].lower()


# ---------------------------------------------------------------------------
# cancelar_orden
# ---------------------------------------------------------------------------

class TestCancelarOrden:
    def test_cancela_orden_pendiente(self, tmp_path, monkeypatch):
        order_file = tmp_path / "orders.json"
        orden = {
            "id_orden": 10, "id_orden_db": 10,
            "estado": "pendiente", "estado_orden": "pendiente", "items": []
        }
        order_file.write_text(json.dumps({"7": [orden]}))

        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))

        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {"id_orden": 10, "estado_orden": "pendiente"}

        with patch("app.database.get_db", return_value=db_mock):
            result = mod.cancelar_orden(id_usuario=7, id_orden=10)

        assert result["ok"] is True

    def test_orden_no_encontrada_retorna_error(self, tmp_path, monkeypatch):
        order_file = tmp_path / "orders.json"
        order_file.write_text(json.dumps({}))

        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(order_file))

        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch("app.database.get_db", return_value=db_mock):
            result = mod.cancelar_orden(id_usuario=1, id_orden=999)

        assert result["ok"] is False
