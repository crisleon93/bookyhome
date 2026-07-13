import logging
from app.database import get_db

def obtener_configuracion_tienda(id_tienda: int):
    """
    Obtiene la configuración actual de una tienda.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM tienda_configuracion WHERE id_tienda = %s", (id_tienda,))
        config = cursor.fetchone()
        
        if config and config.get('fecha_actualizacion'):
            config['fecha_actualizacion'] = config['fecha_actualizacion'].strftime("%Y-%m-%d %H:%M:%S")
            
        return config
    except Exception as e:
        logging.error(f"Error al obtener configuración de la tienda {id_tienda}: {e}")
        return None
    finally:
        cursor.close()
        db.close()


def actualizar_configuracion_tienda(id_tienda: int, data: dict):
    """
    Actualiza la configuración de la tienda. 
    Si no existe un registro previo, lo crea (upsert simulado).
    """
    db = get_db()
    cursor = db.cursor()
    try:
        # Verificar si ya existe configuración
        cursor.execute("SELECT id_config FROM tienda_configuracion WHERE id_tienda = %s", (id_tienda,))
        existe = cursor.fetchone()

        if existe:
            # Actualizar
            query = """
                UPDATE tienda_configuracion 
                SET descripcion = %s,
                    logo_url = %s,
                    banner_url = %s,
                    horario_atencion = %s,
                    politica_devoluciones = %s,
                    politica_envios = %s,
                    tiempo_despacho_dias = %s,
                    ciudad_origen = %s,
                    acepta_negociacion = %s,
                    email_publico = %s,
                    redes_sociales = %s,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_tienda = %s
            """
            params = (
                data.get('descripcion'),
                data.get('logo_url'),
                data.get('banner_url'),
                data.get('horario_atencion'),
                data.get('politica_devoluciones'),
                data.get('politica_envios'),
                data.get('tiempo_despacho_dias', 2),
                data.get('ciudad_origen'),
                data.get('acepta_negociacion', 0),
                data.get('email_publico'),
                data.get('redes_sociales'),
                id_tienda
            )
            cursor.execute(query, params)
        else:
            # Insertar
            query = """
                INSERT INTO tienda_configuracion (
                    id_tienda, descripcion, logo_url, banner_url, horario_atencion,
                    politica_devoluciones, politica_envios, tiempo_despacho_dias,
                    ciudad_origen, acepta_negociacion, email_publico, redes_sociales
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                id_tienda,
                data.get('descripcion'),
                data.get('logo_url'),
                data.get('banner_url'),
                data.get('horario_atencion'),
                data.get('politica_devoluciones'),
                data.get('politica_envios'),
                data.get('tiempo_despacho_dias', 2),
                data.get('ciudad_origen'),
                data.get('acepta_negociacion', 0),
                data.get('email_publico'),
                data.get('redes_sociales')
            )
            cursor.execute(query, params)
            
        db.commit()
        return {"ok": True, "mensaje": "Configuración guardada correctamente"}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al actualizar configuración de tienda {id_tienda}: {e}")
        return {"ok": False, "error": str(e)}
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
