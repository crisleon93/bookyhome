"""Pruebas unitarias del modelo de métricas de tienda con una BD simulada."""

from datetime import datetime
from unittest.mock import MagicMock

import pytest

import app.models.metricas_tienda as modelo


@pytest.fixture
def db_mock(monkeypatch):
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    monkeypatch.setattr(modelo, "get_db", lambda: db)
    return db, cursor


@pytest.mark.parametrize(
    ("year", "month", "expected_params"),
    [
        (None, None, [7]),
        (2026, None, [7, 2026]),
        (2026, 4, [7, 2026, 4]),
    ],
)
def test_obtener_metricas_filtra_por_periodo_y_formatea_fecha(
    db_mock, year, month, expected_params
):
    db, cursor = db_mock
    cursor.fetchall.return_value = [
        {"periodo_anio": 2026, "fecha_calculo": datetime(2026, 4, 2, 9, 15)},
        {"periodo_anio": 2025, "fecha_calculo": None},
    ]

    result = modelo.obtener_metricas_tienda(7, year, month)

    query, params = cursor.execute.call_args.args
    assert params == expected_params
    assert "ORDER BY periodo_anio DESC, periodo_mes DESC" in query
    assert result[0]["fecha_calculo"] == "2026-04-02 09:15:00"
    assert result[1]["fecha_calculo"] is None
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_obtener_metricas_devuelve_lista_vacia_si_hay_error(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("query failed")

    assert modelo.obtener_metricas_tienda(7) == []
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_registrar_metricas_actualiza_registro_existente(db_mock):
    db, cursor = db_mock
    cursor.fetchone.return_value = (19,)

    result = modelo.registrar_metricas_tienda(
        7, 4, 2026, {"total_ordenes": 3, "ingresos_netos": 9000}
    )

    assert result == {"ok": True, "mensaje": "Métricas registradas correctamente"}
    assert cursor.execute.call_count == 2
    query, params = cursor.execute.call_args_list[1].args
    assert "UPDATE metricas_tienda" in query
    assert params[0] == 3
    assert params[4] == 9000
    assert params[-1] == 19
    db.commit.assert_called_once()


def test_registrar_metricas_inserta_si_el_periodo_no_existe(db_mock):
    db, cursor = db_mock
    cursor.fetchone.return_value = None

    result = modelo.registrar_metricas_tienda(7, 4, 2026, {})

    assert result["ok"] is True
    query, params = cursor.execute.call_args_list[1].args
    assert "INSERT INTO metricas_tienda" in query
    assert params == (7, 4, 2026, 0, 0, 0, 0.0, 0.0, 0.0, 0, None)
    db.commit.assert_called_once()


def test_registrar_metricas_revierte_si_la_consulta_falla(db_mock):
    db, cursor = db_mock
    cursor.execute.side_effect = RuntimeError("write failed")

    result = modelo.registrar_metricas_tienda(7, 4, 2026, {})

    assert result == {"ok": False, "error": "write failed"}
    db.rollback.assert_called_once()
    cursor.close.assert_called_once()
    db.close.assert_called_once()
