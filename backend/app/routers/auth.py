from fastapi import APIRouter, HTTPException
from app.auth import create_token, verify_token
from app.email import enviar_email_recuperacion, enviar_email_agradecimiento_confirmacion
from app.models.usuarios import obtener_usuario_por_email, actualizar_password, verificar_email_usuario, obtener_usuario_por_token

router = APIRouter()

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
async def verify_email(token: str):
    """Verifica el correo electrónico usando el token de verificación."""
    # Primero obtener el usuario para tener su email
    usuario = obtener_usuario_por_token(token)
    if not usuario:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    resultado = verificar_email_usuario(token)
    
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado.get("error", "Error al verificar el correo"))
    
    # Enviar email de agradecimiento
    try:
        await enviar_email_agradecimiento_confirmacion(usuario["correo_usuario"])
        print(f"✅ Correo de agradecimiento enviado a {usuario['correo_usuario']}", flush=True)
    except Exception as exc:
        print(f"❌ Error enviando correo de agradecimiento a {usuario['correo_usuario']}: {exc}", flush=True)
    
    return {"mensaje": "Correo electrónico verificado exitosamente. Ya puedes iniciar sesión."}
