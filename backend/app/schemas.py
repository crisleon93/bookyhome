from pydantic import BaseModel, EmailStr
from pydantic import BaseModel, Field
from typing import List, Optional

# ===========================
# USUARIOS
# ===========================

class UsuarioRegistro(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: str
    rol: str = "comprador"  # 'comprador' | 'vendedor'

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
    telefono: str
    email: EmailStr
    password: str

# ===========================
# TOKEN
# ===========================

class Token(BaseModel):
    access_token: str

# ===========================
# LIBROS
# ===========================
class OcultarPayload(BaseModel):
    oculto: bool

class LibroCrear(BaseModel):
    id_categoria: int
    titulo: str = Field(..., max_length=100)
    autor_libro: str = Field(..., max_length=50)
    descripcion_libro: str = Field(..., max_length=300)
    precio_libro: float = Field(..., gt=0)
    stock: int = Field(..., ge=1)
    estado_libro: str = Field(..., pattern="^(nuevo|usado_buen_estado|usado_regular)$")
 
class LibroRespuesta(BaseModel):
    id_libro: int
    id_tienda: int
    id_categoria: int
    titulo: str
    autor_libro: str
    descripcion_libro: str
    precio_libro: float
    stock: int
    estado_libro: str
    fecha_publicacion: str
    fecha_listado: str
    nombre_categoria: Optional[str] = None
    imagenes: List[str] = []
 
class CategoriaRespuesta(BaseModel):
    id_categoria: int
    nombre_categoria: str

# ===========================
# PAGOS
# ===========================

class PagoRequest(BaseModel):
    order_id: int
    amount: float
    payment_method: str
    coupon_code: Optional[str] = None


# ===========================
# Estado tiendas
# ===========================

class EstadoTiendaPayload(BaseModel):
    estado: str  # Recibirá 'Activa' o 'Suspendida'
