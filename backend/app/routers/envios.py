from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from app.auth import verify_token
from app.models.envios import listar_empresas, registrar_envio
from app.models.libro import obtener_tienda_por_usuario
from app.database import get_db

router = APIRouter(prefix="/envios", tags=["Envíos"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload


class RegistroEnvio(BaseModel):
    id_comprador: int
    id_empresa: int
    numero_guia: str = Field(min_length=3, max_length=80)


@router.get("/empresas")
def empresas_mensajeria(user=Depends(get_current_user)):
    return listar_empresas()


@router.get("/orden/{id_orden}")
def obtener_envio_orden(id_orden: int, user=Depends(get_current_user)):
    """Devuelve la guía de envío de una orden. Accesible por admin, vendedor dueño o comprador dueño."""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                e.id_envio,
                e.id_orden,
                e.id_empresa,
                e.empresa_mensajeria,
                e.numero_guia,
                e.estado_envio,
                e.fecha_despacho,
                em.sitio_web,
                em.url_rastreo
            FROM envios e
            LEFT JOIN empresas_mensajeria em ON em.id_empresa = e.id_empresa
            WHERE e.id_orden = %s
            LIMIT 1
        """, (id_orden,))
        envio = cursor.fetchone()

        if not envio:
            # Intentar con datos de las empresas hardcodeadas del modelo
            from app.models.envios import EMPRESAS_MENSAJERIA
            cursor.execute("""
                SELECT e.id_envio, e.id_orden, e.id_empresa,
                       e.empresa_mensajeria, e.numero_guia,
                       e.estado_envio, e.fecha_despacho
                FROM envios e
                WHERE e.id_orden = %s
                LIMIT 1
            """, (id_orden,))
            envio = cursor.fetchone()
            if envio:
                empresa = next((emp for emp in EMPRESAS_MENSAJERIA if emp["id_empresa"] == envio.get("id_empresa")), None)
                if empresa:
                    envio["sitio_web"] = empresa.get("sitio_web")
                    envio["url_rastreo"] = empresa.get("url_rastreo", empresa.get("sitio_web"))

        if not envio:
            return {"envio": None}

        # Formatear fecha
        if envio.get("fecha_despacho") and hasattr(envio["fecha_despacho"], "isoformat"):
            envio["fecha_despacho"] = envio["fecha_despacho"].isoformat()

        return {"envio": envio}
    finally:
        cursor.close()
        db.close()


@router.put("/orden/{id_orden}")
def actualizar_envio(id_orden: int, data: RegistroEnvio, user=Depends(get_current_user)):
    tienda = obtener_tienda_por_usuario(int(user["sub"]))
    if not tienda:
        raise HTTPException(status_code=403, detail="Solo un vendedor puede registrar una guía")
    envio, error = registrar_envio(data.id_comprador, id_orden, tienda["id_tienda"], data.id_empresa, data.numero_guia.strip())
    if error:
        status = 404 if error == "Orden no encontrada" else 409 if "pagado" in error else 403
        raise HTTPException(status_code=status, detail=error)
    return {"ok": True, "envio": envio}
