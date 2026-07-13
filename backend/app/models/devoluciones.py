import logging
from app.database import get_db

ESTADOS_ELEGIBLES = ("Entregada", "Pagada", "Enviada", "pagado", "completada", "Completada")
ESTADOS_DEVOLUCION_ACTIVOS = ("Solicitada", "En Revision", "Aprobada")

_DEVOLUCION_SELECT = """
    SELECT
        d.id_devolucion, d.id_orden, d.id_usuario, d.motivo,
        d.estado_devolucion, d.tipo_resolucion, d.monto_reembolso,
        d.fecha_solicitud, d.fecha_resolucion, d.notas_vendedor,
        o.total AS total_orden, o.estado_orden, o.fecha_orden
    FROM devoluciones d
    INNER JOIN ordenes_compra o ON d.id_orden = o.id_orden
"""


def obtener_devoluciones_usuario(id_usuario: int):
    """Retorna todas las devoluciones de un usuario, más recientes primero."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            f"{_DEVOLUCION_SELECT} WHERE d.id_usuario = %s ORDER BY d.fecha_solicitud DESC",
            (id_usuario,)
        )
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener devoluciones del usuario {id_usuario}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def obtener_pedidos_elegibles_devolucion(id_usuario: int):
    """
    Retorna los pedidos del usuario que son elegibles para devolución:
    - Estado entregado/pagado/enviado/completado
    - Sin devolución activa ya registrada
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        placeholders = ", ".join(["%s"] * len(ESTADOS_ELEGIBLES))
        activos = ", ".join(["%s"] * len(ESTADOS_DEVOLUCION_ACTIVOS))
        cursor.execute(
            f"""
            SELECT
                o.id_orden, o.fecha_orden, o.total, o.estado_orden,
                COUNT(do2.id_detalle) AS cantidad_items,
                GROUP_CONCAT(l.titulo SEPARATOR ', ') AS libros
            FROM ordenes_compra o
            LEFT JOIN detalle_orden do2 ON o.id_orden = do2.id_orden
            LEFT JOIN libros l ON do2.id_libro = l.id_libro
            WHERE o.id_usuario = %s
              AND o.estado_orden IN ({placeholders})
              AND o.id_orden NOT IN (
                  SELECT id_orden FROM devoluciones
                  WHERE id_usuario = %s AND estado_devolucion IN ({activos})
              )
            GROUP BY o.id_orden, o.fecha_orden, o.total, o.estado_orden
            ORDER BY o.fecha_orden DESC
            """,
            (id_usuario, *ESTADOS_ELEGIBLES, id_usuario, *ESTADOS_DEVOLUCION_ACTIVOS)
        )
        return cursor.fetchall() or []
    except Exception as e:
        logging.error(f"Error al obtener pedidos elegibles del usuario {id_usuario}: {e}")
        return []
    finally:
        cursor.close()
        db.close()


def crear_solicitud_devolucion(id_usuario: int, id_orden: int, motivo: str):
    """
    Crea una solicitud de devolución para una orden.
    Valida que la orden sea elegible y que no tenga ya una solicitud activa.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verificar que la orden existe y es elegible
        placeholders = ", ".join(["%s"] * len(ESTADOS_ELEGIBLES))
        cursor.execute(
            f"SELECT id_orden, estado_orden, total FROM ordenes_compra WHERE id_orden = %s AND id_usuario = %s AND estado_orden IN ({placeholders})",
            (id_orden, id_usuario, *ESTADOS_ELEGIBLES)
        )
        if not cursor.fetchone():
            return {"ok": False, "error": "La orden no existe o no es elegible para devolución"}

        # Verificar que no tenga devolución activa
        activos = ", ".join(["%s"] * len(ESTADOS_DEVOLUCION_ACTIVOS))
        cursor.execute(
            f"SELECT id_devolucion FROM devoluciones WHERE id_orden = %s AND id_usuario = %s AND estado_devolucion IN ({activos})",
            (id_orden, id_usuario, *ESTADOS_DEVOLUCION_ACTIVOS)
        )
        if cursor.fetchone():
            return {"ok": False, "error": "Ya existe una solicitud de devolución activa para esta orden"}

        # Insertar
        cursor.execute(
            "INSERT INTO devoluciones (id_orden, id_usuario, motivo, estado_devolucion) VALUES (%s, %s, %s, 'Solicitada')",
            (id_orden, id_usuario, motivo[:300])
        )
        db.commit()
        id_devolucion = cursor.lastrowid

        cursor.execute(f"{_DEVOLUCION_SELECT} WHERE d.id_devolucion = %s", (id_devolucion,))
        return {"ok": True, "devolucion": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al crear solicitud de devolución: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()


def actualizar_estado_devolucion(id_devolucion: int, nuevo_estado: str, notas_vendedor: str = None, monto_reembolso: float = None, tipo_resolucion: str = None):
    """
    Actualiza el estado de una devolución (pendiente → aprobada → completada / rechazada).
    Solo para uso del vendedor o administrador.
    """
    estados_validos = ("Solicitada", "En Revision", "Aprobada", "Rechazada", "Completada")
    if nuevo_estado not in estados_validos:
        return {"ok": False, "error": f"Estado no válido. Use: {', '.join(estados_validos)}"}

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        campos = ["estado_devolucion = %s", "fecha_resolucion = CURRENT_TIMESTAMP"]
        valores = [nuevo_estado]

        if notas_vendedor is not None:
            campos.append("notas_vendedor = %s")
            valores.append(notas_vendedor)
        if monto_reembolso is not None:
            campos.append("monto_reembolso = %s")
            valores.append(monto_reembolso)
        if tipo_resolucion is not None:
            campos.append("tipo_resolucion = %s")
            valores.append(tipo_resolucion)

        valores.append(id_devolucion)
        cursor.execute(
            f"UPDATE devoluciones SET {', '.join(campos)} WHERE id_devolucion = %s",
            tuple(valores)
        )
        db.commit()

        cursor.execute(f"{_DEVOLUCION_SELECT} WHERE d.id_devolucion = %s", (id_devolucion,))
        return {"ok": True, "devolucion": cursor.fetchone()}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al actualizar devolución {id_devolucion}: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        cursor.close()
        db.close()
