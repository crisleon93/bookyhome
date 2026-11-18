"""
test_database.py — Pruebas unitarias de app/database.py

Cubre los paths de get_db:
  - Conexión exitosa al primer intento
  - Fallo de conexión → excepción tras agotar reintentos
  - Lógica de hosts alternativos (mysql/localhost)

Las funciones ensure_* dependen de DDL real contra MySQL;
se verifican solo que son importables y retornan None cuando
la BD no está disponible (sin lanzar excepción no controlada).
"""

import pytest
import os
from unittest.mock import patch, MagicMock, call
from mysql.connector import Error


# ---------------------------------------------------------------------------
# get_db — conexión exitosa
# ---------------------------------------------------------------------------

class TestGetDbExitoso:
    def test_retorna_conexion_cuando_mysql_responde(self):
        mock_conn = MagicMock()
        mock_conn.is_connected.return_value = True

        with patch("mysql.connector.connect", return_value=mock_conn) as mock_connect:
            from app.database import get_db
            conn = get_db()

        assert conn is mock_conn
        mock_connect.assert_called_once()

    def test_conexion_usa_variables_de_entorno(self):
        mock_conn = MagicMock()
        mock_conn.is_connected.return_value = True

        env = {
            "DB_HOST": "mihost",
            "DB_PORT": "3307",
            "DB_USER": "miusuario",
            "DB_PASSWORD": "miclave",
            "DB_NAME": "mibд",
        }
        with patch.dict(os.environ, env), \
             patch("mysql.connector.connect", return_value=mock_conn) as mock_connect:
            from app.database import get_db
            get_db()

        _, kwargs = mock_connect.call_args
        assert kwargs["host"] == "mihost"
        assert kwargs["port"] == 3307
        assert kwargs["user"] == "miusuario"
        assert kwargs["password"] == "miclave"
        assert kwargs["database"] == "mibд"

    def test_conexion_usa_charset_utf8mb4(self):
        mock_conn = MagicMock()
        mock_conn.is_connected.return_value = True

        with patch("mysql.connector.connect", return_value=mock_conn) as mock_connect:
            from app.database import get_db
            get_db()

        _, kwargs = mock_connect.call_args
        assert kwargs["charset"] == "utf8mb4"
        assert kwargs["use_unicode"] is True


# ---------------------------------------------------------------------------
# get_db — fallo de conexión
# ---------------------------------------------------------------------------

class TestGetDbFallo:
    def test_lanza_excepcion_cuando_mysql_no_esta_disponible(self):
        with patch("mysql.connector.connect", side_effect=Error("Connection refused")), \
             patch("time.sleep"):  # evita esperas reales en el test
            from app.database import get_db
            with pytest.raises(Exception) as exc:
                get_db()
        assert "No se pudo conectar" in str(exc.value) or "MySQL" in str(exc.value)

    def test_reintenta_antes_de_lanzar_excepcion(self):
        mock_sleep = MagicMock()
        with patch("mysql.connector.connect", side_effect=Error("timeout")), \
             patch("time.sleep", mock_sleep):
            from app.database import get_db
            with pytest.raises(Exception):
                get_db()
        # Debe haber dormido al menos una vez (reintentos)
        assert mock_sleep.call_count >= 1

    def test_is_connected_false_no_retorna_conexion(self):
        """Si connect() responde pero is_connected() es False, debe seguir intentando."""
        mock_conn = MagicMock()
        mock_conn.is_connected.return_value = False

        with patch("mysql.connector.connect", return_value=mock_conn), \
             patch("time.sleep"):
            from app.database import get_db
            with pytest.raises(Exception):
                get_db()


# ---------------------------------------------------------------------------
# get_db — lógica de hosts alternativos
# ---------------------------------------------------------------------------

class TestGetDbHostsAlternativos:
    def test_host_mysql_agrega_localhost_como_alternativa(self):
        """Con DB_HOST=mysql debe intentar también 127.0.0.1 y localhost."""
        intentos = []

        def mock_connect(**kwargs):
            intentos.append(kwargs["host"])
            raise Error("no disponible")

        with patch.dict(os.environ, {"DB_HOST": "mysql"}), \
             patch("mysql.connector.connect", side_effect=mock_connect), \
             patch("time.sleep"):
            from app.database import get_db
            with pytest.raises(Exception):
                get_db()

        assert "mysql" in intentos
        assert any(h in intentos for h in ("127.0.0.1", "localhost"))

    def test_host_personalizado_solo_usa_ese_host(self):
        """Con un host personalizado no debe intentar hosts alternativos."""
        intentos = []

        def mock_connect(**kwargs):
            intentos.append(kwargs["host"])
            raise Error("no disponible")

        with patch.dict(os.environ, {"DB_HOST": "mi-servidor-remoto"}), \
             patch("mysql.connector.connect", side_effect=mock_connect), \
             patch("time.sleep"):
            from app.database import get_db
            with pytest.raises(Exception):
                get_db()

        assert all(h == "mi-servidor-remoto" for h in intentos)


# ---------------------------------------------------------------------------
# ensure_* — importables y no explotan sin BD
# ---------------------------------------------------------------------------

class TestEnsureFunctions:
    def test_ensure_quejas_schema_no_lanza_sin_bd(self):
        with patch("app.database.get_db", side_effect=Exception("sin BD")):
            from app.database import ensure_quejas_schema
            # No debe propagar la excepción
            ensure_quejas_schema()

    def test_ensure_banner_perfil_schema_no_lanza_sin_bd(self):
        with patch("app.database.get_db", side_effect=Exception("sin BD")):
            from app.database import ensure_banner_perfil_schema
            ensure_banner_perfil_schema()

    def test_ensure_retiro_schema_no_lanza_sin_bd(self):
        with patch("app.database.get_db", side_effect=Exception("sin BD")):
            from app.database import ensure_retiro_schema
            ensure_retiro_schema()

    def test_ensure_tarifa_envio_schema_no_lanza_sin_bd(self):
        with patch("app.database.get_db", side_effect=Exception("sin BD")):
            from app.database import ensure_tarifa_envio_schema
            ensure_tarifa_envio_schema()

    def test_ensure_acceso_anticipado_no_lanza_sin_bd(self):
        with patch("app.database.get_db", side_effect=Exception("sin BD")):
            from app.database import ensure_acceso_anticipado_libros_schema
            ensure_acceso_anticipado_libros_schema()
