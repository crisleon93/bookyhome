from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user
from app.models.direcciones import (
    obtener_direcciones_usuario,
    crear_direccion,
    actualizar_direccion,
    eliminar_direccion,
    marcar_direccion_predeterminada,
)

router = APIRouter(prefix="/direcciones", tags=["Direcciones de Envío"])


class DireccionCrear(BaseModel):
    nombre_destinatario: str
    telefono_contacto: str
    departamento: str
    ciudad: str
    direccion: str
    codigo_postal: Optional[str] = ""
    es_predeterminada: Optional[bool] = False


class DireccionActualizar(BaseModel):
    nombre_destinatario: Optional[str] = None
    telefono_contacto: Optional[str] = None
    departamento: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    codigo_postal: Optional[str] = None
    es_predeterminada: Optional[bool] = None


@router.get("")
def listar_direcciones(user: dict = Depends(get_current_user)):
    """Retorna todas las direcciones de envío del usuario autenticado."""
    id_usuario = user["id_usuario"]
    return obtener_direcciones_usuario(id_usuario)


@router.post("")
def agregar_direccion(data: DireccionCrear, user: dict = Depends(get_current_user)):
    """Crea una nueva dirección de envío para el usuario."""
    if not data.nombre_destinatario.strip():
        raise HTTPException(status_code=400, detail="El nombre del destinatario es obligatorio")
    if not data.ciudad.strip():
        raise HTTPException(status_code=400, detail="La ciudad es obligatoria")
    if not data.direccion.strip():
        raise HTTPException(status_code=400, detail="La dirección es obligatoria")

    resultado = crear_direccion(user["id_usuario"], data.model_dump())
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
    return resultado["direccion"]


@router.put("/{id_direccion}")
def modificar_direccion(id_direccion: int, data: DireccionActualizar, user: dict = Depends(get_current_user)):
    """Actualiza una dirección de envío del usuario."""
    resultado = actualizar_direccion(id_direccion, user["id_usuario"], data.model_dump(exclude_none=True))
    if not resultado["ok"]:
        raise HTTPException(status_code=404 if "no encontrada" in resultado.get("error", "").lower() else 500, detail=resultado["error"])
    return resultado["direccion"]


@router.delete("/{id_direccion}")
def borrar_direccion(id_direccion: int, user: dict = Depends(get_current_user)):
    """Elimina una dirección de envío del usuario."""
    resultado = eliminar_direccion(id_direccion, user["id_usuario"])
    if not resultado["ok"]:
        raise HTTPException(status_code=404, detail=resultado.get("error", "Dirección no encontrada"))
    return {"ok": True, "mensaje": "Dirección eliminada"}


@router.patch("/{id_direccion}/default")
def establecer_predeterminada(id_direccion: int, user: dict = Depends(get_current_user)):
    """Marca una dirección como predeterminada y desactiva las demás."""
    resultado = marcar_direccion_predeterminada(id_direccion, user["id_usuario"])
    if not resultado["ok"]:
        raise HTTPException(status_code=404, detail=resultado.get("error", "Dirección no encontrada"))
    return resultado["direccion"]
