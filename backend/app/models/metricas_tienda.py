import logging
from app.database import get_db

def obtener_metricas_tienda(id_tienda: int, periodo_anio: int = None, periodo_mes: int = None):
    """
    Obtiene las métricas de una tienda.
    Si se proporciona año y mes, filtra por ese periodo específico.
    Si solo se proporciona año, devuelve todas las métricas de ese año.
    Si no se proporcionan, devuelve todas las métricas históricas de la tienda.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT * FROM metricas_tienda WHERE id_tienda = %s"
        params = [id_tienda]

        if periodo_anio:
            query += " AND periodo_anio = %s"
            params.append(periodo_anio)
        
        if periodo_mes:
            query += " AND periodo_mes = %s"
            params.append(periodo_mes)

        query += " ORDER BY periodo_anio DESC, periodo_mes DESC"
        
        cursor.execute(query, params)
        metricas = cursor.fetchall()
        
        # Formatear la fecha para que sea serializable en JSON
        for metrica in metricas:
            if metrica.get('fecha_calculo'):
                metrica['fecha_calculo'] = metrica['fecha_calculo'].strftime("%Y-%m-%d %H:%M:%S")
                
        return metricas
    except Exception as e:
        logging.error(f"Error al obtener métricas de tienda {id_tienda}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def registrar_metricas_tienda(id_tienda: int, periodo_mes: int, periodo_anio: int, data: dict):
    """
    Registra o actualiza las métricas de una tienda para un mes y año específicos.
    Si ya existe un registro para ese periodo, lo actualiza.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        # Verificar si ya existe el registro para ese mes y año
        cursor.execute(
            "SELECT id_metrica FROM metricas_tienda WHERE id_tienda = %s AND periodo_mes = %s AND periodo_anio = %s",
            (id_tienda, periodo_mes, periodo_anio)
        )
        registro = cursor.fetchone()

        if registro:
            # Actualizar
            query = """
                UPDATE metricas_tienda 
                SET total_ordenes = %s,
                    ordenes_completadas = %s,
                    ordenes_canceladas = %s,
                    ingresos_brutos = %s,
                    ingresos_netos = %s,
                    promedio_calificacion = %s,
                    nuevos_seguidores = %s,
                    libros_mas_vendido = %s
                WHERE id_metrica = %s
            """
            params = (
                data.get('total_ordenes', 0),
                data.get('ordenes_completadas', 0),
                data.get('ordenes_canceladas', 0),
                data.get('ingresos_brutos', 0.0),
                data.get('ingresos_netos', 0.0),
                data.get('promedio_calificacion', 0.0),
                data.get('nuevos_seguidores', 0),
                data.get('libros_mas_vendido', None),
                registro[0]
            )
            cursor.execute(query, params)
        else:
            # Insertar
            query = """
                INSERT INTO metricas_tienda (
                    id_tienda, periodo_mes, periodo_anio, total_ordenes,
                    ordenes_completadas, ordenes_canceladas, ingresos_brutos,
                    ingresos_netos, promedio_calificacion, nuevos_seguidores,
                    libros_mas_vendido
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                id_tienda,
                periodo_mes,
                periodo_anio,
                data.get('total_ordenes', 0),
                data.get('ordenes_completadas', 0),
                data.get('ordenes_canceladas', 0),
                data.get('ingresos_brutos', 0.0),
                data.get('ingresos_netos', 0.0),
                data.get('promedio_calificacion', 0.0),
                data.get('nuevos_seguidores', 0),
                data.get('libros_mas_vendido', None)
            )
            cursor.execute(query, params)
            
        db.commit()
        return {"ok": True, "mensaje": "Métricas registradas correctamente"}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al registrar métricas para la tienda {id_tienda}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
