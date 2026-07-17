from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from app.auth import verify_token
from app.models.envios import listar_empresas, registrar_envio
from app.models.libro import obtener_tienda_por_usuario

router = APIRouter(prefix="/envios", tags=["Envíos"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload


class RegistroEnvio(BaseModel):
    id_comprador: int
    id_empresa: int
    numero_guia: str = Field(min_length=3, max_length=80)


@router.get("/empresas")
def empresas_mensajeria(user=Depends(get_current_user)):
    return listar_empresas()


@router.put("/orden/{id_orden}")
def actualizar_envio(id_orden: int, data: RegistroEnvio, user=Depends(get_current_user)):
    tienda = obtener_tienda_por_usuario(int(user["sub"]))
    if not tienda:
        raise HTTPException(status_code=403, detail="Solo un vendedor puede registrar una guía")
    envio, error = registrar_envio(data.id_comprador, id_orden, tienda["id_tienda"], data.id_empresa, data.numero_guia.strip())
    if error:
        status = 404 if error == "Orden no encontrada" else 409 if "pagado" in error else 403
        raise HTTPException(status_code=status, detail=error)
    return {"ok": True, "envio": envio}
