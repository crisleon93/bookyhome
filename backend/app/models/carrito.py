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
    user_cart = store.get(str(id_usuario), [])
    
    # Auto-completar datos si algún libro no tiene imagen, título, precio o tienda
    updated = False
    for item in user_cart:
        needs_update = (
            not item.get('imagen') or
            not item.get('titulo') or
            float(item.get('precio_libro') or 0) <= 0 or
            not item.get('id_tienda')
        )
        if needs_update:
            try:
                from app.models.libro import obtener_libro_por_id
                libro_db = obtener_libro_por_id(int(item['id_libro']))
                if libro_db:
                    item['titulo'] = item.get('titulo') or libro_db.get('titulo', '')
                    item['autor_libro'] = item.get('autor_libro') or libro_db.get('autor_libro', '')
                    item['precio_libro'] = float(item.get('precio_libro') or 0) or float(libro_db.get('precio_libro', 0))
                    if not item.get('imagen'):
                        imagenes = libro_db.get('imagenes') or []
                        item['imagen'] = imagenes[0] if imagenes else libro_db.get('imagen_url')
                    if not item.get('id_tienda') and libro_db.get('id_tienda'):
                        item['id_tienda'] = libro_db['id_tienda']
                        item['nombre_tienda'] = libro_db.get('nombre_tienda', '')
                    updated = True
            except Exception:
                pass

    if updated:
        store[str(id_usuario)] = user_cart
        _save_store(CART_FILE, store)

    return user_cart



def agregar_al_carrito(id_usuario, item):
    store = _load_store(CART_FILE)
    user_key = str(id_usuario)
    user_cart = store.get(user_key, [])

    # Validar y auto-completar datos si faltan
    titulo = item.get('titulo', '')
    autor = item.get('autor_libro', '')
    precio = float(item.get('precio_libro') or 0)
    imagen = item.get('imagen')

    if not titulo or precio <= 0:
        try:
            from app.models.libro import obtener_libro_por_id
            libro_db = obtener_libro_por_id(int(item['id_libro']))
            if libro_db:
                titulo = titulo or libro_db.get('titulo', '')
                autor = autor or libro_db.get('autor_libro', '')
                precio = precio if precio > 0 else float(libro_db.get('precio_libro', 0))
                if not imagen:
                    imagenes = libro_db.get('imagenes') or []
                    imagen = imagenes[0] if imagenes else libro_db.get('imagen_url')
        except Exception:
            pass

    existing = next((entry for entry in user_cart if entry['id_libro'] == item['id_libro']), None)
    if existing:
        existing['cantidad'] = max(1, existing.get('cantidad', 1) + item.get('cantidad', 1))
        if not existing.get('titulo') or float(existing.get('precio_libro') or 0) <= 0:
            existing['titulo'] = titulo or existing.get('titulo')
            existing['autor_libro'] = autor or existing.get('autor_libro')
            existing['precio_libro'] = precio if precio > 0 else existing.get('precio_libro', 0)
            existing['imagen'] = imagen or existing.get('imagen')
    else:
        user_cart.append({
            'id_libro': item['id_libro'],
            'titulo': titulo,
            'autor_libro': autor,
            'precio_libro': precio,
            'cantidad': max(1, int(item.get('cantidad', 1))),
            'imagen': imagen,
            'id_variante': item.get('id_variante'),
            'variante_label': item.get('variante_label'),
            'id_tienda': item.get('id_tienda'),
            'nombre_tienda': item.get('nombre_tienda', ''),
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


def checkout_carrito(id_usuario, id_direccion=None, tipo_entrega='domicilio'):
    cart = obtener_carrito(id_usuario)
    if not cart:
        return {'ok': False, 'error': 'El carrito está vacío'}

    # Nota: la validación de dirección y método de entrega se hace en el Paso 2 del frontend (al pagar)

    # Calcular subtotal de libros
    subtotal = sum(item['precio_libro'] * item['cantidad'] for item in cart)

    # Calcular costo de envío: tarifa fija de la tienda del primer libro del carrito.
    # Si es retiro en tienda, el envío es siempre $0.
    costo_envio = 0.0
    if tipo_entrega != 'retiro_tienda':
        try:
            from app.models.tienda_configuracion import obtener_tarifa_envio, obtener_id_tienda_de_libro
            primer_id_libro = cart[0].get('id_libro') if cart else None
            if primer_id_libro:
                # Si el item ya trae id_tienda, usarlo directamente
                id_tienda = cart[0].get('id_tienda') or obtener_id_tienda_de_libro(int(primer_id_libro))
                if id_tienda:
                    costo_envio = obtener_tarifa_envio(int(id_tienda))
        except Exception as e:
            print(f"[checkout_carrito] No se pudo obtener tarifa_envio: {e}")

    total = subtotal + costo_envio

    # Usar el método original (archivos JSON) para el checkout
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    order_id = len(user_orders) + 1
    import random
    from datetime import timedelta

    es_retiro = (tipo_entrega == 'retiro_tienda')
    pin_retiro = f"{random.randint(1000, 9999)}" if es_retiro else None
    estado_retiro = 'reservado' if es_retiro else None
    fecha_limite = (datetime.utcnow() + timedelta(hours=48)).isoformat() + 'Z' if es_retiro else None

    order = {
        'id_orden': order_id,
        'codigo_compra': f"BH-{uuid.uuid4().hex[:10].upper()}",
        'fecha': datetime.utcnow().isoformat() + 'Z',
        'items': cart,
        'subtotal': subtotal,
        'costo_envio': costo_envio,
        'total': total,
        'estado': 'pendiente',
        'tipo_entrega': tipo_entrega,
        'pin_retiro': pin_retiro,
        'estado_retiro': estado_retiro,
        'fecha_limite_retiro': fecha_limite
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
            WHERE id_usuario = %s AND (%s IS NULL OR id_direccion = %s)
            LIMIT 1
        """
        cursor.execute(query_direccion, (id_usuario, id_direccion, id_direccion))
        direccion = cursor.fetchone()
        id_direccion = direccion['id_direccion'] if direccion else 1
        
        # Insertar orden en base de datos
        query_orden = """
            INSERT INTO ordenes_compra (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden, tipo_entrega, estado_retiro, pin_retiro, fecha_limite_retiro, costo_envio)
            VALUES (%s, %s, NOW(), %s, 'pendiente', %s, %s, %s, DATE_ADD(NOW(), INTERVAL 48 HOUR), %s)
        """
        cursor.execute(query_orden, (id_usuario, id_direccion, total, tipo_entrega, estado_retiro, pin_retiro, costo_envio))
        id_orden = cursor.lastrowid
        # Vincular la orden local del comprador con la orden persistida en MySQL.
        order['id_orden_db'] = id_orden
        
        # Insertar detalles
        for item in cart:
            try:
                query_detalle = """
                    INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final, id_variante)
                    VALUES (%s, %s, %s, %s, 0, %s, %s)
                """
                precio_final = item['precio_libro'] * item['cantidad']
                id_variante = item.get('id_variante')
                cursor.execute(query_detalle, (id_orden, item['id_libro'], item['cantidad'], item['precio_libro'], precio_final, id_variante))
            except Exception:
                continue
        
        db.commit()
        orders[str(id_usuario)] = user_orders
        _save_store(ORDER_FILE, orders)
        
    except Exception:
        pass
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()
    
    vaciar_carrito(id_usuario)

    return {'ok': True, 'order': order}


def crear_orden_directa(id_usuario, item_libro, id_direccion=None, tipo_entrega='domicilio'):
    """
    Crea una orden directamente para compra inmediata ('Comprar ahora')
    SIN modificar ni vaciar el carrito del usuario.
    """
    if not item_libro or not item_libro.get('id_libro'):
        return {'ok': False, 'error': 'Datos del libro no proporcionados'}
        
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    order_id = len(user_orders) + 1
    
    cantidad = int(item_libro.get('cantidad', 1))
    precio = float(item_libro.get('precio_libro', 0) or item_libro.get('precio', 0))
    subtotal = precio * cantidad

    # Calcular costo de envío fijo de la tienda (0 si es retiro)
    costo_envio = 0.0
    if tipo_entrega != 'retiro_tienda':
        try:
            from app.models.tienda_configuracion import obtener_tarifa_envio, obtener_id_tienda_de_libro
            id_tienda = item_libro.get('id_tienda') or obtener_id_tienda_de_libro(int(item_libro['id_libro']))
            if id_tienda:
                costo_envio = obtener_tarifa_envio(int(id_tienda))
        except Exception as e:
            print(f"[crear_orden_directa] No se pudo obtener tarifa_envio: {e}")

    total = subtotal + costo_envio

    import random
    from datetime import timedelta

    es_retiro = (tipo_entrega == 'retiro_tienda')
    pin_retiro = f"{random.randint(1000, 9999)}" if es_retiro else None
    estado_retiro = 'reservado' if es_retiro else None
    fecha_limite = (datetime.utcnow() + timedelta(hours=48)).isoformat() + 'Z' if es_retiro else None

    item = {
        'id_libro': int(item_libro['id_libro']),
        'cantidad': cantidad,
        'precio_libro': precio,
        'titulo': item_libro.get('titulo', 'Libro'),
        'autor_libro': item_libro.get('autor_libro') or item_libro.get('autor', ''),
        'imagen': item_libro.get('imagen') or item_libro.get('imagen_url') or item_libro.get('imagen_principal'),
        'id_variante': item_libro.get('id_variante')
    }

    order = {
        'id_orden': order_id,
        'codigo_compra': f"BH-{uuid.uuid4().hex[:10].upper()}",
        'fecha': datetime.utcnow().isoformat() + 'Z',
        'items': [item],
        'subtotal': subtotal,
        'costo_envio': costo_envio,
        'total': total,
        'estado': 'pendiente',
        'tipo_entrega': tipo_entrega,
        'pin_retiro': pin_retiro,
        'estado_retiro': estado_retiro,
        'fecha_limite_retiro': fecha_limite
    }

    user_orders.append(order)
    orders[str(id_usuario)] = user_orders
    _save_store(ORDER_FILE, orders)
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        query_direccion = """
            SELECT id_direccion FROM direcciones_envio
            WHERE id_usuario = %s AND (%s IS NULL OR id_direccion = %s)
            LIMIT 1
        """
        cursor.execute(query_direccion, (id_usuario, id_direccion, id_direccion))
        direccion = cursor.fetchone()
        id_dir = direccion['id_direccion'] if direccion else 1
        
        query_orden = """
            INSERT INTO ordenes_compra (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden, tipo_entrega, estado_retiro, pin_retiro, fecha_limite_retiro, costo_envio)
            VALUES (%s, %s, NOW(), %s, 'pendiente', %s, %s, %s, DATE_ADD(NOW(), INTERVAL 48 HOUR), %s)
        """
        cursor.execute(query_orden, (id_usuario, id_dir, total, tipo_entrega, estado_retiro, pin_retiro, costo_envio))
        id_orden_db = cursor.lastrowid
        order['id_orden_db'] = id_orden_db
        order['id_orden'] = id_orden_db

        query_detalle = """
            INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final, id_variante)
            VALUES (%s, %s, %s, %s, 0, %s, %s)
        """
        cursor.execute(query_detalle, (id_orden_db, item['id_libro'], cantidad, precio, total, item.get('id_variante')))
        db.commit()

        orders[str(id_usuario)] = user_orders
        _save_store(ORDER_FILE, orders)
    except Exception as e:
        print(f"Error guardando orden directa en DB: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()
            
    # IMPORTANTE: NO SE VACÍA el carrito completo, pero SÍ se elimina
    # el libro comprado si estaba previamente en el carrito (evita "fantasmas").
    try:
        cart_store = _load_store(CART_FILE)
        user_key = str(id_usuario)
        user_cart = cart_store.get(user_key, [])
        original_len = len(user_cart)
        user_cart = [c for c in user_cart if c.get('id_libro') != int(item_libro['id_libro'])]
        if len(user_cart) != original_len:
            cart_store[user_key] = user_cart
            _save_store(CART_FILE, cart_store)
    except Exception:
        pass

    return {'ok': True, 'order': order}
