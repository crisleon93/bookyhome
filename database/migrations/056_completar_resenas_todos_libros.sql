-- Garantiza al menos una compra entregada y una resena por cada libro publicado.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_libros_sin_resena;
CREATE TEMPORARY TABLE tmp_libros_sin_resena AS
SELECT
    l.id_libro,
    l.id_tienda,
    l.precio_libro,
    (
        SELECT u.id_usuario
        FROM usuarios u
        WHERE u.rol = 'comprador'
          AND NOT EXISTS (
              SELECT 1
              FROM ordenes_compra oc
              JOIN detalle_orden d ON d.id_orden = oc.id_orden
              WHERE oc.id_usuario = u.id_usuario
                AND d.id_libro = l.id_libro
                AND d.cantidad > 0
                AND LOWER(oc.estado_orden) IN ('entregada', 'entregado')
          )
        ORDER BY MOD(u.id_usuario + l.id_libro, 133), u.id_usuario
        LIMIT 1
    ) AS id_usuario,
    DATE_SUB(CURDATE(), INTERVAL MOD(l.id_libro, 30) DAY) AS fecha_orden
FROM libros l
WHERE NOT EXISTS (
    SELECT 1 FROM resenas_libros r WHERE r.id_libro = l.id_libro
);

DELETE FROM tmp_libros_sin_resena WHERE id_usuario IS NULL;

INSERT INTO ordenes_compra
    (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden,
     tipo_entrega, estado_retiro, metodo_pago, costo_envio)
SELECT
    p.id_usuario,
    (SELECT d.id_direccion FROM direcciones_envio d
     WHERE d.id_usuario = p.id_usuario
     ORDER BY d.es_principal DESC, d.id_direccion LIMIT 1),
    p.fecha_orden,
    p.precio_libro,
    'Entregada',
    'domicilio',
    NULL,
    'Transferencia',
    0
FROM tmp_libros_sin_resena p;

DROP TEMPORARY TABLE IF EXISTS tmp_mapa_056;
CREATE TEMPORARY TABLE tmp_mapa_056 AS
SELECT oc.id_orden, p.id_usuario, p.id_libro, p.id_tienda, p.precio_libro, p.fecha_orden
FROM ordenes_compra oc
JOIN tmp_libros_sin_resena p
  ON p.id_usuario = oc.id_usuario
 AND p.fecha_orden = oc.fecha_orden
 AND p.precio_libro = oc.total
WHERE oc.estado_orden = 'Entregada'
  AND oc.tipo_entrega = 'domicilio';

INSERT INTO detalle_orden
    (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final)
SELECT id_orden, id_libro, 1, precio_libro, 0, precio_libro
FROM tmp_mapa_056;

INSERT INTO pagos
    (id_orden, metodo_pago, monto, referencia_transaccion, fecha_pago, estado_pago)
SELECT id_orden, 'Transferencia', precio_libro, CONCAT('SEED056-', id_libro), fecha_orden, 'Aprobado'
FROM tmp_mapa_056;

INSERT INTO envios
    (id_orden, id_tienda, empresa_mensajeria, numero_guia, costo_envio,
     fecha_estimada_entrega, fecha_despacho, estado_envio)
SELECT id_orden, id_tienda, 'BookyHome Envios', CONCAT('SEED056-', id_libro), 0,
       DATE(fecha_orden), DATE(fecha_orden), 'Entregado'
FROM tmp_mapa_056;

UPDATE libros l
JOIN tmp_mapa_056 p ON p.id_libro = l.id_libro
SET l.stock = l.stock - 1;

INSERT INTO resenas_libros
    (id_usuario, id_libro, calificacion, comentario, fecha_resena)
SELECT
    p.id_usuario,
    p.id_libro,
    3 + MOD(p.id_usuario + p.id_libro, 3),
    CASE MOD(p.id_usuario + p.id_libro, 4)
        WHEN 0 THEN 'El libro llego en buen estado y cumplio mis expectativas.'
        WHEN 1 THEN 'Buena lectura y entrega correcta. Lo recomiendo.'
        WHEN 2 THEN 'Me gusto la historia y el ejemplar llego bien empacado.'
        ELSE 'Una experiencia satisfactoria, volveria a comprarlo.'
    END,
    DATE_ADD(p.fecha_orden, INTERVAL 5 DAY)
FROM tmp_mapa_056 p
WHERE NOT EXISTS (
    SELECT 1 FROM resenas_libros r
    WHERE r.id_usuario = p.id_usuario AND r.id_libro = p.id_libro
);

SELECT '056 - Todos los libros publicados tienen resena' AS resultado;
SELECT COUNT(*) AS libros_sin_resenas
FROM libros l
WHERE NOT EXISTS (SELECT 1 FROM resenas_libros r WHERE r.id_libro = l.id_libro);
SELECT COUNT(*) AS compras_seed_056 FROM pagos WHERE referencia_transaccion LIKE 'SEED056-%';

DROP TEMPORARY TABLE IF EXISTS tmp_mapa_056;
DROP TEMPORARY TABLE IF EXISTS tmp_libros_sin_resena;
