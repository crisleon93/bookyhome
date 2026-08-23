from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi_mail.schemas import MultipartSubtypeEnum
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime


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


def _format_date(iso_str: str) -> str:
    if not iso_str:
        return ""
    try:
        clean_str = str(iso_str).replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_str)
        meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        return f"{dt.day} de {meses[dt.month - 1]} de {dt.year}, {dt.strftime('%H:%M')}"
    except Exception:
        return str(iso_str).split("T")[0]


async def enviar_email_confirmacion(email: str, orden: dict):
    fecha_formateada = _format_date(orden.get("fecha", ""))
    codigo_compra = orden.get("codigo_compra") or f"BH-ORD{orden.get('id_orden', '')}"
    metodo_pago = orden.get("metodo_pago", "Pago digital verificado")
    
    items = orden.get("items", [])
    items_rows = []
    for item in items:
        titulo = item.get("titulo", "Libro")
        autor = item.get("autor_libro", "")
        autor_html = f'<div style="font-size: 11.5px; color: #6B7280; margin-top: 2px;">{autor}</div>' if autor else ''
        cant = item.get("cantidad", 1)
        subt = item.get("precio_libro", 0) * cant
        
        items_rows.append(f"""
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; vertical-align: middle;">
                    <div style="font-weight: 600; color: {BRAND['gris_carbon']}; font-size: 13.5px;">{titulo}</div>
                    {autor_html}
                </td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #F3F4F6; text-align: center; color: #4B5563; font-size: 13px; vertical-align: middle;">
                    x{cant}
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; text-align: right; font-weight: 700; color: {BRAND['vinotinto']}; font-size: 13.5px; vertical-align: middle;">
                    ${'{:,.0f}'.format(subt).replace(',', '.')} COP
                </td>
            </tr>
        """)
    items_html = "".join(items_rows)

    coupon_html = ""
    if orden.get("cupon_aplicado") and orden.get("total_con_descuento") is not None:
        desc_val = orden['total'] - orden['total_con_descuento']
        coupon_html = f"""
            <tr>
                <td style="padding: 6px 0; color: #059669; font-size: 13px;">
                    🏷️ Cupón <strong>{orden['cupon_aplicado']}</strong>
                </td>
                <td style="padding: 6px 0; text-align: right; color: #059669; font-weight: 700; font-size: 13px;">
                    -${'{:,.0f}'.format(desc_val).replace(',', '.')} COP
                </td>
            </tr>
        """

    total_final = orden.get("total_con_descuento", orden.get("total", 0))
    frontend_url = get_frontend_url()
    enlace_compras = f"{frontend_url}/?seccion=Mis%20Compras"

    content = f"""
        {_email_header_html()}
        {_email_hero_html("🧾", "Comprobante de Pago", gradient=True)}
        
        <p style="font-size: 13.5px; line-height: 1.5; margin: 0 0 14px; color: {BRAND['gris_carbon']}; text-align: center;">
            Este correo certifica el pago exitoso de tu orden en <strong>BookyHome</strong>. Guarda este comprobante para tu control y seguimiento.
        </p>

        <!-- Tarjeta de Metadatos del Comprobante -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border-radius: 8px; border: 1px solid #EADBCE; margin-bottom: 16px;">
            <tr>
                <td style="padding: 14px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding-bottom: 8px; font-size: 12px; color: #6B7280; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;" colspan="2">
                                Resumen de Transacción
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #4B5563;"><strong>N° de Orden:</strong></td>
                            <td style="padding: 4px 0; font-size: 13px; color: {BRAND['vinotinto']}; font-weight: 700; text-align: right;">#{orden.get('id_orden')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #4B5563;"><strong>Código de compra:</strong></td>
                            <td style="padding: 4px 0; font-size: 13px; color: #1F2937; font-weight: 600; text-align: right; font-family: monospace;">{codigo_compra}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #4B5563;"><strong>Fecha y hora:</strong></td>
                            <td style="padding: 4px 0; font-size: 13px; color: #1F2937; text-align: right;">{fecha_formateada}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #4B5563;"><strong>Método de pago:</strong></td>
                            <td style="padding: 4px 0; font-size: 13px; color: #1F2937; text-align: right;">{metodo_pago}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #4B5563;"><strong>Estado del pago:</strong></td>
                            <td style="padding: 4px 0; text-align: right;">
                                <span style="display: inline-block; background: #D1FAE5; color: #065F46; font-size: 11.5px; font-weight: 700; padding: 2px 8px; border-radius: 12px; border: 1px solid #6EE7B7;">
                                    ✓ Aprobado / Pagado
                                </span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Tabla de Productos -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
            <thead>
                <tr style="border-bottom: 2px solid {BRAND['vinotinto']};">
                    <th style="padding: 8px 0; text-align: left; color: {BRAND['vinotinto']}; font-size: 12.5px; font-weight: 700; text-transform: uppercase;">Detalle del Libro</th>
                    <th style="padding: 8px 8px; text-align: center; color: {BRAND['vinotinto']}; font-size: 12.5px; font-weight: 700; text-transform: uppercase;">Cant.</th>
                    <th style="padding: 8px 0; text-align: right; color: {BRAND['vinotinto']}; font-size: 12.5px; font-weight: 700; text-transform: uppercase;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>

        <!-- Totales -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px; margin-bottom: 16px;">
            <tr>
                <td style="padding: 6px 0; color: #6B7280; font-size: 13px;">Subtotal productos:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">
                    ${'{:,.0f}'.format(orden.get('total', 0)).replace(',', '.')} COP
                </td>
            </tr>
            {coupon_html}
            <tr style="border-top: 1.5px solid #E5E7EB;">
                <td style="padding: 12px 0 4px; font-size: 15px; font-weight: 800; color: {BRAND['gris_carbon']};">
                    Total Pagado:
                </td>
                <td style="padding: 12px 0 4px; text-align: right; font-size: 17px; font-weight: 800; color: {BRAND['rojo_suave']};">
                    ${'{:,.0f}'.format(total_final).replace(',', '.')} COP
                </td>
            </tr>
        </table>

        {_email_button_html("Ver mis compras y seguimiento", enlace_compras)}

        {_email_footer_html()}
    """

    mensaje = _build_branded_message(
        subject=f"Comprobante de Pago — Orden #{orden['id_orden']} · BookyHome",
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
