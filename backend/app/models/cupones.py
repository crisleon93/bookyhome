from app.database import get_db
from datetime import datetime


def obtener_cupon_por_codigo(codigo: str):
    """Obtiene un cupón activo por su código."""
    db = get_db()
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id_cupon, id_tienda, codigo_cupon, tipo_descuento,
                   valor_descuento, minimo_compra, usos_maximos, usos_actuales,
                   fecha_inicio, fecha_fin, activo
            FROM cupones_descuento
            WHERE codigo_cupon = %s AND activo = 1
            """,
            (codigo.upper(),)
        )
        return cursor.fetchone()
    finally:
        db.close()


def validar_cupon(codigo: str, id_usuario: int, total: float):
    """
    Valida un cupón para un usuario y un total de compra.
    Retorna dict con 'valido', 'mensaje' y 'descuento' calculado.
    """
    cupon = obtener_cupon_por_codigo(codigo)

    if not cupon:
        return {"valido": False, "mensaje": "El cupón no existe o no está activo.", "descuento": 0}

    ahora = datetime.now()

    # Verificar vigencia
    if cupon["fecha_inicio"] and ahora < cupon["fecha_inicio"]:
        return {"valido": False, "mensaje": "El cupón aún no está vigente.", "descuento": 0}

    if cupon["fecha_fin"] and ahora > cupon["fecha_fin"]:
        return {"valido": False, "mensaje": "El cupón ha expirado.", "descuento": 0}

    # Verificar usos máximos
    if cupon["usos_maximos"] is not None and cupon["usos_actuales"] >= cupon["usos_maximos"]:
        return {"valido": False, "mensaje": "El cupón ha alcanzado su límite de usos.", "descuento": 0}

    # Verificar si el usuario ya usó este cupón
    db = get_db()
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            "SELECT id_uso FROM uso_cupones WHERE id_cupon = %s AND id_usuario = %s",
            (cupon["id_cupon"], id_usuario)
        )
        if cursor.fetchone():
            return {"valido": False, "mensaje": "Este cupón ya fue usado por tu cuenta.", "descuento": 0}
    finally:
        db.close()

    # Verificar monto mínimo de compra
    minimo = float(cupon["minimo_compra"] or 0)
    if total < minimo:
        return {
            "valido": False,
            "mensaje": f"El monto mínimo para este cupón es ${minimo:,.0f} COP.",
            "descuento": 0
        }

    # Calcular descuento
    tipo = cupon["tipo_descuento"].lower()
    valor = float(cupon["valor_descuento"])

    if tipo == "porcentaje":
        descuento = round(total * (valor / 100), 2)
    elif tipo == "fijo":
        descuento = min(valor, total)
    else:
        descuento = 0

    return {
        "valido": True,
        "mensaje": f"Cupón aplicado: {descuento:,.0f} COP de descuento.",
        "descuento": descuento,
        "cupon": {
            "id_cupon": cupon["id_cupon"],
            "codigo": cupon["codigo_cupon"],
            "tipo": cupon["tipo_descuento"],
            "valor": valor,
        }
    }


def registrar_uso_cupon(id_cupon: int, id_usuario: int, id_orden: int, descuento_aplicado: float):
    """Registra el uso de un cupón e incrementa su contador."""
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO uso_cupones (id_cupon, id_usuario, id_orden, descuento_aplicado)
            VALUES (%s, %s, %s, %s)
            """,
            (id_cupon, id_usuario, id_orden, descuento_aplicado)
        )
        cursor.execute(
            "UPDATE cupones_descuento SET usos_actuales = usos_actuales + 1 WHERE id_cupon = %s",
            (id_cupon,)
        )
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


def obtener_todos_cupones():
    """Obtiene todos los cupones registrados (para administración)."""
    db = get_db()
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT c.id_cupon, c.id_tienda, t.nombre_tienda, c.codigo_cupon,
                   c.tipo_descuento, c.valor_descuento, c.minimo_compra,
                   c.usos_maximos, c.usos_actuales, c.fecha_inicio, c.fecha_fin, c.activo
            FROM cupones_descuento c
            LEFT JOIN tiendas t ON c.id_tienda = t.id_tienda
            ORDER BY c.id_cupon DESC
            """
        )
        return cursor.fetchall() or []
    finally:
        db.close()


def crear_cupon(data: dict):
    """Crea un nuevo cupón de descuento."""
    db = get_db()
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO cupones_descuento
                (id_tienda, codigo_cupon, tipo_descuento, valor_descuento,
                 minimo_compra, usos_maximos, fecha_inicio, fecha_fin, activo)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data.get("id_tienda"),
                data["codigo_cupon"].upper(),
                data["tipo_descuento"],
                data["valor_descuento"],
                data.get("minimo_compra", 0),
                data.get("usos_maximos", 1),
                data.get("fecha_inicio"),
                data.get("fecha_fin"),
                data.get("activo", True),
            )
        )
        db.commit()
        return {"ok": True, "id_cupon": cursor.lastrowid}
    except Exception as e:
        db.rollback()
        if "Duplicate" in str(e):
            return {"ok": False, "error": "Ya existe un cupón con ese código."}
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


def obtener_cupones_disponibles():
    """
    Devuelve todos los cupones activos y vigentes que un comprador puede usar.
    Excluye los que han alcanzado su límite de usos.
    """
    db = get_db()
    try:
        cursor = db.cursor(dictionary=True)
        ahora = datetime.now()
        cursor.execute(
            """
            SELECT c.id_cupon, c.codigo_cupon, c.tipo_descuento, c.valor_descuento,
                   c.minimo_compra, c.usos_maximos, c.usos_actuales,
                   c.fecha_inicio, c.fecha_fin,
                   c.id_tienda, t.nombre_tienda
            FROM cupones_descuento c
            LEFT JOIN tiendas t ON c.id_tienda = t.id_tienda
            WHERE c.activo = 1
              AND (c.fecha_inicio IS NULL OR c.fecha_inicio <= %s)
              AND (c.fecha_fin   IS NULL OR c.fecha_fin   >= %s)
              AND (c.usos_maximos IS NULL OR c.usos_actuales < c.usos_maximos)
            ORDER BY c.id_cupon DESC
            """,
            (ahora, ahora)
        )
        cupones = cursor.fetchall() or []
        for c in cupones:
            for campo in ("fecha_inicio", "fecha_fin"):
                if c.get(campo):
                    c[campo] = str(c[campo])
        return cupones
    finally:
        db.close()


def obtener_cupones_por_tienda(id_tienda: int):
    """Devuelve todos los cupones creados por una tienda específica."""
    db = get_db()
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id_cupon, codigo_cupon, tipo_descuento, valor_descuento,
                   minimo_compra, usos_maximos, usos_actuales,
                   fecha_inicio, fecha_fin, activo
            FROM cupones_descuento
            WHERE id_tienda = %s
            ORDER BY id_cupon DESC
            """,
            (id_tienda,)
        )
        cupones = cursor.fetchall() or []
        for c in cupones:
            for campo in ("fecha_inicio", "fecha_fin"):
                if c.get(campo):
                    c[campo] = str(c[campo])
        return cupones
    finally:
        db.close()


def actualizar_cupon(id_cupon: int, data: dict):
    """Actualiza campos de un cupón existente."""
    campos_permitidos = {
        "codigo_cupon", "tipo_descuento", "valor_descuento",
        "minimo_compra", "usos_maximos", "fecha_inicio", "fecha_fin", "activo"
    }
    campos = {k: v for k, v in data.items() if k in campos_permitidos}
    if not campos:
        return {"ok": False, "error": "No hay campos válidos para actualizar."}

    if "codigo_cupon" in campos:
        campos["codigo_cupon"] = campos["codigo_cupon"].upper()

    set_clause = ", ".join(f"{k} = %s" for k in campos)
    valores = list(campos.values()) + [id_cupon]

    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute(
            f"UPDATE cupones_descuento SET {set_clause} WHERE id_cupon = %s",
            valores
        )
        db.commit()
        if cursor.rowcount == 0:
            return {"ok": False, "error": "Cupón no encontrado."}
        return {"ok": True}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


def eliminar_cupon(id_cupon: int):
    """Elimina un cupón. Si tiene usos registrados, solo lo desactiva."""
    db = get_db()
    try:
        cursor = db.cursor(dictionary=True)
        # Verificar si tiene usos registrados
        cursor.execute(
            "SELECT COUNT(*) AS total FROM uso_cupones WHERE id_cupon = %s",
            (id_cupon,)
        )
        row = cursor.fetchone()
        tiene_usos = row and row["total"] > 0

        if tiene_usos:
            # No eliminar — solo desactivar para mantener el historial
            cursor.execute(
                "UPDATE cupones_descuento SET activo = 0 WHERE id_cupon = %s",
                (id_cupon,)
            )
            db.commit()
            return {"ok": True, "mensaje": "El cupón tiene usos registrados y fue desactivado (no eliminado)."}
        else:
            cursor.execute(
                "DELETE FROM cupones_descuento WHERE id_cupon = %s",
                (id_cupon,)
            )
            db.commit()
            return {"ok": True, "mensaje": "Cupón eliminado correctamente."}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()

