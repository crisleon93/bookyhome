-- Quejas, reclamos y evidencias de compradores.
-- Compatible con versiones de MySQL que no soportan ADD COLUMN IF NOT EXISTS.
SET @schema := DATABASE();

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'solicitudes_soporte' AND column_name = 'id_usuario') = 0,
  'ALTER TABLE solicitudes_soporte ADD COLUMN id_usuario INT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Los tickets técnicos de compradores no pertenecen a una tienda concreta.
ALTER TABLE solicitudes_soporte MODIFY COLUMN id_tienda INT NULL;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'solicitudes_soporte' AND column_name = 'id_orden') = 0,
  'ALTER TABLE solicitudes_soporte ADD COLUMN id_orden INT NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'solicitudes_soporte' AND column_name = 'evidencia_url') = 0,
  'ALTER TABLE solicitudes_soporte ADD COLUMN evidencia_url VARCHAR(255) NULL',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'solicitudes_soporte' AND column_name = 'tipo_solicitud') = 0,
  'ALTER TABLE solicitudes_soporte ADD COLUMN tipo_solicitud VARCHAR(30) NOT NULL DEFAULT ''soporte''',
  'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
