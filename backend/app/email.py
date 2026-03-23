from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os
from pathlib import Path

# Ruta absoluta al .env
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