from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.carrito import obtener_carrito
from dotenv import load_dotenv
load_dotenv()
import asyncio

# Esquemas de validación
from app.schemas import UsuarioRegistro, UsuarioLogin, LibreriaRegistro, Token

# NUEVOS IMPORTS: Desde la carpeta models
from app.models.usuarios import (
    crear_usuario, 
    login_usuario, 
    obtener_todos_usuarios, 
    obtener_usuario_por_email, 
    actualizar_password
)
from app.models.tiendas import crear_libreria

# Autenticación y Email
from app.auth import create_token, verify_token
from app.email import enviar_email_recuperacion

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
    resultado = crear_usuario(data.nombre, data.email, data.password, data.rol)
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

@app.post("/forgot-password")
async def forgot_password(data: dict):
    email = data.get("email")
    user = obtener_usuario_por_email(email)
    if not user:
        return {"mensaje": "Si el email existe, recibirás un enlace"}
    
    token = create_token({"sub": str(user["id_usuario"]), "tipo": "reset"})
    await enviar_email_recuperacion(email, token)
    return {"mensaje": "Si el email existe, recibirás un enlace"}

@app.post("/reset-password")
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

@app.get("/carrito/{id_usuario}")
def get_carrito(id_usuario: int):
    return obtener_carrito(id_usuario)

def obtener_carrito(id_usuario: int):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Aquí es donde llamamos a la VISTA que falta en tu MySQL
        cursor.execute("SELECT * FROM v_detalles_carrito WHERE id_usuario = %s", (id_usuario,))
        
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Error en obtener_carrito: {e}")
        return []


from app.database import get_db

@app.get("/api/stored/libros")
def listar_libros_sp():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.callproc('sp_listar_libros_disponibles')

        results = []
        for result in cursor.stored_results():
            results = result.fetchall()

        cursor.close()
        conn.close()

        return results

    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Error al ejecutar stored procedure")
    
@app.get("/api/mis-libros/{id_usuario}")
def mis_libros(id_usuario: int):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT l.*, c.nombre_categoria, t.nombre_tienda 
            FROM libros l
            INNER JOIN categorias c ON l.id_categoria = c.id_categoria
            INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
            WHERE t.id_usuario = %s
            ORDER BY l.fecha_listado DESC
        """, (id_usuario,))
        libros = cursor.fetchall()
        cursor.close()
        conn.close()
        return libros
    except Exception as e:
        print(e)
        return []