from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.schemas import LibreriaRegistro
from app.models.tiendas import crear_libreria, obtener_tiendas, actualizar_tienda
from app.models.libro import obtener_tienda_por_usuario
from app.auth import verify_token

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload

@router.post("/libreria")
def registrar_libreria(data: LibreriaRegistro):
    resultado = crear_libreria(
        data.nombre,
        data.libreria,
        data.direccion,
        data.telefono,
        data.email,
        data.password
    )

    if not resultado["ok"]:
        if "Duplicate" in resultado["error"]:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una cuenta con ese email"
            )

        raise HTTPException(
            status_code=500,
            detail=f"Error al registrar la librería: {resultado['error']}"
        )

    return {"mensaje": "Librería registrada exitosamente"}


@router.get("/tiendas")
def listar_tiendas():
    return obtener_tiendas()


@router.get("/tiendas/mi-tienda")
def obtener_mi_tienda(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return tienda


class TiendaUpdate(BaseModel):
    nombre_tienda: str
    direccion: str
    telefono: str


@router.put("/tiendas/mi-tienda")
def modificar_mi_tienda(data: TiendaUpdate, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    # Verificar primero si tiene tienda
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    
    resultado = actualizar_tienda(id_usuario, data.nombre_tienda, data.direccion, data.telefono)
    if not resultado["ok"]:
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar la tienda: {resultado['error']}"
        )
    return {"mensaje": "Tienda actualizada exitosamente"}