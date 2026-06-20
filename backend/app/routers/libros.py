from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import os, shutil, uuid

from app.auth import verify_token
from app.models.libro import (
    eliminar_libro_por_admin,
    ocultar_libro,
    crear_libro,
    agregar_imagen_libro,
    obtener_libros_por_tienda,
    obtener_tienda_por_usuario,
    obtener_categorias,
    obtener_stats_ventas,
    obtener_top_vendidos,
    editar_libro,
    eliminar_libro,
    actualizar_stock,
    validar_disponibilidad,
    descontar_stock,
    obtener_alertas_stock,
    obtener_pedidos_tienda,
    obtener_ventas_tienda,
)

router = APIRouter()
security = HTTPBearer()

UPLOAD_DIR = "uploads/libros"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ──────────────────────────────────────────────
#  HELPER — obtener usuario del token
# ──────────────────────────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload


def verificar_tienda_activa(tienda):
    estado = tienda.get("estado_tienda") if isinstance(tienda, dict) else tienda[5]
    if str(estado).lower() != "activa":
        raise HTTPException(
            status_code=403,
            detail="Tu tienda no está activa. Solo las tiendas activas pueden administrar libros."
        )
    return True


# ══════════════════════════════════════════════
#  RUTAS CON NOMBRE FIJO — SIEMPRE PRIMERO
#  (deben ir antes que /{id_libro} para que
#   FastAPI no las interprete como parámetro)
# ══════════════════════════════════════════════

# GET /libros/categorias
@router.get("/categorias")
def listar_categorias():
    return obtener_categorias()


# GET /libros/mis-libros
@router.get("/mis-libros")
def mis_libros(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return obtener_libros_por_tienda(tienda["id_tienda"])


# GET /libros/mis-pedidos
@router.get("/mis-pedidos")
def mis_pedidos(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return obtener_pedidos_tienda(tienda["id_tienda"])


# GET /libros/mis-ventas
@router.get("/mis-ventas")
def mis_ventas(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return obtener_ventas_tienda(tienda["id_tienda"])


# GET /libros/stats
@router.get("/stats")
def stats_ventas(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return obtener_stats_ventas(tienda["id_tienda"])


# GET /libros/top-vendidos
@router.get("/top-vendidos")
def top_vendidos(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return obtener_top_vendidos(tienda["id_tienda"], limite=5)


# GET /libros/alertas-stock
# Dashboard vendedor: libros con stock bajo
# Opcional: ?umbral=5 para cambiar el límite (por defecto 3)
@router.get("/alertas-stock")
def alertas_stock(umbral: int = 3, user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    return obtener_alertas_stock(tienda["id_tienda"], umbral)


# POST /libros/publicar
@router.post("/publicar")
async def publicar_libro(
    id_categoria: int = Form(...),
    titulo: str = Form(...),
    autor_libro: str = Form(...),
    descripcion_libro: str = Form(...),
    precio_libro: float = Form(...),
    stock: int = Form(...),
    estado_libro: str = Form(...),
    imagenes: Optional[List[UploadFile]] = File(None),
    user=Depends(get_current_user),
):
    estados_validos = ["nuevo", "usado_buen_estado", "usado_regular"]
    if estado_libro not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"estado_libro debe ser uno de: {', '.join(estados_validos)}"
        )
    if precio_libro <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")
    if stock < 1:
        raise HTTPException(status_code=400, detail="El stock debe ser al menos 1")

    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")

    verificar_tienda_activa(tienda)

    resultado = crear_libro(
        id_tienda=tienda["id_tienda"],
        id_categoria=id_categoria,
        titulo=titulo,
        autor=autor_libro,
        descripcion=descripcion_libro,
        precio=precio_libro,
        stock=stock,
        estado=estado_libro,
    )
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail="Error al crear el libro: " + resultado["error"])

    id_libro = resultado["id_libro"]
    urls_guardadas = []
    if imagenes:
        for imagen in imagenes:
            if imagen.filename:
                ext = os.path.splitext(imagen.filename)[1].lower()
                if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
                    continue
                nombre_unico = f"{uuid.uuid4().hex}{ext}"
                ruta = os.path.join(UPLOAD_DIR, nombre_unico)
                with open(ruta, "wb") as f:
                    shutil.copyfileobj(imagen.file, f)
                url = f"/uploads/libros/{nombre_unico}"
                agregar_imagen_libro(id_libro, url)
                urls_guardadas.append(url)

    return {
        "mensaje": "Libro publicado exitosamente",
        "id_libro": id_libro,
        "imagenes": urls_guardadas,
    }


# ══════════════════════════════════════════════
#  RUTAS CON PARÁMETRO — SIEMPRE AL FINAL
#  (/{id_libro} captura cualquier segmento,
#   por eso deben registrarse de últimas)
# ══════════════════════════════════════════════

# PUT /libros/{id_libro}
@router.put("/{id_libro}")
def editar(
    id_libro: int,
    id_categoria: int = Form(...),
    titulo: str = Form(...),
    autor_libro: str = Form(...),
    descripcion_libro: str = Form(...),
    precio_libro: float = Form(...),
    stock: int = Form(...),
    estado_libro: str = Form(...),
    user=Depends(get_current_user),
):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")

    verificar_tienda_activa(tienda)

    resultado = editar_libro(
        id_libro=id_libro,
        id_tienda=tienda["id_tienda"],
        id_categoria=id_categoria,
        titulo=titulo,
        autor=autor_libro,
        descripcion=descripcion_libro,
        precio=precio_libro,
        stock=stock,
        estado=estado_libro,
    )
    if not resultado["ok"]:
        raise HTTPException(
            status_code=403 if "autorizado" in resultado["error"].lower() else 500,
            detail=resultado["error"]
        )
    return {"mensaje": "Libro actualizado correctamente"}


# DELETE /libros/{id_libro}
@router.delete("/{id_libro}")
def eliminar(id_libro: int, user=Depends(get_current_user)):
    rol_usuario = user.get("rol") # Asegúrate de que tu token traiga el rol
    
    # 👑 SI ES ADMINISTRADOR: Borra directo sin pedir tienda
    if rol_usuario == "admin":
        # Pasamos un ID de tienda genérico o modificamos la función para que acepte None
        resultado = eliminar_libro_por_admin(id_libro) 
        if not resultado["ok"]:
            raise HTTPException(status_code=500, detail=resultado["error"])
        return {"mensaje": "Libro eliminado por el Administrador"}
        
    # 🏪 SI ES VENDEDOR: Mantiene tu lógica estricta de seguridad
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
        
    verificar_tienda_activa(tienda)

    resultado = eliminar_libro(id_libro, tienda["id_tienda"])
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
        
    return {"mensaje": "Libro eliminado correctamente"}


# PATCH /libros/{id_libro}/stock
# Usado por el vendedor desde el dashboard
@router.patch("/{id_libro}/stock")
def update_stock(id_libro: int, stock: int = Form(...), user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")

    verificar_tienda_activa(tienda)

    if stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo")

    resultado = actualizar_stock(id_libro, tienda["id_tienda"], stock)
    if not resultado["ok"]:
        raise HTTPException(
            status_code=403 if "autorizado" in resultado["error"].lower() else 500,
            detail=resultado["error"]
        )
    return {"mensaje": "Stock actualizado correctamente"}


# GET /libros/{id_libro}/disponibilidad?cantidad=2
@router.get("/{id_libro}/disponibilidad")
def disponibilidad(id_libro: int, cantidad: int = 1):
    resultado = validar_disponibilidad(id_libro, cantidad)
    if not resultado["disponible"]:
        raise HTTPException(status_code=409, detail=resultado["error"])
    return resultado


# POST /libros/{id_libro}/descontar-stock
@router.post("/{id_libro}/descontar-stock")
def descontar(id_libro: int, cantidad: int = Form(...)):
    if cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
    resultado = descontar_stock(id_libro, cantidad)
    if not resultado["ok"]:
        raise HTTPException(status_code=409, detail=resultado["error"])
    return resultado

# PATCH /libros/{id_libro}/ocultar
from pydantic import BaseModel

class OcultarPayload(BaseModel):
    oculto: bool

@router.patch("/{id_libro}/ocultar")
def ocultar(id_libro: int, payload: OcultarPayload, user=Depends(get_current_user)):
    resultado = ocultar_libro(id_libro, payload.oculto)
    if not resultado["ok"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
    return {"mensaje": "Estado del libro actualizado"}