-- Puebla tickets de soporte directos entre usuarios y el administrador.
-- Los tickets no vinculan comprador con vendedor: id_tienda permanece NULL.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_usuarios_soporte_069;
CREATE TEMPORARY TABLE tmp_usuarios_soporte_069 AS
SELECT id_usuario, rol, ROW_NUMBER() OVER (PARTITION BY rol ORDER BY id_usuario) AS posicion
FROM usuarios
WHERE rol IN ('comprador', 'vendedor');

DROP TEMPORARY TABLE IF EXISTS tmp_estados_soporte_069;
CREATE TEMPORARY TABLE tmp_estados_soporte_069 (
    posicion INT PRIMARY KEY,
    estado VARCHAR(30) NOT NULL,
    asunto VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    respuesta VARCHAR(500),
    dias_atras INT NOT NULL
);

INSERT INTO tmp_estados_soporte_069 VALUES
(1, 'Abierto', 'Consulta sobre mi cuenta', 'Necesito ayuda para revisar una configuracion de mi cuenta.', 'cuenta', NULL, 2),
(2, 'En revision', 'Problema con una funcion', 'La funcion no se comporta como esperaba y solicito apoyo del equipo.', 'tecnico', NULL, 6),
(3, 'Resuelto', 'Solicitud de orientacion', 'Quisiera conocer el procedimiento correcto para usar una funcion de BookyHome.', 'otro', 'El administrador envio las indicaciones y confirmo la solucion.', 12),
(4, 'Rechazado', 'Solicitud no procedente', 'Solicito una accion que no corresponde a las politicas actuales de la plataforma.', 'otro', 'La solicitud fue revisada y no procede bajo las politicas vigentes.', 18);

INSERT INTO solicitudes_soporte
    (id_tienda, id_usuario, asunto, descripcion, categoria, prioridad, estado,
     respuesta, tipo_solicitud, tiempo_respuesta_horas, fecha_creacion, fecha_resolucion)
SELECT
    NULL,
    usuario.id_usuario,
    estado.asunto,
    estado.descripcion,
    estado.categoria,
    CASE WHEN estado.estado = 'Abierto' THEN 'Urgente' ELSE 'Normal' END,
    estado.estado,
    estado.respuesta,
    'soporte',
    CASE WHEN estado.estado IN ('Resuelto', 'Rechazado') THEN 24 ELSE NULL END,
    DATE_SUB(CURDATE(), INTERVAL estado.dias_atras DAY),
    CASE WHEN estado.estado IN ('Resuelto', 'Rechazado')
         THEN DATE_SUB(CURDATE(), INTERVAL (estado.dias_atras - 1) DAY)
         ELSE NULL END
FROM tmp_usuarios_soporte_069 usuario
JOIN tmp_estados_soporte_069 estado
  ON estado.posicion = MOD(usuario.posicion - 1, 4) + 1
WHERE NOT EXISTS (
    SELECT 1
    FROM solicitudes_soporte existente
    WHERE existente.id_usuario = usuario.id_usuario
      AND existente.tipo_solicitud = 'soporte'
      AND existente.asunto = estado.asunto
);

INSERT INTO mensajes_reclamo (id_solicitud, id_usuario, mensaje, fecha_creacion)
SELECT s.id_solicitud, s.id_usuario,
       CASE WHEN s.estado = 'Abierto'
            THEN 'Hola, necesito ayuda con este tema. Quedo atento a la orientacion del administrador.'
            ELSE 'Comparto los detalles de mi solicitud para que puedan revisarla, gracias.'
       END,
       s.fecha_creacion
FROM solicitudes_soporte s
WHERE s.tipo_solicitud = 'soporte'
  AND s.id_usuario IS NOT NULL
  AND s.fecha_creacion >= '2026-01-01'
  AND NOT EXISTS (SELECT 1 FROM mensajes_reclamo m WHERE m.id_solicitud = s.id_solicitud);

INSERT INTO mensajes_reclamo (id_solicitud, id_usuario, mensaje, fecha_creacion)
SELECT s.id_solicitud, 32,
       CASE s.estado
           WHEN 'Resuelto' THEN 'Hola, revisamos tu solicitud y confirmamos que ya fue atendida.'
           WHEN 'Rechazado' THEN 'Revisamos la solicitud y te explicamos por que no procede.'
           WHEN 'En revision' THEN 'El equipo administrativo esta revisando tu caso.'
           ELSE 'Recibimos tu solicitud y pronto te daremos una respuesta.'
       END,
       DATE_ADD(s.fecha_creacion, INTERVAL 1 DAY)
FROM solicitudes_soporte s
WHERE s.tipo_solicitud = 'soporte'
  AND s.fecha_creacion >= '2026-01-01'
  AND NOT EXISTS (
      SELECT 1 FROM mensajes_reclamo m
      WHERE m.id_solicitud = s.id_solicitud AND m.id_usuario = 32
  );

INSERT INTO notificaciones
    (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
SELECT 32, 'sistema', 'Nuevo ticket de soporte',
      CONCAT('El usuario ', COALESCE(s.id_usuario, 'desconocido'), ' creo el ticket de soporte #', s.id_solicitud, '.'),
       s.id_solicitud, FALSE, s.fecha_creacion
FROM solicitudes_soporte s
WHERE s.tipo_solicitud = 'soporte'
  AND s.id_usuario IS NOT NULL
  AND s.fecha_creacion >= '2026-01-01'
  AND NOT EXISTS (
      SELECT 1 FROM notificaciones n
      WHERE n.id_usuario = 32 AND n.tipo = 'sistema'
        AND n.titulo = 'Nuevo ticket de soporte'
        AND n.id_referencia = s.id_solicitud
  );

INSERT INTO notificaciones
    (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
SELECT s.id_usuario, 'sistema', 'Ticket de soporte actualizado',
       CONCAT('Tu ticket de soporte #', s.id_solicitud, ' esta en estado ', s.estado, '.'),
       s.id_solicitud, FALSE, s.fecha_creacion
FROM solicitudes_soporte s
WHERE s.tipo_solicitud = 'soporte'
  AND s.id_usuario IS NOT NULL
  AND s.fecha_creacion >= '2026-01-01'
  AND s.estado <> 'Abierto'
  AND NOT EXISTS (
      SELECT 1 FROM notificaciones n
      WHERE n.id_usuario = s.id_usuario AND n.tipo = 'sistema'
        AND n.titulo = 'Ticket de soporte actualizado'
        AND n.id_referencia = s.id_solicitud
  );

UPDATE solicitudes_soporte
SET id_tienda = NULL
WHERE tipo_solicitud = 'soporte';

SELECT '069 - Soporte directo poblado' AS resultado;
SELECT estado, COUNT(*) AS cantidad
FROM solicitudes_soporte
WHERE tipo_solicitud = 'soporte'
GROUP BY estado ORDER BY estado;

DROP TEMPORARY TABLE IF EXISTS tmp_estados_soporte_069;
DROP TEMPORARY TABLE IF EXISTS tmp_usuarios_soporte_069;