-- Corrige las fechas de calificaciones_tiendas para que estén
-- dentro del rango 2026-01-01 a 2026-11-14 y sean coherentes
-- con la fecha de la orden asociada (calificación = orden + 5 días).

USE bookyhome;

SELECT 'Antes:' AS info;
SELECT MIN(fecha_calificacion) AS min_fecha, MAX(fecha_calificacion) AS max_fecha, COUNT(*) AS total
FROM calificaciones_tiendas;

-- Actualizar cada calificación para que sea 5 días después
-- de la orden más reciente del usuario en esa tienda
UPDATE calificaciones_tiendas ct
JOIN (
    SELECT
        oc.id_usuario,
        l.id_tienda,
        MAX(oc.fecha_orden) AS ultima_fecha_orden
    FROM ordenes_compra oc
    JOIN detalle_orden do ON do.id_orden = oc.id_orden
    JOIN libros l ON l.id_libro = do.id_libro
    GROUP BY oc.id_usuario, l.id_tienda
) base ON base.id_usuario = ct.id_usuario AND base.id_tienda = ct.id_tienda
SET ct.fecha_calificacion = LEAST(
    DATE_ADD(base.ultima_fecha_orden, INTERVAL 5 DAY),
    '2026-11-14 23:59:00'
);

-- Para calificaciones que no tienen orden asociada, usar distribución uniforme en 2026
UPDATE calificaciones_tiendas ct
SET ct.fecha_calificacion = DATE_ADD(
    '2026-01-01 00:00:00',
    INTERVAL FLOOR((ct.id_calificacion % 456479)) MINUTE
)
WHERE ct.fecha_calificacion < '2026-01-01 00:00:00'
   OR ct.fecha_calificacion > '2026-11-14 23:59:00';

SELECT 'Después:' AS info;
SELECT MIN(fecha_calificacion) AS min_fecha, MAX(fecha_calificacion) AS max_fecha, COUNT(*) AS total
FROM calificaciones_tiendas;

SELECT '075 - Fechas de calificaciones de tiendas corregidas' AS resultado;
