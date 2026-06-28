from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import verify_token
from app.schemas import PagoRequest
from app.models.payments import obtener_orden, registrar_pago
from app.email import enviar_email_confirmacion  
from app.models.usuarios import obtener_email_usuario 
from app.models.payments import obtener_orden, registrar_pago, obtener_ordenes_usuario, cancelar_orden

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

# ── Nuevo endpoint para obtener todas las órdenes de un usuario ──
@router.get("/api/v1/orders")
def get_user_orders(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    return obtener_ordenes_usuario(id_usuario)

# ── Nuevo endpoint de confirmación por correo ──
@router.post("/api/v1/orders/{id_orden}/send-confirmation")
async def send_order_confirmation(id_orden: int, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])

    orden = obtener_orden(id_usuario, id_orden)
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    email = obtener_email_usuario(id_usuario)
    if not email:
        raise HTTPException(status_code=404, detail="Email del usuario no encontrado")

    await enviar_email_confirmacion(email, orden)
    return {"ok": True, "message": "Correo de confirmación enviado"}


# ── Endpoint para cancelar una orden ──
@router.delete("/api/v1/orders/{id_orden}")
def cancel_order(id_orden: int, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    resultado = cancelar_orden(id_usuario, id_orden)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado

