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
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None