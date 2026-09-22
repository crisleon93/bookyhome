-- Distribución de fechas de órdenes seed a lo largo de 2026
-- Desde el 1 de enero hasta el 14 de noviembre de 2026
-- Las órdenes más antiguas (IDs más altos) tendrán fechas más tempranas
-- Las órdenes más recientes (IDs más bajos) tendrán fechas más tardías

USE bookyhome;

-- Información actual
SELECT 'Antes de redistribución 2026:' AS info;
SELECT 
    CASE 
        WHEN p.referencia_transaccion LIKE 'SEED055-%' THEN 'SEED055'
        WHEN p.referencia_transaccion LIKE 'SEED056-%' THEN 'SEED056'
        ELSE 'Reales'
    END AS tipo,
    COUNT(*) as total,
    MIN(oc.fecha_orden) as fecha_min,
    MAX(oc.fecha_orden) as fecha_max
FROM ordenes_compra oc 
LEFT JOIN pagos p ON p.id_orden = oc.id_orden
GROUP BY CASE 
    WHEN p.referencia_transaccion LIKE 'SEED055-%' THEN 'SEED055'
    WHEN p.referencia_transaccion LIKE 'SEED056-%' THEN 'SEED056'
    ELSE 'Reales'
END;

-- Calcular el rango total de días desde enero 1 hasta noviembre 14, 2026
-- Del 2026-01-01 al 2026-11-14 = 318 días

-- Redistribuir SEED055 (19,950 órdenes) desde enero hasta octubre
-- IDs más altos = fechas más tempranas, IDs más bajos = fechas más tardías
UPDATE ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
JOIN (
    SELECT 
        oc2.id_orden,
        -- Crear ranking inverso: ID más alto = ranking menor = fecha más temprana
        ROW_NUMBER() OVER (ORDER BY oc2.id_orden DESC) - 1 as ranking_inverso,
        COUNT(*) OVER () as total_ordenes
    FROM ordenes_compra oc2
    JOIN pagos p2 ON p2.id_orden = oc2.id_orden
    WHERE p2.referencia_transaccion LIKE 'SEED055-%'
) ranking ON ranking.id_orden = oc.id_orden
SET oc.fecha_orden = DATE_ADD(
    '2026-01-01', 
    INTERVAL FLOOR((ranking.ranking_inverso * 280) / ranking.total_ordenes) DAY
)
WHERE p.referencia_transaccion LIKE 'SEED055-%';

-- Redistribuir SEED056 (2,731 órdenes) desde octubre hasta noviembre 14
UPDATE ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
JOIN (
    SELECT 
        oc2.id_orden,
        -- Crear ranking inverso para SEED056 también
        ROW_NUMBER() OVER (ORDER BY oc2.id_orden DESC) - 1 as ranking_inverso,
        COUNT(*) OVER () as total_ordenes
    FROM ordenes_compra oc2
    JOIN pagos p2 ON p2.id_orden = oc2.id_orden
    WHERE p2.referencia_transaccion LIKE 'SEED056-%'
) ranking ON ranking.id_orden = oc.id_orden
SET oc.fecha_orden = DATE_ADD(
    '2026-10-01', 
    INTERVAL FLOOR((ranking.ranking_inverso * 44) / ranking.total_ordenes) DAY
)
WHERE p.referencia_transaccion LIKE 'SEED056-%';

-- Actualizar fechas de pagos para que coincidan
UPDATE pagos p
JOIN ordenes_compra oc ON oc.id_orden = p.id_orden
SET p.fecha_pago = oc.fecha_orden
WHERE p.referencia_transaccion LIKE 'SEED055-%' OR p.referencia_transaccion LIKE 'SEED056-%';

-- Actualizar fechas de envío
UPDATE envios e
JOIN ordenes_compra oc ON oc.id_orden = e.id_orden
JOIN pagos p ON p.id_orden = oc.id_orden
SET 
    e.fecha_estimada_entrega = oc.fecha_orden,
    e.fecha_despacho = oc.fecha_orden
WHERE p.referencia_transaccion LIKE 'SEED055-%' OR p.referencia_transaccion LIKE 'SEED056-%';

-- Actualizar reseñas para que sean 5 días después de la orden
UPDATE resenas_libros rl
JOIN detalle_orden do ON do.id_libro = rl.id_libro
JOIN ordenes_compra oc ON oc.id_orden = do.id_orden
JOIN pagos p ON p.id_orden = oc.id_orden
SET rl.fecha_resena = DATE_ADD(oc.fecha_orden, INTERVAL 5 DAY)
WHERE (p.referencia_transaccion LIKE 'SEED055-%' OR p.referencia_transaccion LIKE 'SEED056-%')
  AND rl.id_usuario = oc.id_usuario;

-- Información después de la redistribución
SELECT 'Después de redistribución 2026:' AS info;
SELECT 
    CASE 
        WHEN p.referencia_transaccion LIKE 'SEED055-%' THEN 'SEED055'
        WHEN p.referencia_transaccion LIKE 'SEED056-%' THEN 'SEED056'
        ELSE 'Reales'
    END AS tipo,
    COUNT(*) as total,
    MIN(oc.fecha_orden) as fecha_min,
    MAX(oc.fecha_orden) as fecha_max
FROM ordenes_compra oc 
LEFT JOIN pagos p ON p.id_orden = oc.id_orden
GROUP BY CASE 
    WHEN p.referencia_transaccion LIKE 'SEED055-%' THEN 'SEED055'
    WHEN p.referencia_transaccion LIKE 'SEED056-%' THEN 'SEED056'
    ELSE 'Reales'
END;

-- Verificar las órdenes específicas del frontend (ahora deberían estar ordenadas correctamente)
SELECT 'Órdenes específicas después de redistribución:' AS info;
SELECT 
    oc.id_orden, 
    oc.fecha_orden, 
    p.referencia_transaccion,
    oc.id_usuario
FROM ordenes_compra oc 
JOIN pagos p ON p.id_orden = oc.id_orden 
WHERE oc.id_orden IN (791, 941, 1091, 1241, 1391, 1541, 1691, 1841, 34071, 34072, 34078)
ORDER BY oc.fecha_orden DESC;

SELECT '072 - Fechas seed redistribuidas en 2026' AS resultado;