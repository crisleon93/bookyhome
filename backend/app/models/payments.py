import json
import os
from datetime import datetime

STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
ORDER_FILE = os.path.join(STORAGE_DIR, 'orders.json')
PAYMENT_FILE = os.path.join(STORAGE_DIR, 'payments.json')

os.makedirs(STORAGE_DIR, exist_ok=True)


def _load_store(path):
    if not os.path.exists(path):
        return {}
    try:
        with open(path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception:
        return {}


def _save_store(path, data):
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def obtener_orden(id_usuario, id_orden):
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    for order in user_orders:
        if order.get('id_orden') == int(id_orden):
            return order
    return None

def obtener_ordenes_usuario(id_usuario):
    from app.models.envios import limpiar_envios_no_pagados
    limpiar_envios_no_pagados()
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    return sorted(user_orders, key=lambda o: o.get('fecha', ''), reverse=True)


def registrar_pago(id_usuario, id_orden, amount, payment_method, coupon_code=None):
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])

    target_order = None
    for order in user_orders:
        if order.get('id_orden') == int(id_orden):
            target_order = order
            break

    if not target_order:
        return {'ok': False, 'error': 'Orden no encontrada'}

    if target_order.get('estado') != 'pendiente':
        return {'ok': False, 'error': f'La orden ya se encuentra en estado: {target_order.get("estado")}'}

    order_total = float(target_order.get('total', 0))
    amount_paid = float(amount)

    # Aceptar monto igual al total o menor (si hay cupón aplicado)
    if amount_paid > order_total + 0.01:
        return {'ok': False, 'error': f'El monto enviado ({amount_paid}) supera el total de la orden ({order_total})'}

    # Actualizar estado de la orden
    target_order['estado'] = 'pagado'
    target_order['metodo_pago'] = payment_method
    if coupon_code:
        target_order['cupon_aplicado'] = coupon_code
        target_order['total_con_descuento'] = amount_paid
    orders[str(id_usuario)] = user_orders
    _save_store(ORDER_FILE, orders)

    # Registrar el pago
    payments = _load_store(PAYMENT_FILE)
    payment_id = len(payments) + 1
    transaction = {
        'id_pago': payment_id,
        'id_usuario': id_usuario,
        'id_orden': id_orden,
        'monto': amount_paid,
        'metodo_pago': payment_method,
        'fecha_pago': datetime.utcnow().isoformat() + 'Z',
        'estado': 'aprobado'
    }
    
    if isinstance(payments, dict):
        payments = []
    
    payments.append(transaction)
    _save_store(PAYMENT_FILE, payments)

    return {'ok': True, 'transaction': transaction}


def cancelar_orden(id_usuario, id_orden):
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])

    target_order = None
    for order in user_orders:
        if order.get('id_orden') == int(id_orden):
            target_order = order
            break

    if not target_order:
        return {'ok': False, 'error': 'Orden no encontrada'}

    if target_order.get('estado') != 'pendiente':
        return {'ok': False, 'error': f'Solo se pueden cancelar órdenes en estado pendiente. Estado actual: {target_order.get("estado")}'}

    # Eliminar la orden de la lista
    user_orders = [o for o in user_orders if o.get('id_orden') != int(id_orden)]
    orders[str(id_usuario)] = user_orders
    _save_store(ORDER_FILE, orders)

    return {'ok': True, 'message': 'Orden cancelada exitosamente'}
