from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

import app.routers.bookypago_finanzas as finanzas


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_admin_only_finance_endpoints_and_error_translation(monkeypatch):
    with pytest.raises(HTTPException) as forbidden:
        finanzas.obtener_balance({"rol": "vendedor"})
    assert forbidden.value.status_code == 403

    monkeypatch.setattr(finanzas, "obtener_balance_db", lambda: {"balance": 20})
    assert finanzas.obtener_balance({"rol": "administrador"}) == {
        "ok": True, "balance": {"balance": 20},
    }

    monkeypatch.setattr(finanzas, "obtener_balance_db", lambda: (_ for _ in ()).throw(RuntimeError("db down")))
    with pytest.raises(HTTPException) as failed:
        finanzas.obtener_balance({"rol": "admin"})
    assert failed.value.status_code == 500
    assert "db down" in failed.value.detail

    assert finanzas.obtener_configuracion({"rol": "admin"})["ok"] is True
    with pytest.raises(HTTPException):
        finanzas.obtener_configuracion({"rol": "comprador"})


def test_finance_income_and_payroll_routes_translate_model_results(monkeypatch):
    monkeypatch.setattr(
        finanzas.bookypago_finanzas_configurado,
        "registrar_ingreso_venta",
        lambda **_kwargs: {"ok": False, "error": "invalid"},
    )
    with pytest.raises(HTTPException) as invalid:
        finanzas.registrar_ingreso_venta(1, 100, 2, {"rol": "admin"})
    assert invalid.value.status_code == 400

    monkeypatch.setattr(finanzas, "obtener_nomina_db", lambda: {"total": 40})
    assert finanzas.obtener_nomina({"rol": "admin"}) == {
        "ok": True, "nomina": {"total": 40},
    }
    with pytest.raises(HTTPException):
        finanzas.obtener_nomina({"rol": "vendedor"})

    monkeypatch.setattr(
        finanzas.bookypago_finanzas_configurado,
        "procesar_pago_vendedor",
        lambda _payment: {"ok": False, "error": "already processed"},
    )
    with pytest.raises(HTTPException) as processed:
        finanzas.procesar_pago_vendedor(4, {"rol": "admin"})
    assert processed.value.status_code == 400

    monkeypatch.setattr(
        finanzas.bookypago_finanzas_configurado,
        "registrar_ingreso_plan",
        lambda **_kwargs: {"ok": True},
    )
    assert finanzas.registrar_ingreso_plan(2, 3, 100, "mensual", {"rol": "admin"}) == {"ok": True}
    monkeypatch.setattr(
        finanzas.bookypago_finanzas_configurado,
        "registrar_ingreso_impulso",
        lambda **_kwargs: {"ok": True},
    )
    assert finanzas.registrar_ingreso_impulso(4, 2, 50, {"rol": "admin"}) == {"ok": True}

    monkeypatch.setattr(
        finanzas.bookypago_finanzas_configurado,
        "procesar_pago_vendedor",
        lambda _payment: {"ok": True, "pago": 4},
    )
    assert finanzas.procesar_pago_vendedor(4, {"rol": "administrador"}) == {
        "ok": True, "pago": 4,
    }


def test_history_and_statistics_endpoints_delegate_to_database(monkeypatch):
    monkeypatch.setattr(finanzas, "obtener_historial_db", lambda days: {"dias": days})
    monkeypatch.setattr(finanzas, "obtener_estadisticas_db", lambda: {"ventas": 3})
    assert finanzas.obtener_historial_financiero(14, {"rol": "admin"}) == {
        "ok": True, "historial": {"dias": 14},
    }
    assert finanzas.obtener_estadisticas({"rol": "admin"}) == {
        "ok": True, "estadisticas": {"ventas": 3},
    }

    monkeypatch.setattr(finanzas, "obtener_historial_db", lambda _days: (_ for _ in ()).throw(RuntimeError("db down")))
    with pytest.raises(HTTPException) as failed:
        finanzas.obtener_historial_financiero(14, {"rol": "admin"})
    assert failed.value.status_code == 500


def test_vendor_payment_access_and_history_grouping(monkeypatch):
    with pytest.raises(HTTPException) as forbidden:
        finanzas.obtener_pagos_pendientes_vendedor(5, {"rol": "vendedor", "sub": "6"})
    assert forbidden.value.status_code == 403

    monkeypatch.setattr(
        finanzas.bookypago_finanzas_configurado,
        "obtener_pagos_pendientes_vendedor",
        lambda _vendor: [{"id": 1}],
    )
    assert finanzas.obtener_pagos_pendientes_vendedor(
        5, {"rol": "vendedor", "sub": "5"},
    )["pagos_pendientes"] == [{"id": 1}]

    monkeypatch.setattr(finanzas, "_load_store", lambda _path: [
        {"id": 1, "id_vendedor": 5, "estado": "procesado", "monto": 20, "referencia": "BATCH"},
        {"id": 2, "id_vendedor": 5, "estado": "procesado", "monto": 10, "referencia": "BATCH"},
        {"id": 3, "id_vendedor": 5, "estado": "pendiente", "monto": 99},
    ])
    history = finanzas.obtener_historial_pagos_vendedor(5, {"rol": "vendedor", "sub": "5"})
    assert history["historial"][0]["monto"] == 30
    assert history["historial"][0]["num_pagos"] == 2
    with pytest.raises(HTTPException):
        finanzas.obtener_historial_pagos_vendedor(5, {"rol": "vendedor", "sub": "6"})


def test_bank_account_creation_enforces_owner_and_marks_primary(monkeypatch):
    with pytest.raises(HTTPException) as forbidden:
        finanzas.agregar_cuenta_bancaria(
            5, "ahorros", "Banco", "1234", "Vendedor", "123", True,
            {"rol": "vendedor", "sub": "6"},
        )
    assert forbidden.value.status_code == 403

    db, cursor = _db()
    cursor.fetchone.return_value = {"id_tienda": 9}
    monkeypatch.setattr(finanzas, "get_db", lambda: db)
    result = finanzas.agregar_cuenta_bancaria(
        5, "ahorros", "Banco", "1234", "Vendedor", "123", True,
        {"rol": "vendedor", "sub": "5"},
    )
    assert result["ok"] is True
    assert cursor.execute.call_count == 3
    db.commit.assert_called_once()
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_bank_account_missing_vendor_and_nomina_without_account(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.return_value = None
    monkeypatch.setattr(finanzas, "get_db", lambda: db)
    with pytest.raises(HTTPException) as missing:
        finanzas.obtener_cuentas_bancarias_vendedor(5, {"rol": "admin"})
    assert missing.value.status_code == 404

    cursor.fetchone.side_effect = [{"id_tienda": 9}, None]
    with pytest.raises(HTTPException) as no_account:
        finanzas.procesar_nomina_vendedor(5, finanzas.NominaRequest(), {"rol": "admin"})
    assert no_account.value.status_code == 400
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_bank_account_principal_and_removal_actions(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.return_value = {"id_tienda": 9}
    monkeypatch.setattr(finanzas, "get_db", lambda: db)

    assert finanzas.marcar_cuenta_principal(5, 6, {"rol": "admin"})["ok"] is True
    assert cursor.execute.call_count == 3
    assert finanzas.eliminar_cuenta_bancaria(5, 6, {"rol": "admin"})["ok"] is True
    assert cursor.execute.call_count == 5
    assert db.commit.call_count == 2


def test_payroll_processes_with_selected_account_and_explicit_reference(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_tienda": 9},
        {
            "id_metodo": 3, "banco": "Banco Uno", "tipo_cuenta": "ahorros",
            "numero_cuenta": "123456", "nombre_titular": "Vendedora",
            "cedula_titular": "987",
        },
    ]
    monkeypatch.setattr(finanzas, "get_db", lambda: db)
    process = MagicMock(return_value={"ok": True, "num_pagos": 2})
    monkeypatch.setattr(finanzas.bookypago_finanzas_configurado, "procesar_nomina_vendedor", process)

    result = finanzas.procesar_nomina_vendedor(
        5, finanzas.NominaRequest(referencia="  LOTE-5  ", id_metodo=3), {"rol": "admin"},
    )
    assert result["referencia"] == "LOTE-5"
    assert result["cuenta_bancaria"]["titular"] == "Vendedora"
    process.assert_called_once_with(5, "LOTE-5")
