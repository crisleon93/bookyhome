"""
test_routers_auth.py — Tests de API para los endpoints de auth.

Estrategia: mockear todos los servicios externos (email, BD) para probar
solo la lógica del router: validación de esquemas, códigos HTTP, respuestas.
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# POST /forgot-password
# ---------------------------------------------------------------------------

class TestForgotPassword:
    def test_email_invalido_retorna_422(self):
        # Arrange + Act
        resp = client.post("/forgot-password", json={"email": "no-es-un-email"})
        # Assert
        assert resp.status_code == 422

    def test_sin_body_retorna_422(self):
        resp = client.post("/forgot-password", json={})
        assert resp.status_code == 422

    def test_usuario_no_encontrado_retorna_200_sin_enviar(self):
        with patch("app.routers.auth.obtener_usuario_por_email", return_value=None):
            resp = client.post("/forgot-password", json={"email": "noexiste@mail.com"})
        assert resp.status_code == 200
        assert resp.json()["correo_enviado"] is False

    def test_email_valido_usuario_existe_retorna_200(self):
        usuario_fake = {"id_usuario": 1, "correo_usuario": "user@mail.com"}
        with patch("app.routers.auth.obtener_usuario_por_email", return_value=usuario_fake), \
             patch("app.routers.auth.enviar_email_recuperacion", new_callable=AsyncMock):
            resp = client.post("/forgot-password", json={"email": "user@mail.com"})
        assert resp.status_code == 200
        assert resp.json()["correo_enviado"] is True


# ---------------------------------------------------------------------------
# POST /reset-password
# ---------------------------------------------------------------------------

class TestResetPassword:
    def test_sin_token_retorna_422(self):
        resp = client.post("/reset-password", json={"password": "nueva1234"})
        assert resp.status_code == 422

    def test_password_menor_8_retorna_422(self):
        """REGRESIÓN: password corto rechazado por el schema."""
        resp = client.post("/reset-password", json={"token": "abc", "password": "corta"})
        assert resp.status_code == 422

    def test_token_invalido_retorna_400(self):
        with patch("app.routers.auth.verify_token", return_value=None):
            resp = client.post("/reset-password", json={
                "token": "token_invalido",
                "password": "nuevapass123"
            })
        assert resp.status_code == 400

    def test_token_valido_actualiza_password(self):
        payload_fake = {"sub": "5", "tipo": "reset"}
        with patch("app.routers.auth.verify_token", return_value=payload_fake), \
             patch("app.routers.auth.actualizar_password", return_value={"ok": True}):
            resp = client.post("/reset-password", json={
                "token": "token_valido",
                "password": "nuevapass123"
            })
        assert resp.status_code == 200
        assert "actualizada" in resp.json()["mensaje"].lower()
