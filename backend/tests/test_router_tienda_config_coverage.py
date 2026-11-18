"""
test_router_tienda_config_coverage.py
Cobertura de tienda_configuracion.py (91%)
"""
import io
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.auth import get_current_user
from app.main import app

client = TestClient(app)


def _user_vendedor(id_tienda=10):
    return {"id_usuario": 1, "rol": "vendedor", "estado_usuario": "Activo", "id_tienda": id_tienda}


def _user_sin_tienda():
    return {"id_usuario": 1, "rol": "vendedor", "estado_usuario": "Activo", "id_tienda": None}


# ── GET /configuracion ────────────────────────────────────────────────────────

def test_get_config_sin_tienda_retorna_404():
    app.dependency_overrides[get_current_user] = lambda: _user_sin_tienda()
    try:
        resp = client.get("/configuracion")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_config_sin_config_retorna_defaults():
    import app.routers.tienda_configuracion as mod
    app.dependency_overrides[get_current_user] = lambda: _user_vendedor()
    try:
        with patch.object(mod, "obtener_configuracion_tienda", return_value=None):
            resp = client.get("/configuracion")
        assert resp.status_code == 200
        assert resp.json()["tiempo_despacho_dias"] == 2
        assert resp.json()["tarifa_envio"] == 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_config_sin_tarifa_envio_agrega_cero():
    import app.routers.tienda_configuracion as mod
    app.dependency_overrides[get_current_user] = lambda: _user_vendedor()
    try:
        config_sin_tarifa = {"descripcion": "Mi tienda", "ciudad_origen": "Bogotá"}
        with patch.object(mod, "obtener_configuracion_tienda", return_value=config_sin_tarifa):
            resp = client.get("/configuracion")
        assert resp.status_code == 200
        assert resp.json()["tarifa_envio"] == 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_config_con_tarifa_envio_existente():
    import app.routers.tienda_configuracion as mod
    app.dependency_overrides[get_current_user] = lambda: _user_vendedor()
    try:
        config = {"descripcion": "Mi tienda", "tarifa_envio": 5000}
        with patch.object(mod, "obtener_configuracion_tienda", return_value=config):
            resp = client.get("/configuracion")
        assert resp.status_code == 200
        assert resp.json()["tarifa_envio"] == 5000
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── PUT /configuracion ────────────────────────────────────────────────────────

def test_put_config_sin_tienda_retorna_404():
    app.dependency_overrides[get_current_user] = lambda: _user_sin_tienda()
    try:
        resp = client.put("/configuracion", json={"descripcion": "test"})
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_put_config_error_modelo_retorna_500():
    import app.routers.tienda_configuracion as mod
    app.dependency_overrides[get_current_user] = lambda: _user_vendedor()
    try:
        with patch.object(mod, "actualizar_configuracion_tienda", return_value={"ok": False, "error": "db error"}):
            resp = client.put("/configuracion", json={"descripcion": "test"})
        assert resp.status_code == 500
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_put_config_exitoso():
    import app.routers.tienda_configuracion as mod
    app.dependency_overrides[get_current_user] = lambda: _user_vendedor()
    try:
        with patch.object(mod, "actualizar_configuracion_tienda", return_value={"ok": True}):
            resp = client.put("/configuracion", json={"descripcion": "Mi tienda actualizada"})
        assert resp.status_code == 200
        assert "actualizada" in resp.json()["mensaje"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /configuracion/{id_tienda} ────────────────────────────────────────────

def test_get_config_publica_tienda_no_encontrada():
    with patch("app.models.tiendas.obtener_tienda_por_id", return_value=None):
        resp = client.get("/configuracion/9999")
    assert resp.status_code == 404


def test_get_config_publica_sin_config_retorna_defaults():
    import app.routers.tienda_configuracion as mod
    tienda = {"id_tienda": 1, "nombre_tienda": "Librería Test"}
    with patch("app.models.tiendas.obtener_tienda_por_id", return_value=tienda), \
         patch.object(mod, "obtener_configuracion_tienda", return_value=None), \
         patch("app.models.libro.obtener_libros_por_tienda", return_value=[]):
        resp = client.get("/configuracion/1")
    assert resp.status_code == 200
    assert resp.json()["configuracion"]["tiempo_despacho_dias"] == 2


def test_get_config_publica_exitosa():
    import app.routers.tienda_configuracion as mod
    tienda = {"id_tienda": 1, "nombre_tienda": "Librería Test"}
    config = {"descripcion": "Gran tienda", "tarifa_envio": 3000}
    libros = [{"id_libro": 1, "titulo": "Libro A"}]
    with patch("app.models.tiendas.obtener_tienda_por_id", return_value=tienda), \
         patch.object(mod, "obtener_configuracion_tienda", return_value=config), \
         patch("app.models.libro.obtener_libros_por_tienda", return_value=libros):
        resp = client.get("/configuracion/1")
    assert resp.status_code == 200
    assert resp.json()["tienda"]["nombre_tienda"] == "Librería Test"
    assert len(resp.json()["libros"]) == 1


# ── POST /configuracion/upload-image ─────────────────────────────────────────

def test_upload_sin_tienda_retorna_403():
    app.dependency_overrides[get_current_user] = lambda: _user_sin_tienda()
    try:
        resp = client.post(
            "/configuracion/upload-image",
            data={"tipo": "logo"},
            files={"file": ("test.jpg", io.BytesIO(b"img"), "image/jpeg")},
        )
        assert resp.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_upload_tipo_invalido_retorna_400():
    app.dependency_overrides[get_current_user] = lambda: _user_vendedor()
    try:
        resp = client.post(
            "/configuracion/upload-image",
            data={"tipo": "icono"},
            files={"file": ("test.jpg", io.BytesIO(b"img"), "image/jpeg")},
        )
        assert resp.status_code == 400
        assert "inválido" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_upload_extension_invalida_retorna_400():
    app.dependency_overrides[get_current_user] = lambda: _user_vendedor()
    try:
        resp = client.post(
            "/configuracion/upload-image",
            data={"tipo": "logo"},
            files={"file": ("test.exe", io.BytesIO(b"bad"), "application/octet-stream")},
        )
        assert resp.status_code == 400
        assert "formato" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
