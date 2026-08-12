"""Persistencia del tracking manual asociado a las órdenes del checkout."""
import json
import os
from datetime import datetime, timezone


STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ORDER_FILE = os.path.join(STORAGE_DIR, "orders.json")

# Catálogo equivalente a la tabla empresas_mensajeria. No se consulta ninguna
# API externa: el seguimiento es manual y el vendedor actualiza esta información.
EMPRESAS_MENSAJERIA = [
    {"id_empresa": 1, "nombre_empresa": "Servientrega", "sitio_web": "https://www.servientrega.com", "url_rastreo": "https://www.servientrega.com/wps/portal/rastreo-destinatario"},
    {"id_empresa": 2, "nombre_empresa": "Interrapidisimo", "sitio_web": "https://www.interrapidisimo.com", "url_rastreo": "https://interrapidisimo.com/sigue-tu-envio/"},
    {"id_empresa": 3, "nombre_empresa": "Coordinadora", "sitio_web": "https://www.coordinadora.com"},
    {"id_empresa": 4, "nombre_empresa": "Envia", "sitio_web": "https://www.envia.co"},
    {"id_empresa": 5, "nombre_empresa": "TCC", "sitio_web": "https://www.tcc.com.co"},
    {"id_empresa": 6, "nombre_empresa": "Deprisa (Avianca)", "sitio_web": "https://www.deprisa.com"},
    {"id_empresa": 7, "nombre_empresa": "4-72 (Postal)", "sitio_web": "https://www.4-72.com.co"},
    {"id_empresa": 8, "nombre_empresa": "DHL Colombia", "sitio_web": "https://www.dhl.com/co"},
    {"id_empresa": 9, "nombre_empresa": "FedEx Colombia", "sitio_web": "https://www.fedex.com/es-co/home.html"},
    {"id_empresa": 10, "nombre_empresa": "Listo! (Éxito)", "sitio_web": "https://www.exito.com"},
]


def listar_empresas():
    return EMPRESAS_MENSAJERIA


def _load_orders():
    if not os.path.exists(ORDER_FILE):
        return {}
    try:
        with open(ORDER_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError):
        return {}


def _save_orders(orders):
    with open(ORDER_FILE, "w", encoding="utf-8") as file:
        json.dump(orders, file, indent=2, ensure_ascii=False)


def limpiar_envios_no_pagados():
    """Elimina guías heredadas de órdenes que aún no han sido pagadas."""
    orders = _load_orders()
    actualizado = False
    for user_orders in orders.values():
        for order in user_orders:
            if str(order.get("estado", "")).lower() != "pagado" and order.pop("envio", None) is not None:
                actualizado = True
    if actualizado:
        _save_orders(orders)
    return actualizado


def registrar_envio(id_comprador, id_orden, id_tienda, id_empresa, numero_guia):
    """Registra o reemplaza la guía en MySQL. Solo si la orden contiene libros de la tienda y está pagada."""
    empresa = next((e for e in EMPRESAS_MENSAJERIA if e["id_empresa"] == id_empresa), None)
    if not empresa:
        return None, "La empresa de mensajería no es válida"

    from app.database import get_db
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que la orden existe, está pagada y contiene libros de esta tienda
        cursor.execute("""
            SELECT oc.id_orden, oc.estado_orden
            FROM ordenes_compra oc
            JOIN detalle_orden do ON do.id_orden = oc.id_orden
            JOIN libros l ON l.id_libro = do.id_libro
            WHERE oc.id_orden = %s AND oc.id_usuario = %s AND l.id_tienda = %s
            LIMIT 1
        """, (id_orden, id_comprador, id_tienda))
        orden = cursor.fetchone()

        if not orden:
            return None, "Orden no encontrada"
        if str(orden["estado_orden"]).lower() != "pagado":
            return None, "La guía solo puede registrarse cuando el pedido esté pagado"

        # Insertar o actualizar el envío en la tabla envios
        cursor.execute("""
            INSERT INTO envios (id_orden, id_tienda, id_empresa, empresa_mensajeria, numero_guia, estado_envio)
            VALUES (%s, %s, %s, %s, %s, 'Guía registrada')
            ON DUPLICATE KEY UPDATE
                id_empresa        = VALUES(id_empresa),
                empresa_mensajeria = VALUES(empresa_mensajeria),
                numero_guia       = VALUES(numero_guia),
                estado_envio      = 'Guía registrada'
        """, (id_orden, id_tienda, id_empresa, empresa["nombre_empresa"], numero_guia))
        db.commit()

    finally:
        cursor.close()
        db.close()

    envio = {
        "id_empresa":         empresa["id_empresa"],
        "empresa_mensajeria": empresa["nombre_empresa"],
        "sitio_web":          empresa["sitio_web"],
        "url_rastreo":        empresa.get("url_rastreo", empresa["sitio_web"]),
        "numero_guia":        numero_guia,
        "estado_envio":       "Guía registrada",
        "actualizado_en":     datetime.now(timezone.utc).isoformat(),
    }

    # Sincronizar también en orders.json si la orden existe ahí
    try:
        orders = _load_orders()
        user_orders = orders.get(str(id_comprador), [])
        order_json = next((o for o in user_orders if o.get("id_orden") == id_orden), None)
        if order_json:
            order_json["envio"] = envio
            orders[str(id_comprador)] = user_orders
            _save_orders(orders)
    except Exception:
        pass  # No crítico, MySQL es la fuente de verdad

    return envio, None
