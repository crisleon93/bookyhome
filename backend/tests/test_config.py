"""
test_config.py — Pruebas unitarias de app/config.py

Cubre: _is_placeholder, validate_config con variables presentes,
faltantes, con placeholders y con variables opcionales ausentes.
"""

import pytest
import os
from unittest.mock import patch

from app.config import _is_placeholder, validate_config, REQUIRED_VARS, OPTIONAL_VARS


# ---------------------------------------------------------------------------
# _is_placeholder
# ---------------------------------------------------------------------------

class TestIsPlaceholder:
    def test_placeholder_clave_secreta(self):
        assert _is_placeholder("tu_clave_secreta") is True

    def test_placeholder_gemini(self):
        assert _is_placeholder("pega_tu_clave_de_gemini_aqui") is True

    def test_placeholder_openai(self):
        assert _is_placeholder("pega_tu_clave_de_openai_aqui") is True

    def test_placeholder_contrasena(self):
        assert _is_placeholder("cambia_esta_contrasena_en_produccion") is True

    def test_placeholder_vacio(self):
        assert _is_placeholder("") is True

    def test_placeholder_espacios(self):
        assert _is_placeholder("   ") is True

    def test_valor_real_no_es_placeholder(self):
        assert _is_placeholder("mi_clave_segura_real_xyz123") is False

    def test_valor_real_host(self):
        assert _is_placeholder("localhost") is False

    def test_placeholder_case_insensitive(self):
        assert _is_placeholder("TU_CLAVE_SECRETA") is True


# ---------------------------------------------------------------------------
# validate_config — caso exitoso
# ---------------------------------------------------------------------------

VARS_COMPLETAS = {
    "DB_HOST": "localhost",
    "DB_PORT": "3306",
    "DB_USER": "root",
    "DB_PASSWORD": "clave_real_segura",
    "DB_NAME": "bookyhome",
    "SECRET_KEY": "clave_secreta_real_de_64_hex_aqui",
    "MAIL_USERNAME": "correo@test.com",
    "MAIL_PASSWORD": "app_pass_real",
    "MAIL_FROM": "correo@test.com",
    "MAIL_SERVER": "smtp.gmail.com",
    "PUBLIC_API_URL": "http://localhost:8000",
    "FRONTEND_URL": "http://localhost:5173",
    "GEMINI_API_KEY": "AIza_clave_real",
}


class TestValidateConfigExitoso:
    def test_retorna_dict_cuando_todo_esta_bien(self):
        with patch.dict(os.environ, VARS_COMPLETAS, clear=True):
            resultado = validate_config()
        assert isinstance(resultado, dict)

    def test_missing_vacio_cuando_todo_esta_bien(self):
        with patch.dict(os.environ, VARS_COMPLETAS, clear=True):
            resultado = validate_config()
        assert resultado["missing"] == []

    def test_placeholder_vacio_cuando_todo_esta_bien(self):
        with patch.dict(os.environ, VARS_COMPLETAS, clear=True):
            resultado = validate_config()
        assert resultado["placeholder"] == []

    def test_warnings_vacio_cuando_opcionales_presentes(self):
        with patch.dict(os.environ, VARS_COMPLETAS, clear=True):
            resultado = validate_config()
        assert resultado["warnings"] == []


# ---------------------------------------------------------------------------
# validate_config — variables faltantes → sys.exit(1)
# ---------------------------------------------------------------------------

class TestValidateConfigFaltantes:
    def test_exit_cuando_falta_db_host(self):
        env_sin_db_host = {k: v for k, v in VARS_COMPLETAS.items() if k != "DB_HOST"}
        with patch.dict(os.environ, env_sin_db_host, clear=True):
            with pytest.raises(SystemExit) as exc:
                validate_config()
        assert exc.value.code == 1

    def test_exit_cuando_falta_secret_key(self):
        env_sin_key = {k: v for k, v in VARS_COMPLETAS.items() if k != "SECRET_KEY"}
        with patch.dict(os.environ, env_sin_key, clear=True):
            with pytest.raises(SystemExit) as exc:
                validate_config()
        assert exc.value.code == 1

    def test_exit_cuando_faltan_todas_las_obligatorias(self):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(SystemExit) as exc:
                validate_config()
        assert exc.value.code == 1

    def test_exit_cuando_db_password_es_placeholder(self):
        env_placeholder = {**VARS_COMPLETAS, "DB_PASSWORD": "cambia_esta_contrasena_en_produccion"}
        with patch.dict(os.environ, env_placeholder, clear=True):
            with pytest.raises(SystemExit) as exc:
                validate_config()
        assert exc.value.code == 1

    def test_exit_cuando_secret_key_es_placeholder(self):
        env_placeholder = {**VARS_COMPLETAS, "SECRET_KEY": "tu_clave_secreta"}
        with patch.dict(os.environ, env_placeholder, clear=True):
            with pytest.raises(SystemExit) as exc:
                validate_config()
        assert exc.value.code == 1


# ---------------------------------------------------------------------------
# validate_config — variables opcionales ausentes → solo warnings
# ---------------------------------------------------------------------------

class TestValidateConfigWarnings:
    def test_warnings_cuando_faltan_opcionales(self):
        env_solo_obligatorias = {
            "DB_HOST": "localhost",
            "DB_PORT": "3306",
            "DB_USER": "root",
            "DB_PASSWORD": "clave_real_segura",
            "DB_NAME": "bookyhome",
            "SECRET_KEY": "clave_secreta_real_de_64_hex",
        }
        with patch.dict(os.environ, env_solo_obligatorias, clear=True):
            resultado = validate_config()
        assert len(resultado["warnings"]) > 0

    def test_no_exit_cuando_solo_faltan_opcionales(self):
        env_solo_obligatorias = {
            "DB_HOST": "localhost",
            "DB_PORT": "3306",
            "DB_USER": "root",
            "DB_PASSWORD": "clave_real_segura",
            "DB_NAME": "bookyhome",
            "SECRET_KEY": "clave_secreta_real_de_64_hex",
        }
        with patch.dict(os.environ, env_solo_obligatorias, clear=True):
            resultado = validate_config()
        assert resultado["missing"] == []
        assert resultado["placeholder"] == []
