import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

import app.routers.perfil as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_current_user_requires_valid_bearer_token(monkeypatch):
    with pytest.raises(HTTPException) as missing:
        mod.get_current_user(None)
    assert missing.value.status_code == 401

    credentials = MagicMock()
    credentials.credentials = "bad"
    monkeypatch.setattr(mod, "verify_token", lambda _token: None)
    with pytest.raises(HTTPException) as invalid:
        mod.get_current_user(credentials)
    assert invalid.value.status_code == 401

    monkeypatch.setattr(mod, "verify_token", lambda _token: {"sub": "4"})
    assert mod.get_current_user(credentials) == 4


def test_create_and_update_addresses_cover_normalization_and_missing_fields(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_direccion": 9, "direccion": "Calle 1"},
        {"id_direccion": 9},
        {"id_direccion": 9, "direccion": "Calle 2"},
        {"id_direccion": 9, "direccion": "Calle 2"},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    created = mod.crear_direccion(
        mod.DireccionCrear(
            direccion="  Calle 1  ", alias_direccion=" Casa ",
            ciudad=" Bogotá ", departamento=" Cundinamarca ",
            codigo_postal=" 110111 ", es_principal=True,
        ),
        user_id=4,
    )
    assert created["id_direccion"] == 9
    assert cursor.execute.call_args_list[1].args[1] == (
        4, "Casa", "Calle 1", "Bogotá", "Cundinamarca", "110111", 1,
    )

    with pytest.raises(HTTPException) as no_fields:
        mod.actualizar_direccion(9, mod.DireccionBase(), user_id=4)
    assert no_fields.value.status_code == 400
    updated = mod.actualizar_direccion(
        9,
        mod.DireccionBase(direccion=" Calle 2 ", ciudad="", es_principal=False),
        user_id=4,
    )
    assert updated["direccion"] == "Calle 2"
    assert cursor.execute.call_args_list[-2].args[1] == ["Calle 2", None, 0, 9, 4]
    assert db.commit.call_count == 2


def test_profile_endpoint_parses_saved_preferences_and_supplies_defaults(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_usuario": 1, "preferencias": '{"notificaciones_mensajes":{"email":false,"web":true}}'},
        {"id_usuario": 1, "preferencias": None},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    saved = mod.obtener_perfil(1)
    default = mod.obtener_perfil(1)
    assert saved["preferencias"]["notificaciones_mensajes"]["email"] is False
    assert default["preferencias"]["notificaciones_ofertas"]["web"] is False
    assert default["preferencias"]["notificaciones_pedidos"]["email"] is True


def test_profile_preferences_handle_unknown_keys_non_dict_and_invalid_json(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_usuario": 1, "preferencias": '{"custom_setting":"enabled"}'},
        {"id_usuario": 1, "preferencias": "[]"},
        {"id_usuario": 1, "preferencias": "{invalid"},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    merged = mod.obtener_perfil(1)["preferencias"]
    non_dict = mod.obtener_perfil(1)["preferencias"]
    invalid_json = mod.obtener_perfil(1)["preferencias"]

    assert merged["custom_setting"] == "enabled"
    assert "notificaciones_mensajes" in non_dict
    assert "notificaciones_mensajes" in invalid_json


def test_update_profile_requires_fields_and_persists_supported_values(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)

    with pytest.raises(HTTPException) as empty:
        mod.actualizar_perfil(mod.PerfilActualizar(), user_id=4)
    assert empty.value.status_code == 400

    result = mod.actualizar_perfil(
        mod.PerfilActualizar(nombre_usuario="Ana", telefono="300"),
        user_id=4,
    )
    assert result["ok"] is True
    assert cursor.execute.call_args.args[1] == ["Ana", "300", 4]
    db.commit.assert_called_once()


def test_preferences_serializes_only_provided_notification_channels(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)

    result = mod.actualizar_preferencias(
        mod.PreferenciasUsuario(
            notificaciones_mensajes=mod.CanalNotificacion(email=False, web=True),
            notificaciones_pagos=mod.CanalNotificacion(email=True, web=False),
        ),
        user_id=6,
    )
    saved = json.loads(cursor.execute.call_args.args[1][0])
    assert result["ok"] is True
    assert saved == {
        "notificaciones_mensajes": {"email": False, "web": True},
        "notificaciones_pagos": {"email": True, "web": False},
    }


def test_password_schema_and_change_password_outcomes(monkeypatch):
    with pytest.raises(ValueError):
        mod.CambiarPassword(password_actual="old", password_nueva="weakpass")
    payload = mod.CambiarPassword(
        password_actual="old", password_nueva="Strong1!",
    )

    db, cursor = _db()
    cursor.fetchone.side_effect = [
        None,
        {"correo_usuario": "a@test.com"},
        {"correo_usuario": "a@test.com"},
        {"correo_usuario": "a@test.com"},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with patch("app.models.usuarios.verificar_password_usuario", return_value=True), \
         patch("app.models.usuarios.actualizar_password", side_effect=[
             {"ok": True}, {"ok": False},
         ]):
        with pytest.raises(HTTPException) as absent:
            mod.cambiar_password(payload, user_id=4)
        assert absent.value.status_code == 404

        assert mod.cambiar_password(payload, user_id=4)["ok"] is True
        with pytest.raises(HTTPException) as save_error:
            mod.cambiar_password(payload, user_id=4)
        assert save_error.value.status_code == 500


def test_purchase_history_adds_digital_items_and_public_profile_not_found(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.side_effect = [
        [{"id_orden": 2, "total": 100}],
        [{"titulo": "Ebook", "archivo_digital_url": "/digital/book.pdf"}],
    ]
    cursor.fetchone.side_effect = [None]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    history = mod.obtener_historial_compras(user_id=4)
    assert history["total"] == 1
    assert history["compras"][0]["items_digitales"][0]["titulo"] == "Ebook"
    with pytest.raises(HTTPException) as absent:
        mod.obtener_perfil_publico(99)
    assert absent.value.status_code == 404


def test_user_statistics_calculates_loyalty_tier_and_category_list(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.return_value = {
        "num_compras": 3, "total_gastado": 320000, "ticket_promedio": 106666.67,
    }
    cursor.fetchall.return_value = [{"nombre": "Novela", "conteo": 2}]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    result = mod.obtener_estadisticas_reales(user_id=8)

    assert result["nivel_fidelizacion"] == "Zafiro"
    assert result["total_gastado"] == 320000
    assert result["categorias_favoritas"] == [{"nombre": "Novela", "conteo": 2}]


def test_addresses_listing_and_deleting_a_primary_address(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"id_direccion": 3, "direccion": "Calle 3"}]
    cursor.fetchone.side_effect = [
        {"id_direccion": 3, "es_principal": True},
        {"id_direccion": 4},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    assert mod.listar_direcciones(7) == [{"id_direccion": 3, "direccion": "Calle 3"}]
    assert mod.eliminar_direccion(3, 7)["ok"] is True
    assert any("UPDATE direcciones_envio SET es_principal" in call.args[0] for call in cursor.execute.call_args_list)
    db.commit.assert_called_once()


def test_banner_color_persists_the_requested_value(monkeypatch):
    db, cursor = _db()
    monkeypatch.setattr(mod, "get_db", lambda: db)
    color = mod.guardar_banner_color(mod.BannerColorData(banner_color="#123456"), 5)

    assert color == {"ok": True, "mensaje": "Color de banner guardado", "banner_color": "#123456"}
    cursor.execute.assert_called_once_with(
        "UPDATE usuarios SET banner_color = %s, banner_perfil = NULL WHERE id_usuario = %s",
        ("#123456", 5),
    )
    db.commit.assert_called_once()


def test_store_rating_returns_distribution_and_validates_new_rating(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [{"calificacion": 5, "comentario": "Excelente"}]
    cursor.fetchone.return_value = {
        "calificacion_media": 4.5,
        "total_opiniones": 1,
        "total_5_estrellas": 1,
    }
    monkeypatch.setattr(mod, "get_db", lambda: db)

    ratings = mod.obtener_calificaciones_tienda(3)
    assert ratings["promedio"] == 4.5
    assert ratings["distribucion"][5] == 1

    with pytest.raises(HTTPException) as invalid:
        mod.crear_calificacion_tienda(
            mod.CalificacionTiendaCreate(id_tienda=3, calificacion=0, comentario=""), user_id=2,
        )
    assert invalid.value.status_code == 400
