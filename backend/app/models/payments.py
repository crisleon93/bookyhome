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
    from app.models.envios import EMPRESAS_MENSAJERIA, limpiar_envios_no_pagados
    from app.database import get_db
    limpiar_envios_no_pagados()
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        # Traer todas las órdenes persistidas del comprador. Además de las
        # compras nuevas (que ya incluyen id_orden_db), esto permite recuperar
        # las órdenes históricas que se guardaron primero en orders.json.
        cursor.execute("""
            SELECT oc.id_orden, oc.estado_orden, oc.total, oc.fecha_orden,
                   e.id_empresa, e.empresa_mensajeria, e.numero_guia,
                   e.estado_envio, e.fecha_despacho, t.nombre_tienda, t.direccion,
                   GROUP_CONCAT(DISTINCT CONCAT(do.id_libro, ':', do.cantidad)
                                ORDER BY do.id_libro SEPARATOR ',') AS firma_items
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            LEFT JOIN envios e ON e.id_orden = oc.id_orden
            LEFT JOIN tiendas t ON t.id_tienda = e.id_tienda
            WHERE oc.id_usuario = %s
            GROUP BY oc.id_orden, oc.estado_orden, oc.total, oc.fecha_orden,
                     e.id_empresa, e.empresa_mensajeria, e.numero_guia,
                     e.estado_envio, e.fecha_despacho, t.nombre_tienda, t.direccion
            ORDER BY oc.fecha_orden DESC
        """, (id_usuario,))
        ordenes_db = cursor.fetchall()
        envios_por_orden = {row["id_orden"]: row for row in ordenes_db}

        def firma_items(items):
            return ",".join(sorted(
                f"{item.get('id_libro')}:{int(item.get('cantidad', 1))}"
                for item in items if item.get('id_libro') is not None
            ))

        # Compatibilidad: vincular automáticamente registros antiguos por sus
        # productos y total. Se consume cada coincidencia una sola vez para no
        # mezclar compras repetidas del mismo libro.
        ids_vinculados = {order.get("id_orden_db") for order in user_orders if order.get("id_orden_db") is not None}
        candidatos = [row for row in ordenes_db if row["id_orden"] not in ids_vinculados]
        vinculado = False
        for order in reversed(user_orders):
            if order.get("id_orden_db") is not None:
                continue
            firma = firma_items(order.get("items", []))
            total = float(order.get("total", 0) or 0)
            coincidencia = next((row for row in candidatos if firma and row["firma_items"] == firma and abs(float(row["total"] or 0) - total) < 0.01), None)
            if coincidencia:
                order["id_orden_db"] = coincidencia["id_orden"]
                candidatos.remove(coincidencia)
                vinculado = True

        if vinculado:
            orders[str(id_usuario)] = user_orders
            _save_store(ORDER_FILE, orders)

        for order in user_orders:
            order_db = envios_por_orden.get(order.get("id_orden_db"))
            if order_db:
                order["estado"] = order_db["estado_orden"]
                if order_db["numero_guia"]:
                    empresa = next(
                        (empresa for empresa in EMPRESAS_MENSAJERIA if empresa["id_empresa"] == order_db["id_empresa"]),
                        {},
                    )
                    envio_anterior = order.get("envio") or {}
                    origen = order_db["nombre_tienda"] or envio_anterior.get("origen") or "Tienda vendedora"
                    if order_db.get("direccion"):
                        origen = f"{origen} · {order_db['direccion']}"
                    order["envio"] = {
                        "id_empresa": order_db["id_empresa"],
                        "empresa_mensajeria": order_db["empresa_mensajeria"],
                        "numero_guia": order_db["numero_guia"],
                        "estado_envio": order_db["estado_envio"] or "Guía registrada",
                        "fecha_despacho": order_db["fecha_despacho"].isoformat() if hasattr(order_db["fecha_despacho"], "isoformat") else order_db["fecha_despacho"],
                        "fecha_despacho_con_hora": envio_anterior.get("fecha_despacho_con_hora") or envio_anterior.get("actualizado_en"),
                        "origen": origen,
                        "sitio_web": empresa.get("sitio_web"),
                        "url_rastreo": empresa.get("url_rastreo", empresa.get("sitio_web")),
                    }
            for item in order.get('items', []):
                if 'id_libro' in item and not item.get('nombre_tienda'):
                    cursor.execute("""
                        SELECT t.nombre_tienda 
                        FROM libros l
                        JOIN tiendas t ON l.id_tienda = t.id_tienda
                        WHERE l.id_libro = %s
                    """, (item['id_libro'],))
                    res = cursor.fetchone()
                    if res:
                        item['nombre_tienda'] = res['nombre_tienda']
    except Exception as e:
        print("Error obteniendo nombres de tiendas en ordenes:", e)
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()

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

    # Sincronizar estado en MySQL buscando por usuario + items coincidentes
    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            # Usar primero el identificador persistido al crear el checkout.
            # Así se actualiza exactamente la orden que visualiza el vendedor.
            id_orden_db = target_order.get('id_orden_db')
            id_libros = [item['id_libro'] for item in target_order.get('items', []) if item.get('id_libro')]
            if id_orden_db:
                cursor.execute(
                    "UPDATE ordenes_compra SET estado_orden = 'pagado' WHERE id_orden = %s AND id_usuario = %s",
                    (id_orden_db, id_usuario),
                )
                db.commit()
            elif id_libros:
                fmt = ','.join(['%s'] * len(id_libros))
                cursor.execute(f"""
                    SELECT DISTINCT oc.id_orden
                    FROM ordenes_compra oc
                    JOIN detalle_orden do ON do.id_orden = oc.id_orden
                    WHERE oc.id_usuario = %s
                      AND oc.estado_orden = 'pendiente'
                      AND do.id_libro IN ({fmt})
                    ORDER BY oc.fecha_orden DESC
                    LIMIT 1
                """, (id_usuario, *id_libros))
                row = cursor.fetchone()
                if row:
                    cursor.execute(
                        "UPDATE ordenes_compra SET estado_orden = 'pagado' WHERE id_orden = %s",
                        (row['id_orden'],)
                    )
                    db.commit()
        finally:
            cursor.close()
            db.close()
    except Exception as e:
        print(f"⚠️ No se pudo sincronizar estado de pago en MySQL: {e}")

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
