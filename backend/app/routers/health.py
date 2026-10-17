"""
Endpoint de salud (/health).

Verifica las dependencias críticas del sistema y devuelve un JSON con el
estado de cada una. Si todas están sanas, responde HTTP 200. Si alguna falla,
responde HTTP 503 con el detalle de qué dependencia falló.

Dependencias que verifica:
  1. Base de datos (MySQL) — conexión y SELECT 1
  2. Correo transaccional — presencia de configuración SMTP (no envía correo)
  3. Asistente IA — presencia de API key (solo advierte, no bloquea)
"""

import os
import time
from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.database import get_db

router = APIRouter()


def _check_database() -> dict:
    """Verifica conectividad a MySQL con un SELECT 1."""
    t0 = time.time()
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        elapsed_ms = round((time.time() - t0) * 1000, 1)
        return {"status": "ok", "latency_ms": elapsed_ms}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()


def _check_mail() -> dict:
    """Verifica que la configuración SMTP esté presente (sin enviar correo)."""
    required = ["MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM", "MAIL_SERVER"]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        return {"status": "degraded", "missing": missing}
    return {"status": "ok"}


def _check_ai_assistant() -> dict:
    """Verifica que haya al menos una API key del asistente IA configurada."""
    if os.getenv("GEMINI_API_KEY"):
        return {"status": "ok", "provider": "gemini"}
    if os.getenv("OPENAI_API_KEY"):
        return {"status": "ok", "provider": "openai"}
    return {"status": "degraded", "detail": "sin API key de IA"}


@router.get("/health", tags=["Salud"])
def health():
    """
    Endpoint de salud.

    Verifica las dependencias críticas y devuelve su estado.
    HTTP 200 si todas las dependencias críticas están sanas.
    HTTP 503 si alguna dependencia crítica falla.
    """
    checks = {
        "database": _check_database(),
        "mail": _check_mail(),
        "ai_assistant": _check_ai_assistant(),
    }

    # La base de datos es la única dependencia CRÍTICA.
    # El correo y el asistente IA son "degraded" pero no bloquean el servicio.
    critical_ok = checks["database"]["status"] == "ok"

    overall = "ok" if critical_ok else "error"
    http_status = 200 if critical_ok else 503

    body = {
        "status": overall,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": os.getenv("APP_VERSION", "unknown"),
        "checks": checks,
    }

    return JSONResponse(content=body, status_code=http_status)
