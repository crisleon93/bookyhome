from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.auth import get_current_user
from app.models.suscripciones_tienda import (
    obtener_suscripcion_activa,
    obtener_historial_suscripciones,
    verificar_vigencia,
    crear_suscripcion,
    cancelar_suscripcion,
    expirar_suscripciones_vencidas,
)
from app.utils.finance_hooks import registrar_ingreso_plan

router = APIRouter(prefix="/suscripciones", tags=["Suscripciones de Tienda"])

PLANES_VALIDOS = ("basico", "premium", "profesional")


class SuscripcionCrear(BaseModel):
    plan_suscripcion: str
    fecha_inicio: Optional[date] = None
    fecha_fin: date
    precio_pagado: Optional[float] = 0
    metodo_pago: Optional[str] = ""


@router.get("/mi-suscripcion")
def ver_mi_suscripcion(user: dict = Depends(get_current_user)):
    """Retorna la suscripción activa de la tienda del vendedor autenticado."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    suscripcion = obtener_suscripcion_activa(id_tienda)
    if not suscripcion:
        return {"activa": False, "mensaje": "No tienes suscripción activa"}
    return {"activa": True, "suscripcion": suscripcion}


@router.get("/vigente")
def suscripcion_vigente(user: dict = Depends(get_current_user)):
    """Verifica si la tienda del vendedor tiene suscripción activa y vigente."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    vigente = verificar_vigencia(id_tienda)
    return {"vigente": vigente}


@router.get("/historial")
def ver_historial(user: dict = Depends(get_current_user)):
    """Retorna el historial completo de suscripciones de la tienda."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    return obtener_historial_suscripciones(id_tienda)


@router.post("")
def nueva_suscripcion(data: SuscripcionCrear, user: dict = Depends(get_current_user)):
    """
    Crea una nueva suscripción para la tienda del vendedor.
    Si ya tiene una activa, la cancela automáticamente antes de crear la nueva.
    """
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    if data.plan_suscripcion not in PLANES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Plan no válido. Usa: {', '.join(PLANES_VALIDOS)}")

    resultado = crear_suscripcion(id_tienda, data.model_dump())
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])

    # Registro automático de ingreso en BookyPago Finanzas
    registrar_ingreso_plan(
        id_tienda=id_tienda,
        id_plan=resultado["suscripcion"]["id_suscripcion"],
        monto_plan=data.precio_pagado or 0,
        periodicidad="mensual",
    )

    return resultado["suscripcion"]


@router.delete("/{id_suscripcion}")
def cancelar_mi_suscripcion(id_suscripcion: int, user: dict = Depends(get_current_user)):
    """Cancela una suscripción activa de la tienda."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")

    resultado = cancelar_suscripcion(id_suscripcion, id_tienda)
    if not resultado["ok"]:
        raise HTTPException(status_code=404, detail=resultado.get("error", "Suscripción no encontrada"))
    return {"ok": True, "mensaje": "Suscripción cancelada"}


@router.post("/admin/expirar-vencidas")
def expirar_vencidas(user: dict = Depends(get_current_user)):
    """
    [ADMIN] Marca como expiradas todas las suscripciones activas cuya fecha_fin ya pasó.
    Solo accesible para administradores.
    """
    if user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores")
    resultado = expirar_suscripciones_vencidas()
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
    return resultado
