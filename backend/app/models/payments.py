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
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    return sorted(user_orders, key=lambda o: o.get('fecha', ''), reverse=True)


def registrar_pago(id_usuario, id_orden, amount, payment_method):
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

    if abs(float(target_order.get('total', 0)) - float(amount)) > 0.01:
        return {'ok': False, 'error': f'El monto enviado ({amount}) no coincide con el total de la orden ({target_order.get("total")})'}

    # Actualizar estado de la orden
    target_order['estado'] = 'pagado'
    target_order['metodo_pago'] = payment_method
    orders[str(id_usuario)] = user_orders
    _save_store(ORDER_FILE, orders)

    # Registrar el pago
    payments = _load_store(PAYMENT_FILE)
    payment_id = len(payments) + 1
    transaction = {
        'id_pago': payment_id,
        'id_usuario': id_usuario,
        'id_orden': id_orden,
        'monto': float(amount),
        'metodo_pago': payment_method,
        'fecha_pago': datetime.utcnow().isoformat() + 'Z',
        'estado': 'aprobado'
    }
    
    # Podemos guardar las transacciones indexadas por id_usuario o como una lista global.
    # Usemos lista global para reportar transacciones generales si es necesario.
    if isinstance(payments, dict):
        payments = []
    
    payments.append(transaction)
    _save_store(PAYMENT_FILE, payments)

    return {'ok': True, 'transaction': transaction}
