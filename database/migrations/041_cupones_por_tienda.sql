-- =============================================================================
-- Migración 041: Cupones variados por tienda
-- Genera cupones para TODAS las tiendas existentes en la BD de forma dinámica.
-- Usa id_tienda % patrones para variar códigos, tipos y valores.
-- Cada tienda recibe 4 cupones: activo, activo-fijo, próximo y vencido.
-- =============================================================================

USE bookyhome;

-- -----------------------------------------------------------------------------
-- 1. Limpiar cupones del seed original (fechas hardcodeadas 2025 ya vencidas)
-- -----------------------------------------------------------------------------
DELETE FROM uso_cupones
WHERE id_cupon IN (
    SELECT id_cupon FROM cupones_descuento
    WHERE codigo_cupon IN (
        'ANA15','LECTURA5K','PAULA20','SARA10','VALENTINA25',
        'BIENVENIDO10','LIBROFEST'
    )
);
DELETE FROM cupones_descuento
WHERE codigo_cupon IN (
    'ANA15','LECTURA5K','PAULA20','SARA10','VALENTINA25',
    'BIENVENIDO10','LIBROFEST'
);

-- Limpiar cupones de ejecuciones anteriores de ESTA migración
-- (prefijos conocidos — permite re-ejecutar sin duplicados)
DELETE FROM uso_cupones
WHERE id_cupon IN (
    SELECT id_cupon FROM cupones_descuento
    WHERE codigo_cupon REGEXP '^T[0-9]+-'
);
DELETE FROM cupones_descuento
WHERE codigo_cupon REGEXP '^T[0-9]+-';

-- Limpiar globales anteriores de esta migración
DELETE FROM cupones_descuento
WHERE codigo_cupon IN ('BOOKFEST26','FELIALETRA');

-- -----------------------------------------------------------------------------
-- 2. Procedure que genera 4 cupones para UNA tienda
--    Patrón del código: T{id_tienda}-{TIPO}  (máx 20 chars, único por tienda)
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS _gen_cupones_tienda;
DELIMITER $$

CREATE PROCEDURE _gen_cupones_tienda(IN p_id INT)
proc_body: BEGIN
    -- Variables de patrón (rotamos con módulo para dar variedad visual)
    DECLARE v_pct1  DECIMAL(5,2);
    DECLARE v_pct2  DECIMAL(5,2);
    DECLARE v_fijo  DECIMAL(10,2);
    DECLARE v_min1  DECIMAL(10,2);
    DECLARE v_min2  DECIMAL(10,2);
    DECLARE v_umax1 INT;
    DECLARE v_umax2 INT;
    DECLARE v_cod_a VARCHAR(20);   -- activo porcentaje
    DECLARE v_cod_f VARCHAR(20);   -- activo fijo
    DECLARE v_cod_p VARCHAR(20);   -- próximo
    DECLARE v_cod_v VARCHAR(20);   -- vencido

    -- Códigos únicos por tienda
    SET v_cod_a = CONCAT('T', p_id, '-ACT');
    SET v_cod_f = CONCAT('T', p_id, '-FIJO');
    SET v_cod_p = CONCAT('T', p_id, '-PROX');
    SET v_cod_v = CONCAT('T', p_id, '-VENC');

    -- Salir si ya existen (idempotente)
    IF EXISTS (SELECT 1 FROM cupones_descuento WHERE codigo_cupon = v_cod_a) THEN
        LEAVE proc_body;
    END IF;

    -- Patrón de porcentaje activo: rota entre 8%, 10%, 12%, 15%, 18%, 20%, 25%
    SET v_pct1 = ELT((p_id MOD 7) + 1, 8, 10, 12, 15, 18, 20, 25);

    -- Patrón de porcentaje próximo: siempre un poco mayor
    SET v_pct2 = ELT((p_id MOD 5) + 1, 15, 20, 22, 25, 30);

    -- Descuento fijo: rota entre 3000, 4000, 5000, 6000, 7000, 8000, 10000
    SET v_fijo = ELT((p_id MOD 7) + 1, 3000, 4000, 5000, 6000, 7000, 8000, 10000);

    -- Mínimo de compra activo
    SET v_min1 = ELT((p_id MOD 6) + 1, 25000, 30000, 35000, 40000, 50000, 60000);

    -- Mínimo de compra fijo (un poco menor)
    SET v_min2 = ELT((p_id MOD 5) + 1, 20000, 25000, 30000, 35000, 40000);

    -- Usos máximos
    SET v_umax1 = ELT((p_id MOD 6) + 1, 30, 40, 50, 60, 80, 100);
    SET v_umax2 = ELT((p_id MOD 5) + 1, 15, 20, 25, 30, 40);

    -- Cupón 1: ACTIVO — porcentaje, vigente hoy
    INSERT INTO cupones_descuento
        (id_tienda, codigo_cupon, tipo_descuento, valor_descuento,
         minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin, activo)
    VALUES (
        p_id, v_cod_a, 'porcentaje', v_pct1, v_min1, v_umax1,
        FLOOR(v_umax1 * 0.15),                              -- usos actuales ~15%
        DATE_SUB(NOW(), INTERVAL ((p_id MOD 14) + 1) DAY),  -- inició hace 1-14 días
        DATE_ADD(NOW(), INTERVAL ((p_id MOD 20) + 10) DAY), -- vence en 10-29 días
        1
    );

    -- Cupón 2: ACTIVO — monto fijo, sin fecha fin
    INSERT INTO cupones_descuento
        (id_tienda, codigo_cupon, tipo_descuento, valor_descuento,
         minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin, activo)
    VALUES (
        p_id, v_cod_f, 'fijo', v_fijo, v_min2, v_umax2,
        FLOOR(v_umax2 * 0.1),                               -- usos actuales ~10%
        DATE_SUB(NOW(), INTERVAL ((p_id MOD 7) + 1) DAY),   -- inició hace 1-7 días
        NULL,                                                -- sin vencimiento
        1
    );

    -- Cupón 3: PRÓXIMO — aún no inicia
    INSERT INTO cupones_descuento
        (id_tienda, codigo_cupon, tipo_descuento, valor_descuento,
         minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin, activo)
    VALUES (
        p_id, v_cod_p, 'porcentaje', v_pct2,
        v_min1 + 10000,                                      -- mínimo un poco más alto
        v_umax2,
        0,
        DATE_ADD(NOW(), INTERVAL ((p_id MOD 10) + 5) DAY),  -- inicia en 5-14 días
        DATE_ADD(NOW(), INTERVAL ((p_id MOD 10) + 25) DAY), -- dura ~20 días
        1
    );

    -- Cupón 4: VENCIDO — ya expiró
    INSERT INTO cupones_descuento
        (id_tienda, codigo_cupon, tipo_descuento, valor_descuento,
         minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin, activo)
    VALUES (
        p_id, v_cod_v, 'fijo', v_fijo + 2000,
        v_min2,
        v_umax1,
        FLOOR(v_umax1 * 0.6),                                -- usos actuales ~60%
        DATE_SUB(NOW(), INTERVAL ((p_id MOD 60) + 30) DAY), -- inició hace 30-89 días
        DATE_SUB(NOW(), INTERVAL ((p_id MOD 20) + 5) DAY),  -- venció hace 5-24 días
        1
    );

END$$
DELIMITER ;

-- -----------------------------------------------------------------------------
-- 3. Llamar al procedure para CADA tienda existente
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS _poblar_todos_cupones;
DELIMITER $$

CREATE PROCEDURE _poblar_todos_cupones()
BEGIN
    DECLARE v_done  INT DEFAULT 0;
    DECLARE v_id    INT;
    DECLARE cur CURSOR FOR
        SELECT id_tienda FROM tiendas ORDER BY id_tienda;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN cur;
    loop_tiendas: LOOP
        FETCH cur INTO v_id;
        IF v_done THEN LEAVE loop_tiendas; END IF;
        CALL _gen_cupones_tienda(v_id);
    END LOOP;
    CLOSE cur;
END$$
DELIMITER ;

-- Ejecutar
CALL _poblar_todos_cupones();

-- -----------------------------------------------------------------------------
-- 4. Cupones globales de plataforma (sin id_tienda)
-- -----------------------------------------------------------------------------
INSERT INTO cupones_descuento
    (id_tienda, codigo_cupon, tipo_descuento, valor_descuento, minimo_compra,
     usos_maximos, usos_actuales, fecha_inicio, fecha_fin, activo)
VALUES
-- Activo permanente (bienvenida)
(NULL, 'BIENVENIDO10', 'porcentaje', 10.00, 30000, 500,  25,
    DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, 1),
-- Activo con vencimiento
(NULL, 'BOOKFEST26',   'fijo',       8000,  70000, 300,  58,
    DATE_SUB(NOW(), INTERVAL 5  DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 1),
-- Próximo
(NULL, 'FELIALETRA',   'porcentaje', 15.00, 50000, 200,   0,
    DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 50 DAY), 1),
-- Vencido
(NULL, 'LIBROFEST',    'fijo',       8000,  70000, 200,  47,
    DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY), 1);

-- -----------------------------------------------------------------------------
-- 5. Limpieza de procedures auxiliares
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS _gen_cupones_tienda;
DROP PROCEDURE IF EXISTS _poblar_todos_cupones;
