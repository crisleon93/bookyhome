-- Limpia las calificaciones historicas del seed.
-- Las nuevas calificaciones creadas desde la aplicacion no se eliminan.
USE bookyhome;

DELETE FROM calificaciones_tiendas;

SELECT '051 - Calificaciones historicas limpiadas' AS resultado;
