from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

import app.routers.cupones as cupones
import app.routers.favoritos as favoritos
import app.routers.lista_deseos as listas
import app.routers.ofertas as ofertas
import app.routers.resenas as resenas


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_favorites_migrates_legacy_lists_and_adds_or_rejects_books(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.side_effect = [[{"id_lista": 5}], [{"id_libro": 3}]]
    monkeypatch.setattr(favoritos, "get_db", lambda: db)

    assert favoritos.listar_favoritos(8) == [{"id_libro": 3}]
    db.commit.assert_called_once()
    assert cursor.execute.call_count == 5

    cursor.fetchone.side_effect = [None]
    with pytest.raises(HTTPException) as missing:
        favoritos.agregar_favorito(99, 8)
    assert missing.value.status_code == 404

    cursor.fetchone.side_effect = [{"id_libro": 3}, None]
    cursor.lastrowid = 12
    assert favoritos.agregar_favorito(3, 8) == {"ok": True, "id_favorito": 12}

    cursor.fetchone.side_effect = [{"id_libro": 3}, {"id_favorito": 1}]
    with pytest.raises(HTTPException) as duplicate:
        favoritos.agregar_favorito(3, 8)
    assert duplicate.value.status_code == 400
    assert cursor.close.call_count == 4
    assert db.close.call_count == 4


def test_favorites_delete_requires_an_existing_row(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(favoritos, "get_db", lambda: db)
    cursor.rowcount = 0
    with pytest.raises(HTTPException) as missing:
        favoritos.eliminar_favorito(4, 9)
    assert missing.value.status_code == 404

    cursor.rowcount = 1
    assert favoritos.eliminar_favorito(4, 9) == {"ok": True}
    assert db.commit.call_count == 1


def test_coupons_validate_apply_and_format_admin_dates(monkeypatch):
    with pytest.raises(HTTPException) as missing_code:
        cupones.validar({"codigo": "  ", "total": 10}, {"id_usuario": 7})
    assert missing_code.value.status_code == 400

    monkeypatch.setattr(cupones, "validar_cupon", lambda *_args: {
        "valido": True, "mensaje": "Aplicable", "descuento": 20,
        "cupon": {"id_cupon": 3},
    })
    assert cupones.validar({"codigo": " SAVE ", "total": 100}, {"id_usuario": 7}) == {
        "valido": True, "mensaje": "Aplicable", "descuento": 20, "cupon": {"id_cupon": 3},
    }

    monkeypatch.setattr(cupones, "validar_cupon", lambda *_args: {
        "valido": False, "mensaje": "Cupón vencido",
    })
    with pytest.raises(HTTPException) as invalid_apply:
        cupones.aplicar({"codigo": "SAVE", "id_orden": 2, "total": 100}, {"id_usuario": 7})
    assert invalid_apply.value.status_code == 400

    monkeypatch.setattr(cupones, "validar_cupon", lambda *_args: {
        "valido": True, "mensaje": "Aplicable", "descuento": 20,
        "cupon": {"id_cupon": 3},
    })
    monkeypatch.setattr(cupones, "registrar_uso_cupon", lambda *_args: {"ok": True})
    assert cupones.aplicar(
        {"codigo": "SAVE", "id_orden": 2, "total": 100}, {"id_usuario": 7}
    )["descuento"] == 20

    monkeypatch.setattr(cupones, "obtener_todos_cupones", lambda: [{
        "fecha_inicio": datetime(2026, 1, 1), "fecha_fin": None,
    }])
    assert cupones.listar_cupones()[0]["fecha_inicio"] == "2026-01-01 00:00:00"


def test_coupon_creation_and_vendor_scoping(monkeypatch):
    with pytest.raises(HTTPException) as missing:
        cupones.crear({}, {"rol": "admin"})
    assert missing.value.status_code == 400

    with pytest.raises(HTTPException) as bad_type:
        cupones.crear(
            {"codigo_cupon": "SAVE", "tipo_descuento": "otro", "valor_descuento": 5},
            {"rol": "admin"},
        )
    assert bad_type.value.status_code == 400

    payload = {"codigo_cupon": "SAVE", "tipo_descuento": "fijo", "valor_descuento": 5}
    with pytest.raises(HTTPException) as no_store:
        cupones.crear(payload.copy(), {"rol": "vendedor"})
    assert no_store.value.status_code == 400

    payload["id_tienda"] = 4
    monkeypatch.setattr(cupones, "crear_cupon", lambda data: {"ok": True, "id_cupon": 11})
    assert cupones.crear(payload.copy(), {"rol": "admin"})["id_cupon"] == 11
    assert cupones.crear(payload.copy(), {"rol": "vendedor", "id_tienda": 8})["id_cupon"] == 11

    monkeypatch.setattr(cupones, "obtener_cupones_por_tienda", lambda _store: [{"id_cupon": 11}])
    with pytest.raises(HTTPException) as forbidden:
        cupones.listar_por_tienda(9, {"rol": "vendedor", "id_tienda": 8})
    assert forbidden.value.status_code == 403
    assert cupones.listar_por_tienda(8, {"rol": "vendedor", "id_tienda": 8}) == [{"id_cupon": 11}]


def test_coupon_edit_and_delete_report_model_failures(monkeypatch):
    monkeypatch.setattr(cupones, "obtener_cupones_por_tienda", lambda _store: [])
    with pytest.raises(HTTPException) as edit_forbidden:
        cupones.editar(2, {}, {"rol": "vendedor", "id_tienda": 5})
    assert edit_forbidden.value.status_code == 403

    monkeypatch.setattr(cupones, "actualizar_cupon", lambda *_args: {"ok": False, "error": "No existe"})
    with pytest.raises(HTTPException) as edit_error:
        cupones.editar(2, {}, {"rol": "admin"})
    assert edit_error.value.status_code == 400

    monkeypatch.setattr(cupones, "eliminar_cupon", lambda *_args: {"ok": True, "mensaje": "Desactivado"})
    assert cupones.eliminar(2, {"rol": "admin"})["mensaje"] == "Desactivado"


def test_wishlist_owner_checks_create_update_and_book_insertion(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(listas, "get_db", lambda: db)
    cursor.fetchone.return_value = None
    with pytest.raises(HTTPException) as not_owner:
        listas._verificar_propiedad_lista(cursor, 1, 8)
    assert not_owner.value.status_code == 404

    with pytest.raises(HTTPException) as blank:
        listas.crear_lista(listas.ListaDeseosCrear(nombre_lista="  "), 8)
    assert blank.value.status_code == 400

    cursor.fetchone.side_effect = [
        {"id_lista": 1}, {"id_lista": 1}, {"id_libro": 4}, None, {"id_item": 3},
    ]
    cursor.lastrowid = 1
    cursor.fetchall.return_value = []
    assert listas.crear_lista(listas.ListaDeseosCrear(nombre_lista=" Lecturas "), 8) == {"id_lista": 1}
    assert listas.agregar_libro_lista(1, listas.LibroListaDeseosCrear(id_libro=4, nota="Leer"), 8) == {"id_item": 3}
    assert db.commit.call_count == 2


def test_wishlist_update_delete_and_missing_book_paths(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(listas, "get_db", lambda: db)
    cursor.fetchone.side_effect = [
        {"id_lista": 2}, {"id_lista": 2},
    ]
    with pytest.raises(HTTPException) as no_changes:
        listas.actualizar_lista(2, listas.ListaDeseosActualizar(), 3)
    assert no_changes.value.status_code == 400

    cursor.fetchone.side_effect = [{"id_lista": 2}, None]
    with pytest.raises(HTTPException) as missing_book:
        listas.agregar_libro_lista(2, listas.LibroListaDeseosCrear(id_libro=9), 3)
    assert missing_book.value.status_code == 404

    cursor.fetchone.side_effect = [{"id_lista": 2}]
    assert listas.eliminar_lista(2, 3) == {"ok": True, "mensaje": "Lista eliminada"}

    cursor.fetchone.side_effect = [{"id_lista": 2}]
    cursor.rowcount = 0
    with pytest.raises(HTTPException) as missing_item:
        listas.eliminar_libro_lista(2, 9, 3)
    assert missing_item.value.status_code == 404


def test_reviews_enforce_purchase_and_owner_checks(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(resenas, "get_db", lambda: db)
    with pytest.raises(HTTPException) as rating:
        resenas.crear_resena(resenas.ResenaCreate(id_libro=1, calificacion=6, comentario="x"), 4)
    assert rating.value.status_code == 400

    cursor.fetchone.return_value = {"comprado": 0}
    with pytest.raises(HTTPException) as purchase:
        resenas.crear_resena(resenas.ResenaCreate(id_libro=1, calificacion=5, comentario="ok"), 4)
    assert purchase.value.status_code == 403

    cursor.fetchone.side_effect = [{"id_usuario": 8}]
    with pytest.raises(HTTPException) as owner:
        resenas.actualizar_resena(
            3, resenas.ResenaCreate(id_libro=1, calificacion=5, comentario="ok"), 4
        )
    assert owner.value.status_code == 403


def test_review_listing_averages_and_delete_requires_ownership(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_resena": 1}]
    cursor.fetchone.side_effect = [{"promedio": 4.26}, (8,)]
    monkeypatch.setattr(resenas, "get_db", lambda: db)
    assert resenas.obtener_resenas_libro(2) == {
        "promedio": 4.3, "total": 1, "resenas": [{"id_resena": 1}],
    }
    with pytest.raises(HTTPException) as forbidden:
        resenas.eliminar_resena(1, 4)
    assert forbidden.value.status_code == 403


def test_offer_dates_validation_and_successful_creation(monkeypatch):
    with pytest.raises(HTTPException) as invalid_date:
        ofertas.parse_fecha("not-a-date")
    assert invalid_date.value.status_code == 400

    start = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
    end = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")
    user = {"sub": "5"}
    monkeypatch.setattr(ofertas, "obtener_tienda_por_usuario", lambda _user: {"id_tienda": 7})
    monkeypatch.setattr(ofertas, "crear_oferta", lambda **_kwargs: {"ok": True, "id_oferta": 9})
    assign = MagicMock()
    monkeypatch.setattr(ofertas, "asignar_libros_oferta", assign)

    with pytest.raises(HTTPException) as invalid_discount:
        ofertas.crear("Oferta", "porcentaje", 101, start, end, "1, 2", user)
    assert invalid_discount.value.status_code == 400

    result = ofertas.crear("Oferta", "porcentaje", 15, start, end, "1, 2, x", user)
    assert result == {"mensaje": "Oferta creada correctamente", "id_oferta": 9}
    assign.assert_called_once_with(9, [1, 2])


def test_offer_detail_and_active_lookup_handle_missing_records(monkeypatch):
    monkeypatch.setattr(ofertas, "obtener_tienda_por_usuario", lambda _user: {"id_tienda": 7})
    monkeypatch.setattr(ofertas, "obtener_oferta_detalle", lambda *_args: None)
    with pytest.raises(HTTPException) as missing:
        ofertas.detalle(99, {"sub": "5"})
    assert missing.value.status_code == 404

    monkeypatch.setattr(ofertas, "obtener_oferta_activa_libro", lambda _book: None)
    assert ofertas.oferta_activa_libro(3) is None


def test_offer_list_edit_delete_and_token_helpers(monkeypatch):
    with pytest.raises(HTTPException) as invalid_token:
        ofertas.get_current_user(MagicMock(credentials="bad"))
    assert invalid_token.value.status_code == 401

    monkeypatch.setattr(ofertas, "verify_token", lambda _token: {"sub": "5"})
    assert ofertas.get_current_user(MagicMock(credentials="valid")) == {"sub": "5"}

    monkeypatch.setattr(ofertas, "obtener_tienda_por_usuario", lambda _user: {"id_tienda": 7})
    monkeypatch.setattr(ofertas, "obtener_ofertas_tienda", lambda _store: [{"id_oferta": 1}])
    assert ofertas.listar_ofertas({"sub": "5"}) == [{"id_oferta": 1}]

    start = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
    end = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")
    assignment = MagicMock()
    monkeypatch.setattr(ofertas, "asignar_libros_oferta", assignment)
    monkeypatch.setattr(ofertas, "editar_oferta", lambda **_kwargs: {"ok": False, "error": "No autorizado"})
    with pytest.raises(HTTPException) as denied:
        ofertas.editar(4, "Oferta", "fijo", 10, start, end, "1", {"sub": "5"})
    assert denied.value.status_code == 403

    monkeypatch.setattr(ofertas, "editar_oferta", lambda **_kwargs: {"ok": True})
    assert ofertas.editar(4, "Oferta", "especial", 0, start, end, "1,x,2", {"sub": "5"}) == {
        "mensaje": "Oferta actualizada correctamente",
    }
    assignment.assert_called_once_with(4, [1, 2])

    monkeypatch.setattr(ofertas, "eliminar_oferta", lambda *_args: {"ok": False, "error": "No autorizado"})
    with pytest.raises(HTTPException) as delete_denied:
        ofertas.eliminar(4, {"sub": "5"})
    assert delete_denied.value.status_code == 403
    monkeypatch.setattr(ofertas, "eliminar_oferta", lambda *_args: {"ok": True})
    assert ofertas.eliminar(4, {"sub": "5"}) == {"mensaje": "Oferta eliminada correctamente"}
    monkeypatch.setattr(ofertas, "obtener_oferta_activa_libro", lambda _book: {"id_oferta": 4})
    assert ofertas.oferta_activa_libro(2) == {"id_oferta": 4}
