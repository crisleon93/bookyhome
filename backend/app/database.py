import os
import time
import sys
from pathlib import Path
import mysql.connector
from mysql.connector import Error, InterfaceError
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def ensure_quejas_schema():
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS planes_herramientas (
                id_plan INT AUTO_INCREMENT PRIMARY KEY,
                nombre_plan VARCHAR(50) NOT NULL,
                precio_mensual DECIMAL(10, 2) NOT NULL,
                estadisticas_basicas INT DEFAULT 0,
                estadisticas_avanzadas INT DEFAULT 0,
                exportar_reportes INT DEFAULT 0,
                soporte_prioritario INT DEFAULT 0,
                historial_meses INT DEFAULT 1,
                impulsos_con_descuento DECIMAL(5, 2) DEFAULT 0.00,
                descripcion TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS suscripciones_herramientas (
                id_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
                id_tienda INT NOT NULL,
                id_plan INT NOT NULL,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                estado VARCHAR(50) DEFAULT 'Activa',
                metodo_pago VARCHAR(50),
                monto_pagado DECIMAL(10, 2),
                renovacion_automatica BOOLEAN DEFAULT FALSE
            )
        """)

        cursor.execute("SHOW TABLES LIKE %s", ("solicitudes_soporte",))
        if not cursor.fetchone():
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS solicitudes_soporte (
                    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
                    id_tienda INT NULL,
                    id_usuario INT NULL,
                    id_orden INT NULL,
                    asunto VARCHAR(150) NOT NULL,
                    descripcion TEXT NOT NULL,
                    categoria VARCHAR(50) NOT NULL,
                    prioridad VARCHAR(20) DEFAULT 'Normal',
                    estado VARCHAR(30) DEFAULT 'Abierto',
                    respuesta TEXT DEFAULT NULL,
                    evidencia_url VARCHAR(255) NULL,
                    tipo_solicitud VARCHAR(30) NOT NULL DEFAULT 'soporte',
                    tiempo_respuesta_horas INT DEFAULT NULL,
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_resolucion DATETIME DEFAULT NULL,
                    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
                )
            """)
            db.commit()
            return

        def column_exists(name):
            cursor.execute("SHOW COLUMNS FROM solicitudes_soporte LIKE %s", (name,))
            return cursor.fetchone() is not None

        if not column_exists("id_usuario"):
            cursor.execute("ALTER TABLE solicitudes_soporte ADD COLUMN id_usuario INT NULL")
        if not column_exists("id_orden"):
            cursor.execute("ALTER TABLE solicitudes_soporte ADD COLUMN id_orden INT NULL")
        if not column_exists("evidencia_url"):
            cursor.execute("ALTER TABLE solicitudes_soporte ADD COLUMN evidencia_url VARCHAR(255) NULL")
        if not column_exists("tipo_solicitud"):
            cursor.execute("ALTER TABLE solicitudes_soporte ADD COLUMN tipo_solicitud VARCHAR(30) NOT NULL DEFAULT 'soporte'")

        try:
            cursor.execute("SET FOREIGN_KEY_CHECKS=0")
            cursor.execute("ALTER TABLE solicitudes_soporte MODIFY COLUMN id_tienda INT NULL")
            cursor.execute("SET FOREIGN_KEY_CHECKS=1")
        except Exception:
            pass

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mensajes_reclamo (
                id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
                id_solicitud INT NOT NULL,
                id_usuario INT NOT NULL,
                mensaje TEXT NOT NULL,
                fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_mensajes_reclamo_solicitud (id_solicitud),
                CONSTRAINT fk_mensajes_reclamo_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitudes_soporte(id_solicitud) ON DELETE CASCADE,
                CONSTRAINT fk_mensajes_reclamo_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            )
        """)
        db.commit()
    except Exception as exc:
        if db is not None:
            db.rollback()
        print(f"[DATABASE] No se pudo asegurar el esquema de quejas: {exc}", file=sys.stderr, flush=True)
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()


def ensure_banner_perfil_schema():
    """Agrega columnas banner_perfil y banner_color a la tabla usuarios si no existen."""
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor()

        def column_exists(table, name):
            cursor.execute("SHOW COLUMNS FROM `%s` LIKE %%s" % table, (name,))
            return cursor.fetchone() is not None

        if not column_exists("usuarios", "banner_perfil"):
            cursor.execute("ALTER TABLE usuarios ADD COLUMN banner_perfil VARCHAR(500) NULL")
        if not column_exists("usuarios", "banner_color"):
            cursor.execute("ALTER TABLE usuarios ADD COLUMN banner_color VARCHAR(200) NULL DEFAULT '#7A1E3A'")
        db.commit()
    except Exception as exc:
        if db is not None:
            db.rollback()
        print(f"[DATABASE] No se pudo asegurar esquema de banner: {exc}", file=sys.stderr, flush=True)
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()


def ensure_retiro_schema():
    """Agrega columnas para retiro en tienda / click & collect a ordenes_compra si no existen."""
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor()

        def column_exists(table, name):
            cursor.execute(f"SHOW COLUMNS FROM `{table}` LIKE %s", (name,))
            return cursor.fetchone() is not None

        if not column_exists("ordenes_compra", "tipo_entrega"):
            cursor.execute("ALTER TABLE ordenes_compra ADD COLUMN tipo_entrega VARCHAR(30) DEFAULT 'domicilio'")
        if not column_exists("ordenes_compra", "estado_retiro"):
            cursor.execute("ALTER TABLE ordenes_compra ADD COLUMN estado_retiro VARCHAR(30) NULL")
        if not column_exists("ordenes_compra", "pin_retiro"):
            cursor.execute("ALTER TABLE ordenes_compra ADD COLUMN pin_retiro VARCHAR(10) NULL")
        if not column_exists("ordenes_compra", "fecha_limite_retiro"):
            cursor.execute("ALTER TABLE ordenes_compra ADD COLUMN fecha_limite_retiro DATETIME NULL")
        if not column_exists("ordenes_compra", "metodo_pago"):
            cursor.execute("ALTER TABLE ordenes_compra ADD COLUMN metodo_pago VARCHAR(50) NULL")
        # Costo de envío fijo por tienda (0 si es retiro en tienda)
        if not column_exists("ordenes_compra", "costo_envio"):
            cursor.execute("ALTER TABLE ordenes_compra ADD COLUMN costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0")
        db.commit()
    except Exception as exc:
        if db is not None:
            db.rollback()
        print(f"[DATABASE] No se pudo asegurar esquema de retiro en tienda: {exc}", file=sys.stderr, flush=True)
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()


def ensure_tarifa_envio_schema():
    """Agrega columna tarifa_envio a tienda_configuracion si no existe."""
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute("SHOW COLUMNS FROM `tienda_configuracion` LIKE 'tarifa_envio'")
        if not cursor.fetchone():
            cursor.execute(
                "ALTER TABLE tienda_configuracion ADD COLUMN tarifa_envio DECIMAL(10,2) NOT NULL DEFAULT 0 "
                "COMMENT 'Tarifa fija de envío a domicilio en COP. 0 = envío gratuito.'"
            )
        db.commit()
    except Exception as exc:
        if db is not None:
            db.rollback()
        print(f"[DATABASE] No se pudo asegurar esquema de tarifa_envio: {exc}", file=sys.stderr, flush=True)
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()


def ensure_acceso_anticipado_libros_schema():
    """Agrega configuración del acceso anticipado a libros existentes."""
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor()

        columnas = {
            "acceso_anticipado": "TINYINT(1) NOT NULL DEFAULT 0",
            "nivel_minimo_acceso": "VARCHAR(20) NOT NULL DEFAULT 'Plata'",
            "fecha_lanzamiento_publico": "DATETIME NULL",
        }
        for nombre, definicion in columnas.items():
            cursor.execute("SHOW COLUMNS FROM `libros` LIKE %s", (nombre,))
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE libros ADD COLUMN `{nombre}` {definicion}")
        db.commit()
    except Exception as exc:
        if db is not None:
            db.rollback()
        print(f"[DATABASE] No se pudo asegurar esquema de acceso anticipado: {exc}", file=sys.stderr, flush=True)
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()


from urllib.parse import urlparse


def get_db(intentos_maximos=10, segundos_espera=3):
    # ========================
    # Configuración de conexión (compatible con local, Docker, Railway, Render, Aiven)
    # ========================
    db_host = os.getenv('DB_HOST') or os.getenv('MYSQLHOST') or os.getenv('MYSQL_HOST') or 'mysql'
    db_port = int(os.getenv('DB_PORT') or os.getenv('MYSQLPORT') or os.getenv('MYSQL_PORT') or '3306')
    db_user = os.getenv('DB_USER') or os.getenv('MYSQLUSER') or os.getenv('MYSQL_USER') or 'root'
    db_password = os.getenv('DB_PASSWORD') or os.getenv('MYSQLPASSWORD') or os.getenv('MYSQL_PASSWORD') or 'root'
    db_name = os.getenv('DB_NAME') or os.getenv('MYSQLDATABASE') or os.getenv('MYSQL_DATABASE') or 'bookyhome'

    db_url = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')
    if db_url:
        try:
            parsed = urlparse(db_url)
            if parsed.hostname:
                db_host = parsed.hostname
            if parsed.port:
                db_port = parsed.port
            if parsed.username:
                db_user = parsed.username
            if parsed.password:
                db_password = parsed.password
            if parsed.path and len(parsed.path) > 1:
                db_name = parsed.path.lstrip('/')
        except Exception:
            pass

    hosts = [db_host]
    if db_host in {'mysql', 'localhost'}:
        hosts.extend(['127.0.0.1', 'localhost'])
    elif db_host == '127.0.0.1':
        hosts = ['127.0.0.1', 'localhost']

    # ========================
    # Reintentos mientras MySQL se inicializa
    # ========================
    for intento in range(1, intentos_maximos + 1):
        last_error = None
        for host in hosts:
            try:
                # Parámetros opcionales de SSL (requerido por Aiven y otros proveedores cloud)
                ssl_config = {}
                if os.getenv("DB_SSL", "").lower() in ("true", "1", "required"):
                    ssl_config["ssl_disabled"] = False
                    ca_path = os.getenv("DB_SSL_CA")
                    if ca_path and os.path.isfile(ca_path):
                        ssl_config["ssl_ca"] = ca_path
                elif host and not any(h in host for h in ("localhost", "127.0.0.1", "mysql")):
                    # Hosts remotos: habilitar SSL por defecto
                    ssl_config["ssl_disabled"] = False

                conexion = mysql.connector.connect(
                    host=host,
                    port=db_port,
                    user=db_user,
                    password=db_password,
                    database=db_name,
                    charset='utf8mb4',
                    use_unicode=True,
                    connection_timeout=10,
                    use_pure=True,
                    **ssl_config
                )
                if conexion.is_connected():
                    return conexion
            except (InterfaceError, Error) as exc:
                last_error = exc
                continue

        if last_error is not None:
            print(
                f"[DATABASE] Base de datos en preparación. Intento {intento}/{intentos_maximos}. "
                f"Esperando {segundos_espera}s...", 
                file=sys.stderr,
                flush=True
            )
            time.sleep(segundos_espera)

    raise Exception(f"❌ Error: No se pudo conectar a MySQL tras varios intentos. Último error: {last_error}")