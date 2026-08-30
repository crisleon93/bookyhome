-- =============================================================================
-- Migración 025: insertar libros adicionales para completar la base de prueba
-- Objetivo: pasar de ~50 libros actuales a ~476 libros totales (~426 nuevos)
-- =============================================================================

USE bookyhome;

INSERT INTO libros (
    id_tienda,
    id_categoria,
    titulo,
    autor_libro,
    descripcion_libro,
    precio_libro,
    stock,
    estado_libro,
    fecha_publicacion,
    fecha_listado
)
SELECT
    ((n.n - 1) % 14) + 1 AS id_tienda,
    ((n.n - 1) % 16) + 1 AS id_categoria,
    CONCAT('Libro ', n.n, ' - ', c.nombre_categoria) AS titulo,
    CASE MOD(n.n, 9)
        WHEN 0 THEN 'Alvaro Pineda'
        WHEN 1 THEN 'Marina Beltran'
        WHEN 2 THEN 'Santiago Rios'
        WHEN 3 THEN 'Daniela Lozano'
        WHEN 4 THEN 'Felipe Navas'
        WHEN 5 THEN 'Lucia Ortega'
        WHEN 6 THEN 'Mateo Villamil'
        WHEN 7 THEN 'Valeria Cardona'
        ELSE 'Camilo Restrepo'
    END AS autor_libro,
    CONCAT(
        'Edición ', n.n, ' enfocada en ', c.nombre_categoria,
        ' con contenido práctico, narrativo y de referencia para la comunidad lectora colombiana.'
    ) AS descripcion_libro,
    ROUND(15000 + (n.n * 173) + (MOD(n.n, 7) * 2500), 2) AS precio_libro,
    8 + MOD(n.n, 18) AS stock,
    'Disponible' AS estado_libro,
    DATE_ADD('2024-01-01', INTERVAL n.n DAY) AS fecha_publicacion,
    DATE_ADD('2024-01-10', INTERVAL n.n DAY) AS fecha_listado
FROM (
    SELECT (@row := @row + 1) AS n
    FROM information_schema.columns c1
    CROSS JOIN information_schema.columns c2
    CROSS JOIN (SELECT @row := 0) vars
    LIMIT 426
) AS n
JOIN categorias c ON c.id_categoria = ((n.n - 1) % 16) + 1
WHERE NOT EXISTS (
    SELECT 1
    FROM libros l
    WHERE l.titulo = CONCAT('Libro ', n.n, ' - ', c.nombre_categoria)
);

SELECT '✅ 025 - Libros adicionales insertados' AS resultado;
SELECT COUNT(*) AS total_libros FROM libros;
