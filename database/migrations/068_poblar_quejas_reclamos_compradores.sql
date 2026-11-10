-- Puebla reclamos de compradores en distintos estados y con conversaciones.
-- Usa ordenes reales y es idempotente por comprador, orden y estado.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_ordenes_reclamo_068;
CREATE TEMPORARY TABLE tmp_ordenes_reclamo_068 AS
SELECT id_usuario, id_orden, id_tienda,
       ROW_NUMBER() OVER (PARTITION BY id_usuario ORDER BY id_orden) AS posicion
FROM (
    SELECT DISTINCT
        oc.id_usuario,
        oc.id_orden,
        l.id_tienda
    FROM ordenes_compra oc
    JOIN detalle_orden d ON d.id_orden = oc.id_orden
    JOIN libros l ON l.id_libro = d.id_libro
    WHERE oc.estado_orden NOT IN ('Cancelada', 'Pendiente')
) compras;

DROP TEMPORARY TABLE IF EXISTS tmp_estados_reclamo_068;
CREATE TEMPORARY TABLE tmp_estados_reclamo_068 (
    posicion INT PRIMARY KEY,
    estado VARCHAR(30) NOT NULL,
    asunto VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    prioridad VARCHAR(20) NOT NULL,
    respuesta VARCHAR(500),
    dias_atras INT NOT NULL
);

INSERT INTO tmp_estados_reclamo_068 VALUES
(1, 'Abierto', 'El pedido llego con una novedad', 'Quiero reportar una novedad con el pedido y necesito ayuda de la tienda.', 'Urgente', NULL, 3),
(2, 'En revision', 'Consulta sobre el estado del envio', 'El pedido aparece entregado, pero necesito confirmar algunos detalles con la libreria.', 'Normal', NULL, 7),
(3, 'Resuelto', 'Producto recibido con inconveniente', 'El ejemplar llego con un detalle y solicite una solucion a la tienda.', 'Normal', 'Se reviso el caso y se ofrecio una solucion al comprador.', 14),
(4, 'Rechazado', 'Solicitud de devolucion', 'Solicite una devolucion, pero no cumplia las condiciones establecidas para este pedido.', 'Normal', 'La solicitud fue rechazada porque no cumplia las condiciones de devolucion.', 21);

INSERT INTO solicitudes_soporte
    (id_tienda, id_usuario, id_orden, asunto, descripcion, categoria, prioridad,
     estado, respuesta, tipo_solicitud, tiempo_respuesta_horas, fecha_creacion, fecha_resolucion)
SELECT
    compra.id_tienda,
    compra.id_usuario,
    compra.id_orden,
    estado.asunto,
    estado.descripcion,
    'reclamo',
    estado.prioridad,
    estado.estado,
    estado.respuesta,
    'reclamo',
    CASE WHEN estado.estado IN ('Resuelto', 'Rechazado') THEN 24 ELSE NULL END,
    DATE_SUB(CURDATE(), INTERVAL estado.dias_atras DAY),
    CASE WHEN estado.estado IN ('Resuelto', 'Rechazado')
         THEN DATE_SUB(CURDATE(), INTERVAL (estado.dias_atras - 1) DAY)
         ELSE NULL END
FROM tmp_ordenes_reclamo_068 compra
JOIN tmp_estados_reclamo_068 estado ON estado.posicion = MOD(compra.posicion - 1, 4) + 1
WHERE compra.posicion <= 4
  AND NOT EXISTS (
      SELECT 1
      FROM solicitudes_soporte existente
      WHERE existente.id_usuario = compra.id_usuario
        AND existente.id_orden = compra.id_orden
        AND existente.tipo_solicitud = 'reclamo'
        AND existente.estado = estado.estado
  );

INSERT INTO mensajes_reclamo (id_solicitud, id_usuario, mensaje, fecha_creacion)
SELECT
    solicitud.id_solicitud,
    solicitud.id_usuario,
    CASE solicitud.estado
        WHEN 'Abierto' THEN 'Hola, quisiera que revisaran mi caso y me orientaran sobre la solucion.'
        WHEN 'En revision' THEN 'Quedo atento a la respuesta de la libreria sobre este reclamo.'
        WHEN 'Resuelto' THEN 'Gracias por revisar el caso y ayudarme con la solucion.'
        ELSE 'Entiendo la respuesta. Gracias por la aclaracion.'
    END,
    solicitud.fecha_creacion
FROM solicitudes_soporte solicitud
WHERE solicitud.tipo_solicitud = 'reclamo'
  AND solicitud.fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND NOT EXISTS (
      SELECT 1 FROM mensajes_reclamo mensaje
      WHERE mensaje.id_solicitud = solicitud.id_solicitud
  );

INSERT INTO notificaciones
    (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
SELECT
    t.id_usuario,
    'sistema',
    'Nuevo reclamo recibido',
    CONCAT('El comprador ha creado el reclamo #', s.id_solicitud,
           ' sobre la orden #', s.id_orden, ': ', s.asunto),
    s.id_solicitud,
    FALSE,
    s.fecha_creacion
FROM solicitudes_soporte s
JOIN tiendas t ON t.id_tienda = s.id_tienda
WHERE s.tipo_solicitud = 'reclamo'
  AND s.fecha_creacion >= '2026-01-01'
  AND NOT EXISTS (
      SELECT 1
      FROM notificaciones n
      WHERE n.id_usuario = t.id_usuario
        AND n.tipo = 'sistema'
        AND n.id_referencia = s.id_solicitud
        AND n.titulo = 'Nuevo reclamo recibido'
  );

  INSERT INTO notificaciones
      (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
  SELECT
      s.id_usuario,
      'sistema',
      'Reclamo registrado',
      CONCAT('Tu reclamo #', s.id_solicitud, ' para la orden #', s.id_orden,
             ' fue registrado y sera gestionado con la tienda.'),
      s.id_solicitud,
      FALSE,
      s.fecha_creacion
  FROM solicitudes_soporte s
  WHERE s.tipo_solicitud = 'reclamo'
    AND s.fecha_creacion >= '2026-01-01'
    AND NOT EXISTS (
        SELECT 1
        FROM notificaciones n
        WHERE n.id_usuario = s.id_usuario
          AND n.tipo = 'sistema'
          AND n.id_referencia = s.id_solicitud
          AND n.titulo = 'Reclamo registrado'
    );

  INSERT INTO notificaciones
      (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
  SELECT
      admin.id_usuario,
      'sistema',
      'Nuevo reclamo para gestionar',
      CONCAT('El reclamo #', s.id_solicitud, ' requiere seguimiento entre el comprador y la tienda.'),
      s.id_solicitud,
      FALSE,
      s.fecha_creacion
  FROM solicitudes_soporte s
  JOIN usuarios admin ON admin.rol IN ('admin', 'administrador')
  WHERE s.tipo_solicitud = 'reclamo'
    AND s.fecha_creacion >= '2026-01-01'
    AND NOT EXISTS (
        SELECT 1
        FROM notificaciones n
        WHERE n.id_usuario = admin.id_usuario
          AND n.tipo = 'sistema'
          AND n.id_referencia = s.id_solicitud
          AND n.titulo = 'Nuevo reclamo para gestionar'
    );

SELECT '068 - Quejas y reclamos de compradores poblados' AS resultado,
       COUNT(*) AS reclamos_reclamo
FROM solicitudes_soporte
WHERE tipo_solicitud = 'reclamo'
  AND fecha_creacion >= '2026-01-01';

SELECT estado, COUNT(*) AS cantidad
FROM solicitudes_soporte
WHERE tipo_solicitud = 'reclamo'
GROUP BY estado
ORDER BY estado;

DROP TEMPORARY TABLE IF EXISTS tmp_estados_reclamo_068;
DROP TEMPORARY TABLE IF EXISTS tmp_ordenes_reclamo_068;