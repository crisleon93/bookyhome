-- Migration: agregar soporte para verificación de correo electrónico en usuarios
-- Ejecutar sobre la base de datos bookyhome
-- Es idempotente: si la columna ya existe, no intenta volver a agregarla.

SET @schema := DATABASE();

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'email_verificado') = 0,
    'ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN DEFAULT FALSE AFTER estado_usuario',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'token_verificacion') = 0,
    'ALTER TABLE usuarios ADD COLUMN token_verificacion VARCHAR(255) DEFAULT NULL AFTER email_verificado',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'fecha_verificacion') = 0,
    'ALTER TABLE usuarios ADD COLUMN fecha_verificacion DATE DEFAULT NULL AFTER token_verificacion',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Para no romper cuentas existentes, se marcan como verificadas si no tienen token pendiente.
UPDATE usuarios
SET email_verificado = TRUE
WHERE COALESCE(email_verificado, FALSE) = FALSE
  AND (token_verificacion IS NULL OR TRIM(token_verificacion) = '');

-- Limpiar tokens vacíos para evitar inconsistencias.
UPDATE usuarios
SET token_verificacion = NULL
WHERE token_verificacion IS NOT NULL AND TRIM(token_verificacion) = '';
