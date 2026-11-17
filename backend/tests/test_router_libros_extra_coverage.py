import asyncio
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

import app.routers.libros as mod


def test_seller_dashboard_endpoints_forward_store_id_and_parameters():
    tienda = {"id_tienda": 3, "estado_tienda": "activa"}
    with patch.object(mod, "obtener_tienda_por_usuario", return_value=tienda), \
         patch.object(mod, "obtener_pedidos_tienda", return_value=[{"id_orden": 1}]) as orders, \
         patch.object(mod, "obtener_ventas_tienda", return_value=[{"total": 20}]) as sales, \
         patch.object(mod, "obtener_stats_ventas", return_value={"total": 20}) as stats, \
         patch.object(mod, "obtener_top_vendidos", return_value=[{"id_libro": 2}]) as top, \
         patch.object(mod, "obtener_alertas_stock", return_value=[]) as alerts:
        assert mod.mis_pedidos({"sub": "7"}) == [{"id_orden": 1}]
        assert mod.mis_ventas({"sub": "7"}) == [{"total": 20}]
        assert mod.stats_ventas({"sub": "7"}) == {"total": 20}
        assert mod.top_vendidos({"sub": "7"}) == [{"id_libro": 2}]
        assert mod.alertas_stock(umbral=6, user={"sub": "7"}) == []

    orders.assert_called_once_with(3)
    sales.assert_called_once_with(3)
    stats.assert_called_once_with(3)
    top.assert_called_once_with(3, limite=5)
    alerts.assert_called_once_with(3, 6)

    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 3, "estado_tienda": "suspendida"}):
        with pytest.raises(HTTPException) as suspended:
            mod.mis_pedidos({"sub": "7"})
    assert suspended.value.status_code == 403


def test_publish_validates_inputs_and_returns_published_book():
    common = (1, "Titulo", "Autora", "Descripcion", 20000, 2, "nuevo")
    with pytest.raises(HTTPException) as invalid_state:
        asyncio.run(mod.publicar_libro(1, "Titulo", "Autora", "Descripcion", 20000, 2, "sin_estado", user={"sub": "7"}))
    assert invalid_state.value.status_code == 400

    with pytest.raises(HTTPException) as invalid_price:
        asyncio.run(mod.publicar_libro(1, "Titulo", "Autora", "Descripcion", 0, 2, "nuevo", user={"sub": "7"}))
    assert invalid_price.value.status_code == 400

    with pytest.raises(HTTPException) as invalid_stock:
        asyncio.run(mod.publicar_libro(1, "Titulo", "Autora", "Descripcion", 20000, 0, "nuevo", user={"sub": "7"}))
    assert invalid_stock.value.status_code == 400

    with patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 3}), \
         patch.object(mod, "crear_libro", return_value={"ok": True, "id_libro": 55}) as create:
        result = asyncio.run(mod.publicar_libro(
            *common,
            isbn=None,
            acceso_anticipado=False,
            nivel_minimo_acceso="Plata",
            fecha_lanzamiento_publico=None,
            imagenes=None,
            user={"sub": "7"},
        ))

    assert result == {
        "mensaje": "Libro publicado exitosamente", "id_libro": 55, "imagenes": [],
    }
    create.assert_called_once()


def test_edit_delete_and_hide_seller_books():
    tienda = {"id_tienda": 3, "estado_tienda": "activa"}
    args = (4, 1, "Titulo", "Autora", "Descripcion", 20000, 2, "nuevo")
    with patch.object(mod, "obtener_tienda_por_usuario", return_value=tienda), \
         patch.object(mod, "editar_libro", return_value={"ok": True}) as edit:
        assert mod.editar(
            *args,
            isbn=None,
            acceso_anticipado=False,
            nivel_minimo_acceso="Plata",
            fecha_lanzamiento_publico=None,
            user={"sub": "7"},
        ) == {
            "mensaje": "Libro actualizado correctamente",
        }
    edit.assert_called_once()

    with patch.object(mod, "obtener_tienda_por_usuario", return_value=tienda), \
         patch.object(mod, "eliminar_libro", return_value={"ok": True}) as delete:
        assert mod.eliminar(4, {"sub": "7"}) == {
            "mensaje": "Libro eliminado correctamente",
        }
    delete.assert_called_once_with(4, 3)

    with patch.object(mod, "obtener_tienda_por_usuario", return_value=tienda), \
         patch.object(mod, "ocultar_libro", return_value={"ok": True}) as hide:
        assert mod.ocultar(4, {"oculto": True}, {"sub": "7"}) == {
            "mensaje": "Estado del libro actualizado correctamente",
        }
    hide.assert_called_once_with(4, True, id_tienda=3)


def test_variant_listing_normalizes_decimal_and_creation_checks_owner():
    db_list, cursor_list = MagicMock(), MagicMock()
    cursor_list.fetchall.return_value = [{"precio_variante": Decimal("12.50")}]
    db_list.cursor.return_value = cursor_list
    db_create, cursor_create = MagicMock(), MagicMock()
    cursor_create.fetchone.return_value = {"id_tienda": 3}
    cursor_create.lastrowid = 17
    db_create.cursor.return_value = cursor_create

    with patch("app.database.get_db", side_effect=[db_list, db_create]), \
         patch.object(mod, "obtener_tienda_por_usuario", return_value={"id_tienda": 3}):
        assert mod.get_variantes_libro(4) == [{"precio_variante": 12.5}]
        assert mod.crear_variante_libro(4, {"precio_variante": "14.5"}, {"sub": "7"}) == {
            "ok": True, "id_variante": 17,
        }

    db_list.close.assert_called_once()
    cursor_create.close.assert_called_once()
    db_create.commit.assert_called_once()
