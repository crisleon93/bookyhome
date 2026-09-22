-- Migración 082: Eliminar suscripciones de planes pagos duplicadas
-- Causa: la migración 080 fue ejecutada dos veces.
-- Solución: por cada tienda con plan pago activo, conservar solo el registro
--           con el id_suscripcion más alto (el más reciente).

USE bookyhome;

SELECT 'Antes:' AS info;
SELECT ph.nombre_plan, COUNT(*) as tiendas
FROM suscripciones_herramientas sh
JOIN planes_herramientas ph ON ph.id_plan = sh.id_plan
WHERE sh.estado = 'Activa'
GROUP BY ph.id_plan, ph.nombre_plan;

-- Eliminar duplicados de planes pagos (id_plan > 1):
-- conservar el id_suscripcion MAX por tienda, borrar los otros.
DELETE sh
FROM suscripciones_herramientas sh
INNER JOIN (
    SELECT id_tienda, MAX(id_suscripcion) AS max_id
    FROM suscripciones_herramientas
    WHERE estado = 'Activa' AND id_plan > 1
    GROUP BY id_tienda
) keeper ON keeper.id_tienda = sh.id_tienda
WHERE sh.estado = 'Activa'
  AND sh.id_plan > 1
  AND sh.id_suscripcion < keeper.max_id;

SELECT 'Después:' AS info;
SELECT ph.nombre_plan, COUNT(*) as tiendas
FROM suscripciones_herramientas sh
JOIN planes_herramientas ph ON ph.id_plan = sh.id_plan
WHERE sh.estado = 'Activa'
GROUP BY ph.id_plan, ph.nombre_plan;

SELECT COUNT(DISTINCT id_tienda) AS tiendas_con_plan_activo
FROM suscripciones_herramientas
WHERE estado = 'Activa';

SELECT '082 - Suscripciones duplicadas eliminadas' AS resultado;
