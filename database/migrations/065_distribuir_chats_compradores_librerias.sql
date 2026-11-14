-- Distribuye 8 conversaciones por comprador entre todas las librerias.
-- Conserva las salas existentes y agrega solo las combinaciones faltantes.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_compradores_065;
CREATE TEMPORARY TABLE tmp_compradores_065 AS
SELECT id_usuario, ROW_NUMBER() OVER (ORDER BY id_usuario) AS posicion
FROM usuarios
WHERE rol = 'comprador';

DROP TEMPORARY TABLE IF EXISTS tmp_tiendas_065;
CREATE TEMPORARY TABLE tmp_tiendas_065 AS
SELECT
    t.id_tienda,
    t.id_usuario AS id_vendedor,
    COALESCE(libro.titulo, 'un libro de tu catalogo') AS titulo,
    COALESCE(libro.precio_libro, 0) AS precio_libro,
    ROW_NUMBER() OVER (ORDER BY t.id_tienda) AS posicion
FROM tiendas t
LEFT JOIN (
    SELECT l.id_tienda, l.titulo, l.precio_libro
    FROM libros l
    JOIN (
        SELECT id_tienda, MIN(id_libro) AS id_libro
        FROM libros
        WHERE LOWER(COALESCE(estado_libro, 'activo')) NOT IN ('inactivo', 'agotado', 'eliminado')
        GROUP BY id_tienda
    ) primero ON primero.id_libro = l.id_libro
) libro ON libro.id_tienda = t.id_tienda;

CREATE TEMPORARY TABLE tmp_turnos_065 (turno INT PRIMARY KEY);
INSERT INTO tmp_turnos_065 (turno) VALUES (0), (1), (2), (3), (4), (5), (6), (7);

DROP TEMPORARY TABLE IF EXISTS tmp_objetivos_065;
SET @total_tiendas_065 = (SELECT COUNT(*) FROM tmp_tiendas_065);
CREATE TEMPORARY TABLE tmp_objetivos_065 AS
SELECT
    comprador.id_usuario,
    tienda.id_tienda,
    tienda.id_vendedor,
    tienda.titulo,
    tienda.precio_libro,
    turno.turno
FROM tmp_compradores_065 comprador
CROSS JOIN tmp_turnos_065 turno
JOIN tmp_tiendas_065 tienda
    ON tienda.posicion = MOD((comprador.posicion - 1) * 8 + turno.turno, @total_tiendas_065) + 1;

INSERT IGNORE INTO salasChats (id_usuario, id_tienda, creado_en, actualizado_en)
SELECT id_usuario, id_tienda,
       DATE_SUB(CURDATE(), INTERVAL MOD(id_usuario + id_tienda + turno, 120) DAY),
       DATE_SUB(CURDATE(), INTERVAL MOD(id_usuario + id_tienda + turno, 120) DAY)
FROM tmp_objetivos_065;

DROP TEMPORARY TABLE IF EXISTS tmp_mensajes_065;
CREATE TEMPORARY TABLE tmp_mensajes_065 AS
SELECT objetivo.id_usuario, objetivo.id_tienda, objetivo.id_vendedor,
       turno.turno + 1 AS orden,
       CASE turno.turno WHEN 1 THEN 'vendedor' ELSE 'comprador' END AS lado,
       CASE turno.turno
           WHEN 0 THEN CONCAT('Hola, quisiera informacion sobre ', objetivo.titulo, '.')
           WHEN 1 THEN CONCAT('Hola, con gusto. El precio es $', FORMAT(objetivo.precio_libro, 0), ' y podemos ayudarte con el envio.')
           ELSE 'Gracias, quedo atento para realizar la compra.'
       END AS texto,
       turno.turno = 1 AS leido
FROM tmp_objetivos_065 objetivo
JOIN tmp_turnos_065 turno ON turno.turno < 3;

INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido)
SELECT sala.id_sala,
       CASE mensaje.lado WHEN 'comprador' THEN mensaje.id_usuario ELSE mensaje.id_vendedor END,
       mensaje.texto,
       DATE_ADD(DATE_SUB(CURDATE(), INTERVAL MOD(mensaje.id_usuario + mensaje.id_tienda + mensaje.orden, 120) DAY), INTERVAL mensaje.orden MINUTE),
       mensaje.leido
FROM tmp_mensajes_065 mensaje
JOIN salasChats sala
  ON sala.id_usuario = mensaje.id_usuario
 AND sala.id_tienda = mensaje.id_tienda
WHERE NOT EXISTS (
    SELECT 1 FROM mensajes existente WHERE existente.id_sala = sala.id_sala
);

SELECT '065 - Chats distribuidos entre librerias' AS resultado,
       COUNT(*) AS conversaciones_objetivo
FROM tmp_objetivos_065;

DROP TEMPORARY TABLE IF EXISTS tmp_mensajes_065;
DROP TEMPORARY TABLE IF EXISTS tmp_objetivos_065;
DROP TEMPORARY TABLE IF EXISTS tmp_turnos_065;
DROP TEMPORARY TABLE IF EXISTS tmp_tiendas_065;
DROP TEMPORARY TABLE IF EXISTS tmp_compradores_065;