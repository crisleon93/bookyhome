-- Limpia calificaciones precargadas de la cuenta demo de Camila.
-- Las nuevas calificaciones creadas desde la aplicacion no se eliminan.
USE bookyhome;

DELETE ct
FROM calificaciones_tiendas ct
JOIN usuarios u ON u.id_usuario = ct.id_usuario
WHERE u.correo_usuario = 'camila.rojas@gmail.com';

SELECT '050 - Calificaciones demo de Camila limpiadas' AS resultado;
