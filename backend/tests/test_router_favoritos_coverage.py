"""
test_router_favoritos_coverage.py
Cobertura de los endpoints de favoritos.py (93%)
"""
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _auth_headers(user_id: int = 1):
    from app.auth import create_token
    token = create_token({"sub": str(user_id), "rol": "comprador"})
    return {"Authorization": f"Bearer {token}"}


# ── GET /favoritos ────────────────────────────────────────────────────────────

def test_listar_favoritos_sin_listas_anteriores():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    # fetchall: sin listas anteriores, luego la lista de favoritos
    cursor.fetchall.side_effect = [[], [{"id_favorito": 1, "titulo": "Libro A"}]]

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.get("/favoritos", headers=_auth_headers())

    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_listar_favoritos_migra_listas_anteriores():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    # fetchall: 1 lista anterior a migrar, luego la lista de favoritos
    cursor.fetchall.side_effect = [
        [{"id_lista": 5}],
        [{"id_favorito": 2, "titulo": "Libro B"}],
    ]

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.get("/favoritos", headers=_auth_headers())

    assert resp.status_code == 200
    db.commit.assert_called_once()


def test_listar_favoritos_vacio():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchall.side_effect = [[], None]

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.get("/favoritos", headers=_auth_headers())

    assert resp.status_code == 200
    assert resp.json() == []


# ── POST /favoritos/{id_libro} ────────────────────────────────────────────────

def test_agregar_favorito_libro_no_encontrado():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchone.return_value = None  # libro no existe

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.post("/favoritos/999", headers=_auth_headers())

    assert resp.status_code == 404
    assert "Libro no encontrado" in resp.json()["detail"]


def test_agregar_favorito_ya_existe():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    # fetchone: libro encontrado, favorito ya existe
    cursor.fetchone.side_effect = [
        {"id_libro": 1},
        {"id_favorito": 10},
    ]

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.post("/favoritos/1", headers=_auth_headers())

    assert resp.status_code == 400
    assert "ya está en favoritos" in resp.json()["detail"]


def test_agregar_favorito_exitoso():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.fetchone.side_effect = [{"id_libro": 1}, None]
    cursor.lastrowid = 42

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.post("/favoritos/1", headers=_auth_headers())

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert resp.json()["id_favorito"] == 42


# ── DELETE /favoritos/{id_libro} ──────────────────────────────────────────────

def test_eliminar_favorito_no_existe():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.rowcount = 0

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.delete("/favoritos/999", headers=_auth_headers())

    assert resp.status_code == 404
    assert "no está en favoritos" in resp.json()["detail"]


def test_eliminar_favorito_exitoso():
    import app.routers.favoritos as mod
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.rowcount = 1

    with patch.object(mod, "get_db", return_value=db), \
         patch.object(mod, "verify_token", return_value={"sub": "1"}):
        resp = client.delete("/favoritos/1", headers=_auth_headers())

    assert resp.status_code == 200
    assert resp.json()["ok"] is True


# ── Token inválido ────────────────────────────────────────────────────────────

def test_token_invalido_retorna_401():
    import app.routers.favoritos as mod
    with patch.object(mod, "verify_token", return_value=None):
        resp = client.get(
            "/favoritos",
            headers={"Authorization": "Bearer token.invalido.aqui"},
        )
    assert resp.status_code == 401
