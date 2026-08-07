from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.schemas import UsuarioRegistro, UsuarioLogin, Token

from app.models.usuarios import crear_usuario, login_usuario, obtener_todos_usuarios, bloquear_usuario, verificar_email_usuario, obtener_usuario_por_email

from app.models.tiendas import obtener_tienda_por_usuario

from app.auth import create_token, verify_token

from app.email import enviar_email_confirmacion_registro, is_smtp_configured

from pydantic import BaseModel

import secrets



router = APIRouter()
security = HTTPBearer()

# ========================
# Auth helper (mismo patrón que routers/chat.py)
# ========================
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))




# ========================

# Registro e inicio de sesión

# ========================

@router.post("/register")

async def register(data: UsuarioRegistro):

    """Registra un nuevo usuario y envía un email de confirmación."""

    # Generar token de verificación único

    token_verificacion = secrets.token_urlsafe(32)

    

    resultado = crear_usuario(data.nombre, data.email, data.password, data.telefono, data.rol, token_verificacion)



    if not resultado["ok"]:

        if "Duplicate" in str(resultado.get("error", "")):

            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")



        print(f"❌ Error interno en modelo crear_usuario: {resultado.get('error')}", flush=True)

        raise HTTPException(status_code=500, detail="Error interno al crear la cuenta en la base de datos")



    # Enviar email de confirmación si el backend tiene SMTP configurado
    if is_smtp_configured():
        try:
            await enviar_email_confirmacion_registro(data.email, token_verificacion)
            print(f"✅ Correo de confirmación enviado a {data.email}", flush=True)
        except Exception as exc:
            print(f"❌ Error enviando correo de confirmación a {data.email}: {exc}", flush=True)
            return {
                "mensaje": "Cuenta creada, pero no se pudo enviar el correo de verificación. Revisa la configuración SMTP del backend.",
                "email_enviado": False,
            }
    else:
        print(f"⚠️ SMTP no configurado para {data.email}; el correo de verificación no se pudo enviar.", flush=True)

    return {
        "mensaje": "Cuenta creada exitosamente. Por favor verifica tu correo electrónico para completar el registro.",
        "email_enviado": is_smtp_configured(),
    }





@router.post("/login", response_model=Token)

def login(data: UsuarioLogin):

    """Valida credenciales y devuelve un token JWT si el usuario existe."""

    user = login_usuario(data.email, data.password)

    if not user:

        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")



    # Verificar que el email esté confirmado

    if not user.get("email_verificado", False):

        raise HTTPException(

            status_code=403,

            detail="Por favor verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada."

        )



    if user.get("estado_usuario") == "Bloqueado":

        raise HTTPException(

            status_code=403,

            detail="Tu cuenta ha sido suspendida. Comunícate con el administrador."

        )



    # Si es vendedor, validar que su tienda no esté suspendida

    if user.get("rol") == "vendedor":

        tienda = obtener_tienda_por_usuario(user["id_usuario"])

        if tienda and tienda.get("estado_tienda", "").lower() == "suspendida":

            raise HTTPException(

                status_code=403,

                detail="Tu librería ha sido suspendida por incumplir las normas. Comunícate con el administrador."

            )



    token = create_token({

        "sub": str(user["id_usuario"]),

        "nombre": user["nombre_usuario"],

        "rol": user["rol"]

    })

    return {"access_token": token, "token_type": "bearer"}





# ========================
# Administración de usuarios

# ========================

@router.get("/usuarios")

def get_usuarios():

    """Devuelve la lista de usuarios registrados."""

    return obtener_todos_usuarios()





class BloquearPayload(BaseModel):

    bloqueado: bool





@router.patch("/usuarios/{id_usuario}/bloquear")

def bloquear(id_usuario: int, payload: BloquearPayload):

    """Activa o bloquea un usuario según el valor recibido."""

    resultado = bloquear_usuario(id_usuario, payload.bloqueado)

    if not resultado["ok"]:

        raise HTTPException(status_code=500, detail=resultado["error"])

    return {"mensaje": "Estado del usuario actualizado"}



@router.get("/check-email-verification")

def check_email_verification(email: str):

    """Verifica si el email de un usuario ha sido confirmado."""

    user = obtener_usuario_por_email(email)

    if not user:

        return {"verificado": False, "mensaje": "Usuario no encontrado"}

    # Si el usuario no tiene la columna email_verificado, asumir que está verificado (compatibilidad)
    return {"verificado": user.get("email_verificado", True)}