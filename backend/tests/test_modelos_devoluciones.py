"""
test_modelos_devoluciones.py — Tests unitarios de app.models.devoluciones.

Cubre: obtener_devoluciones_usuario, obtener_pedidos_elegibles_devolucion,
       crear_solicitud_devolucion, actualizar_estado_devolucion.
"""

import pytest
from unittest.mock import MagicMock, patch
import app.models.devoluciones as mod


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

class TestConstantes:
    def test_estados_elegibles_incluye_entregada(self):
        assert "Entregada" in mod.ESTADOS_ELEGIBLES

    def test_estados_elegibles_incluye_pagada(self):
        assert "Pagada" in mod.ESTADOS_ELEGIBLES

    def test_estados_devolucion_activos_incluye_solicitada(self):
        assert "Solicitada" in mod.ESTADOS_DEVOLUCION_ACTIVOS

    def test_estados_devolucion_activos_incluye_en_revision(self):
        assert "En Revision" in mod.ESTADOS_DEVOLUCION_ACTIVOS


# ---------------------------------------------------------------------------
# obtener_devoluciones_usuario
# ---------------------------------------------------------------------------

class TestObtenerDevolucionesUsuario:
    def test_retorna_lista_de_devoluciones(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchall.return_value = [
            {"id_devolucion": 1, "estado_devolucion": "Solicitada"},
            {"id_devolucion": 2, "estado_devolucion": "Aprobada"},
        ]

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_devoluciones_usuario(id_usuario=1)

        assert len(result) == 2

    def test_retorna_lista_vacia_sin_devoluciones(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchall.return_value = []

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_devoluciones_usuario(id_usuario=99)

        assert result == []

    def test_retorna_lista_vacia_ante_error_bd(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("BD error")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_devoluciones_usuario(id_usuario=1)

        assert result == []


# ---------------------------------------------------------------------------
# obtener_pedidos_elegibles_devolucion
# ---------------------------------------------------------------------------

class TestObtenerPedidosElegibles:
    def test_retorna_pedidos_elegibles(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchall.return_value = [
            {"id_orden": 10, "estado_orden": "Entregada", "total": 50000},
        ]

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_pedidos_elegibles_devolucion(id_usuario=1)

        assert len(result) == 1
        assert result[0]["id_orden"] == 10

    def test_retorna_lista_vacia_sin_pedidos(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchall.return_value = []

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_pedidos_elegibles_devolucion(id_usuario=99)

        assert result == []

    def test_retorna_lista_vacia_ante_error(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("error")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.obtener_pedidos_elegibles_devolucion(id_usuario=1)

        assert result == []


# ---------------------------------------------------------------------------
# crear_solicitud_devolucion
# ---------------------------------------------------------------------------

class TestCrearSolicitudDevolucion:
    def test_crea_devolucion_exitosamente(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.lastrowid = 5
        # fetchone: orden existe, sin devolucion activa, luego la devolucion creada
        cursor_mock.fetchone.side_effect = [
            {"id_orden": 1, "estado_orden": "Entregada", "total": 50000},  # orden elegible
            None,  # sin devolucion activa
            {"id_devolucion": 5, "estado_devolucion": "Solicitada"},  # resultado
        ]

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_solicitud_devolucion(
                id_usuario=1, id_orden=1, motivo="Producto dañado"
            )

        assert result["ok"] is True
        assert "devolucion" in result

    def test_falla_si_orden_no_elegible(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = None  # orden no encontrada

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_solicitud_devolucion(
                id_usuario=1, id_orden=99, motivo="Producto dañado"
            )

        assert result["ok"] is False
        assert "no existe o no es elegible" in result["error"]

    def test_falla_si_ya_tiene_devolucion_activa(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.side_effect = [
            {"id_orden": 1, "estado_orden": "Entregada", "total": 50000},  # orden ok
            {"id_devolucion": 3},  # devolucion activa ya existe
        ]

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_solicitud_devolucion(
                id_usuario=1, id_orden=1, motivo="Error"
            )

        assert result["ok"] is False
        assert "activa" in result["error"]

    def test_falla_ante_error_bd(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("BD error")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.crear_solicitud_devolucion(
                id_usuario=1, id_orden=1, motivo="Error"
            )

        assert result["ok"] is False


# ---------------------------------------------------------------------------
# actualizar_estado_devolucion
# ---------------------------------------------------------------------------

class TestActualizarEstadoDevolucion:
    def test_actualiza_estado_valido(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {
            "id_devolucion": 1, "estado_devolucion": "Aprobada"
        }

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_estado_devolucion(
                id_devolucion=1, nuevo_estado="Aprobada"
            )

        assert result["ok"] is True

    def test_falla_con_estado_invalido(self):
        with patch.object(mod, "get_db", return_value=MagicMock()):
            result = mod.actualizar_estado_devolucion(
                id_devolucion=1, nuevo_estado="EstadoInvalido"
            )

        assert result["ok"] is False
        assert "Estado no válido" in result["error"]

    def test_incluye_notas_vendedor_si_se_pasa(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {"id_devolucion": 1, "estado_devolucion": "Rechazada"}

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_estado_devolucion(
                id_devolucion=1,
                nuevo_estado="Rechazada",
                notas_vendedor="No cumple condiciones",
                monto_reembolso=0.0,
                tipo_resolucion="Rechazo"
            )

        assert result["ok"] is True

    def test_falla_ante_error_bd(self):
        db_mock, cursor_mock = MagicMock(), MagicMock()
        db_mock.cursor.return_value = cursor_mock
        cursor_mock.execute.side_effect = Exception("BD error")

        with patch.object(mod, "get_db", return_value=db_mock):
            result = mod.actualizar_estado_devolucion(
                id_devolucion=1, nuevo_estado="Aprobada"
            )

        assert result["ok"] is False
