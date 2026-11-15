import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

import app.routers.asistente as assistant
import app.routers.devoluciones as refunds
from app.ws.manager import ConnectionManager


def test_assistant_local_replies_and_conversation_history():
    assert assistant.normalizar("  ¿Qué   tal? ") == "¿que tal?"
    assert assistant.saludo_personalizado({"rol": "vendedor", "nombre": "Ana"}, None).startswith("Hola, Ana!")
    assert "carrito" in assistant.saludo_personalizado(
        {"rol": "comprador"}, "/carrito"
    )
    assert assistant.respuesta_local("¿Cómo compro?", None, None)
    assert assistant.respuesta_local("¿Cómo gestiono inventario?", {"rol": "vendedor"}, None)
    assert assistant.es_saludo_predeterminado("Hola, soy Booky tu compañero lector")
    assert not assistant.es_saludo_predeterminado("Hola, necesito ayuda")

    history = [
        assistant.MensajeChat(rol="user", contenido=f" pregunta {index} ")
        for index in range(13)
    ]
    history.append(assistant.MensajeChat(rol="assistant", contenido="Bienvenido a BookyHome puedes explorar"))
    assert len(assistant.historial_para_modelo(history)) == 11
    assert assistant.historial_para_modelo(history)[0]["content"] == "pregunta 2"


def test_assistant_uses_local_fallback_and_validates_empty_message(monkeypatch):
    monkeypatch.setattr(assistant, "configuracion_ia", lambda: (None, None, None, "local"))
    assert asyncio.run(assistant.generar_respuesta_ia("hola"))

    with pytest.raises(HTTPException) as empty:
        asyncio.run(assistant.chat_asistente(assistant.ChatRequest(mensaje="   ")))
    assert empty.value.status_code == 400

    monkeypatch.setattr(assistant, "verify_token", lambda _token: {"rol": "comprador"})
    monkeypatch.setattr(assistant, "generar_respuesta_ia", AsyncMock(return_value="Respuesta"))
    response = asyncio.run(
        assistant.chat_asistente(
            assistant.ChatRequest(mensaje="consulta", pagina="/carrito"),
            assistant.HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
        )
    )
    assert response.respuesta == "Respuesta"
    assert response.proveedor == "local"


def test_assistant_retries_configured_model_then_uses_success(monkeypatch):
    monkeypatch.setattr(
        assistant, "configuracion_ia",
        lambda: ("secret", "primary", "https://example.test/v1", "openai"),
    )
    call = AsyncMock(side_effect=[None, "Respuesta del modelo"])
    monkeypatch.setattr(assistant, "_llamar_modelo", call)
    response = asyncio.run(
        assistant.generar_respuesta_ia(
            "consulta",
            contexto="contexto",
            historial=[assistant.MensajeChat(rol="user", contenido="antes")],
        )
    )
    assert response == "Respuesta del modelo"
    assert call.await_count == 2
    first_messages = call.await_args_list[0].args[3]
    assert first_messages[-1]["content"] == (
        "Informacion adicional disponible:\ncontexto\n\nMensaje actual del usuario: consulta"
    )


def test_connection_manager_supports_multiple_devices_and_cleans_failed_connections():
    manager = ConnectionManager()
    first, second = MagicMock(), MagicMock()
    first.accept = AsyncMock()
    second.accept = AsyncMock()
    first.send_json = AsyncMock()
    second.send_json = AsyncMock(side_effect=RuntimeError("closed"))

    async def exercise_connections():
        await manager.connect(9, first)
        await manager.connect(9, second)
        assert manager.esta_conectado(9)
        assert await manager.enviar_a_usuario(9, {"event": "new"}) is True
        await manager.disconnect(9, first)
        assert not manager.esta_conectado(9)
        assert await manager.enviar_a_usuario(9, {}) is False

    assert not manager.esta_conectado(9)
    asyncio.run(exercise_connections())
    first.send_json.assert_awaited_once_with({"event": "new"})
    assert not manager.conexiones_activas


def test_refunds_list_and_eligible_orders_use_authenticated_user(monkeypatch):
    db, cursor = MagicMock(), MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.side_effect = [[{"id_devolucion": 2}], [{"id_orden": 5}]]
    monkeypatch.setattr(refunds, "get_db", lambda: db)

    assert refunds.listar_devoluciones(12) == [{"id_devolucion": 2}]
    eligible = refunds.listar_pedidos_elegibles(12)
    assert eligible == [{"id_orden": 5}]
    assert cursor.execute.call_args.args[1][0] == 12
    assert len(cursor.execute.call_args.args[1]) == (
        1 + len(refunds.ESTADOS_ELEGIBLES) + 1 + len(refunds.ESTADOS_DEVOLUCION_ACTIVOS)
    )
    assert cursor.close.call_count == 2
    assert db.close.call_count == 2


def test_refunds_request_rejects_empty_or_ineligible_and_blocks_duplicates(monkeypatch):
    with pytest.raises(HTTPException) as empty:
        refunds.solicitar_devolucion(refunds.DevolucionCrear(id_orden=1, motivo="  "), 12)
    assert empty.value.status_code == 400

    db, cursor = MagicMock(), MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchone.return_value = None
    monkeypatch.setattr(refunds, "get_db", lambda: db)
    with pytest.raises(HTTPException) as ineligible:
        refunds.solicitar_devolucion(
            refunds.DevolucionCrear(id_orden=1, motivo="No llegó"), 12
        )
    assert ineligible.value.status_code == 400
    cursor.close.assert_called_once()

    cursor.fetchone.side_effect = [{"id_orden": 1}, {"id_devolucion": 9}]
    with pytest.raises(HTTPException) as duplicate:
        refunds.solicitar_devolucion(
            refunds.DevolucionCrear(id_orden=1, motivo="No llegó"), 12
        )
    assert duplicate.value.status_code == 400
    assert db.close.call_count == 2


def test_refunds_request_saves_trimmed_reason_and_comments(monkeypatch):
    db, cursor = MagicMock(), MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchone.side_effect = [
        {"id_orden": 1, "estado_orden": "Entregada", "total": 25},
        None,
        {"id_devolucion": 3, "motivo": "Daño — paquete abierto"},
    ]
    cursor.lastrowid = 3
    monkeypatch.setattr(refunds, "get_db", lambda: db)

    result = refunds.solicitar_devolucion(
        refunds.DevolucionCrear(
            id_orden=1, motivo=" Daño ", comentarios=" paquete abierto "
        ),
        12,
    )
    assert result["id_devolucion"] == 3
    assert cursor.execute.call_args_list[2].args[1] == (1, 12, "Daño — paquete abierto")
    db.commit.assert_called_once()
