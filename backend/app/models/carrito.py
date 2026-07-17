import json
import os
import uuid
from datetime import datetime

STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
CART_FILE = os.path.join(STORAGE_DIR, 'cart_store.json')
ORDER_FILE = os.path.join(STORAGE_DIR, 'orders.json')

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


def obtener_carrito(id_usuario):
    store = _load_store(CART_FILE)
    return store.get(str(id_usuario), [])


def agregar_al_carrito(id_usuario, item):
    store = _load_store(CART_FILE)
    user_key = str(id_usuario)
    user_cart = store.get(user_key, [])

    existing = next((entry for entry in user_cart if entry['id_libro'] == item['id_libro']), None)
    if existing:
        existing['cantidad'] = max(1, existing.get('cantidad', 1) + item.get('cantidad', 1))
    else:
        user_cart.append({
            'id_libro': item['id_libro'],
            'titulo': item.get('titulo', ''),
            'autor_libro': item.get('autor_libro', ''),
            'precio_libro': float(item.get('precio_libro', 0)),
            'cantidad': max(1, int(item.get('cantidad', 1))),
            'imagen': item.get('imagen')
        })

    store[user_key] = user_cart
    _save_store(CART_FILE, store)
    return user_cart


def eliminar_item_carrito(id_usuario, id_libro):
    store = _load_store(CART_FILE)
    user_key = str(id_usuario)
    user_cart = store.get(user_key, [])
    next_cart = [item for item in user_cart if item['id_libro'] != id_libro]
    store[user_key] = next_cart
    _save_store(CART_FILE, store)
    return next_cart


def vaciar_carrito(id_usuario):
    store = _load_store(CART_FILE)
    store[str(id_usuario)] = []
    _save_store(CART_FILE, store)
    return []


def checkout_carrito(id_usuario):
    cart = obtener_carrito(id_usuario)
    if not cart:
        return {'ok': False, 'error': 'El carrito está vacío'}

    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    order_id = len(user_orders) + 1
    total = sum(item['precio_libro'] * item['cantidad'] for item in cart)

    order = {
        'id_orden': order_id,
        'codigo_compra': f"BH-{uuid.uuid4().hex[:10].upper()}",
        'fecha': datetime.utcnow().isoformat() + 'Z',
        'items': cart,
        'total': total,
        'estado': 'pendiente'
    }

    user_orders.append(order)
    orders[str(id_usuario)] = user_orders
    _save_store(ORDER_FILE, orders)
    vaciar_carrito(id_usuario)

    return {'ok': True, 'order': order}
