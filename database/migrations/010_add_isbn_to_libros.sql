-- Migration: Agregar campo e indice ISBN a libros de forma idempotente.

USE bookyhome;

SET @isbn_column_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'libros'
      AND column_name = 'isbn'
);

SET @isbn_column_ddl := IF(
    @isbn_column_exists = 0,
    'ALTER TABLE libros ADD COLUMN isbn VARCHAR(20) NULL AFTER autor_libro',
    'SELECT 1'
);

PREPARE add_isbn_column FROM @isbn_column_ddl;
EXECUTE add_isbn_column;
DEALLOCATE PREPARE add_isbn_column;

SET @isbn_index_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'libros'
      AND index_name = 'idx_isbn'
);

SET @isbn_index_ddl := IF(
    @isbn_index_exists = 0,
    'CREATE INDEX idx_isbn ON libros (isbn)',
    'SELECT 1'
);

PREPARE add_isbn_index FROM @isbn_index_ddl;
EXECUTE add_isbn_index;
DEALLOCATE PREPARE add_isbn_index;
