from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.schemas import LibreriaRegistro
from app.models.tiendas import (
    crear_libreria,
    obtener_tiendas,
    actualizar_estado_tienda,
    obtener_tienda_por_usuario,
    actualizar_tienda,
)
from app.auth import verify_token
from app.email import enviar_email_confirmacion_registro, is_smtp_configured
from app.database import get_db
import secrets

router = APIRouter()
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload


@router.post("/libreria")
async def registrar_libreria(data: LibreriaRegistro):
    token_verificacion = secrets.token_urlsafe(32)
    resultado = crear_libreria(
        data.nombre,
        data.libreria,
        data.direccion,
        data.telefono,
        data.email,
        data.password,
        token_verificacion
    )

    if not resultado["ok"]:
        if "Duplicate" in resultado["error"]:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese email")
        raise HTTPException(status_code=500, detail=f"Error al registrar la librería: {resultado['error']}")

    if is_smtp_configured():
        try:
            await enviar_email_confirmacion_registro(data.email, token_verificacion)
            print(f"✅ Correo de confirmación enviado a {data.email}", flush=True)
        except Exception as exc:
            print(f"❌ Error enviando correo de confirmación a {data.email}: {exc}", flush=True)
            return {
                "mensaje": "Librería registrada, pero no se pudo enviar el correo de verificación.",
                "email_enviado": False,
            }

    return {
        "mensaje": "Librería registrada exitosamente. Revisa tu correo para verificar la cuenta.",
        "email_enviado": is_smtp_configured(),
    }


@router.get("/tiendas")
def listar_tiendas():
    return obtener_tiendas()


@router.get("/tiendas/destacadas")
def tiendas_destacadas():
    """Devuelve hasta 6 tiendas activas con logo, ciudad y conteo de libros para el Home público."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                t.id_tienda,
                t.nombre_tienda,
                t.direccion,
                tc.logo_url,
                tc.descripcion,
                tc.ciudad_origen,
                COUNT(l.id_libro) AS total_libros
            FROM tiendas t
            LEFT JOIN tienda_configuracion tc ON tc.id_tienda = t.id_tienda
            LEFT JOIN libros l ON l.id_tienda = t.id_tienda AND l.stock > 0 AND (l.oculto IS NULL OR l.oculto = 0)
            WHERE t.estado_tienda = 'activa'
            GROUP BY t.id_tienda, t.nombre_tienda, t.direccion, tc.logo_url, tc.descripcion, tc.ciudad_origen
            HAVING total_libros > 0
            ORDER BY total_libros DESC
            LIMIT 6
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


ESTADOS_TIENDA_VALIDOS = {'activa', 'pendiente', 'vacaciones', 'suspendida', 'inactiva'}

@router.patch("/tiendas/{id_tienda}/estado")
def cambiar_estado_tienda(id_tienda: int, payload: dict, user_payload: dict = Depends(get_current_user)):
    nuevo_estado = (payload.get("estado") or "").strip().lower()
    motivo = (payload.get("motivo") or "").strip()
    if nuevo_estado not in ESTADOS_TIENDA_VALIDOS:
        raise HTTPException(
            status_code=422,
            detail=f"Estado inválido. Valores permitidos: {', '.join(sorted(ESTADOS_TIENDA_VALIDOS))}"
        )
    admin_id = int(user_payload.get("sub", 1)) if user_payload else None
    resultado = actualizar_estado_tienda(id_tienda, nuevo_estado, motivo=motivo, admin_user_id=admin_id)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return {
        "ok": True,
        "estado": nuevo_estado,
        "mensaje_enviado": resultado.get("mensaje_enviado", False)
    }


@router.get("/tiendas/mi-tienda")
def obtener_mi_tienda(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return tienda


class TiendaUpdate(BaseModel):
    nombre_tienda: str
    direccion: str
    telefono: str


@router.put("/tiendas/mi-tienda")
def modificar_mi_tienda(data: TiendaUpdate, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")

    resultado = actualizar_tienda(id_usuario, data.nombre_tienda, data.direccion, data.telefono)
    if not resultado["ok"]:
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar la tienda: {resultado['error']}"
        )
    return {"mensaje": "Tienda actualizada exitosamente"}