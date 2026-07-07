-- Datos de prueba para el chat entre Nicolas Vargas y Tienda Test Pausada
-- Ejecutar en la base de datos bookyhome

USE bookyhome;

-- 1. Obtener IDs (estos valores se basan en los datos existentes en bookyhome.sql)
-- Nicolas Vargas (comprador): id_usuario = 25
-- Tienda Test Pausada: id_tienda = 5 (corresponde a pausa@vacacionestest.co)
-- Usuario vendedor (pausa@vacacionestest.co): id_usuario = 15

-- 2. Crear sala de chat entre Nicolas y la tienda Test Pausada
INSERT INTO salasChats (id_usuario, id_tienda, creado_en, actualizado_en)
VALUES (25, 5, NOW(), NOW())
ON DUPLICATE KEY UPDATE actualizado_en = NOW();

-- Obtener el ID de la sala creada
SET @sala_id = LAST_INSERT_ID();

-- 3. Insertar mensajes de prueba
-- Mensaje 1: Nicolas inicia la conversación
INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
VALUES (@sala_id, 25, 'Hola, vi que tienen algunos libros interesantes en su tienda', NOW(), FALSE);

-- Mensaje 2: El vendedor responde
INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
VALUES (@sala_id, 15, '¡Hola! Gracias por escribirnos. ¿Qué libro te interesa?', DATE_ADD(NOW(), INTERVAL 5 MINUTE), FALSE);

-- Mensaje 3: Nicolas pregunta por un libro específico
INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
VALUES (@sala_id, 25, 'Estoy buscando el libro "Cien años de soledad", ¿lo tienen disponible?', DATE_ADD(NOW(), INTERVAL 10 MINUTE), FALSE);

-- Mensaje 4: El vendedor confirma disponibilidad
INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
VALUES (@sala_id, 15, 'Sí, lo tenemos disponible. Es una edición muy bonita, cuesta $45.000. ¿Te interesa?', DATE_ADD(NOW(), INTERVAL 15 MINUTE), FALSE);

-- Mensaje 5: Nicolas pregunta por el envío
INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
VALUES (@sala_id, 25, '¿Cuánto tardaría el envío a Bogotá y cuál sería el costo?', DATE_ADD(NOW(), INTERVAL 20 MINUTE), FALSE);

-- Mensaje 6: El vendedor responde sobre envío
INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
VALUES (@sala_id, 15, 'El envío a Bogotá toma 2-3 días hábiles y cuesta $8.000. Si lo compras hoy lo enviamos mañana mismo.', DATE_ADD(NOW(), INTERVAL 25 MINUTE), FALSE);

-- Mensaje 7: Nicolas confirma interés
INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
VALUES (@sala_id, 25, 'Perfecto, me interesa. ¿Cómo puedo hacer el pago?', DATE_ADD(NOW(), INTERVAL 30 MINUTE), FALSE);

-- 4. Actualizar timestamp de la sala
UPDATE salasChats 
SET actualizado_en = NOW() 
WHERE id_sala = @sala_id;

-- Mostrar resultado
SELECT 'Sala de chat creada con ID:' as mensaje, @sala_id as sala_id;
SELECT 'Mensajes insertados:' as mensaje, COUNT(*) as total FROM mensajes WHERE id_sala = @sala_id;
