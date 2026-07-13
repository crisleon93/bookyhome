from fastapi import APIRouter, HTTPException, Depends
from app.auth import get_current_user, require_role
from app.models.cupones import (
    validar_cupon,
    registrar_uso_cupon,
    obtener_todos_cupones,
    crear_cupon,
    obtener_cupones_disponibles,
    obtener_cupones_por_tienda,
    actualizar_cupon,
    eliminar_cupon,
)
from app.models.tiendas import obtener_tienda_por_usuario

router = APIRouter(prefix="/cupones", tags=["Cupones"])



# ========================
# ========================
# POST /cupones/validar
# Valida un cupón sin registrar su uso
# ========================
@router.post("/validar")
def validar(data: dict, usuario: dict = Depends(get_current_user)):
    """
    Valida si un cupón es aplicable para el usuario y el total dado.
    Body: { codigo, total, order_id (opcional) }
    """
    codigo = data.get("codigo", "").strip()
    total = float(data.get("total", 0))

    if not codigo:
        raise HTTPException(status_code=400, detail="El código del cupón es obligatorio.")

    resultado = validar_cupon(codigo, usuario["id_usuario"], total)

    return {
        "valido": resultado["valido"],
        "mensaje": resultado["mensaje"],
        "descuento": resultado.get("descuento", 0),
        "cupon": resultado.get("cupon"),
    }


# ========================
# POST /cupones/aplicar
# Registra el uso real del cupón al confirmar el pago
# ========================
@router.post("/aplicar")
def aplicar(data: dict, usuario: dict = Depends(get_current_user)):
    """
    Registra el uso del cupón vinculado a una orden ya creada.
    Body: { codigo, id_orden, total }
    """
    codigo = data.get("codigo", "").strip()
    id_orden = data.get("id_orden")
    total = float(data.get("total", 0))

    if not codigo or not id_orden:
        raise HTTPException(status_code=400, detail="código e id_orden son obligatorios.")

    # Re-validar antes de aplicar
    resultado = validar_cupon(codigo, usuario["id_usuario"], total)
    if not resultado["valido"]:
        raise HTTPException(status_code=400, detail=resultado["mensaje"])

    cupon = resultado["cupon"]
    descuento = resultado["descuento"]

    reg = registrar_uso_cupon(cupon["id_cupon"], usuario["id_usuario"], int(id_orden), descuento)
    if not reg["ok"]:
        raise HTTPException(status_code=500, detail=f"Error al registrar uso del cupón: {reg.get('error')}")

    return {
        "ok": True,
        "mensaje": f"Cupón aplicado correctamente. Descuento: ${descuento:,.0f} COP",
        "descuento": descuento,
    }


# ========================
# GET /cupones
# Lista todos los cupones (solo admin)
# ========================
@router.get("/", dependencies=[Depends(require_role("admin"))])
def listar_cupones():
    """Devuelve todos los cupones registrados en el sistema."""
    cupones = obtener_todos_cupones()
    # Convertir fechas a string para serialización JSON
    for c in cupones:
        for campo in ("fecha_inicio", "fecha_fin"):
            if c.get(campo):
                c[campo] = str(c[campo])
    return cupones


# ========================
# POST /cupones
# Crea un nuevo cupón (admin o vendedor)
# ========================
@router.post("/", dependencies=[Depends(require_role("admin", "vendedor"))])
def crear(data: dict, usuario: dict = Depends(get_current_user)):
    """
    Crea un nuevo cupón de descuento.
    Si es vendedor, asocia automáticamente a su tienda.
    Body: { codigo_cupon, tipo_descuento, valor_descuento, minimo_compra?, usos_maximos?, fecha_inicio?, fecha_fin? }
    """
    required = ["codigo_cupon", "tipo_descuento", "valor_descuento"]
    for campo in required:
        if not data.get(campo):
            raise HTTPException(status_code=400, detail=f"El campo '{campo}' es obligatorio.")

    tipo = data["tipo_descuento"].lower()
    if tipo not in ("porcentaje", "fijo"):
        raise HTTPException(status_code=400, detail="tipo_descuento debe ser 'porcentaje' o 'fijo'.")

    # Si es vendedor, forzar id_tienda de su tienda
    if usuario["rol"] == "vendedor":
        data["id_tienda"] = usuario.get("id_tienda")
        if not data["id_tienda"]:
            raise HTTPException(status_code=400, detail="El vendedor no tiene una tienda asociada.")

    resultado = crear_cupon(data)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado.get("error", "Error al crear el cupón."))

    return {"ok": True, "mensaje": "Cupón creado exitosamente.", "id_cupon": resultado["id_cupon"]}


# ========================
# GET /cupones/disponibles
# Para el comprador: cupones activos y vigentes que puede usar
# ========================
@router.get("/disponibles")
def listar_disponibles(usuario: dict = Depends(get_current_user)):
    """Devuelve los cupones disponibles que el comprador puede usar en este momento."""
    return obtener_cupones_disponibles()


# ========================
# GET /cupones/tienda/{id_tienda}
# Para el vendedor/admin: cupones de una tienda específica
# ========================
@router.get("/tienda/{id_tienda}", dependencies=[Depends(require_role("admin", "vendedor"))])
def listar_por_tienda(id_tienda: int, usuario: dict = Depends(get_current_user)):
    """Devuelve los cupones de una tienda específica (el vendedor solo puede ver su propia tienda)."""
    if usuario["rol"] == "vendedor" and usuario.get("id_tienda") != id_tienda:
        raise HTTPException(status_code=403, detail="No tienes acceso a los cupones de esta tienda.")
    return obtener_cupones_por_tienda(id_tienda)


# ========================
# PATCH /cupones/{id_cupon}
# Editar un cupón existente (vendedor o admin)
# ========================
@router.patch("/{id_cupon}", dependencies=[Depends(require_role("admin", "vendedor"))])
def editar(id_cupon: int, data: dict, usuario: dict = Depends(get_current_user)):
    """
    Actualiza campos de un cupón. El vendedor solo puede editar cupones de su tienda.
    """
    # Si es vendedor, verificar que el cupón le pertenezca
    if usuario["rol"] == "vendedor":
        db_cupones = obtener_cupones_por_tienda(usuario["id_tienda"])
        if not any(c["id_cupon"] == id_cupon for c in db_cupones):
            raise HTTPException(status_code=403, detail="No tienes acceso para editar este cupón.")

    resultado = actualizar_cupon(id_cupon, data)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado.get("error", "Error al actualizar."))
    return {"ok": True, "mensaje": "Cupón actualizado correctamente."}


# ========================
# DELETE /cupones/{id_cupon}
# Eliminar o desactivar un cupón (vendedor o admin)
# ========================
@router.delete("/{id_cupon}", dependencies=[Depends(require_role("admin", "vendedor"))])
def eliminar(id_cupon: int, usuario: dict = Depends(get_current_user)):
    """
    Elimina el cupón si no tiene usos. El vendedor solo puede eliminar cupones de su tienda.
    """
    if usuario["rol"] == "vendedor":
        db_cupones = obtener_cupones_por_tienda(usuario["id_tienda"])
        if not any(c["id_cupon"] == id_cupon for c in db_cupones):
            raise HTTPException(status_code=403, detail="No tienes acceso para eliminar este cupón.")

    resultado = eliminar_cupon(id_cupon)
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado.get("error", "Error al eliminar."))
    return {"ok": True, "mensaje": resultado.get("mensaje", "Operación completada.")}

