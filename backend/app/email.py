from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os
from pathlib import Path


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

    mensaje = MessageSchema(
        subject="Recuperación de contraseña — BookyHome",
        recipients=[email],
        body=f"""
        <html>
        <body style="font-family: Montserrat, sans-serif; padding: 2rem; color: #2A2A2A;">
            <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h2 style="color: #7A1E3A;">BookyHome</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p>Haz click en el botón para crear una nueva contraseña:</p>
                <a href="{enlace}" style="display: inline-block; background: #7A1E3A; color: white; padding: 0.85rem 2rem; border-radius: 6px; text-decoration: none; font-weight: 700; margin: 1rem 0;">
                    Restablecer contraseña
                </a>
                <p style="color: #888; font-size: 0.85rem;">Este enlace expira en 30 minutos. Si no solicitaste este cambio, ignora este email.</p>
            </div>
        </body>
        </html>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)


async def enviar_email_confirmacion_registro(email: str, token: str):
    # El enlace debe apuntar al backend (accesible desde el móvil), no al frontend local.
    enlace = f"{get_public_api_url()}/verify-email?token={token}"

    mensaje = MessageSchema(
        subject="Confirma tu correo electrónico — BookyHome",
        recipients=[email],
        body=f"""
        <html>
        <body style="font-family: Montserrat, sans-serif; padding: 2rem; color: #2A2A2A;">
            <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h2 style="color: #7A1E3A;">BookyHome</h2>
                <p>¡Gracias por registrarte en BookyHome!</p>
                <p>Para completar tu registro y evitar spam, por favor confirma tu correo electrónico haciendo clic en el botón:</p>
                <a href="{enlace}" style="display: inline-block; background: #7A1E3A; color: white; padding: 0.85rem 2rem; border-radius: 6px; text-decoration: none; font-weight: 700; margin: 1rem 0;">
                    Confirmar correo
                </a>
                <p style="color: #888; font-size: 0.85rem;">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este email.</p>
            </div>
        </body>
        </html>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)


async def enviar_email_confirmacion(email: str, orden: dict):
    items_html = "".join([
        f"""
        <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece8;">{item['titulo']}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece8; text-align:center;">{item['cantidad']}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece8; text-align:right; font-weight:700;">
                ${'{:,.0f}'.format(item['precio_libro'] * item['cantidad'])}
            </td>
        </tr>
        """
        for item in orden.get("items", [])
    ])

    mensaje = MessageSchema(
        subject=f"Confirmación de compra #{orden['id_orden']} — BookyHome",
        recipients=[email],
        body=f"""
        <html>
        <body style="font-family: Montserrat, sans-serif; padding: 2rem; color: #2A2A2A; background: #fdfbfa;">
            <div style="max-width: 540px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; border: 1px solid #e0dbd4;">
                <h2 style="color: #7A1E3A; margin: 0 0 4px;">BookyHome</h2>
                <p style="color: #888; font-size: 0.85rem; margin: 0 0 24px;">Tu librería de confianza</p>
                <h3 style="margin: 0 0 8px;">¡Compra confirmada! 🎉</h3>
                <p style="color: #555;">Gracias por tu compra. Aquí tienes el resumen de tu pedido:</p>
                <div style="background: #fcfaf7; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e0dbd4;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de la orden</p>
                    <p style="margin: 6px 0; font-size: 0.9rem;"><strong>ID Orden:</strong> #{orden['id_orden']}</p>
                    <p style="margin: 6px 0; font-size: 0.9rem;"><strong>Fecha:</strong> {orden.get('fecha', '')}</p>
                    <p style="margin: 6px 0; font-size: 0.9rem;"><strong>Método de pago:</strong> {orden.get('metodo_pago', 'Confirmado digitalmente')}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 16px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e0dbd4;">
                            <th style="padding: 8px 0; text-align:left;">Libro</th>
                            <th style="padding: 8px 0; text-align:center;">Cant.</th>
                            <th style="padding: 8px 0; text-align:right;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                <div style="border-top: 2px solid #e0dbd4; padding-top: 12px; font-size: 0.95rem;">
                    {f'''
                    <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                        <span style="color: #666;">Subtotal</span>
                        <span>${'{:,.0f}'.format(orden['total'])} COP</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 12px; background: #f0faf0; padding: 6px 10px; border-radius: 6px; border: 1px solid #c8e6c9;">
                        <span style="color: #2e7d32;">🏷️ Cupón {orden['cupon_aplicado']}</span>
                        <span style="color: #2e7d32; font-weight:700;">-${'{:,.0f}'.format(orden['total'] - orden['total_con_descuento'])} COP</span>
                    </div>
                    ''' if orden.get('cupon_aplicado') and orden.get('total_con_descuento') is not None else ''}
                    <div style="display:flex; justify-content:space-between; font-size: 1.15rem; font-weight: 800;">
                        <span>Total pagado</span>
                        <span style="color: #C5425A;">${'{:,.0f}'.format(orden.get('total_con_descuento', orden['total']))} COP</span>
                    </div>
                </div>
                <p style="color: #888; font-size: 0.8rem; margin-top: 24px; border-top: 1px solid #f0ece8; padding-top: 16px;">
                    Si tienes alguna duda sobre tu pedido, contáctanos. Este correo es generado automáticamente, por favor no respondas a este mensaje.
                </p>
            </div>
        </body>
        </html>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)


async def enviar_email_agradecimiento_confirmacion(email: str):
    login_url = f"{get_frontend_url()}/login"

    mensaje = MessageSchema(
        subject="¡Correo confirmado! — BookyHome",
        recipients=[email],
        body=f"""
        <html>
        <body style="font-family: Montserrat, sans-serif; padding: 2rem; color: #2A2A2A;">
            <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h2 style="color: #7A1E3A;">BookyHome</h2>
                <h3 style="margin: 0 0 8px;">¡Gracias por confirmar tu correo! 🎉</h3>
                <p>Tu cuenta ha sido verificada exitosamente. Ahora puedes iniciar sesión y comenzar a disfrutar de BookyHome.</p>
                <a href="{login_url}" style="display: inline-block; background: #7A1E3A; color: white; padding: 0.85rem 2rem; border-radius: 6px; text-decoration: none; font-weight: 700; margin: 1rem 0;">
                    Iniciar sesión
                </a>
                <p style="color: #888; font-size: 0.85rem; margin-top: 24px;">
                    Si tienes alguna pregunta, no dudes en contactarnos. Este correo es generado automáticamente, por favor no respondas a este mensaje.
                </p>
            </div>
        </body>
        </html>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)