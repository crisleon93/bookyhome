import os
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone # Agregamos timezone
import jwt 

# ========================
# Seguridad y cifrado
# ========================
# Configuración de hash y firma JWT.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "tu_clave_secreta")
ALGORITHM = "HS256"

def hash_password(password: str):
    """Convierte una contraseña en texto plano en un hash seguro."""
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    """Compara la contraseña ingresada con la contraseña almacenada."""
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict):
    """Crea un JWT con una expiración de 24 horas."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token verificado correctamente: {payload.get('sub')}", flush=True)
        return payload
    except Exception as e:
        print(f"❌ Error verificando token: {e}", flush=True)
        return None


# ========================
# Dependencias de Roles y Autorización
# ========================
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    from app.models.usuarios import obtener_usuario_por_id
    from app.models.tiendas import obtener_tienda_por_usuario

    usuario = obtener_usuario_por_id(int(payload["sub"]))
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
    if usuario.get("estado_usuario") != "Activo":
        raise HTTPException(status_code=403, detail="El usuario está bloqueado o inactivo")
        
    # Si es vendedor, le inyectamos los datos de su tienda
    if usuario.get("rol") == "vendedor":
        tienda = obtener_tienda_por_usuario(usuario["id_usuario"])
        usuario["id_tienda"] = tienda["id_tienda"] if tienda else None
        
    return usuario


def require_role(*roles_permitidos: str):
    def dependency(usuario: dict = Depends(get_current_user)):
        if usuario.get("rol") not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción"
            )
        return usuario
    return dependency