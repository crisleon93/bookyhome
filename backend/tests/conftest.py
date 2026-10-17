"""
conftest.py — Fixtures compartidos para toda la suite de pruebas.

Estrategia:
- Las pruebas unitarias (modelos, auth, schemas) se ejecutan sin BD real,
  usando mocks de database.get_db.
- Las pruebas de integración (carpeta tests/integration/) usan la BD real
  y requieren que el servicio MySQL esté levantado.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fixture: mock de conexión a la BD (usado en pruebas unitarias)
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    """
    Devuelve un mock de conexión MySQL.
    Úsalo en tests unitarios para evitar conectarte a la BD real.
    """
    db = MagicMock()
    cursor = MagicMock()
    db.cursor.return_value = cursor
    cursor.__enter__ = MagicMock(return_value=cursor)
    cursor.__exit__ = MagicMock(return_value=False)
    return db, cursor


@pytest.fixture
def patch_get_db(mock_db):
    """
    Parchea app.database.get_db para que devuelva el mock_db.
    Úsalo en cualquier test que importe un modelo que llame a get_db().
    """
    db, cursor = mock_db
    with patch("app.database.get_db", return_value=db):
        yield db, cursor


# ---------------------------------------------------------------------------
# Fixture: TestClient de FastAPI (sin BD real)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def app():
    """Importa y devuelve la app FastAPI."""
    from app.main import app as fastapi_app
    return fastapi_app


@pytest.fixture
def client(app):
    """TestClient listo para usar en tests de routers."""
    with TestClient(app) as c:
        yield c
