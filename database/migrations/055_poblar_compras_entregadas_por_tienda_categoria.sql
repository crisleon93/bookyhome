-- Completa compras entregadas para cada comprador, tienda y categoria disponible.
-- Cada combinacion usa un libro real con stock y genera una resena del libro.
-- Las ordenes quedan pagadas y entregadas, con pago y envio registrados.
USE bookyhome;

SET FOREIGN_KEY_CHECKS = 0;

DROP TEMPORARY TABLE IF EXISTS tmp_libros_objetivo;
CREATE TEMPORARY TABLE tmp_libros_objetivo AS
SELECT
    u.id_usuario,
    elegido.id_tienda,
    elegido.id_categoria,
    elegido.id_libro,
    elegido.precio_libro,
    DATE_SUB(CURDATE(), INTERVAL MOD(elegido.id_tienda, 30) DAY) AS fecha_orden
FROM usuarios u
CROSS JOIN (
    SELECT id_tienda, id_categoria, id_libro, precio_libro
    FROM (
        SELECT
            l.id_tienda,
            l.id_categoria,
            l.id_libro,
            l.precio_libro,
            ROW_NUMBER() OVER (PARTITION BY l.id_tienda, l.id_categoria ORDER BY l.id_libro) AS rn
        FROM libros l
        WHERE l.stock > 0
          AND l.id_categoria IS NOT NULL
          AND LOWER(COALESCE(l.estado_libro, 'activo')) NOT IN ('inactivo', 'agotado', 'eliminado')
    ) candidatos
    WHERE rn = 1
) elegido
WHERE u.rol = 'comprador';

-- Conserva solo los libros que el comprador aun no recibio.
DELETE objetivo
FROM tmp_libros_objetivo objetivo
JOIN ordenes_compra oc ON oc.id_usuario = objetivo.id_usuario
JOIN detalle_orden detalle ON detalle.id_orden = oc.id_orden
WHERE detalle.id_libro = objetivo.id_libro
  AND detalle.cantidad > 0
  AND (
        (LOWER(COALESCE(oc.tipo_entrega, 'domicilio')) = 'retiro_tienda'
         AND LOWER(COALESCE(oc.estado_retiro, '')) IN ('entregada', 'entregado'))
        OR
        (LOWER(COALESCE(oc.tipo_entrega, 'domicilio')) <> 'retiro_tienda'
         AND LOWER(oc.estado_orden) IN ('entregada', 'entregado'))
      );

DROP TEMPORARY TABLE IF EXISTS tmp_ordenes_nuevas;
CREATE TEMPORARY TABLE tmp_ordenes_nuevas AS
SELECT
    id_usuario,
    id_tienda,
    fecha_orden,
    SUM(precio_libro) AS total
FROM tmp_libros_objetivo
GROUP BY id_usuario, id_tienda, fecha_orden;

-- Todas las ordenes usan la direccion principal disponible del comprador.
INSERT INTO ordenes_compra
    (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden,
     tipo_entrega, estado_retiro, metodo_pago, costo_envio)
SELECT
    o.id_usuario,
    COALESCE(
        (SELECT d.id_direccion FROM direcciones_envio d
         WHERE d.id_usuario = o.id_usuario
         ORDER BY d.es_principal DESC, d.id_direccion
         LIMIT 1),
        (SELECT MIN(d2.id_direccion) FROM direcciones_envio d2)
    ),
    o.fecha_orden,
    o.total,
    'Entregada',
    'domicilio',
    NULL,
    'Transferencia',
    0
FROM tmp_ordenes_nuevas o;

DROP TEMPORARY TABLE IF EXISTS tmp_mapa_ordenes;
CREATE TEMPORARY TABLE tmp_mapa_ordenes AS
SELECT oc.id_orden, o.id_usuario, o.id_tienda, o.fecha_orden
FROM ordenes_compra oc
JOIN tmp_ordenes_nuevas o
  ON o.id_usuario = oc.id_usuario
 AND o.fecha_orden = oc.fecha_orden
 AND o.total = oc.total
 AND oc.estado_orden = 'Entregada'
 AND oc.tipo_entrega = 'domicilio';

-- Detalle, pago y envio para cada orden nueva.
INSERT INTO detalle_orden
    (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final)
SELECT
    mapa.id_orden,
    objetivo.id_libro,
    1,
    objetivo.precio_libro,
    0,
    objetivo.precio_libro
FROM tmp_libros_objetivo objetivo
JOIN tmp_mapa_ordenes mapa
  ON mapa.id_usuario = objetivo.id_usuario
 AND mapa.id_tienda = objetivo.id_tienda
 AND mapa.fecha_orden = objetivo.fecha_orden;

INSERT INTO pagos
    (id_orden, metodo_pago, monto, referencia_transaccion, fecha_pago, estado_pago)
SELECT id_orden, 'Transferencia', total, CONCAT('SEED055-', id_orden), fecha_orden, 'Aprobado'
FROM ordenes_compra
WHERE id_orden IN (SELECT id_orden FROM tmp_mapa_ordenes);

INSERT INTO envios
    (id_orden, id_tienda, empresa_mensajeria, numero_guia, costo_envio,
     fecha_estimada_entrega, fecha_despacho, estado_envio)
SELECT
    mapa.id_orden,
    mapa.id_tienda,
    'BookyHome Envios',
    CONCAT('SEED055-', mapa.id_orden),
    0,
    DATE(mapa.fecha_orden),
    DATE(mapa.fecha_orden),
    'Entregado'
FROM tmp_mapa_ordenes mapa;

-- Descuenta una unidad por cada libro agregado a una orden.
UPDATE libros l
JOIN (
    SELECT id_libro, COUNT(*) AS unidades_vendidas
    FROM tmp_libros_objetivo
    GROUP BY id_libro
) ventas ON ventas.id_libro = l.id_libro
SET l.stock = l.stock - ventas.unidades_vendidas;

-- Una resena por libro comprado y una calificacion por tienda visitada.
INSERT INTO resenas_libros
    (id_usuario, id_libro, calificacion, comentario, fecha_resena)
SELECT
    objetivo.id_usuario,
    objetivo.id_libro,
    3 + MOD(objetivo.id_usuario + objetivo.id_libro, 3),
    CASE MOD(objetivo.id_usuario + objetivo.id_libro, 4)
        WHEN 0 THEN 'El libro llego en buen estado y cumplio mis expectativas.'
        WHEN 1 THEN 'Buena lectura y entrega correcta. Lo recomiendo.'
        WHEN 2 THEN 'Me gusto la historia y el ejemplar llego bien empacado.'
        ELSE 'Una experiencia satisfactoria, volveria a comprarlo.'
    END,
    DATE_ADD(objetivo.fecha_orden, INTERVAL 5 DAY)
FROM tmp_libros_objetivo objetivo
LEFT JOIN resenas_libros existente
  ON existente.id_usuario = objetivo.id_usuario
 AND existente.id_libro = objetivo.id_libro
WHERE existente.id_resena IS NULL;

INSERT INTO calificaciones_tiendas
    (id_usuario, id_tienda, calificacion, comentario, fecha_calificacion)
SELECT
    objetivo.id_usuario,
    objetivo.id_tienda,
    3 + MOD(objetivo.id_usuario + objetivo.id_tienda, 3),
    'Buena atencion y experiencia de compra satisfactoria.',
    DATE_ADD(MIN(objetivo.fecha_orden), INTERVAL 5 DAY)
FROM tmp_libros_objetivo objetivo
LEFT JOIN calificaciones_tiendas existente
  ON existente.id_usuario = objetivo.id_usuario
 AND existente.id_tienda = objetivo.id_tienda
WHERE existente.id_calificacion IS NULL
GROUP BY objetivo.id_usuario, objetivo.id_tienda;

-- Las compras de prueba deben aparecer como recientes en Mis Compras,
-- manteniendo una secuencia cronologica coherente con el orden de creacion.
-- Cada nueva orden seed toma una fecha igual o posterior a la anterior,
-- evitando que ids mayores aparezcan con fechas mas antiguas.
DROP TEMPORARY TABLE IF EXISTS tmp_seed055_ordenes_cronologicas;
CREATE TEMPORARY TABLE tmp_seed055_ordenes_cronologicas AS
SELECT oc.id_orden,
       ROW_NUMBER() OVER (ORDER BY oc.id_orden) AS rn,
       FLOOR((ROW_NUMBER() OVER (ORDER BY oc.id_orden) - 1) / 30) AS bloque_dia
FROM ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
WHERE p.referencia_transaccion LIKE 'SEED055-%';

UPDATE ordenes_compra oc
JOIN tmp_seed055_ordenes_cronologicas t ON t.id_orden = oc.id_orden
SET oc.fecha_orden = DATE_ADD('2026-01-01', INTERVAL t.bloque_dia DAY)
WHERE EXISTS (
    SELECT 1
    FROM pagos p
    WHERE p.id_orden = oc.id_orden
      AND p.referencia_transaccion LIKE 'SEED055-%'
);

DROP TEMPORARY TABLE IF EXISTS tmp_seed055_ordenes_cronologicas;

SELECT '055 - Compras, pagos, entregas y opiniones generadas' AS resultado;
SELECT COUNT(*) AS ordenes_seed
FROM ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
WHERE p.referencia_transaccion LIKE 'SEED055-%';
SELECT COUNT(*) AS detalles_seed
FROM detalle_orden d
JOIN pagos p ON p.id_orden = d.id_orden
WHERE p.referencia_transaccion LIKE 'SEED055-%';
SELECT COUNT(*) AS resenas_totales FROM resenas_libros;
SELECT COUNT(*) AS calificaciones_tienda_totales FROM calificaciones_tiendas;

DROP TEMPORARY TABLE IF EXISTS tmp_mapa_ordenes;
DROP TEMPORARY TABLE IF EXISTS tmp_ordenes_nuevas;
DROP TEMPORARY TABLE IF EXISTS tmp_libros_objetivo;
SET FOREIGN_KEY_CHECKS = 1;
