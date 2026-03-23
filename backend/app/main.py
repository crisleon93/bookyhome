from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import UsuarioRegistro, UsuarioLogin, LibreriaRegistro, Token
from app.models import crear_usuario, login_usuario, crear_libreria
from app.auth import create_token
from app.models import crear_usuario, login_usuario, crear_libreria, obtener_todos_usuarios

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"mensaje": "BookyHome API funcionando"}

@app.post("/register")
def register(data: UsuarioRegistro):
    print(f"DATOS RECIBIDOS: {data}")
    resultado = crear_usuario(data.nombre, data.email, data.password)
    print(f"RESULTADO: {resultado}")
    if not resultado["ok"]:
        if "Duplicate" in resultado["error"]:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
        raise HTTPException(status_code=500, detail="Error al crear la cuenta")
    return {"mensaje": "Cuenta creada exitosamente"}

@app.post("/login", response_model=Token)
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

@app.post("/libreria")
def registrar_libreria(data: LibreriaRegistro):
    resultado = crear_libreria(
        data.nombre, data.libreria, data.direccion, data.email, data.password
    )
    if not resultado["ok"]:
        if "Duplicate" in resultado["error"]:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
        raise HTTPException(status_code=500, detail="Error al registrar la librería")
    return {"mensaje": "Librería registrada exitosamente"}

@app.get("/usuarios")
def get_usuarios():
    return obtener_todos_usuarios()