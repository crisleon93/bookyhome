"""
test_auth_extra_coverage.py — Ramas de auth.py no cubiertas por tests existentes.

Ya cubierto (NO duplicar):
  - test_auth.py / test_auth_utils.py: hash/verify/create/verify token
  - test_auth_dependencias.py:
      - token inválido / malformado → 401
      - usuario no encontrado → 401 (via direct call)
      - usuario bloqueado → 403 (via direct call)
      - vendedor con/sin tienda (via TestClient /carrito)
      - require_role correcto / incorrecto

Lo que queda sin cubrir que añadimos aquí:
  - require_role directamente devuelve el usuario cuando el rol es permitido
  - get_current_user con vendedor inyecta id_tienda (vía llamada directa)
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from app.auth import create_token, get_current_user, require_role


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _creds(rol: str = "comprador", id_usuario: int = 1):
    token = create_token({"sub": str(id_usuario), "rol": rol})
    creds = MagicMock()
    creds.credentials = token
    return creds


def _usuario(rol: str = "comprador", estado: str = "Activo", id_usuario: int = 1):
    return {
        "id_usuario": id_usuario,
        "nombre": "Test",
        "email": "t@t.com",
        "rol": rol,
        "estado_usuario": estado,
    }


# ---------------------------------------------------------------------------
# get_current_user — usuario no encontrado retorna None
# ---------------------------------------------------------------------------

class TestGetCurrentUserNoEncontrado:
    def test_usuario_none_lanza_401(self):
        creds = _creds()
        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user(creds)
        assert exc.value.status_code == 401
        assert "no encontrado" in exc.value.detail.lower()


# ---------------------------------------------------------------------------
# get_current_user — usuario bloqueado (estado != "Activo")
# ---------------------------------------------------------------------------

class TestGetCurrentUserBloqueado:
    def test_estado_bloqueado_lanza_403(self):
        creds = _creds()
        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=_usuario(estado="Bloqueado")):
            with pytest.raises(HTTPException) as exc:
                get_current_user(creds)
        assert exc.value.status_code == 403

    def test_estado_inactivo_lanza_403(self):
        creds = _creds()
        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=_usuario(estado="Inactivo")):
            with pytest.raises(HTTPException) as exc:
                get_current_user(creds)
        assert exc.value.status_code == 403


# ---------------------------------------------------------------------------
# get_current_user — vendedor inyecta id_tienda
# ---------------------------------------------------------------------------

class TestGetCurrentUserVendedor:
    def test_vendedor_con_tienda_inyecta_id_tienda(self):
        creds = _creds(rol="vendedor", id_usuario=5)
        usuario_vendedor = _usuario(rol="vendedor", id_usuario=5)
        tienda = {"id_tienda": 42, "nombre": "Tienda"}

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_vendedor), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=tienda):
            result = get_current_user(creds)

        assert result["id_tienda"] == 42

    def test_vendedor_sin_tienda_id_tienda_es_none(self):
        creds = _creds(rol="vendedor", id_usuario=6)
        usuario_vendedor = _usuario(rol="vendedor", id_usuario=6)

        with patch("app.models.usuarios.obtener_usuario_por_id", return_value=usuario_vendedor), \
             patch("app.models.tiendas.obtener_tienda_por_usuario", return_value=None):
            result = get_current_user(creds)

        assert result["id_tienda"] is None


# ---------------------------------------------------------------------------
# require_role — retorna usuario cuando el rol es permitido
# ---------------------------------------------------------------------------

class TestRequireRole:
    def test_rol_no_permitido_lanza_403(self):
        usuario_comprador = _usuario(rol="comprador")
        dep = require_role("admin", "vendedor")

        with pytest.raises(HTTPException) as exc:
            dep(usuario=usuario_comprador)
        assert exc.value.status_code == 403

    def test_rol_permitido_retorna_usuario(self):
        usuario_admin = _usuario(rol="admin")
        dep = require_role("admin", "vendedor")
        result = dep(usuario=usuario_admin)
        assert result == usuario_admin

    def test_uno_de_varios_roles_acepta(self):
        usuario_vendedor = _usuario(rol="vendedor")
        dep = require_role("admin", "vendedor")
        result = dep(usuario=usuario_vendedor)
        assert result["rol"] == "vendedor"
