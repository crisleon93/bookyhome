"""
finance_hooks.py
─────────────────────────────────────────────────────────────────────
Registro AUTOMÁTICO de ingresos en BookyPago Finanzas.

Expone tres funciones de alto nivel que se llaman desde los routers
cada vez que ocurre una transacción real:

  • registrar_ingreso_venta(id_venta, monto_venta, id_vendedor)
  • registrar_ingreso_impulso(id_impulso, id_tienda, monto_impulso)
  • registrar_ingreso_plan(id_tienda, id_plan, monto_plan, periodicidad)

Características:
  - Lee comisiones desde variables de entorno (mismo .env del backend).
  - Nunca hace fallar la transacción principal: si falla el registro en
    finanzas, solo registra el error en el log de la aplicación.
  - Evita duplicados: verifica si la transacción ya fue registrada antes
    de insertar (idempotente por tipo + id de referencia).
  - Un solo lugar para cambiar porcentajes → cambia el .env, listo.
─────────────────────────────────────────────────────────────────────
"""

import logging
import os
from typing import Optional

from dotenv import load_dotenv

from app.models.bookypago_finanzas import BookyPagoFinanzas, _load_store, FINANZAS_FILE

load_dotenv()

logger = logging.getLogger("finance_hooks")

# ─────────────────────────────────────────────────────────────────────
# Configuración leída del .env una sola vez al importar el módulo
# ─────────────────────────────────────────────────────────────────────
_CONFIG = {
    "comision_venta":   float(os.getenv("BOOKYPAGO_COMISION_VENTA",   "0.15")),
    "comision_impulso": float(os.getenv("BOOKYPAGO_COMISION_IMPULSO", "0.10")),
    "comision_plan":    float(os.getenv("BOOKYPAGO_COMISION_PLAN",    "0.08")),
    "minimo_pago":      float(os.getenv("BOOKYPAGO_MINIMO_PAGO",      "50000")),
    "dias_pago":        int(os.getenv("BOOKYPAGO_DIAS_PAGO",          "7")),
}

# Instancia única reutilizable (no crea conexión de BD, solo lee JSON)
_finanzas = BookyPagoFinanzas(_CONFIG)


# ─────────────────────────────────────────────────────────────────────
# Helpers internos
# ─────────────────────────────────────────────────────────────────────

def _ya_registrado(tipo: str, id_ref: int) -> bool:
    """
    Comprueba si ya existe un ingreso del mismo tipo y referencia
    en finanzas.json para evitar duplicados.

    Args:
        tipo:   'venta', 'impulso' o 'plan'
        id_ref: id_venta, id_impulso o id_plan según el tipo
    """
    key_map = {
        "venta":   "id_venta",
        "impulso": "id_impulso",
        "plan":    "id_plan",
    }
    campo = key_map.get(tipo)
    if not campo:
        return False

    try:
        data = _load_store(FINANZAS_FILE)
        ingresos = data.get("ingresos", [])
        return any(
            ing.get("tipo") == tipo and ing.get(campo) == id_ref
            for ing in ingresos
        )
    except Exception as exc:
        logger.warning("finance_hooks._ya_registrado error: %s", exc)
        return False


# ─────────────────────────────────────────────────────────────────────
# API pública
# ─────────────────────────────────────────────────────────────────────

def registrar_ingreso_venta(
    id_venta: int,
    monto_venta: float,
    id_vendedor: int,
) -> None:
    """
    Registra automáticamente la comisión de BookyHome por una venta.
    Llámalo justo después de confirmar que el pago fue exitoso.

    Args:
        id_venta:    ID de la orden de compra
        monto_venta: Total pagado por el comprador
        id_vendedor: ID del usuario vendedor (para calcular pago pendiente)

    Comisión aplicada: BOOKYPAGO_COMISION_VENTA (default 15 %)
    """
    try:
        if _ya_registrado("venta", id_venta):
            logger.debug(
                "finance_hooks: venta #%d ya registrada, se omite.", id_venta
            )
            return

        resultado = _finanzas.registrar_ingreso_venta(
            id_venta=id_venta,
            monto_venta=monto_venta,
            id_vendedor=id_vendedor,
        )

        if resultado.get("ok"):
            logger.info(
                "finance_hooks: ✓ Venta #%d registrada | "
                "monto=$%.0f | comisión(%.0f%%)=$%.2f",
                id_venta,
                monto_venta,
                _CONFIG["comision_venta"] * 100,
                resultado["ingreso"]["comision"],
            )
        else:
            logger.error(
                "finance_hooks: ✗ Error registrando venta #%d: %s",
                id_venta,
                resultado.get("error"),
            )

    except Exception as exc:
        # NUNCA propaga la excepción: el pago ya fue procesado,
        # no queremos revertirlo por un fallo en finanzas.
        logger.exception(
            "finance_hooks: excepción inesperada en registrar_ingreso_venta "
            "(venta #%d): %s",
            id_venta,
            exc,
        )


def registrar_ingreso_impulso(
    id_impulso: int,
    id_tienda: int,
    monto_impulso: float,
) -> None:
    """
    Registra automáticamente el ingreso de BookyHome por un impulso contratado.
    Llámalo justo después de confirmar que el impulso fue creado.

    Args:
        id_impulso:    ID del impulso contratado
        id_tienda:     ID de la tienda que contrató el impulso
        monto_impulso: Monto pagado por el impulso (ya con descuento aplicado)

    Comisión aplicada: BOOKYPAGO_COMISION_IMPULSO (default 10 %)
    """
    try:
        if _ya_registrado("impulso", id_impulso):
            logger.debug(
                "finance_hooks: impulso #%d ya registrado, se omite.", id_impulso
            )
            return

        resultado = _finanzas.registrar_ingreso_impulso(
            id_impulso=id_impulso,
            id_tienda=id_tienda,
            monto_impulso=monto_impulso,
        )

        if resultado.get("ok"):
            logger.info(
                "finance_hooks: ✓ Impulso #%d registrado | "
                "tienda=%d | monto=$%.0f | comisión(%.0f%%)=$%.2f",
                id_impulso,
                id_tienda,
                monto_impulso,
                _CONFIG["comision_impulso"] * 100,
                resultado["ingreso"]["comision"],
            )
        else:
            logger.error(
                "finance_hooks: ✗ Error registrando impulso #%d: %s",
                id_impulso,
                resultado.get("error"),
            )

    except Exception as exc:
        logger.exception(
            "finance_hooks: excepción inesperada en registrar_ingreso_impulso "
            "(impulso #%d): %s",
            id_impulso,
            exc,
        )


def registrar_ingreso_plan(
    id_tienda: int,
    id_plan: int,
    monto_plan: float,
    periodicidad: str = "mensual",
) -> None:
    """
    Registra automáticamente el ingreso de BookyHome por una suscripción de plan.
    Llámalo justo después de confirmar que la suscripción fue creada.

    Args:
        id_tienda:    ID de la tienda suscrita
        id_plan:      ID de la suscripción creada
        monto_plan:   Monto pagado por el plan
        periodicidad: 'mensual' o 'anual'

    Comisión aplicada: BOOKYPAGO_COMISION_PLAN (default 8 %)

    Nota: Si monto_plan es 0 (plan gratuito) no se registra ingreso.
    """
    try:
        if monto_plan <= 0:
            logger.debug(
                "finance_hooks: plan #%d con monto $0, no se registra ingreso.",
                id_plan,
            )
            return

        if _ya_registrado("plan", id_plan):
            logger.debug(
                "finance_hooks: plan #%d ya registrado, se omite.", id_plan
            )
            return

        resultado = _finanzas.registrar_ingreso_plan(
            id_tienda=id_tienda,
            id_plan=id_plan,
            monto_plan=monto_plan,
            periodicidad=periodicidad,
        )

        if resultado.get("ok"):
            logger.info(
                "finance_hooks: ✓ Plan #%d registrado | "
                "tienda=%d | monto=$%.0f | comisión(%.0f%%)=$%.2f",
                id_plan,
                id_tienda,
                monto_plan,
                _CONFIG["comision_plan"] * 100,
                resultado["ingreso"]["comision"],
            )
        else:
            logger.error(
                "finance_hooks: ✗ Error registrando plan #%d: %s",
                id_plan,
                resultado.get("error"),
            )

    except Exception as exc:
        logger.exception(
            "finance_hooks: excepción inesperada en registrar_ingreso_plan "
            "(plan #%d): %s",
            id_plan,
            exc,
        )


def obtener_config_comisiones() -> dict:
    """
    Retorna la configuración de comisiones activa (leída del .env).
    Útil para mostrarla en endpoints de diagnóstico/admin.
    """
    return {
        "comision_venta_pct":   round(_CONFIG["comision_venta"]   * 100, 2),
        "comision_impulso_pct": round(_CONFIG["comision_impulso"] * 100, 2),
        "comision_plan_pct":    round(_CONFIG["comision_plan"]    * 100, 2),
        "minimo_pago":          _CONFIG["minimo_pago"],
        "dias_pago":            _CONFIG["dias_pago"],
    }
