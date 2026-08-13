from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import verify_token
from app.schemas import PagoRequest
from app.models.payments import obtener_orden, registrar_pago, obtener_ordenes_usuario, cancelar_orden
from app.email import enviar_email_confirmacion  
from app.models.usuarios import obtener_email_usuario
from app.utils.finance_hooks import registrar_ingreso_venta

router = APIRouter()


def _resolver_vendedor(id_usuario_comprador: int, id_orden: int) -> int:
    """
    Intenta obtener el id_usuario del vendedor a partir del primer libro
    de la orden. Si no puede, devuelve el id del comprador como fallback
    (el ingreso se registra igual; el campo vendedor es informativo).
    """
    try:
        orden = obtener_orden(id_usuario_comprador, id_orden)
        items = (orden or {}).get("items", [])
        if items:
            id_libro = items[0].get("id_libro")
            if id_libro:
                from app.models.libro import obtener_libro_por_id
                libro = obtener_libro_por_id(id_libro)
                if libro and libro.get("id_tienda"):
                    from app.models.tiendas import obtener_tienda_por_id
                    tienda = obtener_tienda_por_id(libro["id_tienda"])
                    if tienda and tienda.get("id_usuario"):
                        return int(tienda["id_usuario"])
    except Exception:
        pass
    return id_usuario_comprador
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
    coupon_code = getattr(data, 'coupon_code', None)
    resultado = registrar_pago(
        id_usuario=id_usuario,
        id_orden=data.order_id,
        amount=data.amount,
        payment_method=data.payment_method,
        coupon_code=coupon_code
    )
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    
    # Registro automático de ingreso en BookyPago Finanzas
    id_vendedor = _resolver_vendedor(id_usuario, data.order_id)
    registrar_ingreso_venta(
        id_venta=data.order_id,
        monto_venta=data.amount,
        id_vendedor=id_vendedor,
    )
    
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

# ── Endpoint admin: todas las órdenes de todos los usuarios ──
@router.get("/api/v1/admin/orders")
def get_all_orders_admin(user=Depends(get_current_user)):
    from app.models.payments import _load_store, ORDER_FILE
    rol = user.get("rol", "")
    if rol not in ("admin", "administrador"):
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores")
    orders_data = _load_store(ORDER_FILE)
    todas = []
    for uid, user_orders in orders_data.items():
        for orden in user_orders:
            todas.append({**orden, "id_usuario_propietario": int(uid)})
    return sorted(todas, key=lambda o: o.get("fecha", ""), reverse=True)

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

