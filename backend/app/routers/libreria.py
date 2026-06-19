from fastapi import APIRouter, HTTPException
from app.schemas import LibreriaRegistro
from app.models.tiendas import crear_libreria, obtener_tiendas, actualizar_estado_tienda

router = APIRouter()

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
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
        raise HTTPException(status_code=500, detail=f"Error al registrar la librería: {resultado['error']}")

    return {"mensaje": "Librería registrada exitosamente"}


@router.get("/tiendas")
def listar_tiendas():
    return obtener_tiendas()


@router.patch("/tiendas/{id_tienda}/estado")
def cambiar_estado_tienda(id_tienda: int, payload: dict):
    nuevo_estado = payload.get("estado")
    resultado = actualizar_estado_tienda(id_tienda, nuevo_estado)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return {"ok": True, "estado": nuevo_estado}