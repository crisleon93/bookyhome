from fastapi import APIRouter, HTTPException
from app.schemas import UsuarioRegistro, UsuarioLogin, Token
from app.models.usuarios import crear_usuario, login_usuario, obtener_todos_usuarios
from app.auth import create_token

router = APIRouter()

@router.post("/register")
def register(data: UsuarioRegistro):
    # Pasamos el teléfono que ahora requiere obligatoriamente bookyhome.sql
    resultado = crear_usuario(data.nombre, data.email, data.password, data.telefono, data.rol)
    
    if not resultado["ok"]:
        # Si el error es por duplicado (correo ya registrado)
        if "Duplicate" in str(resultado.get("error", "")):
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
        
        # Esto te ayudará a ver en la consola de Docker qué falló exactamente si vuelve a dar 500
        print(f"❌ Error interno en modelo crear_usuario: {resultado.get('error')}", flush=True)
        raise HTTPException(status_code=500, detail="Error interno al crear la cuenta en la base de datos")
        
    return {"mensaje": "Cuenta creada exitosamente"}

@router.post("/login", response_model=Token)
def login(data: UsuarioLogin):
    user = login_usuario(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    # Creamos el token con los datos exactos que vienen de la base de datos de Docker
    token = create_token({
        "sub": str(user["id_usuario"]),
        "nombre": user["nombre_usuario"],
        "rol": user["rol"]
    })
    return {"access_token": token, "token_type": "bearer"}

@router.get("/usuarios")
def get_usuarios():
    return obtener_todos_usuarios()

