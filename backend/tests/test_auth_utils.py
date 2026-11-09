"""
test_auth_utils.py — Pruebas unitarias de app/auth.py

Cubre: hash_password, verify_password, create_token, verify_token.
Las dependencias de FastAPI (get_current_user, require_role) se prueban
vía el TestClient usando el fixture 'client' de conftest.py.
"""

import pytest
import time
from unittest.mock import patch
import jwt

from app.auth import (
    hash_password,
    verify_password,
    create_token,
    verify_token,
    SECRET_KEY,
    ALGORITHM,
)


# ---------------------------------------------------------------------------
# hash_password / verify_password
# ---------------------------------------------------------------------------

class TestHashPassword:
    def test_hash_no_es_igual_a_plaintext(self):
        hashed = hash_password("MiContraseña123!")
        assert hashed != "MiContraseña123!"

    def test_hash_es_string(self):
        hashed = hash_password("abc12345")
        assert isinstance(hashed, str)

    def test_hash_empieza_con_bcrypt_prefix(self):
        hashed = hash_password("clave_cualquiera")
        # bcrypt siempre empieza con $2b$ o $2a$
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")

    def test_dos_hashes_del_mismo_password_son_distintos(self):
        """bcrypt genera un salt aleatorio → dos hashes distintos."""
        h1 = hash_password("misma_clave")
        h2 = hash_password("misma_clave")
        assert h1 != h2

    def test_password_vacio_se_hashea(self):
        hashed = hash_password("")
        assert isinstance(hashed, str) and len(hashed) > 0


class TestVerifyPassword:
    def test_verify_correcto(self):
        hashed = hash_password("Segura123!")
        assert verify_password("Segura123!", hashed) is True

    def test_verify_incorrecto(self):
        hashed = hash_password("Segura123!")
        assert verify_password("Incorrecta", hashed) is False

    def test_verify_password_vacio_contra_hash(self):
        hashed = hash_password("algo")
        assert verify_password("", hashed) is False

    def test_verify_case_sensitive(self):
        hashed = hash_password("Mayuscula")
        assert verify_password("mayuscula", hashed) is False

    def test_verify_hash_del_mismo_password_funciona(self):
        """Aunque los hashes son distintos, verify siempre funciona."""
        h1 = hash_password("misma_clave")
        h2 = hash_password("misma_clave")
        assert verify_password("misma_clave", h1) is True
        assert verify_password("misma_clave", h2) is True


# ---------------------------------------------------------------------------
# create_token
# ---------------------------------------------------------------------------

class TestCreateToken:
    def test_create_token_retorna_string(self):
        token = create_token({"sub": "1", "rol": "comprador"})
        assert isinstance(token, str)

    def test_token_tiene_tres_partes(self):
        token = create_token({"sub": "1"})
        partes = token.split(".")
        assert len(partes) == 3

    def test_payload_del_token_contiene_sub(self):
        token = create_token({"sub": "42", "rol": "vendedor"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "42"
        assert payload["rol"] == "vendedor"

    def test_token_incluye_campo_exp(self):
        token = create_token({"sub": "1"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_exp_es_aproximadamente_24_horas(self):
        import time
        from datetime import datetime, timezone
        token = create_token({"sub": "1"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload["exp"]
        ahora = datetime.now(timezone.utc).timestamp()
        # exp debe estar ~24h en el futuro (tolerancia de ±60 seg)
        assert abs(exp - ahora - 86400) < 60

    def test_tokens_distintos_para_payloads_distintos(self):
        t1 = create_token({"sub": "1"})
        t2 = create_token({"sub": "2"})
        assert t1 != t2

    def test_no_expone_la_clave_en_el_token(self):
        token = create_token({"sub": "1"})
        # La clave no debe aparecer en ninguna parte del token
        assert SECRET_KEY not in token


# ---------------------------------------------------------------------------
# verify_token
# ---------------------------------------------------------------------------

class TestVerifyToken:
    def test_verifica_token_valido(self):
        token = create_token({"sub": "10", "rol": "admin"})
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "10"
        assert payload["rol"] == "admin"

    def test_retorna_none_con_token_malformado(self):
        assert verify_token("no.es.un.jwt") is None

    def test_retorna_none_con_token_vacio(self):
        assert verify_token("") is None

    def test_retorna_none_con_firma_alterada(self):
        token = create_token({"sub": "1"})
        # Cambiar el último carácter corrompe la firma
        token_corrupto = token[:-1] + ("X" if token[-1] != "X" else "Y")
        assert verify_token(token_corrupto) is None

    def test_retorna_none_con_token_expirado(self):
        from datetime import datetime, timedelta, timezone
        # Crear un token que ya expiró (1 segundo en el pasado)
        expired_payload = {
            "sub": "1",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
        assert verify_token(expired_token) is None

    def test_retorna_none_con_clave_incorrecta(self):
        token_otra_clave = jwt.encode(
            {"sub": "1", "rol": "admin"},
            "clave_completamente_diferente",
            algorithm=ALGORITHM,
        )
        assert verify_token(token_otra_clave) is None

    def test_verify_round_trip_preserva_todos_los_campos(self):
        data = {"sub": "99", "rol": "vendedor", "extra": "valor"}
        token = create_token(data)
        payload = verify_token(token)
        assert payload["sub"] == "99"
        assert payload["rol"] == "vendedor"
        assert payload["extra"] == "valor"
