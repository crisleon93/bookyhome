-- Actualiza email_publico de cada tienda con el correo real
-- del usuario dueno de la tienda.

USE bookyhome;

UPDATE tienda_configuracion tc
JOIN tiendas t ON t.id_tienda = tc.id_tienda
JOIN usuarios u ON u.id_usuario = t.id_usuario
SET tc.email_publico = u.correo_usuario;

-- Verificacion
SELECT 'Muestra:' AS info;
SELECT t.nombre_tienda, tc.email_publico
FROM tienda_configuracion tc
JOIN tiendas t ON t.id_tienda = tc.id_tienda
LIMIT 10;

SELECT '079 - Email publico actualizado con correo real del vendedor' AS resultado;
