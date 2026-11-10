-- Crea impulsos activos y variados para las tiendas.
-- Cada tienda recibe entre 2 y 4 impulsos de distintos tipos,
-- con fechas activas, impresiones/clics realistas y pago registrado.

USE bookyhome;

-- Limpiar impulsos existentes expirados (los del seed anterior)
DELETE FROM pagos_impulsos WHERE id_impulso IN (
    SELECT id_impulso FROM impulsos_contratados WHERE estado = 'Activo' 
    AND fecha_fin < NOW()
);
DELETE FROM impulsos_contratados WHERE estado = 'Activo' AND fecha_fin < NOW();

-- ── Tipo 5: Libro destacado en Home (7 dias, $25000) ─────────────────────────
-- Todas las tiendas reciben este impulso activo
INSERT INTO impulsos_contratados
    (id_tienda, id_tipo_impulso, id_libro, fecha_inicio, fecha_fin,
     monto_pagado, estado, impresiones, clics, ventas_generadas)
SELECT
    t.id_tienda,
    5,
    (SELECT l.id_libro FROM libros l WHERE l.id_tienda = t.id_tienda AND l.stock > 0 ORDER BY l.id_libro LIMIT 1),
    DATE_SUB(NOW(), INTERVAL MOD(t.id_tienda, 5) DAY),
    DATE_ADD(DATE_SUB(NOW(), INTERVAL MOD(t.id_tienda, 5) DAY), INTERVAL 7 DAY),
    25000.00,
    'Activo',
    MOD(t.id_tienda * 137, 800) + 200,
    MOD(t.id_tienda * 53, 120) + 20,
    MOD(t.id_tienda * 17, 15) + 1
FROM tiendas t
WHERE EXISTS (SELECT 1 FROM libros l WHERE l.id_tienda = t.id_tienda AND l.stock > 0);

-- ── Tipo 6: Banner en categoria (5 dias, $18000) ─────────────────────────────
-- Tiendas pares
INSERT INTO impulsos_contratados
    (id_tienda, id_tipo_impulso, id_categoria, fecha_inicio, fecha_fin,
     monto_pagado, estado, impresiones, clics, ventas_generadas)
SELECT
    t.id_tienda,
    6,
    (SELECT l.id_categoria FROM libros l WHERE l.id_tienda = t.id_tienda AND l.id_categoria IS NOT NULL LIMIT 1),
    DATE_SUB(NOW(), INTERVAL MOD(t.id_tienda, 3) DAY),
    DATE_ADD(DATE_SUB(NOW(), INTERVAL MOD(t.id_tienda, 3) DAY), INTERVAL 5 DAY),
    18000.00,
    'Activo',
    MOD(t.id_tienda * 89, 500) + 100,
    MOD(t.id_tienda * 41, 80) + 10,
    MOD(t.id_tienda * 13, 10) + 1
FROM tiendas t
WHERE MOD(t.id_tienda, 2) = 0
  AND EXISTS (SELECT 1 FROM libros l WHERE l.id_tienda = t.id_tienda AND l.id_categoria IS NOT NULL);

-- ── Tipo 7: Libro del Dia (1 dia, $35000) ────────────────────────────────────
-- Tiendas multiplos de 3
INSERT INTO impulsos_contratados
    (id_tienda, id_tipo_impulso, id_libro, fecha_inicio, fecha_fin,
     monto_pagado, estado, impresiones, clics, ventas_generadas)
SELECT
    t.id_tienda,
    7,
    (SELECT l.id_libro FROM libros l WHERE l.id_tienda = t.id_tienda AND l.stock > 0 ORDER BY l.precio_libro DESC LIMIT 1),
    DATE_SUB(NOW(), INTERVAL 0 DAY),
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    35000.00,
    'Activo',
    MOD(t.id_tienda * 211, 1200) + 300,
    MOD(t.id_tienda * 73, 200) + 40,
    MOD(t.id_tienda * 29, 25) + 2
FROM tiendas t
WHERE MOD(t.id_tienda, 3) = 0
  AND EXISTS (SELECT 1 FROM libros l WHERE l.id_tienda = t.id_tienda AND l.stock > 0);

-- ── Tipo 8: Email a suscriptores (1 dia, $22000) ─────────────────────────────
-- Tiendas impares multiplos de 5
INSERT INTO impulsos_contratados
    (id_tienda, id_tipo_impulso, id_libro, fecha_inicio, fecha_fin,
     monto_pagado, estado, impresiones, clics, ventas_generadas)
SELECT
    t.id_tienda,
    8,
    (SELECT l.id_libro FROM libros l WHERE l.id_tienda = t.id_tienda AND l.stock > 0 ORDER BY l.id_libro DESC LIMIT 1),
    DATE_SUB(NOW(), INTERVAL 0 DAY),
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    22000.00,
    'Activo',
    MOD(t.id_tienda * 167, 2000) + 500,
    MOD(t.id_tienda * 61, 300) + 60,
    MOD(t.id_tienda * 23, 30) + 3
FROM tiendas t
WHERE MOD(t.id_tienda, 5) = 1
  AND EXISTS (SELECT 1 FROM libros l WHERE l.id_tienda = t.id_tienda AND l.stock > 0);

-- ── Registrar pagos para todos los impulsos nuevos ───────────────────────────
INSERT INTO pagos_impulsos (id_impulso, metodo_pago, monto, referencia, estado_pago, fecha_pago)
SELECT
    ic.id_impulso,
    CASE MOD(ic.id_tienda, 3)
        WHEN 0 THEN 'Tarjeta'
        WHEN 1 THEN 'Nequi'
        ELSE 'Transferencia'
    END,
    ic.monto_pagado,
    CONCAT('BKH-IMP-', LPAD(ic.id_impulso, 8, '0')),
    'Aprobado',
    ic.fecha_inicio
FROM impulsos_contratados ic
WHERE NOT EXISTS (
    SELECT 1 FROM pagos_impulsos pi WHERE pi.id_impulso = ic.id_impulso
);

-- ── Verificacion ──────────────────────────────────────────────────────────────
SELECT 'Impulsos activos por tipo:' AS info;
SELECT ti.nombre, COUNT(*) as tiendas, SUM(ic.impresiones) as total_impresiones, SUM(ic.clics) as total_clics
FROM impulsos_contratados ic
JOIN tipos_impulso ti ON ti.id_tipo_impulso = ic.id_tipo_impulso
WHERE ic.estado = 'Activo'
GROUP BY ti.id_tipo_impulso, ti.nombre
ORDER BY ti.id_tipo_impulso;

SELECT 'Tiendas con al menos 1 impulso activo:' AS info;
SELECT COUNT(DISTINCT id_tienda) as tiendas FROM impulsos_contratados WHERE estado = 'Activo';

SELECT '081 - Impulsos activos y variados asignados a tiendas' AS resultado;
