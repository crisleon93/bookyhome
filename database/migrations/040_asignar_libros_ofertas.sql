-- =============================================================================
-- Migración 040: Asignar libros a las ofertas creadas en la migración 039
-- Fecha: 2026-09-10
-- Descripción:
--   Vincula libros a las nuevas ofertas en la tabla oferta_libros.
--   Para las tiendas del seed "rico" se hacen asignaciones nominadas por título.
--   Para todas las demás ofertas sin libros se usa una asignación dinámica
--   que toma los 3 primeros libros de la misma tienda (compatible MySQL 5.7+).
--
--   La migración es IDEMPOTENTE: usa INSERT IGNORE para respetar el
--   UNIQUE KEY uk_oferta_libro (id_oferta, id_libro).
-- =============================================================================

USE bookyhome;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOQUE 1: Asignaciones nominadas — tiendas del seed rico
--   Cada oferta queda vinculada a los libros que coinciden por título
--   dentro de la misma tienda. El producto cartesiano oferta × libro
--   es intencional (toda oferta del bloque cubre todos los títulos listados).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Librería El Sótano — 4 nuevas ofertas
INSERT IGNORE INTO oferta_libros (id_oferta, id_libro)
SELECT o.id_oferta, l.id_libro
FROM ofertas o
JOIN tiendas t ON t.id_tienda = o.id_tienda
JOIN libros  l ON l.id_tienda = t.id_tienda
WHERE t.nombre_tienda = 'Librería El Sótano'
  AND o.nombre_oferta IN (
      'Día del Libro Sótano',
      'Promo Fin de Año Sótano',
      'Liquidación Clásicos 2026',
      'Sótano 2×1 Terror'
  )
  AND l.titulo IN (
      'Cien años de soledad',
      '1984',
      'Sapiens: De animales a dioses',
      'El amor en los tiempos del cólera',
      'Crimen y castigo'
  );

-- ── Página Trece — 5 nuevas ofertas
INSERT IGNORE INTO oferta_libros (id_oferta, id_libro)
SELECT o.id_oferta, l.id_libro
FROM ofertas o
JOIN tiendas t ON t.id_tienda = o.id_tienda
JOIN libros  l ON l.id_tienda = t.id_tienda
WHERE t.nombre_tienda = 'Página Trece'
  AND o.nombre_oferta IN (
      'Terror & Suspense Página Trece',
      'Semana Romántica PT',
      'Promo Verano PT',
      'Histórico PT 2×1',
      'Descuento Madrugadores PT'
  )
  AND l.titulo IN (
      'Fahrenheit 451',
      'Un mundo feliz',
      'El Señor de los Anillos: La Comunidad del Anillo',
      'Harry Potter y la piedra filosofal',
      'El Hobbit'
  );

-- ── El Rincón Literario — 4 nuevas ofertas
INSERT IGNORE INTO oferta_libros (id_oferta, id_libro)
SELECT o.id_oferta, l.id_libro
FROM ofertas o
JOIN tiendas t ON t.id_tienda = o.id_tienda
JOIN libros  l ON l.id_tienda = t.id_tienda
WHERE t.nombre_tienda = 'El Rincón Literario'
  AND o.nombre_oferta IN (
      'Noche de Poesía Rincón',
      'Filosofía con Descuento',
      'Clásicos del Rincón 2×1',
      'Promo Regreso a Clases Rincón'
  )
  AND l.titulo IN (
      'El infinito en un junco',
      'Moderna de Pueblo: Idiotizadas',
      'Steve Jobs',
      'Frida Kahlo: Una biografía'
  );

-- ── Libros Usados Medellín — 5 nuevas ofertas
INSERT IGNORE INTO oferta_libros (id_oferta, id_libro)
SELECT o.id_oferta, l.id_libro
FROM ofertas o
JOIN tiendas t ON t.id_tienda = o.id_tienda
JOIN libros  l ON l.id_tienda = t.id_tienda
WHERE t.nombre_tienda = 'Libros Usados Medellín'
  AND o.nombre_oferta IN (
      'Clásicos de Segunda LUM',
      'Feria del Libro Usado',
      'Remate Fin de Inventario',
      '2×1 Novelas LUM',
      'Descuento Navideño LUM'
  )
  AND l.titulo IN (
      'El Resplandor',
      'Drácula',
      'Don Quijote de la Mancha'
  );

-- ── Universo de Tinta — 4 nuevas ofertas
INSERT IGNORE INTO oferta_libros (id_oferta, id_libro)
SELECT o.id_oferta, l.id_libro
FROM ofertas o
JOIN tiendas t ON t.id_tienda = o.id_tienda
JOIN libros  l ON l.id_tienda = t.id_tienda
WHERE t.nombre_tienda = 'Universo de Tinta'
  AND o.nombre_oferta IN (
      'Combo Shōnen Universo',
      'Descuento Manhwa',
      'Semana Isekai Universo',
      'Black Friday Geek'
  )
  AND l.titulo IN (
      'Kimetsu no Yaiba - Tomo 1',
      'Maus',
      'Heartstopper: Volumen 1'
  );

-- ── Tienda Test Pausada — 6 nuevas ofertas (cualquier libro disponible de la tienda)
INSERT IGNORE INTO oferta_libros (id_oferta, id_libro)
SELECT o.id_oferta, l.id_libro
FROM ofertas o
JOIN tiendas t ON t.id_tienda = o.id_tienda
JOIN libros  l ON l.id_tienda = t.id_tienda
WHERE t.nombre_tienda = 'Tienda Test Pausada'
  AND o.nombre_oferta IN (
      'Prueba Porcentaje 10%',
      'Prueba Descuento Fijo',
      'Prueba 2×1',
      'Prueba Porcentaje 20%',
      'Prueba Fijo 8000',
      'Prueba 30% Final'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOQUE 2: Asignación dinámica para TODAS las ofertas que todavía no tienen
--           ningún libro asignado en oferta_libros.
--
--   Técnica compatible con MySQL 5.7 y 8:
--   Usamos un JOIN entre la oferta (sin libros) y un subquery que selecciona
--   los 3 libros de menor id_libro de la misma tienda, usando una auto-join
--   de conteo (técnica clásica de "top-N por grupo" sin ventanas).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO oferta_libros (id_oferta, id_libro)
SELECT o.id_oferta, top3.id_libro
FROM ofertas o
-- Solo ofertas que aún no tienen ningún libro
JOIN (
    -- Top-3 libros por tienda: un libro l1 está en el top-3 si hay
    -- menos de 3 libros con id_libro <= l1.id_libro en la misma tienda.
    SELECT l1.id_tienda, l1.id_libro
    FROM libros l1
    WHERE (
        SELECT COUNT(*)
        FROM libros l2
        WHERE l2.id_tienda = l1.id_tienda
          AND l2.id_libro  <= l1.id_libro
    ) <= 3
) AS top3 ON top3.id_tienda = o.id_tienda
WHERE NOT EXISTS (
    SELECT 1
    FROM oferta_libros ol
    WHERE ol.id_oferta = o.id_oferta
);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ─────────────────────────────────────────────────────────────────────────────
SELECT '✅ 040 - Libros asignados a ofertas' AS resultado;

-- Ofertas que quedaron sin libros (tiendas sin ningún libro en el catálogo)
SELECT COUNT(*) AS ofertas_sin_libros
FROM ofertas o
WHERE NOT EXISTS (
    SELECT 1 FROM oferta_libros ol WHERE ol.id_oferta = o.id_oferta
);

-- Resumen por tienda
SELECT
    t.nombre_tienda,
    COUNT(DISTINCT o.id_oferta)  AS total_ofertas,
    COUNT(DISTINCT ol.id_libro)  AS libros_distintos_en_ofertas
FROM tiendas t
JOIN  ofertas      o  ON o.id_tienda  = t.id_tienda
LEFT JOIN oferta_libros ol ON ol.id_oferta = o.id_oferta
GROUP BY t.id_tienda, t.nombre_tienda
ORDER BY total_ofertas ASC
LIMIT 30;
