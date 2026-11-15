from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException

import app.routers.libros as mod


def test_store_status_accepts_dict_tuple_and_blocks_suspended():
    assert mod.verificar_tienda_activa({"estado_tienda": "Activa"}) is True
    assert mod.verificar_tienda_activa((1, 2, 3, 4, 5, "pendiente")) is True
    with pytest.raises(HTTPException) as error:
        mod.verificar_tienda_activa({"estado_tienda": "Suspendida"})
    assert error.value.status_code == 403


def test_early_access_configuration_validates_and_normalizes_timezone():
    assert mod.validar_configuracion_acceso_anticipado(False, "invalido", None) == (
        False, "Plata", None,
    )
    with pytest.raises(HTTPException) as invalid_level:
        mod.validar_configuracion_acceso_anticipado(True, "Diamantex", "2030-01-01")
    assert invalid_level.value.status_code == 400
    with pytest.raises(HTTPException) as missing_date:
        mod.validar_configuracion_acceso_anticipado(True, "Plata", None)
    assert missing_date.value.status_code == 400
    with pytest.raises(HTTPException) as malformed:
        mod.validar_configuracion_acceso_anticipado(True, "Plata", "not-a-date")
    assert malformed.value.status_code == 400

    tomorrow = datetime.now(timezone.utc) + timedelta(days=3)
    valid, level, release = mod.validar_configuracion_acceso_anticipado(
        True, "Oro", tomorrow.isoformat(),
    )
    assert valid is True
    assert level == "Oro"
    assert release.tzinfo is None

    soon = datetime.now(timezone.utc) + timedelta(hours=2)
    with pytest.raises(HTTPException) as too_soon:
        mod.validar_configuracion_acceso_anticipado(True, "Oro", soon.isoformat())
    assert too_soon.value.status_code == 400


def test_seller_list_endpoint_requires_active_store_and_returns_books(monkeypatch):
    with patch.object(mod, "obtener_tienda_por_usuario", return_value=None):
        with pytest.raises(HTTPException) as missing:
            mod.mis_libros({"sub": "7"})
    assert missing.value.status_code == 404

    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 2, "estado_tienda": "suspendida"}):
        with pytest.raises(HTTPException) as suspended:
            mod.mis_libros({"sub": "7"})
    assert suspended.value.status_code == 403

    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 2}), \
         patch.object(mod, "obtener_libros_por_tienda", return_value=[{"id_libro": 3}]) as list_books:
        assert mod.mis_libros({"sub": "7"}) == [{"id_libro": 3}]
    list_books.assert_called_once_with(2)


def test_admin_delete_bypasses_store_and_translates_model_failure(monkeypatch):
    with patch.object(mod, "eliminar_libro_por_admin", return_value={"ok": True}) as delete_book:
        assert mod.eliminar(9, {"rol": "admin"}) == {
            "mensaje": "Libro eliminado por el Administrador",
        }
    delete_book.assert_called_once_with(9)

    with patch.object(mod, "eliminar_libro_por_admin", return_value={"ok": False, "error": "db"}):
        with pytest.raises(HTTPException) as error:
            mod.eliminar(9, {"rol": "admin"})
    assert error.value.status_code == 500


def test_stock_and_availability_routes_validate_errors_and_success(monkeypatch):
    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 3}):
        with pytest.raises(HTTPException) as negative:
            mod.update_stock(4, -1, {"sub": "5"})
        assert negative.value.status_code == 400

        with patch.object(mod, "actualizar_stock", return_value={"ok": True}) as update:
            assert mod.update_stock(4, 0, {"sub": "5"}) == {
                "mensaje": "Stock actualizado correctamente",
            }
        update.assert_called_once_with(4, 3, 0)

        with patch.object(mod, "actualizar_stock", return_value={"ok": False, "error": "No autorizado"}):
            with pytest.raises(HTTPException) as unauthorized:
                mod.update_stock(4, 1, {"sub": "5"})
        assert unauthorized.value.status_code == 403

    with patch.object(mod, "validar_disponibilidad", return_value={"disponible": True, "stock": 2}):
        assert mod.disponibilidad(4, 1)["disponible"] is True
    with patch.object(mod, "validar_disponibilidad", return_value={"disponible": False, "error": "Sin stock"}):
        with pytest.raises(HTTPException) as unavailable:
            mod.disponibilidad(4, 4)
    assert unavailable.value.status_code == 409

    with pytest.raises(HTTPException) as zero:
        mod.descontar(4, 0)
    assert zero.value.status_code == 400
    with patch.object(mod, "descontar_stock", return_value={"ok": False, "error": "Insufficient"}):
        with pytest.raises(HTTPException) as insufficient:
            mod.descontar(4, 3)
    assert insufficient.value.status_code == 409
    with patch.object(mod, "descontar_stock", return_value={"ok": True, "stock": 2}):
        assert mod.descontar(4, 1) == {"ok": True, "stock": 2}


def test_edit_access_early_release_and_isbn_error_paths():
    with patch.object(mod, "validar_y_normalizar_isbn", side_effect=AssertionError("invalid branch should not reach ISBN")), \
         patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 3}), \
         patch.object(mod, "editar_libro", return_value={"ok": False, "error": "No autorizado"}):
        with pytest.raises(HTTPException) as error:
            mod.editar(
                4, 1, "Título", "Autor", "Descripción", 12, 1, "Activo",
                isbn=None, acceso_anticipado=False, nivel_minimo_acceso="Plata",
                fecha_lanzamiento_publico=None, user={"sub": "5"},
            )
    assert error.value.status_code == 403

    with patch.object(mod, "obtener_tienda_por_usuario", return_value=None):
        with pytest.raises(HTTPException) as missing:
            mod.editar(
                4, 1, "Título", "Autor", "Descripción", 12, 1, "Activo",
                isbn=None, acceso_anticipado=False, nivel_minimo_acceso="Plata",
                fecha_lanzamiento_publico=None, user={"sub": "5"},
            )
    assert missing.value.status_code == 404
