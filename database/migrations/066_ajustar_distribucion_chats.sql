-- Deja exactamente 8 librerias distribuidas por comprador.
-- Solo elimina salas vacias o con mensajes sinteticos de las migraciones 063/064.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_compradores_066;
CREATE TEMPORARY TABLE tmp_compradores_066 AS
SELECT id_usuario, ROW_NUMBER() OVER (ORDER BY id_usuario) AS posicion
FROM usuarios
WHERE rol = 'comprador';

DROP TEMPORARY TABLE IF EXISTS tmp_tiendas_066;
CREATE TEMPORARY TABLE tmp_tiendas_066 AS
SELECT id_tienda, ROW_NUMBER() OVER (ORDER BY id_tienda) AS posicion
FROM tiendas;

CREATE TEMPORARY TABLE tmp_turnos_066 (turno INT PRIMARY KEY);
INSERT INTO tmp_turnos_066 (turno) VALUES (0), (1), (2), (3), (4), (5), (6), (7);
SET @total_tiendas_066 = (SELECT COUNT(*) FROM tmp_tiendas_066);

DROP TEMPORARY TABLE IF EXISTS tmp_objetivos_066;
CREATE TEMPORARY TABLE tmp_objetivos_066 AS
SELECT comprador.id_usuario, tienda.id_tienda
FROM tmp_compradores_066 comprador
CROSS JOIN tmp_turnos_066 turno
JOIN tmp_tiendas_066 tienda
  ON tienda.posicion = MOD((comprador.posicion - 1) * 8 + turno.turno, @total_tiendas_066) + 1;

DROP TEMPORARY TABLE IF EXISTS tmp_salas_sinteticas_066;
CREATE TEMPORARY TABLE tmp_salas_sinteticas_066 AS
SELECT sala.id_sala
FROM salasChats sala
WHERE sala.id_usuario IN (SELECT id_usuario FROM tmp_compradores_066)
  AND NOT EXISTS (
      SELECT 1 FROM tmp_objetivos_066 objetivo
      WHERE objetivo.id_usuario = sala.id_usuario
        AND objetivo.id_tienda = sala.id_tienda
  )
  AND NOT EXISTS (
      SELECT 1
      FROM mensajes original
      WHERE original.id_sala = sala.id_sala
        AND original.mensaje NOT LIKE 'Hola, estoy interesado en el libro%'
        AND original.mensaje NOT LIKE 'Hola, quisiera informacion sobre%'
        AND original.mensaje NOT LIKE 'Hola, si lo tenemos disponible%'
        AND original.mensaje NOT LIKE 'Hola, con gusto.%'
        AND original.mensaje NOT LIKE 'Perfecto, muchas gracias.%'
        AND original.mensaje NOT LIKE 'Gracias, quedo atento%'
  );

DELETE mensaje
FROM mensajes mensaje
JOIN tmp_salas_sinteticas_066 sala ON sala.id_sala = mensaje.id_sala;

DELETE sala
FROM salasChats sala
JOIN tmp_salas_sinteticas_066 candidata ON candidata.id_sala = sala.id_sala;

SELECT '066 - Distribucion exacta de chats aplicada' AS resultado;

DROP TEMPORARY TABLE IF EXISTS tmp_objetivos_066;
DROP TEMPORARY TABLE IF EXISTS tmp_salas_sinteticas_066;
DROP TEMPORARY TABLE IF EXISTS tmp_turnos_066;
DROP TEMPORARY TABLE IF EXISTS tmp_tiendas_066;
DROP TEMPORARY TABLE IF EXISTS tmp_compradores_066;