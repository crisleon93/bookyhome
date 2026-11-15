import asyncio
import sys
from datetime import datetime
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

import app.routers.envios as shipping
import app.routers.herramientas as tools
import app.routers.historial_interacciones as history
import app.routers.libreria as library
from app.schemas import LibreriaRegistro


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_library_registration_handles_success_duplicate_and_email_failure(monkeypatch):
    registration = LibreriaRegistro(
        nombre="Ana", libreria="Librería Uno", direccion="Calle 1",
        telefono="3001234567", email="ana@example.com", password="Password1",
    )
    monkeypatch.setattr(library, "crear_libreria", lambda *args: {"ok": True})
    monkeypatch.setattr(library, "is_smtp_configured", lambda: False)
    result = asyncio.run(library.registrar_libreria(registration))
    assert result["email_enviado"] is False

    monkeypatch.setattr(library, "crear_libreria", lambda *args: {
        "ok": False, "error": "Duplicate email",
    })
    with pytest.raises(HTTPException) as duplicate:
        asyncio.run(library.registrar_libreria(registration))
    assert duplicate.value.status_code == 400

    monkeypatch.setattr(library, "crear_libreria", lambda *args: {"ok": True})
    monkeypatch.setattr(library, "is_smtp_configured", lambda: True)
    monkeypatch.setattr(
        library, "enviar_email_confirmacion_registro",
        AsyncMock(side_effect=RuntimeError("mail unavailable")),
    )
    result = asyncio.run(library.registrar_libreria(registration))
    assert result["email_enviado"] is False


def test_library_featured_stores_selects_stock_limit_and_all_options(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_tienda": 2}]
    monkeypatch.setattr(library, "get_db", lambda: db)

    assert library.tiendas_destacadas(limit=None, solo_con_stock=None, todas=False) == [{"id_tienda": 2}]
    default_query = cursor.execute.call_args.args[0]
    assert "HAVING total_libros > 0" in default_query
    assert "LIMIT 12" in default_query

    library.tiendas_destacadas(limit=5, solo_con_stock=False, todas=False)
    limited_query = cursor.execute.call_args.args[0]
    assert "HAVING total_libros > 0" not in limited_query
    assert "LIMIT 5" in limited_query

    library.tiendas_destacadas(limit=None, solo_con_stock=None, todas=True)
    all_query = cursor.execute.call_args.args[0]
    assert "HAVING total_libros > 0" not in all_query
    assert "LIMIT" not in all_query
    assert cursor.close.call_count == 3
    assert db.close.call_count == 3


def test_library_store_status_and_profile_endpoints(monkeypatch):
    with pytest.raises(HTTPException) as invalid:
        library.cambiar_estado_tienda(3, {"estado": "desconocido"}, {"sub": "1"})
    assert invalid.value.status_code == 422

    update_status = MagicMock(return_value={"ok": True, "mensaje_enviado": True})
    monkeypatch.setattr(library, "actualizar_estado_tienda", update_status)
    result = library.cambiar_estado_tienda(
        3, {"estado": " SUSPENDIDA ", "motivo": " revisión "}, {"sub": "9"},
    )
    assert result["estado"] == "suspendida"
    assert result["mensaje_enviado"] is True
    update_status.assert_called_once_with(3, "suspendida", motivo="revisión", admin_user_id=9)

    monkeypatch.setattr(library, "obtener_tienda_por_usuario", lambda _user: None)
    with pytest.raises(HTTPException) as missing:
        library.obtener_mi_tienda({"sub": "8"})
    assert missing.value.status_code == 404

    monkeypatch.setattr(library, "obtener_tienda_por_usuario", lambda _user: {"id_tienda": 4})
    monkeypatch.setattr(library, "actualizar_tienda", lambda *_args: {"ok": False, "error": "db"})
    data = library.TiendaUpdate(nombre_tienda="Nueva", direccion="Calle 2", telefono="123")
    with pytest.raises(HTTPException) as update_failed:
        library.modificar_mi_tienda(data, {"sub": "8"})
    assert update_failed.value.status_code == 500


def test_tools_subscription_endpoints_validate_store_and_forward_data(monkeypatch):
    plans = [{"id_plan": 1}]
    monkeypatch.setattr(tools, "obtener_planes", lambda: plans)
    assert tools.listar_planes() == plans

    with pytest.raises(HTTPException) as no_store:
        tools.mi_suscripcion({})
    assert no_store.value.status_code == 404

    monkeypatch.setattr(tools, "obtener_suscripcion_activa_herramientas", lambda _store: None)
    assert tools.mi_suscripcion({"id_tienda": 5}) == {
        "activa": False, "plan_actual": "Gratuito",
    }

    monkeypatch.setattr(tools, "obtener_suscripcion_activa_herramientas", lambda _store: {"id": 8})
    assert tools.mi_suscripcion({"id_tienda": 5}) == {
        "activa": True, "suscripcion": {"id": 8},
    }

    data = tools.SuscripcionRequest(
        id_plan=2, fecha_inicio="2026-01-01", fecha_fin="2026-02-01",
        metodo_pago="tarjeta", monto_pagado=1200,
    )
    subscribe = MagicMock(return_value={"ok": False, "error": "plan unavailable"})
    monkeypatch.setattr(tools, "suscribir_plan", subscribe)
    with pytest.raises(HTTPException) as rejected:
        tools.suscribir(data, {"id_tienda": 5})
    assert rejected.value.status_code == 400
    subscribe.assert_called_once_with(
        id_tienda=5, id_plan=2, fecha_inicio="2026-01-01", fecha_fin="2026-02-01",
        metodo_pago="tarjeta", monto_pagado=1200,
    )

    monkeypatch.setattr(tools, "suscribir_plan", lambda **_kwargs: {
        "ok": True, "suscripcion": {"id_suscripcion": 9},
    })
    finance_module = ModuleType("app.models.bookypago_finanzas")
    finance_model = MagicMock()
    finance_model.registrar_ingreso_plan.return_value = {"ok": True}
    finance_module.BookyPagoFinanzas = MagicMock(return_value=finance_model)
    monkeypatch.setitem(sys.modules, "app.models.bookypago_finanzas", finance_module)
    assert tools.suscribir(data, {"id_tienda": 5}) == {"id_suscripcion": 9}

    monkeypatch.setattr(tools, "cancelar_suscripcion_herramientas", lambda _store: {
        "ok": False, "error": "No hay suscripción",
    })
    with pytest.raises(HTTPException) as no_active:
        tools.cancelar({"id_tienda": 5})
    assert no_active.value.status_code == 404


def test_shipping_endpoints_format_lookup_and_map_registration_errors(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_envio": 1, "fecha_despacho": datetime(2026, 11, 1, 8, 0)},
    ]
    monkeypatch.setattr(shipping, "get_db", lambda: db)
    result = shipping.obtener_envio_orden(8, {"sub": "3"})
    assert result["envio"]["fecha_despacho"] == "2026-11-01T08:00:00"
    assert cursor.close.call_count == 1

    cursor.fetchone.side_effect = [None, None]
    assert shipping.obtener_envio_orden(9, {"sub": "3"}) == {"envio": None}

    monkeypatch.setattr(shipping, "obtener_tienda_por_usuario", lambda _user: None)
    with pytest.raises(HTTPException) as not_seller:
        shipping.actualizar_envio(
            8, shipping.RegistroEnvio(id_comprador=3, id_empresa=1, numero_guia="ABC"),
            {"sub": "3"},
        )
    assert not_seller.value.status_code == 403

    monkeypatch.setattr(shipping, "obtener_tienda_por_usuario", lambda _user: {"id_tienda": 4})
    monkeypatch.setattr(shipping, "registrar_envio", lambda *_args: (None, "Orden no encontrada"))
    with pytest.raises(HTTPException) as missing_order:
        shipping.actualizar_envio(
            8, shipping.RegistroEnvio(id_comprador=3, id_empresa=1, numero_guia="ABC"),
            {"sub": "3"},
        )
    assert missing_order.value.status_code == 404


def test_history_listing_registration_statistics_and_delete(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_interaccion": 2}]
    cursor.fetchone.return_value = {"total": 4}
    cursor.lastrowid = 7
    cursor.rowcount = 1
    monkeypatch.setattr(history, "get_db", lambda: db)

    assert history.obtener_historial_usuario(5, tipo="compra", limit=3, offset=1) == {
        "historial": [{"id_interaccion": 2}],
    }
    query, params = cursor.execute.call_args.args
    assert "h.tipo = %s" in query
    assert params == [5, "compra", 3, 1]

    with pytest.raises(HTTPException) as missing_book:
        history.registrar_interaccion(
            history.InteraccionCreate(tipo="visualizacion"), 5,
        )
    assert missing_book.value.status_code == 400
    with pytest.raises(HTTPException) as missing_store:
        history.registrar_interaccion(history.InteraccionCreate(tipo="mensaje"), 5)
    assert missing_store.value.status_code == 400

    created = history.registrar_interaccion(
        history.InteraccionCreate(tipo="favorito", id_libro=2), 5,
    )
    assert created["id_interaccion"] == 7
    db.commit.assert_called_once()

    cursor.fetchall.return_value = [{"tipo": "favorito", "total": 1}]
    assert history.obtener_estadisticas_historial(5) == {
        "total": 4, "por_tipo": [{"tipo": "favorito", "total": 1}],
    }
    assert history.eliminar_interaccion(7, 5)["ok"] is True
    assert db.commit.call_count == 2

    cursor.rowcount = 0
    with pytest.raises(HTTPException) as missing:
        history.eliminar_interaccion(99, 5)
    assert missing.value.status_code == 404
