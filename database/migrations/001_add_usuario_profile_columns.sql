-- Migration: agregar columnas de perfil al usuario si aún no existen
-- Ejecutar sobre la base de datos bookyhome

SET @schema := DATABASE();

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'telefono') = 0,
    'ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20) DEFAULT NULL AFTER correo_usuario',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'foto_perfil') = 0,
    'ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) DEFAULT NULL AFTER telefono',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'estado_usuario') = 0,
    'ALTER TABLE usuarios ADD COLUMN estado_usuario VARCHAR(20) DEFAULT ''Activo'' AFTER foto_perfil',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'preferencias') = 0,
    'ALTER TABLE usuarios ADD COLUMN preferencias TEXT DEFAULT NULL AFTER estado_usuario',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE usuarios
SET estado_usuario = COALESCE(NULLIF(estado_usuario, ''), 'Activo')
WHERE estado_usuario IS NULL OR TRIM(estado_usuario) = '';
