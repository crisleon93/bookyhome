from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import verify_token

router = APIRouter(prefix="/devoluciones", tags=["Devoluciones"])
security = HTTPBearer()

ESTADOS_ELEGIBLES = ("Entregada", "Pagada", "Enviada", "pagado", "completada", "Completada")
ESTADOS_DEVOLUCION_ACTIVOS = ("Solicitada", "En Revision", "Aprobada")


class DevolucionCrear(BaseModel):
    id_orden: int
    motivo: str
    comentarios: Optional[str] = None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return int(payload.get("sub"))


@router.get("")
def listar_devoluciones(user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                d.id_devolucion,
                d.id_orden,
                d.id_usuario,
                d.motivo,
                d.estado_devolucion,
                d.tipo_resolucion,
                d.monto_reembolso,
                d.fecha_solicitud,
                d.fecha_resolucion,
                d.notas_vendedor,
                o.total AS total_orden,
                o.estado_orden,
                o.fecha_orden
            FROM devoluciones d
            INNER JOIN ordenes_compra o ON d.id_orden = o.id_orden
            WHERE d.id_usuario = %s
            ORDER BY d.fecha_solicitud DESC
            """,
            (user_id,),
        )
        return cursor.fetchall() or []
    finally:
        cursor.close()
        db.close()


@router.get("/elegibles")
def listar_pedidos_elegibles(user_id: int = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        placeholders = ", ".join(["%s"] * len(ESTADOS_ELEGIBLES))
        activos = ", ".join(["%s"] * len(ESTADOS_DEVOLUCION_ACTIVOS))
        cursor.execute(
            f"""
            SELECT
                o.id_orden,
                o.fecha_orden,
                o.total,
                o.estado_orden,
                COUNT(do.id_detalle) AS cantidad_items,
                GROUP_CONCAT(l.titulo SEPARATOR ', ') AS libros
            FROM ordenes_compra o
            LEFT JOIN detalle_orden do ON o.id_orden = do.id_orden
            LEFT JOIN libros l ON do.id_libro = l.id_libro
            WHERE o.id_usuario = %s
              AND o.estado_orden IN ({placeholders})
              AND o.id_orden NOT IN (
                  SELECT id_orden
                  FROM devoluciones
                  WHERE id_usuario = %s
                    AND estado_devolucion IN ({activos})
              )
            GROUP BY o.id_orden, o.fecha_orden, o.total, o.estado_orden
            ORDER BY o.fecha_orden DESC
            """,
            (user_id, *ESTADOS_ELEGIBLES, user_id, *ESTADOS_DEVOLUCION_ACTIVOS),
        )
        return cursor.fetchall() or []
    finally:
        cursor.close()
        db.close()


@router.post("")
def solicitar_devolucion(data: DevolucionCrear, user_id: int = Depends(get_current_user)):
    motivo = data.motivo.strip()
    if not motivo:
        raise HTTPException(status_code=400, detail="El motivo es obligatorio")

    comentarios = data.comentarios.strip() if data.comentarios else ""
    motivo_completo = motivo if not comentarios else f"{motivo} — {comentarios}"

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        placeholders = ", ".join(["%s"] * len(ESTADOS_ELEGIBLES))
        cursor.execute(
            f"""
            SELECT id_orden, estado_orden, total
            FROM ordenes_compra
            WHERE id_orden = %s AND id_usuario = %s AND estado_orden IN ({placeholders})
            """,
            (data.id_orden, user_id, *ESTADOS_ELEGIBLES),
        )
        orden = cursor.fetchone()
        if not orden:
            raise HTTPException(
                status_code=400,
                detail="La orden no existe o no es elegible para devolución",
            )

        activos = ", ".join(["%s"] * len(ESTADOS_DEVOLUCION_ACTIVOS))
        cursor.execute(
            f"""
            SELECT id_devolucion
            FROM devoluciones
            WHERE id_orden = %s AND id_usuario = %s AND estado_devolucion IN ({activos})
            """,
            (data.id_orden, user_id, *ESTADOS_DEVOLUCION_ACTIVOS),
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Ya existe una solicitud de devolución activa para esta orden",
            )

        cursor.execute(
            """
            INSERT INTO devoluciones (id_orden, id_usuario, motivo, estado_devolucion)
            VALUES (%s, %s, %s, 'Solicitada')
            """,
            (data.id_orden, user_id, motivo_completo[:300]),
        )
        db.commit()
        id_devolucion = cursor.lastrowid

        cursor.execute(
            """
            SELECT
                d.id_devolucion,
                d.id_orden,
                d.id_usuario,
                d.motivo,
                d.estado_devolucion,
                d.tipo_resolucion,
                d.monto_reembolso,
                d.fecha_solicitud,
                d.fecha_resolucion,
                d.notas_vendedor,
                o.total AS total_orden,
                o.estado_orden,
                o.fecha_orden
            FROM devoluciones d
            INNER JOIN ordenes_compra o ON d.id_orden = o.id_orden
            WHERE d.id_devolucion = %s
            """,
            (id_devolucion,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()
