from datetime import date, datetime
from unittest.mock import MagicMock, patch

import pytest

import app.models.herramientas as herramientas
import app.models.suscripciones_tienda as suscripciones
import app.models.tienda_configuracion as configuracion


def _db_cursor():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_obtener_configuracion_formatea_fecha_y_maneja_ausencia_y_error():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [
        {"fecha_actualizacion": datetime(2026, 8, 2, 10, 30)},
        {"fecha_actualizacion": None},
        None,
    ]

    with patch.object(configuracion, "get_db", return_value=db):
        resultado = configuracion.obtener_configuracion_tienda(3)
        sin_fecha = configuracion.obtener_configuracion_tienda(3)
        no_existe = configuracion.obtener_configuracion_tienda(99)

    assert resultado["fecha_actualizacion"] == "2026-08-02 10:30:00"
    assert sin_fecha["fecha_actualizacion"] is None
    assert no_existe is None

    cursor.execute.side_effect = RuntimeError("select failed")
    with patch.object(configuracion, "get_db", return_value=db):
        assert configuracion.obtener_configuracion_tienda(3) is None


def test_actualizar_configuracion_actualiza_o_inserta_y_convierte_tarifa():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [{"id_config": 2}, None]
    data = {"descripcion": "Librería", "tarifa_envio": "12500"}

    with patch.object(configuracion, "get_db", return_value=db):
        assert configuracion.actualizar_configuracion_tienda(3, data) == {
            "ok": True, "mensaje": "Configuración guardada correctamente",
        }
        assert configuracion.actualizar_configuracion_tienda(4, data)["ok"] is True

    assert cursor.execute.call_count == 4
    assert cursor.execute.call_args_list[1].args[1][-2] == 12500.0
    assert cursor.execute.call_args_list[3].args[1][-1] == 12500.0
    assert db.commit.call_count == 2


def test_actualizar_configuracion_revierte_error_y_obtener_tarifa_devuelve_cero():
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("write failed")
    with patch.object(configuracion, "get_db", return_value=db):
        assert configuracion.actualizar_configuracion_tienda(3, {}) == {
            "ok": False, "error": "write failed",
        }
    db.rollback.assert_called_once()

    cursor.execute.side_effect = None
    cursor.fetchone.side_effect = [{"tarifa_envio": "7500"}, {"tarifa_envio": None}, None]
    with patch.object(configuracion, "get_db", return_value=db):
        assert configuracion.obtener_tarifa_envio(3) == 7500.0
        assert configuracion.obtener_tarifa_envio(4) == 0.0
        assert configuracion.obtener_tarifa_envio(5) == 0.0
        cursor.execute.side_effect = RuntimeError("select failed")
        assert configuracion.obtener_tarifa_envio(6) == 0.0


def test_obtener_id_tienda_de_libro_retorna_id_o_none():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [{"id_tienda": 7}, None]
    with patch.object(configuracion, "get_db", return_value=db):
        assert configuracion.obtener_id_tienda_de_libro(10) == 7
        assert configuracion.obtener_id_tienda_de_libro(11) is None
        cursor.execute.side_effect = RuntimeError("select failed")
        assert configuracion.obtener_id_tienda_de_libro(12) is None


def test_consultas_suscripcion_retorna_registros_y_estados_vacios():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [{"id_suscripcion": 1}, None, {"id_suscripcion": 2}, None]
    cursor.fetchall.side_effect = [[{"id_suscripcion": 3}], None]

    with patch.object(suscripciones, "get_db", return_value=db):
        assert suscripciones.obtener_suscripcion_activa(4) == {"id_suscripcion": 1}
        assert suscripciones.obtener_suscripcion_activa(5) is None
        assert suscripciones.obtener_historial_suscripciones(4) == [{"id_suscripcion": 3}]
        assert suscripciones.obtener_historial_suscripciones(5) == []
        assert suscripciones.verificar_vigencia(4) is True
        assert suscripciones.verificar_vigencia(5) is False


def test_crear_suscripcion_cancela_anterior_y_guarda_nueva():
    db, cursor = _db_cursor()
    cursor.lastrowid = 21
    cursor.fetchone.return_value = {"id_suscripcion": 21, "plan_suscripcion": "premium"}
    with patch.object(suscripciones, "get_db", return_value=db):
        resultado = suscripciones.crear_suscripcion(
            4,
            {
                "plan_suscripcion": "premium",
                "fecha_inicio": date(2026, 1, 1),
                "fecha_fin": date(2027, 1, 1),
                "precio_pagado": 100000,
                "metodo_pago": "tarjeta",
            },
        )

    assert resultado == {
        "ok": True,
        "suscripcion": {"id_suscripcion": 21, "plan_suscripcion": "premium"},
    }
    assert cursor.execute.call_count == 3
    assert cursor.execute.call_args_list[1].args[1][1] == "premium"
    db.commit.assert_called_once()


def test_cancelar_y_expirar_suscripciones_maneja_resultados_y_error():
    db, cursor = _db_cursor()
    cursor.rowcount = 0
    with patch.object(suscripciones, "get_db", return_value=db):
        assert suscripciones.cancelar_suscripcion(3, 4)["ok"] is False
        cursor.rowcount = 1
        assert suscripciones.cancelar_suscripcion(3, 4) == {"ok": True}
        cursor.rowcount = 5
        assert suscripciones.expirar_suscripciones_vencidas() == {
            "ok": True, "actualizadas": 5,
        }
        cursor.execute.side_effect = RuntimeError("update failed")
        assert suscripciones.expirar_suscripciones_vencidas() == {
            "ok": False, "error": "update failed",
        }

    assert db.commit.call_count == 3
    assert db.rollback.call_count == 1


@pytest.mark.parametrize(
    ("function", "args", "expected"),
    [
        ("obtener_suscripcion_activa", (4,), None),
        ("obtener_historial_suscripciones", (4,), []),
        ("verificar_vigencia", (4,), False),
        ("crear_suscripcion", (4, {}), {"ok": False, "error": "db failed"}),
        ("cancelar_suscripcion", (3, 4), {"ok": False, "error": "db failed"}),
    ],
)
def test_modelo_suscripciones_maneja_errores_bd(function, args, expected):
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("db failed")
    with patch.object(suscripciones, "get_db", return_value=db):
        resultado = getattr(suscripciones, function)(*args)

    assert resultado == expected
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_planes_y_suscripcion_herramientas_maneja_resultados_vacios():
    db, cursor = _db_cursor()
    cursor.fetchall.return_value = None
    cursor.fetchone.return_value = None
    with patch.object(herramientas, "get_db", return_value=db):
        assert herramientas.obtener_planes() == []
        assert herramientas.obtener_suscripcion_activa_herramientas(4) is None
        assert herramientas.suscribir_plan(4, 99, "2026-01-01", "2027-01-01") == {
            "ok": False, "error": "El plan seleccionado no existe",
        }


def test_suscribir_plan_reemplaza_activa_y_retorna_registro():
    db, cursor = _db_cursor()
    cursor.lastrowid = 10
    cursor.fetchone.side_effect = [
        {"id_plan": 2, "precio_mensual": 50000},
        {"id_suscripcion": 10, "nombre_plan": "Avanzado"},
    ]
    with patch.object(herramientas, "get_db", return_value=db):
        resultado = herramientas.suscribir_plan(
            4, 2, "2026-01-01", "2026-02-01", metodo_pago="tarjeta", monto_pagado=50000,
        )

    assert resultado == {
        "ok": True, "suscripcion": {"id_suscripcion": 10, "nombre_plan": "Avanzado"},
    }
    assert cursor.execute.call_count == 4
    db.commit.assert_called_once()


def test_cancelar_suscripcion_herramientas_indica_si_habia_activa():
    db, cursor = _db_cursor()
    cursor.rowcount = 0
    with patch.object(herramientas, "get_db", return_value=db):
        assert herramientas.cancelar_suscripcion_herramientas(4) == {
            "ok": False, "error": "No tienes suscripción activa para cancelar",
        }
        cursor.rowcount = 1
        assert herramientas.cancelar_suscripcion_herramientas(4) == {"ok": True}

    assert db.commit.call_count == 2


@pytest.mark.parametrize(
    ("function", "args", "expected"),
    [
        ("obtener_planes", (), []),
        ("obtener_suscripcion_activa_herramientas", (4,), None),
        ("suscribir_plan", (4, 2, "2026-01-01", "2027-01-01"), {"ok": False, "error": "db failed"}),
        ("cancelar_suscripcion_herramientas", (4,), {"ok": False, "error": "db failed"}),
    ],
)
def test_modelo_herramientas_maneja_errores_bd(function, args, expected):
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("db failed")
    with patch.object(herramientas, "get_db", return_value=db):
        resultado = getattr(herramientas, function)(*args)

    assert resultado == expected
    cursor.close.assert_called_once()
    db.close.assert_called_once()
