-- Corregir codificacion UTF-8 de tipos_impulso y desactivar duplicados
SET NAMES utf8mb4;

UPDATE tipos_impulso SET
    nombre = 'Libro destacado en Home',
    descripcion = 'Tu libro aparece en la sección principal.',
    activo = 1
WHERE id_tipo_impulso = 1;

UPDATE tipos_impulso SET
    nombre = 'Banner en categoría',
    descripcion = 'Tu tienda como banner en una categoría específica.',
    activo = 1
WHERE id_tipo_impulso = 2;

UPDATE tipos_impulso SET
    nombre = 'Libro del Día',
    descripcion = 'Solo un libro por día puede tener este impulso.',
    activo = 1
WHERE id_tipo_impulso = 3;

UPDATE tipos_impulso SET
    nombre = 'Email a suscriptores',
    descripcion = 'Email personalizado a todos los usuarios suscritos.',
    activo = 1
WHERE id_tipo_impulso = 4;

UPDATE tipos_impulso SET activo = 0 WHERE id_tipo_impulso IN (5, 6, 7, 8);
