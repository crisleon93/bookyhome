"""
test_router_devoluciones_coverage.py
Cobertura de los endpoints de devoluciones.py (92.4%)
"""
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _auth_headers(user_id: int = 1):
    """Genera headers con un token válido para el user_id dado."""
    from app.auth import create_token
    token = create_token({"sub": str(user_id), "rol": "comprador"})
    return {"Authorization": f"Bearer {token}"}


def _mock_user(user_id: int = 1):
    return {
        "id_usuario": user_id,
        "rol": "comprador",
        "estado_usuario": "Activo",
    }


# ── GET / ─────────────────────────────────────────────────────────────────────

def test_listar_devoluciones_retorna_lista():
    import app.routers.devoluciones as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = [{"id_devolucion": 1}]

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.get("/devoluciones", headers=_auth_headers())

    assert resp.status_code == 200


def test_listar_devoluciones_retorna_lista_vacia():
    import app.routers.devoluciones as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = None

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.get("/devoluciones", headers=_auth_headers())

    assert resp.status_code == 200
    assert resp.json() == []


# ── GET /elegibles ────────────────────────────────────────────────────────────

def test_listar_pedidos_elegibles_retorna_pedidos():
    import app.routers.devoluciones as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.return_value = [{"id_orden": 10}]

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.get("/devoluciones/elegibles", headers=_auth_headers())

    assert resp.status_code == 200


# ── POST / ───────────────────────────────────────────────────────────────────

def test_solicitar_devolucion_motivo_vacio():
    import app.routers.devoluciones as mod
    with patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.post(
            "/devoluciones",
            json={"id_orden": 1, "motivo": "   "},
            headers=_auth_headers(),
        )
    assert resp.status_code == 400
    assert "motivo" in resp.json()["detail"].lower()


def test_solicitar_devolucion_orden_no_elegible():
    import app.routers.devoluciones as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchone.return_value = None  # orden no encontrada

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.post(
            "/devoluciones",
            json={"id_orden": 999, "motivo": "Producto dañado"},
            headers=_auth_headers(),
        )
    assert resp.status_code == 400
    assert "elegible" in resp.json()["detail"].lower()


def test_solicitar_devolucion_ya_existe():
    import app.routers.devoluciones as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    # Primera llamada: orden encontrada; segunda: devolución activa existente
    cursor.fetchone.side_effect = [
        {"id_orden": 5, "estado_orden": "Entregada", "total": 50000},
        {"id_devolucion": 1},
    ]

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.post(
            "/devoluciones",
            json={"id_orden": 5, "motivo": "Producto dañado"},
            headers=_auth_headers(),
        )
    assert resp.status_code == 400
    assert "activa" in resp.json()["detail"].lower()


def test_solicitar_devolucion_exitosa():
    import app.routers.devoluciones as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    devolucion = {
        "id_devolucion": 10, "id_orden": 5, "id_usuario": 1,
        "motivo": "Producto dañado", "estado_devolucion": "Solicitada",
        "tipo_resolucion": None, "monto_reembolso": None,
        "fecha_solicitud": "2026-01-01", "fecha_resolucion": None,
        "notas_vendedor": None, "total_orden": 50000,
        "estado_orden": "Entregada", "fecha_orden": "2025-12-01",
    }
    # fetchone: orden encontrada, no hay devolución activa, y el SELECT final
    cursor.fetchone.side_effect = [
        {"id_orden": 5, "estado_orden": "Entregada", "total": 50000},
        None,  # no hay devolución activa
        devolucion,
    ]
    cursor.lastrowid = 10

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.post(
            "/devoluciones",
            json={"id_orden": 5, "motivo": "Producto dañado", "comentarios": "Llegó roto"},
            headers=_auth_headers(),
        )
    assert resp.status_code == 200
    assert resp.json()["id_devolucion"] == 10
