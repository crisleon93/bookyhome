from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi_mail.schemas import MultipartSubtypeEnum
from dotenv import load_dotenv
import os
from pathlib import Path


# Paleta BookyHome — los 5 colores de frontend/src/index.css
BRAND = {
    "vinotinto": "#7A1E3A",
    "rojo_suave": "#C5425A",
    "beige": "#F9FAFB",
    "gris_carbon": "#2A2A2A",
    "blanco": "#FFFFFF",
    "borde": "#E5E7EB",
}

_EMAIL_STATIC_DIR = Path(__file__).resolve().parent / "static" / "email"
_LOGO_CID = "bookyhome-logo"


def _logo_path() -> Path:
    optimized = _EMAIL_STATIC_DIR / "logo-email.png"
    if optimized.exists():
        return optimized
    return _EMAIL_STATIC_DIR / "logo.png"


def _logo_attachments() -> list:
    """Adjunto inline (CID): el logo viaja con el correo, sin base64 ni URL externa."""
    return [{
        "file": str(_logo_path()),
        "headers": {
            "Content-ID": f"<{_LOGO_CID}>",
            "Content-Disposition": "inline; filename=logo-email.png",
        },
        "mime_type": "image",
        "mime_subtype": "png",
    }]


def _email_header_html() -> str:
    """Logo desde assets (CID inline) + tagline. Se remueve el fondo negro del contenedor."""
    return f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 12px;">
            <tr>
                <td align="center">
                    <img src="cid:{_LOGO_CID}" alt="BookyHome" width="140"
                         style="display: block; max-width: 140px; width: 140px; height: auto; border: 0;" />
                    <p style="margin: 4px 0 0; font-size: 12px; font-weight: 600; color: {BRAND['vinotinto']}; letter-spacing: 0.05em; text-transform: uppercase;">
                        Tu librería de confianza
                    </p>
                </td>
            </tr>
        </table>
    """


def _email_hero_html(emoji: str, title: str, *, gradient: bool = False) -> str:
    background = (
        f"linear-gradient(135deg, {BRAND['vinotinto']} 0%, {BRAND['rojo_suave']} 100%)"
        if gradient
        else BRAND["vinotinto"]
    )
    return f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 12px;">
            <tr>
                <td align="center" style="background: {background}; border-radius: 8px; padding: 16px 12px; box-shadow: 0 2px 4px rgba(122, 30, 58, 0.15);">
                    <div style="font-size: 24px; line-height: 1; margin: 0 0 4px;">{emoji}</div>
                    <h1 style="margin: 0; color: {BRAND['blanco']}; font-size: 18px; font-weight: 800; line-height: 1.3; letter-spacing: -0.01em;">
                        {title}
                    </h1>
                </td>
            </tr>
        </table>
    """


def _email_info_box_html(title: str, body: str, accent: str) -> str:
    return f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 8px;">
            <tr>
                <td style="background: {BRAND['blanco']}; border: 1px solid {BRAND['borde']}; border-left: 4px solid {accent}; border-radius: 6px; padding: 12px 14px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                    {f'<p style="margin: 0 0 4px; color: {accent}; font-size: 13px; font-weight: 700;">{title}</p>' if title else ''}
                    <div style="color: {BRAND['gris_carbon']}; font-size: 13px; line-height: 1.4;">{body}</div>
                </td>
            </tr>
        </table>
    """


def _email_button_html(label: str, href: str) -> str:
    return f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0;">
            <tr>
                <td align="center">
                    <a href="{href}" style="display: inline-block; background: {BRAND['vinotinto']}; color: {BRAND['blanco']}; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid {BRAND['vinotinto']}; box-shadow: 0 2px 4px rgba(122, 30, 58, 0.2);">
                        {label}
                    </a>
                </td>
            </tr>
        </table>
    """


def _email_badge_html(label: str) -> str:
    return f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 8px;">
            <tr>
                <td align="center">
                    <span style="display: inline-block; background: {BRAND['blanco']}; color: {BRAND['vinotinto']}; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; border: 1px solid {BRAND['vinotinto']}; box-shadow: 0 2px 4px rgba(122, 30, 58, 0.1);">
                        {label}
                    </span>
                </td>
            </tr>
        </table>
    """


def _email_footer_html() -> str:
    return f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
            <tr>
                <td style="border-top: 1px solid {BRAND['borde']}; padding-top: 12px; text-align: center;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.4;">
                        ¿Tienes preguntas? Estamos aquí para ayudarte en<br>
                        <a href="mailto:soporte@bookyhome.com" style="color: {BRAND['vinotinto']}; text-decoration: none; font-weight: 600;">
                            soporte@bookyhome.com
                        </a>
                    </p>
                    <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 10px;">
                        Este correo es generado automáticamente, por favor no respondas a este mensaje.
                    </p>
                </td>
            </tr>
        </table>
    """


def _email_card_html(content: str) -> str:
    return f"""
        <html>
        <body style="margin: 0; padding: 0; background: {BRAND['beige']}; font-family: 'Inter', Helvetica, Arial, sans-serif; color: {BRAND['gris_carbon']};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: {BRAND['beige']}; padding: 16px 0;">
                <tr>
                    <td align="center" style="padding: 0 8px;">
                        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background: {BRAND['blanco']}; border-radius: 12px; border: 1px solid {BRAND['borde']}; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                            <tr>
                                <td style="padding: 20px 16px;">
                                    {content}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    """


def _build_branded_message(*, subject: str, recipients: list, html_content: str) -> MessageSchema:
    return MessageSchema(
        subject=subject,
        recipients=recipients,
        body=_email_card_html(html_content),
        attachments=_logo_attachments(),
        multipart_subtype=MultipartSubtypeEnum.related,
        subtype="html",
    )


def _load_env_file() -> None:
    candidates = [
        Path(__file__).resolve().parents[1] / ".env",
        Path.cwd() / ".env",
        Path(__file__).resolve().parent / ".env",
    ]

    for path in candidates:
        if path.exists():
            load_dotenv(dotenv_path=path, override=False)
            break


_load_env_file()


def is_smtp_configured() -> bool:
    return all([
        os.getenv("MAIL_USERNAME"),
        os.getenv("MAIL_PASSWORD"),
        os.getenv("MAIL_FROM"),
        os.getenv("MAIL_SERVER"),
    ])


def get_public_api_url() -> str:
    """URL del backend accesible desde dispositivos móviles (no usar localhost)."""
    return os.getenv(
        "PUBLIC_API_URL",
        os.getenv("API_PUBLIC_URL", "http://localhost:8000"),
    ).rstrip("/")


def get_frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


mail_starttls = os.getenv("MAIL_STARTTLS", "true").strip().lower() in {"1", "true", "yes", "on"}
mail_ssl_tls = os.getenv("MAIL_SSL_TLS", "false").strip().lower() in {"1", "true", "yes", "on"}

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_STARTTLS=mail_starttls,
    MAIL_SSL_TLS=mail_ssl_tls,
    USE_CREDENTIALS=True
)


async def enviar_email_recuperacion(email: str, token: str):
    frontend_url = get_frontend_url()
    enlace = f"{frontend_url}/reset-password?token={token}"

    content = f"""
        {_email_header_html()}
        {_email_hero_html("🔑", "Recuperación de contraseña", gradient=True)}
        <p style="font-size: 1rem; line-height: 1.65; margin: 0 0 1rem; color: {BRAND['gris_carbon']};">
            Recibimos una solicitud para restablecer tu contraseña en BookyHome.
        </p>
        <p style="font-size: 0.95rem; line-height: 1.65; margin: 0 0 0.5rem; color: {BRAND['gris_carbon']}; opacity: 0.85;">
            Haz clic en el botón para crear una nueva contraseña:
        </p>
        {_email_button_html("Restablecer contraseña", enlace)}
        {_email_info_box_html(
            "⏰ Importante",
            "Este enlace expira en 30 minutos. Si no solicitaste este cambio, ignora este email.",
            BRAND["rojo_suave"],
        )}
        {_email_footer_html()}
    """

    mensaje = _build_branded_message(
        subject="Recuperación de contraseña — BookyHome",
        recipients=[email],
        html_content=content,
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)


async def enviar_email_confirmacion_registro(email: str, token: str):
    enlace = f"{get_public_api_url()}/verify-email?token={token}"

    content = f"""
        {_email_header_html()}
        {_email_hero_html("👋", "¡Bienvenido a BookyHome!", gradient=True)}
        <p style="font-size: 13.5px; line-height: 1.4; margin: 0 0 8px; color: {BRAND['gris_carbon']};">
            ¡Gracias por registrarte! Estás a un paso de acceder a miles de libros y comenzar tu viaje literario con nosotros.
        </p>
        <p style="font-size: 13.5px; line-height: 1.4; margin: 0; color: {BRAND['gris_carbon']};">
            Para completar tu registro y garantizar la seguridad de tu cuenta, confirma tu correo electrónico:
        </p>
        {_email_button_html("Confirmar mi correo", enlace)}
        {_email_info_box_html(
            "⏳ Importante",
            "Este enlace expira en 24 horas. Si no creaste esta cuenta, simplemente ignora este email.",
            BRAND["vinotinto"],
        )}
        {_email_info_box_html(
            "🔒 Seguridad",
            "Al hacer clic en el enlace, se abrirá brevemente una pestaña nueva que se cerrará sola. Es normal y necesario por seguridad.",
            BRAND["rojo_suave"],
        )}
        {_email_footer_html()}
    """

    mensaje = _build_branded_message(
        subject="Confirma tu correo electrónico — BookyHome",
        recipients=[email],
        html_content=content,
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)


async def enviar_email_confirmacion(email: str, orden: dict):
    items_html = "".join([
        f"""
        <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid {BRAND['beige']}; color: {BRAND['gris_carbon']};">{item['titulo']}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid {BRAND['beige']}; text-align:center; color: {BRAND['gris_carbon']};">{item['cantidad']}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid {BRAND['beige']}; text-align:right; font-weight:700; color: {BRAND['vinotinto']};">
                ${'{:,.0f}'.format(item['precio_libro'] * item['cantidad'])}
            </td>
        </tr>
        """
        for item in orden.get("items", [])
    ])

    coupon_html = ""
    if orden.get("cupon_aplicado") and orden.get("total_con_descuento") is not None:
        coupon_html = f"""
            <div style="display:flex; justify-content:space-between; margin-bottom: 12px; background: {BRAND['beige']}; padding: 6px 10px; border-radius: 6px; border-left: 3px solid {BRAND['rojo_suave']};">
                <span style="color: {BRAND['vinotinto']};">Cupón {orden['cupon_aplicado']}</span>
                <span style="color: {BRAND['rojo_suave']}; font-weight:700;">-${'{:,.0f}'.format(orden['total'] - orden['total_con_descuento'])} COP</span>
            </div>
        """

    content = f"""
        {_email_header_html()}
        {_email_hero_html("🎉", f"¡Compra confirmada! #{orden['id_orden']}", gradient=True)}
        <p style="font-size: 0.95rem; line-height: 1.65; margin: 0 0 1.25rem; color: {BRAND['gris_carbon']};">
            Gracias por tu compra. Aquí tienes el resumen de tu pedido:
        </p>
        <div style="background: {BRAND['beige']}; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem; border-left: 4px solid {BRAND['vinotinto']};">
            <p style="margin: 0 0 0.35rem; font-size: 0.72rem; color: {BRAND['rojo_suave']}; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Detalles de la orden</p>
            <p style="margin: 5px 0; font-size: 0.9rem; color: {BRAND['gris_carbon']};"><strong>ID Orden:</strong> #{orden['id_orden']}</p>
            <p style="margin: 5px 0; font-size: 0.9rem; color: {BRAND['gris_carbon']};"><strong>Fecha:</strong> {orden.get('fecha', '')}</p>
            <p style="margin: 5px 0; font-size: 0.9rem; color: {BRAND['gris_carbon']};"><strong>Método de pago:</strong> {orden.get('metodo_pago', 'Confirmado digitalmente')}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 1rem;">
            <thead>
                <tr style="border-bottom: 2px solid {BRAND['rojo_suave']};">
                    <th style="padding: 8px 0; text-align:left; color: {BRAND['vinotinto']};">Libro</th>
                    <th style="padding: 8px 0; text-align:center; color: {BRAND['vinotinto']};">Cant.</th>
                    <th style="padding: 8px 0; text-align:right; color: {BRAND['vinotinto']};">Precio</th>
                </tr>
            </thead>
            <tbody>{items_html}</tbody>
        </table>
        <div style="border-top: 2px solid {BRAND['beige']}; padding-top: 0.75rem; font-size: 0.95rem; color: {BRAND['gris_carbon']};">
            <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                <span>Subtotal</span>
                <span>${'{:,.0f}'.format(orden['total'])} COP</span>
            </div>
            {coupon_html}
            <div style="display:flex; justify-content:space-between; font-size: 1.1rem; font-weight: 800; color: {BRAND['gris_carbon']};">
                <span>Total pagado</span>
                <span style="color: {BRAND['rojo_suave']};">${'{:,.0f}'.format(orden.get('total_con_descuento', orden['total']))} COP</span>
            </div>
        </div>
        {_email_footer_html()}
    """

    mensaje = _build_branded_message(
        subject=f"Confirmación de compra #{orden['id_orden']} — BookyHome",
        recipients=[email],
        html_content=content,
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)


async def enviar_email_agradecimiento_confirmacion(email: str):
    actions_html = """
        <ul style="margin: 0; padding-left: 16px; line-height: 1.4; font-size: 13px;">
            <li style="margin-bottom: 4px;">Iniciar sesión en tu cuenta de BookyHome</li>
            <li style="margin-bottom: 4px;">Explorar nuestro catálogo de miles de libros</li>
            <li style="margin-bottom: 4px;">Crear tu lista de deseos y favoritos</li>
            <li>Comenzar a comprar los libros que amas</li>
        </ul>
    """

    content = f"""
        {_email_header_html()}
        {_email_hero_html("✅", "¡Correo confirmado exitosamente!", gradient=True)}
        <p style="font-size: 13.5px; line-height: 1.4; margin: 0 0 12px; color: {BRAND['gris_carbon']}; text-align: center; font-weight: 500;">
            ¡Excelente! Tu cuenta ha sido verificada correctamente y ya está lista para usar.
        </p>
        {_email_info_box_html(
            "🚀 ¿Qué puedes hacer ahora?",
            actions_html,
            BRAND["vinotinto"],
        )}
        {_email_info_box_html(
            "💡 Siguiente paso",
            "Regresa a la pestaña del navegador donde dejaste el registro abierto. El modal de inicio de sesión se abrirá automáticamente para que puedas acceder.",
            BRAND["rojo_suave"],
        )}
        {_email_badge_html("✨ Cuenta lista para usar")}
        {_email_footer_html()}
    """

    mensaje = _build_branded_message(
        subject="¡Correo confirmado! — BookyHome",
        recipients=[email],
        html_content=content,
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)
