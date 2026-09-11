-- =============================================================================
-- Migración 039: Asegurar mínimo 7 promociones por tienda
-- Fecha: 2026-09-10
-- Descripción:
--   Inserta ofertas de demo para todas las tiendas activas del sistema.
--   Cada tienda recibe al menos 7 promociones con combinación de tipos:
--     - porcentaje : descuento % sobre el precio
--     - fijo       : descuento en COP
--     - especial   : 2×1
--   Las fechas mezclan estados: activa (vigente), próxima (futura) y vencida.
--   La migración es IDEMPOTENTE: usa NOT EXISTS para no duplicar si ya existe.
-- =============================================================================

USE bookyhome;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOQUE 1: Tiendas del seed "rico" (migraciones 015 / bookyhome.sql)
--           Tiendas: Librería El Sótano, Página Trece, El Rincón Literario,
--                    Libros Usados Medellín, Universo de Tinta,
--                    Tienda Test Pausada
-- Estas tiendas ya tenían algunas ofertas en el seed base; aquí las
-- completamos hasta 7+ sin repetir nombres.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Librería El Sótano (ya tiene: Black Friday Literario, Descuento Clásicos,
--    Bono Universitario, Navidad Anticipada) → añadimos 4 más → total 8
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Día del Libro Sótano'       AS nombre_oferta, 'porcentaje' AS tipo_descuento, 12.00  AS valor_descuento, '2026-04-23 00:00:00' AS fecha_inicio, '2026-04-23 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Promo Fin de Año Sótano',            'fijo',       10000.00, '2026-12-26 00:00:00', '2026-12-31 23:59:59'
    UNION ALL SELECT 'Liquidación Clásicos 2026',          'porcentaje',  35.00,   '2026-02-01 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT 'Sótano 2×1 Terror',                  'especial',     0.00,   '2026-10-25 00:00:00', '2026-10-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Librería El Sótano';

-- ── Página Trece (ya tiene: Mes de la Ciencia Ficción, Especial Fantasía Juvenil)
--    → añadimos 5 más → total 7
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Terror & Suspense Página Trece'  AS nombre_oferta, 'porcentaje' AS tipo_descuento, 18.00 AS valor_descuento, '2026-10-01 00:00:00' AS fecha_inicio, '2026-10-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Semana Romántica PT',                     'fijo',       6000.00, '2026-02-14 00:00:00', '2026-02-21 23:59:59'
    UNION ALL SELECT 'Promo Verano PT',                         'porcentaje',  10.00,  '2026-07-15 00:00:00', '2026-08-15 23:59:59'
    UNION ALL SELECT 'Histórico PT 2×1',                        'especial',     0.00,  '2026-08-20 00:00:00', '2026-08-27 23:59:59'
    UNION ALL SELECT 'Descuento Madrugadores PT',               'fijo',       4000.00, '2026-01-02 00:00:00', '2026-01-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Página Trece';

-- ── El Rincón Literario (ya tiene: Semana del Arte, Descuento Biografías, Feria del Libro Local)
--    → añadimos 4 más → total 7
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Noche de Poesía Rincón'   AS nombre_oferta, 'porcentaje' AS tipo_descuento, 20.00 AS valor_descuento, '2026-06-01 00:00:00' AS fecha_inicio, '2026-06-07 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Filosofía con Descuento',          'fijo',       7500.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Clásicos del Rincón 2×1',          'especial',    0.00,   '2026-11-01 00:00:00', '2026-11-15 23:59:59'
    UNION ALL SELECT 'Promo Regreso a Clases Rincón',    'porcentaje',  15.00,  '2026-01-15 00:00:00', '2026-02-28 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'El Rincón Literario';

-- ── Libros Usados Medellín (ya tiene: Liquidación de Joyas Ocultas, Bono Lector Frecuente)
--    → añadimos 5 más → total 7
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Clásicos de Segunda LUM'    AS nombre_oferta, 'porcentaje' AS tipo_descuento, 30.00 AS valor_descuento, '2026-03-01 00:00:00' AS fecha_inicio, '2026-03-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Feria del Libro Usado',              'fijo',       3000.00, '2026-04-15 00:00:00', '2026-04-30 23:59:59'
    UNION ALL SELECT 'Remate Fin de Inventario',           'porcentaje',  50.00,  '2026-05-20 00:00:00', '2026-05-25 23:59:59'
    UNION ALL SELECT '2×1 Novelas LUM',                   'especial',     0.00,  '2026-07-10 00:00:00', '2026-07-20 23:59:59'
    UNION ALL SELECT 'Descuento Navideño LUM',             'fijo',       5000.00, '2026-12-20 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Libros Usados Medellín';

-- ── Universo de Tinta (ya tiene: Otaku Day, Semana de la Novela Gráfica, Promo Orgullo Geek)
--    → añadimos 4 más → total 7
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Combo Shōnen Universo'     AS nombre_oferta, 'especial' AS tipo_descuento, 0.00  AS valor_descuento, '2026-08-01 00:00:00' AS fecha_inicio, '2026-08-15 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Descuento Manhwa',                  'porcentaje', 15.00,  '2026-03-15 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT 'Semana Isekai Universo',             'fijo',      6000.00, '2026-11-10 00:00:00', '2026-11-17 23:59:59'
    UNION ALL SELECT 'Black Friday Geek',                  'porcentaje', 25.00,  '2026-11-27 00:00:00', '2026-11-30 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Universo de Tinta';

-- ── Tienda Test Pausada (ya tiene: Oferta Expirada de Prueba)
--    → añadimos 6 más → total 7
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Prueba Porcentaje 10%'    AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2025-01-01 00:00:00' AS fecha_inicio, '2025-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Prueba Descuento Fijo',             'fijo',      5000.00, '2025-02-01 00:00:00', '2025-02-28 23:59:59'
    UNION ALL SELECT 'Prueba 2×1',                        'especial',    0.00,  '2025-03-01 00:00:00', '2025-03-31 23:59:59'
    UNION ALL SELECT 'Prueba Porcentaje 20%',             'porcentaje', 20.00,  '2025-04-01 00:00:00', '2025-04-30 23:59:59'
    UNION ALL SELECT 'Prueba Fijo 8000',                  'fijo',      8000.00, '2025-05-01 00:00:00', '2025-05-31 23:59:59'
    UNION ALL SELECT 'Prueba 30% Final',                  'porcentaje', 30.00,  '2025-06-01 00:00:00', '2025-06-30 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Tienda Test Pausada';

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOQUE 2: Tiendas de la migración 024 (Bogotá, Medellín, Cali, Costa, etc.)
--           Cada una recibe exactamente 7 ofertas con variedad de tipo y fecha.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Librería Nacional
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Gran Feria Nacional'           AS nombre_oferta, 'porcentaje' AS tipo_descuento, 20.00  AS valor_descuento, '2026-04-23 00:00:00' AS fecha_inicio, '2026-04-30 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Clásicos con Descuento',               'fijo',       8000.00, '2026-05-01 00:00:00', '2026-05-31 23:59:59'
    UNION ALL SELECT 'Bienvenida Lectores',                   'porcentaje', 10.00,  '2026-01-02 00:00:00', '2026-01-31 23:59:59'
    UNION ALL SELECT 'Promo 2×1 Literatura',                  'especial',    0.00,  '2026-03-01 00:00:00', '2026-03-15 23:59:59'
    UNION ALL SELECT 'Black Friday Nacional',                  'porcentaje', 25.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Lectora',                        'fijo',      12000.00, '2026-12-10 00:00:00', '2026-12-24 23:59:59'
    UNION ALL SELECT 'Oferta Regreso a Clases Nacional',       'porcentaje', 15.00,  '2026-07-15 00:00:00', '2026-08-15 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Librería Nacional';

-- ── Panamericana
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Promo Escolar Panamericana'  AS nombre_oferta, 'porcentaje' AS tipo_descuento, 15.00 AS valor_descuento, '2026-01-10 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT '2×1 Infantil Pana',                  'especial',    0.00,  '2026-06-01 00:00:00', '2026-06-15 23:59:59'
    UNION ALL SELECT 'Feria del Libro Pana',                'porcentaje', 20.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Descuento Madrugadores Pana',         'fijo',      5000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Black Friday Panamericana',            'porcentaje', 30.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Pana',                         'fijo',      9000.00, '2026-12-15 00:00:00', '2026-12-24 23:59:59'
    UNION ALL SELECT 'Semana de la Ciencia Pana',            'porcentaje', 12.00,  '2026-10-15 00:00:00', '2026-10-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Panamericana';

-- ── Norma Libros
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Lanzamiento Norma 2026'     AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-15 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Colección Norma Premium',             'fijo',      10000.00, '2026-03-01 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT '2×1 Novela Gráfica Norma',            'especial',    0.00,  '2026-05-01 00:00:00', '2026-05-15 23:59:59'
    UNION ALL SELECT 'Promo Norma Universitaria',            'porcentaje', 18.00,  '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Norma Literaria Septiembre',           'fijo',       7000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Black Friday Norma',                   'porcentaje', 22.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad con Norma',                    'fijo',       8000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Norma Libros';

-- ── Librería Lerner
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Apertura Lerner 2026'       AS nombre_oferta, 'porcentaje' AS tipo_descuento, 12.00 AS valor_descuento, '2026-01-02 00:00:00' AS fecha_inicio, '2026-01-15 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Clásicos Lerner',                    'fijo',       6000.00, '2026-03-15 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT 'Feria Lerner Abril',                  'porcentaje', 20.00,  '2026-04-15 00:00:00', '2026-05-01 23:59:59'
    UNION ALL SELECT '2×1 Historia Lerner',                 'especial',    0.00,  '2026-06-01 00:00:00', '2026-06-10 23:59:59'
    UNION ALL SELECT 'Promo Verano Lerner',                 'fijo',       5000.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Lerner Otoño Literario',              'porcentaje', 15.00,  '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Black Friday Lerner',                 'porcentaje', 28.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Librería Lerner';

-- ── Bibliobog
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Bienvenida Bibliobog'        AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-10 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT '2×1 Ciencia Biblio',                  'especial',   0.00,   '2026-02-15 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT 'Semana del Libro Biblio',              'fijo',      4500.00, '2026-04-23 00:00:00', '2026-04-30 23:59:59'
    UNION ALL SELECT 'Promo Universitaria Biblio',           'porcentaje', 15.00,  '2026-06-01 00:00:00', '2026-06-30 23:59:59'
    UNION ALL SELECT 'Agosto Lector Biblio',                 'fijo',      6000.00, '2026-08-01 00:00:00', '2026-08-31 23:59:59'
    UNION ALL SELECT 'Promo Halloween Biblio',               'porcentaje', 18.00,  '2026-10-25 00:00:00', '2026-10-31 23:59:59'
    UNION ALL SELECT 'Biblio Fin de Año',                    'porcentaje', 25.00,  '2026-12-26 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Bibliobog';

-- ── Tinta Fresca
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Estreno Tinta Fresca'        AS nombre_oferta, 'porcentaje' AS tipo_descuento, 12.00 AS valor_descuento, '2026-01-05 00:00:00' AS fecha_inicio, '2026-01-20 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Romance de Febrero TF',               'fijo',       5000.00, '2026-02-10 00:00:00', '2026-02-14 23:59:59'
    UNION ALL SELECT '2×1 Poesía Tinta',                    'especial',    0.00,  '2026-03-21 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT 'Promo Primavera TF',                  'porcentaje',  15.00,  '2026-05-01 00:00:00', '2026-05-31 23:59:59'
    UNION ALL SELECT 'Verano de Lecturas TF',               'fijo',       7000.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Tinta Fresca Literaria Oct',          'porcentaje',  20.00,  '2026-10-01 00:00:00', '2026-10-31 23:59:59'
    UNION ALL SELECT 'Cierre de Año TF',                    'porcentaje',  22.00,  '2026-12-20 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Tinta Fresca';

-- ── El Péndulo
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Péndulo Enero Lector'       AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-08 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT '2×1 Ensayo Péndulo',                  'especial',   0.00,   '2026-03-01 00:00:00', '2026-03-15 23:59:59'
    UNION ALL SELECT 'Feria del Libro Péndulo',              'porcentaje', 20.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Promo Mitad de Año Péndulo',           'fijo',      6500.00, '2026-06-15 00:00:00', '2026-06-30 23:59:59'
    UNION ALL SELECT 'Péndulo Terror Halloween',             'porcentaje', 25.00,  '2026-10-25 00:00:00', '2026-10-31 23:59:59'
    UNION ALL SELECT 'Black Friday Péndulo',                 'porcentaje', 30.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Cierre Péndulo 2026',                  'fijo',       8000.00, '2026-12-28 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'El Péndulo';

-- ── Libros y Letras
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Letras de Enero'             AS nombre_oferta, 'porcentaje' AS tipo_descuento, 12.00 AS valor_descuento, '2026-01-15 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Poesía con Descuento LL',             'fijo',       4000.00, '2026-03-21 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT '2×1 Narrativa LL',                    'especial',    0.00,  '2026-05-01 00:00:00', '2026-05-15 23:59:59'
    UNION ALL SELECT 'Promo Vacaciones LL',                 'porcentaje', 16.00,  '2026-06-15 00:00:00', '2026-07-15 23:59:59'
    UNION ALL SELECT 'Agosto Literario LL',                 'fijo',       5500.00, '2026-08-01 00:00:00', '2026-08-31 23:59:59'
    UNION ALL SELECT 'Día del Idioma LL',                   'porcentaje', 23.00,  '2026-04-23 00:00:00', '2026-04-23 23:59:59'
    UNION ALL SELECT 'Navidad Libros y Letras',             'fijo',       9000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Libros y Letras';

-- ── Mundo del Libro
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Mundo Lector Enero'          AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-02 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Colección Mundo Premium',             'fijo',       7000.00, '2026-03-01 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT '2×1 Manga Mundo',                     'especial',    0.00,  '2026-04-01 00:00:00', '2026-04-15 23:59:59'
    UNION ALL SELECT 'Promo Verano Mundo',                  'porcentaje', 18.00,  '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Mundo Septiembre Lector',             'fijo',       6000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Mundo Halloween Lector',              'porcentaje', 20.00,  '2026-10-25 00:00:00', '2026-10-31 23:59:59'
    UNION ALL SELECT 'Cierre Mundo 2026',                   'porcentaje', 27.00,  '2026-12-26 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Mundo del Libro';

-- ── Literatura al Paso
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Al Paso Enero Literario'    AS nombre_oferta, 'porcentaje' AS tipo_descuento, 11.00 AS valor_descuento, '2026-01-10 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Románticos al Paso',                 'fijo',       4500.00, '2026-02-10 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT '2×1 Ciencia al Paso',                'especial',    0.00,  '2026-05-01 00:00:00', '2026-05-15 23:59:59'
    UNION ALL SELECT 'Verano al Paso',                     'porcentaje', 14.00,  '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Septiembre con Descuento AP',        'fijo',       5000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Feria al Paso',                      'porcentaje', 19.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Cierre Literatura al Paso',          'porcentaje', 24.00,  '2026-12-26 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Literatura al Paso';

-- ── Wilborada (Medellín)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Wilborada Año Nuevo Lector' AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-02 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Poesía Wilborada',                   'fijo',       4000.00, '2026-03-21 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT '2×1 Historia Wilborada',             'especial',    0.00,  '2026-05-01 00:00:00', '2026-05-15 23:59:59'
    UNION ALL SELECT 'Feria Libro Medellín W',             'porcentaje', 20.00,  '2026-06-01 00:00:00', '2026-06-15 23:59:59'
    UNION ALL SELECT 'Promo Vacaciones Wilborada',         'fijo',       6000.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Black Friday Wilborada',             'porcentaje', 28.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Wilborada',                  'fijo',       9500.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Wilborada';

-- ── Salvo Conducto
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Salvo Conducto Enero'       AS nombre_oferta, 'porcentaje' AS tipo_descuento, 12.00 AS valor_descuento, '2026-01-10 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Romance Salvo',                      'fijo',       5000.00, '2026-02-10 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT '2×1 Poesía Salvo',                   'especial',    0.00,  '2026-03-21 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT 'Feria Salvo Conducto',               'porcentaje', 18.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Descuento Mitad Año SC',             'fijo',       6000.00, '2026-06-15 00:00:00', '2026-06-30 23:59:59'
    UNION ALL SELECT 'Black Friday SC',                    'porcentaje', 25.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Salvo Conducto',             'fijo',       8000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Salvo Conducto';

-- ── Otra Parte
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Otra Parte Enero'           AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-05 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Día Internacional Libro OP',         'porcentaje', 23.00,  '2026-04-23 00:00:00', '2026-04-23 23:59:59'
    UNION ALL SELECT '2×1 Filosofía OP',                   'especial',    0.00,  '2026-05-15 00:00:00', '2026-05-31 23:59:59'
    UNION ALL SELECT 'Vacaciones OP',                      'fijo',       5500.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Septiembre Lector OP',               'porcentaje', 17.00,  '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Black Friday Otra Parte',            'porcentaje', 28.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Cierre OP 2026',                     'fijo',       7000.00, '2026-12-26 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Otra Parte';

-- ── El Greco (Medellín)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'El Greco Enero Clásico'     AS nombre_oferta, 'porcentaje' AS tipo_descuento, 13.00 AS valor_descuento, '2026-01-08 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Descuento Arte Greco',               'fijo',       6000.00, '2026-02-01 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT '2×1 Arte Moderno Greco',             'especial',    0.00,  '2026-04-01 00:00:00', '2026-04-15 23:59:59'
    UNION ALL SELECT 'Promo Feria Libro Greco',            'porcentaje', 20.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Vacaciones Greco',                   'fijo',       5000.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Otoño Literario Greco',              'porcentaje', 15.00,  '2026-09-15 00:00:00', '2026-10-15 23:59:59'
    UNION ALL SELECT 'Navidad Greco',                      'fijo',       8500.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'El Greco';

-- ── Novena Arte
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Novena Arte Enero'          AS nombre_oferta, 'porcentaje' AS tipo_descuento, 11.00 AS valor_descuento, '2026-01-12 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Arte y Cultura Novena',              'fijo',       5500.00, '2026-03-01 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT '2×1 Ilustrados Novena',              'especial',    0.00,  '2026-04-23 00:00:00', '2026-04-30 23:59:59'
    UNION ALL SELECT 'Verano Artístico Novena',            'porcentaje', 17.00,  '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Muestra Arte Novena',                'fijo',       7000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Promo Black Friday Novena',          'porcentaje', 25.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Novena Arte',                'fijo',       9000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Novena Arte';

-- ── Librería El Parque (Medellín)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'El Parque Lecturas 2026'    AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-10 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Amor por la Lectura EP',             'fijo',       5000.00, '2026-02-10 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT '2×1 Parque Lector',                  'especial',    0.00,  '2026-04-01 00:00:00', '2026-04-15 23:59:59'
    UNION ALL SELECT 'Feria El Parque',                    'porcentaje', 20.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Vacaciones El Parque',               'fijo',       6000.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Otoño El Parque',                    'porcentaje', 15.00,  '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Diciembre El Parque',                'fijo',       8000.00, '2026-12-15 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Librería El Parque';

-- ── Cervantes Libros (Cali)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Cervantes Año Nuevo'        AS nombre_oferta, 'porcentaje' AS tipo_descuento, 12.00 AS valor_descuento, '2026-01-07 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Cervantes San Valentín',             'fijo',       5000.00, '2026-02-10 00:00:00', '2026-02-14 23:59:59'
    UNION ALL SELECT '2×1 Cervantes Clásicos',             'especial',    0.00,  '2026-04-01 00:00:00', '2026-04-15 23:59:59'
    UNION ALL SELECT 'Feria Cali Lectora',                 'porcentaje', 20.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Promo Verano Cervantes',             'fijo',       7000.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Black Friday Cervantes',             'porcentaje', 27.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Cervantes Cali',             'fijo',       9000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Cervantes Libros';

-- ── El Callejón del Libro (Cali)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Callejón Lector Enero'      AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-10 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Amor al Libro Callejón',             'fijo',       4000.00, '2026-02-10 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT '2×1 Suspenso Callejón',              'especial',    0.00,  '2026-03-15 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT 'Promo Semana del Libro CL',          'porcentaje', 23.00,  '2026-04-23 00:00:00', '2026-04-30 23:59:59'
    UNION ALL SELECT 'Vacaciones Callejón',                'fijo',       5500.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Otoño Callejón Lector',              'porcentaje', 16.00,  '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Navidad Callejón',                   'porcentaje', 22.00,  '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'El Callejón del Libro';

-- ── Tertulia (Cali)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Tertulia Lectora Enero'     AS nombre_oferta, 'porcentaje' AS tipo_descuento, 11.00 AS valor_descuento, '2026-01-08 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Tertulia Romántica Feb',             'fijo',       5000.00, '2026-02-10 00:00:00', '2026-02-28 23:59:59'
    UNION ALL SELECT '2×1 Tertulia Poesía',                'especial',    0.00,  '2026-03-21 00:00:00', '2026-03-31 23:59:59'
    UNION ALL SELECT 'Tertulia Feria Libro',               'porcentaje', 20.00,  '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT 'Promo Verano Tertulia',              'fijo',       6500.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Black Friday Tertulia',              'porcentaje', 27.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Tertulia Cali',              'fijo',       8000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Tertulia';

-- ── Macondo Libros (Cartagena)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Macondo Semana del Libro'   AS nombre_oferta, 'porcentaje' AS tipo_descuento, 15.00 AS valor_descuento, '2026-04-23 00:00:00' AS fecha_inicio, '2026-04-30 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Caribe Lector Macondo',              'fijo',       5000.00, '2026-06-01 00:00:00', '2026-06-30 23:59:59'
    UNION ALL SELECT '2×1 García Márquez Macondo',         'especial',    0.00,  '2026-03-06 00:00:00', '2026-03-20 23:59:59'
    UNION ALL SELECT 'Promo Verano Caribe',                'porcentaje', 18.00,  '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Feria Cartagena Lectora',            'fijo',       7000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Black Friday Macondo',               'porcentaje', 25.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad en Macondo',                 'fijo',       9000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Macondo Libros';

-- ── Librería UIS (Bucaramanga)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'UIS Primer Semestre'        AS nombre_oferta, 'porcentaje' AS tipo_descuento, 12.00 AS valor_descuento, '2026-01-15 00:00:00' AS fecha_inicio, '2026-02-15 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Promo Grado UIS',                    'fijo',       8000.00, '2026-05-01 00:00:00', '2026-05-31 23:59:59'
    UNION ALL SELECT '2×1 Ciencias UIS',                   'especial',    0.00,  '2026-04-01 00:00:00', '2026-04-15 23:59:59'
    UNION ALL SELECT 'UIS Segundo Semestre',               'porcentaje', 15.00,  '2026-07-15 00:00:00', '2026-08-15 23:59:59'
    UNION ALL SELECT 'UIS Ingeniería Lectora',             'fijo',       6000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Black Friday UIS',                   'porcentaje', 22.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Cierre Académico UIS',               'fijo',       9000.00, '2026-12-01 00:00:00', '2026-12-15 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Librería UIS';

-- ── Eje Cafetero Libros (Pereira)
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT t.id_tienda, o.nombre_oferta, o.tipo_descuento, o.valor_descuento, o.fecha_inicio, o.fecha_fin
FROM tiendas t
JOIN (
    SELECT 'Café y Lectura Enero'       AS nombre_oferta, 'porcentaje' AS tipo_descuento, 10.00 AS valor_descuento, '2026-01-10 00:00:00' AS fecha_inicio, '2026-01-31 23:59:59' AS fecha_fin
    UNION ALL SELECT 'Feria Cafetero Lector',              'fijo',       5000.00, '2026-04-20 00:00:00', '2026-05-05 23:59:59'
    UNION ALL SELECT '2×1 Café & Libro ECL',               'especial',    0.00,  '2026-06-01 00:00:00', '2026-06-15 23:59:59'
    UNION ALL SELECT 'Promo Cosecha ECL',                  'porcentaje', 18.00,  '2026-07-01 00:00:00', '2026-07-31 23:59:59'
    UNION ALL SELECT 'Lecturas del Eje Sep',               'fijo',       6000.00, '2026-09-01 00:00:00', '2026-09-30 23:59:59'
    UNION ALL SELECT 'Black Friday Eje Cafetero',          'porcentaje', 25.00,  '2026-11-20 00:00:00', '2026-11-27 23:59:59'
    UNION ALL SELECT 'Navidad Cafetero',                   'fijo',       8000.00, '2026-12-18 00:00:00', '2026-12-31 23:59:59'
) AS o ON NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda = t.id_tienda AND x.nombre_oferta = o.nombre_oferta
)
WHERE t.nombre_tienda = 'Eje Cafetero Libros';

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOQUE 3: Tiendas generadas (Librería Faltante 001–075)
--           Usamos una sola instrucción dinámica que genera 7 ofertas por tienda
--           basadas en el id_tienda (MOD aritmético para variar tipo y valor).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT
    t.id_tienda,
    CONCAT(seq.oferta_nombre, ' - ', t.nombre_tienda)       AS nombre_oferta,
    seq.tipo_descuento,
    CASE seq.tipo_descuento
        WHEN 'porcentaje' THEN ROUND(10 + MOD(t.id_tienda + seq.seq_n, 25), 0)
        WHEN 'fijo'       THEN ROUND(3000 + MOD(t.id_tienda * seq.seq_n, 9000), -3)
        ELSE 0
    END AS valor_descuento,
    DATE_ADD('2026-01-01', INTERVAL (seq.mes_inicio - 1) MONTH) AS fecha_inicio,
    DATE_ADD('2026-01-01', INTERVAL seq.mes_fin          MONTH) - INTERVAL 1 SECOND AS fecha_fin
FROM tiendas t
JOIN (
    SELECT 1 AS seq_n, 'Promo Enero'             AS oferta_nombre, 'porcentaje' AS tipo_descuento, 1  AS mes_inicio, 2  AS mes_fin
    UNION ALL SELECT 2, 'Descuento Especial Feb', 'fijo',       2,  3
    UNION ALL SELECT 3, 'Feria del Libro',        'porcentaje', 4,  5
    UNION ALL SELECT 4, 'Promo 2x1 Verano',       'especial',   6,  7
    UNION ALL SELECT 5, 'Descuento Agosto',       'fijo',       8,  9
    UNION ALL SELECT 6, 'Black Friday',           'porcentaje', 11, 12
    UNION ALL SELECT 7, 'Navidad Lectora',        'fijo',       12, 13
) AS seq
WHERE t.nombre_tienda LIKE 'Librería Faltante %'
  AND NOT EXISTS (
    SELECT 1 FROM ofertas x
    WHERE x.id_tienda    = t.id_tienda
      AND x.nombre_oferta = CONCAT(seq.oferta_nombre, ' - ', t.nombre_tienda)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOQUE 4: Tiendas restantes de la migración 024 que no están cubiertas
--           arriba (Punto Libro, Libros al Día, Casa Lectora, Teseo,
--           Papel y Tinta, Librolandia, San Bosco, Lectura Continua,
--           Bibliofilia Sur, Librería Atlántico, Caribe Libros, Portal del Saber,
--           Bocagrande Libros, Santa Marta Mar, Leamos Santander, El Refugio,
--           Café y Libros, Quindío Lectura, etc.)
--           Se usa un INSERT masivo genérico igual al bloque 3 pero para los
--           nombres que NO están en los bloques anteriores y NO son "Faltante".
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
SELECT
    t.id_tienda,
    CONCAT(seq.oferta_nombre, ' - ', t.nombre_tienda)  AS nombre_oferta,
    seq.tipo_descuento,
    CASE seq.tipo_descuento
        WHEN 'porcentaje' THEN ROUND(10 + MOD(t.id_tienda + seq.seq_n, 25), 0)
        WHEN 'fijo'       THEN ROUND(3000 + MOD(t.id_tienda * seq.seq_n, 9000), -3)
        ELSE 0
    END AS valor_descuento,
    DATE_ADD('2026-01-01', INTERVAL (seq.mes_inicio - 1) MONTH) AS fecha_inicio,
    DATE_ADD('2026-01-01', INTERVAL seq.mes_fin          MONTH) - INTERVAL 1 SECOND AS fecha_fin
FROM tiendas t
JOIN (
    SELECT 1 AS seq_n, 'Promo Enero'             AS oferta_nombre, 'porcentaje' AS tipo_descuento, 1  AS mes_inicio, 2  AS mes_fin
    UNION ALL SELECT 2, 'Descuento Especial Feb', 'fijo',       2,  3
    UNION ALL SELECT 3, 'Feria del Libro',        'porcentaje', 4,  5
    UNION ALL SELECT 4, 'Promo 2x1 Verano',       'especial',   6,  7
    UNION ALL SELECT 5, 'Descuento Agosto',       'fijo',       8,  9
    UNION ALL SELECT 6, 'Black Friday',           'porcentaje', 11, 12
    UNION ALL SELECT 7, 'Navidad Lectora',        'fijo',       12, 13
) AS seq
WHERE
    -- excluir las tiendas ya cubiertas en los bloques 1, 2 y 3
    t.nombre_tienda NOT IN (
        'Librería El Sótano', 'Página Trece', 'El Rincón Literario',
        'Libros Usados Medellín', 'Universo de Tinta', 'Tienda Test Pausada',
        'Librería Nacional', 'Panamericana', 'Norma Libros', 'Librería Lerner',
        'Bibliobog', 'Tinta Fresca', 'El Péndulo', 'Libros y Letras',
        'Mundo del Libro', 'Literatura al Paso', 'Wilborada', 'Salvo Conducto',
        'Otra Parte', 'El Greco', 'Novena Arte', 'Librería El Parque',
        'Cervantes Libros', 'El Callejón del Libro', 'Tertulia',
        'Macondo Libros', 'Librería UIS', 'Eje Cafetero Libros'
    )
    AND t.nombre_tienda NOT LIKE 'Librería Faltante %'
    AND NOT EXISTS (
        SELECT 1 FROM ofertas x
        WHERE x.id_tienda    = t.id_tienda
          AND x.nombre_oferta = CONCAT(seq.oferta_nombre, ' - ', t.nombre_tienda)
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────────────────────────────────────
SELECT '✅ 039 - Promociones insertadas' AS resultado;

SELECT
    t.nombre_tienda,
    COUNT(o.id_oferta) AS total_ofertas
FROM tiendas t
LEFT JOIN ofertas o ON o.id_tienda = t.id_tienda
GROUP BY t.id_tienda, t.nombre_tienda
ORDER BY total_ofertas ASC, t.nombre_tienda
LIMIT 30;

SELECT
    COUNT(DISTINCT o.id_tienda)               AS tiendas_con_ofertas,
    COUNT(o.id_oferta)                        AS total_ofertas,
    MIN(cnt.c)                                AS min_ofertas_por_tienda,
    MAX(cnt.c)                                AS max_ofertas_por_tienda,
    ROUND(AVG(cnt.c), 1)                      AS promedio_ofertas
FROM ofertas o
JOIN (
    SELECT id_tienda, COUNT(*) AS c FROM ofertas GROUP BY id_tienda
) cnt ON cnt.id_tienda = o.id_tienda;
