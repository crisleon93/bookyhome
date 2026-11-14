-- Corrección de fechas de órdenes SEED055
-- Las órdenes seed fueron creadas con fechas futuras (2026), lo que las hace aparecer
-- como las más recientes cuando deberían ser las más antiguas para datos de prueba.
-- Esta migración pone las órdenes seed en fechas anteriores a las órdenes reales.

USE bookyhome;

-- Primero, verificamos el rango de fechas actual
SELECT 'Estado actual:' AS info;
SELECT 
    'SEED055' AS tipo,
    MIN(oc.fecha_orden) as fecha_min,
    MAX(oc.fecha_orden) as fecha_max,
    COUNT(*) as total_ordenes
FROM ordenes_compra oc 
JOIN pagos p ON p.id_orden = oc.id_orden 
WHERE p.referencia_transaccion LIKE 'SEED055-%'
UNION ALL
SELECT 
    'Reales' AS tipo,
    MIN(oc.fecha_orden) as fecha_min,
    MAX(oc.fecha_orden) as fecha_max,
    COUNT(*) as total_ordenes
FROM ordenes_compra oc 
JOIN pagos p ON p.id_orden = oc.id_orden 
WHERE p.referencia_transaccion NOT LIKE 'SEED055-%';

-- Actualizar fechas de órdenes SEED055 para que sean anteriores a las órdenes reales
-- Las ponemos en septiembre 2024, con distribución cronológica manteniendo el orden de IDs
UPDATE ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
JOIN (
    SELECT 
        oc2.id_orden,
        ROW_NUMBER() OVER (ORDER BY oc2.id_orden) - 1 as orden_secuencial
    FROM ordenes_compra oc2
    JOIN pagos p2 ON p2.id_orden = oc2.id_orden
    WHERE p2.referencia_transaccion LIKE 'SEED055-%'
) seed_ordenes ON seed_ordenes.id_orden = oc.id_orden
SET oc.fecha_orden = DATE_ADD('2024-09-01', INTERVAL seed_ordenes.orden_secuencial DAY)
WHERE p.referencia_transaccion LIKE 'SEED055-%';

-- Actualizar también las fechas de pago correspondientes
UPDATE pagos p
JOIN ordenes_compra oc ON oc.id_orden = p.id_orden
SET p.fecha_pago = oc.fecha_orden
WHERE p.referencia_transaccion LIKE 'SEED055-%';

-- Actualizar fechas de envío para que sean el mismo día que la orden
UPDATE envios e
JOIN ordenes_compra oc ON oc.id_orden = e.id_orden
JOIN pagos p ON p.id_orden = oc.id_orden
SET 
    e.fecha_estimada_entrega = oc.fecha_orden,
    e.fecha_despacho = oc.fecha_orden
WHERE p.referencia_transaccion LIKE 'SEED055-%';

-- Actualizar fechas de reseñas para que sean 5 días después de la orden (como estaba originalmente)
UPDATE resenas_libros rl
JOIN detalle_orden do ON do.id_libro = rl.id_libro
JOIN ordenes_compra oc ON oc.id_orden = do.id_orden
JOIN pagos p ON p.id_orden = oc.id_orden
SET rl.fecha_resena = DATE_ADD(oc.fecha_orden, INTERVAL 5 DAY)
WHERE p.referencia_transaccion LIKE 'SEED055-%'
  AND rl.id_usuario = oc.id_usuario;

-- Actualizar fechas de calificaciones de tiendas
UPDATE calificaciones_tiendas ct
JOIN (
    SELECT DISTINCT 
        oc.id_usuario, 
        t.id_tienda,
        MIN(oc.fecha_orden) as primera_orden
    FROM ordenes_compra oc
    JOIN detalle_orden do ON do.id_orden = oc.id_orden
    JOIN libros l ON l.id_libro = do.id_libro
    JOIN tiendas t ON t.id_tienda = l.id_tienda
    JOIN pagos p ON p.id_orden = oc.id_orden
    WHERE p.referencia_transaccion LIKE 'SEED055-%'
    GROUP BY oc.id_usuario, t.id_tienda
) seed_cal ON seed_cal.id_usuario = ct.id_usuario AND seed_cal.id_tienda = ct.id_tienda
SET ct.fecha_calificacion = DATE_ADD(seed_cal.primera_orden, INTERVAL 5 DAY);

-- Verificar el resultado
SELECT 'Estado después de la corrección:' AS info;
SELECT 
    'SEED055' AS tipo,
    MIN(oc.fecha_orden) as fecha_min,
    MAX(oc.fecha_orden) as fecha_max,
    COUNT(*) as total_ordenes
FROM ordenes_compra oc 
JOIN pagos p ON p.id_orden = oc.id_orden 
WHERE p.referencia_transaccion LIKE 'SEED055-%'
UNION ALL
SELECT 
    'Reales' AS tipo,
    MIN(oc.fecha_orden) as fecha_min,
    MAX(oc.fecha_orden) as fecha_max,
    COUNT(*) as total_ordenes
FROM ordenes_compra oc 
JOIN pagos p ON p.id_orden = oc.id_orden 
WHERE p.referencia_transaccion NOT LIKE 'SEED055-%';

SELECT '070 - Fechas de órdenes SEED055 corregidas' AS resultado;