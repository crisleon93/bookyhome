-- Asigna planes pagos activos a 120 de las 151 tiendas.
-- Las 31 restantes se quedan en Gratuito.
-- Distribucion: ~40 Basico, ~40 Estandar, ~40 Premium
-- fecha_inicio: coherente con id_tienda dentro de 2026
-- fecha_fin: 1 anno despues (todas vigentes)

USE bookyhome;

SELECT 'Antes:' AS info;
SELECT ph.nombre_plan, COUNT(*) as tiendas
FROM suscripciones_herramientas sh
JOIN planes_herramientas ph ON ph.id_plan = sh.id_plan
WHERE sh.estado = 'Activa'
GROUP BY ph.nombre_plan;

-- Cancelar plan Gratuito de las 120 tiendas que van a recibir plan pago
-- Seleccionamos las primeras 120 por id_tienda (las mas establecidas)
UPDATE suscripciones_herramientas sh
JOIN (
    SELECT id_tienda
    FROM tiendas
    ORDER BY id_tienda
    LIMIT 120
) seleccionadas ON seleccionadas.id_tienda = sh.id_tienda
SET sh.estado = 'Cancelada'
WHERE sh.estado = 'Activa' AND sh.id_plan = 1;

-- Insertar suscripciones pagas activas para esas 120 tiendas
-- Plan segun distribucion: id % 3 = 0 -> Premium(4), id % 3 = 1 -> Estandar(3), id % 3 = 2 -> Basico(2)
INSERT INTO suscripciones_herramientas
    (id_tienda, id_plan, fecha_inicio, fecha_fin, estado, metodo_pago, monto_pagado, renovacion_automatica)
SELECT
    t.id_tienda,
    CASE
        WHEN MOD(t.id_tienda, 3) = 0 THEN 4  -- Premium
        WHEN MOD(t.id_tienda, 3) = 1 THEN 3  -- Estandar
        ELSE 2                                 -- Basico
    END AS id_plan,
    -- fecha_inicio distribuida en 2026 segun ranking del id
    DATE_ADD('2026-01-01', INTERVAL MOD(t.id_tienda * 3, 300) DAY) AS fecha_inicio,
    -- fecha_fin = 1 anno despues
    DATE_ADD(DATE_ADD('2026-01-01', INTERVAL MOD(t.id_tienda * 3, 300) DAY), INTERVAL 1 YEAR) AS fecha_fin,
    'Activa',
    CASE MOD(t.id_tienda, 3)
        WHEN 0 THEN 'Tarjeta'
        WHEN 1 THEN 'Transferencia'
        ELSE 'Nequi'
    END,
    CASE
        WHEN MOD(t.id_tienda, 3) = 0 THEN 49000.00
        WHEN MOD(t.id_tienda, 3) = 1 THEN 29000.00
        ELSE 15000.00
    END,
    1  -- renovacion automatica activa
FROM tiendas t
ORDER BY t.id_tienda
LIMIT 120;

SELECT 'Despues:' AS info;
SELECT ph.nombre_plan, COUNT(*) as tiendas
FROM suscripciones_herramientas sh
JOIN planes_herramientas ph ON ph.id_plan = sh.id_plan
WHERE sh.estado = 'Activa'
GROUP BY ph.nombre_plan
ORDER BY ph.id_plan;

SELECT 'Total tiendas con plan activo:' AS info;
SELECT COUNT(DISTINCT id_tienda) as total FROM suscripciones_herramientas WHERE estado = 'Activa';

SELECT '080 - Suscripciones de planes asignadas a 120 tiendas' AS resultado;
