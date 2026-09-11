-- =============================================================================
-- Migración 033: Poblar imagenes_libro con portadas iniciales por ISBN
-- Inserta una fila en imagenes_libro por cada libro que aún no tenga imagen.
-- La migración 035 sobreescribirá estas URLs con cover_ids verificados.
-- Es seguro ejecutar dos veces: ON DUPLICATE KEY no genera duplicados.
-- =============================================================================

USE bookyhome;

INSERT INTO imagenes_libro (id_libro, url_imagen, es_principal)
SELECT
    l.id_libro,
    CONCAT('https://covers.openlibrary.org/b/isbn/', l.isbn, '-L.jpg') AS url_imagen,
    1 AS es_principal
FROM libros l
WHERE l.isbn IS NOT NULL AND l.isbn != ''
  AND l.id_libro NOT IN (SELECT id_libro FROM imagenes_libro)
ON DUPLICATE KEY UPDATE url_imagen = VALUES(url_imagen);

SELECT '✅ 033 - Filas iniciales en imagenes_libro insertadas' AS resultado;
SELECT COUNT(*) AS total_imagenes FROM imagenes_libro;
