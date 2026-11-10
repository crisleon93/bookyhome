-- Garantiza al menos 8 conversaciones por comprador con tiendas reales.
-- Cada conversacion trata sobre un libro disponible y contiene mensajes de ambos lados.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_chats_objetivo;
CREATE TEMPORARY TABLE tmp_chats_objetivo AS
SELECT
    u.id_usuario,
    tienda.id_tienda,
    tienda.id_vendedor,
    tienda.id_libro,
    tienda.titulo,
    tienda.precio_libro,
    ROW_NUMBER() OVER (PARTITION BY u.id_usuario ORDER BY tienda.id_tienda) AS posicion
FROM usuarios u
CROSS JOIN (
    SELECT
        t.id_tienda,
        t.id_usuario AS id_vendedor,
        l.id_libro,
        l.titulo,
        l.precio_libro,
        ROW_NUMBER() OVER (PARTITION BY t.id_tienda ORDER BY l.id_libro) AS libro_posicion
    FROM tiendas t
    JOIN libros l ON l.id_tienda = t.id_tienda
    WHERE LOWER(COALESCE(l.estado_libro, 'activo')) NOT IN ('inactivo', 'agotado', 'eliminado')
) tienda
WHERE u.rol = 'comprador'
  AND tienda.libro_posicion = 1;

DELETE FROM tmp_chats_objetivo WHERE posicion > 8;

INSERT IGNORE INTO salasChats (id_usuario, id_tienda, creado_en, actualizado_en)
SELECT id_usuario, id_tienda,
       DATE_SUB(CURDATE(), INTERVAL MOD(id_usuario + id_tienda, 120) DAY),
       DATE_SUB(CURDATE(), INTERVAL MOD(id_usuario + id_tienda, 120) DAY)
FROM tmp_chats_objetivo;

DROP TEMPORARY TABLE IF EXISTS tmp_mensajes_chat;
CREATE TEMPORARY TABLE tmp_chat_turnos (orden INT PRIMARY KEY);
INSERT INTO tmp_chat_turnos (orden) VALUES (1), (2), (3);

CREATE TEMPORARY TABLE tmp_mensajes_chat AS
SELECT objetivo.id_usuario, objetivo.id_tienda, objetivo.id_vendedor, turno.orden,
       CASE turno.orden WHEN 2 THEN 'vendedor' ELSE 'comprador' END AS lado,
       CASE turno.orden
           WHEN 1 THEN CONCAT('Hola, estoy interesado en el libro "', objetivo.titulo, '". Todavia lo tienen disponible?')
           WHEN 2 THEN CONCAT('Hola, si lo tenemos disponible en nuestra libreria. El precio es $', FORMAT(objetivo.precio_libro, 0), '.')
           ELSE 'Perfecto, muchas gracias. Tambien quisiera saber cuanto tarda el envio.'
       END AS texto,
       turno.orden = 2 AS leido
FROM tmp_chats_objetivo objetivo
CROSS JOIN tmp_chat_turnos turno;

INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
SELECT sala.id_sala,
    CASE mensaje.lado WHEN 'comprador' THEN mensaje.id_usuario ELSE mensaje.id_vendedor END,
    mensaje.texto,
    DATE_ADD(DATE_SUB(CURDATE(), INTERVAL MOD(mensaje.id_usuario + mensaje.id_tienda, 120) DAY), INTERVAL mensaje.orden MINUTE),
    mensaje.leido
FROM tmp_mensajes_chat mensaje
JOIN salasChats sala
  ON sala.id_usuario = mensaje.id_usuario
 AND sala.id_tienda = mensaje.id_tienda
WHERE NOT EXISTS (
    SELECT 1 FROM mensajes existente WHERE existente.id_sala = sala.id_sala
);

UPDATE salasChats sala
JOIN tmp_chats_objetivo objetivo
  ON objetivo.id_usuario = sala.id_usuario
 AND objetivo.id_tienda = sala.id_tienda
SET sala.actualizado_en = COALESCE(
    (SELECT MAX(m.enviado_en) FROM mensajes m WHERE m.id_sala = sala.id_sala),
    sala.actualizado_en
);

SELECT '063 - Chats entre compradores y tiendas poblados' AS resultado,
       COUNT(*) AS conversaciones_objetivo
FROM tmp_chats_objetivo;

SELECT COUNT(*) AS compradores_con_8_tiendas
FROM (
    SELECT u.id_usuario, COUNT(DISTINCT sc.id_tienda) AS tiendas_chat
    FROM usuarios u
    JOIN salasChats sc ON sc.id_usuario = u.id_usuario
    WHERE u.rol = 'comprador'
    GROUP BY u.id_usuario
    HAVING COUNT(DISTINCT sc.id_tienda) >= 8
) verificacion;

DROP TEMPORARY TABLE IF EXISTS tmp_chats_objetivo;
DROP TEMPORARY TABLE IF EXISTS tmp_mensajes_chat;
DROP TEMPORARY TABLE IF EXISTS tmp_chat_turnos;