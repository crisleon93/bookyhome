import os
import time
import sys
import mysql.connector
from mysql.connector import InterfaceError


def ensure_quejas_schema():
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor()

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
            cursor.execute("ALTER TABLE solicitudes_soporte MODIFY COLUMN id_tienda INT NULL")
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


def get_db():
    # ========================
    # Configuración de conexión
    # ========================
    db_host = os.getenv('DB_HOST', 'mysql')     
    db_port = int(os.getenv('DB_PORT', '3306'))
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD', 'root') 
    db_name = os.getenv('DB_NAME', 'bookyhome')

    intentos_maximos = 10
    segundos_espera = 3

    # ========================
    # Reintentos mientras MySQL se inicializa
    # ========================
    for intento in range(1, intentos_maximos + 1):
        try:
            conexion = mysql.connector.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database=db_name,
                charset='utf8mb4',
                use_unicode=True,
                connection_timeout=10,
                use_pure=True
            )
            if conexion.is_connected():
                return conexion

        except InterfaceError:
            print(
                f"[DATABASE] Base de datos en preparación. Intento {intento}/{intentos_maximos}. "
                f"Esperando {segundos_espera}s...", 
                file=sys.stderr, 
                flush=True
            )
            time.sleep(segundos_espera)

    raise Exception("❌ Error: No se pudo conectar a MySQL tras varios intentos.")