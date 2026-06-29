from fastapi import APIRouter, HTTPException, Query
from app.database import get_db
from typing import Optional

router = APIRouter(prefix="/catalogo", tags=["Catálogo"])

# ============= ENDPOINTS =============

@router.get("/busqueda-avanzada")
def busqueda_avanzada(
    q: Optional[str] = Query(None, min_length=1, description="Búsqueda por título, autor, etc"),
    categoria_id: Optional[int] = Query(None, description="ID de categoría"),
    precio_min: Optional[float] = Query(None, ge=0, description="Precio mínimo"),
    precio_max: Optional[float] = Query(None, ge=0, description="Precio máximo"),
    calificacion_min: Optional[float] = Query(None, ge=0, le=5, description="Calificación mínima"),
    disponible: Optional[bool] = Query(None, description="Solo libros con stock"),
    ordenar_por: Optional[str] = Query("relevancia", regex="^(relevancia|precio_asc|precio_desc|calificacion|recientes)$"),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100)
):
    """
    Búsqueda avanzada con filtros
    
    Parámetros:
    - q: Texto de búsqueda
    - categoria_id: Filtro por categoría
    - precio_min/precio_max: Rango de precio
    - calificacion_min: Calificación mínima
    - disponible: true para solo libros en stock
    - ordenar_por: relevancia, precio_asc, precio_desc, calificacion, recientes
    - pagina: Número de página
    - limite: Libros por página (máx 100)
    """
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Construir WHERE dinámico
        # l.oculto = 0 asegura que los libros ocultados por moderación (admin) 
        # o por el propio vendedor nunca aparezcan en el catálogo público
        where_conditions = ["l.stock > 0", "l.oculto = 0"]
        params = []
        
        if q:
            where_conditions.append("(l.titulo LIKE %s OR l.autor_libro LIKE %s OR l.descripcion_libro LIKE %s)")
            search_term = f"%{q}%"
            params.extend([search_term, search_term, search_term])
        
        if categoria_id:
            where_conditions.append("l.id_categoria = %s")
            params.append(categoria_id)
        
        if precio_min is not None:
            where_conditions.append("l.precio_libro >= %s")
            params.append(precio_min)
        
        if precio_max is not None:
            where_conditions.append("l.precio_libro <= %s")
            params.append(precio_max)
        
        if disponible:
            where_conditions.append("l.stock > 0")
        
        # Construir ORDER BY
        orden_map = {
            "relevancia": "l.fecha_listado DESC",
            "precio_asc": "l.precio_libro ASC",
            "precio_desc": "l.precio_libro DESC",
            "calificacion": "promedio_calificacion DESC",
            "recientes": "l.fecha_listado DESC"
        }
        order_clause = orden_map.get(ordenar_por, "l.fecha_listado DESC")
        
        # Query base
        where_clause = " AND ".join(where_conditions)
        
        # Contar total
        count_query = f"""
            SELECT COUNT(*) as total 
            FROM libros l
            WHERE {where_clause}
        """
        cursor.execute(count_query, params)
        total_result = cursor.fetchone()
        total = total_result["total"] if total_result else 0
        
        # Query principal con calificaciones
        offset = (pagina - 1) * limite
        
        main_query = f"""
            SELECT 
                l.id_libro,
                l.titulo,
                l.autor_libro,
                l.descripcion_libro,
                l.precio_libro,
                l.stock,
                l.estado_libro,
                l.fecha_listado,
                c.nombre_categoria,
                t.nombre_tienda,
                t.id_tienda,
                (SELECT url_imagen FROM imagenes_libro WHERE id_libro = l.id_libro LIMIT 1) as imagen_url,
                COALESCE(AVG(r.calificacion), 0) as promedio_calificacion,
                COUNT(r.id_resena) as total_resenas
            FROM libros l
            LEFT JOIN categorias c ON l.id_categoria = c.id_categoria
            LEFT JOIN tiendas t ON l.id_tienda = t.id_tienda
            LEFT JOIN resenas_libros r ON l.id_libro = r.id_libro
            WHERE {where_clause}
            GROUP BY l.id_libro, l.titulo, l.autor_libro, l.precio_libro, l.stock, l.descripcion_libro, l.fecha_listado, c.nombre_categoria, t.nombre_tienda, t.id_tienda
            ORDER BY {order_clause}
            LIMIT %s OFFSET %s
        """
        
        params.extend([limite, offset])
        cursor.execute(main_query, params)
        libros = cursor.fetchall()
        
        # Calcular páginas
        total_paginas = (total + limite - 1) // limite
        
        return {
            "total": total,
            "pagina": pagina,
            "limite": limite,
            "total_paginas": total_paginas,
            "libros": libros
        }
        
    except Exception as e:
        print(f"Error en búsqueda: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@router.get("/filtros-disponibles")
def obtener_filtros_disponibles():
    """Retorna opciones disponibles para filtros (para llenar selects en el frontend)"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Categorías
        cursor.execute("SELECT id_categoria, nombre_categoria FROM categorias ORDER BY nombre_categoria")
        categorias = cursor.fetchall()
        
        # Rangos de precio
        cursor.execute("""
            SELECT 
                MIN(precio_libro) as precio_min,
                MAX(precio_libro) as precio_max
            FROM libros
            WHERE stock > 0
        """)
        rango_precios = cursor.fetchone()
        
        return {
            "categorias": categorias,
            "precio_min": rango_precios["precio_min"] or 0,
            "precio_max": rango_precios["precio_max"] or 0,
            "opciones_ordenamiento": [
                {"value": "relevancia", "label": "Relevancia"},
                {"value": "precio_asc", "label": "Precio: Menor a Mayor"},
                {"value": "precio_desc", "label": "Precio: Mayor a Menor"},
                {"value": "calificacion", "label": "Mayor Calificación"},
                {"value": "recientes", "label": "Más Recientes"}
            ]
        }
    finally:
        cursor.close()
        db.close()

@router.get("/categorias")
def obtener_categorias():
    """Retorna todas las categorías con cantidad de libros"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        query = """
            SELECT 
                c.id_categoria,
                c.nombre_categoria,
                COUNT(l.id_libro) as cantidad_libros
            FROM categorias c
            LEFT JOIN libros l ON c.id_categoria = l.id_categoria AND l.stock > 0
            GROUP BY c.id_categoria, c.nombre_categoria
            ORDER BY c.nombre_categoria
        """
        cursor.execute(query)
        categorias = cursor.fetchall()
        return categorias
    finally:
        cursor.close()
        db.close()