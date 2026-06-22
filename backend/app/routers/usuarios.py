from fastapi import APIRouter, HTTPException
from app.schemas import UsuarioRegistro, UsuarioLogin, Token
from app.models.usuarios import crear_usuario, login_usuario, obtener_todos_usuarios, bloquear_usuario
from app.models.tiendas import obtener_tienda_por_usuario
from app.auth import create_token
from pydantic import BaseModel

router = APIRouter()


@router.post("/register")
def register(data: UsuarioRegistro):
    resultado = crear_usuario(data.nombre, data.email, data.password, data.telefono, data.rol)

    if not resultado["ok"]:
        if "Duplicate" in str(resultado.get("error", "")):
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")

        print(f"❌ Error interno en modelo crear_usuario: {resultado.get('error')}", flush=True)
        raise HTTPException(status_code=500, detail="Error interno al crear la cuenta en la base de datos")

    return {"mensaje": "Cuenta creada exitosamente"}


@router.post("/login", response_model=Token)
def login(data: UsuarioLogin):
    user = login_usuario(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

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


@router.get("/usuarios")
def get_usuarios():
    return obtener_todos_usuarios()


class BloquearPayload(BaseModel):
    bloqueado: bool


@router.patch("/usuarios/{id_usuario}/bloquear")
def bloquear(id_usuario: int, payload: BloquearPayload):
    resultado = bloquear_usuario(id_usuario, payload.bloqueado)
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
    return {"mensaje": "Estado del usuario actualizado"}