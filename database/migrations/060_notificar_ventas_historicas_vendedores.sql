-- Genera notificaciones de ventas para los vendedores en ordenes ya pagadas.
-- Es idempotente: no repite una notificacion para el mismo vendedor y orden.
USE bookyhome;

INSERT INTO notificaciones
    (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
SELECT DISTINCT
    t.id_usuario,
    'pedido',
    '¡Nueva venta pagada!',
    CONCAT(
        'Has recibido el pago para la orden #', oc.id_orden,
        ' por $', FORMAT(oc.total, 0), '.'
    ),
    oc.id_orden,
    FALSE,
    GREATEST(oc.fecha_orden, '2026-01-01 00:00:00')
FROM ordenes_compra oc
JOIN pagos p ON p.id_orden = oc.id_orden
JOIN detalle_orden d ON d.id_orden = oc.id_orden
JOIN libros l ON l.id_libro = d.id_libro
JOIN tiendas t ON t.id_tienda = l.id_tienda
WHERE LOWER(COALESCE(p.estado_pago, '')) IN ('aprobado', 'aprobada', 'pagado', 'pagada')
  AND NOT EXISTS (
      SELECT 1
      FROM notificaciones n
      WHERE n.id_usuario = t.id_usuario
        AND n.tipo = 'pedido'
        AND n.id_referencia = oc.id_orden
  );

UPDATE notificaciones
SET titulo = 'Nueva venta pagada'
WHERE tipo = 'pedido'
    AND titulo IN ('??Nueva venta pagada!', '¡Nueva venta pagada!');

SELECT '060 - Notificaciones de ventas historicas creadas' AS resultado,
       ROW_COUNT() AS notificaciones_creadas;