-- Migración 083: Cuentas bancarias para tiendas sin método de cobro registrado
-- Bancos colombianos reales, tipos de cuenta variados, números realistas
-- Solo inserta en tiendas que aún NO tienen ningún método de cobro

USE bookyhome;

SELECT CONCAT('Tiendas sin cuenta antes: ', COUNT(*)) AS info
FROM tiendas t
LEFT JOIN metodos_cobro_vendedor m ON m.id_tienda = t.id_tienda
WHERE m.id_metodo IS NULL;

-- Tabla temporal con datos de titulares por tienda (nombre del dueño de la tienda)
-- Usamos el nombre del usuario vendedor asociado a la tienda
INSERT INTO metodos_cobro_vendedor
    (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado)
SELECT
    t.id_tienda,
    -- tipo de cuenta rotando entre 4 opciones
    CASE MOD(t.id_tienda, 4)
        WHEN 0 THEN 'Ahorros'
        WHEN 1 THEN 'Corriente'
        WHEN 2 THEN 'Nequi'
        ELSE 'Daviplata'
    END AS tipo_cuenta,
    -- banco según tipo y distribución realista
    CASE MOD(t.id_tienda, 4)
        WHEN 0 THEN
            CASE MOD(t.id_tienda, 6)
                WHEN 0 THEN 'Bancolombia'
                WHEN 1 THEN 'Davivienda'
                WHEN 2 THEN 'Banco de Bogotá'
                WHEN 3 THEN 'BBVA Colombia'
                WHEN 4 THEN 'Scotiabank Colpatria'
                ELSE 'Banco Popular'
            END
        WHEN 1 THEN
            CASE MOD(t.id_tienda, 5)
                WHEN 0 THEN 'Bancolombia'
                WHEN 1 THEN 'Davivienda'
                WHEN 2 THEN 'Banco de Bogotá'
                WHEN 3 THEN 'Banco Agrario'
                ELSE 'AV Villas'
            END
        WHEN 2 THEN 'Bancolombia'   -- Nequi es de Bancolombia
        ELSE 'Davivienda'           -- Daviplata es de Davivienda
    END AS banco,
    -- número de cuenta
    CASE MOD(t.id_tienda, 4)
        WHEN 0 THEN  -- Ahorros: 10 dígitos
            LPAD(CAST((1000000000 + t.id_tienda * 7919 + 3571) AS CHAR), 10, '0')
        WHEN 1 THEN  -- Corriente: 11 dígitos
            LPAD(CAST((10000000000 + t.id_tienda * 6271 + 4973) AS CHAR), 11, '0')
        WHEN 2 THEN  -- Nequi: celular colombiano 3XX-XXXXXXX
            CONCAT('3', LPAD(CAST(MOD(t.id_tienda * 3137 + 10000000, 100000000) AS CHAR), 8, '0'))
        ELSE          -- Daviplata: celular colombiano
            CONCAT('30', LPAD(CAST(MOD(t.id_tienda * 2711 + 1000000, 10000000) AS CHAR), 7, '0'))
    END AS numero_cuenta,
    -- nombre titular = nombre del usuario
    u.nombre_usuario AS nombre_titular,
    -- cédula: generamos una realista (8-10 dígitos)
    LPAD(CAST(ABS(MOD(
        CAST(CONV(SUBSTRING(MD5(CONCAT(u.id_usuario, 'cc')), 1, 8), 16, 10) AS UNSIGNED),
        90000000
    ) + 10000000) AS CHAR), 8, '0') AS cedula_titular,
    1 AS es_principal,
    -- verificado: 80% sí, 20% no
    CASE WHEN MOD(t.id_tienda, 5) != 0 THEN 1 ELSE 0 END AS verificado
FROM tiendas t
INNER JOIN usuarios u ON u.id_usuario = t.id_usuario
WHERE t.id_tienda NOT IN (
    SELECT DISTINCT id_tienda FROM metodos_cobro_vendedor
);

SELECT CONCAT('Cuentas insertadas: ', ROW_COUNT()) AS resultado;

-- Verificación final
SELECT
    COUNT(DISTINCT m.id_tienda) AS tiendas_con_cuenta,
    COUNT(*) AS total_cuentas,
    SUM(CASE WHEN m.verificado = 1 THEN 1 ELSE 0 END) AS verificadas
FROM metodos_cobro_vendedor m;

SELECT CONCAT('Tiendas sin cuenta después: ', COUNT(*)) AS info
FROM tiendas t
LEFT JOIN metodos_cobro_vendedor m ON m.id_tienda = t.id_tienda
WHERE m.id_metodo IS NULL;

SELECT '083 - Cuentas bancarias colombianas asignadas a vendedores' AS resultado;
