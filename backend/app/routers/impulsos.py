from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user
from app.models.impulsos import (
    obtener_tipos_impulso,
    obtener_impulsos_tienda,
    contratar_impulso,
    cancelar_impulso,
)
from app.models.herramientas import obtener_suscripcion_activa_herramientas
from app.utils.finance_hooks import registrar_ingreso_impulso

router = APIRouter(prefix="/impulsos", tags=["Impulsos Publicitarios"])


class ImpulsoRequest(BaseModel):
    id_tipo_impulso: int
    id_libro: Optional[int] = None
    id_categoria: Optional[int] = None


@router.get("/tipos")
def listar_tipos():
    """Retorna todos los tipos de impulso activos (público)."""
    return obtener_tipos_impulso()


@router.get("/mis-impulsos")
def mis_impulsos(user: dict = Depends(get_current_user)):
    """Retorna todos los impulsos contratados por la tienda del vendedor con sus métricas."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    return obtener_impulsos_tienda(id_tienda)


@router.post("/contratar")
def contratar(data: ImpulsoRequest, user: dict = Depends(get_current_user)):
    """
    Contrata un impulso para un libro o categoría de la tienda.
    Aplica automáticamente el descuento del plan de suscripción activo.
    """
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")

    # Obtener descuento del plan activo
    descuento_pct = 0.0
    suscripcion = obtener_suscripcion_activa_herramientas(id_tienda)
    if suscripcion:
        descuento_pct = float(suscripcion.get("impulsos_con_descuento", 0) or 0)

    resultado = contratar_impulso(
        id_tienda=id_tienda,
        id_tipo_impulso=data.id_tipo_impulso,
        id_libro=data.id_libro,
        id_categoria=data.id_categoria,
        descuento_pct=descuento_pct,
    )
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])

    # Registro automático de ingreso en BookyPago Finanzas
    impulso = resultado.get("impulso") or {}
    registrar_ingreso_impulso(
        id_impulso=impulso.get("id_impulso", 0),
        id_tienda=id_tienda,
        monto_impulso=float(impulso.get("monto_pagado", 0)),
    )

    return resultado


@router.delete("/{id_impulso}")
def cancelar(id_impulso: int, user: dict = Depends(get_current_user)):
    """Cancela un impulso activo de la tienda."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    resultado = cancelar_impulso(id_impulso, id_tienda)
    if not resultado["ok"]:
        raise HTTPException(status_code=404, detail=resultado.get("error"))
    return {"ok": True, "mensaje": "Impulso cancelado"}
