from fastapi import APIRouter, HTTPException
from app.schemas import UsuarioRegistro, UsuarioLogin, Token
from app.models.usuarios import crear_usuario, login_usuario, obtener_todos_usuarios
from app.auth import create_token

router = APIRouter()

@router.post("/register")
def register(data: UsuarioRegistro):
    resultado = crear_usuario(data.nombre, data.email, data.password, data.rol)
    if not resultado["ok"]:
        if "Duplicate" in resultado["error"]:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
        raise HTTPException(status_code=500, detail="Error al crear la cuenta")
    return {"mensaje": "Cuenta creada exitosamente"}

@router.post("/login", response_model=Token)
def login(data: UsuarioLogin):
    user = login_usuario(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    token = create_token({
        "sub": str(user["id_usuario"]),
        "nombre": user["nombre_usuario"],
        "rol": user["rol"]
    })
    return {"access_token": token, "token_type": "bearer"}

@router.get("/usuarios")
def get_usuarios():
    return obtener_todos_usuarios()
