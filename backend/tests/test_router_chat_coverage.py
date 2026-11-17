import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

import app.routers.chat as mod


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_token_helpers_validate_payload_and_extract_user(monkeypatch):
    credentials = MagicMock()
    credentials.credentials = "token"
    monkeypatch.setattr(mod, "verify_token", lambda _token: {"sub": "7", "rol": "vendedor"})
    assert mod.get_current_user(credentials) == 7
    assert mod.get_current_user_rol(credentials) == "vendedor"

    monkeypatch.setattr(mod, "verify_token", lambda _token: None)
    with pytest.raises(HTTPException) as error:
        mod.get_current_user(credentials)
    assert error.value.status_code == 401


def test_room_list_selects_user_scope_and_formats_attachment_previews(monkeypatch):
    db, cursor = _db()
    cursor.fetchall.return_value = [
        {"id_sala": 1, "id_usuario": 4, "ultimo_mensaje": "[AUDIO]clip"},
        {"id_sala": 2, "id_usuario": 4, "ultimo_mensaje": "[FILE]scan", "foto_tienda": "store.jpg"},
        {"id_sala": 3, "id_usuario": 4, "ultimo_mensaje": "Hola", "logo_tienda": "logo.jpg"},
    ]
    cursor.fetchone.side_effect = [{"foto_perfil": "buyer.jpg"}, None]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    result = mod.obtener_salas_usuario(user_id=8, rol="vendedor")

    assert result["salas"][0]["ultimo_mensaje"] == "🎤 Nota de voz"
    assert result["salas"][1]["ultimo_mensaje"] == "📎 Archivo adjunto"
    assert result["salas"][2]["foto_tienda"] == "logo.jpg"
    assert result["salas"][0]["foto_tienda"] == "buyer.jpg"
    assert "t.id_usuario = %s" in cursor.execute.call_args_list[0].args[0]
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_create_room_returns_existing_inserts_new_and_reports_missing(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_tienda": 3}, {"id_sala": 10},
        {"id_tienda": 3}, None,
        None,
    ]
    cursor.lastrowid = 11
    monkeypatch.setattr(mod, "get_db", lambda: db)
    data = mod.SalaCreate(id_tienda=3)

    assert mod.crear_sala_chat(data, user_id=4)["id_sala"] == 10
    assert mod.crear_sala_chat(data, user_id=4)["id_sala"] == 11
    db.commit.assert_called_once()
    with pytest.raises(HTTPException) as missing:
        mod.crear_sala_chat(data, user_id=4)
    assert missing.value.status_code == 404


def test_message_history_checks_permissions_and_marks_live_delivery(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_comprador": 4, "id_vendedor": 8},
        {"id_comprador": 4, "id_vendedor": 8},
    ]
    cursor.fetchall.return_value = [
        {"id_mensaje": 2, "mensaje_leido": False},
        {"id_mensaje": 1, "mensaje_leido": True},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    monkeypatch.setattr(mod.manager, "esta_conectado", lambda _uid: True)

    result = mod.obtener_mensajes_sala(5, user_id=4, rol="comprador")

    assert [message["id_mensaje"] for message in result["mensajes"]] == [1, 2]
    assert [message["entregado"] for message in result["mensajes"]] == [True, True]


def test_message_history_rejects_missing_or_foreign_rooms(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [None, {"id_comprador": 4, "id_vendedor": 8}]
    monkeypatch.setattr(mod, "get_db", lambda: db)

    with pytest.raises(HTTPException) as missing:
        mod.obtener_mensajes_sala(1, user_id=4, rol="comprador")
    assert missing.value.status_code == 404
    with pytest.raises(HTTPException) as forbidden:
        mod.obtener_mensajes_sala(1, user_id=9, rol="comprador")
    assert forbidden.value.status_code == 403
    assert cursor.close.call_count == 2


def test_sync_message_validates_size_and_access(monkeypatch):
    with pytest.raises(HTTPException) as empty:
        mod._guardar_mensaje_sync(1, 4, "  ")
    assert empty.value.status_code == 400
    with pytest.raises(HTTPException) as too_large:
        mod._guardar_mensaje_sync(1, 4, "x" * 15000001)
    assert too_large.value.status_code == 400

    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_comprador": 4, "id_vendedor": 8},
        {"id_mensaje": 2, "nombre_remitente": "Comprador"},
        {"id_comprador": 4, "id_vendedor": 8},
        None,
    ]
    cursor.lastrowid = 2
    monkeypatch.setattr(mod, "get_db", lambda: db)

    result = mod._guardar_mensaje_sync(3, 4, "mensaje de prueba")

    assert result["mensaje"]["id_mensaje"] == 2
    assert result["destinatario_id"] == 8
    assert db.commit.call_count == 3


def test_sync_message_denies_nonparticipant_and_swallows_notification_issue(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_comprador": 4, "id_vendedor": 8},
        {"rol": "comprador"},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    with pytest.raises(HTTPException) as forbidden:
        mod._guardar_mensaje_sync(3, 9, "mensaje")
    assert forbidden.value.status_code == 403

    cursor.execute.side_effect = None
    cursor.fetchone.side_effect = [
        {"id_comprador": 4, "id_vendedor": 8},
        {"id_mensaje": 5, "nombre_remitente": "Comprador"},
        {"id_comprador": 4, "id_vendedor": 8},
        None,
    ]
    cursor.execute.side_effect = [
        None, None, None, None, None, RuntimeError("notification unavailable"),
    ]
    cursor.lastrowid = 5
    result = mod._guardar_mensaje_sync(3, 4, "[FILE]archive")
    assert result["mensaje"]["id_mensaje"] == 5
    assert db.rollback.call_count == 0


def test_async_message_notification_sends_delivery_ack(monkeypatch):
    message = {"id_mensaje": 12, "id_sala": 3}
    monkeypatch.setattr(mod, "_guardar_mensaje_sync", lambda *_args: {
        "mensaje": message, "destinatario_id": 8,
    })
    sender = AsyncMock(return_value=True)
    monkeypatch.setattr(mod.manager, "enviar_a_usuario", sender)

    result = asyncio.run(mod.enviar_y_notificar(3, 4, "hola"))

    assert result["entregado"] is True
    assert sender.await_count == 2
    assert sender.await_args_list[1].args[0] == 4


def test_mark_read_and_delete_room_require_participant(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_comprador": 4, "id_vendedor": 8},
        {"id_comprador": 4, "id_vendedor": 8},
    ]
    monkeypatch.setattr(mod, "get_db", lambda: db)
    assert mod.marcar_mensaje_leido(2, user_id=4, rol="comprador")["ok"] is True
    assert mod.eliminar_sala_chat(3, user_id=8, rol="vendedor")["ok"] is True
    assert db.commit.call_count == 2
    assert cursor.execute.call_count == 6
