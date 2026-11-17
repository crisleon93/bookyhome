"""
test_modelos_oferta_extra_coverage.py — Ramas de app/models/oferta.py no cubiertas.

Ya cubierto en test_modelos_oferta.py (NO duplicar):
  - calcular_precio_con_descuento: porcentaje, fijo, especial, tipo desconocido
  - crear_oferta: exitoso y error BD
  - editar_oferta: propia, ajena (None y tienda distinta), error BD
  - eliminar_oferta: propia, ajena, inexistente
  - asignar_libros_oferta: lista, vacía, error BD
  - obtener_ofertas_tienda, obtener_oferta_detalle, obtener_oferta_activa_libro

Nuevas ramas:
  - calcular_precio_con_descuento tipo desconocido (retorna precio original)
  - editar_oferta: oferta no pertenece a la tienda (row[0] != id_tienda) → "No autorizado"
  - editar_oferta: error BD → rollback
  - eliminar_oferta: oferta no pertenece a la tienda → "No autorizado"
  - eliminar_oferta: error BD → rollback
  - obtener_oferta_detalle: oferta no existe → retorna None
  - asignar_libros_oferta: error BD → rollback
"""

import pytest
from unittest.mock import MagicMock, patch, call
import app.models.oferta as mod


# ---------------------------------------------------------------------------
# calcular_precio_con_descuento — tipo desconocido
# ---------------------------------------------------------------------------

class TestCalcularPrecioConDescuentoExtra:
    def test_tipo_desconocido_retorna_precio_original(self):
        result = mod.calcular_precio_con_descuento(25000.0, "bogo", 10)
        assert result == 25000.0

    def test_porcentaje_cero_retorna_precio_original(self):
        result = mod.calcular_precio_con_descuento(50000.0, "porcentaje", 0)
        assert result == 50000.0

    def test_fijo_igual_al_precio_retorna_cero(self):
        result = mod.calcular_precio_con_descuento(10000.0, "fijo", 10000)
        assert result == 0.0

    def test_especial_cantidad_uno(self):
        # 1 libro: pagadas = (1//2)+(1%2) = 0+1 = 1 → total=precio, unit=precio
        result = mod.calcular_precio_con_descuento(10000.0, "especial", 0, cantidad=1)
        assert result == 10000.0


# ---------------------------------------------------------------------------
# editar_oferta — oferta no pertenece a la tienda (row[0] != id_tienda)
# ---------------------------------------------------------------------------

class TestEditarOfertaNoAutorizado:
    def test_oferta_pertenece_a_otra_tienda(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        # row[0] = 99 (otra tienda), id_tienda = 3
        cursor_mock.fetchone.return_value = (99,)

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_oferta(5, 3, "Nombre", "fijo", 1000, "2026-01-01", "2026-01-31")

        assert result["ok"] is False
        assert "No autorizado" in result["error"]
        # No debe haber commit
        db_mock.commit.assert_not_called()

    def test_oferta_no_existe_retorna_no_autorizado(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_oferta(999, 3, "X", "fijo", 100, "2026-01-01", "2026-01-31")

        assert result["ok"] is False


class TestEditarOfertaErrorBD:
    def test_error_bd_hace_rollback(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        # Primero fetchone devuelve la oferta correcta, luego el UPDATE falla
        cursor_mock.fetchone.return_value = (3,)  # tienda correcta
        cursor_mock.execute.side_effect = [None, Exception("FK constraint")]

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_oferta(5, 3, "X", "fijo", 100, "2026-01-01", "2026-01-31")

        assert result["ok"] is False
        db_mock.rollback.assert_called_once()


# ---------------------------------------------------------------------------
# eliminar_oferta — oferta no pertenece a la tienda
# ---------------------------------------------------------------------------

class TestEliminarOfertaNoAutorizado:
    def test_oferta_pertenece_a_otra_tienda(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (88,)  # tienda 88, se pide tienda 2

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_oferta(id_oferta=4, id_tienda=2)

        assert result["ok"] is False
        assert "No autorizado" in result["error"]
        db_mock.commit.assert_not_called()


class TestEliminarOfertaErrorBD:
    def test_error_bd_hace_rollback(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        # fetchone devuelve tienda correcta, el DELETE falla
        cursor_mock.fetchone.return_value = (2,)
        cursor_mock.execute.side_effect = [None, Exception("FK error")]

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_oferta(id_oferta=4, id_tienda=2)

        assert result["ok"] is False
        db_mock.rollback.assert_called_once()


# ---------------------------------------------------------------------------
# obtener_oferta_detalle — oferta no existe retorna None
# ---------------------------------------------------------------------------

class TestObtenerOfertaDetalleNoExiste:
    def test_oferta_no_existe_retorna_none(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_oferta_detalle(id_oferta=999, id_tienda=1)

        assert result is None

    def test_tienda_no_coincide_retorna_none(self):
        """La query filtra por id_tienda, así que un mismatch devuelve None."""
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_oferta_detalle(id_oferta=1, id_tienda=99)

        assert result is None


# ---------------------------------------------------------------------------
# asignar_libros_oferta — error BD → rollback
# ---------------------------------------------------------------------------

class TestAsignarLibrosOfertaRollback:
    def test_error_en_insert_hace_rollback(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        # El DELETE pasa, el primer INSERT falla
        cursor_mock.execute.side_effect = [None, Exception("ER_DUP_ENTRY")]

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.asignar_libros_oferta(id_oferta=1, ids_libros=[10, 20])

        assert result["ok"] is False
        db_mock.rollback.assert_called_once()

    def test_error_en_delete_hace_rollback(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        # El DELETE mismo falla
        cursor_mock.execute.side_effect = Exception("tabla no existe")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.asignar_libros_oferta(id_oferta=1, ids_libros=[1])

        assert result["ok"] is False
        db_mock.rollback.assert_called_once()
