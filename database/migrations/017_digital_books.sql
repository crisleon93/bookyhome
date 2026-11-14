-- Migration 017: Soporte para venta de libros digitales y rastreo de variantes

-- 1. Añadir campo para el archivo digital en libro_variantes
ALTER TABLE libro_variantes ADD COLUMN archivo_digital_url VARCHAR(255) NULL;

-- 2. Añadir id_variante al carrito_compras para saber qué versión se agrega
ALTER TABLE carrito_compras ADD COLUMN id_variante INT NULL;
ALTER TABLE carrito_compras ADD CONSTRAINT fk_carrito_variante FOREIGN KEY (id_variante) REFERENCES libro_variantes(id_variante) ON DELETE CASCADE;

-- 3. Añadir id_variante a detalle_orden para registro histórico
ALTER TABLE detalle_orden ADD COLUMN id_variante INT NULL;
-- (No agregamos foreign key estricta a detalle_orden en caso de que la variante se borre, pero sirve como referencia)

