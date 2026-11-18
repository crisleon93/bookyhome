from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

import app.models.finanzas_db as mod


def test_fetch_all_returns_rows_and_closes_connection(monkeypatch):
    db = MagicMock()
    cursor = db.cursor.return_value
    cursor.fetchall.return_value = [{"id": 1}]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    assert mod._fetch_all("SELECT 1", (2,)) == [{"id": 1}]
    cursor.execute.assert_called_once_with("SELECT 1", (2,))
    cursor.close.assert_called_once()
    db.close.assert_called_once()
    assert mod._fetch_one("SELECT 1") == [{"id": 1}][0]


def test_fetch_all_logs_database_errors_and_returns_empty(monkeypatch):
    db = MagicMock()
    cursor = db.cursor.return_value
    cursor.execute.side_effect = RuntimeError("offline")
    monkeypatch.setattr(mod, "get_db", lambda: db)

    assert mod._fetch_all("SELECT " + "x" * 150) == []
    cursor.close.assert_called_once()
    db.close.assert_called_once()
    assert mod._fetch_one("SELECT 1") == {}


def test_db_income_helpers_normalize_dates_amounts_and_optional_filters(monkeypatch):
    date = datetime(2026, 1, 2, tzinfo=timezone.utc)
    calls = []

    def fetch_all(query, params=()):
        calls.append((query, params))
        if "ordenes_compra" in query:
            return [{
                "id_venta": 1, "fecha": date, "monto_venta": 100,
                "comision": 15, "monto_vendedor": 85, "id_vendedor": 7,
            }]
        if "impulsos_contratados" in query:
            return [{
                "id_impulso": 2, "id_tienda": 8, "fecha": "2026-01-03",
                "monto_impulso": 50, "comision": 5,
            }]
        return [{
            "id_suscripcion": 3, "id_tienda": 9, "fecha": date,
            "monto_plan": None, "nombre_plan": "Pro",
        }]

    monkeypatch.setattr(mod, "_fetch_all", fetch_all)
    desde = datetime(2026, 1, 1, tzinfo=timezone.utc)

    ventas = mod._ingresos_ventas_db(desde)
    impulsos = mod._ingresos_impulsos_db(desde)
    planes = mod._ingresos_planes_db()

    assert ventas[0]["comision"] == 15
    assert ventas[0]["fecha"] == "2026-01-02T00:00:00+00:00Z"
    assert impulsos[0]["comision"] == 50
    assert impulsos[0]["fecha"] == "2026-01-03"
    assert planes[0]["monto"] == 0
    assert planes[0]["nombre_plan"] == "Pro"
    assert calls[0][1] == (desde,)
    assert calls[1][1] == (desde,)
    assert calls[2][1] == ()
    assert "AND sh.fecha_inicio >= %s" not in calls[2][0]


def test_balance_sums_database_income_and_operating_expenses(monkeypatch):
    monkeypatch.setattr(mod, "_ingresos_ventas_db", lambda: [{"comision": 10}])
    monkeypatch.setattr(mod, "_ingresos_impulsos_db", lambda: [{"comision": 20}])
    monkeypatch.setattr(mod, "_ingresos_planes_db", lambda: [{"comision": 30}])
    monkeypatch.setattr(mod, "_load_store", lambda _path: {
        "pagos": [
            {"estado": "procesado", "tipo": "operativo", "monto": 7},
            {"estado": "procesado", "tipo": "nomina", "monto": 100},
        ],
    })

    assert mod.obtener_balance_db() == {
        "ingresos_totales": 60,
        "pagos_totales": 7,
        "balance": 53,
        "ingresos_por_tipo": {"venta": 10, "impulso": 20, "plan": 30},
    }


def test_history_includes_recent_payments_and_ignores_invalid_dates(monkeypatch):
    monkeypatch.setattr(mod, "_ingresos_ventas_db", lambda _desde: [{"fecha": "2026-01-01"}])
    monkeypatch.setattr(mod, "_ingresos_impulsos_db", lambda _desde: [])
    monkeypatch.setattr(mod, "_ingresos_planes_db", lambda _desde: [])
    recent = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    old = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
    monkeypatch.setattr(mod, "_load_store", lambda _path: {"pagos": [
        {"fecha": recent, "monto": 5},
        {"fecha": old, "monto": 10},
        {"fecha": "not-a-date", "monto": 30},
    ]})

    result = mod.obtener_historial_db(30)

    assert result["periodo_dias"] == 30
    assert result["ingresos"] == [{"fecha": "2026-01-01"}]
    assert [payment["monto"] for payment in result["pagos"]] == [5]


def test_safe_timestamp_returns_zero_for_malformed_dates():
    assert mod._ts_safe("bad-date") == 0
    assert mod._ts_safe("2026-01-01T00:00:00+00:00") > 0


def test_statistics_count_income_days_and_historical_totals(monkeypatch):
    entries = [
        {"comision": 10, "fecha": "2026-05-01T12:00:00"},
        {"comision": 20, "fecha": "2026-05-01T13:00:00"},
        {"comision": 30, "fecha": "2026-05-03T13:00:00"},
    ]
    monkeypatch.setattr(mod, "_ingresos_ventas_db", lambda _desde=None: entries[:1])
    monkeypatch.setattr(mod, "_ingresos_impulsos_db", lambda _desde=None: entries[1:2])
    monkeypatch.setattr(mod, "_ingresos_planes_db", lambda _desde=None: entries[2:])
    monkeypatch.setattr(mod, "_load_store", lambda _path: {"pagos": [
        {"tipo": "operativo", "estado": "procesado", "monto": 7,
         "fecha": datetime.now(timezone.utc).isoformat()},
        {"tipo": "nomina", "estado": "procesado", "monto": 100,
         "fecha": datetime.now(timezone.utc).isoformat()},
        {"tipo": "operativo", "estado": "pendiente", "monto": 2,
         "fecha": datetime.now(timezone.utc).isoformat()},
    ]})
    historical = iter([{"n": 9}, {"n": 4}, {"n": 6}])
    monkeypatch.setattr(mod, "_fetch_one", lambda *_args: next(historical))
    monkeypatch.setattr(mod, "_fetch_all", lambda *_args: [])

    result = mod.obtener_estadisticas_db()

    assert result["ingresos_30_dias"] == 60
    assert result["pagos_30_dias"] == 7
    assert result["promedio_diario"] == 30
    assert result["ventas_totales"] == 9
    assert result["planes_activos"] == 4
    assert result["impulsos_comprados"] == 6
    assert result["balance_actual"]["ingresos_totales"] == 60


def test_payroll_combines_json_and_unregistered_db_sales(monkeypatch):
    monkeypatch.setattr(mod, "_load_store", lambda _path: [
        {"id_venta": 1, "id_vendedor": 8, "monto": 20, "estado": "pendiente"},
        {"id_venta": 2, "id_vendedor": 8, "monto": 40, "estado": "procesado"},
    ])
    monkeypatch.setattr(mod, "_fetch_all", lambda *_args: [
        {"id_venta": 1, "id_vendedor": 8, "monto": 20, "fecha_venta": "2026-01-01"},
        {"id_venta": 3, "id_vendedor": 9, "monto": 70, "fecha_venta": datetime(2026, 1, 2)},
    ])

    result = mod.obtener_nomina_db()

    assert result["total_general"] == 90
    assert result["total_vendedores"] == 2
    assert result["vendedores"][0]["id_vendedor"] == 9
    assert result["vendedores"][1]["pagos"][0]["id_venta"] == 1
