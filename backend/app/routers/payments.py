from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import verify_token
from app.schemas import PagoRequest
from app.models.payments import obtener_orden, registrar_pago, obtener_ordenes_usuario, cancelar_orden
from app.email import enviar_email_confirmacion  
from app.models.usuarios import obtener_email_usuario

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
    
    # Hook automático: Registrar ingreso en BookyPago Finanzas
    try:
        orden = obtener_orden(id_usuario, data.order_id)
        if orden and orden.get('estado') == 'pagado':
            # Obtener ID del vendedor desde el primer libro de la orden
            id_vendedor = id_usuario  # Fallback al comprador
            items = orden.get('items', [])
            if items and len(items) > 0:
                id_libro = items[0].get('id_libro')
                if id_libro:
                    # Buscar la tienda del libro para obtener el vendedor
                    from app.models.libro import obtener_libro_por_id
                    libro = obtener_libro_por_id(id_libro)
                    if libro and libro.get('id_tienda'):
                        from app.models.tiendas import obtener_tienda_por_id
                        tienda = obtener_tienda_por_id(libro['id_tienda'])
                        if tienda and tienda.get('id_usuario'):
                            id_vendedor = tienda['id_usuario']
            
            # Registrar ingreso de BookyHome por esta venta usando el modelo directamente
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
            
            resultado_finanzas = bookypago_finanzas_direct.registrar_ingreso_venta(
                id_venta=data.order_id,
                monto_venta=data.amount,
                id_vendedor=id_vendedor
            )
            
            if resultado_finanzas.get('ok'):
                print(f"Ingreso registrado exitosamente en BookyPago Finanzas: Venta #{data.order_id}")
            else:
                print(f"Error registrando ingreso en BookyPago Finanzas: {resultado_finanzas.get('error')}")
    except Exception as e:
        # No fallar el pago si falla el registro en finanzas, solo loggear
        print(f"Error registrando ingreso en BookyPago Finanzas: {e}")
    
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

