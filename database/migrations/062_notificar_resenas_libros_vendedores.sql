-- Genera notificaciones de reseñas de libros para los vendedores.
-- Es idempotente por vendedor y resena.
USE bookyhome;

INSERT INTO notificaciones
    (id_usuario, tipo, titulo, cuerpo, id_referencia, leida, fecha_creacion)
SELECT
    t.id_usuario,
    'resena',
    'Nueva resena de libro',
    CONCAT(u.nombre_usuario, ' dejo una resena de tu libro "', l.titulo,
           '" con ', r.calificacion, ' estrellas'),
    r.id_resena,
    FALSE,
    GREATEST(r.fecha_resena, '2026-01-01 00:00:00')
FROM resenas_libros r
JOIN usuarios u ON u.id_usuario = r.id_usuario
JOIN libros l ON l.id_libro = r.id_libro
JOIN tiendas t ON t.id_tienda = l.id_tienda
WHERE NOT EXISTS (
    SELECT 1
    FROM notificaciones n
    WHERE n.id_usuario = t.id_usuario
      AND n.tipo = 'resena'
      AND n.id_referencia = r.id_resena
);

SELECT '062 - Notificaciones de resenas de libros creadas' AS resultado,
       ROW_COUNT() AS notificaciones_creadas;