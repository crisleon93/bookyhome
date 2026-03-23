from pydantic import BaseModel, EmailStr

# ===========================
# USUARIOS
# ===========================

class UsuarioRegistro(BaseModel):
    nombre: str
    email: EmailStr
    password: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class UsuarioRespuesta(BaseModel):
    id_usuario: int
    nombre_usuario: str
    correo_usuario: str
    rol: str

# ===========================
# LIBRERÍA
# ===========================

class LibreriaRegistro(BaseModel):
    nombre: str
    libreria: str
    direccion: str
    email: EmailStr
    password: str

# ===========================
# TOKEN
# ===========================

class Token(BaseModel):
    access_token: str