-- =============================================================================
-- Migración 028: libros para las tiendas nuevas
-- Distribuye 3 libros por cada una de las 75 tiendas nuevas (76-151)
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
    t.id_tienda,
    ((t.id_tienda + b.n) % 16) + 1 AS id_categoria,
    CONCAT('Libro ', b.n, ' - ', t.nombre_tienda) AS titulo,
    CASE MOD(t.id_tienda + b.n, 8)
        WHEN 0 THEN 'Ana Quintero'
        WHEN 1 THEN 'Mateo Rivera'
        WHEN 2 THEN 'Sofia Pardo'
        WHEN 3 THEN 'Daniela Vega'
        WHEN 4 THEN 'Julian Salazar'
        WHEN 5 THEN 'Laura Ospina'
        WHEN 6 THEN 'Camilo Arango'
        ELSE 'Valeria Rojas'
    END AS autor_libro,
    CONCAT('Colección ', b.n, ' para ', t.nombre_tienda, '. Título pensado para una librería moderna con stock activo y buena rotación en catálogo.') AS descripcion_libro,
    ROUND(15000 + (t.id_tienda * 350) + (b.n * 2200), 2) AS precio_libro,
    5 + MOD(t.id_tienda + b.n, 20) AS stock,
    'Disponible' AS estado_libro,
    DATE_ADD('2024-01-01', INTERVAL (t.id_tienda + b.n) DAY) AS fecha_publicacion,
    DATE_ADD('2024-02-01', INTERVAL (t.id_tienda + b.n) DAY) AS fecha_listado
FROM (
    SELECT 1 AS n
    UNION ALL SELECT 2
    UNION ALL SELECT 3
) AS b
JOIN tiendas t
  ON t.id_tienda BETWEEN 76 AND 151
WHERE NOT EXISTS (
    SELECT 1
    FROM libros l
    WHERE l.id_tienda = t.id_tienda
      AND l.titulo = CONCAT('Libro ', b.n, ' - ', t.nombre_tienda)
);

SELECT '✅ 028 - Libros para tiendas nuevas insertados' AS resultado;
SELECT COUNT(*) AS total_libros FROM libros;
