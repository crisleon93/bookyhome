import json
import os
from datetime import datetime

STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
ORDER_FILE = os.path.join(STORAGE_DIR, 'orders.json')
PAYMENT_FILE = os.path.join(STORAGE_DIR, 'payments.json')

os.makedirs(STORAGE_DIR, exist_ok=True)


def _normalizar_estado(estado):
    """Normaliza variantes de estado al estándar del sistema (masculino para pagado/enviado, entregada para entrega)."""
    if not estado:
        return estado
    mapa = {
        'pagada': 'pagado',
        'enviada': 'enviado',
        'entregado': 'entregada',   # retiro en tienda también usa 'entregada'
        'cancelado': 'cancelada',
        'Pagada': 'pagado',
        'Pagado': 'pagado',
        'Enviada': 'enviado',
        'Enviado': 'enviado',
        'Entregada': 'entregada',
        'Entregado': 'entregada',
        'Cancelado': 'cancelada',
        'Cancelada': 'cancelada',
        'Procesando': 'pagado',
    }
    return mapa.get(estado, estado.lower() if estado else estado)


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
    target = None
    for order in user_orders:
        if order.get('id_orden') == int(id_orden) or order.get('id_orden_db') == int(id_orden):
            target = order
            break

    # Sincronizar campos frescos de BD si existe
    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT oc.id_orden, oc.estado_orden, oc.total, oc.tipo_entrega,
                   oc.estado_retiro, oc.pin_retiro, oc.fecha_limite_retiro, oc.metodo_pago,
                   t.nombre_tienda, t.direccion AS direccion_tienda, t.telefono AS telefono_tienda
            FROM ordenes_compra oc
            LEFT JOIN detalle_orden do ON do.id_orden = oc.id_orden
            LEFT JOIN libros l ON l.id_libro = do.id_libro
            LEFT JOIN tiendas t ON t.id_tienda = l.id_tienda
            WHERE (oc.id_orden = %s OR oc.id_orden = %s) AND oc.id_usuario = %s
            LIMIT 1
        """, (int(id_orden), int(target.get('id_orden_db', id_orden) if target else id_orden), int(id_usuario)))
        row = cursor.fetchone()
        if row:
            if not target:
                target = {
                    "id_orden": row["id_orden"],
                    "id_orden_db": row["id_orden"],
                    "estado": row["estado_orden"],
                    "estado_orden": row["estado_orden"],
                    "total": float(row["total"] or 0),
                    "items": []
                }
            target["estado"] = row["estado_orden"]
            target["estado_orden"] = row["estado_orden"]
            if row.get("metodo_pago"): target["metodo_pago"] = row["metodo_pago"]
            if row.get("tipo_entrega"): target["tipo_entrega"] = row["tipo_entrega"]
            if row.get("estado_retiro"): target["estado_retiro"] = row["estado_retiro"]
            if row.get("pin_retiro"): target["pin_retiro"] = row["pin_retiro"]
            if row.get("fecha_limite_retiro"):
                target["fecha_limite_retiro"] = row["fecha_limite_retiro"].isoformat() if hasattr(row["fecha_limite_retiro"], "isoformat") else row["fecha_limite_retiro"]
            if row.get("nombre_tienda"):
                target["tienda_retiro"] = {
                    "nombre_tienda": row["nombre_tienda"],
                    "direccion": row.get("direccion_tienda") or "Punto principal de la librería",
                    "telefono": row.get("telefono_tienda") or ""
                }
        cursor.close()
        db.close()
    except Exception as e:
        print("Error sincronizando orden individual desde BD:", e)

    return target

def obtener_ordenes_usuario(id_usuario):
    from app.models.envios import EMPRESAS_MENSAJERIA, limpiar_envios_no_pagados
    from app.database import get_db
    limpiar_envios_no_pagados()
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        # Traer todas las órdenes persistidas del comprador con datos de tienda y retiro.
        cursor.execute("""
            SELECT oc.id_orden, oc.estado_orden, oc.total, oc.fecha_orden,
                   oc.tipo_entrega, oc.estado_retiro, oc.pin_retiro, oc.fecha_limite_retiro, oc.metodo_pago,
                   e.id_empresa, e.empresa_mensajeria, e.numero_guia,
                   e.estado_envio, e.fecha_despacho,
                   COALESCE(t_envio.nombre_tienda, t_libro.nombre_tienda) AS nombre_tienda,
                   COALESCE(t_envio.direccion, t_libro.direccion)         AS direccion,
                   COALESCE(t_envio.telefono, t_libro.telefono)           AS telefono_tienda,
                   GROUP_CONCAT(DISTINCT CONCAT(do.id_libro, ':', do.cantidad)
                                ORDER BY do.id_libro SEPARATOR ',') AS firma_items
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            LEFT JOIN libros l ON l.id_libro = do.id_libro
            LEFT JOIN tiendas t_libro ON t_libro.id_tienda = l.id_tienda
            LEFT JOIN envios e ON e.id_orden = oc.id_orden
            LEFT JOIN tiendas t_envio ON t_envio.id_tienda = e.id_tienda
            WHERE oc.id_usuario = %s
            GROUP BY oc.id_orden, oc.estado_orden, oc.total, oc.fecha_orden,
                     oc.tipo_entrega, oc.estado_retiro, oc.pin_retiro, oc.fecha_limite_retiro, oc.metodo_pago,
                     e.id_empresa, e.empresa_mensajeria, e.numero_guia,
                     e.estado_envio, e.fecha_despacho,
                     t_envio.nombre_tienda, t_libro.nombre_tienda,
                     t_envio.direccion, t_libro.direccion,
                     t_envio.telefono, t_libro.telefono
            ORDER BY oc.fecha_orden DESC
        """, (id_usuario,))
        ordenes_db = cursor.fetchall()
        envios_por_orden = {row["id_orden"]: row for row in ordenes_db}

        def firma_items(items):
            return ",".join(sorted(
                f"{item.get('id_libro')}:{int(item.get('cantidad', 1))}"
                for item in items if item.get('id_libro') is not None
            ))

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
                estado_normalizado = _normalizar_estado(order_db["estado_orden"])
                order["estado"] = estado_normalizado
                order["estado_orden"] = estado_normalizado
                if order_db.get("metodo_pago"):
                    order["metodo_pago"] = order_db["metodo_pago"]
                if order_db.get("tipo_entrega"):
                    order["tipo_entrega"] = order_db["tipo_entrega"]
                if order_db.get("estado_retiro"):
                    order["estado_retiro"] = order_db["estado_retiro"]
                if order_db.get("pin_retiro"):
                    order["pin_retiro"] = order_db["pin_retiro"]
                if order_db.get("fecha_limite_retiro"):
                    order["fecha_limite_retiro"] = order_db["fecha_limite_retiro"].isoformat() if hasattr(order_db["fecha_limite_retiro"], "isoformat") else order_db["fecha_limite_retiro"]
                
                if order_db.get("nombre_tienda"):
                    order["tienda_retiro"] = {
                        "nombre_tienda": order_db["nombre_tienda"],
                        "direccion": order_db.get("direccion") or "Punto de atención librería",
                        "telefono": order_db.get("telefono_tienda") or ""
                    }

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

        # Recuperar órdenes que existen en MySQL pero no tienen copia local.
        # Excluimos None del set para no saltar órdenes válidas.
        ids_locales = {order.get("id_orden_db") for order in user_orders if order.get("id_orden_db") is not None}
        for order_db in ordenes_db:
            if order_db["id_orden"] in ids_locales:
                continue
            cursor.execute("""
                SELECT do.id_libro, do.cantidad, do.precio_unitario,
                       do.precio_final, l.titulo, l.autor_libro,
                       t.nombre_tienda
                FROM detalle_orden do
                JOIN libros l ON l.id_libro = do.id_libro
                LEFT JOIN tiendas t ON t.id_tienda = l.id_tienda
                WHERE do.id_orden = %s
                ORDER BY do.id_detalle
            """, (order_db["id_orden"],))
            items = [
                {
                    "id_libro": item["id_libro"],
                    "titulo": item["titulo"],
                    "autor_libro": item["autor_libro"],
                    "cantidad": item["cantidad"],
                    "precio_libro": float(item["precio_unitario"] or 0),
                    "total": float(item["precio_final"] or 0),
                    "nombre_tienda": item["nombre_tienda"],
                }
                for item in cursor.fetchall()
            ]
            fecha = order_db["fecha_orden"]
            envio = None
            if order_db.get("numero_guia"):
                empresa = next(
                    (empresa for empresa in EMPRESAS_MENSAJERIA if empresa["id_empresa"] == order_db["id_empresa"]),
                    {},
                )
                envio = {
                    "id_empresa": order_db["id_empresa"],
                    "empresa_mensajeria": order_db["empresa_mensajeria"],
                    "numero_guia": order_db["numero_guia"],
                    "estado_envio": order_db["estado_envio"] or "Guía registrada",
                    "sitio_web": empresa.get("sitio_web"),
                    "url_rastreo": empresa.get("url_rastreo", empresa.get("sitio_web")),
                    "fecha_despacho": order_db["fecha_despacho"],
                    "origen": order_db["nombre_tienda"] or "Tienda vendedora",
                }
            
            fl = order_db.get("fecha_limite_retiro")
            estado_norm = _normalizar_estado(order_db["estado_orden"])
            user_orders.append({
                "id_orden": order_db["id_orden"],
                "id_orden_db": order_db["id_orden"],
                "fecha": fecha.isoformat() if hasattr(fecha, "isoformat") else fecha,
                "estado": estado_norm,
                "estado_orden": estado_norm,
                "metodo_pago": order_db.get("metodo_pago"),
                "tipo_entrega": order_db.get("tipo_entrega") or "domicilio",
                "estado_retiro": order_db.get("estado_retiro"),
                "pin_retiro": order_db.get("pin_retiro"),
                "fecha_limite_retiro": fl.isoformat() if fl and hasattr(fl, "isoformat") else fl,
                "tienda_retiro": {
                    "nombre_tienda": order_db.get("nombre_tienda"),
                    "direccion": order_db.get("direccion") or "Punto de atención librería",
                    "telefono": order_db.get("telefono_tienda") or ""
                } if order_db.get("nombre_tienda") else None,
                "total": float(order_db["total"] or 0),
                "items": items,
                "envio": envio,
            })
    except Exception as e:
        print("Error obteniendo nombres de tiendas en ordenes:", e)
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()

    # Deduplicar por id_orden_db antes de retornar — elimina duplicados que
    # pueden surgir cuando el JSON y MySQL tienen entradas para la misma orden.
    visto = set()
    user_orders_unicos = []
    for o in user_orders:
        key = o.get("id_orden_db") or o.get("id_orden")
        if key in visto:
            continue
        visto.add(key)
        user_orders_unicos.append(o)

    return sorted(user_orders_unicos, key=lambda o: o.get('fecha', ''), reverse=True)


def registrar_pago(id_usuario, id_orden, amount, payment_method, coupon_code=None, tipo_entrega=None, id_direccion=None):
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])

    target_order = None
    for order in user_orders:
        if order.get('id_orden') == int(id_orden) or order.get('id_orden_db') == int(id_orden):
            target_order = order
            break

    # Si no se encuentra en orders.json, buscar directamente en MySQL ordenes_compra
    if not target_order:
        try:
            from app.database import get_db
            db_conn = get_db()
            cur_lookup = db_conn.cursor(dictionary=True)
            cur_lookup.execute(
                "SELECT * FROM ordenes_compra WHERE id_orden = %s AND id_usuario = %s",
                (int(id_orden), int(id_usuario))
            )
            row = cur_lookup.fetchone()
            if row:
                target_order = {
                    'id_orden': row['id_orden'],
                    'id_orden_db': row['id_orden'],
                    'total': float(row['total']),
                    'estado': row['estado_orden'],
                    'tipo_entrega': row.get('tipo_entrega') or 'domicilio',
                    'pin_retiro': row.get('pin_retiro'),
                    'estado_retiro': row.get('estado_retiro'),
                    'items': []
                }
                user_orders.append(target_order)
            cur_lookup.close()
            db_conn.close()
        except Exception as err:
            print("Error buscando orden directa en MySQL:", err)

    if not target_order:
        return {'ok': False, 'error': 'Orden no encontrada'}

    if target_order.get('estado') == 'pagado' or target_order.get('estado_orden') == 'pagado':
        return {
            'ok': True,
            'already_paid': True,
            'message': 'La orden ya estaba marcada como pagada',
            'order': target_order
        }

    if target_order.get('estado') != 'pendiente' and target_order.get('estado_orden') != 'pendiente':
        return {'ok': False, 'error': f'La orden ya se encuentra en estado: {target_order.get("estado")}'}

    order_total = float(target_order.get('total', 0))
    amount_paid = float(amount)

    # Si el monto llegó en 0 (por timing o error del cliente), usar el total real de la orden
    if amount_paid <= 0:
        amount_paid = order_total

    # Aceptar monto igual al total o menor (si hay cupón aplicado)
    if amount_paid > order_total + 0.01:
        return {'ok': False, 'error': f'El monto enviado ({amount_paid}) supera el total de la orden ({order_total})'}

    # Actualizar estado de la orden y confirmar método de entrega
    target_order['estado'] = 'pagado'
    target_order['estado_orden'] = 'pagado'
    target_order['metodo_pago'] = payment_method
    if tipo_entrega:
        target_order['tipo_entrega'] = tipo_entrega
    if id_direccion:
        target_order['id_direccion'] = id_direccion
    if coupon_code:
        target_order['cupon_aplicado'] = coupon_code
        target_order['total_con_descuento'] = amount_paid
    orders[str(id_usuario)] = user_orders
    _save_store(ORDER_FILE, orders)

    # Sincronizar estado en MySQL de forma directa e inmediata
    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            db_order_id = target_order.get('id_orden_db') or int(id_orden)

            cursor.execute(
                """
                UPDATE ordenes_compra 
                SET estado_orden = 'pagado'
                WHERE (id_orden = %s OR id_orden = %s)
                """,
                (int(db_order_id), int(id_orden))
            )

            try:
                cursor.execute(
                    "UPDATE ordenes_compra SET metodo_pago = %s WHERE (id_orden = %s OR id_orden = %s)",
                    (payment_method, int(db_order_id), int(id_orden))
                )
            except Exception:
                pass

            id_libros = [item['id_libro'] for item in target_order.get('items', []) if item.get('id_libro')]
            if not id_libros:
                cursor.execute("SELECT id_libro FROM detalle_orden WHERE id_orden = %s OR id_orden = %s", (int(db_order_id), int(id_orden)))
                id_libros = [r['id_libro'] for r in cursor.fetchall() if r.get('id_libro')]

            # Notificar al comprador de su compra exitosa
            cursor.execute("""
                INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                VALUES (%s, 'pedido', '¡Compra realizada con éxito!', %s, %s, FALSE, NOW())
            """, (id_usuario, f"Tu pedido #{id_orden} por ${int(amount_paid):,} ha sido confirmado exitosamente.", id_orden))

            # Notificar a los vendedores de los libros comprados
            if id_libros:
                fmt3 = ','.join(['%s'] * len(id_libros))
                cursor.execute(f"""
                    SELECT DISTINCT t.id_usuario AS id_vendedor, t.nombre_tienda
                    FROM libros l
                    JOIN tiendas t ON t.id_tienda = l.id_tienda
                    WHERE l.id_libro IN ({fmt3})
                """, tuple(id_libros))
                vendedores = cursor.fetchall()
                for v in vendedores:
                    if v.get("id_vendedor") and v["id_vendedor"] != id_usuario:
                        cursor.execute("""
                            INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                            VALUES (%s, 'pedido', '¡Nueva venta pagada!', %s, %s, FALSE, NOW())
                        """, (v["id_vendedor"], f"Has recibido el pago para la orden #{id_orden} por ${int(amount_paid):,} vía {payment_method}.", id_orden))

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

    return {'ok': True, 'transaction': transaction, 'order': target_order}


def cancelar_orden(id_usuario, id_orden, motivo="Cancelación solicitada por el comprador"):
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])

    # Buscar la orden en el JSON del usuario
    target_order = None
    for order in user_orders:
        if order.get('id_orden') == int(id_orden) or order.get('id_orden_db') == int(id_orden):
            target_order = order
            break

    db_order_id = target_order.get('id_orden_db') if target_order else int(id_orden)
    order_db = None

    # Actualizar en base de datos si existe
    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT id_orden, estado_orden FROM ordenes_compra WHERE (id_orden = %s OR id_orden = %s) AND id_usuario = %s",
                (int(db_order_id), int(id_orden), int(id_usuario)),
            )
            order_db = cursor.fetchone()
            if order_db:
                cursor.execute(
                    "UPDATE ordenes_compra SET estado_orden = 'cancelada' WHERE id_orden = %s AND id_usuario = %s",
                    (order_db['id_orden'], int(id_usuario)),
                )
                db.commit()
        finally:
            cursor.close()
            db.close()
    except Exception as e:
        print(f"Error al actualizar orden en BD: {e}")

    # Si la encontramos en el JSON, actualizar su estado
    if target_order:
        target_order['estado'] = 'cancelada'
        target_order['motivo_cancelacion'] = motivo
        orders[str(id_usuario)] = user_orders
        _save_store(ORDER_FILE, orders)
        return {'ok': True, 'message': 'Orden cancelada exitosamente', 'motivo': motivo}
    elif order_db:
        return {'ok': True, 'message': 'Orden cancelada exitosamente', 'motivo': motivo}
    else:
        return {'ok': False, 'error': 'Orden no encontrada'}


def reservar_retiro(id_usuario, id_orden, metodo_pago="Efectivo en Tienda"):
    import random
    from datetime import timedelta
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    target = None
    for o in user_orders:
        if o.get("id_orden") == int(id_orden) or o.get("id_orden_db") == int(id_orden):
            target = o
            break

    pin = target.get("pin_retiro") if target and target.get("pin_retiro") else f"{random.randint(1000, 9999)}"
    ahora = datetime.utcnow()
    limite = ahora + timedelta(hours=48)
    limite_str = limite.isoformat() + "Z"

    if target:
        target["tipo_entrega"] = "retiro_tienda"
        target["metodo_pago"] = metodo_pago
        target["pin_retiro"] = pin
        target["estado_retiro"] = "reservado"
        target["fecha_limite_retiro"] = limite_str
        orders[str(id_usuario)] = user_orders
        _save_store(ORDER_FILE, orders)

    db_order_id = target.get("id_orden_db") if target else int(id_orden)
    tienda_info = None

    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        # Actualizar en MySQL
        cursor.execute("""
            UPDATE ordenes_compra
            SET tipo_entrega = 'retiro_tienda',
                estado_retiro = 'reservado',
                pin_retiro = %s,
                fecha_limite_retiro = DATE_ADD(NOW(), INTERVAL 48 HOUR)
            WHERE (id_orden = %s OR id_orden = %s) AND id_usuario = %s
        """, (pin, int(db_order_id), int(id_orden), int(id_usuario)))

        # Obtener tienda del vendedor y notificar
        cursor.execute("""
            SELECT t.id_usuario AS id_vendedor, t.nombre_tienda, t.direccion, t.telefono, u.nombre_usuario AS comprador_nombre
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            JOIN libros l ON l.id_libro = do.id_libro
            JOIN tiendas t ON t.id_tienda = l.id_tienda
            JOIN usuarios u ON u.id_usuario = oc.id_usuario
            WHERE (oc.id_orden = %s OR oc.id_orden = %s)
            LIMIT 1
        """, (int(db_order_id), int(id_orden)))
        row = cursor.fetchone()
        if row:
            tienda_info = {
                "nombre_tienda": row.get("nombre_tienda") or "Librería Aliada",
                "direccion": row.get("direccion") or "Punto de atención física",
                "telefono": row.get("telefono") or ""
            }
            id_vendedor = row.get("id_vendedor")
            comprador = row.get("comprador_nombre") or "Un cliente"
            if id_vendedor and id_vendedor != id_usuario:
                cursor.execute("""
                    INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                    VALUES (%s, 'pedido', '🏪 ¡Nueva reserva para retiro en tienda!', %s, %s, FALSE, NOW())
                """, (id_vendedor, f"El cliente {comprador} ha reservado el pedido #{id_orden} con PIN {pin} para pagar vía {metodo_pago}.", id_orden))

        # Notificar al comprador
        cursor.execute("""
            INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
            VALUES (%s, 'pedido', '🏪 Reserva de Retiro Confirmada', %s, %s, FALSE, NOW())
        """, (id_usuario, f"Tu reserva #{id_orden} está confirmada. Preséntate en la librería con tu PIN de retiro: {pin}.", id_orden))

        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print("Error actualizando reserva en BD:", e)

    return {
        "ok": True,
        "pin_retiro": pin,
        "estado_retiro": "reservado",
        "fecha_limite_retiro": limite_str,
        "tienda": tienda_info,
        "order": target
    }


def notificar_llegada_tienda(id_usuario, id_orden):
    orders = _load_store(ORDER_FILE)
    user_orders = orders.get(str(id_usuario), [])
    target = None
    for o in user_orders:
        if o.get("id_orden") == int(id_orden) or o.get("id_orden_db") == int(id_orden):
            target = o
            break

    if target:
        target["estado_retiro"] = "en_tienda"
        orders[str(id_usuario)] = user_orders
        _save_store(ORDER_FILE, orders)

    db_order_id = target.get("id_orden_db") if target else int(id_orden)
    pin = target.get("pin_retiro") if target else None

    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            UPDATE ordenes_compra
            SET estado_retiro = 'en_tienda'
            WHERE (id_orden = %s OR id_orden = %s) AND id_usuario = %s
        """, (int(db_order_id), int(id_orden), int(id_usuario)))

        # Notificar al vendedor
        cursor.execute("""
            SELECT t.id_usuario AS id_vendedor, u.nombre_usuario AS cliente_nombre, oc.pin_retiro
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            JOIN libros l ON l.id_libro = do.id_libro
            JOIN tiendas t ON t.id_tienda = l.id_tienda
            JOIN usuarios u ON u.id_usuario = oc.id_usuario
            WHERE (oc.id_orden = %s OR oc.id_orden = %s)
            LIMIT 1
        """, (int(db_order_id), int(id_orden)))
        row = cursor.fetchone()
        if row and row.get("id_vendedor"):
            pin_val = row.get("pin_retiro") or pin or ""
            cli_val = row.get("cliente_nombre") or "El cliente"
            cursor.execute("""
                INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                VALUES (%s, 'pedido', '📍 ¡Cliente llegó a la librería!', %s, %s, FALSE, NOW())
            """, (row["id_vendedor"], f"El cliente {cli_val} ya llegó a tu librería para recoger la orden #{id_orden} (PIN: {pin_val}). Habilita el pago en tu panel.", id_orden))

        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print("Error al registrar llegada del cliente:", e)

    return {"ok": True, "estado_retiro": "en_tienda", "message": "Llegada notificada al vendedor"}


def habilitar_pago_retiro(id_usuario_vendedor, id_orden):
    """
    El vendedor valida al cliente en tienda física y habilita el pago.
    """
    orders = _load_store(ORDER_FILE)
    target = None
    target_uid = None
    for uid, u_orders in orders.items():
        for o in u_orders:
            if o.get("id_orden") == int(id_orden) or o.get("id_orden_db") == int(id_orden):
                target = o
                target_uid = uid
                break
        if target:
            break

    if target:
        target["estado_retiro"] = "habilitado_pago"
        orders[target_uid] = orders.get(target_uid, [])
        _save_store(ORDER_FILE, orders)

    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            UPDATE ordenes_compra
            SET estado_retiro = 'habilitado_pago'
            WHERE id_orden = %s
        """, (int(id_orden),))

        # Notificar al comprador
        cursor.execute("""
            SELECT id_usuario FROM ordenes_compra WHERE id_orden = %s
        """, (int(id_orden),))
        row = cursor.fetchone()
        if row and row.get("id_usuario"):
            cursor.execute("""
                INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                VALUES (%s, 'pedido', '🔔 ¡Tu pago ha sido habilitado!', %s, %s, FALSE, NOW())
            """, (row["id_usuario"], f"El vendedor ha verificado tu presencia en la librería para la orden #{id_orden}. Ya puedes presionar 'Pagar' en tu pantalla.", id_orden))

        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print("Error al habilitar pago de retiro:", e)

    return {"ok": True, "estado_retiro": "habilitado_pago", "message": "Pago habilitado para el comprador"}


def confirmar_entrega_retiro(id_usuario_vendedor, id_orden, es_efectivo=False):
    """
    El vendedor entrega el libro físico y finaliza la orden (como pagada y entregada).
    """
    from app.utils.finance_hooks import registrar_ingreso_venta

    orders = _load_store(ORDER_FILE)
    target = None
    target_uid = None
    for uid, u_orders in orders.items():
        for o in u_orders:
            if o.get("id_orden") == int(id_orden) or o.get("id_orden_db") == int(id_orden):
                target = o
                target_uid = uid
                break
        if target:
            break

    total_orden = float(target.get("total", 0) if target else 0)

    if target:
        target["estado"] = "entregada"
        target["estado_retiro"] = "entregada"
        if es_efectivo:
            target["metodo_pago"] = "Efectivo en Tienda"
        orders[target_uid] = orders.get(target_uid, [])
        _save_store(ORDER_FILE, orders)

    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            UPDATE ordenes_compra
            SET estado_orden = 'entregada',
                estado_retiro = 'entregada'
            WHERE id_orden = %s
        """, (int(id_orden),))

        # Notificar al comprador
        cursor.execute("""
            SELECT id_usuario, total FROM ordenes_compra WHERE id_orden = %s
        """, (int(id_orden),))
        row = cursor.fetchone()
        if row:
            if not total_orden:
                total_orden = float(row.get("total") or 0)
            id_comprador = row.get("id_usuario")
            if id_comprador:
                cursor.execute("""
                    INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
                    VALUES (%s, 'pedido', '🎉 ¡Libro entregado con éxito!', %s, %s, FALSE, NOW())
                """, (id_comprador, f"Tu libro de la orden #{id_orden} ha sido entregado en la librería. ¡Esperamos que disfrutes tu lectura!", id_orden))

        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print("Error al confirmar entrega de retiro:", e)

    # Si fue en efectivo, registrar ingreso
    try:
        if es_efectivo and total_orden > 0:
            registrar_ingreso_venta(
                id_venta=int(id_orden),
                monto_venta=total_orden,
                id_vendedor=int(id_usuario_vendedor),
            )
    except Exception as exc:
        print("Error registrando venta en efectivo:", exc)

    return {"ok": True, "estado_orden": "entregado", "estado_retiro": "entregado", "message": "Libro entregado exitosamente"}
