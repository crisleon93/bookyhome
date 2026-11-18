from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

import app.models.cupones as cupones
import app.models.impulsos as impulsos


def _db_cursor():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_impulsos_listados_publicos_y_de_tienda_retorna_listas_vacias():
    db, cursor = _db_cursor()
    cursor.fetchall.return_value = None

    with patch.object(impulsos, "get_db", return_value=db):
        assert impulsos.obtener_tipos_impulso() == []
        assert impulsos.obtener_impulsos_tienda(5) == []
        assert impulsos.obtener_impulsos_activos_publicos() == []

    assert cursor.execute.call_count == 3
    assert cursor.close.call_count == 3
    assert db.close.call_count == 3


@pytest.mark.parametrize(
    ("tipo", "libro", "mensaje"),
    [
        (None, None, "Tipo de impulso no disponible"),
        (
            {"tipo": "home", "precio": 10, "duracion_dias": 1},
            None,
            "Este tipo de impulso requiere seleccionar un libro",
        ),
    ],
)
def test_contratar_impulso_rechaza_tipo_invalido_o_libro_requerido(tipo, libro, mensaje):
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = tipo

    with patch.object(impulsos, "get_db", return_value=db):
        resultado = impulsos.contratar_impulso(5, 2, id_libro=libro)

    assert resultado == {"ok": False, "error": mensaje}
    db.commit.assert_not_called()
    cursor.close.assert_called_once()


def test_contratar_impulso_aplica_descuento_y_retorna_registro():
    db, cursor = _db_cursor()
    cursor.lastrowid = 33
    cursor.fetchone.side_effect = [
        {"precio": "120.00", "duracion_dias": 30, "tipo": "home"},
        {"ahora": "2026-10-01 10:00:00"},
        {"fin": "2026-10-31"},
        {"id_impulso": 33, "monto_pagado": 90},
    ]

    with patch.object(impulsos, "get_db", return_value=db):
        resultado = impulsos.contratar_impulso(
            5, 2, id_libro=10, id_categoria=4, descuento_pct=25,
        )

    assert resultado == {
        "ok": True,
        "impulso": {"id_impulso": 33, "monto_pagado": 90},
        "descuento_aplicado": 25,
    }
    assert cursor.execute.call_args_list[3].args[1][6] == 90.0
    db.commit.assert_called_once()


def test_cancelar_impulso_y_registrar_metricas_respetan_filas_afectadas():
    db, cursor = _db_cursor()
    cursor.rowcount = 0

    with patch.object(impulsos, "get_db", return_value=db):
        assert impulsos.cancelar_impulso(3, 5) == {
            "ok": False, "error": "Impulso no encontrado o ya no está activo",
        }
        cursor.rowcount = 1
        assert impulsos.cancelar_impulso(3, 5) == {"ok": True}
        assert impulsos.registrar_impresion(3) is True
        cursor.rowcount = 0
        assert impulsos.registrar_clic(3) is False

    assert db.commit.call_count == 4


def test_obtener_ids_impulsados_agrega_filtro_opcional():
    db, cursor = _db_cursor()
    cursor.fetchall.side_effect = [[{"id_libro": 2}, {"id_libro": 7}], None]

    with patch.object(impulsos, "get_db", return_value=db):
        assert impulsos.obtener_ids_libros_impulsados("home") == [2, 7]
        assert impulsos.obtener_ids_libros_impulsados() == []

    assert cursor.execute.call_args_list[0].args[1] == ["home"]
    assert cursor.execute.call_args_list[1].args[1] == []


def test_expirar_impulsos_retorna_cantidad_y_maneja_error():
    db, cursor = _db_cursor()
    cursor.rowcount = 2

    with patch.object(impulsos, "get_db", return_value=db):
        assert impulsos.expirar_impulsos_vencidos() == 2
        cursor.execute.side_effect = RuntimeError("update failed")
        assert impulsos.expirar_impulsos_vencidos() == 0

    db.commit.assert_called_once()
    db.rollback.assert_called_once()


@pytest.mark.parametrize(
    ("function", "args", "expected"),
    [
        ("obtener_tipos_impulso", (), []),
        ("obtener_impulsos_tienda", (5,), []),
        ("contratar_impulso", (5, 2), {"ok": False, "error": "db failed"}),
        ("cancelar_impulso", (3, 5), {"ok": False, "error": "db failed"}),
        ("obtener_impulsos_activos_publicos", (), []),
        ("obtener_ids_libros_impulsados", (), []),
        ("registrar_impresion", (3,), False),
        ("registrar_clic", (3,), False),
        ("expirar_impulsos_vencidos", (), 0),
    ],
)
def test_impulsos_maneja_fallas_de_base_de_datos(function, args, expected):
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("db failed")

    with patch.object(impulsos, "get_db", return_value=db):
        resultado = getattr(impulsos, function)(*args)

    assert resultado == expected
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def _cupon(**overrides):
    values = {
        "id_cupon": 4,
        "codigo_cupon": "AHORRO",
        "tipo_descuento": "porcentaje",
        "valor_descuento": 20,
        "minimo_compra": 0,
        "usos_maximos": None,
        "usos_actuales": 0,
        "fecha_inicio": None,
        "fecha_fin": None,
    }
    values.update(overrides)
    return values


@pytest.mark.parametrize(
    ("coupon", "expected"),
    [
        (None, "El cupón no existe o no está activo."),
        (_cupon(fecha_inicio=datetime.now() + timedelta(days=1)), "El cupón aún no está vigente."),
        (_cupon(fecha_fin=datetime.now() - timedelta(days=1)), "El cupón ha expirado."),
        (_cupon(usos_maximos=2, usos_actuales=2), "El cupón ha alcanzado su límite de usos."),
    ],
)
def test_validar_cupon_rechaza_no_vigente_o_sin_usos(coupon, expected):
    with patch.object(cupones, "obtener_cupon_por_codigo", return_value=coupon):
        resultado = cupones.validar_cupon("ahorro", 9, 100)

    assert resultado == {"valido": False, "mensaje": expected, "descuento": 0}


def test_validar_cupon_rechaza_uso_previo_y_monto_minimo():
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = {"id_uso": 1}
    with patch.object(cupones, "obtener_cupon_por_codigo", return_value=_cupon()), \
         patch.object(cupones, "get_db", return_value=db):
        ya_usado = cupones.validar_cupon("ahorro", 9, 100)
    assert ya_usado["mensaje"] == "Este cupón ya fue usado por tu cuenta."

    cursor.fetchone.return_value = None
    with patch.object(cupones, "obtener_cupon_por_codigo", return_value=_cupon(minimo_compra=200)), \
         patch.object(cupones, "get_db", return_value=db):
        bajo_minimo = cupones.validar_cupon("ahorro", 9, 100)
    assert bajo_minimo["mensaje"] == "El monto mínimo para este cupón es $200 COP."


@pytest.mark.parametrize(
    ("kind", "value", "total", "expected"),
    [
        ("porcentaje", 15, 200, 30),
        ("fijo", 500, 200, 200),
        ("otro", 50, 200, 0),
    ],
)
def test_validar_cupon_calcula_descuentos_y_tipo_desconocido(kind, value, total, expected):
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = None
    with patch.object(cupones, "obtener_cupon_por_codigo", return_value=_cupon(
        tipo_descuento=kind, valor_descuento=value,
    )), patch.object(cupones, "get_db", return_value=db):
        resultado = cupones.validar_cupon("ahorro", 9, total)

    assert resultado["valido"] is True
    assert resultado["descuento"] == expected


def test_registrar_uso_actualiza_contador_y_reversa_error():
    db, cursor = _db_cursor()
    with patch.object(cupones, "get_db", return_value=db):
        assert cupones.registrar_uso_cupon(4, 9, 18, 30) == {"ok": True}
        cursor.execute.side_effect = RuntimeError("insert failed")
        assert cupones.registrar_uso_cupon(4, 9, 18, 30) == {
            "ok": False, "error": "insert failed",
        }

    db.commit.assert_called_once()
    db.rollback.assert_called_once()


def test_crear_cupon_normaliza_codigo_y_distingue_duplicado():
    db, cursor = _db_cursor()
    cursor.lastrowid = 12
    with patch.object(cupones, "get_db", return_value=db):
        resultado = cupones.crear_cupon({
            "codigo_cupon": "oferta", "tipo_descuento": "fijo", "valor_descuento": 50,
        })
    assert resultado == {"ok": True, "id_cupon": 12}
    assert cursor.execute.call_args.args[1][1] == "OFERTA"

    cursor.execute.side_effect = RuntimeError("Duplicate entry")
    with patch.object(cupones, "get_db", return_value=db):
        duplicado = cupones.crear_cupon({
            "codigo_cupon": "oferta", "tipo_descuento": "fijo", "valor_descuento": 50,
        })
    assert duplicado == {"ok": False, "error": "Ya existe un cupón con ese código."}


def test_actualizar_cupon_filtra_campos_normaliza_codigo_y_detecta_no_encontrado():
    db, cursor = _db_cursor()
    cursor.rowcount = 1
    with patch.object(cupones, "get_db", return_value=db):
        assert cupones.actualizar_cupon(4, {"campo_invalido": 1}) == {
            "ok": False, "error": "No hay campos válidos para actualizar.",
        }
        assert cupones.actualizar_cupon(4, {"codigo_cupon": "nuevo", "campo_invalido": 1}) == {"ok": True}
        assert cursor.execute.call_args.args[1] == ["NUEVO", 4]
        cursor.rowcount = 0
        assert cupones.actualizar_cupon(99, {"activo": False}) == {
            "ok": False, "error": "Cupón no encontrado.",
        }


def test_eliminar_cupon_desactiva_si_hay_usos_y_borra_si_no():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [{"total": 2}, {"total": 0}]
    with patch.object(cupones, "get_db", return_value=db):
        con_usos = cupones.eliminar_cupon(4)
        sin_usos = cupones.eliminar_cupon(5)

    assert con_usos["ok"] is True
    assert "desactivado" in con_usos["mensaje"]
    assert sin_usos == {"ok": True, "mensaje": "Cupón eliminado correctamente."}
    assert "UPDATE cupones_descuento SET activo = 0" in cursor.execute.call_args_list[1].args[0]
    assert "DELETE FROM cupones_descuento" in cursor.execute.call_args_list[3].args[0]


def test_obtener_cupon_por_codigo_normaliza_y_obtener_todos_cupones_lista():
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = {"id_cupon": 4, "codigo_cupon": "AHORRO"}
    cursor.fetchall.side_effect = [[{"id_cupon": 4}], None]
    with patch.object(cupones, "get_db", return_value=db):
        assert cupones.obtener_cupon_por_codigo("ahorro") == {
            "id_cupon": 4, "codigo_cupon": "AHORRO",
        }
        assert cursor.execute.call_args.args[1] == ("AHORRO",)
        assert cupones.obtener_todos_cupones() == [{"id_cupon": 4}]
        assert cupones.obtener_todos_cupones() == []


def test_listas_de_cupones_disponibles_y_por_tienda_serializan_fechas():
    db, cursor = _db_cursor()
    fecha = datetime(2026, 8, 1, 12, 0)
    cupon = {"fecha_inicio": fecha, "fecha_fin": None, "codigo_cupon": "A"}
    cursor.fetchall.side_effect = [[cupon.copy()], None, [cupon.copy()]]

    with patch.object(cupones, "get_db", return_value=db):
        disponibles = cupones.obtener_cupones_disponibles()
        assert cupones.obtener_cupones_disponibles() == []
        por_tienda = cupones.obtener_cupones_por_tienda(5)

    assert disponibles[0]["fecha_inicio"] == str(fecha)
    assert disponibles[0]["fecha_fin"] is None
    assert por_tienda[0]["fecha_inicio"] == str(fecha)


def test_crear_actualizar_y_eliminar_cupon_devuelven_error_generico():
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("database unavailable")
    data = {"codigo_cupon": "A", "tipo_descuento": "fijo", "valor_descuento": 10}

    with patch.object(cupones, "get_db", return_value=db):
        creado = cupones.crear_cupon(data)
    assert creado == {"ok": False, "error": "database unavailable"}

    with patch.object(cupones, "get_db", return_value=db):
        actualizado = cupones.actualizar_cupon(4, {"activo": False})
    assert actualizado == {"ok": False, "error": "database unavailable"}

    cursor.fetchone.side_effect = RuntimeError("database unavailable")
    with patch.object(cupones, "get_db", return_value=db):
        eliminado = cupones.eliminar_cupon(4)
    assert eliminado == {"ok": False, "error": "database unavailable"}
    assert db.rollback.call_count == 3
