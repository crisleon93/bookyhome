"""
test_auth.py — Pruebas unitarias del módulo app.auth.

Cubre:
- hash_password genera un hash distinto al texto plano
- verify_password valida correctamente
- verify_password rechaza contraseña incorrecta
- create_token genera un JWT decodificable
- verify_token retorna el payload correcto
- verify_token retorna None con token inválido
"""

import pytest
import jwt
from app.auth import hash_password, verify_password, create_token, verify_token, SECRET_KEY, ALGORITHM


# ---------------------------------------------------------------------------
# hash_password / verify_password
# ---------------------------------------------------------------------------

class TestHashPassword:
    def test_hash_es_diferente_al_texto_plano(self):
        # Arrange
        password = "MiPassword123"
        # Act
        hashed = hash_password(password)
        # Assert
        assert hashed != password

    def test_hash_es_string(self):
        hashed = hash_password("abc")
        assert isinstance(hashed, str)

    def test_dos_hashes_del_mismo_password_son_distintos(self):
        """bcrypt usa salt aleatorio — dos hashes nunca deben ser iguales."""
        h1 = hash_password("igual")
        h2 = hash_password("igual")
        assert h1 != h2


class TestVerifyPassword:
    def test_password_correcto_retorna_true(self):
        # Arrange
        password = "Segura#2026"
        hashed = hash_password(password)
        # Act & Assert
        assert verify_password(password, hashed) is True

    def test_password_incorrecto_retorna_false(self):
        hashed = hash_password("correcta")
        assert verify_password("incorrecta", hashed) is False

    def test_password_vacio_retorna_false(self):
        hashed = hash_password("algo")
        assert verify_password("", hashed) is False


# ---------------------------------------------------------------------------
# create_token / verify_token
# ---------------------------------------------------------------------------

class TestCreateToken:
    def test_retorna_string(self):
        token = create_token({"sub": "42"})
        assert isinstance(token, str)

    def test_payload_se_puede_decodificar(self):
        # Arrange
        data = {"sub": "7", "rol": "comprador"}
        # Act
        token = create_token(data)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Assert
        assert payload["sub"] == "7"
        assert payload["rol"] == "comprador"

    def test_token_incluye_expiracion(self):
        token = create_token({"sub": "1"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload


class TestVerifyToken:
    def test_token_valido_retorna_payload(self):
        token = create_token({"sub": "5"})
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "5"

    def test_token_invalido_retorna_none(self):
        assert verify_token("esto.no.es.un.token") is None

    def test_token_manipulado_retorna_none(self):
        token = create_token({"sub": "1"})
        # Modificar el token haciéndolo inválido
        manipulado = token[:-5] + "XXXXX"
        assert verify_token(manipulado) is None
