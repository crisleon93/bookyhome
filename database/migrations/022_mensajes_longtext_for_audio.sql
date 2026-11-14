-- Migracion 022: Ampliar columna mensaje a LONGTEXT para soporte de notas de voz
-- Necesaria porque los audios grabados se almacenan como base64 dentro del campo mensaje
-- con el prefijo [AUDIO]{...json con url base64, duracion, seg...}
-- Un audio de 10 segundos puede ocupar entre 50KB y 200KB en base64.
-- VARCHAR(500) no era suficiente.
--
-- Esta migracion ya fue aplicada manualmente el 2026-08-29.
-- Se documenta aqui para mantener el historial del esquema.

USE bookyhome;

ALTER TABLE mensajes
  MODIFY COLUMN mensaje LONGTEXT NOT NULL;

-- Verificacion
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'bookyhome'
  AND TABLE_NAME   = 'mensajes'
  AND COLUMN_NAME  = 'mensaje';
