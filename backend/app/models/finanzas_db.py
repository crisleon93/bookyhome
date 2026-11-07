"""
finanzas_db.py
──────────────────────────────────────────────────────────────────────
Cálculo de finanzas de BookyHome leyendo directamente de MySQL.

Reemplaza las lecturas del archivo finanzas.json para que los datos
mostrados en el panel de admin siempre reflejen la realidad de la BD
(compras, impulsos y suscripciones a planes insertados por migraciones
o por flujos normales de la app).

Fuentes de ingresos (MySQL):
  • ordenes_compra  → comisión por ventas con domicilio (15 %)
  • impulsos_contratados + pagos_impulsos → monto total del impulso (100 %)
  • suscripciones_herramientas + planes_herramientas → monto del plan (100 %)

Los pagos/egresos operativos siguen leyéndose del JSON (son manuales).
La nómina de vendedores se calcula desde ordenes_compra (lo que BookyHome
debe pagarle al vendedor = 85 % de cada venta con domicilio que aún no
esté marcada como pagada en pagos_vendedores.json).
"""

import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List

from dotenv import load_dotenv

from app.database import get_db
from app.models.bookypago_finanzas import (
    _load_store,
    FINANZAS_FILE,
)

load_dotenv()
logger = logging.getLogger("finanzas_db")

# ──────────────────────────────────────────────────────────────────────
# Comisiones (leídas del entorno igual que el resto del sistema)
# ──────────────────────────────────────────────────────────────────────
_COMISION_VENTA   = float(os.getenv("BOOKYPAGO_COMISION_VENTA",   "0.15"))
_COMISION_IMPULSO = float(os.getenv("BOOKYPAGO_COMISION_IMPULSO", "0.10"))
_COMISION_PLAN    = float(os.getenv("BOOKYPAGO_COMISION_PLAN",    "0.08"))


# ──────────────────────────────────────────────────────────────────────
# Helpers internos
# ──────────────────────────────────────────────────────────────────────

def _fetch_all(query: str, params: tuple = ()) -> List[Dict]:
    """Ejecuta una SELECT y devuelve lista de dicts. Nunca lanza excepción."""
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute(query, params)
        return cursor.fetchall() or []
    except Exception as exc:
        logger.error("finanzas_db._fetch_all error: %s | query: %s", exc, query[:120])
        return []
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


def _fetch_one(query: str, params: tuple = ()) -> Dict:
    """Ejecuta una SELECT y devuelve un dict (o {}). Nunca lanza excepción."""
    rows = _fetch_all(query, params)
    return rows[0] if rows else {}


# ──────────────────────────────────────────────────────────────────────
# Ingresos desde MySQL
# ──────────────────────────────────────────────────────────────────────

def _ingresos_ventas_db(desde: datetime = None) -> List[Dict]:
    """
    Ordenes con pago aprobado (estado != Cancelada/Pendiente), con entrega a domicilio.
    Devuelve una lista normalizada lista para mostrarse en el historial.
    """
    filtro_fecha = ""
    params: tuple = ()

    if desde:
        filtro_fecha = "AND oc.fecha_orden >= %s"
        params = (desde,)

    rows = _fetch_all(
        f"""
        SELECT
            oc.id_orden                                       AS id_venta,
            oc.fecha_orden                                    AS fecha,
            oc.total                                          AS monto_venta,
            oc.total * {_COMISION_VENTA}                      AS comision,
            oc.total * {1 - _COMISION_VENTA}                  AS monto_vendedor,
            oc.id_usuario,
            COALESCE(t.id_usuario, 0)                        AS id_vendedor,
            COALESCE(oc.tipo_entrega, 'domicilio')            AS tipo_entrega
        FROM ordenes_compra oc
        LEFT JOIN detalle_orden d  ON d.id_orden  = oc.id_orden
        LEFT JOIN libros        l  ON l.id_libro  = d.id_libro
        LEFT JOIN tiendas       t  ON t.id_tienda = l.id_tienda
        WHERE oc.estado_orden NOT IN ('Cancelada', 'Pendiente')
          AND COALESCE(oc.tipo_entrega, 'domicilio') = 'domicilio'
          {filtro_fecha}
        GROUP BY oc.id_orden, oc.fecha_orden, oc.total, oc.id_usuario,
                 t.id_usuario, oc.tipo_entrega
        ORDER BY oc.fecha_orden DESC
        """,
        params,
    )

    result = []
    for r in rows:
        result.append({
            "id":           r["id_venta"],
            "tipo":         "venta",
            "id_venta":     r["id_venta"],
            "id_vendedor":  r["id_vendedor"],
            "monto":        float(r["monto_venta"] or 0),
            "comision":     float(r["comision"] or 0),
            "monto_venta":  float(r["monto_venta"] or 0),
            "fecha":        r["fecha"].isoformat() + "Z" if isinstance(r["fecha"], datetime) else str(r["fecha"]),
            "estado":       "procesado",
        })
    return result


def _ingresos_impulsos_db(desde: datetime = None) -> List[Dict]:
    """
    Impulsos contratados con pago aprobado.
    Ingreso de BookyHome = monto_pagado (BookyHome retiene el 100 %).
    La comisión interna se calcula aparte pero el ingreso base = monto_pagado.
    """
    filtro_fecha = ""
    params: tuple = ()

    if desde:
        filtro_fecha = "AND ic.fecha_inicio >= %s"
        params = (desde,)

    rows = _fetch_all(
        f"""
        SELECT
            ic.id_impulso,
            ic.id_tienda,
            ic.fecha_inicio                         AS fecha,
            ic.monto_pagado                         AS monto_impulso,
            ic.monto_pagado * {_COMISION_IMPULSO}   AS comision,
            ic.estado
        FROM impulsos_contratados ic
        WHERE ic.estado IN ('Activo', 'Finalizado', 'Expirado')
          AND EXISTS (
              SELECT 1 FROM pagos_impulsos pi
              WHERE pi.id_impulso = ic.id_impulso
                AND pi.estado_pago = 'Aprobado'
          )
          {filtro_fecha}
        ORDER BY ic.fecha_inicio DESC
        """,
        params,
    )

    result = []
    for r in rows:
        result.append({
            "id":           r["id_impulso"],
            "tipo":         "impulso",
            "id_impulso":   r["id_impulso"],
            "id_tienda":    r["id_tienda"],
            "monto":        float(r["monto_impulso"] or 0),
            "comision":     float(r["monto_impulso"] or 0),   # BookyHome se queda con todo
            "monto_impulso": float(r["monto_impulso"] or 0),
            "fecha":        r["fecha"].isoformat() + "Z" if isinstance(r["fecha"], datetime) else str(r["fecha"]),
            "estado":       "procesado",
        })
    return result


def _ingresos_planes_db(desde: datetime = None) -> List[Dict]:
    """
    Suscripciones activas/canceladas/expiradas a planes pagos.
    Ingreso = monto_pagado (BookyHome retiene el 100 % de los planes).
    """
    filtro_fecha = ""
    params: tuple = ()

    if desde:
        filtro_fecha = "AND sh.fecha_inicio >= %s"
        params = (desde,)

    rows = _fetch_all(
        f"""
        SELECT
            sh.id_suscripcion,
            sh.id_tienda,
            sh.fecha_inicio                         AS fecha,
            sh.monto_pagado                         AS monto_plan,
            sh.monto_pagado * {_COMISION_PLAN}      AS comision,
            ph.nombre_plan,
            sh.estado
        FROM suscripciones_herramientas sh
        JOIN planes_herramientas ph ON ph.id_plan = sh.id_plan
        WHERE sh.monto_pagado > 0
          AND sh.id_plan > 1          -- excluir plan Gratuito
          {filtro_fecha}
        ORDER BY sh.fecha_inicio DESC
        """,
        params,
    )

    result = []
    for r in rows:
        result.append({
            "id":           r["id_suscripcion"],
            "tipo":         "plan",
            "id_plan":      r["id_suscripcion"],
            "id_tienda":    r["id_tienda"],
            "monto":        float(r["monto_plan"] or 0),
            "comision":     float(r["monto_plan"] or 0),   # BookyHome se queda con todo
            "monto_plan":   float(r["monto_plan"] or 0),
            "nombre_plan":  r.get("nombre_plan", ""),
            "fecha":        r["fecha"].isoformat() + "Z" if isinstance(r["fecha"], datetime) else str(r["fecha"]),
            "estado":       "procesado",
        })
    return result


# ──────────────────────────────────────────────────────────────────────
# API pública
# ──────────────────────────────────────────────────────────────────────

def obtener_balance_db() -> Dict:
    """
    Calcula el balance de BookyHome leyendo directamente de MySQL.

    Ingresos:
      • Comisión del 15 % sobre ventas a domicilio completadas
      • 100 % del monto de impulsos pagados
      • 100 % del monto de suscripciones a planes pagos

    Egresos:
      • Pagos operativos de BookyHome del JSON (tipo != 'nomina')
    """
    ventas   = _ingresos_ventas_db()
    impulsos = _ingresos_impulsos_db()
    planes   = _ingresos_planes_db()

    total_ventas   = sum(r["comision"] for r in ventas)
    total_impulsos = sum(r["comision"] for r in impulsos)
    total_planes   = sum(r["comision"] for r in planes)
    total_ingresos = total_ventas + total_impulsos + total_planes

    # Pagos operativos propios de BookyHome (del JSON, son manuales)
    finanzas       = _load_store(FINANZAS_FILE)
    pagos_op       = [
        p for p in finanzas.get("pagos", [])
        if p.get("estado") == "procesado" and p.get("tipo") != "nomina"
    ]
    total_pagos    = sum(float(p.get("monto", 0)) for p in pagos_op)

    return {
        "ingresos_totales":   round(total_ingresos, 2),
        "pagos_totales":      round(total_pagos, 2),
        "balance":            round(total_ingresos - total_pagos, 2),
        "ingresos_por_tipo":  {
            "venta":   round(total_ventas,   2),
            "impulso": round(total_impulsos, 2),
            "plan":    round(total_planes,   2),
        },
    }


def obtener_historial_db(dias: int = 30) -> Dict:
    """
    Devuelve ingresos y pagos de los últimos N días desde MySQL.
    """
    desde = datetime.now(timezone.utc) - timedelta(days=dias)

    ventas   = _ingresos_ventas_db(desde)
    impulsos = _ingresos_impulsos_db(desde)
    planes   = _ingresos_planes_db(desde)

    todos_ingresos = ventas + impulsos + planes
    todos_ingresos.sort(key=lambda x: x.get("fecha", ""), reverse=True)

    # Pagos del JSON (período)
    finanzas   = _load_store(FINANZAS_FILE)
    limite_ts  = desde.timestamp()
    pagos_json = []
    for p in finanzas.get("pagos", []):
        try:
            ts = datetime.fromisoformat(
                p["fecha"].replace("Z", "+00:00")
            ).timestamp()
            if ts >= limite_ts:
                pagos_json.append(p)
        except Exception:
            pass

    return {
        "ingresos":     todos_ingresos,
        "pagos":        pagos_json,
        "periodo_dias": dias,
    }


def obtener_estadisticas_db() -> Dict:
    """
    KPIs de los últimos 30 días leídos desde MySQL.
    """
    desde = datetime.now(timezone.utc) - timedelta(days=30)

    ventas   = _ingresos_ventas_db(desde)
    impulsos = _ingresos_impulsos_db(desde)
    planes   = _ingresos_planes_db(desde)

    ingresos_30 = (
        sum(r["comision"] for r in ventas) +
        sum(r["comision"] for r in impulsos) +
        sum(r["comision"] for r in planes)
    )

    # Pagos operativos del JSON en el período
    finanzas  = _load_store(FINANZAS_FILE)
    limite_ts = desde.timestamp()
    pagos_30  = sum(
        float(p.get("monto", 0))
        for p in finanzas.get("pagos", [])
        if p.get("tipo") != "nomina"
        and p.get("estado") == "procesado"
        and _ts_safe(p.get("fecha", "")) >= limite_ts
    )

    # Días reales con datos para calcular promedio honesto
    dias_con_datos = len({
        r["fecha"][:10]
        for r in (ventas + impulsos + planes)
        if r.get("fecha")
    }) or 1

    # Totales históricos (sin filtro de fecha)
    total_ventas_hist   = _fetch_one(
        "SELECT COUNT(DISTINCT id_orden) AS n FROM ordenes_compra "
        "WHERE estado_orden NOT IN ('Cancelada', 'Pendiente') "
        "AND COALESCE(tipo_entrega, 'domicilio') = 'domicilio'"
    ).get("n", 0)

    total_planes_hist   = _fetch_one(
        "SELECT COUNT(*) AS n FROM suscripciones_herramientas "
        "WHERE estado = 'Activa' AND id_plan > 1"
    ).get("n", 0)

    total_impulsos_hist = _fetch_one(
        "SELECT COUNT(*) AS n FROM impulsos_contratados "
        "WHERE estado IN ('Activo', 'Finalizado', 'Expirado')"
    ).get("n", 0)

    balance = obtener_balance_db()

    return {
        "balance_actual":      balance,
        "ingresos_30_dias":    round(ingresos_30, 2),
        "pagos_30_dias":       round(pagos_30, 2),
        "promedio_diario":     round(ingresos_30 / dias_con_datos, 2),
        "ventas_totales":      int(total_ventas_hist or 0),
        "planes_activos":      int(total_planes_hist or 0),
        "impulsos_comprados":  int(total_impulsos_hist or 0),
    }


def obtener_nomina_db() -> Dict:
    """
    Calcula la nómina de pagos pendientes a vendedores.

    Estrategia:
      1. Lee pagos_vendedores.json para los pagos ya registrados y aún pendientes.
      2. Para ventas que NO están en el JSON, calcula el monto pendiente directamente
         desde ordenes_compra (evita requerir que el hook haya corrido).
      Agrupa por id_vendedor.
    """
    # Pagos ya en el JSON (pendientes)
    pagos_vend = _load_store(PAGOS_VENDEDORES_FILE)
    if isinstance(pagos_vend, dict):
        pagos_vend = []

    pendientes_json = [p for p in pagos_vend if p.get("estado") == "pendiente"]

    # IDs de ventas ya cubiertas por el JSON
    ventas_cubiertas = {p.get("id_venta") for p in pagos_vend}   # procesadas + pendientes

    # Ventas completadas que AÚN no aparecen en el JSON → calcular su monto
    rows_faltantes = _fetch_all(
        f"""
        SELECT
            oc.id_orden                            AS id_venta,
            oc.fecha_orden                         AS fecha_venta,
            oc.total * {1 - _COMISION_VENTA}       AS monto,
            COALESCE(t.id_usuario, 0)              AS id_vendedor
        FROM ordenes_compra oc
        LEFT JOIN detalle_orden d ON d.id_orden  = oc.id_orden
        LEFT JOIN libros        l ON l.id_libro  = d.id_libro
        LEFT JOIN tiendas       t ON t.id_tienda = l.id_tienda
        WHERE oc.estado_orden NOT IN ('Cancelada', 'Pendiente')
          AND COALESCE(oc.tipo_entrega, 'domicilio') = 'domicilio'
          AND t.id_usuario IS NOT NULL
        GROUP BY oc.id_orden, oc.fecha_orden, oc.total, t.id_usuario
        """
    )

    pendientes_extra = []
    for r in rows_faltantes:
        if r["id_venta"] not in ventas_cubiertas:
            pendientes_extra.append({
                "id_vendedor":  r["id_vendedor"],
                "id_venta":     r["id_venta"],
                "monto":        float(r["monto"] or 0),
                "fecha_venta":  r["fecha_venta"].isoformat() + "Z" if isinstance(r["fecha_venta"], datetime) else str(r["fecha_venta"]),
                "estado":       "pendiente",
            })

    todos_pendientes = pendientes_json + pendientes_extra

    nomina: Dict = {}
    for pago in todos_pendientes:
        vid = pago["id_vendedor"]
        if vid not in nomina:
            nomina[vid] = {"id_vendedor": vid, "total_pendiente": 0.0, "pagos": []}
        nomina[vid]["total_pendiente"] += float(pago.get("monto", 0))
        nomina[vid]["pagos"].append(pago)

    vendedores = sorted(nomina.values(), key=lambda v: v["total_pendiente"], reverse=True)

    return {
        "vendedores":    vendedores,
        "total_general": round(sum(v["total_pendiente"] for v in vendedores), 2),
        "total_vendedores": len(vendedores),
    }


# ──────────────────────────────────────────────────────────────────────
# Utilidad interna
# ──────────────────────────────────────────────────────────────────────

def _ts_safe(iso_str: str) -> float:
    """Convierte una cadena ISO a timestamp Unix. Devuelve 0 en error."""
    try:
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).timestamp()
    except Exception:
        return 0.0
