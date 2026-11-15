from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_user


@pytest.fixture
def authenticated_client(app):
    user = {"value": {"id_tienda": 7, "rol": "vendedor"}}
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user] = lambda: user["value"]
    with TestClient(app) as client:
        yield client, user
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original_overrides)


def test_impulse_public_endpoints_and_metrics(authenticated_client, monkeypatch):
    client, _ = authenticated_client
    import app.routers.impulsos as router

    monkeypatch.setattr(router, "obtener_tipos_impulso", lambda: [{"id_tipo_impulso": 1}])
    monkeypatch.setattr(router, "obtener_impulsos_activos_publicos", lambda: [{"id_impulso": 3}])
    impressions = []
    clicks = []
    monkeypatch.setattr(router, "registrar_impresion", impressions.append)
    monkeypatch.setattr(router, "registrar_clic", clicks.append)

    assert client.get("/impulsos/tipos").json() == [{"id_tipo_impulso": 1}]
    assert client.get("/impulsos/activos").json() == [{"id_impulso": 3}]
    assert client.post("/impulsos/3/impresion").json() == {"ok": True}
    assert client.post("/impulsos/3/clic").json() == {"ok": True}
    assert impressions == [3]
    assert clicks == [3]


def test_impulse_seller_routes_require_a_registered_shop(authenticated_client):
    client, user = authenticated_client
    user["value"] = {"rol": "vendedor"}

    assert client.get("/impulsos/mis-impulsos").status_code == 404
    assert client.post("/impulsos/contratar", json={"id_tipo_impulso": 2}).status_code == 404
    assert client.delete("/impulsos/3").status_code == 404


def test_contract_impulse_applies_discount_and_records_income(authenticated_client, monkeypatch):
    client, _ = authenticated_client
    import app.routers.impulsos as router
    contract_calls = []
    income_calls = []
    monkeypatch.setattr(router, "obtener_suscripcion_activa_herramientas", lambda _shop_id: {
        "impulsos_con_descuento": "15",
    })
    monkeypatch.setattr(router, "contratar_impulso", lambda **kwargs: (
        contract_calls.append(kwargs) or {
            "ok": True,
            "impulso": {"id_impulso": 31, "monto_pagado": "85.50"},
        }
    ))
    monkeypatch.setattr(router, "registrar_ingreso_impulso", lambda **kwargs: income_calls.append(kwargs))

    response = client.post("/impulsos/contratar", json={
        "id_tipo_impulso": 2,
        "id_libro": 12,
        "id_categoria": 4,
    })

    assert response.status_code == 200
    assert contract_calls == [{
        "id_tienda": 7,
        "id_tipo_impulso": 2,
        "id_libro": 12,
        "id_categoria": 4,
        "descuento_pct": 15.0,
    }]
    assert income_calls == [{
        "id_impulso": 31,
        "id_tienda": 7,
        "monto_impulso": 85.5,
    }]


def test_contract_and_cancel_impulse_surface_model_failures(authenticated_client, monkeypatch):
    client, _ = authenticated_client
    import app.routers.impulsos as router
    income = Mock()
    monkeypatch.setattr(router, "obtener_suscripcion_activa_herramientas", lambda _shop_id: None)
    monkeypatch.setattr(router, "contratar_impulso", lambda **_kwargs: {
        "ok": False, "error": "Tipo no disponible",
    })
    monkeypatch.setattr(router, "registrar_ingreso_impulso", income)

    contract = client.post("/impulsos/contratar", json={"id_tipo_impulso": 2})
    assert contract.status_code == 400
    assert contract.json()["detail"] == "Tipo no disponible"
    income.assert_not_called()

    monkeypatch.setattr(router, "cancelar_impulso", lambda *_args: {
        "ok": False, "error": "Impulso no encontrado",
    })
    missing = client.delete("/impulsos/31")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "Impulso no encontrado"

    monkeypatch.setattr(router, "cancelar_impulso", lambda *_args: {"ok": True})
    assert client.delete("/impulsos/31").json() == {
        "ok": True,
        "mensaje": "Impulso cancelado",
    }
