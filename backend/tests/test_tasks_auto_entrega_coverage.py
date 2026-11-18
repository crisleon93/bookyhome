import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import app.tasks.auto_entrega as mod


def _db_cursor():
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    return db, cursor


def _order(id_orden=12):
    return {
        "id_orden": id_orden,
        "id_comprador": 3,
        "id_vendedor": 8,
        "nombre_tienda": "Librería Uno",
        "dias_transcurridos": 15,
    }


def _email_setup():
    from app import email

    return [
        patch.object(email, "is_smtp_configured", return_value=False),
        patch.object(email, "get_frontend_url", return_value="https://bookyhome.test"),
    ]


def test_job_sin_ordenes_cierra_recursos_y_no_envia_notificaciones():
    db, cursor = _db_cursor()
    cursor.fetchall.return_value = []
    email_patches = _email_setup()

    with patch("app.database.get_db", return_value=db), \
         email_patches[0], email_patches[1]:
        assert mod.ejecutar_auto_confirmacion() is None

    cursor.close.assert_called_once()
    db.close.assert_called_once()
    db.commit.assert_not_called()


def test_job_marca_ordenes_y_envia_correos_a_comprador_y_vendedor():
    from app import email

    db, cursor = _db_cursor()
    cursor.fetchall.side_effect = [
        [_order()],
        [{"id_usuario": 3, "correo_usuario": "comprador@test", "nombre_usuario": "Ana"}],
    ]
    cursor.fetchone.side_effect = [
        {"correo_usuario": "comprador@test", "nombre_usuario": "Ana"},
        {"correo_usuario": "vendedor@test", "nombre_usuario": "Luis"},
    ]
    mailer = MagicMock()
    mailer.send_message = AsyncMock()
    build_message = MagicMock(side_effect=lambda **message: message)

    def consume_coroutine(coroutine):
        coroutine.close()

    patches = [
        patch("app.database.get_db", return_value=db),
        patch.object(email, "is_smtp_configured", return_value=True),
        patch.object(email, "get_frontend_url", return_value="https://bookyhome.test"),
        patch.object(email, "FastMail", return_value=mailer),
        patch.object(email, "_build_branded_message", new=build_message),
        patch.object(email, "_email_header_html", return_value="<header />"),
        patch.object(email, "_email_hero_html", return_value="<hero />"),
        patch.object(email, "_email_info_box_html", return_value="<info />"),
        patch.object(email, "_email_button_html", return_value="<button />"),
        patch.object(email, "_email_footer_html", return_value="<footer />"),
        patch.object(mod, "_enviar_correo_sync", side_effect=consume_coroutine),
    ]
    with patches[0], patches[1], patches[2], patches[3], patches[4], patches[5], \
         patches[6], patches[7], patches[8], patches[9], patches[10]:
        mod.ejecutar_auto_confirmacion()

    db.commit.assert_called_once()
    assert cursor.execute.call_count == 8
    assert mailer.send_message.call_count == 2
    assert build_message.call_count == 2
    assert build_message.call_args_list[0].kwargs["recipients"] == ["comprador@test"]
    assert build_message.call_args_list[1].kwargs["recipients"] == ["vendedor@test"]


def test_job_aisla_error_por_orden_y_continua_procesando():
    db, cursor = _db_cursor()
    cursor.fetchall.side_effect = [
        [_order(12), _order(13)],
        [],
    ]
    cursor.fetchone.side_effect = [
        {"correo_usuario": None},
        {"correo_usuario": None},
    ]
    execute = cursor.execute

    def execute_with_first_order_failure(query, params=None):
        if "UPDATE ordenes_compra" in query and params == (12,):
            raise RuntimeError("update failed")
        return None

    execute.side_effect = execute_with_first_order_failure
    email_patches = _email_setup()
    with patch("app.database.get_db", return_value=db), \
         email_patches[0], email_patches[1]:
        mod.ejecutar_auto_confirmacion()

    db.rollback.assert_called_once()
    db.commit.assert_called_once()
    assert cursor.execute.call_count > 8


def test_enviar_correo_funciona_con_loop_sincrono_o_loop_activo():
    loop = asyncio.new_event_loop()
    try:
        with patch.object(mod.asyncio, "get_event_loop", return_value=loop):
            mod._enviar_correo_sync(asyncio.sleep(0))

        running_loop = MagicMock()
        running_loop.is_running.return_value = True
        with patch.object(mod.asyncio, "get_event_loop", return_value=running_loop):
            mod._enviar_correo_sync(asyncio.sleep(0))
    finally:
        loop.close()


def test_enviar_correo_avisa_si_no_puede_obtener_el_loop(caplog):
    coroutine = asyncio.sleep(0)
    with patch.object(mod.asyncio, "get_event_loop", side_effect=RuntimeError("no event loop")):
        mod._enviar_correo_sync(coroutine)
    coroutine.close()

    assert "No se pudo enviar correo: no event loop" in caplog.text


def test_job_registra_error_general_y_cierra_recursos():
    db, cursor = _db_cursor()
    cursor.fetchall.side_effect = RuntimeError("select failed")
    email_patches = _email_setup()
    with patch("app.database.get_db", return_value=db), \
         email_patches[0], email_patches[1]:
        assert mod.ejecutar_auto_confirmacion() is None

    cursor.close.assert_called_once()
    db.close.assert_called_once()
