"""
test_modelos_libro.py — Pruebas unitarias del modelo app.models.libro.

Cubre: crear_libro, eliminar_libro, editar_libro, actualizar_stock,
       validar_disponibilidad, descontar_stock, ocultar_libro.
Patrón AAA. Mock de get_db para aislar de la BD real.
"""

import pytest
from unittest.mock import MagicMock, patch
import app.models.libro as mod


# ---------------------------------------------------------------------------
# crear_libro
# ---------------------------------------------------------------------------

class TestCrearLibro:
    def test_crea_libro_retorna_ok_true_con_id(self):
        # Arrange
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.lastrowid = 42

        with patch.object(mod, "get_db", return_value=db_mock):
            # Act
            result = mod.crear_libro(
                id_tienda=1, id_categoria=2, titulo="El Quijote",
                autor="Cervantes", descripcion="Clásico", precio=35000.0,
                stock=10, estado="nuevo"
            )
        # Assert
        assert result["ok"] is True
        assert result["id_libro"] == 42

    def test_error_bd_retorna_ok_false(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("Duplicate key")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_libro(1, 2, "T", "A", "D", 1000.0, 1, "nuevo")

        assert result["ok"] is False
        assert "error" in result


# ---------------------------------------------------------------------------
# eliminar_libro
# ---------------------------------------------------------------------------

class TestEliminarLibro:
    def test_elimina_libro_propio(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        # Simula que el libro pertenece a la tienda 5
        cursor_mock.fetchone.return_value = (5,)

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_libro(id_libro=10, id_tienda=5)

        assert result["ok"] is True

    def test_no_puede_eliminar_libro_ajeno(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        # El libro pertenece a tienda 99, no a la 5
        cursor_mock.fetchone.return_value = (99,)

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_libro(id_libro=10, id_tienda=5)

        assert result["ok"] is False
        assert "No autorizado" in result["error"]

    def test_libro_inexistente_retorna_error(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_libro(id_libro=999, id_tienda=5)

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# editar_libro
# ---------------------------------------------------------------------------

class TestEditarLibro:
    def test_edita_libro_propio(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (3,)  # libro pertenece a tienda 3

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_libro(
                id_libro=7, id_tienda=3, id_categoria=1,
                titulo="Nuevo título", autor="Autor", descripcion="Desc",
                precio=20000.0, stock=5, estado="usado_buen_estado"
            )

        assert result["ok"] is True

    def test_no_puede_editar_libro_ajeno(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (99,)  # tienda diferente

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_libro(
                id_libro=7, id_tienda=3, id_categoria=1,
                titulo="T", autor="A", descripcion="D",
                precio=20000.0, stock=5, estado="nuevo"
            )

        assert result["ok"] is False
        assert "No autorizado" in result["error"]


# ---------------------------------------------------------------------------
# actualizar_stock
# ---------------------------------------------------------------------------

class TestActualizarStock:
    def test_actualiza_stock_correctamente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (2,)  # libro pertenece a tienda 2

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_stock(id_libro=5, id_tienda=2, nuevo_stock=20)

        assert result["ok"] is True

    def test_no_actualiza_stock_tienda_ajena(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (99,)

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_stock(id_libro=5, id_tienda=2, nuevo_stock=20)

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# validar_disponibilidad
# ---------------------------------------------------------------------------

class TestValidarDisponibilidad:
    def test_stock_suficiente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {"titulo": "Libro X", "stock": 10}

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.validar_disponibilidad(id_libro=1, cantidad=3)

        assert result["disponible"] is True
        assert result["stock_actual"] == 10

    def test_stock_insuficiente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {"titulo": "Libro Y", "stock": 2}

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.validar_disponibilidad(id_libro=1, cantidad=5)

        assert result["disponible"] is False
        assert "2" in result["error"]

    def test_stock_cero(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {"titulo": "Agotado", "stock": 0}

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.validar_disponibilidad(id_libro=1, cantidad=1)

        assert result["disponible"] is False

    def test_libro_no_encontrado(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.validar_disponibilidad(id_libro=999, cantidad=1)

        assert result["disponible"] is False
        assert "no encontrado" in result["error"].lower()


# ---------------------------------------------------------------------------
# descontar_stock
# ---------------------------------------------------------------------------

class TestDescontarStock:
    def test_descuenta_correctamente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {"stock": 8}

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.descontar_stock(id_libro=1, cantidad=3)

        assert result["ok"] is True
        assert result["stock_restante"] == 5

    def test_stock_insuficiente_retorna_error(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {"stock": 1}

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.descontar_stock(id_libro=1, cantidad=5)

        assert result["ok"] is False
        assert "insuficiente" in result["error"].lower()

    def test_libro_no_encontrado(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.descontar_stock(id_libro=999, cantidad=1)

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# ocultar_libro
# ---------------------------------------------------------------------------

class TestOcultarLibro:
    def test_oculta_libro_vendedor(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.rowcount = 1

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.ocultar_libro(id_libro=3, ocultar_estado=True, id_tienda=2)

        assert result["ok"] is True

    def test_libro_no_existe_rowcount_cero(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.rowcount = 0  # ninguna fila afectada

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.ocultar_libro(id_libro=999, ocultar_estado=True, id_tienda=2)

        assert result["ok"] is False

    def test_admin_oculta_sin_tienda(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.rowcount = 1

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.ocultar_libro(id_libro=3, ocultar_estado=False, id_tienda=None)

        assert result["ok"] is True
