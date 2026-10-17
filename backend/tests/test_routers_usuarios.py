"""
test_routers_usuarios.py — Tests de API para /register y /login.

Cubre: validación de schemas, estados HTTP, casos de éxito y error.
"""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

# ---------------------------------------------------------------------------
# POST /register
# ---------------------------------------------------------------------------

class TestRegister:
    PAYLOAD_VALIDO = {
        "nombre": "Juan Test",
        "email": "juan@test.com",
        "password": "Segura123",
        "telefono": "3001234567",
        "rol": "comprador",
    }

    def test_registro_exitoso_retorna_200(self):
        with patch("app.routers.usuarios.crear_usuario", return_value={"ok": True}), \
             patch("app.routers.usuarios.is_smtp_configured", return_value=False):
            resp = client.post("/register", json=self.PAYLOAD_VALIDO)
        assert resp.status_code == 200
        assert "exitosamente" in resp.json()["mensaje"].lower()

    def test_password_corto_retorna_422(self):
        """REGRESIÓN: password < 8 caracteres debe ser rechazado."""
        payload = {**self.PAYLOAD_VALIDO, "password": "corta"}
        resp = client.post("/register", json=payload)
        assert resp.status_code == 422

    def test_password_vacio_retorna_422(self):
        """REGRESIÓN: password vacío debe ser rechazado."""
        payload = {**self.PAYLOAD_VALIDO, "password": ""}
        resp = client.post("/register", json=payload)
        assert resp.status_code == 422

    def test_telefono_con_letras_retorna_422(self):
        """REGRESIÓN: teléfono con letras debe ser rechazado."""
        payload = {**self.PAYLOAD_VALIDO, "telefono": "ABCDE123"}
        resp = client.post("/register", json=payload)
        assert resp.status_code == 422

    def test_telefono_muy_corto_retorna_422(self):
        """REGRESIÓN: teléfono de 6 dígitos debe ser rechazado."""
        payload = {**self.PAYLOAD_VALIDO, "telefono": "123456"}
        resp = client.post("/register", json=payload)
        assert resp.status_code == 422

    def test_email_invalido_retorna_422(self):
        payload = {**self.PAYLOAD_VALIDO, "email": "no-es-email"}
        resp = client.post("/register", json=payload)
        assert resp.status_code == 422

    def test_rol_invalido_retorna_422(self):
        payload = {**self.PAYLOAD_VALIDO, "rol": "superadmin"}
        resp = client.post("/register", json=payload)
        assert resp.status_code == 422

    def test_email_duplicado_retorna_400(self):
        with patch("app.routers.usuarios.crear_usuario",
                   return_value={"ok": False, "error": "Duplicate entry 'juan@test.com'"}):
            resp = client.post("/register", json=self.PAYLOAD_VALIDO)
        assert resp.status_code == 400

    def test_sin_body_retorna_422(self):
        resp = client.post("/register", json={})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /login
# ---------------------------------------------------------------------------

class TestLogin:
    def test_credenciales_correctas_retorna_token(self):
        usuario_fake = {
            "id_usuario": 1,
            "nombre_usuario": "Juan",
            "correo_usuario": "juan@test.com",
            "rol": "comprador",
            "estado_usuario": "Activo",
            "email_verificado": True,
        }
        with patch("app.routers.usuarios.login_usuario", return_value=usuario_fake):
            resp = client.post("/login", json={
                "email": "juan@test.com",
                "password": "Segura123"
            })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_credenciales_incorrectas_retorna_401(self):
        with patch("app.routers.usuarios.login_usuario", return_value=None):
            resp = client.post("/login", json={
                "email": "juan@test.com",
                "password": "incorrecta"
            })
        assert resp.status_code == 401

    def test_email_no_verificado_retorna_403(self):
        usuario_fake = {
            "id_usuario": 1, "nombre_usuario": "Juan",
            "correo_usuario": "juan@test.com", "rol": "comprador",
            "estado_usuario": "Activo", "email_verificado": False,
        }
        with patch("app.routers.usuarios.login_usuario", return_value=usuario_fake):
            resp = client.post("/login", json={
                "email": "juan@test.com", "password": "Segura123"
            })
        assert resp.status_code == 403

    def test_usuario_bloqueado_retorna_403(self):
        usuario_fake = {
            "id_usuario": 1, "nombre_usuario": "Juan",
            "correo_usuario": "juan@test.com", "rol": "comprador",
            "estado_usuario": "Bloqueado", "email_verificado": True,
        }
        with patch("app.routers.usuarios.login_usuario", return_value=usuario_fake):
            resp = client.post("/login", json={
                "email": "juan@test.com", "password": "Segura123"
            })
        assert resp.status_code == 403

    def test_email_invalido_retorna_422(self):
        resp = client.post("/login", json={
            "email": "noesvalido", "password": "pass"
        })
        assert resp.status_code == 422

    def test_sin_body_retorna_422(self):
        resp = client.post("/login", json={})
        assert resp.status_code == 422
