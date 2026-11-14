-- Corrige notificaciones de reseñas guardadas con texto mal codificado.
USE bookyhome;

UPDATE notificaciones
SET
    titulo = 'Calificacion actualizada',
    cuerpo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(cuerpo, ''), CONVERT(0xC383C2B3 USING utf8mb4), CONVERT(0xC3B3 USING utf8mb4)), CONVERT(0xC383C2AD USING utf8mb4), CONVERT(0xC3AD USING utf8mb4)), CONVERT(0xC383C2A1 USING utf8mb4), CONVERT(0xC3A1 USING utf8mb4)), CONVERT(0xC383C2A9 USING utf8mb4), CONVERT(0xC3A9 USING utf8mb4)), CONVERT(0xC383C2BA USING utf8mb4), CONVERT(0xC3BA USING utf8mb4)), CONVERT(0xC383C2B1 USING utf8mb4), CONVERT(0xC3B1 USING utf8mb4))
WHERE tipo = 'resena'
  AND titulo LIKE 'Calificaci%';

SELECT '061 - Codificacion de notificaciones de resenas corregida' AS resultado,
       ROW_COUNT() AS notificaciones_actualizadas;