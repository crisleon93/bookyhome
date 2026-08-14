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

@router.get("/{id_tienda}")
def get_configuracion_publica(id_tienda: int):
    """Consulta pública de la configuración de la tienda."""
    from app.models.tiendas import obtener_tienda_por_id
    from app.models.libro import obtener_libros_por_tienda
    
    tienda = obtener_tienda_por_id(id_tienda)
    if not tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
    config = obtener_configuracion_tienda(id_tienda)
    if not config:
        config = {
            "descripcion": "",
            "logo_url": "",
            "banner_url": "",
            "horario_atencion": "",
            "politica_devoluciones": "",
            "politica_envios": "",
            "tiempo_despacho_dias": 2,
            "ciudad_origen": "",
            "email_publico": ""
        }
    
    libros = obtener_libros_por_tienda(id_tienda)
    
    return {
        "tienda": tienda,
        "configuracion": config,
        "libros": libros
    }

import os
import shutil
from fastapi import UploadFile, File
import time

UPLOAD_TIENDAS_DIR = "uploads/tiendas"
os.makedirs(UPLOAD_TIENDAS_DIR, exist_ok=True)

@router.post("/upload-image")
def upload_tienda_image(
    file: UploadFile = File(...),
    tipo: str = Body(..., embed=True), # 'logo' o 'banner'
    user: dict = Depends(get_current_user)
):
    """Sube un logo o banner de la tienda y devuelve la URL relativa."""
    id_tienda = user.get("id_tienda")
    if not id_tienda:
        raise HTTPException(status_code=403, detail="No tienes una tienda registrada.")
        
    if tipo not in ('logo', 'banner'):
        raise HTTPException(status_code=400, detail="Tipo de imagen inválido. Debe ser 'logo' o 'banner'.")

    ext = os.path.splitext(file.filename)[1]
    filename = f"tienda_{id_tienda}_{tipo}_{int(time.time())}{ext}"
    filepath = os.path.join(UPLOAD_TIENDAS_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/{UPLOAD_TIENDAS_DIR}/{filename}"}
