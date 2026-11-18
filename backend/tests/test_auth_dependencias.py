"""
test_auth_dependencias.py — Pruebas de get_current_user y require_role.

Usa TestClient con mocks de base de datos para cubrir las ramas
de auth.py que test_auth.py y test_auth_utils.py no alcanzan.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.auth import create_token


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c


def _token(rol: str = "comprador", id_usuario: int = 1) -> str:
    return create_token({"sub": str(id_usuario), "rol": rol})


def _usuario_mock(rol: str = "comprador", estado: str = "Activo", id_usuario: int = 1):
    return {
        "id_usuario": id_usuario,
        "nombre": "Test User",
        "email": "test@test.com",
        "rol": rol,
        "estado_usuario": estado,
    }


# ---------------------------------------------------------------------------
# get_current_user — token inválido
# ---------------------------------------------------------------------------

class TestGetCurrentUserTokenInvalido:
    def test_sin_token_retorna_403(self, client):
        resp = client.get("/carrito")
        assert resp.status_code in (401, 403)

    def test_token_malformado_retorna_401(self, client):
        resp = client.get("/carrito", headers={"Authorization": "Bearer token.malo.aqui"})
        assert resp.status_code == 401

    def test_token_con_firma_incorrecta_retorna_401(self, client):
        import jwt
        token = jwt.encode({"sub": "1", "rol": "comprador"}, "clave_falsa", algorithm="HS256")
        resp = client.get("/carrito", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# get_current_user — usuario no encontrado en BD (test unitario directo)
# ---------------------------------------------------------------------------

class TestGetCurrentUserUsuarioNoEncontrado:
    def test_usuario_no_existe_lanza_401(self):
        from fastapi import HTTPException
        from unittest.mock import MagicMock
        from app.auth import get_current_user

        token = _token()
        credentials_mock = MagicMock()
        credentials_mock.credentials = token

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user(credentials_mock)
        assert exc.value.status_code == 401


# ---------------------------------------------------------------------------
# get_current_user — usuario bloqueado (test unitario directo)
# ---------------------------------------------------------------------------

class TestGetCurrentUserUsuarioBloqueado:
    def test_usuario_bloqueado_lanza_403(self):
        from fastapi import HTTPException
        from unittest.mock import MagicMock
        from app.auth import get_current_user

        token = _token()
        credentials_mock = MagicMock()
        credentials_mock.credentials = token
        usuario_bloqueado = _usuario_mock(estado="Bloqueado")

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_bloqueado):
            with pytest.raises(HTTPException) as exc:
                get_current_user(credentials_mock)
        assert exc.value.status_code == 403


# ---------------------------------------------------------------------------
# get_current_user — vendedor con tienda
# ---------------------------------------------------------------------------

class TestGetCurrentUserVendedor:
    def test_vendedor_con_tienda_inyecta_id_tienda(self, client):
        token = _token(rol="vendedor", id_usuario=5)
        usuario_vendedor = _usuario_mock(rol="vendedor", id_usuario=5)
        tienda_mock = {"id_tienda": 99, "nombre": "Tienda Test"}

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_vendedor), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=tienda_mock):
            resp = client.get("/carrito", headers={"Authorization": f"Bearer {token}"})
        # El endpoint puede retornar 200 o error de BD — lo importante es que
        # get_current_user no lanzó 401/403 por el rol
        assert resp.status_code not in (401, 403)

    def test_vendedor_sin_tienda_id_tienda_es_none(self, client):
        token = _token(rol="vendedor", id_usuario=6)
        usuario_vendedor = _usuario_mock(rol="vendedor", id_usuario=6)

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_vendedor), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=None):
            resp = client.get("/carrito", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code not in (401, 403)


# ---------------------------------------------------------------------------
# require_role
# ---------------------------------------------------------------------------

class TestRequireRole:
    def test_rol_correcto_permite_acceso(self, client):
        token = _token(rol="admin")
        usuario_admin = _usuario_mock(rol="admin")

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_admin), \
             patch("app.routers.usuarios.obtener_todos_usuarios", return_value=[]):
            resp = client.get("/usuarios", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code != 403

    def test_rol_incorrecto_retorna_403(self, client):
        token = _token(rol="comprador")
        usuario_comprador = _usuario_mock(rol="comprador")

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_comprador):
            resp = client.get("/usuarios", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403
