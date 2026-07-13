from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from app.auth import get_current_user
from app.models.tiendas import obtener_tienda_por_usuario
from app.models.tienda_configuracion import obtener_configuracion_tienda, actualizar_configuracion_tienda

router = APIRouter()

@router.get("")
def get_configuracion(user: dict = Depends(get_current_user)):
    """Obtiene la configuración de la tienda del vendedor."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    config = obtener_configuracion_tienda(id_tienda)
    
    if not config:
        # Si no tiene, devolver valores por defecto
        return {
            "descripcion": "",
            "logo_url": "",
            "banner_url": "",
            "horario_atencion": "",
            "politica_devoluciones": "",
            "politica_envios": "",
            "tiempo_despacho_dias": 2,
            "ciudad_origen": "",
            "acepta_negociacion": False,
            "email_publico": "",
            "redes_sociales": ""
        }
    return config

@router.put("")
def update_configuracion(data: Dict[str, Any] = Body(...), user: dict = Depends(get_current_user)):
    """Actualiza la configuración de la tienda del vendedor."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada.")
    
    resultado = actualizar_configuracion_tienda(id_tienda, data)
    
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
        
    return {"mensaje": "Configuración actualizada con éxito"}
