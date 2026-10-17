"""
test_modelos_usuarios.py — Pruebas unitarias del modelo app.models.usuarios.

Usa mocks de get_db para aislar la lógica de negocio de la BD real.
Patrón AAA (Arrange-Act-Assert) en todos los tests.
"""

import pytest
from unittest.mock import MagicMock, patch, call


# ---------------------------------------------------------------------------
# login_usuario
# ---------------------------------------------------------------------------

class TestLoginUsuario:
    def test_credenciales_correctas_retorna_usuario(self):
        """Un usuario con email y password correctos debe retornar sus datos."""
        from app.auth import hash_password
        hashed = hash_password("Password123")

        usuario_fake = {
            "id_usuario": 1,
            "nombre_usuario": "Juan",
            "correo_usuario": "juan@mail.com",
            "contrasena_usuario": hashed,
            "rol": "comprador",
            "estado_usuario": "Activo",
            "email_verificado": True,
        }

        with patch("app.models.usuarios.obtener_usuario_por_email", return_value=usuario_fake):
            from app.models.usuarios import login_usuario
            # Act
            result = login_usuario("juan@mail.com", "Password123")
            # Assert
            assert result is not None
            assert result["id_usuario"] == 1

    def test_password_incorrecto_retorna_none(self):
        from app.auth import hash_password
        hashed = hash_password("correcta")
        usuario_fake = {
            "contrasena_usuario": hashed,
        }

        with patch("app.models.usuarios.obtener_usuario_por_email", return_value=usuario_fake):
            from app.models.usuarios import login_usuario
            result = login_usuario("x@mail.com", "incorrecta")
            assert result is None

    def test_usuario_no_existe_retorna_none(self):
        with patch("app.models.usuarios.obtener_usuario_por_email", return_value=None):
            from app.models.usuarios import login_usuario
            result = login_usuario("noexiste@mail.com", "algo")
            assert result is None


# ---------------------------------------------------------------------------
# crear_usuario
# ---------------------------------------------------------------------------

class TestCrearUsuario:
    def test_usuario_nuevo_retorna_ok_true(self):
        """Arrange: cursor ejecuta sin errores → esperar {"ok": True}."""
        db_mock = MagicMock()
        cursor_mock = MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.return_value = None

        import app.models.usuarios as mod
        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_usuario(
                nombre="Ana",
                email="ana@mail.com",
                password="Abc12345",
                telefono="3001234567",
                rol="comprador",
            )
        assert result["ok"] is True

    def test_error_de_bd_retorna_ok_false(self):
        """Si la BD lanza excepción, retornar {"ok": False, "error": ...}."""
        db_mock = MagicMock()
        cursor_mock = MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("Duplicate entry")

        import app.models.usuarios as mod
        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_usuario(
                nombre="Ana",
                email="ana@mail.com",
                password="Abc12345",
                telefono="3001234567",
            )
        assert result["ok"] is False
        assert "error" in result


# ---------------------------------------------------------------------------
# actualizar_password
# ---------------------------------------------------------------------------

class TestActualizarPassword:
    def test_actualiza_correctamente(self):
        db_mock = MagicMock()
        cursor_mock = MagicMock()
        db_mock.cursor.return_value = cursor_mock

        import app.models.usuarios as mod
        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_password("5", "NuevaPass123")

        assert result["ok"] is True
        assert cursor_mock.execute.called
        sql_llamado = cursor_mock.execute.call_args[0][0]
        assert "UPDATE" in sql_llamado.upper()

    def test_error_en_bd_retorna_ok_false(self):
        db_mock = MagicMock()
        cursor_mock = MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("BD caída")

        import app.models.usuarios as mod
        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_password("5", "NuevaPass123")

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# bloquear_usuario
# ---------------------------------------------------------------------------

class TestBloquearUsuario:
    def test_bloquear_pone_estado_bloqueado(self):
        db_mock = MagicMock()
        cursor_mock = MagicMock()
        db_mock.cursor.return_value = cursor_mock

        import app.models.usuarios as mod
        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.bloquear_usuario(id_usuario=3, bloqueado=True)

        assert result["ok"] is True
        args = cursor_mock.execute.call_args[0]
        assert "Bloqueado" in args[1]

    def test_desbloquear_pone_estado_activo(self):
        db_mock = MagicMock()
        cursor_mock = MagicMock()
        db_mock.cursor.return_value = cursor_mock

        import app.models.usuarios as mod
        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.bloquear_usuario(id_usuario=3, bloqueado=False)

        assert result["ok"] is True
        args = cursor_mock.execute.call_args[0]
        assert "Activo" in args[1]
