from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import verify_token
from app.schemas import PagoRequest
from app.schemas import CancelacionOrdenRequest
from app.models.payments import (
    obtener_orden,
    registrar_pago,
    obtener_ordenes_usuario,
    cancelar_orden,
    reservar_retiro,
    notificar_llegada_tienda,
    habilitar_pago_retiro,
    confirmar_entrega_retiro,
)
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
    tipo_entrega = getattr(data, 'tipo_entrega', None)
    id_direccion = getattr(data, 'id_direccion', None)

    # Validar dirección si el método de entrega es domicilio
    if tipo_entrega == 'domicilio' and not id_direccion:
        raise HTTPException(status_code=400, detail="Selecciona una dirección de entrega para envío a domicilio")

    resultado = registrar_pago(
        id_usuario=id_usuario,
        id_orden=data.order_id,
        amount=data.amount,
        payment_method=data.payment_method,
        coupon_code=coupon_code,
        tipo_entrega=tipo_entrega,
        id_direccion=id_direccion,
    )
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    
    # No duplicar el ingreso financiero cuando el cliente repite la solicitud.
    if not resultado.get("already_paid"):
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


@router.get("/api/v1/orders/{id_orden}/vendedor-transferencia")
def get_order_seller_transfer_details(id_orden: int, user=Depends(get_current_user)):
    """
    Obtiene los datos bancarios de la tienda/vendedor al que el comprador
    debe realizar la transferencia bancaria para pagar la orden.
    """
    id_usuario = int(user["sub"])
    orden = obtener_orden(id_usuario, id_orden)
    items = (orden or {}).get("items", [])
    id_libros = [it.get("id_libro") for it in items if it.get("id_libro")]

    # Fallback 1: Buscar en MySQL detalle_orden
    if not id_libros:
        try:
            from app.database import get_db
            db = get_db()
            cur = db.cursor(dictionary=True)
            cur.execute("""
                SELECT do.id_libro
                FROM detalle_orden do
                JOIN ordenes_compra oc ON oc.id_orden = do.id_orden
                WHERE oc.id_orden = %s OR oc.id_orden = (
                    SELECT id_orden FROM ordenes_compra WHERE id_usuario = %s ORDER BY id_orden DESC LIMIT 1
                )
            """, (id_orden, id_usuario))
            rows = cur.fetchall()
            id_libros = [r["id_libro"] for r in rows if r.get("id_libro")]
            cur.close()
            db.close()
        except Exception:
            pass

    # Fallback 2: Buscar en el carrito del usuario
    if not id_libros:
        try:
            from app.models.carrito import obtener_carrito
            cart = obtener_carrito(id_usuario)
            id_libros = [it.get("id_libro") for it in cart if it.get("id_libro")]
        except Exception:
            pass

    if not id_libros:
        return {"ok": True, "vendedores": []}

    try:
        from app.database import get_db
        db = get_db()
        cur = db.cursor(dictionary=True)

        format_strings = ','.join(['%s'] * len(id_libros))
        cur.execute(f"""
            SELECT DISTINCT t.id_tienda, t.nombre_tienda, t.id_usuario AS id_vendedor, u.nombre_usuario
            FROM libros l
            JOIN tiendas t ON t.id_tienda = l.id_tienda
            LEFT JOIN usuarios u ON u.id_usuario = t.id_usuario
            WHERE l.id_libro IN ({format_strings})
        """, tuple(id_libros))
        tiendas = cur.fetchall()

        vendedores = []
        for tienda in tiendas:
            id_tienda = tienda["id_tienda"]
            cur.execute("""
                SELECT id_metodo, tipo_cuenta, banco, numero_cuenta, 
                       nombre_titular, cedula_titular, es_principal, verificado
                FROM metodos_cobro_vendedor
                WHERE id_tienda = %s
                ORDER BY es_principal DESC, fecha_registro ASC
            """, (id_tienda,))
            cuentas = cur.fetchall()

            cuenta_principal = next((c for c in cuentas if c.get("es_principal")), cuentas[0] if cuentas else None)

            vendedores.append({
                "id_tienda": id_tienda,
                "nombre_tienda": tienda.get("nombre_tienda") or "Librería Aliada",
                "id_vendedor": tienda.get("id_vendedor"),
                "vendedor_nombre": tienda.get("nombre_usuario") or tienda.get("nombre_tienda"),
                "tiene_cuenta": cuenta_principal is not None,
                "cuenta": cuenta_principal,
                "cuentas": cuentas
            })

        cur.close()
        db.close()
        return {"ok": True, "vendedores": vendedores}
    except Exception as e:
        return {"ok": False, "error": str(e), "vendedores": []}


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
    return {"ok": True, "message": "Comprobante de compra enviado al correo"}


# ── Endpoint para cancelar una orden ──
@router.delete("/api/v1/orders/{id_orden}")
def cancel_order(id_orden: int, data: CancelacionOrdenRequest | None = None, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    motivo = (data.motivo if data and getattr(data, 'motivo', None) else "Cancelación solicitada por el comprador").strip()
    resultado = cancelar_orden(id_usuario, id_orden, motivo)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado


# ── Endpoints Retiro en Tienda (Click & Collect) ──
@router.post("/api/v1/orders/{id_orden}/reservar-retiro")
def reserve_store_pickup(id_orden: int, data: dict | None = None, user=Depends(get_current_user)):
    """El comprador confirma la reserva de su ejemplar para retiro en tienda física."""
    id_usuario = int(user["sub"])
    metodo_pago = (data or {}).get("metodo_pago", "Efectivo en Tienda")
    resultado = reservar_retiro(id_usuario, id_orden, metodo_pago)
    return resultado


@router.post("/api/v1/orders/{id_orden}/llegada-tienda")
def notify_store_arrival(id_orden: int, user=Depends(get_current_user)):
    """El comprador notifica que ya se encuentra en el local de la librería."""
    id_usuario = int(user["sub"])
    resultado = notificar_llegada_tienda(id_usuario, id_orden)
    return resultado


@router.post("/api/v1/orders/{id_orden}/habilitar-pago-retiro")
def enable_pickup_payment(id_orden: int, user=Depends(get_current_user)):
    """El vendedor verifica al comprador en su local y habilita el botón de pago."""
    id_usuario = int(user["sub"])
    resultado = habilitar_pago_retiro(id_usuario, id_orden)
    return resultado


@router.post("/api/v1/orders/{id_orden}/confirmar-entrega-retiro")
def confirm_pickup_delivery(id_orden: int, data: dict | None = None, user=Depends(get_current_user)):
    """El vendedor confirma la entrega del libro físico (y el cobro si fue en efectivo)."""
    id_usuario = int(user["sub"])
    es_efectivo = bool((data or {}).get("es_efectivo", False))
    resultado = confirmar_entrega_retiro(id_usuario, id_orden, es_efectivo)
    return resultado




# ── Cancelar TODAS las órdenes pendientes del usuario autenticado ──────────────
# Se usa para limpiar órdenes huérfanas que quedaron de sesiones anteriores
# (p.ej. el usuario llegó al checkout por "Comprar Ahora" pero no completó el pago).
@router.post("/api/v1/orders/cancelar-mis-pendientes")
def cancelar_mis_pendientes(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    motivo = "Sesión de compra abandonada"

    canceladas = 0
    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            # Obtener los ids de las órdenes pendientes de este usuario
            cursor.execute(
                "SELECT id_orden FROM ordenes_compra WHERE id_usuario = %s AND estado_orden = 'pendiente'",
                (id_usuario,)
            )
            rows = cursor.fetchall()
            ids_pendientes = [r["id_orden"] for r in rows]

            if ids_pendientes:
                placeholders = ",".join(["%s"] * len(ids_pendientes))
                cursor.execute(
                    f"UPDATE ordenes_compra SET estado_orden = 'cancelada' WHERE id_orden IN ({placeholders})",
                    ids_pendientes
                )
                db.commit()
                canceladas = cursor.rowcount
        finally:
            cursor.close()
            db.close()
    except Exception as e:
        print(f"Error cancelando órdenes pendientes en BD: {e}")
        raise HTTPException(status_code=500, detail="Error al cancelar órdenes pendientes")

    # Sincronizar el JSON store
    try:
        from app.models.payments import _load_store, _save_store, ORDER_FILE
        orders_data = _load_store(ORDER_FILE)
        user_orders = orders_data.get(str(id_usuario), [])
        for order in user_orders:
            if order.get("estado") in ("pendiente", "pendiente de pago") or \
               str(order.get("estado_orden", "")).lower().startswith("pend"):
                order["estado"] = "cancelada"
                order["estado_orden"] = "cancelada"
                order["motivo_cancelacion"] = motivo
        orders_data[str(id_usuario)] = user_orders
        _save_store(ORDER_FILE, orders_data)
    except Exception as e:
        print(f"Error sincronizando JSON store tras cancelar pendientes: {e}")

    return {"ok": True, "canceladas": canceladas}


# ── Recalcular y actualizar costo_envio de una orden según tipo_entrega final ─
@router.post("/api/v1/orders/{id_orden}/actualizar-envio")
def actualizar_costo_envio(id_orden: int, data: dict | None = None, user=Depends(get_current_user)):
    """
    Recalcula el costo_envio real de la orden usando la tarifa de la tienda
    y el tipo_entrega que el usuario eligió en el Paso 2 del checkout.
    Actualiza total = subtotal + costo_envio en la BD y en el JSON store.
    """
    id_usuario = int(user["sub"])
    tipo_entrega = (data or {}).get("tipo_entrega", "domicilio")

    try:
        from app.database import get_db
        from app.models.payments import _load_store, _save_store, ORDER_FILE
        from app.models.tienda_configuracion import obtener_tarifa_envio, obtener_id_tienda_de_libro

        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            # Obtener items de la orden para saber la tienda
            cursor.execute("""
                SELECT do.id_libro, l.id_tienda
                FROM detalle_orden do
                JOIN libros l ON l.id_libro = do.id_libro
                WHERE do.id_orden = %s
                LIMIT 1
            """, (id_orden,))
            item = cursor.fetchone()
            if not item:
                return {"ok": False, "error": "Orden no encontrada"}

            id_tienda = item["id_tienda"] or obtener_id_tienda_de_libro(item["id_libro"])
            costo_envio = 0.0
            if tipo_entrega != "retiro_tienda" and id_tienda:
                costo_envio = obtener_tarifa_envio(int(id_tienda))

            # Obtener subtotal actual
            cursor.execute("SELECT total, costo_envio FROM ordenes_compra WHERE id_orden = %s AND id_usuario = %s", (id_orden, id_usuario))
            row = cursor.fetchone()
            if not row:
                return {"ok": False, "error": "Orden no encontrada"}

            subtotal = float(row["total"]) - float(row["costo_envio"] or 0)
            nuevo_total = subtotal + costo_envio

            cursor.execute("""
                UPDATE ordenes_compra
                SET costo_envio = %s, total = %s, tipo_entrega = %s
                WHERE id_orden = %s AND id_usuario = %s
            """, (costo_envio, nuevo_total, tipo_entrega, id_orden, id_usuario))
            db.commit()

            # Sincronizar JSON store
            orders = _load_store(ORDER_FILE)
            user_orders = orders.get(str(id_usuario), [])
            for o in user_orders:
                if o.get("id_orden_db") == id_orden or o.get("id_orden") == id_orden:
                    o["costo_envio"] = costo_envio
                    o["subtotal"] = subtotal
                    o["total"] = nuevo_total
                    o["tipo_entrega"] = tipo_entrega
            orders[str(id_usuario)] = user_orders
            _save_store(ORDER_FILE, orders)

            return {"ok": True, "costo_envio": costo_envio, "total": nuevo_total}
        finally:
            cursor.close()
            db.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
