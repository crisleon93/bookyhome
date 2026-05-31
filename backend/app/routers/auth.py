from fastapi import APIRouter, HTTPException
from app.auth import create_token, verify_token
from app.email import enviar_email_recuperacion
from app.models.usuarios import obtener_usuario_por_email, actualizar_password

router = APIRouter()

@router.post("/forgot-password")
async def forgot_password(data: dict):
    email = data.get("email")
    user = obtener_usuario_por_email(email)
    if not user:
        return {"mensaje": "Si el email existe, recibirás un enlace"}

    token = create_token({"sub": str(user["id_usuario"]), "tipo": "reset"})
    await enviar_email_recuperacion(email, token)
    return {"mensaje": "Si el email existe, recibirás un enlace"}

@router.post("/reset-password")
def reset_password(data: dict):
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
