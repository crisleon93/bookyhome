-- Asigna fechas coherentes con el ID de orden:
-- mayor ID = fecha más reciente, sin empates.
-- Rango: 2026-01-01 a 2026-11-14 (317 dias = 317 * 24 * 60 minutos disponibles)
-- Se distribuyen por minuto para que cada orden tenga timestamp único.

USE bookyhome;

-- Cuántas órdenes hay
SELECT COUNT(*) AS total_ordenes FROM ordenes_compra;

-- Actualizar fecha_orden: a mayor id_orden, mayor fecha
-- Rango total en minutos del 2026-01-01 00:00 al 2026-11-14 23:59 = 456479 minutos
UPDATE ordenes_compra oc
JOIN (
    SELECT
        id_orden,
        ROW_NUMBER() OVER (ORDER BY id_orden ASC) - 1 AS ranking,
        COUNT(*) OVER ()                              AS total
    FROM ordenes_compra
) ranked ON ranked.id_orden = oc.id_orden
SET oc.fecha_orden = DATE_ADD(
    '2026-01-01 00:00:00',
    INTERVAL FLOOR(ranked.ranking * 456479 / GREATEST(ranked.total - 1, 1)) MINUTE
);

-- Sincronizar pagos
UPDATE pagos p
JOIN ordenes_compra oc ON oc.id_orden = p.id_orden
SET p.fecha_pago = oc.fecha_orden;

-- Sincronizar envios
UPDATE envios e
JOIN ordenes_compra oc ON oc.id_orden = e.id_orden
SET e.fecha_estimada_entrega = DATE(oc.fecha_orden),
    e.fecha_despacho         = DATE(oc.fecha_orden);

-- Verificar coherencia: ninguna orden debe tener fecha > que una orden con ID mayor
SELECT 'Verificación (debe ser 0):' AS info;
SELECT COUNT(*) AS inconsistencias
FROM ordenes_compra a
JOIN ordenes_compra b ON b.id_orden = a.id_orden + 1
WHERE a.fecha_orden > b.fecha_orden;

SELECT 'Muestra de resultado:' AS info;
SELECT id_orden, fecha_orden
FROM ordenes_compra
ORDER BY id_orden DESC
LIMIT 10;

SELECT '074 - Fechas coherentes con ID aplicadas' AS resultado;
