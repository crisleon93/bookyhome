from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)


async def enviar_email_recuperacion(email: str, token: str):
    enlace = f"http://localhost:5173/reset-password?token={token}"

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
                <div style="display:flex; justify-content:space-between; font-size: 1.1rem; font-weight: 800; padding-top: 12px; border-top: 2px solid #e0dbd4;">
                    <span>Total pagado</span>
                    <span style="color: #C5425A;">${'{:,.0f}'.format(orden['total'])} COP</span>
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