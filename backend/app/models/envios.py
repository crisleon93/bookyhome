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
    """Registra o reemplaza la guía, solo si la orden contiene libros de la tienda."""
    empresa = next((e for e in EMPRESAS_MENSAJERIA if e["id_empresa"] == id_empresa), None)
    if not empresa:
        return None, "La empresa de mensajería no es válida"

    # Se importa aquí para no crear un ciclo al cargar los modelos.
    from app.database import get_db
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT id_libro FROM libros WHERE id_tienda = %s", (id_tienda,))
        libros_tienda = {row[0] for row in cursor.fetchall()}
    finally:
        cursor.close()
        db.close()

    orders = _load_orders()
    user_orders = orders.get(str(id_comprador), [])
    order = next((item for item in user_orders if item.get("id_orden") == id_orden), None)
    if not order:
        return None, "Orden no encontrada"
    if not any(item.get("id_libro") in libros_tienda for item in order.get("items", [])):
        return None, "No tienes permiso para actualizar el envío de esta orden"
    if str(order.get("estado", "")).lower() != "pagado":
        return None, "La guía solo puede registrarse cuando el pedido esté pagado"

    envio = {
        "id_empresa": empresa["id_empresa"],
        "empresa_mensajeria": empresa["nombre_empresa"],
        "sitio_web": empresa["sitio_web"],
        "url_rastreo": empresa.get("url_rastreo", empresa["sitio_web"]),
        "numero_guia": numero_guia,
        "estado_envio": "Guía registrada",
        "actualizado_en": datetime.now(timezone.utc).isoformat(),
    }
    order["envio"] = envio
    orders[str(id_comprador)] = user_orders
    _save_orders(orders)
    return envio, None
