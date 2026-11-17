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


def test_subscription_read_endpoints_return_shop_data(authenticated_client, monkeypatch):
    client, _ = authenticated_client
    import app.routers.suscripciones_tienda as router

    monkeypatch.setattr(router, "obtener_suscripcion_activa", lambda shop_id: {"id_suscripcion": shop_id})
    monkeypatch.setattr(router, "verificar_vigencia", lambda shop_id: shop_id == 7)
    monkeypatch.setattr(router, "obtener_historial_suscripciones", lambda shop_id: [{"id_tienda": shop_id}])

    assert client.get("/suscripciones/mi-suscripcion").json() == {
        "activa": True, "suscripcion": {"id_suscripcion": 7},
    }
    assert client.get("/suscripciones/vigente").json() == {"vigente": True}
    assert client.get("/suscripciones/historial").json() == [{"id_tienda": 7}]


def test_subscription_reads_require_a_registered_shop(authenticated_client):
    client, user = authenticated_client
    user["value"] = {"rol": "vendedor"}

    for path in ("/suscripciones/mi-suscripcion", "/suscripciones/vigente", "/suscripciones/historial"):
        response = client.get(path)
        assert response.status_code == 404
        assert response.json()["detail"] == "No tienes una tienda registrada."


def test_create_subscription_validates_plan_and_reports_model_errors(authenticated_client, monkeypatch):
    client, _ = authenticated_client
    import app.routers.suscripciones_tienda as router

    monkeypatch.setattr(router, "crear_suscripcion", lambda *_: {"ok": False, "error": "db failed"})
    payload = {"plan_suscripcion": "enterprise", "fecha_fin": "2027-01-01"}
    invalid_plan = client.post("/suscripciones", json=payload)
    assert invalid_plan.status_code == 400
    assert "Plan no válido" in invalid_plan.json()["detail"]

    payload["plan_suscripcion"] = "premium"
    model_error = client.post("/suscripciones", json=payload)
    assert model_error.status_code == 500
    assert model_error.json()["detail"] == "db failed"


def test_create_subscription_registers_income_only_after_success(authenticated_client, monkeypatch):
    client, _ = authenticated_client
    import app.routers.suscripciones_tienda as router
    income = []
    monkeypatch.setattr(router, "crear_suscripcion", lambda shop_id, data: {
        "ok": True,
        "suscripcion": {"id_suscripcion": 19, "id_tienda": shop_id, "plan_suscripcion": data["plan_suscripcion"]},
    })
    monkeypatch.setattr(router, "registrar_ingreso_plan", lambda **kwargs: income.append(kwargs))

    response = client.post("/suscripciones", json={
        "plan_suscripcion": "premium",
        "fecha_fin": "2027-01-01",
        "precio_pagado": 125000,
        "metodo_pago": "tarjeta",
    })

    assert response.status_code == 200
    assert response.json() == {"id_suscripcion": 19, "id_tienda": 7, "plan_suscripcion": "premium"}
    assert income == [{
        "id_tienda": 7,
        "id_plan": 19,
        "monto_plan": 125000,
        "periodicidad": "mensual",
    }]


def test_cancel_subscription_returns_not_found_or_success(authenticated_client, monkeypatch):
    client, _ = authenticated_client
    import app.routers.suscripciones_tienda as router

    monkeypatch.setattr(router, "cancelar_suscripcion", lambda *_: {"ok": False, "error": "No existe"})
    missing = client.delete("/suscripciones/19")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "No existe"

    monkeypatch.setattr(router, "cancelar_suscripcion", lambda *_: {"ok": True})
    assert client.delete("/suscripciones/19").json() == {
        "ok": True, "mensaje": "Suscripción cancelada",
    }


def test_expire_subscriptions_is_admin_only_and_surfaces_model_result(authenticated_client, monkeypatch):
    client, user = authenticated_client
    import app.routers.suscripciones_tienda as router

    assert client.post("/suscripciones/admin/expirar-vencidas").status_code == 403
    user["value"] = {"id_tienda": 7, "rol": "admin"}
    monkeypatch.setattr(router, "expirar_suscripciones_vencidas", lambda: {"ok": False, "error": "db failed"})
    failed = client.post("/suscripciones/admin/expirar-vencidas")
    assert failed.status_code == 500
    assert failed.json()["detail"] == "db failed"

    monkeypatch.setattr(router, "expirar_suscripciones_vencidas", lambda: {"ok": True, "actualizadas": 3})
    assert client.post("/suscripciones/admin/expirar-vencidas").json() == {
        "ok": True, "actualizadas": 3,
    }
