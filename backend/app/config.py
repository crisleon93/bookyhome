"""
Configuración y validación de variables de entorno.

Este módulo verifica al arrancar que todas las variables obligatorias estén
presentes y tengan valores válidos. Si falta alguna, el proceso termina con
un mensaje claro indicando qué variable falta y cómo corregirlo.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Cargar .env desde backend/ (dos niveles arriba de app/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


# ─── Definición de variables ──────────────────────────────────────────────────

# Variables obligatorias: la app no debe arrancar sin ellas.
REQUIRED_VARS = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "SECRET_KEY",
]

# Variables opcionales pero recomendadas: se advierte si faltan.
OPTIONAL_VARS = [
    "MAIL_USERNAME",
    "MAIL_PASSWORD",
    "MAIL_FROM",
    "MAIL_SERVER",
    "PUBLIC_API_URL",
    "FRONTEND_URL",
    "GEMINI_API_KEY",
]


def _is_placeholder(value: str) -> bool:
    """Detecta valores de ejemplo que el desarrollador olvidó reemplazar."""
    placeholders = {
        "tu_clave_secreta",
        "genera_una_clave_secreta_aleatoria_de_64_hex",
        "pega_tu_clave_de_gemini_aqui",
        "pega_tu_clave_de_openai_aqui",
        "cambia_esta_contrasena_en_produccion",
        "tu_correo@gmail.com",
        "tu_app_password",
        "",
    }
    return value.strip().lower() in placeholders


def validate_config() -> dict:
    """
    Valida que todas las variables obligatorias estén presentes.

    Retorna un dict con el estado de cada variable.
    Si falta una obligatoria, termina el proceso con exit(1) y un mensaje claro.
    """
    missing = []
    placeholder = []
    warnings = []

    for var in REQUIRED_VARS:
        value = os.getenv(var)
        if value is None or value.strip() == "":
            missing.append(var)
        elif _is_placeholder(value):
            placeholder.append(var)

    for var in OPTIONAL_VARS:
        value = os.getenv(var)
        if value is None or value.strip() == "":
            warnings.append(var)

    # ─── Mensaje de error y salida si faltan obligatorias ────────────────────
    if missing or placeholder:
        print(
            "\n"
            "╔══════════════════════════════════════════════════════════════╗\n"
            "║  ❌  BookyHome no puede arrancar: configuración incompleta  ║\n"
            "╚══════════════════════════════════════════════════════════════╝\n",
            file=sys.stderr,
        )

        if missing:
            print("  Variables obligatorias FALTANTES:", file=sys.stderr)
            for var in missing:
                print(f"    • {var}", file=sys.stderr)

        if placeholder:
            print(
                "\n  Variables obligatorias con VALOR DE EJEMPLO (reemplazar):",
                file=sys.stderr,
            )
            for var in placeholder:
                print(f"    • {var}", file=sys.stderr)

        print(
            "\n"
            "  Corrige backend/.env (o las variables del entorno) y reinicia.\n"
            "  Consulta backend/.env.example para ver todas las variables.\n",
            file=sys.stderr,
        )
        sys.exit(1)

    # ─── Advertencias por opcionales ─────────────────────────────────────────
    if warnings:
        print(
            "[CONFIG] Variables opcionales no configuradas (algunas "
            f"funciones no estarán disponibles): {', '.join(warnings)}",
            file=sys.stderr,
            flush=True,
        )

    return {
        "missing": missing,
        "placeholder": placeholder,
        "warnings": warnings,
    }
