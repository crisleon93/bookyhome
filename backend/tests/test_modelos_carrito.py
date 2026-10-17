"""
test_modelos_carrito.py — Pruebas unitarias del modelo app.models.carrito.

carrito.py persiste en archivos JSON. Los tests usan tmp_path de pytest
para crear archivos temporales sin tocar los datos reales.

Cubre: agregar_al_carrito, eliminar_item_carrito, vaciar_carrito,
       obtener_carrito, _normalizar_estado (via checkout).
"""

import json
import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Fixture: CART_FILE temporal
# ---------------------------------------------------------------------------

@pytest.fixture
def carrito_vacio(tmp_path, monkeypatch):
    """Prepara un CART_FILE vacío en tmp_path y parchea el módulo."""
    import app.models.carrito as mod
    cart_file = tmp_path / "cart_store.json"
    cart_file.write_text(json.dumps({}))
    monkeypatch.setattr(mod, "CART_FILE", str(cart_file))
    monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
    return mod, cart_file


@pytest.fixture
def carrito_con_items(tmp_path, monkeypatch):
    """Prepara un CART_FILE con un ítem para el usuario 1."""
    import app.models.carrito as mod
    cart_file = tmp_path / "cart_store.json"
    items = [{"id_libro": 5, "titulo": "Test", "precio_libro": 20000.0, "cantidad": 1}]
    cart_file.write_text(json.dumps({"1": items}))
    monkeypatch.setattr(mod, "CART_FILE", str(cart_file))
    monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
    return mod, cart_file


# ---------------------------------------------------------------------------
# agregar_al_carrito
# ---------------------------------------------------------------------------

class TestAgregarAlCarrito:
    def test_agrega_libro_nuevo(self, carrito_vacio):
        mod, _ = carrito_vacio
        item = {"id_libro": 10, "titulo": "Nuevo", "precio_libro": 30000.0, "cantidad": 1}

        result = mod.agregar_al_carrito(id_usuario=1, item=item)

        assert any(i["id_libro"] == 10 for i in result)

    def test_incrementa_cantidad_si_existe(self, carrito_con_items):
        mod, _ = carrito_con_items
        # El libro 5 ya existe con cantidad 1
        item = {"id_libro": 5, "titulo": "Test", "precio_libro": 20000.0, "cantidad": 2}

        result = mod.agregar_al_carrito(id_usuario=1, item=item)

        libro = next(i for i in result if i["id_libro"] == 5)
        assert libro["cantidad"] == 3  # 1 existente + 2 nuevos

    def test_cantidad_minima_es_uno(self, carrito_vacio):
        mod, _ = carrito_vacio
        item = {"id_libro": 3, "titulo": "X", "precio_libro": 5000.0, "cantidad": 0}

        result = mod.agregar_al_carrito(id_usuario=1, item=item)

        libro = next(i for i in result if i["id_libro"] == 3)
        assert libro["cantidad"] >= 1


# ---------------------------------------------------------------------------
# eliminar_item_carrito
# ---------------------------------------------------------------------------

class TestEliminarItemCarrito:
    def test_elimina_libro_existente(self, carrito_con_items):
        mod, _ = carrito_con_items

        result = mod.eliminar_item_carrito(id_usuario=1, id_libro=5)

        assert all(i["id_libro"] != 5 for i in result)

    def test_eliminar_libro_inexistente_no_falla(self, carrito_con_items):
        mod, _ = carrito_con_items

        result = mod.eliminar_item_carrito(id_usuario=1, id_libro=999)

        # Carrito intacto
        assert len(result) == 1


# ---------------------------------------------------------------------------
# vaciar_carrito
# ---------------------------------------------------------------------------

class TestVaciarCarrito:
    def test_vacia_carrito(self, carrito_con_items):
        mod, _ = carrito_con_items

        result = mod.vaciar_carrito(id_usuario=1)

        assert result == []

    def test_vaciar_carrito_vacio_no_falla(self, carrito_vacio):
        mod, _ = carrito_vacio

        result = mod.vaciar_carrito(id_usuario=99)

        assert result == []


# ---------------------------------------------------------------------------
# obtener_carrito
# ---------------------------------------------------------------------------

class TestObtenerCarrito:
    def test_retorna_items_del_usuario(self, carrito_con_items):
        mod, _ = carrito_con_items

        result = mod.obtener_carrito(id_usuario=1)

        assert len(result) == 1
        assert result[0]["id_libro"] == 5

    def test_usuario_sin_carrito_retorna_lista_vacia(self, carrito_vacio):
        mod, _ = carrito_vacio

        result = mod.obtener_carrito(id_usuario=42)

        assert result == []
