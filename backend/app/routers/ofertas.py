from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from datetime import datetime

from app.auth import verify_token
from app.models.oferta import (
    crear_oferta,
    asignar_libros_oferta,
    obtener_ofertas_tienda,
    obtener_oferta_detalle,
    editar_oferta,
    eliminar_oferta,
    obtener_oferta_activa_libro,
)
from app.models.libro import obtener_tienda_por_usuario

router = APIRouter()
security = HTTPBearer()

TIPOS_VALIDOS = ["porcentaje", "fijo", "especial"]


def parse_fecha(fecha: str):
    try:
        return datetime.strptime(fecha, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha invalido")


# ──────────────────────────────────────────────
#  HELPER
# ──────────────────────────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload

def get_tienda(user):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return tienda


# ══════════════════════════════════════════════
#  RUTAS FIJAS — PRIMERO
# ══════════════════════════════════════════════

# GET /ofertas
# Lista todas las ofertas de la tienda del vendedor
@router.get("")
def listar_ofertas(user=Depends(get_current_user)):
    tienda = get_tienda(user)
    return obtener_ofertas_tienda(tienda["id_tienda"])


# POST /ofertas
# Crear oferta + asignar libros en un solo paso
@router.post("")
def crear(
    nombre_oferta:   str   = Form(...),
    tipo_descuento:  str   = Form(...),
    valor_descuento: float = Form(...),
    fecha_inicio:    str   = Form(...),   # formato: "2025-06-01 00:00:00"
    fecha_fin:       str   = Form(...),   # formato: "2025-06-15 23:59:59"
    ids_libros:      str   = Form(...),   # IDs separados por coma: "1,2,5"
    user=Depends(get_current_user),
):
    # Validaciones
    if tipo_descuento not in TIPOS_VALIDOS:
        raise HTTPException(status_code=400,
            detail=f"tipo_descuento debe ser: {', '.join(TIPOS_VALIDOS)}")

    if tipo_descuento in ("porcentaje", "fijo") and valor_descuento <= 0:
        raise HTTPException(status_code=400,
            detail="El valor del descuento debe ser mayor a 0")

    if tipo_descuento == "porcentaje" and valor_descuento > 100:
        raise HTTPException(status_code=400,
            detail="El porcentaje no puede ser mayor a 100")

    inicio = parse_fecha(fecha_inicio)
    fin = parse_fecha(fecha_fin)

    if inicio < datetime.now():
        raise HTTPException(status_code=400,
            detail="No puedes crear promociones con fechas pasadas")

    if inicio >= fin:
        raise HTTPException(status_code=400,
            detail="La fecha de inicio debe ser anterior a la fecha de fin")

    tienda = get_tienda(user)

    resultado = crear_oferta(
        id_tienda    = tienda["id_tienda"],
        nombre       = nombre_oferta,
        tipo         = tipo_descuento,
        valor        = valor_descuento,
        fecha_inicio = fecha_inicio,
        fecha_fin    = fecha_fin,
    )
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])

    # Asignar libros
    lista_ids = [int(x.strip()) for x in ids_libros.split(",") if x.strip().isdigit()]
    if lista_ids:
        asignar_libros_oferta(resultado["id_oferta"], lista_ids)

    return {"mensaje": "Oferta creada correctamente", "id_oferta": resultado["id_oferta"]}


# ══════════════════════════════════════════════
#  RUTAS CON PARÁMETRO — AL FINAL
# ══════════════════════════════════════════════

# GET /ofertas/{id_oferta}
# Detalle de una oferta con sus libros
@router.get("/{id_oferta}")
def detalle(id_oferta: int, user=Depends(get_current_user)):
    tienda = get_tienda(user)
    oferta = obtener_oferta_detalle(id_oferta, tienda["id_tienda"])
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return oferta


# PUT /ofertas/{id_oferta}
# Editar oferta y reasignar libros
@router.put("/{id_oferta}")
def editar(
    id_oferta:       int,
    nombre_oferta:   str   = Form(...),
    tipo_descuento:  str   = Form(...),
    valor_descuento: float = Form(...),
    fecha_inicio:    str   = Form(...),
    fecha_fin:       str   = Form(...),
    ids_libros:      str   = Form(...),
    user=Depends(get_current_user),
):
    if tipo_descuento not in TIPOS_VALIDOS:
        raise HTTPException(status_code=400,
            detail=f"tipo_descuento debe ser: {', '.join(TIPOS_VALIDOS)}")

    if tipo_descuento in ("porcentaje", "fijo") and valor_descuento <= 0:
        raise HTTPException(status_code=400,
            detail="El valor del descuento debe ser mayor a 0")

    if tipo_descuento == "porcentaje" and valor_descuento > 100:
        raise HTTPException(status_code=400,
            detail="El porcentaje no puede ser mayor a 100")

    inicio = parse_fecha(fecha_inicio)
    fin = parse_fecha(fecha_fin)

    if inicio >= fin:
        raise HTTPException(status_code=400,
            detail="La fecha de inicio debe ser anterior a la fecha de fin")

    tienda = get_tienda(user)

    resultado = editar_oferta(
        id_oferta    = id_oferta,
        id_tienda    = tienda["id_tienda"],
        nombre       = nombre_oferta,
        tipo         = tipo_descuento,
        valor        = valor_descuento,
        fecha_inicio = fecha_inicio,
        fecha_fin    = fecha_fin,
    )
    if not resultado["ok"]:
        raise HTTPException(
            status_code=403 if "autorizado" in resultado["error"].lower() else 500,
            detail=resultado["error"]
        )

    # Reasignar libros
    lista_ids = [int(x.strip()) for x in ids_libros.split(",") if x.strip().isdigit()]
    asignar_libros_oferta(id_oferta, lista_ids)

    return {"mensaje": "Oferta actualizada correctamente"}


# DELETE /ofertas/{id_oferta}
@router.delete("/{id_oferta}")
def eliminar(id_oferta: int, user=Depends(get_current_user)):
    tienda = get_tienda(user)
    resultado = eliminar_oferta(id_oferta, tienda["id_tienda"])
    if not resultado["ok"]:
        raise HTTPException(
            status_code=403 if "autorizado" in resultado["error"].lower() else 500,
            detail=resultado["error"]
        )
    return {"mensaje": "Oferta eliminada correctamente"}


# GET /ofertas/libro/{id_libro}/activa
@router.get("/libro/{id_libro}/activa")
def oferta_activa_libro(id_libro: int):
    oferta = obtener_oferta_activa_libro(id_libro)
    if not oferta:
        return None
    return oferta
