import os
import time
import sys
import mysql.connector
from mysql.connector import InterfaceError

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