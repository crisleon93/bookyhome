import json
import os
import uuid
from datetime import datetime
from app.database import get_db

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

    # Validar que el usuario tenga al menos una dirección de envío
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        query_direccion = """
            SELECT id_direccion FROM direcciones_envio 
            WHERE id_usuario = %s 
            LIMIT 1
        """
        cursor.execute(query_direccion, (id_usuario,))
        direccion = cursor.fetchone()
        
        if not direccion:
            return {'ok': False, 'error': 'Debes agregar al menos una dirección de envío antes de realizar tu compra'}
            
    except Exception as e:
        return {'ok': False, 'error': 'Error al validar dirección de envío'}
    finally:
        cursor.close()
        db.close()

    # Usar el método original (archivos JSON) para el checkout
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
    
    # También guardar en base de datos para estadísticas
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # Obtener dirección del usuario
        query_direccion = """
            SELECT id_direccion FROM direcciones_envio 
            WHERE id_usuario = %s 
            LIMIT 1
        """
        cursor.execute(query_direccion, (id_usuario,))
        direccion = cursor.fetchone()
        id_direccion = direccion['id_direccion'] if direccion else 1
        
        # Insertar orden en base de datos
        query_orden = """
            INSERT INTO ordenes_compra (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden)
            VALUES (%s, %s, NOW(), %s, 'pendiente')
        """
        cursor.execute(query_orden, (id_usuario, id_direccion, total))
        id_orden = cursor.lastrowid
        
        # Insertar detalles
        for item in cart:
            try:
                query_detalle = """
                    INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final)
                    VALUES (%s, %s, %s, %s, 0, %s)
                """
                precio_final = item['precio_libro'] * item['cantidad']
                cursor.execute(query_detalle, (id_orden, item['id_libro'], item['cantidad'], item['precio_libro'], precio_final))
            except Exception:
                continue
        
        db.commit()
        
    except Exception:
        pass
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()
    
    vaciar_carrito(id_usuario)

    return {'ok': True, 'order': order}
