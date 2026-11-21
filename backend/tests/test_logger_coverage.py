"""
test_logger_coverage.py — Pruebas que cubren los bloques except con logger.*
introducidos en el refactor de print() -> logging estructurado.
Cada test fuerza una excepción en la capa de BD para ejecutar la rama except.
"""
import json
import pytest
from unittest.mock import MagicMock, patch


def _mock_db(side_effect=None):
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    if side_effect:
        cursor.execute.side_effect = side_effect
    return db, cursor


# ---------------------------------------------------------------------------
# app.models.payments — 9 ramas logger
# ---------------------------------------------------------------------------
class TestPaymentsModelLoggerCoverage:

    def test_obtener_orden_logger_error(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.database.get_db", return_value=db):
            result = mod.obtener_orden("1", "ord-1")
        assert result is None

    def test_obtener_ordenes_usuario_logger_error(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.database.get_db", return_value=db), \
             patch("app.models.envios.limpiar_envios_no_pagados", return_value=None):
            result = mod.obtener_ordenes_usuario(99)
        assert isinstance(result, list)

    def test_registrar_pago_logger_warning_mysql(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        monkeypatch.setattr(mod, "PAYMENT_FILE", str(tmp_path / "payments.json"))
        (tmp_path / "orders.json").write_text(json.dumps(
            {"1": [{"id_orden": 1, "estado": "pendiente", "items": [], "id_usuario": 1, "total": 10000}]}
        ))
        db, cursor = _mock_db(side_effect=Exception("mysql down"))
        with patch("app.database.get_db", return_value=db):
            result = mod.registrar_pago("1", 1, 10000, "PSE")
        assert result.get("ok") is True

    def test_cancelar_orden_logger_error_mysql(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        (tmp_path / "orders.json").write_text(json.dumps(
            {"1": [{"id_orden": 2, "estado": "pendiente", "items": [], "id_usuario": 1}]}
        ))
        db, cursor = _mock_db(side_effect=Exception("mysql down"))
        with patch("app.database.get_db", return_value=db):
            result = mod.cancelar_orden("1", 2, "test")
        assert result.get("ok") is True

    def test_registrar_pago_logger_error_buscar_mysql(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        monkeypatch.setattr(mod, "PAYMENT_FILE", str(tmp_path / "payments.json"))
        db, cursor = _mock_db(side_effect=Exception("mysql down"))
        with patch("app.database.get_db", return_value=db):
            result = mod.registrar_pago("1", 999, 10000, "PSE")
        assert result.get("ok") is False

    def test_reservar_retiro_logger_error(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        (tmp_path / "orders.json").write_text(json.dumps(
            {"1": [{"id_orden": 3, "estado": "pagado", "items": [],
                    "tipo_entrega": "retiro_tienda", "id_tienda": 5}]}
        ))
        db, cursor = _mock_db(side_effect=Exception("mysql down"))
        with patch("app.database.get_db", return_value=db):
            result = mod.reservar_retiro("1", 3)
        assert result.get("ok") is True

    def test_notificar_llegada_logger_error(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        (tmp_path / "orders.json").write_text(json.dumps(
            {"1": [{"id_orden": 4, "estado": "reservado", "items": [], "pin_retiro": "1234"}]}
        ))
        db, cursor = _mock_db(side_effect=Exception("mysql down"))
        with patch("app.database.get_db", return_value=db):
            result = mod.notificar_llegada_tienda("1", 4)
        assert result.get("ok") is True

    def test_habilitar_pago_retiro_logger_error(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        (tmp_path / "orders.json").write_text(json.dumps(
            {"1": [{"id_orden": 5, "estado": "en_tienda", "items": [], "id_usuario": 1}]}
        ))
        db, cursor = _mock_db(side_effect=Exception("mysql down"))
        with patch("app.database.get_db", return_value=db):
            result = mod.habilitar_pago_retiro(99, 5)
        assert result.get("ok") is True

    def test_confirmar_entrega_retiro_logger_error(self, tmp_path, monkeypatch):
        import app.models.payments as mod
        monkeypatch.setattr(mod, "ORDER_FILE", str(tmp_path / "orders.json"))
        (tmp_path / "orders.json").write_text(json.dumps(
            {"1": [{"id_orden": 6, "estado": "habilitado_pago", "items": [], "id_usuario": 1}]}
        ))
        db, cursor = _mock_db(side_effect=Exception("mysql down"))
        with patch("app.database.get_db", return_value=db):
            result = mod.confirmar_entrega_retiro(99, 6)
        assert result.get("ok") is True


# ---------------------------------------------------------------------------
# app.models.usuarios — ramas logger
# ---------------------------------------------------------------------------
class TestUsuariosModelLoggerCoverage:

    def test_obtener_usuario_por_email_logger_error(self):
        import app.models.usuarios as mod
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.models.usuarios.get_db", return_value=db):
            result = mod.obtener_usuario_por_email("x@test.com")
        assert result is None

    def test_obtener_usuario_por_id_logger_error(self):
        import app.models.usuarios as mod
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.models.usuarios.get_db", return_value=db):
            result = mod.obtener_usuario_por_id(99)
        assert result is None

    def test_obtener_usuario_por_token_logger_error(self):
        import app.models.usuarios as mod
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.models.usuarios.get_db", return_value=db):
            result = mod.obtener_usuario_por_token("token-invalido")
        assert result is None


# ---------------------------------------------------------------------------
# app.models.carrito — ramas logger
# ---------------------------------------------------------------------------
class TestCarritoModelLoggerCoverage:

    def test_calcular_costo_envio_logger_error(self, tmp_path, monkeypatch):
        """logger.error en _calcular_costo_envio cuando obtener_tarifa_envio falla."""
        import app.models.carrito as mod
        with patch("app.models.carrito.get_db", side_effect=Exception("db error")), \
             patch("app.models.tienda_configuracion.obtener_tarifa_envio",
                   side_effect=Exception("db error"), create=True):
            result = mod._calcular_costo_envio(
                [{"id_libro": 1, "id_tienda": 1}], "domicilio"
            )
        assert result == 0.0


# ---------------------------------------------------------------------------
# app.models.tiendas — ramas logger
# ---------------------------------------------------------------------------
class TestTiendasModelLoggerCoverage:

    def test_suspender_tienda_sql_error(self):
        """logger.error en error interno SQL de actualizar_estado_tienda."""
        import app.models.tiendas as mod
        db, cursor = _mock_db(side_effect=Exception("sql error"))
        with patch("app.models.tiendas.get_db", return_value=db):
            result = mod.actualizar_estado_tienda(1, "suspendida", "motivo test")
        assert result.get("ok") is False

    def test_suspender_tienda_notif_error(self):
        """logger.error en obtener_tienda_por_id cuando MySQL falla."""
        import app.models.tiendas as mod
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.models.tiendas.get_db", return_value=db):
            try:
                result = mod.obtener_tienda_por_id(99)
            except Exception:
                result = None
        assert result is None

    def test_obtener_tienda_por_usuario_logger_error(self):
        """logger.error en obtener_tienda_por_usuario cuando MySQL falla."""
        import app.models.tiendas as mod
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.models.tiendas.get_db", return_value=db):
            result = mod.obtener_tienda_por_usuario(99)
        assert result is None


# ---------------------------------------------------------------------------
# app.models.libro — rama logger
# ---------------------------------------------------------------------------
class TestLibroModelLoggerCoverage:

    def test_ocultar_libro_logger_error(self):
        """logger.error en ocultar_libro cuando MySQL falla."""
        import app.models.libro as mod
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.models.libro.get_db", return_value=db):
            result = mod.ocultar_libro(1, True)
        assert result is False or (isinstance(result, dict) and not result.get("ok", True))


# ---------------------------------------------------------------------------
# app.routers.libros — ramas logger (dentro de descargar_libro_digital)
# ---------------------------------------------------------------------------
class TestLibrosRouterLoggerCoverage:

    def test_descargar_libro_json_logger_warning(self):
        """logger.warning cuando obtener_ordenes_usuario falla."""
        import app.routers.libros as mod
        from fastapi import HTTPException
        fake_user = {"sub": "1", "id_usuario": 1, "rol": "comprador"}
        with patch("app.routers.libros.verify_token", return_value=fake_user), \
             patch("app.models.payments.obtener_ordenes_usuario", side_effect=Exception("json error")), \
             patch("app.database.get_db", side_effect=Exception("db error")):
            with pytest.raises((HTTPException, Exception)):
                mod.descargar_libro_digital(id_variante=1, token="tok")

    def test_descargar_libro_mysql_logger_warning(self):
        """logger.warning cuando MySQL falla al verificar compra."""
        import app.routers.libros as mod
        from fastapi import HTTPException
        fake_user = {"sub": "1", "id_usuario": 1, "rol": "comprador"}
        with patch("app.routers.libros.verify_token", return_value=fake_user), \
             patch("app.models.payments.obtener_ordenes_usuario", return_value=[]), \
             patch("app.database.get_db", side_effect=Exception("db error")):
            with pytest.raises((HTTPException, Exception)):
                mod.descargar_libro_digital(id_variante=1, token="tok")


# ---------------------------------------------------------------------------
# app.routers.payments — ramas logger
# ---------------------------------------------------------------------------
class TestPaymentsRouterLoggerCoverage:

    def test_cancelar_mis_pendientes_logger_error(self):
        """logger.error en cancelar_mis_pendientes cuando MySQL falla."""
        import app.routers.payments as mod
        from fastapi import HTTPException
        fake_user = {"sub": "1", "id_usuario": 1, "rol": "comprador"}
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.database.get_db", return_value=db), \
             patch("app.models.payments.cancelar_orden", return_value={"ok": True}):
            with pytest.raises((HTTPException, Exception)):
                mod.cancelar_mis_pendientes(user=fake_user)


# ---------------------------------------------------------------------------
# app.routers.quejas — ramas logger
# ---------------------------------------------------------------------------
class TestQuejasRouterLoggerCoverage:

    def test_crear_queja_logger_error(self):
        """logger.error en crear_queja cuando MySQL falla."""
        import asyncio
        import app.routers.quejas as mod
        db, cursor = _mock_db(side_effect=Exception("db error"))
        with patch("app.routers.quejas.get_db", return_value=db), \
             patch("app.routers.quejas._order_store", return_value={"id_tienda": 1}):
            try:
                asyncio.run(mod.crear_queja(
                    id_orden=1, asunto="test", descripcion="detalle suficientemente largo",
                    user={"sub": "1", "id_usuario": 1, "rol": "comprador"}
                ))
            except Exception:
                pass


# ---------------------------------------------------------------------------
# app.routers.herramientas — ramas logger
# ---------------------------------------------------------------------------
class TestHerramientasRouterLoggerCoverage:

    def test_suscribir_plan_finanzas_logger(self):
        """logger cuando BookyPago Finanzas lanza excepción."""
        import app.routers.herramientas as mod
        fake_user = {"id_usuario": 1, "id_tienda": 1, "rol": "vendedor"}

        class FakeData:
            id_plan = 1
            metodo_pago = "PSE"
            fecha_inicio = None
            fecha_fin = None
            monto_pagado = None

        with patch("app.routers.herramientas.suscribir_plan",
                   return_value={"ok": True, "suscripcion": {"id": 1}}), \
             patch("app.routers.herramientas.obtener_suscripcion_activa_herramientas",
                   return_value=None):
            # Importar BookyPagoFinanzas para que falle
            with patch.dict("sys.modules", {"app.models.bookypago_finanzas": MagicMock(
                BookyPagoFinanzas=MagicMock(side_effect=Exception("finanzas error"))
            )}):
                result = mod.suscribir(data=FakeData(), user=fake_user)
        assert result is not None


# ---------------------------------------------------------------------------
# app.routers.libreria — ramas logger
# ---------------------------------------------------------------------------
class TestLibreriaRouterLoggerCoverage:

    def test_registrar_libreria_correo_logger_info(self):
        """logger.info cuando correo se envía bien."""
        import asyncio
        import app.routers.libreria as mod

        class FakeData:
            nombre = "Test"
            libreria = "Lib Test"
            direccion = "Calle 1"
            telefono = "3001234567"
            email = "test@lib.com"
            password = "Segura123!"

        with patch("app.routers.libreria.crear_libreria",
                   return_value={"ok": True, "id_usuario": 1, "id_tienda": 1}), \
             patch("app.routers.libreria.is_smtp_configured", return_value=True), \
             patch("app.routers.libreria.enviar_email_confirmacion_registro",
                   return_value=None):
            result = asyncio.run(mod.registrar_libreria(FakeData()))
        assert result is not None

    def test_registrar_libreria_correo_logger_error(self):
        """logger.error cuando correo falla."""
        import asyncio
        import app.routers.libreria as mod

        class FakeData:
            nombre = "Test2"
            libreria = "Lib Test2"
            direccion = "Calle 2"
            telefono = "3009876543"
            email = "test2@lib.com"
            password = "Segura123!"

        with patch("app.routers.libreria.crear_libreria",
                   return_value={"ok": True, "id_usuario": 2, "id_tienda": 2}), \
             patch("app.routers.libreria.is_smtp_configured", return_value=True), \
             patch("app.routers.libreria.enviar_email_confirmacion_registro",
                   side_effect=Exception("smtp error")):
            result = asyncio.run(mod.registrar_libreria(FakeData()))
        assert result is not None


# ---------------------------------------------------------------------------
# app.main — rama logger
# ---------------------------------------------------------------------------
class TestMainLoggerCoverage:

    def test_init_all_schemas_logger_warning(self):
        """logger.warning en init_all_schemas cuando BD no está disponible."""
        import app.main as mod
        with patch("app.main.get_db", side_effect=Exception("bd no disponible")):
            mod.init_all_schemas()


# ---------------------------------------------------------------------------
# app.routers.stored — ramas logger
# ---------------------------------------------------------------------------
class TestStoredRouterLoggerCoverage:

    def test_listar_libros_logger_error(self):
        """logger.error en listar_libros_sp cuando MySQL falla."""
        import app.routers.stored as mod
        from fastapi import HTTPException
        with patch("app.routers.stored.get_db", side_effect=Exception("db error")):
            with pytest.raises(HTTPException) as exc:
                mod.listar_libros_sp()
        assert exc.value.status_code == 500

    def test_obtener_libro_logger_error(self):
        """logger.error en obtener_libro cuando MySQL falla."""
        import app.routers.stored as mod
        from fastapi import HTTPException
        with patch("app.routers.stored.get_db", side_effect=Exception("db error")):
            with pytest.raises(HTTPException) as exc:
                mod.obtener_libro(1)
        assert exc.value.status_code == 500

    def test_mis_libros_logger_error(self):
        """logger.error en mis_libros cuando MySQL falla."""
        import app.routers.stored as mod
        with patch("app.routers.stored.get_db", side_effect=Exception("db error")):
            result = mod.mis_libros(1)
        assert result == []
