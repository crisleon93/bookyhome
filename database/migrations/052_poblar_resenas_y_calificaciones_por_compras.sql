-- Pobla opiniones a partir de compras entregadas reales.
-- Domicilio: estado_orden entregada.
-- Retiro en tienda: estado_retiro entregada o entregado.
-- Genera una reseña por usuario-libro y una calificacion por usuario-tienda.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_compras_entregadas;
CREATE TEMPORARY TABLE tmp_compras_entregadas AS
SELECT
    oc.id_usuario,
    do.id_libro,
    l.id_tienda,
    MIN(oc.fecha_orden) AS fecha_compra
FROM ordenes_compra oc
JOIN detalle_orden do ON do.id_orden = oc.id_orden
JOIN libros l ON l.id_libro = do.id_libro
WHERE do.cantidad > 0
  AND (
        (
          LOWER(COALESCE(oc.tipo_entrega, 'domicilio')) = 'retiro_tienda'
          AND LOWER(COALESCE(oc.estado_retiro, '')) IN ('entregada', 'entregado')
        )
        OR
        (
          LOWER(COALESCE(oc.tipo_entrega, 'domicilio')) <> 'retiro_tienda'
          AND LOWER(oc.estado_orden) IN ('entregada', 'entregado')
        )
      )
GROUP BY oc.id_usuario, do.id_libro, l.id_tienda;

-- Retira reseñas antiguas que no representan una compra entregada.
DELETE r
FROM resenas_libros r
LEFT JOIN tmp_compras_entregadas c
  ON c.id_usuario = r.id_usuario AND c.id_libro = r.id_libro
WHERE c.id_usuario IS NULL;

-- Completa una reseña por cada libro comprado y recibido.
INSERT INTO resenas_libros
    (id_usuario, id_libro, calificacion, comentario, fecha_resena)
SELECT
    c.id_usuario,
    c.id_libro,
    3 + MOD(c.id_usuario + c.id_libro, 3) AS calificacion,
    CASE MOD(c.id_usuario + c.id_libro, 5)
        WHEN 0 THEN 'El libro llego en buen estado y cumplio mis expectativas.'
        WHEN 1 THEN 'Buena lectura y entrega correcta. Lo recomiendo.'
        WHEN 2 THEN 'Me gusto la historia y el ejemplar llego bien empacado.'
        WHEN 3 THEN 'Una experiencia satisfactoria, volveria a comprarlo.'
        ELSE 'Buen libro, con una experiencia de compra positiva.'
    END AS comentario,
    LEAST(NOW(), DATE_ADD(c.fecha_compra, INTERVAL 3 + MOD(c.id_usuario + c.id_libro, 8) DAY)) AS fecha_resena
FROM tmp_compras_entregadas c
LEFT JOIN resenas_libros r
  ON r.id_usuario = c.id_usuario AND r.id_libro = c.id_libro
WHERE r.id_resena IS NULL;

-- Las calificaciones de tienda se reconstruyen desde cero con compras entregadas.
DELETE FROM calificaciones_tiendas;

INSERT INTO calificaciones_tiendas
    (id_usuario, id_tienda, calificacion, comentario, fecha_calificacion)
SELECT
    c.id_usuario,
    c.id_tienda,
    3 + MOD(c.id_usuario + c.id_tienda, 3) AS calificacion,
    CASE MOD(c.id_usuario + c.id_tienda, 4)
        WHEN 0 THEN 'Buena atencion y proceso de compra claro.'
        WHEN 1 THEN 'La tienda cumplio con la entrega y el producto recibido.'
        WHEN 2 THEN 'Experiencia satisfactoria, con buena comunicacion.'
        ELSE 'Servicio correcto y compra sin inconvenientes.'
    END AS comentario,
    LEAST(NOW(), DATE_ADD(c.fecha_compra, INTERVAL 3 + MOD(c.id_usuario + c.id_tienda, 8) DAY)) AS fecha_calificacion
FROM (
    SELECT id_usuario, id_tienda, MIN(fecha_compra) AS fecha_compra
    FROM tmp_compras_entregadas
    GROUP BY id_usuario, id_tienda
) c;

SELECT '052 - Opiniones pobladas desde compras entregadas' AS resultado;
SELECT COUNT(*) AS total_resenas FROM resenas_libros;
SELECT COUNT(*) AS total_calificaciones_tiendas FROM calificaciones_tiendas;

DROP TEMPORARY TABLE IF EXISTS tmp_compras_entregadas;
