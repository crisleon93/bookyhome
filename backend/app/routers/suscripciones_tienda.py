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
    
    # Hook automático: Registrar ingreso en BookyPago Finanzas
    try:
        from app.models.bookypago_finanzas import BookyPagoFinanzas
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        bookypago_config = {
            'comision_venta': float(os.getenv('BOOKYPAGO_COMISION_VENTA', '0.10')),
            'comision_impulso': float(os.getenv('BOOKYPAGO_COMISION_IMPULSO', '0.05')),
            'comision_plan': float(os.getenv('BOOKYPAGO_COMISION_PLAN', '0.02')),
            'minimo_pago': float(os.getenv('BOOKYPAGO_MINIMO_PAGO', '50000')),
            'dias_pago': int(os.getenv('BOOKYPAGO_DIAS_PAGO', '7'))
        }
        bookypago_finanzas_direct = BookyPagoFinanzas(bookypago_config)
        
        resultado_finanzas = bookypago_finanzas_direct.registrar_ingreso_plan(
            id_tienda=id_tienda,
            id_plan=resultado["suscripcion"]["id_suscripcion"],
            monto_plan=data.precio_pagado or 0,
            periodicidad="mensual"
        )
        
        if resultado_finanzas.get('ok'):
            print(f"Ingreso de suscripción registrado exitosamente en BookyPago Finanzas: Suscripción #{resultado['suscripcion']['id_suscripcion']}")
        else:
            print(f"Error registrando ingreso de suscripción en BookyPago Finanzas: {resultado_finanzas.get('error')}")
    except Exception as e:
        # No fallar la suscripción si falla el registro en finanzas, solo loggear
        print(f"Error registrando ingreso de suscripción en BookyPago Finanzas: {e}")
    
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
