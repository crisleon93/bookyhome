import anyio
from fastapi import UploadFile


async def guardar_upload(file: UploadFile, filepath: str) -> None:
    async with await anyio.open_file(filepath, "wb") as destination:
        while chunk := await file.read(1024 * 1024):
            await destination.write(chunk)


def obtener_resumen_calificaciones_tienda(cursor, id_tienda: int) -> dict:
    cursor.execute(
        """
        SELECT
            ct.id_calificacion,
            ct.id_usuario,
            u.nombre_usuario,
            ct.id_tienda,
            t.nombre_tienda,
            ct.calificacion,
            ct.comentario,
            ct.fecha_calificacion
        FROM calificaciones_tiendas ct
        JOIN usuarios u ON ct.id_usuario = u.id_usuario
        JOIN tiendas t ON ct.id_tienda = t.id_tienda
        WHERE ct.id_tienda = %s
        ORDER BY ct.fecha_calificacion DESC
        """,
        (id_tienda,),
    )
    calificaciones = cursor.fetchall()

    cursor.execute(
        """
        SELECT
            ROUND(AVG(ct.calificacion), 2) AS calificacion_media,
            COUNT(ct.id_calificacion) AS total_opiniones,
            SUM(CASE WHEN ct.calificacion = 5 THEN 1 ELSE 0 END) AS total_5_estrellas
        FROM calificaciones_tiendas ct
        WHERE ct.id_tienda = %s
        """,
        (id_tienda,),
    )
    metricas = cursor.fetchone()

    distribucion = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for calificacion in calificaciones:
        estrellas = calificacion["calificacion"]
        if estrellas in distribucion:
            distribucion[estrellas] += 1

    return {
        "promedio": round(metricas["calificacion_media"], 1)
        if metricas and metricas["calificacion_media"]
        else 0,
        "total": metricas["total_opiniones"] if metricas else 0,
        "total_5_estrellas": metricas["total_5_estrellas"] if metricas else 0,
        "distribucion": distribucion,
        "calificaciones": calificaciones,
    }
