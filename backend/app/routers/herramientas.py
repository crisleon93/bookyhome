from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.auth import get_current_user
from app.models.herramientas import (
    obtener_planes,
    obtener_suscripcion_activa_herramientas,
    suscribir_plan,
    cancelar_suscripcion_herramientas,
)

router = APIRouter(prefix="/herramientas", tags=["Herramientas del Vendedor"])


class SuscripcionRequest(BaseModel):
    id_plan: int
    fecha_inicio: str
    fecha_fin: str
    metodo_pago: str = ""
    monto_pagado: float = 0


@router.get("/planes")
def listar_planes():
    """Retorna todos los planes de herramientas disponibles (público)."""
    return obtener_planes()


@router.get("/mi-suscripcion")
def mi_suscripcion(user: dict = Depends(get_current_user)):
    """Retorna la suscripción activa de herramientas del vendedor."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    suscripcion = obtener_suscripcion_activa_herramientas(id_tienda)
    if not suscripcion:
        return {"activa": False, "plan_actual": "Gratuito"}
    return {"activa": True, "suscripcion": suscripcion}


@router.post("/suscribir")
def suscribir(data: SuscripcionRequest, user: dict = Depends(get_current_user)):
    """Suscribe la tienda del vendedor a un plan de herramientas."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")

    resultado = suscribir_plan(
        id_tienda=id_tienda,
        id_plan=data.id_plan,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        metodo_pago=data.metodo_pago,
        monto_pagado=data.monto_pagado,
    )
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado["suscripcion"]


@router.delete("/cancelar")
def cancelar(user: dict = Depends(get_current_user)):
    """Cancela la suscripción activa de herramientas del vendedor."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    resultado = cancelar_suscripcion_herramientas(id_tienda)
    if not resultado["ok"]:
        raise HTTPException(status_code=404, detail=resultado.get("error"))
    return {"ok": True, "mensaje": "Suscripción cancelada"}
