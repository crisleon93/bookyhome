"""
test_modelos_libro.py — Pruebas unitarias del modelo app.models.libro.

Cubre: crear_libro, eliminar_libro, editar_libro, actualizar_stock,
       validar_disponibilidad, descontar_stock, ocultar_libro.
Patrón AAA. Mock de get_db para aislar de la BD real.
"""

import pytest
from datetime import datetime
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


class TestConsultasCatalogo:
    def test_lista_libros_normaliza_imagenes_y_estado_oculto(self):
        db, cursor = MagicMock(), MagicMock()
        db.cursor.return_value = cursor
        cursor.fetchall.return_value = [
            {"id_libro": 1, "oculto": True, "imagenes": "uno.jpg,dos.jpg"},
            {"id_libro": 2, "oculto": False, "imagenes": None},
        ]

        with patch.object(mod, "get_db", return_value=db):
            libros = mod.obtener_libros_por_tienda(5)

        assert libros == [
            {"id_libro": 1, "oculto": 1, "imagenes": ["uno.jpg", "dos.jpg"]},
            {"id_libro": 2, "oculto": 0, "imagenes": []},
        ]
        cursor.close.assert_called_once()
        db.close.assert_called_once()

    def test_libros_visibles_y_busqueda_isbn_normalizan_imagenes(self):
        db, cursor = MagicMock(), MagicMock()
        db.cursor.return_value = cursor
        cursor.fetchall.side_effect = [
            [{"id_libro": 1, "imagenes": None}],
            [{"id_libro": 2, "imagenes": "a.jpg,b.jpg"}],
        ]

        with patch.object(mod, "get_db", return_value=db):
            visibles = mod.obtener_libros_visibles_por_tienda(5)
            encontrados = mod.buscar_libro_por_isbn("9780000000000")

        assert visibles[0]["imagenes"] == []
        assert encontrados[0]["imagenes"] == ["a.jpg", "b.jpg"]
        assert cursor.execute.call_count == 2

    def test_busqueda_isbn_devuelve_lista_vacia_si_la_consulta_falla(self):
        db, cursor = MagicMock(), MagicMock()
        db.cursor.return_value = cursor
        cursor.execute.side_effect = RuntimeError("query failed")

        with patch.object(mod, "get_db", return_value=db):
            assert mod.buscar_libro_por_isbn("9780000000000") == []

        cursor.close.assert_called_once()
        db.close.assert_called_once()

    def test_busca_libro_y_categorias_deja_relaciones_en_forma_de_lista(self):
        db, cursor = MagicMock(), MagicMock()
        db.cursor.return_value = cursor
        cursor.fetchone.return_value = {"id_libro": 4}
        cursor.fetchall.side_effect = [
            [{"url_imagen": "portada.jpg"}, {"url_imagen": None}],
            [{"id_categoria": 1, "nombre_categoria": "Ficción"}],
        ]

        with patch.object(mod, "get_db", return_value=db):
            libro = mod.obtener_libro_por_id(4)
            categorias = mod.obtener_categorias()

        assert libro["imagenes"] == ["portada.jpg"]
        assert categorias == [{"id_categoria": 1, "nombre_categoria": "Ficción"}]


class TestEstadisticasLibro:
    def test_stats_y_top_vendidos_convierten_tipos_y_portadas(self):
        db, cursor = MagicMock(), MagicMock()
        db.cursor.return_value = cursor
        cursor.fetchone.side_effect = [
            {"total_hoy": "12000.50", "ordenes_hoy": "2"},
            {"total_mes": "40000", "ordenes_mes": "5"},
            {"total_semana": "22000"},
        ]
        cursor.fetchall.return_value = [
            {
                "id_libro": 2,
                "titulo": "Libro",
                "unidades_vendidas": "3",
                "total_generado": "45000",
                "imagenes": "uno.jpg,dos.jpg",
            },
            {
                "id_libro": 3,
                "titulo": "Sin portada",
                "unidades_vendidas": 0,
                "total_generado": 0,
                "imagenes": None,
            },
        ]

        with patch.object(mod, "get_db", return_value=db):
            stats = mod.obtener_stats_ventas(5)
            top = mod.obtener_top_vendidos(5, limite=2)

        assert stats == {
            "total_hoy": 12000.5,
            "ordenes_hoy": 2,
            "total_semana": 22000.0,
            "total_mes": 40000.0,
            "ordenes_mes": 5,
        }
        assert top[0]["unidades_vendidas"] == 3
        assert top[0]["total_generado"] == 45000.0
        assert top[0]["imagenes"] == ["uno.jpg", "dos.jpg"]
        assert top[1]["imagenes"] == []


class TestEliminarLibroAdmin:
    def test_oculta_libro_con_ordenes_y_elimina_libro_sin_ordenes(self):
        db, cursor = MagicMock(), MagicMock()
        db.cursor.return_value = cursor
        cursor.fetchone.side_effect = [(2,), (0,)]

        with patch.object(mod, "get_db", return_value=db):
            con_ordenes = mod.eliminar_libro_por_admin(1)
            sin_ordenes = mod.eliminar_libro_por_admin(2)

        assert con_ordenes["modo"] == "ocultado"
        assert sin_ordenes == {"ok": True, "modo": "eliminado"}
        assert cursor.execute.call_count == 7
        assert db.commit.call_count == 2


@pytest.mark.parametrize(
    ("isbn", "expected"),
    [
        ("0-306-40615-2", "0306406152"),
        ("978-0-306-40615-7", "9780306406157"),
        ("030640615x", "030640615X"),
        ("", None),
        ("12345", None),
        ("ABCDEFGHIJ", None),
        ("978030640615X", None),
    ],
)
def test_normaliza_isbn_valido_y_rechaza_formatos_invalidos(isbn, expected):
    assert mod.validar_y_normalizar_isbn(isbn) == expected


def test_pedidos_tienda_agrupa_items_calcula_descuentos_y_adjunta_guia():
    db, cursor = MagicMock(), MagicMock()
    db.cursor.return_value = cursor
    fecha = datetime(2026, 5, 4, 14, 30)
    pedido_pagado = {
        "id_orden": 10,
        "id_comprador": 7,
        "fecha": fecha,
        "estado": "pagado",
        "total_orden": 30000,
        "costo_envio": 5000,
        "costo_envio_tienda": 2500,
        "id_libro": 2,
        "cantidad": 2,
        "precio_libro": 10000,
        "porcentaje_descuento": 10,
        "precio_final": 0,
        "titulo": "Libro con descuento",
        "autor_libro": "Autora",
        "imagen": "portada.jpg",
        "cliente": "Ana",
        "correo_cliente": "ana@example.com",
        "foto_perfil_cliente": None,
    }
    segundo_item = {
        **pedido_pagado,
        "id_libro": 3,
        "cantidad": 1,
        "precio_libro": 10000,
        "porcentaje_descuento": 0,
        "precio_final": 8500,
        "titulo": "Libro con precio guardado",
    }
    cursor.fetchall.side_effect = [
        [pedido_pagado, segundo_item],
        [{
            "id_orden": 10,
            "id_empresa": 2,
            "empresa_mensajeria": "Mensajería",
            "numero_guia": "GUIA-10",
            "estado_envio": "En tránsito",
            "fecha_estimada_entrega": fecha.date(),
            "costo_envio": "2500",
        }],
    ]
    from app.models import envios

    with patch.object(mod, "get_db", return_value=db), \
            patch.object(envios, "limpiar_envios_no_pagados"), \
            patch.object(envios, "EMPRESAS_MENSAJERIA", [{
                "id_empresa": 2,
                "sitio_web": "https://carrier.example.com",
                "url_rastreo": "https://carrier.example.com/track",
            }]):
        pedidos = mod.obtener_pedidos_tienda(5)

    assert len(pedidos) == 1
    pedido = pedidos[0]
    assert pedido["id_orden_unico"] == "7-10"
    assert pedido["fecha"] == "2026-05-04T14:30:00"
    assert [item["total_linea"] for item in pedido["items"]] == [18000.0, 8500.0]
    assert pedido["total_tienda"] == 26500.0
    assert pedido["envio"]["numero_guia"] == "GUIA-10"
    assert pedido["envio"]["url_rastreo"] == "https://carrier.example.com/track"
    cursor.close.assert_called_once()
    db.close.assert_called_once()


def test_ventas_tienda_excluye_pedidos_pendientes_y_proyecta_items():
    pedidos = [
        {
            "id_orden": 1,
            "fecha": "2026-05-04",
            "estado": "Pagado",
            "cliente": "Ana",
            "correo_cliente": "ana@example.com",
            "items": [{
                "id_libro": 2,
                "titulo": "Libro vendido",
                "autor_libro": "Autora",
                "imagen": None,
                "precio_libro": 12000,
                "cantidad": 2,
                "total_linea": 22000,
            }],
        },
        {"id_orden": 2, "estado": "pendiente", "items": [{"titulo": "Aún no vendido"}]},
    ]
    with patch.object(mod, "obtener_pedidos_tienda", return_value=pedidos):
        ventas = mod.obtener_ventas_tienda(5)

    assert ventas == [{
        "id_orden": 1,
        "fecha": "2026-05-04",
        "estado": "Pagado",
        "cliente": "Ana",
        "correo_cliente": "ana@example.com",
        "id_libro": 2,
        "titulo": "Libro vendido",
        "autor_libro": "Autora",
        "imagen": None,
        "foto_perfil_cliente": None,
        "precio_libro": 12000,
        "cantidad": 2,
        "total": 22000,
    }]
