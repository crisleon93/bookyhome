from app.database import get_db

try:
    db = get_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia) VALUES (%s,%s,%s,%s,%s)", (30, 'reclamo', 'Prueba', 'Cuerpo prueba', 9))
    db.commit()
    print('inserted id', cursor.lastrowid)
except Exception as e:
    print('error', e)
finally:
    try:
        cursor.close(); db.close()
    except:
        pass
