import asyncio

import app.email as email


class CapturingMail:
    def __init__(self):
        self.messages = []

    async def send_message(self, message):
        self.messages.append(message)


def test_email_urls_use_public_variables_and_remove_trailing_slashes(monkeypatch):
    monkeypatch.setenv("PUBLIC_API_URL", "https://api.example.test///")
    monkeypatch.setenv("API_PUBLIC_URL", "https://legacy.example.test")
    monkeypatch.setenv("FRONTEND_URL", "https://shop.example.test/")

    assert email.get_public_api_url() == "https://api.example.test"
    assert email.get_frontend_url() == "https://shop.example.test"

    monkeypatch.delenv("PUBLIC_API_URL")
    assert email.get_public_api_url() == "https://legacy.example.test"


def test_format_date_handles_iso_empty_and_invalid_values():
    assert email._format_date("2026-05-04T14:30:00") == "4 de mayo de 2026, 14:30"
    assert email._format_date("2026-05-04T14:30:00Z").startswith("4 de mayo de 2026")
    assert email._format_date("") == ""
    assert email._format_date("fecha inválidaT12:00") == "fecha inválida"


def test_recovery_and_registration_emails_build_branded_messages(monkeypatch):
    mail = CapturingMail()
    monkeypatch.setattr(email, "_get_fast_mail", lambda: mail)
    monkeypatch.setenv("FRONTEND_URL", "https://shop.example.test/")
    monkeypatch.setenv("PUBLIC_API_URL", "https://api.example.test/")

    asyncio.run(email.enviar_email_recuperacion("ana@example.com", "reset-token"))
    asyncio.run(email.enviar_email_confirmacion_registro("ana@example.com", "verify-token"))

    recovery, registration = mail.messages
    assert recovery.subject == "Recuperación de contraseña — BookyHome"
    assert [recipient.email for recipient in recovery.recipients] == ["ana@example.com"]
    assert "https://shop.example.test/reset-password?token=reset-token" in recovery.body
    assert "30 minutos" in recovery.body
    assert registration.subject == "Confirma tu correo electrónico — BookyHome"
    assert "https://api.example.test/verify-email?token=verify-token" in registration.body
    assert "24 horas" in registration.body
    assert recovery.subtype.value == registration.subtype.value == "html"


def test_order_confirmation_includes_line_totals_coupon_and_fallback_code(monkeypatch):
    mail = CapturingMail()
    monkeypatch.setattr(email, "_get_fast_mail", lambda: mail)
    monkeypatch.setenv("FRONTEND_URL", "https://shop.example.test")

    asyncio.run(email.enviar_email_confirmacion(
        "ana@example.com",
        {
            "id_orden": 42,
            "fecha": "2026-05-04T14:30:00",
            "metodo_pago": "PSE",
            "total": 60000,
            "total_con_descuento": 50000,
            "cupon_aplicado": "LECTURA10",
            "items": [
                {"titulo": "Libro de prueba", "autor_libro": "Autora", "cantidad": 2, "precio_libro": 30000},
                {"cantidad": 1, "precio_libro": 0},
            ],
        },
    ))

    message = mail.messages[0]
    assert message.subject == "Comprobante de Pago — Orden #42 · BookyHome"
    assert "BH-ORD42" in message.body
    assert "Libro de prueba" in message.body
    assert "Autora" in message.body
    assert "x2" in message.body
    assert "LECTURA10" in message.body
    assert "-$10.000 COP" in message.body
    assert "$50.000 COP" in message.body
    assert "https://shop.example.test/?seccion=Mis%20Compras" in message.body


def test_registration_thanks_email_is_sent_with_branded_content(monkeypatch):
    mail = CapturingMail()
    monkeypatch.setattr(email, "_get_fast_mail", lambda: mail)

    asyncio.run(email.enviar_email_agradecimiento_confirmacion("ana@example.com"))

    message = mail.messages[0]
    assert message.subject == "¡Correo confirmado! — BookyHome"
    assert [recipient.email for recipient in message.recipients] == ["ana@example.com"]
    assert "¡Correo confirmado exitosamente!" in message.body
    assert "Cuenta lista para usar" in message.body
