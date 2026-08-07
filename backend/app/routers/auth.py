from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from app.auth import create_token, verify_token
from app.email import enviar_email_recuperacion, enviar_email_agradecimiento_confirmacion
from app.models.usuarios import obtener_usuario_por_email, actualizar_password, verificar_email_usuario, obtener_usuario_por_token

router = APIRouter()


def _render_verify_email_page(*, success: bool, title: str, message: str) -> str:
    accent = "#7A1E3A"
    bg = "#FAF8F5"
    card_bg = "#FFFFFF"
    success_color = "#15803d"
    error_color = "#991b1b"
    icon = "✓" if success else "!"
    icon_bg = "#dcfce7" if success else "#fee2e2"
    icon_color = success_color if success else error_color

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — BookyHome</title>
  <style>
    body {{
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: {bg};
      font-family: Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #2A2A2A;
      padding: 24px;
      box-sizing: border-box;
    }}
    .card {{
      width: 100%;
      max-width: 480px;
      background: {card_bg};
      border-radius: 16px;
      padding: 32px 28px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      text-align: center;
    }}
    .brand {{
      color: {accent};
      font-size: 1.4rem;
      font-weight: 800;
      margin-bottom: 24px;
    }}
    .icon {{
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: {icon_bg};
      color: {icon_color};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 800;
      margin: 0 auto 20px;
    }}
    h1 {{
      margin: 0 0 12px;
      font-size: 1.5rem;
    }}
    p {{
      margin: 0;
      color: #666;
      line-height: 1.6;
    }}
    .hint {{
      margin-top: 20px;
      font-size: 0.9rem;
      color: #888;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">BookyHome</div>
    <div class="icon">{icon}</div>
    <h1>{title}</h1>
    <p>{message}</p>
    <p class="hint">Ya puedes volver a la app móvil o al sitio web e iniciar sesión.</p>
  </div>
</body>
</html>"""


def _wants_json_response(request: Request) -> bool:
    accept = request.headers.get("accept", "")
    return "application/json" in accept or request.query_params.get("format") == "json"


# ========================
# Recuperación de contraseña
# ========================
@router.post("/forgot-password")
async def forgot_password(data: dict):
    """Genera un token de recuperación y envía un correo al usuario."""
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="El email es obligatorio")

    user = obtener_usuario_por_email(email)
    if not user:
        return {"mensaje": "No se encontró una cuenta con ese email", "correo_enviado": False}

    token = create_token({"sub": str(user["id_usuario"]), "tipo": "reset"})
    try:
        await enviar_email_recuperacion(email, token)
        print(f"✅ Correo de recuperación enviado a {email}", flush=True)
    except Exception as exc:
        print(f"❌ Error enviando correo de recuperación a {email}: {exc}", flush=True)
        raise HTTPException(status_code=500, detail="No se pudo enviar el correo de recuperación")

    return {"mensaje": "Correo de recuperación enviado", "correo_enviado": True}


# ========================
# Reinicio de contraseña con token
# ========================
@router.post("/reset-password")
def reset_password(data: dict):
    """Verifica el token de recuperación y actualiza la contraseña del usuario."""
    token = data.get("token")
    nueva_password = data.get("password")

    payload = verify_token(token)
    if not payload or payload.get("tipo") != "reset":
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    id_usuario = payload.get("sub")
    resultado = actualizar_password(id_usuario, nueva_password)
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail="Error al actualizar la contraseña")

    return {"mensaje": "Contraseña actualizada exitosamente"}


# ========================
# Verificación de correo electrónico
# ========================
@router.get("/verify-email")
async def verify_email(token: str, request: Request):
    """Verifica el correo electrónico usando el token de verificación."""
    wants_json = _wants_json_response(request)

    usuario = obtener_usuario_por_token(token)
    if not usuario:
        detail = "Token inválido o expirado"
        if wants_json:
            raise HTTPException(status_code=400, detail=detail)
        return HTMLResponse(
            content=_render_verify_email_page(
                success=False,
                title="Verificación fallida",
                message=detail,
            ),
            status_code=400,
        )

    resultado = verificar_email_usuario(token)
    if not resultado["ok"]:
        detail = resultado.get("error", "Error al verificar el correo")
        if wants_json:
            raise HTTPException(status_code=400, detail=detail)
        return HTMLResponse(
            content=_render_verify_email_page(
                success=False,
                title="Verificación fallida",
                message=detail,
            ),
            status_code=400,
        )

    try:
        await enviar_email_agradecimiento_confirmacion(usuario["correo_usuario"])
        print(f"✅ Correo de agradecimiento enviado a {usuario['correo_usuario']}", flush=True)
    except Exception as exc:
        print(f"❌ Error enviando correo de agradecimiento a {usuario['correo_usuario']}: {exc}", flush=True)

    mensaje = "Correo electrónico verificado exitosamente. Ya puedes iniciar sesión."
    if wants_json:
        return {"mensaje": mensaje}

    return HTMLResponse(
        content=_render_verify_email_page(
            success=True,
            title="¡Correo verificado!",
            message=mensaje,
        )
    )
