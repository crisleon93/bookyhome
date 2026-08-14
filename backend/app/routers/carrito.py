from fastapi import APIRouter
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import verify_token
from app.models.carrito import (
    obtener_carrito,
    agregar_al_carrito,
    eliminar_item_carrito,
    vaciar_carrito,
    checkout_carrito,
)

router = APIRouter()
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload


@router.get("")
def get_my_carrito(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    return obtener_carrito(id_usuario)


@router.post("")
def add_to_cart(data: dict, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    id_libro = data.get("id_libro")
    cantidad = max(1, int(data.get("cantidad", 1)))

    if not id_libro:
        raise HTTPException(status_code=400, detail="id_libro es requerido")

    item = {
        "id_libro": int(id_libro),
        "cantidad": cantidad,
        "titulo": data.get("titulo", ""),
        "autor_libro": data.get("autor_libro", ""),
        "precio_libro": float(data.get("precio_libro", 0)),
        "imagen": data.get("imagen"),
        "id_variante": data.get("id_variante"),
        "variante_label": data.get("variante_label"),
    }

    return agregar_al_carrito(id_usuario, item)


@router.delete("/{id_libro}")
def remove_from_cart(id_libro: int, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    return eliminar_item_carrito(id_usuario, id_libro)


@router.post("/checkout")
def checkout(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    resultado = checkout_carrito(id_usuario)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado


@router.post("/clear")
def clear_my_cart(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    return vaciar_carrito(id_usuario)
