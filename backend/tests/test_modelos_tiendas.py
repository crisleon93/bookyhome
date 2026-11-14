"""
test_modelos_tiendas.py — Pruebas unitarias del modelo app.models.tiendas.

Cubre: crear_libreria, actualizar_tienda, obtener_tienda_por_usuario.
Patrón AAA. Mock de get_db para aislar de la BD real.
"""

import pytest
from unittest.mock import MagicMock, patch
import app.models.tiendas as mod


# ---------------------------------------------------------------------------
# crear_libreria
# ---------------------------------------------------------------------------

class TestCrearLibreria:
    def test_crea_libreria_retorna_ok(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.lastrowid = 10

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_libreria(
                nombre="Ana García",
                nombre_libreria="Librería El Saber",
                direccion="Calle 10 #5-20",
                telefono="3001234567",
                email="ana@libreria.com",
                password="Segura123"
            )

        assert result["ok"] is True

    def test_error_email_duplicado_retorna_ok_false(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("Duplicate entry 'ana@libreria.com'")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_libreria(
                nombre="Ana", nombre_libreria="Librería",
                direccion="Dir", telefono="123",
                email="ana@libreria.com", password="pass"
            )

        assert result["ok"] is False
        assert "error" in result


# ---------------------------------------------------------------------------
# actualizar_tienda
# ---------------------------------------------------------------------------

class TestActualizarTienda:
    def test_actualiza_correctamente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_tienda(
                id_usuario=5,
                nombre_tienda="Nuevo Nombre",
                direccion="Nueva Dir",
                telefono="3009876543"
            )

        assert result["ok"] is True
        sql = cursor_mock.execute.call_args[0][0]
        assert "UPDATE" in sql.upper()

    def test_error_bd_retorna_ok_false(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("BD caída")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_tienda(5, "T", "D", "123")

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# obtener_tienda_por_usuario
# ---------------------------------------------------------------------------

class TestObtenerTiendaPorUsuario:
    def test_retorna_tienda_si_existe(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {
            "id_tienda": 3, "nombre_tienda": "Librería Test", "estado_tienda": "activa"
        }

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_tienda_por_usuario(id_usuario=7)

        assert result is not None
        assert result["id_tienda"] == 3

    def test_retorna_none_si_no_existe(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_tienda_por_usuario(id_usuario=999)

        assert result is None

    def test_error_bd_retorna_none(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("BD error")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_tienda_por_usuario(id_usuario=1)

        assert result is None
