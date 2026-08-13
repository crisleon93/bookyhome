-- Migración: eliminar tipos de impulso duplicados
-- Causa: bookyhome.sql e insertar_datos_prueba.sql insertaron los mismos 4 tipos dos veces.

-- Normalizar alias legacy
UPDATE tipos_impulso SET tipo = 'categoria' WHERE tipo = 'banner';

-- Desactivar duplicados (conservar el registro con menor id por cada tipo)
UPDATE tipos_impulso t
INNER JOIN (
    SELECT tipo, MIN(id_tipo_impulso) AS id_conservar
    FROM tipos_impulso
    GROUP BY tipo
) canon ON t.tipo = canon.tipo AND t.id_tipo_impulso <> canon.id_conservar
SET t.activo = 0;

-- Asegurar nombres y descripciones canónicos en los 4 tipos activos
UPDATE tipos_impulso SET
    nombre = 'Libro destacado en Home',
    descripcion = 'Tu libro aparece en la sección principal.',
    precio = 25000.00,
    duracion_dias = 7,
    activo = 1
WHERE tipo = 'home';

UPDATE tipos_impulso SET
    nombre = 'Banner en categoría',
    descripcion = 'Tu tienda como banner en una categoría específica.',
    precio = 18000.00,
    duracion_dias = 5,
    activo = 1
WHERE tipo = 'categoria';

UPDATE tipos_impulso SET
    nombre = 'Libro del Día',
    descripcion = 'Solo un libro por día puede tener este impulso.',
    precio = 35000.00,
    duracion_dias = 1,
    activo = 1
WHERE tipo = 'libro_dia';

UPDATE tipos_impulso SET
    nombre = 'Email a suscriptores',
    descripcion = 'Email personalizado a todos los usuarios suscritos.',
    precio = 22000.00,
    duracion_dias = 1,
    activo = 1
WHERE tipo = 'email';
