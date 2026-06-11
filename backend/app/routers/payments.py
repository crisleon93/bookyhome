from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import verify_token
from app.schemas import PagoRequest
from app.models.payments import obtener_orden, registrar_pago

router = APIRouter()
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload


@router.post("/api/v1/payments")
def process_payment(data: PagoRequest, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    resultado = registrar_pago(
        id_usuario=id_usuario,
        id_orden=data.order_id,
        amount=data.amount,
        payment_method=data.payment_method
    )
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado


@router.get("/api/v1/orders/{id_orden}")
def get_order_details(id_orden: int, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    order = obtener_orden(id_usuario, id_orden)
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return order
