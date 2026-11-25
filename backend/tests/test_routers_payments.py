"""
test_routers_payments.py — Tests de API para el router de pagos.

Cubre: validación de PagoRequest (regresiones sem.3), autenticación,
       estados HTTP esperados en process_payment y cancel_order.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_token

client = TestClient(app, raise_server_exceptions=False)


def _token_comprador(id_usuario: int = 99) -> str:
    return create_token({"sub": str(id_usuario), "rol": "comprador"})


def _auth_header(id_usuario: int = 99) -> dict:
    return {"Authorization": f"Bearer {_token_comprador(id_usuario)}"}


# ---------------------------------------------------------------------------
# POST /api/v1/payments — validación de schema (regresiones)
# ---------------------------------------------------------------------------

class TestProcessPaymentSchema:
    def test_sin_token_retorna_403(self):
        resp = client.post("/api/v1/payments", json={
            "order_id": 1, "amount": 50000, "payment_method": "tarjeta"
        })
        assert resp.status_code in (401, 403)

    def test_amount_cero_retorna_422(self):
        """REGRESIÓN: amount=0 rechazado por gt=0."""
        resp = client.post("/api/v1/payments",
                           headers=_auth_header(),
                           json={"order_id": 1, "amount": 0, "payment_method": "tarjeta"})
        assert resp.status_code == 422

    def test_amount_negativo_retorna_422(self):
        """REGRESIÓN: amount negativo rechazado por gt=0."""
        resp = client.post("/api/v1/payments",
                           headers=_auth_header(),
                           json={"order_id": 1, "amount": -100, "payment_method": "tarjeta"})
        assert resp.status_code == 422

    def test_payment_method_invalido_retorna_422(self):
        """REGRESIÓN: método fuera de whitelist rechazado."""
        resp = client.post("/api/v1/payments",
                           headers=_auth_header(),
                           json={"order_id": 1, "amount": 10000, "payment_method": "cripto"})
        assert resp.status_code == 422

    def test_metodos_validos_aceptados(self):
        """Todos los métodos de la whitelist deben pasar validación de schema."""
        orden_fake = {"id_orden": 1, "total": 50000, "estado": "pendiente",
                      "estado_orden": "pendiente", "items": [], "id_orden_db": 1}
        metodos = ["tarjeta", "efectivo", "transferencia", "nequi", "daviplata", "pse", "sucursal", "paypal"]

        for metodo in metodos:
            with patch("app.routers.payments.registrar_pago",
                       return_value={"ok": True, "transaction": {}, "order": orden_fake}), \
                 patch("app.routers.payments.registrar_ingreso_venta"), \
                 patch("app.routers.payments._resolver_vendedor", return_value=99):
                resp = client.post("/api/v1/payments",
                                   headers=_auth_header(),
                                   json={"order_id": 1, "amount": 50000,
                                         "payment_method": metodo,
                                         "tipo_entrega": "retiro_tienda"})
            assert resp.status_code == 200, f"Falló para método: {metodo}"

    def test_sin_body_retorna_422(self):
        resp = client.post("/api/v1/payments", headers=_auth_header(), json={})
        assert resp.status_code == 422

    def test_orden_no_encontrada_retorna_400(self):
        with patch("app.routers.payments.registrar_pago",
                   return_value={"ok": False, "error": "Orden no encontrada"}):
            resp = client.post("/api/v1/payments",
                               headers=_auth_header(),
                               json={"order_id": 999, "amount": 50000,
                                     "payment_method": "tarjeta",
                                     "tipo_entrega": "retiro_tienda"})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# DELETE /api/v1/orders/{id_orden} — cancelar orden
# ---------------------------------------------------------------------------

class TestCancelOrder:
    def test_sin_token_retorna_403(self):
        resp = client.delete("/api/v1/orders/1")
        assert resp.status_code in (401, 403)

    def test_cancela_orden_exitosamente(self):
        with patch("app.routers.payments.cancelar_orden",
                   return_value={"ok": True, "message": "Orden cancelada"}):
            resp = client.delete("/api/v1/orders/1",
                                 headers=_auth_header())
        assert resp.status_code == 200

    def test_orden_no_encontrada_retorna_400(self):
        with patch("app.routers.payments.cancelar_orden",
                   return_value={"ok": False, "error": "Orden no encontrada"}):
            resp = client.delete("/api/v1/orders/999", headers=_auth_header())
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# GET /api/v1/orders — listar órdenes
# ---------------------------------------------------------------------------

class TestGetOrders:
    def test_sin_token_retorna_403(self):
        resp = client.get("/api/v1/orders")
        assert resp.status_code in (401, 403)

    def test_retorna_lista_de_ordenes(self):
        with patch("app.routers.payments.obtener_ordenes_usuario", return_value=[]):
            resp = client.get("/api/v1/orders", headers=_auth_header())
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestAlreadyPaid:
    def test_already_paid_skips_finance_hook(self):
        orden_fake = {"id_orden": 1, "total": 50000, "estado": "pendiente",
                      "estado_orden": "pendiente", "items": [], "id_orden_db": 1}
        finance_hook = MagicMock()
        with patch("app.routers.payments.registrar_pago",
                   return_value={"ok": True, "already_paid": True, "order": orden_fake}), \
             patch("app.routers.payments.registrar_ingreso_venta", finance_hook):
            resp = client.post("/api/v1/payments",
                               headers=_auth_header(),
                               json={"order_id": 1, "amount": 50000,
                                     "payment_method": "tarjeta",
                                     "tipo_entrega": "retiro_tienda"})
        assert resp.status_code == 200
        finance_hook.assert_not_called()


class TestGetOrderDetails:
    def test_sin_token_retorna_403(self):
        resp = client.get("/api/v1/orders/1")
        assert resp.status_code in (401, 403)

    def test_orden_encontrada_retorna_200(self):
        with patch("app.routers.payments.obtener_orden",
                   return_value={"id_orden": 1, "estado": "pagado"}):
            resp = client.get("/api/v1/orders/1", headers=_auth_header())
        assert resp.status_code == 200
        assert resp.json()["id_orden"] == 1

    def test_orden_no_encontrada_retorna_404(self):
        with patch("app.routers.payments.obtener_orden", return_value=None):
            resp = client.get("/api/v1/orders/999", headers=_auth_header())
        assert resp.status_code == 404


class TestRetiroEndpoints:
    def test_reservar_retiro_exitoso(self):
        with patch("app.routers.payments.reservar_retiro",
                   return_value={"ok": True, "pin_retiro": "1234"}):
            resp = client.post("/api/v1/orders/5/reservar-retiro",
                               headers=_auth_header(), json=None)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_notificar_llegada_exitoso(self):
        with patch("app.routers.payments.notificar_llegada_tienda",
                   return_value={"ok": True, "estado_retiro": "en_tienda"}):
            resp = client.post("/api/v1/orders/5/llegada-tienda",
                               headers=_auth_header())
        assert resp.status_code == 200

    def test_habilitar_pago_retiro_exitoso(self):
        with patch("app.routers.payments.habilitar_pago_retiro",
                   return_value={"ok": True}):
            resp = client.post("/api/v1/orders/5/habilitar-pago-retiro",
                               headers=_auth_header())
        assert resp.status_code == 200

    def test_confirmar_entrega_retiro_exitoso(self):
        with patch("app.routers.payments.confirmar_entrega_retiro",
                   return_value={"ok": True}):
            resp = client.post("/api/v1/orders/5/confirmar-entrega-retiro",
                               headers=_auth_header(),
                               json={"es_efectivo": True})
        assert resp.status_code == 200
