-- =============================================================================
-- Migracion 044: Completar imagenes de todos los libros
-- 033 solo cubrio los libros existentes en ese momento. Las migraciones 035/036
-- actualizan filas existentes, pero no crean filas para libros nuevos.
-- =============================================================================

USE bookyhome;

INSERT INTO imagenes_libro (id_libro, url_imagen, es_principal)
SELECT
    l.id_libro,
    CASE
        WHEN l.isbn IS NOT NULL AND TRIM(l.isbn) <> '' THEN
            CONCAT(
                'https://books.google.com/books/content?vid=ISBN',
                REPLACE(TRIM(l.isbn), '-', ''),
                '&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
            )
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%terror%' THEN
            'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%romance%' THEN
            'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%ciencia%' THEN
            'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%tecnolog%' THEN
            'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%historia%' THEN
            'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%infantil%' THEN
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%aventura%' THEN
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%biograf%' THEN
            'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%educa%' THEN
            'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%arte%' THEN
            'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80'
        WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%comedia%' THEN
            'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80'
        ELSE
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
    END AS url_imagen,
    1 AS es_principal
FROM libros l
LEFT JOIN categorias c ON c.id_categoria = l.id_categoria
LEFT JOIN imagenes_libro il ON il.id_libro = l.id_libro
WHERE il.id_libro IS NULL;

-- Los libros generados después del catálogo original tienen ISBN de prueba.
-- Para ellos se usa una imagen visible por categoría en vez de una portada
-- de Google Books que puede responder con "image not available".
UPDATE imagenes_libro il
JOIN libros l ON l.id_libro = il.id_libro
LEFT JOIN categorias c ON c.id_categoria = l.id_categoria
SET il.url_imagen = CASE
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%terror%' THEN 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%romance%' THEN 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%ciencia%' THEN 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%tecnolog%' THEN 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%historia%' THEN 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%infantil%' THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%aventura%' THEN 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%biograf%' THEN 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%educa%' THEN 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%arte%' THEN 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80'
    WHEN LOWER(COALESCE(c.nombre_categoria, '')) LIKE '%comedia%' THEN 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80'
    ELSE 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
END
WHERE il.id_libro > 784;

SELECT '044 - Imagenes de libros completadas' AS resultado;
SELECT COUNT(*) AS total_libros FROM libros;
SELECT COUNT(*) AS total_imagenes FROM imagenes_libro;
SELECT COUNT(*) AS libros_sin_imagen
FROM libros l
LEFT JOIN imagenes_libro il ON il.id_libro = l.id_libro
WHERE il.id_libro IS NULL;
