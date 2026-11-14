USE bookyhome;

SET @oculto_column_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'libros'
      AND column_name = 'oculto'
);

SET @oculto_column_ddl := IF(
    @oculto_column_exists = 0,
    'ALTER TABLE libros ADD COLUMN oculto TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1'
);

PREPARE add_oculto_column FROM @oculto_column_ddl;
EXECUTE add_oculto_column;
DEALLOCATE PREPARE add_oculto_column;
