import asyncio
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from fastapi import HTTPException, WebSocketDisconnect

import app.routers.asistente as asistente
import app.routers.chat as chat


def _db():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def test_chat_room_read_marks_messages_and_notifies_other_participant(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.return_value = {"id_comprador": 4, "id_vendedor": 8}
    notify = AsyncMock(return_value=True)
    monkeypatch.setattr(chat, "get_db", lambda: db)
    monkeypatch.setattr(chat.manager, "enviar_a_usuario", notify)

    result = asyncio.run(chat.marcar_sala_leida(6, user_id=4, rol="comprador"))

    assert result["ok"] is True
    assert cursor.execute.call_count == 2
    assert db.commit.call_count == 1
    notify.assert_awaited_once_with(
        8, {"tipo": "mensajes_leidos", "id_sala": 6}
    )
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_chat_clear_messages_requires_participation_and_clears_room(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        {"id_comprador": 4, "id_vendedor": 8},
        {"id_comprador": 4, "id_vendedor": 8},
    ]
    monkeypatch.setattr(chat, "get_db", lambda: db)

    with pytest.raises(HTTPException) as forbidden:
        chat.vaciar_mensajes_sala(6, user_id=9, rol="comprador")
    assert forbidden.value.status_code == 403

    result = chat.vaciar_mensajes_sala(6, user_id=4, rol="comprador")

    assert result["ok"] is True
    assert "DELETE FROM mensajes" in cursor.execute.call_args.args[0]
    assert db.commit.call_count == 1
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_chat_websocket_authenticates_ping_message_errors_and_disconnects(monkeypatch):
    websocket = MagicMock()
    websocket.query_params = {"token": "valid"}
    websocket.receive_json = AsyncMock(
        side_effect=[
            {"tipo": "ping"},
            {"tipo": "mensaje", "id_sala": 3, "mensaje": "hola"},
            WebSocketDisconnect(),
        ]
    )
    websocket.send_json = AsyncMock()
    connect = AsyncMock()
    disconnect = AsyncMock()
    monkeypatch.setattr(chat, "verify_token", lambda _token: {"sub": "4"})
    monkeypatch.setattr(chat.manager, "connect", connect)
    monkeypatch.setattr(chat.manager, "disconnect", disconnect)
    monkeypatch.setattr(
        chat,
        "enviar_y_notificar",
        AsyncMock(side_effect=HTTPException(status_code=403, detail="Sin acceso")),
    )

    asyncio.run(chat.chat_websocket(websocket))

    connect.assert_awaited_once_with(4, websocket)
    websocket.send_json.assert_has_awaits(
        [
            (({"tipo": "pong"},),),
            (({"tipo": "error", "detalle": "Sin acceso"},),),
        ]
    )
    disconnect.assert_awaited_once_with(4, websocket)


def test_chat_websocket_rejects_missing_token(monkeypatch):
    websocket = MagicMock()
    websocket.query_params = {}
    websocket.accept = AsyncMock()
    websocket.close = AsyncMock()
    monkeypatch.setattr(chat, "verify_token", lambda _token: None)

    asyncio.run(chat.chat_websocket(websocket))

    websocket.accept.assert_awaited_once()
    websocket.close.assert_awaited_once_with(code=4401)


def test_chat_message_endpoint_wraps_delivery_result(monkeypatch):
    message = {"id_mensaje": 5, "entregado": True}
    send = AsyncMock(return_value=message)
    monkeypatch.setattr(chat, "enviar_y_notificar", send)

    response = asyncio.run(
        chat.enviar_mensaje(chat.MensajeCreate(id_sala=2, mensaje="hola"), user_id=4)
    )

    assert response == {
        "ok": True,
        "id_mensaje": 5,
        "mensaje": "Mensaje enviado",
        "entregado": True,
        "data": message,
    }
    send.assert_awaited_once_with(2, 4, "hola")


def test_chat_sync_message_missing_room_and_audio_preview(monkeypatch):
    db, cursor = _db()
    cursor.fetchone.side_effect = [
        None,
        {"id_comprador": 4, "id_vendedor": 8},
        {"id_mensaje": 7, "nombre_remitente": "Comprador"},
        {"id_comprador": 4, "id_vendedor": 8},
        None,
    ]
    cursor.lastrowid = 7
    monkeypatch.setattr(chat, "get_db", lambda: db)

    with pytest.raises(HTTPException) as missing:
        chat._guardar_mensaje_sync(3, 4, "hola")
    assert missing.value.status_code == 404

    result = chat._guardar_mensaje_sync(3, 4, "[AUDIO]clip")

    assert result["mensaje"]["id_mensaje"] == 7
    notification_insert = cursor.execute.call_args_list[-1]
    assert "INSERT INTO notificaciones" in notification_insert.args[0]
    assert notification_insert.args[1][2] == "🎤 Nota de voz"
    assert db.commit.call_count == 3


def test_assistant_local_fallback_handles_unknown_and_empty_questions():
    assert asistente.respuesta_local("   ") == "Escribe tu pregunta para que pueda ayudarte."
    assert asistente.respuesta_local("consulta desconocida", {"rol": "comprador"})
    assert asistente.respuesta_local("consulta desconocida", {"rol": "vendedor"})
    assert asistente.respuesta_local("consulta desconocida")
    assert asistente.saludo_personalizado({"rol": "comprador"}, None).startswith("Hola!")
    assert asistente.saludo_personalizado({"rol": "otro"}, None).startswith("Hola!")
    assert not asistente.es_saludo_predeterminado("")


def test_assistant_ia_configuration_selects_gemini_openai_or_local(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-secret")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-flash")
    monkeypatch.setenv(
        "GEMINI_BASE_URL",
        "https://generativelanguage.googleapis.com/v1beta/openai",
    )
    assert asistente.configuracion_ia() == (
        "gemini-secret",
        "gemini-2.5-flash",
        "https://generativelanguage.googleapis.com/v1beta/openai",
        "gemini",
    )

    monkeypatch.delenv("GEMINI_API_KEY")
    monkeypatch.setenv("OPENAI_API_KEY", "openai-secret")
    monkeypatch.setenv("OPENAI_MODEL", "custom-model")
    monkeypatch.setenv("OPENAI_BASE_URL", "https://example.test/v1")
    assert asistente.configuracion_ia() == (
        "openai-secret",
        "custom-model",
        "https://example.test/v1",
        "openai",
    )

    monkeypatch.delenv("OPENAI_API_KEY")
    assert asistente.configuracion_ia() == (None, None, None, "local")


class _FakeAsyncClient:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False

    async def post(self, *_args, **_kwargs):
        if self.error:
            raise self.error
        return self.response


class _FakeResponse:
    def __init__(self, status_code, data=None, text="response error"):
        self.status_code = status_code
        self.data = data or {"choices": [{"message": {"content": " answer "}}]}
        self.text = text

    def json(self):
        return self.data


def test_assistant_model_call_handles_success_http_errors_empty_and_timeout(monkeypatch):
    async def call(response=None, error=None):
        monkeypatch.setattr(
            asistente.httpx,
            "AsyncClient",
            lambda **_kwargs: _FakeAsyncClient(response=response, error=error),
        )
        return await asistente._llamar_modelo("key", "https://example.test/", "model", [], {})

    assert asyncio.run(call(_FakeResponse(200))) == "answer"
    assert asyncio.run(call(_FakeResponse(503))) is None
    assert asyncio.run(call(_FakeResponse(400))) is None
    assert asyncio.run(
        call(_FakeResponse(200, {"choices": [{"message": {"content": "  "}}]}))
    ) is None
    assert asyncio.run(call(error=httpx.TimeoutException("timeout"))) is None
    assert asyncio.run(call(error=ValueError("invalid response"))) is None


def test_assistant_uses_local_reply_after_all_models_fail(monkeypatch):
    monkeypatch.setattr(
        asistente,
        "configuracion_ia",
        lambda: ("key", "primary", "https://example.test/v1", "openai"),
    )
    call = AsyncMock(return_value=None)
    monkeypatch.setattr(asistente, "_llamar_modelo", call)

    response = asyncio.run(
        asistente.generar_respuesta_ia("consulta", usuario={"rol": "comprador"})
    )

    assert response
    assert call.await_count == 1 + len(asistente.GEMINI_FALLBACK_MODELS)
