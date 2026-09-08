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
                    tarifa_envio = %s,
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
                float(data.get('tarifa_envio', 0) or 0),
                id_tienda
            )
            cursor.execute(query, params)
        else:
            # Insertar
            query = """
                INSERT INTO tienda_configuracion (
                    id_tienda, descripcion, logo_url, banner_url, horario_atencion,
                    politica_devoluciones, politica_envios, tiempo_despacho_dias,
                    ciudad_origen, acepta_negociacion, email_publico, redes_sociales,
                    tarifa_envio
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                data.get('redes_sociales'),
                float(data.get('tarifa_envio', 0) or 0),
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


def obtener_tarifa_envio(id_tienda: int) -> float:
    """Devuelve la tarifa fija de envío a domicilio de la tienda. 0 si no existe o retiro."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT tarifa_envio FROM tienda_configuracion WHERE id_tienda = %s",
            (id_tienda,)
        )
        row = cursor.fetchone()
        if row and row.get("tarifa_envio") is not None:
            return float(row["tarifa_envio"])
        return 0.0
    except Exception:
        return 0.0
    finally:
        cursor.close()
        db.close()


def obtener_id_tienda_de_libro(id_libro: int) -> int | None:
    """Devuelve el id_tienda del libro dado, o None si no se encuentra."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_tienda FROM libros WHERE id_libro = %s", (id_libro,))
        row = cursor.fetchone()
        return row["id_tienda"] if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        db.close()
