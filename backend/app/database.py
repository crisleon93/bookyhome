import mysql.connector

def get_db():
    return mysql.connector.connect(
        host='127.0.0.1',
        port=3306,
        user='root',
        password='',
        database='bookyhome',
        connection_timeout=10,
        use_pure=True        # ← esta línea es clave
    )