-- =============================================================================
-- Migracion 045: Reparar caracteres perdidos en nombres de tiendas
-- Los cupones muestran tiendas.nombre_tienda, por eso corregir tiendas repara
-- automaticamente los nombres visibles en cupones y en el resto de la app.
-- =============================================================================

USE bookyhome;

UPDATE tiendas SET nombre_tienda = CONCAT('Librer', _utf8mb4 0xC3AD, 'a ', _utf8mb4 0xC381, 'ncora') WHERE id_tienda = 75;
UPDATE tiendas SET nombre_tienda = CONCAT('C', _utf8mb4 0xC3BA, 'pula Literaria') WHERE id_tienda = 79;
UPDATE tiendas SET nombre_tienda = CONCAT('El ', _utf8mb4 0xC381, 'tico Libros') WHERE id_tienda = 87;
UPDATE tiendas SET nombre_tienda = CONCAT('Cu', _utf8mb4 0xC3A9, 'ntame Libros') WHERE id_tienda = 88;
UPDATE tiendas SET nombre_tienda = CONCAT('El Rinc', _utf8mb4 0xC3B3, 'n del Papel') WHERE id_tienda = 89;
UPDATE tiendas SET nombre_tienda = CONCAT('Letras del Pac', _utf8mb4 0xC3AD, 'fico') WHERE id_tienda = 91;
UPDATE tiendas SET nombre_tienda = CONCAT('El P', _utf8mb4 0xC3A1, 'ramo Libros') WHERE id_tienda = 95;
UPDATE tiendas SET nombre_tienda = CONCAT('El Comp', _utf8mb4 0xC3A1, 's Libros') WHERE id_tienda = 103;
UPDATE tiendas SET nombre_tienda = CONCAT(_utf8mb4 0xC381, 'ginas Abiertas') WHERE id_tienda = 104;
UPDATE tiendas SET nombre_tienda = CONCAT('Jard', _utf8mb4 0xC3AD, 'n de Libros') WHERE id_tienda = 108;
UPDATE tiendas SET nombre_tienda = CONCAT('Libros del Tr', _utf8mb4 0xC3B3, 'pico') WHERE id_tienda = 111;
UPDATE tiendas SET nombre_tienda = CONCAT('El Colof', _utf8mb4 0xC3B3, 'n Libros') WHERE id_tienda = 112;
UPDATE tiendas SET nombre_tienda = CONCAT('El T', _utf8mb4 0xC3B3, 'tem Libros') WHERE id_tienda = 114;
UPDATE tiendas SET nombre_tienda = CONCAT('El Colibr', _utf8mb4 0xC3AD, ' Libros') WHERE id_tienda = 119;
UPDATE tiendas SET nombre_tienda = CONCAT('Ori', _utf8mb4 0xC3B3, 'n Libros') WHERE id_tienda = 122;
UPDATE tiendas SET nombre_tienda = CONCAT('La Br', _utf8mb4 0xC3BA, 'jula Libros') WHERE id_tienda = 124;
UPDATE tiendas SET nombre_tienda = CONCAT('Esp', _utf8mb4 0xC3AD, 'ritu del Libro') WHERE id_tienda = 125;
UPDATE tiendas SET nombre_tienda = CONCAT('Diente de Le', _utf8mb4 0xC3B3, 'n') WHERE id_tienda = 129;
UPDATE tiendas SET nombre_tienda = CONCAT('La Cr', _utf8mb4 0xC3B3, 'nica Libros') WHERE id_tienda = 137;
UPDATE tiendas SET nombre_tienda = CONCAT('El Archipi', _utf8mb4 0xC3A9, 'lago Libros') WHERE id_tienda = 138;
UPDATE tiendas SET nombre_tienda = CONCAT('El ', _utf8mb4 0xC381, 'baco Libros') WHERE id_tienda = 141;
UPDATE tiendas SET nombre_tienda = CONCAT('Libros de la Monta', _utf8mb4 0xC3B1, 'a') WHERE id_tienda = 142;
UPDATE tiendas SET nombre_tienda = CONCAT('El Zagu', _utf8mb4 0xC3A1, 'n Libros') WHERE id_tienda = 144;
UPDATE tiendas SET nombre_tienda = CONCAT('Libros y Caf', _utf8mb4 0xC3A9, ' San Mart', _utf8mb4 0xC3AD, 'n') WHERE id_tienda = 146;
UPDATE tiendas SET nombre_tienda = CONCAT('La Estaci', _utf8mb4 0xC3B3, 'n Libros') WHERE id_tienda = 148;

SELECT '045 - Nombres de tiendas reparados' AS resultado;
SELECT COUNT(*) AS tiendas_con_marcador_danado
FROM tiendas
WHERE nombre_tienda LIKE '%??%';
