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


# ---------------------------------------------------------------------------
# GET /usuarios (admin)
# ---------------------------------------------------------------------------

class TestGetUsuarios:
    def _admin_token(self):
        from app.auth import create_token
        return create_token({"sub": "1", "rol": "admin"})

    def test_admin_obtiene_lista_usuarios(self):
        usuarios_fake = [
            {"id_usuario": 1, "nombre": "Juan", "rol": "comprador"},
            {"id_usuario": 2, "nombre": "Ana",  "rol": "vendedor"},
        ]
        usuario_admin = {"id_usuario": 1, "rol": "admin", "estado_usuario": "Activo"}
        token = self._admin_token()

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_admin), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=None), \
             patch("app.routers.usuarios.obtener_todos_usuarios", return_value=usuarios_fake):
            resp = client.get("/usuarios", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_comprador_no_puede_listar_usuarios(self):
        from app.auth import create_token
        token = create_token({"sub": "2", "rol": "comprador"})
        usuario_comprador = {"id_usuario": 2, "rol": "comprador", "estado_usuario": "Activo"}

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_comprador), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=None):
            resp = client.get("/usuarios", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 403

    def test_sin_token_retorna_403(self):
        resp = client.get("/usuarios")
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# PATCH /usuarios/{id}/bloquear (admin)
# ---------------------------------------------------------------------------

class TestBloquearUsuario:
    def _admin_token(self):
        from app.auth import create_token
        return create_token({"sub": "1", "rol": "admin"})

    def test_admin_puede_bloquear_usuario(self):
        usuario_admin = {"id_usuario": 1, "rol": "admin", "estado_usuario": "Activo"}
        token = self._admin_token()

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_admin), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=None), \
             patch("app.routers.usuarios.bloquear_usuario", return_value={"ok": True}):
            resp = client.patch(
                "/usuarios/5/bloquear",
                json={"bloqueado": True},
                headers={"Authorization": f"Bearer {token}"}
            )

        assert resp.status_code == 200
        assert "actualizado" in resp.json()["mensaje"].lower()

    def test_error_bd_retorna_500(self):
        usuario_admin = {"id_usuario": 1, "rol": "admin", "estado_usuario": "Activo"}
        token = self._admin_token()

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_admin), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=None), \
             patch("app.routers.usuarios.bloquear_usuario", return_value={"ok": False, "error": "BD error"}):
            resp = client.patch(
                "/usuarios/5/bloquear",
                json={"bloqueado": True},
                headers={"Authorization": f"Bearer {token}"}
            )

        assert resp.status_code == 500


# ---------------------------------------------------------------------------
# GET /check-email-verification
# ---------------------------------------------------------------------------

class TestCheckEmailVerification:
    def test_usuario_verificado_retorna_true(self):
        usuario_fake = {"id_usuario": 1, "email_verificado": True}
        with patch("app.routers.usuarios.obtener_usuario_por_email", return_value=usuario_fake):
            resp = client.get("/check-email-verification", params={"email": "juan@test.com"})
        assert resp.status_code == 200
        assert resp.json()["verificado"] is True

    def test_usuario_no_verificado_retorna_false(self):
        usuario_fake = {"id_usuario": 2, "email_verificado": False}
        with patch("app.routers.usuarios.obtener_usuario_por_email", return_value=usuario_fake):
            resp = client.get("/check-email-verification", params={"email": "nuevo@test.com"})
        assert resp.status_code == 200
        assert resp.json()["verificado"] is False

    def test_usuario_no_encontrado_retorna_false(self):
        with patch("app.routers.usuarios.obtener_usuario_por_email", return_value=None):
            resp = client.get("/check-email-verification", params={"email": "noexiste@test.com"})
        assert resp.status_code == 200
        assert resp.json()["verificado"] is False

    def test_sin_columna_email_verificado_asume_true(self):
        """Compatibilidad: usuario sin la columna debe asumir verificado=True."""
        usuario_sin_columna = {"id_usuario": 3}
        with patch("app.routers.usuarios.obtener_usuario_por_email", return_value=usuario_sin_columna):
            resp = client.get("/check-email-verification", params={"email": "viejo@test.com"})
        assert resp.status_code == 200
        assert resp.json()["verificado"] is True
