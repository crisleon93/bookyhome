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
    enlace = f"{get_public_api_url()}/verify-email?token={token}"

    mensaje = MessageSchema(
        subject="Confirma tu correo electrónico — BookyHome",
        recipients=[email],
        body=f"""
        <html>
        <head>
            <style>
                @media (prefers-color-scheme: dark) {{
                    .logo-light {{ display: none !important; }}
                    .logo-dark {{ display: block !important; }}
                }}
                @media (prefers-color-scheme: light) {{
                    .logo-light {{ display: block !important; }}
                    .logo-dark {{ display: none !important; }}
                }}
            </style>
        </head>
        <body style="font-family: Montserrat, sans-serif; padding: 2rem; color: #2A2A2A; background: #F4EDE2;">
            <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 2.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <!-- Logo para tema claro (vinotinto) -->
                    <div class="logo-light" style="margin-bottom: 1rem;">
                        <div style="background: linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%); color: white; padding: 1rem 2rem; border-radius: 12px; display: inline-block;">
                            <h2 style="color: white; margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px;">📚 BookyHome</h2>
                        </div>
                    </div>
                    <!-- Logo para tema oscuro (blanco) -->
                    <div class="logo-dark" style="margin-bottom: 1rem;">
                        <div style="background: linear-gradient(135deg, #2A2A2A 0%, #4a4a4a 100%); color: white; padding: 1rem 2rem; border-radius: 12px; display: inline-block;">
                            <h2 style="color: white; margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px;">📚 BookyHome</h2>
                        </div>
                    </div>
                    <p style="color: #888; margin: 0.5rem 0 0; font-size: 0.9rem;">Tu librería de confianza</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: center;">
                    <div style="color: white; font-size: 3rem; margin-bottom: 0.5rem;">📧</div>
                    <h3 style="color: white; margin: 0; font-size: 1.3rem;">¡Bienvenido a BookyHome!</h3>
                </div>
                
                <p style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.5rem;">
                    ¡Gracias por registrarte! Estás a un paso de acceder a miles de libros y comenzar tu viaje literario con nosotros.
                </p>
                
                <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; color: #555;">
                    Para completar tu registro y garantizar la seguridad de tu cuenta, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:
                </p>
                
                <div style="text-align: center; margin: 2rem 0;">
                    <a href="{enlace}" style="display: inline-block; background: linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%); color: white; padding: 1rem 2.5rem; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(122, 30, 58, 0.3);">
                        ✅ Confirmar mi correo electrónico
                    </a>
                </div>
                
                <div style="background: #F4EDE2; border-left: 4px solid #7A1E3A; padding: 1rem; margin: 2rem 0; border-radius: 6px;">
                    <p style="margin: 0; font-size: 0.9rem; color: #666;">
                        <strong>⏰ Importante:</strong> Este enlace expira en 24 horas. Si no creaste esta cuenta, simplemente ignora este email.
                    </p>
                </div>
                
                <div style="background: #F4EDE2; border-left: 4px solid #C5425A; padding: 1rem; margin: 2rem 0; border-radius: 6px;">
                    <p style="margin: 0; font-size: 0.9rem; color: #666;">
                        <strong>💡 Nota:</strong> Al hacer clic en el enlace de confirmación, se abrirá brevemente una pestaña nueva que se cerrará automáticamente. Esto es normal y necesario por seguridad.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 0.85rem; margin: 0;">
                        ¿Tienes problemas? Contáctanos en <a href="mailto:soporte@bookyhome.com" style="color: #7A1E3A; text-decoration: none;">soporte@bookyhome.com</a>
                    </p>
                    <p style="color: #aaa; font-size: 0.8rem; margin: 0.5rem 0 0;">
                        Este correo es generado automáticamente, por favor no respondas a este mensaje.
                    </p>
                </div>
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
    mensaje = MessageSchema(
        subject="¡Correo confirmado! — BookyHome",
        recipients=[email],
        body=f"""
        <html>
        <head>
            <style>
                @media (prefers-color-scheme: dark) {{
                    .logo-light {{ display: none !important; }}
                    .logo-dark {{ display: block !important; }}
                }}
                @media (prefers-color-scheme: light) {{
                    .logo-light {{ display: block !important; }}
                    .logo-dark {{ display: none !important; }}
                }}
            </style>
        </head>
        <body style="font-family: Montserrat, sans-serif; padding: 2rem; color: #2A2A2A; background: #F4EDE2;">
            <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 2.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <!-- Logo para tema claro (vinotinto) -->
                    <div class="logo-light" style="margin-bottom: 1rem;">
                        <div style="background: linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%); color: white; padding: 1rem 2rem; border-radius: 12px; display: inline-block;">
                            <h2 style="color: white; margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px;">📚 BookyHome</h2>
                        </div>
                    </div>
                    <!-- Logo para tema oscuro (blanco) -->
                    <div class="logo-dark" style="margin-bottom: 1rem;">
                        <div style="background: linear-gradient(135deg, #2A2A2A 0%, #4a4a4a 100%); color: white; padding: 1rem 2rem; border-radius: 12px; display: inline-block;">
                            <h2 style="color: white; margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px;">📚 BookyHome</h2>
                        </div>
                    </div>
                    <p style="color: #888; margin: 0.5rem 0 0; font-size: 0.9rem;">Tu librería de confianza</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #15803d 0%, #22c55e 100%); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: center;">
                    <div style="color: white; font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
                    <h3 style="color: white; margin: 0; font-size: 1.3rem;">¡Correo confirmado exitosamente!</h3>
                </div>
                
                <p style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.5rem;">
                    ¡Excelente! Tu cuenta ha sido verificada correctamente y ya está lista para usar.
                </p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #15803d; padding: 1.5rem; margin: 2rem 0; border-radius: 8px;">
                    <h4 style="color: #15803d; margin: 0 0 0.5rem; font-size: 1.1rem;">🚀 ¿Qué puedes hacer ahora?</h4>
                    <ul style="margin: 0; padding-left: 1.5rem; color: #555; font-size: 0.95rem; line-height: 1.8;">
                        <li>Iniciar sesión en tu cuenta de BookyHome</li>
                        <li>Explorar nuestro catálogo de miles de libros</li>
                        <li>Crear tu lista de deseos y favoritos</li>
                        <li>Comenzar a comprar los libros que amas</li>
                    </ul>
                </div>
                
                <div style="background: #F4EDE2; border-left: 4px solid #7A1E3A; padding: 1rem; margin: 2rem 0; border-radius: 6px;">
                    <p style="margin: 0; font-size: 0.9rem; color: #666;">
                        <strong>💡 Siguiente paso:</strong> Regresa a la pestaña original del navegador donde dejaste el registro abierto. El modal de inicio de sesión se abrirá automáticamente para que puedas acceder a tu cuenta.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 2rem 0;">
                    <div style="display: inline-block; background: #f0fdf4; color: #15803d; padding: 0.8rem 2rem; border-radius: 8px; font-weight: 700; font-size: 1rem; border: 2px solid #15803d;">
                        ✅ Cuenta verificada y lista para usar
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 0.85rem; margin: 0;">
                        ¿Tienes preguntas? Estamos aquí para ayudarte en <a href="mailto:soporte@bookyhome.com" style="color: #7A1E3A; text-decoration: none;">soporte@bookyhome.com</a>
                    </p>
                    <p style="color: #aaa; font-size: 0.8rem; margin: 0.5rem 0 0;">
                        Este correo es generado automáticamente, por favor no respondas a este mensaje.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(mensaje)