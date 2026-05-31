from fastapi import APIRouter
from app.models.carrito import obtener_carrito

router = APIRouter()

@router.get("/carrito/{id_usuario}")
def get_carrito(id_usuario: int):
    return obtener_carrito(id_usuario)
