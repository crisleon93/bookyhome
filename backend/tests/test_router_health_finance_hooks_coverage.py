import json
from unittest.mock import MagicMock

import app.routers.health as health
import app.utils.finance_hooks as hooks


def test_health_checks_database_cleanup_mail_and_ai(monkeypatch):
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    monkeypatch.setattr(health, "get_db", lambda: db)
    assert health._check_database()["status"] == "ok"
    cursor.close.assert_called_once()
    db.close.assert_called_once()

    cursor.execute.side_effect = RuntimeError("offline")
    assert health._check_database() == {"status": "error", "detail": "offline"}

    for key in ("MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM", "MAIL_SERVER", "GEMINI_API_KEY", "OPENAI_API_KEY"):
        monkeypatch.delenv(key, raising=False)
    assert health._check_mail()["status"] == "degraded"
    assert health._check_ai_assistant()["status"] == "degraded"
    monkeypatch.setenv("MAIL_USERNAME", "user")
    monkeypatch.setenv("MAIL_PASSWORD", "test-password")
    monkeypatch.setenv("MAIL_FROM", "from@example.test")
    monkeypatch.setenv("MAIL_SERVER", "smtp.example.test")
    monkeypatch.setenv("OPENAI_API_KEY", "configured")
    assert health._check_mail() == {"status": "ok"}
    assert health._check_ai_assistant() == {"status": "ok", "provider": "openai"}


def test_health_status_is_critical_only_for_database(monkeypatch):
    monkeypatch.setattr(health, "_check_database", lambda: {"status": "ok", "latency_ms": 1})
    monkeypatch.setattr(health, "_check_mail", lambda: {"status": "degraded", "missing": ["MAIL_FROM"]})
    monkeypatch.setattr(health, "_check_ai_assistant", lambda: {"status": "degraded"})
    response = health.health()
    body = json.loads(response.body)
    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["checks"]["mail"]["status"] == "degraded"

    monkeypatch.setattr(health, "_check_database", lambda: {"status": "error", "detail": "offline"})
    assert health.health().status_code == 503


def test_finance_hooks_are_idempotent_and_skip_store_pickup(monkeypatch):
    register_sale = MagicMock(return_value={
        "ok": True, "ingreso": {"comision": 15},
    })
    monkeypatch.setattr(hooks._finanzas, "registrar_ingreso_venta", register_sale)
    monkeypatch.setattr(hooks, "_ya_registrado", lambda *_args: False)

    hooks.registrar_ingreso_venta(1, 100, 8, tipo_entrega="retiro_tienda")
    register_sale.assert_not_called()
    hooks.registrar_ingreso_venta(1, 100, 8)
    register_sale.assert_called_once_with(id_venta=1, monto_venta=100, id_vendedor=8)

    monkeypatch.setattr(hooks, "_ya_registrado", lambda *_args: True)
    hooks.registrar_ingreso_venta(1, 100, 8)
    assert register_sale.call_count == 1


def test_finance_hooks_skip_free_plans_and_swallow_finance_errors(monkeypatch):
    register_plan = MagicMock(side_effect=RuntimeError("storage unavailable"))
    register_boost = MagicMock(return_value={"ok": False, "error": "not saved"})
    monkeypatch.setattr(hooks._finanzas, "registrar_ingreso_plan", register_plan)
    monkeypatch.setattr(hooks._finanzas, "registrar_ingreso_impulso", register_boost)
    monkeypatch.setattr(hooks, "_ya_registrado", lambda *_args: False)

    hooks.registrar_ingreso_plan(3, 4, 0)
    register_plan.assert_not_called()
    hooks.registrar_ingreso_plan(3, 4, 100)
    register_plan.assert_called_once_with(
        id_tienda=3, id_plan=4, monto_plan=100, periodicidad="mensual",
    )
    hooks.registrar_ingreso_impulso(9, 3, 50)
    register_boost.assert_called_once_with(id_impulso=9, id_tienda=3, monto_impulso=50)
    assert hooks.obtener_config_comisiones()["dias_pago"] == hooks._CONFIG["dias_pago"]


def test_finance_hook_duplicate_lookup_and_successful_plan_and_boost(monkeypatch):
    monkeypatch.setattr(hooks, "_load_store", lambda _path: {
        "ingresos": [{"tipo": "venta", "id_venta": 1}],
    })
    assert hooks._ya_registrado("venta", 1) is True
    assert hooks._ya_registrado("venta", 2) is False
    assert hooks._ya_registrado("desconocido", 1) is False

    monkeypatch.setattr(hooks, "_load_store", lambda _path: (_ for _ in ()).throw(RuntimeError("bad json")))
    assert hooks._ya_registrado("plan", 2) is False

    monkeypatch.setattr(hooks, "_ya_registrado", lambda *_args: False)
    plan = MagicMock(return_value={"ok": True, "ingreso": {"comision": 8}})
    boost = MagicMock(return_value={"ok": True, "ingreso": {"comision": 5}})
    monkeypatch.setattr(hooks._finanzas, "registrar_ingreso_plan", plan)
    monkeypatch.setattr(hooks._finanzas, "registrar_ingreso_impulso", boost)
    hooks.registrar_ingreso_plan(3, 5, 100, "anual")
    hooks.registrar_ingreso_impulso(6, 3, 50)
    plan.assert_called_once_with(id_tienda=3, id_plan=5, monto_plan=100, periodicidad="anual")
    boost.assert_called_once_with(id_impulso=6, id_tienda=3, monto_impulso=50)
