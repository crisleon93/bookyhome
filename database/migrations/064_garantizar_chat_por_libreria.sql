-- Garantiza al menos una conversacion con mensajes para cada libreria.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_compradores_chat;
CREATE TEMPORARY TABLE tmp_compradores_chat AS
SELECT id_usuario,
       ROW_NUMBER() OVER (ORDER BY id_usuario) AS posicion
FROM usuarios
WHERE rol = 'comprador';

DROP TEMPORARY TABLE IF EXISTS tmp_tiendas_chat;
CREATE TEMPORARY TABLE tmp_tiendas_chat AS
SELECT
    t.id_tienda,
    t.id_usuario AS id_vendedor,
    COALESCE(libro.id_libro, 0) AS id_libro,
    COALESCE(libro.titulo, 'un libro de tu catalogo') AS titulo,
    COALESCE(libro.precio_libro, 0) AS precio_libro,
    ROW_NUMBER() OVER (ORDER BY t.id_tienda) AS posicion
FROM tiendas t
LEFT JOIN (
    SELECT l.id_tienda, l.id_libro, l.titulo, l.precio_libro
    FROM libros l
    JOIN (
        SELECT id_tienda, MIN(id_libro) AS id_libro
        FROM libros
        WHERE LOWER(COALESCE(estado_libro, 'activo')) NOT IN ('inactivo', 'agotado', 'eliminado')
        GROUP BY id_tienda
    ) primero ON primero.id_libro = l.id_libro
) libro ON libro.id_tienda = t.id_tienda;

DROP TEMPORARY TABLE IF EXISTS tmp_chat_tienda_objetivo;
SET @total_compradores_chat = (SELECT COUNT(*) FROM tmp_compradores_chat);
CREATE TEMPORARY TABLE tmp_chat_tienda_objetivo AS
SELECT
    tienda.id_tienda,
    tienda.id_vendedor,
    tienda.id_libro,
    tienda.titulo,
    tienda.precio_libro,
    comprador.id_usuario
FROM tmp_tiendas_chat tienda
JOIN tmp_compradores_chat comprador
    ON comprador.posicion = MOD(tienda.posicion - 1, @total_compradores_chat) + 1;

INSERT IGNORE INTO salasChats (id_usuario, id_tienda, creado_en, actualizado_en)
SELECT id_usuario, id_tienda,
       DATE_SUB(CURDATE(), INTERVAL MOD(id_usuario + id_tienda, 120) DAY),
       DATE_SUB(CURDATE(), INTERVAL MOD(id_usuario + id_tienda, 120) DAY)
FROM tmp_chat_tienda_objetivo;

DROP TEMPORARY TABLE IF EXISTS tmp_chat_turnos_064;
CREATE TEMPORARY TABLE tmp_chat_turnos_064 (orden INT PRIMARY KEY);
INSERT INTO tmp_chat_turnos_064 (orden) VALUES (1), (2), (3);

DROP TEMPORARY TABLE IF EXISTS tmp_mensajes_064;
CREATE TEMPORARY TABLE tmp_mensajes_064 AS
SELECT objetivo.id_usuario, objetivo.id_tienda, objetivo.id_vendedor,
       turno.orden,
       CASE turno.orden WHEN 2 THEN 'vendedor' ELSE 'comprador' END AS lado,
       CASE turno.orden
           WHEN 1 THEN CONCAT('Hola, quisiera informacion sobre ', objetivo.titulo, '.')
           WHEN 2 THEN CONCAT('Hola, con gusto. El precio es $', FORMAT(objetivo.precio_libro, 0), ' y podemos ayudarte con el envio.')
           ELSE 'Gracias, quedo atento para realizar la compra.'
       END AS texto,
       turno.orden = 2 AS leido
FROM tmp_chat_tienda_objetivo objetivo
CROSS JOIN tmp_chat_turnos_064 turno;

INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
SELECT sala.id_sala,
       CASE mensaje.lado WHEN 'comprador' THEN mensaje.id_usuario ELSE mensaje.id_vendedor END,
       mensaje.texto,
       DATE_ADD(DATE_SUB(CURDATE(), INTERVAL MOD(mensaje.id_usuario + mensaje.id_tienda, 120) DAY), INTERVAL mensaje.orden MINUTE),
       mensaje.leido
FROM tmp_mensajes_064 mensaje
JOIN salasChats sala
  ON sala.id_usuario = mensaje.id_usuario
 AND sala.id_tienda = mensaje.id_tienda
WHERE NOT EXISTS (
    SELECT 1 FROM mensajes existente WHERE existente.id_sala = sala.id_sala
);

UPDATE salasChats sala
JOIN tmp_chat_tienda_objetivo objetivo
  ON objetivo.id_usuario = sala.id_usuario
 AND objetivo.id_tienda = sala.id_tienda
SET sala.actualizado_en = COALESCE(
    (SELECT MAX(m.enviado_en) FROM mensajes m WHERE m.id_sala = sala.id_sala),
    sala.actualizado_en
);

SELECT '064 - Cada libreria tiene una conversacion' AS resultado,
       COUNT(*) AS librerias_objetivo
FROM tmp_chat_tienda_objetivo;

DROP TEMPORARY TABLE IF EXISTS tmp_mensajes_064;
DROP TEMPORARY TABLE IF EXISTS tmp_chat_turnos_064;
DROP TEMPORARY TABLE IF EXISTS tmp_chat_tienda_objetivo;
DROP TEMPORARY TABLE IF EXISTS tmp_tiendas_chat;
DROP TEMPORARY TABLE IF EXISTS tmp_compradores_chat;