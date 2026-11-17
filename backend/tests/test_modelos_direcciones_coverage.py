from unittest.mock import MagicMock, patch

import app.models.direcciones as mod


def _db_cursor():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_obtener_direcciones_retorna_resultados_o_lista_vacia():
    db, cursor = _db_cursor()
    cursor.fetchall.return_value = [{"id_direccion": 3}]

    with patch.object(mod, "get_db", return_value=db):
        assert mod.obtener_direcciones_usuario(8) == [{"id_direccion": 3}]
        cursor.fetchall.return_value = None
        assert mod.obtener_direcciones_usuario(8) == []

    assert cursor.execute.call_count == 2
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_crear_direccion_limpia_campos_y_marca_como_predeterminada():
    db, cursor = _db_cursor()
    cursor.lastrowid = 15
    cursor.fetchone.return_value = {"id_direccion": 15, "ciudad": "Bogotá"}
    datos = {
        "nombre_destinatario": "  Ana  ",
        "telefono_contacto": "  300123  ",
        "departamento": " Cundinamarca ",
        "ciudad": " Bogotá ",
        "direccion": " Calle 1 ",
        "codigo_postal": " 110111 ",
        "es_predeterminada": True,
    }

    with patch.object(mod, "get_db", return_value=db):
        resultado = mod.crear_direccion(4, datos)

    assert resultado == {"ok": True, "direccion": {"id_direccion": 15, "ciudad": "Bogotá"}}
    assert cursor.execute.call_count == 3
    assert cursor.execute.call_args_list[1].args[1] == (
        4, "Ana", "300123", "Cundinamarca", "Bogotá", "Calle 1", "110111", True,
    )
    db.commit.assert_called_once()


def test_crear_direccion_revierte_transaccion_si_falla():
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("insert failed")

    with patch.object(mod, "get_db", return_value=db):
        resultado = mod.crear_direccion(4, {"ciudad": "Cali"})

    assert resultado == {"ok": False, "error": "insert failed"}
    db.rollback.assert_called_once()
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_actualizar_direccion_rechaza_direccion_ajena_o_sin_cambios():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [None, {"id_direccion": 2}]

    with patch.object(mod, "get_db", return_value=db):
        no_encontrada = mod.actualizar_direccion(2, 9, {"ciudad": "Cali"})
        sin_cambios = mod.actualizar_direccion(2, 9, {})

    assert no_encontrada == {"ok": False, "error": "Dirección no encontrada"}
    assert sin_cambios == {"ok": False, "error": "No hay campos para actualizar"}
    db.commit.assert_not_called()
    assert cursor.close.call_count == 2


def test_actualizar_direccion_construye_update_y_normaliza_cadena():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [{"id_direccion": 2}, {"id_direccion": 2, "ciudad": "Cali"}]

    with patch.object(mod, "get_db", return_value=db):
        resultado = mod.actualizar_direccion(
            2,
            9,
            {"ciudad": "  Cali  ", "es_predeterminada": True, "codigo_postal": None},
        )

    assert resultado["ok"] is True
    update_sql, update_params = cursor.execute.call_args_list[2].args
    assert "ciudad = %s" in update_sql
    assert "es_predeterminada = %s" in update_sql
    assert update_params == ("Cali", None, True, 2, 9)
    assert db.commit.call_count == 1


def test_actualizar_direccion_revierte_si_falla_la_consulta():
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("database unavailable")

    with patch.object(mod, "get_db", return_value=db):
        resultado = mod.actualizar_direccion(2, 9, {"ciudad": "Cali"})

    assert resultado == {"ok": False, "error": "database unavailable"}
    db.rollback.assert_called_once()


def test_eliminar_direccion_indica_si_existia():
    for rowcount, expected in ((1, {"ok": True, "error": None}), (0, {"ok": False, "error": "Dirección no encontrada"})):
        db, cursor = _db_cursor()
        cursor.rowcount = rowcount

        with patch.object(mod, "get_db", return_value=db):
            assert mod.eliminar_direccion(2, 9) == expected

        db.commit.assert_called_once()
        cursor.close.assert_called_once()
        db.close.assert_called_once()


def test_marcar_predeterminada_rechaza_direccion_ajena_y_actualiza_la_propietaria():
    db, cursor = _db_cursor()
    cursor.fetchone.side_effect = [None, {"id_direccion": 2}, {"id_direccion": 2, "es_predeterminada": True}]

    with patch.object(mod, "get_db", return_value=db):
        no_encontrada = mod.marcar_direccion_predeterminada(2, 9)
        actualizada = mod.marcar_direccion_predeterminada(2, 9)

    assert no_encontrada == {"ok": False, "error": "Dirección no encontrada"}
    assert actualizada == {"ok": True, "direccion": {"id_direccion": 2, "es_predeterminada": True}}
    assert cursor.execute.call_count == 5
    db.commit.assert_called_once()


def test_obtener_y_eliminar_direccion_convierten_error_bd_en_resultado_controlado():
    db, cursor = _db_cursor()
    cursor.execute.side_effect = RuntimeError("database down")
    with patch.object(mod, "get_db", return_value=db):
        assert mod.obtener_direcciones_usuario(8) == []
        assert mod.eliminar_direccion(2, 8) == {
            "ok": False, "error": "database down",
        }

    assert db.rollback.call_count == 1
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_marcar_predeterminada_revierte_si_falla_bd():
    db, cursor = _db_cursor()
    cursor.fetchone.return_value = {"id_direccion": 2}
    cursor.execute.side_effect = [None, RuntimeError("update failed")]

    with patch.object(mod, "get_db", return_value=db):
        resultado = mod.marcar_direccion_predeterminada(2, 8)

    assert resultado == {"ok": False, "error": "update failed"}
    db.rollback.assert_called_once()
