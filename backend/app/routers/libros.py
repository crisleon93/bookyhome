from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Body # ⬅️ ASEGÚRATE DE QUE 'Body' ESTÉ AQUÍ
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from fastapi.responses import FileResponse
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
UPLOAD_DIGITAL_DIR = "uploads/libros_digitales"
os.makedirs(UPLOAD_DIGITAL_DIR, exist_ok=True)
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
    """
    Solo bloquea operaciones si la tienda está SUSPENDIDA.
    Las tiendas nuevas nacen activas y pueden operar de inmediato.
    """
    estado = tienda.get("estado_tienda") if isinstance(tienda, dict) else tienda[5]
    estado_str = str(estado).lower() if estado else ""

    if estado_str == "suspendida":
        raise HTTPException(
            status_code=403,
            detail="Tu tienda ha sido suspendida por incumplir las normas. Comunícate con el administrador."
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
    verificar_tienda_activa(tienda)
    return obtener_libros_por_tienda(tienda["id_tienda"])


# GET /libros/mis-pedidos
@router.get("/mis-pedidos")
def mis_pedidos(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    verificar_tienda_activa(tienda)
    return obtener_pedidos_tienda(tienda["id_tienda"])


# GET /libros/mis-ventas
@router.get("/mis-ventas")
def mis_ventas(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    verificar_tienda_activa(tienda)
    return obtener_ventas_tienda(tienda["id_tienda"])


# GET /libros/stats
@router.get("/stats")
def stats_ventas(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    verificar_tienda_activa(tienda)
    return obtener_stats_ventas(tienda["id_tienda"])


# GET /libros/top-vendidos
@router.get("/top-vendidos")
def top_vendidos(user=Depends(get_current_user)):
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
    verificar_tienda_activa(tienda)
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
    verificar_tienda_activa(tienda)
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
    isbn: Optional[str] = Form(None),
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
        isbn=isbn,
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
    isbn: Optional[str] = Form(None),
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
        isbn=isbn,
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
    rol_usuario = user.get("rol")  # Asegúrate de que tu token traiga el rol

    # SI ES ADMINISTRADOR: Borra directo sin pedir tienda
    if rol_usuario == "admin":
        resultado = eliminar_libro_por_admin(id_libro)
        if not resultado["ok"]:
            raise HTTPException(status_code=500, detail=resultado["error"])
        return {"mensaje": "Libro eliminado por el Administrador"}

    # SI ES VENDEDOR: Mantiene la lógica estricta de seguridad
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

# PATCH /libros/{id_libro}/ocultar
from pydantic import BaseModel

# 🚨 La clase DEBE estar arriba de la función
class OcultarPayload(BaseModel):
    oculto: bool

# PATCH /libros/{id_libro}/ocultar
from fastapi import Body # 🚨 Asegúrate de agregar Body en tus imports de fastapi arriba

# PATCH /libros/{id_libro}/ocultar
# PATCH /libros/{id_libro}/ocultar
@router.patch("/{id_libro}/ocultar")
def ocultar(id_libro: int, payload: dict = Body(...), user=Depends(get_current_user)):
    rol_usuario = user.get("rol")
    ocultar_estado = payload.get("oculto", False)
    
    if rol_usuario == "admin":
        resultado = ocultar_libro(id_libro, ocultar_estado)
        if not resultado["ok"]:
            raise HTTPException(status_code=500, detail=resultado["error"])
        return {"mensaje": "Estado de visibilidad del libro actualizado por el Administrador"}

    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=404, detail="No tienes una tienda registrada")
        
    verificar_tienda_activa(tienda)

    resultado = ocultar_libro(id_libro, ocultar_estado, id_tienda=tienda["id_tienda"])
    if not resultado["ok"]:
        raise HTTPException(
            status_code=403 if "autorizado" in resultado["error"].lower() else 500, 
            detail=resultado["error"]
        )
        
    return {"mensaje": "Estado del libro actualizado correctamente"}


# ── Variantes de un libro ──────────────────────────────────────────────────────
@router.get("/{id_libro}/variantes")
def get_variantes_libro(id_libro: int):
    """Devuelve todas las variantes activas de un libro (tipo_tapa, idioma, edición, precio, stock)."""
    from app.database import get_db
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT id_variante, tipo_tapa, idioma, edicion, isbn,
                   precio_variante, stock_variante, peso_gramos, numero_paginas
            FROM libro_variantes
            WHERE id_libro = %s AND activa = 1
            ORDER BY precio_variante ASC
        """, (id_libro,))
        variantes = cursor.fetchall()
        # Convertir Decimal a float para que JSON lo serialice
        for v in variantes:
            v['precio_variante'] = float(v['precio_variante'])
        return variantes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'db' in locals(): db.close()


# ── Crear variante de un libro ─────────────────────────────────────────────────
@router.post("/{id_libro}/variantes")
def crear_variante_libro(id_libro: int, data: dict, user=Depends(get_current_user)):
    """Crea una nueva variante para un libro (solo el vendedor propietario)."""
    id_usuario = int(user["sub"])
    tienda = obtener_tienda_por_usuario(id_usuario)
    if not tienda:
        raise HTTPException(status_code=403, detail="No eres vendedor.")

    from app.database import get_db
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id_tienda FROM libros WHERE id_libro = %s", (id_libro,))
        libro = cursor.fetchone()
        if not libro or libro["id_tienda"] != tienda["id_tienda"]:
            raise HTTPException(status_code=403, detail="El libro no te pertenece.")

        cursor.execute("""
            INSERT INTO libro_variantes (id_libro, tipo_tapa, idioma, edicion, precio_variante, stock_variante, activa)
            VALUES (%s, %s, %s, %s, %s, %s, 1)
        """, (
            id_libro,
            data.get("tipo_tapa", "Tapa Blanda"),
            data.get("idioma", "Espanol"),
            data.get("edicion", "1ra Edicion"),
            float(data.get("precio_variante", 0)),
            int(data.get("stock_variante", 1)),
        ))
        db.commit()
        id_variante = cursor.lastrowid
        return {"ok": True, "id_variante": id_variante}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


# ── Descarga de libro digital ──────────────────────────────────────────────────
@router.post("/{id_libro}/variantes/{id_variante}/archivo")
async def subir_archivo_digital(
    id_libro: int,
    id_variante: int,
    file: UploadFile = File(...),
    token: HTTPAuthorizationCredentials = Depends(security)
):
    """Sube un archivo PDF o EPUB para una variante digital (solo el vendedor del libro)."""
    user = verify_token(token.credentials)
    id_usuario = int(user["sub"])

    from app.database import get_db
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        # Verificar que la tienda sea del usuario y el libro sea de la tienda
        tienda = obtener_tienda_por_usuario(id_usuario)
        if not tienda:
            raise HTTPException(status_code=403, detail="No eres vendedor.")
            
        cursor.execute("SELECT id_tienda FROM libros WHERE id_libro = %s", (id_libro,))
        libro = cursor.fetchone()
        if not libro or libro["id_tienda"] != tienda["id_tienda"]:
            raise HTTPException(status_code=403, detail="El libro no te pertenece.")

        # Guardar archivo
        ext = file.filename.split('.')[-1].lower()
        if ext not in ['pdf', 'epub']:
            raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF o EPUB.")
            
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIGITAL_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Actualizar base de datos
        archivo_url = f"/static_digital/{filename}"
        cursor.execute("UPDATE libro_variantes SET archivo_digital_url = %s WHERE id_variante = %s AND id_libro = %s", (archivo_url, id_variante, id_libro))
        db.commit()
        return {"mensaje": "Archivo subido correctamente", "url": archivo_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@router.get("/descargar/{id_variante}")
def descargar_libro_digital(id_variante: int, token: str):
    """Descarga el archivo digital si el usuario lo ha comprado. (Se pasa el token por query param para descargas directas)"""
    user = verify_token(token)
    id_usuario = int(user["sub"])
    
    # ------------------------------------------------------------------
    # 1. Verificar compra en el sistema JSON (payments.py)
    # ------------------------------------------------------------------
    compra_json = False
    try:
        from app.models.payments import _load_store, ORDER_FILE
        orders = _load_store(ORDER_FILE)
        user_orders = orders.get(str(id_usuario), [])
        estados_validos = {'pagado', 'completado', 'en preparacion', 'enviado', 'entregado'}
        for order in user_orders:
            if order.get('estado', '').lower() in estados_validos:
                for item in order.get('items', []):
                    if item.get('id_variante') == id_variante:
                        compra_json = True
                        break
            if compra_json:
                break
    except Exception as e:
        print(f"⚠️ Error verificando compra en JSON: {e}")

    # ------------------------------------------------------------------
    # 2. Verificar en MySQL (insensible a mayúsculas para mayor robustez)
    # ------------------------------------------------------------------
    compra_mysql = False
    db = None
    cursor = None
    try:
        from app.database import get_db
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT o.id_orden 
            FROM ordenes_compra o
            JOIN detalle_orden do ON o.id_orden = do.id_orden
            WHERE o.id_usuario = %s AND do.id_variante = %s
              AND LOWER(o.estado_orden) IN ('pagado', 'completado', 'en preparacion', 'enviado', 'entregado')
        """, (id_usuario, id_variante))
        if cursor.fetchone():
            compra_mysql = True
    except Exception as e:
        print(f"⚠️ Error verificando compra en MySQL: {e}")
    finally:
        if cursor: cursor.close()
        if db: db.close()

    if not compra_json and not compra_mysql:
        raise HTTPException(status_code=403, detail="No has comprado esta versión digital o el pago no está completado.")

    # ------------------------------------------------------------------
    # 3. Obtener y devolver el archivo
    # ------------------------------------------------------------------
    db2 = None
    cursor2 = None
    try:
        from app.database import get_db
        db2 = get_db()
        cursor2 = db2.cursor(dictionary=True)
        cursor2.execute("SELECT archivo_digital_url, tipo_tapa FROM libro_variantes WHERE id_variante = %s", (id_variante,))
        variante = cursor2.fetchone()
        
        if not variante or variante["tipo_tapa"] != "Digital" or not variante["archivo_digital_url"]:
            raise HTTPException(status_code=404, detail="El archivo digital no está disponible.")
            
        filepath = variante["archivo_digital_url"].replace("/static_digital/", f"{UPLOAD_DIGITAL_DIR}/")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="El archivo no se encuentra en el servidor.")
            
        return FileResponse(filepath, media_type="application/pdf", filename=os.path.basename(filepath))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor2: cursor2.close()
        if db2: db2.close()