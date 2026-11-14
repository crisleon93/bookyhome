-- Corrección definitiva de fechas de órdenes SEED055 y SEED056
-- Ponemos todas las órdenes seed en un rango de fechas en el pasado reciente
-- para que no interfieran con las órdenes reales del usuario

USE bookyhome;

-- Información actual
SELECT 'Antes de corrección:' AS info;
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

-- Corregir SEED055: Distribuir a lo largo de 60 días en septiembre-octubre 2024
UPDATE ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
SET oc.fecha_orden = DATE_ADD(
    '2024-08-01', 
    INTERVAL FLOOR((oc.id_orden % 60)) DAY
)
WHERE p.referencia_transaccion LIKE 'SEED055-%';

-- Corregir SEED056: Distribuir a lo largo de 60 días en julio-agosto 2024  
UPDATE ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
SET oc.fecha_orden = DATE_ADD(
    '2024-06-01', 
    INTERVAL FLOOR((oc.id_orden % 60)) DAY
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

-- Información después de la corrección
SELECT 'Después de corrección:' AS info;
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

-- Verificar algunas órdenes específicas que aparecían en el frontend
SELECT 'Órdenes específicas del frontend:' AS info;
SELECT 
    oc.id_orden, 
    oc.fecha_orden, 
    p.referencia_transaccion,
    oc.id_usuario
FROM ordenes_compra oc 
JOIN pagos p ON p.id_orden = oc.id_orden 
WHERE oc.id_orden IN (791, 941, 1091, 1241, 34071, 34072) 
ORDER BY oc.fecha_orden DESC;

SELECT '071 - Fechas seed corregidas definitivamente' AS resultado;