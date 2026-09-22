-- Limpia las referencias SEED055 y SEED056 de pagos y envios
-- para que no sean visibles en el frontend

USE bookyhome;

-- Actualizar referencias de transacción en pagos
UPDATE pagos
SET referencia_transaccion = CONCAT('BKH-', LPAD(id_pago, 8, '0'))
WHERE referencia_transaccion LIKE 'SEED055-%'
   OR referencia_transaccion LIKE 'SEED056-%';

-- Actualizar números de guía en envios
UPDATE envios
SET numero_guia = CONCAT('BKH-ENV-', LPAD(id_envio, 8, '0'))
WHERE numero_guia LIKE 'SEED055-%'
   OR numero_guia LIKE 'SEED056-%';

-- Verificar resultado
SELECT 'Pagos con referencia limpia (muestra):' AS info;
SELECT id_pago, referencia_transaccion
FROM pagos
WHERE referencia_transaccion LIKE 'BKH-%'
LIMIT 5;

SELECT 'Envios con guía limpia (muestra):' AS info;
SELECT id_envio, numero_guia
FROM envios
WHERE numero_guia LIKE 'BKH-ENV-%'
LIMIT 5;

SELECT '073 - Referencias seed limpiadas' AS resultado;
