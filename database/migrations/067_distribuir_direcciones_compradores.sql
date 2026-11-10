-- Distribuye las direcciones principales de compradores entre las ciudades del catalogo.
USE bookyhome;

DROP TEMPORARY TABLE IF EXISTS tmp_ciudades_067;
CREATE TEMPORARY TABLE tmp_ciudades_067 (
    posicion INT PRIMARY KEY,
    ciudad VARCHAR(50) NOT NULL,
    departamento VARCHAR(50) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL
);

INSERT INTO tmp_ciudades_067 (posicion, ciudad, departamento, codigo_postal) VALUES
(1, 'Bogota', 'Cundinamarca', '110111'),
(2, 'Medellin', 'Antioquia', '050022'),
(3, 'Cali', 'Valle del Cauca', '760001'),
(4, 'Barranquilla', 'Atlantico', '080001'),
(5, 'Bucaramanga', 'Santander', '680001'),
(6, 'Pereira', 'Risaralda', '660001'),
(7, 'Cartagena', 'Bolivar', '130001'),
(8, 'Santa Marta', 'Magdalena', '470001'),
(9, 'Manizales', 'Caldas', '170001'),
(10, 'Armenia', 'Quindio', '630001'),
(11, 'Ibague', 'Tolima', '730001'),
(12, 'Neiva', 'Huila', '410001'),
(13, 'Villavicencio', 'Meta', '500001'),
(14, 'Pasto', 'Narino', '520001');

DROP TEMPORARY TABLE IF EXISTS tmp_compradores_067;
CREATE TEMPORARY TABLE tmp_compradores_067 AS
SELECT id_usuario, ROW_NUMBER() OVER (ORDER BY id_usuario) AS posicion
FROM usuarios
WHERE rol = 'comprador';

INSERT INTO direcciones_envio
    (id_usuario, alias_direccion, direccion_completa, ciudad, departamento, codigo_postal, es_principal)
SELECT
    comprador.id_usuario,
    'Casa Principal',
    CONCAT('Calle ', MOD(comprador.id_usuario * 3, 90) + 10, ' #', MOD(comprador.id_usuario * 7, 80) + 10, '-', MOD(comprador.id_usuario * 11, 90) + 10, ', Barrio Centro'),
    ciudad.ciudad,
    ciudad.departamento,
    ciudad.codigo_postal,
    TRUE
FROM tmp_compradores_067 comprador
JOIN tmp_ciudades_067 ciudad
  ON ciudad.posicion = MOD(comprador.posicion - 1, 14) + 1
WHERE NOT EXISTS (
    SELECT 1 FROM direcciones_envio existente
    WHERE existente.id_usuario = comprador.id_usuario
);

UPDATE direcciones_envio d
JOIN usuarios u ON u.id_usuario = d.id_usuario
SET d.es_principal = FALSE
WHERE u.rol = 'comprador';

DROP TEMPORARY TABLE IF EXISTS tmp_direcciones_067;
CREATE TEMPORARY TABLE tmp_direcciones_067 AS
SELECT d.id_direccion, comprador.id_usuario, comprador.posicion,
       ciudad.ciudad, ciudad.departamento, ciudad.codigo_postal
FROM tmp_compradores_067 comprador
JOIN direcciones_envio d ON d.id_direccion = (
    SELECT MIN(d2.id_direccion)
    FROM direcciones_envio d2
    WHERE d2.id_usuario = comprador.id_usuario
)
JOIN tmp_ciudades_067 ciudad
  ON ciudad.posicion = MOD(comprador.posicion - 1, 14) + 1;

UPDATE direcciones_envio d
JOIN tmp_direcciones_067 objetivo ON objetivo.id_direccion = d.id_direccion
SET d.alias_direccion = 'Casa Principal',
    d.direccion_completa = CONCAT(
        CASE MOD(objetivo.posicion, 3)
            WHEN 0 THEN 'Calle '
            WHEN 1 THEN 'Carrera '
            ELSE 'Avenida '
        END,
        MOD(objetivo.id_usuario * 3, 90) + 10,
        ' #', MOD(objetivo.id_usuario * 7, 80) + 10,
        '-', MOD(objetivo.id_usuario * 11, 90) + 10,
        ', Barrio Centro'
    ),
    d.ciudad = objetivo.ciudad,
    d.departamento = objetivo.departamento,
    d.codigo_postal = objetivo.codigo_postal,
    d.es_principal = TRUE;

SELECT '067 - Direcciones de compradores distribuidas' AS resultado,
       COUNT(*) AS compradores_actualizados
FROM tmp_direcciones_067;

DROP TEMPORARY TABLE IF EXISTS tmp_direcciones_067;
DROP TEMPORARY TABLE IF EXISTS tmp_compradores_067;
DROP TEMPORARY TABLE IF EXISTS tmp_ciudades_067;