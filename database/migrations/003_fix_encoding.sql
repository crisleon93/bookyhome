-- Corregir codificación UTF-8 de los mensajes
USE bookyhome;

-- Actualizar mensajes con caracteres especiales corregidos
UPDATE mensajes SET mensaje = '¡Hola! Gracias por escribirnos. ¿Qué libro te interesa?' WHERE id_mensaje = 17;
UPDATE mensajes SET mensaje = 'Estoy buscando el libro "Cien años de soledad", ¿lo tienen disponible?' WHERE id_mensaje = 18;
UPDATE mensajes SET mensaje = 'Sí, lo tenemos disponible. Es una edición muy bonita, cuesta $45.000. ¿Te interesa?' WHERE id_mensaje = 19;
UPDATE mensajes SET mensaje = '¿Cuánto tardaría el envío a Bogotá y cuál sería el costo?' WHERE id_mensaje = 20;
UPDATE mensajes SET mensaje = 'El envío a Bogotá toma 2-3 días hábiles y cuesta $8.000. Si lo compras hoy lo enviamos mañana mismo.' WHERE id_mensaje = 21;
UPDATE mensajes SET mensaje = 'Perfecto, me interesa. ¿Cómo puedo hacer el pago?' WHERE id_mensaje = 22;

SELECT 'Mensajes actualizados con codificación UTF-8' as mensaje;
