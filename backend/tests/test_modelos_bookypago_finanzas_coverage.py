import json
from datetime import datetime, timezone, timedelta

import app.models.bookypago_finanzas as mod


def _write_json(path, data):
    path.write_text(json.dumps(data), encoding="utf-8")


def _use_tmp_storage(tmp_path, monkeypatch):
    monkeypatch.setattr(mod, "FINANZAS_FILE", str(tmp_path / "finanzas.json"))
    monkeypatch.setattr(mod, "PAGOS_VENDEDORES_FILE", str(tmp_path / "pagos.json"))
    monkeypatch.setattr(mod, "COMISIONES_FILE", str(tmp_path / "comisiones.json"))


def test_json_storage_handles_missing_invalid_and_valid_files(tmp_path):
    missing = tmp_path / "missing.json"
    invalid = tmp_path / "invalid.json"
    valid = tmp_path / "valid.json"
    invalid.write_text("{", encoding="utf-8")
    valid.write_text('{"value": 2}', encoding="utf-8")

    assert mod._load_store(str(missing)) == {}
    assert mod._load_store(str(invalid)) == {}
    assert mod._load_store(str(valid)) == {"value": 2}

    mod._save_store(str(valid), {"stored": "ok"})
    assert json.loads(valid.read_text(encoding="utf-8")) == {"stored": "ok"}


def test_balance_counts_commissions_and_only_operating_expenses(tmp_path, monkeypatch):
    _use_tmp_storage(tmp_path, monkeypatch)
    _write_json(tmp_path / "finanzas.json", {
        "ingresos": [
            {"tipo": "venta", "comision": 15, "monto": 100},
            {"tipo": "plan", "monto": 8},
            {"monto": 2},
        ],
        "pagos": [
            {"tipo": "operativo", "estado": "procesado", "monto": 7},
            {"tipo": "nomina", "estado": "procesado", "monto": 30},
            {"tipo": "operativo", "estado": "pendiente", "monto": 90},
        ],
    })

    balance = mod.BookyPagoFinanzas().obtener_balance()

    assert balance == {
        "ingresos_totales": 25,
        "pagos_totales": 7,
        "balance": 18,
        "ingresos_por_tipo": {"venta": 15, "plan": 8, "otro": 2},
        "pagos_pendientes": 1,
    }


def test_registra_ventas_planes_e_impulsos_con_comision_configurada(tmp_path, monkeypatch):
    _use_tmp_storage(tmp_path, monkeypatch)
    sistema = mod.BookyPagoFinanzas({
        "comision_venta": 0.2,
        "comision_plan": 0.1,
        "comision_impulso": 0.05,
        "dias_pago": 7,
    })

    venta = sistema.registrar_ingreso_venta(1, 100, 8)
    plan = sistema.registrar_ingreso_plan(9, 2, 200, "mensual")
    impulso = sistema.registrar_ingreso_impulso(3, 9, 50)

    assert venta["comision_bookyhome"] == 20
    assert venta["pago_directo_vendedor"] == 80
    assert plan["ingreso"]["comision"] == 20
    assert impulso["ingreso"]["monto"] == 47.5
    assert [entry["id"] for entry in mod._load_store(mod.FINANZAS_FILE)["ingresos"]] == [1, 2, 3]


def test_nomina_se_agrupa_y_procesa_por_vendedor(tmp_path, monkeypatch):
    _use_tmp_storage(tmp_path, monkeypatch)
    _write_json(tmp_path / "pagos.json", [
        {"id": 1, "id_vendedor": 7, "id_venta": 10, "monto": 80, "estado": "pendiente", "fecha_venta": "2026-01-01"},
        {"id": 2, "id_vendedor": 7, "id_venta": 11, "monto": 20, "estado": "pendiente", "fecha_venta": "2026-01-02"},
        {"id": 3, "id_vendedor": 8, "id_venta": 12, "monto": 5, "estado": "procesado", "fecha_venta": "2026-01-03"},
    ])
    sistema = mod.BookyPagoFinanzas()

    assert [item["id"] for item in sistema.obtener_pagos_pendientes_vendedor(7)] == [1, 2]
    assert sistema.obtener_nomina()["total_general"] == 100
    assert sistema.obtener_nomina()["total_vendedores"] == 1

    result = sistema.procesar_nomina_vendedor(7, "REF-7")

    assert result == {"ok": True, "num_pagos": 2, "total_procesado": 100, "referencia": "REF-7"}
    assert all(p["estado"] == "procesado" for p in mod._load_store(mod.PAGOS_VENDEDORES_FILE))
    assert mod._load_store(mod.FINANZAS_FILE)["pagos"][0]["tipo"] == "nomina"
    assert sistema.procesar_nomina_vendedor(7, "REF-7")["ok"] is False


def test_procesa_pago_individual_y_reporta_estados_invalidos(tmp_path, monkeypatch):
    _use_tmp_storage(tmp_path, monkeypatch)
    _write_json(tmp_path / "pagos.json", [
        {"id": 1, "id_vendedor": 5, "monto": 25, "estado": "pendiente"},
        {"id": 2, "id_vendedor": 5, "monto": 10, "estado": "procesado"},
    ])
    sistema = mod.BookyPagoFinanzas()

    assert sistema.procesar_pago_vendedor(99) == {"ok": False, "error": "Pago no encontrado"}
    assert sistema.procesar_pago_vendedor(2) == {"ok": False, "error": "Pago ya procesado"}
    result = sistema.procesar_pago_vendedor(1)
    assert result["ok"] is True
    assert result["pago"]["monto"] == 25
    assert mod._load_store(mod.FINANZAS_FILE)["pagos"][0]["estado"] == "completado"


def test_historial_y_estadisticas_filtran_periodo(tmp_path, monkeypatch):
    _use_tmp_storage(tmp_path, monkeypatch)
    recent = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat().replace("+00:00", "Z")
    old = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat().replace("+00:00", "Z")
    _write_json(tmp_path / "finanzas.json", {
        "ingresos": [
            {"tipo": "venta", "fecha": recent, "comision": 15},
            {"tipo": "plan", "fecha": old, "comision": 20},
        ],
        "pagos": [{"tipo": "operativo", "fecha": recent, "monto": 5}],
    })

    sistema = mod.BookyPagoFinanzas()
    historial = sistema.obtener_historial_financiero(30)
    stats = sistema.obtener_estadisticas()

    assert len(historial["ingresos"]) == 1
    assert stats["ingresos_30_dias"] == 15
    assert stats["pagos_30_dias"] == 5
    assert stats["promedio_diario"] == 0.5
    assert stats["ventas_totales"] == 1
