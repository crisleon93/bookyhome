-- ============================================================
-- Migración 021: Estandarizar estados de tienda
-- Fecha: 2026-08-26
-- Descripción:
--   1. Normaliza los valores actuales en la tabla tiendas
--      para que coincidan con los 5 estados canónicos.
--   2. Actualiza el DEFAULT a 'pendiente' (las tiendas nuevas
--      deben ser revisadas antes de activarse).
--   3. Agrega un CHECK constraint que restringe los valores
--      permitidos en estado_tienda.
--
-- Estados válidos: activa | pendiente | vacaciones | suspendida | inactiva
-- ============================================================

-- Paso 1: Normalizar valores existentes
UPDATE tiendas SET estado_tienda = 'activa'
  WHERE LOWER(TRIM(estado_tienda)) IN ('activo','activa','habilitado','habilitada','aprobado','aprobada');

UPDATE tiendas SET estado_tienda = 'pendiente'
  WHERE LOWER(TRIM(estado_tienda)) IN ('pendiente','en revision','en revisión','por revisar');

UPDATE tiendas SET estado_tienda = 'vacaciones'
  WHERE LOWER(TRIM(estado_tienda)) IN ('vacaciones','en vacaciones','pausado','pausada');

UPDATE tiendas SET estado_tienda = 'suspendida'
  WHERE LOWER(TRIM(estado_tienda)) IN ('suspendido','suspendida');

UPDATE tiendas SET estado_tienda = 'inactiva'
  WHERE LOWER(TRIM(estado_tienda)) IN ('inactivo','inactiva')
     OR estado_tienda IS NULL
     OR TRIM(estado_tienda) = '';

-- Paso 2: Modificar columna con CHECK constraint y nuevo DEFAULT
ALTER TABLE tiendas
  MODIFY COLUMN estado_tienda VARCHAR(50)
    NOT NULL
    DEFAULT 'pendiente'
    CHECK (estado_tienda IN ('activa', 'pendiente', 'vacaciones', 'suspendida', 'inactiva'));
