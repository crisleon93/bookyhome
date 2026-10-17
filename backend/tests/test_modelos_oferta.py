"""
test_modelos_oferta.py — Pruebas unitarias del modelo app.models.oferta.

Cubre: crear_oferta, editar_oferta, eliminar_oferta, asignar_libros_oferta,
       calcular_precio_con_descuento (pura, sin BD).
Patrón AAA. Mock de get_db para aislar de la BD real.
"""

import pytest
from unittest.mock import MagicMock, patch
import app.models.oferta as mod


# ---------------------------------------------------------------------------
# calcular_precio_con_descuento — función pura, sin BD
# ---------------------------------------------------------------------------

class TestCalcularPrecioConDescuento:
    def test_porcentaje_20(self):
        # Arrange
        precio, tipo, valor = 50000.0, "porcentaje", 20
        # Act
        resultado = mod.calcular_precio_con_descuento(precio, tipo, valor)
        # Assert
        assert resultado == 40000.0

    def test_porcentaje_100_da_cero(self):
        resultado = mod.calcular_precio_con_descuento(30000.0, "porcentaje", 100)
        assert resultado == 0.0

    def test_fijo_resta_valor(self):
        resultado = mod.calcular_precio_con_descuento(20000.0, "fijo", 5000)
        assert resultado == 15000.0

    def test_fijo_no_da_negativo(self):
        # Si el descuento supera el precio, el resultado debe ser 0
        resultado = mod.calcular_precio_con_descuento(1000.0, "fijo", 5000)
        assert resultado == 0.0

    def test_especial_2x1_cuatro_libros(self):
        # 4 libros 2x1: pagas 2 → precio unitario efectivo = total/4
        resultado = mod.calcular_precio_con_descuento(10000.0, "especial", 0, cantidad=4)
        assert resultado == 5000.0

    def test_especial_2x1_tres_libros(self):
        # 3 libros: pagas 2 (floor(3/2)=1 gratis + 2 pagan) → total=20000 → unit=6666.67
        resultado = mod.calcular_precio_con_descuento(10000.0, "especial", 0, cantidad=3)
        assert resultado == pytest.approx(6666.67, rel=1e-2)

    def test_tipo_desconocido_retorna_precio_original(self):
        resultado = mod.calcular_precio_con_descuento(25000.0, "inexistente", 10)
        assert resultado == 25000.0


# ---------------------------------------------------------------------------
# crear_oferta
# ---------------------------------------------------------------------------

class TestCrearOferta:
    def test_crea_oferta_retorna_ok_con_id(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.lastrowid = 7

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_oferta(
                id_tienda=1, nombre="Promo verano", tipo="porcentaje",
                valor=15.0, fecha_inicio="2026-11-01", fecha_fin="2026-11-30"
            )

        assert result["ok"] is True
        assert result["id_oferta"] == 7

    def test_error_bd_retorna_ok_false(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("BD error")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_oferta(1, "T", "porcentaje", 10, "2026-01-01", "2026-01-31")

        assert result["ok"] is False
        assert "error" in result


# ---------------------------------------------------------------------------
# editar_oferta
# ---------------------------------------------------------------------------

class TestEditarOferta:
    def test_edita_oferta_propia(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (3,)  # oferta pertenece a tienda 3

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_oferta(
                id_oferta=5, id_tienda=3, nombre="Oferta editada",
                tipo="fijo", valor=2000, fecha_inicio="2026-12-01", fecha_fin="2026-12-31"
            )

        assert result["ok"] is True

    def test_no_puede_editar_oferta_ajena(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (99,)  # tienda diferente

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_oferta(5, 3, "X", "fijo", 100, "2026-01-01", "2026-01-31")

        assert result["ok"] is False
        assert "No autorizado" in result["error"]

    def test_oferta_inexistente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.editar_oferta(999, 3, "X", "fijo", 100, "2026-01-01", "2026-01-31")

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# eliminar_oferta
# ---------------------------------------------------------------------------

class TestEliminarOferta:
    def test_elimina_oferta_propia(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (2,)  # tienda 2

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_oferta(id_oferta=4, id_tienda=2)

        assert result["ok"] is True

    def test_no_elimina_oferta_ajena(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = (99,)

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_oferta(id_oferta=4, id_tienda=2)

        assert result["ok"] is False

    def test_oferta_inexistente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.eliminar_oferta(id_oferta=999, id_tienda=2)

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# asignar_libros_oferta
# ---------------------------------------------------------------------------

class TestAsignarLibrosOferta:
    def test_asigna_lista_de_libros(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.asignar_libros_oferta(id_oferta=1, ids_libros=[10, 20, 30])

        assert result["ok"] is True
        # Verifica que se llamó DELETE + 3 INSERT
        assert cursor_mock.execute.call_count == 4

    def test_asigna_lista_vacia(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.asignar_libros_oferta(id_oferta=1, ids_libros=[])

        assert result["ok"] is True
        # Solo el DELETE, ningún INSERT
        assert cursor_mock.execute.call_count == 1

    def test_error_bd_retorna_ok_false(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("FK error")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.asignar_libros_oferta(id_oferta=1, ids_libros=[1, 2])

        assert result["ok"] is False
