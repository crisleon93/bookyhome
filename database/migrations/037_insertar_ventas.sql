-- =============================================================================
-- Migración 037: Insertar mínimo 40 ventas por tienda (150 tiendas)
-- Todo dentro del stored procedure para garantizar una sola sesión
-- =============================================================================

USE bookyhome;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- PASO 1: Direcciones para compradores sin ninguna
-- =============================================================================

INSERT INTO direcciones_envio (id_usuario, alias_direccion, direccion_completa, ciudad, departamento, codigo_postal, es_principal)
SELECT u.id_usuario,
       'Casa Principal',
       CONCAT('Calle ', (u.id_usuario * 3 MOD 99) + 1, ' #', (u.id_usuario * 7 MOD 50) + 1, '-', (u.id_usuario * 11 MOD 90) + 10),
       ELT((u.id_usuario MOD 10) + 1, 'Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga','Pereira','Manizales','Ibagué','Cúcuta'),
       ELT((u.id_usuario MOD 10) + 1, 'Cundinamarca','Antioquia','Valle del Cauca','Atlántico','Bolívar','Santander','Risaralda','Caldas','Tolima','Norte de Santander'),
       LPAD((u.id_usuario * 13 MOD 900000) + 100000, 6, '0'),
       TRUE
FROM usuarios u
WHERE u.rol = 'comprador'
  AND u.id_usuario NOT IN (SELECT DISTINCT id_usuario FROM direcciones_envio);

-- =============================================================================
-- PASO 2: Recrear el procedure con tablas temporales DENTRO de él
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_ventas_masivas_037;

DELIMITER $$

CREATE PROCEDURE sp_ventas_masivas_037()
BEGIN
    -- ---- Tablas temporales dentro del procedure ----
    DROP TEMPORARY TABLE IF EXISTS t_comp;
    DROP TEMPORARY TABLE IF EXISTS t_libros;
    DROP TEMPORARY TABLE IF EXISTS t_lib_count;

    CREATE TEMPORARY TABLE t_comp (
        fila_num INT NOT NULL,
        id_usuario INT NOT NULL,
        PRIMARY KEY (fila_num)
    );

    CREATE TEMPORARY TABLE t_libros (
        id_tienda   INT NOT NULL,
        idx_lib     INT NOT NULL,
        id_libro    INT NOT NULL,
        precio      DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (id_tienda, idx_lib)
    );

    CREATE TEMPORARY TABLE t_lib_count (
        id_tienda INT NOT NULL PRIMARY KEY,
        total     INT NOT NULL
    );

    -- Poblar compradores indexados
    BEGIN
        DECLARE v_uid INT;
        DECLARE v_row INT DEFAULT 0;
        DECLARE done_c INT DEFAULT 0;
        DECLARE cur_c CURSOR FOR SELECT id_usuario FROM usuarios WHERE rol='comprador' ORDER BY id_usuario;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done_c = 1;
        OPEN cur_c;
        c_loop: LOOP
            FETCH cur_c INTO v_uid;
            IF done_c THEN LEAVE c_loop; END IF;
            SET v_row = v_row + 1;
            INSERT INTO t_comp VALUES (v_row, v_uid);
        END LOOP c_loop;
        CLOSE cur_c;
    END;

    -- Poblar libros indexados por tienda
    BEGIN
        DECLARE v_tid INT;
        DECLARE v_lid INT;
        DECLARE v_pr  DECIMAL(10,2);
        DECLARE v_last_tid INT DEFAULT -1;
        DECLARE v_idx INT DEFAULT 0;
        DECLARE done_l INT DEFAULT 0;
        DECLARE cur_l CURSOR FOR SELECT id_tienda, id_libro, precio_libro FROM libros ORDER BY id_tienda, id_libro;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done_l = 1;
        OPEN cur_l;
        l_loop: LOOP
            FETCH cur_l INTO v_tid, v_lid, v_pr;
            IF done_l THEN LEAVE l_loop; END IF;
            IF v_tid != v_last_tid THEN
                SET v_idx = 1;
                SET v_last_tid = v_tid;
            ELSE
                SET v_idx = v_idx + 1;
            END IF;
            INSERT INTO t_libros VALUES (v_tid, v_idx, v_lid, v_pr);
        END LOOP l_loop;
        CLOSE cur_l;
    END;

    INSERT INTO t_lib_count SELECT id_tienda, MAX(idx_lib) FROM t_libros GROUP BY id_tienda;

    -- ---- Variables de trabajo ----
    BEGIN
        DECLARE v_id_tienda    INT;
        DECLARE v_done         INT DEFAULT 0;
        DECLARE v_id_orden     INT;
        DECLARE v_id_usuario   INT;
        DECLARE v_id_dir       INT;
        DECLARE v_id_libro1    INT;
        DECLARE v_id_libro2    INT;
        DECLARE v_precio1      DECIMAL(10,2);
        DECLARE v_precio2      DECIMAL(10,2);
        DECLARE v_cant1        INT;
        DECLARE v_cant2        INT;
        DECLARE v_total        DECIMAL(10,2);
        DECLARE v_estado_ord   VARCHAR(50);
        DECLARE v_estado_pago  VARCHAR(50);
        DECLARE v_estado_env   VARCHAR(50);
        DECLARE v_metodo       VARCHAR(50);
        DECLARE v_empresa      VARCHAR(50);
        DECLARE v_fecha        DATETIME;
        DECLARE v_dias         INT;
        DECLARE v_sale         INT;
        DECLARE v_cf           INT;
        DECLARE v_l1           INT;
        DECLARE v_l2           INT;
        DECLARE v_tot_comp     INT;
        DECLARE v_tot_lib      INT;

        DECLARE cur_t CURSOR FOR SELECT id_tienda FROM tiendas ORDER BY id_tienda;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

        SELECT COUNT(*) INTO v_tot_comp FROM t_comp;

        OPEN cur_t;
        t_loop: LOOP
            FETCH cur_t INTO v_id_tienda;
            IF v_done THEN LEAVE t_loop; END IF;

            SELECT total INTO v_tot_lib FROM t_lib_count WHERE id_tienda = v_id_tienda;

            SET v_sale = 0;
            WHILE v_sale < 45 DO

                -- Comprador rotativo
                SET v_cf = ((v_id_tienda * 7 + v_sale * 3) MOD v_tot_comp) + 1;
                SELECT id_usuario INTO v_id_usuario FROM t_comp WHERE fila_num = v_cf;

                -- Dirección
                SELECT id_direccion INTO v_id_dir
                FROM direcciones_envio WHERE id_usuario = v_id_usuario
                ORDER BY es_principal DESC, id_direccion ASC LIMIT 1;

                -- Libros
                SET v_l1 = ((v_sale * 2) MOD v_tot_lib) + 1;
                SET v_l2 = ((v_sale * 2 + 1) MOD v_tot_lib) + 1;

                SELECT id_libro, precio INTO v_id_libro1, v_precio1 FROM t_libros WHERE id_tienda = v_id_tienda AND idx_lib = v_l1;
                SELECT id_libro, precio INTO v_id_libro2, v_precio2 FROM t_libros WHERE id_tienda = v_id_tienda AND idx_lib = v_l2;

                -- Cantidades
                SET v_cant1 = (v_sale MOD 3) + 1;
                SET v_cant2 = ((v_sale + 1) MOD 2) + 1;

                -- Estado orden (9 ciclos → 6 estados)
                SET v_estado_ord = ELT(
                    (v_sale MOD 9) + 1,
                    'Entregada', 'Entregada', 'Enviada',
                    'Pendiente', 'Pagada',    'Entregada',
                    'Procesando','Cancelada', 'Enviada'
                );

                -- Total
                IF v_estado_ord IN ('Pendiente','Cancelada') THEN
                    SET v_total = v_precio1 * v_cant1;
                ELSE
                    SET v_total = (v_precio1 * v_cant1) + (v_precio2 * v_cant2);
                END IF;

                -- Pago / envío según estado
                SET v_estado_pago = CASE v_estado_ord
                    WHEN 'Entregada'  THEN 'Aprobado'
                    WHEN 'Enviada'    THEN 'Aprobado'
                    WHEN 'Pagada'     THEN 'Aprobado'
                    WHEN 'Procesando' THEN 'Aprobado'
                    WHEN 'Pendiente'  THEN 'Pendiente'
                    WHEN 'Cancelada'  THEN 'Rechazado'
                END;

                SET v_estado_env = CASE v_estado_ord
                    WHEN 'Entregada'  THEN 'Entregado'
                    WHEN 'Enviada'    THEN 'En Transito'
                    WHEN 'Pagada'     THEN 'Recogido'
                    WHEN 'Procesando' THEN 'Recogido'
                    WHEN 'Pendiente'  THEN 'Pendiente'
                    WHEN 'Cancelada'  THEN 'Cancelado'
                END;

                SET v_metodo = ELT((v_sale MOD 5)+1,'Tarjeta Credito','PSE','Nequi','Daviplata','Transferencia');
                SET v_empresa = ELT((v_sale MOD 5)+1,'Servientrega','Interrapidisimo','Coordinadora','TCC','Envia');

                -- Fecha distribuida últimos 18 meses
                SET v_dias = (v_id_tienda * 3 + v_sale * 13) MOD 548;
                SET v_fecha = DATE_SUB(NOW(), INTERVAL v_dias DAY);

                -- Insertar orden
                INSERT INTO ordenes_compra (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden)
                VALUES (v_id_usuario, v_id_dir, v_fecha, v_total, v_estado_ord);
                SET v_id_orden = LAST_INSERT_ID();

                -- Detalle
                IF v_estado_ord IN ('Pendiente','Cancelada') THEN
                    INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final)
                    VALUES (v_id_orden, v_id_libro1, v_cant1, v_precio1, 0.00, v_precio1 * v_cant1);
                ELSE
                    INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final)
                    VALUES (v_id_orden, v_id_libro1, v_cant1, v_precio1, 0.00, v_precio1 * v_cant1);
                    INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final)
                    VALUES (v_id_orden, v_id_libro2, v_cant2, v_precio2, 0.00, v_precio2 * v_cant2);
                END IF;

                -- Pago
                INSERT INTO pagos (id_orden, metodo_pago, monto, referencia_transaccion, fecha_pago, estado_pago)
                VALUES (
                    v_id_orden, v_metodo, v_total,
                    CONCAT('R',v_id_tienda,'S',v_sale,'T',UNIX_TIMESTAMP(v_fecha)),
                    CASE v_estado_pago WHEN 'Pendiente' THEN NULL ELSE DATE_ADD(v_fecha, INTERVAL 2 MINUTE) END,
                    v_estado_pago
                );

                -- Envío
                IF v_estado_ord != 'Pendiente' THEN
                    INSERT INTO envios (id_orden, id_tienda, empresa_mensajeria, numero_guia, costo_envio, fecha_estimada_entrega, fecha_despacho, estado_envio)
                    VALUES (
                        v_id_orden, v_id_tienda, v_empresa,
                        CONCAT('G',v_id_tienda,'S',v_sale),
                        IF(v_total > 80000, 10000.00, 5000.00),
                        DATE_ADD(v_fecha, INTERVAL (3 + v_sale MOD 4) DAY),
                        IF(v_estado_ord = 'Cancelada', NULL, DATE_ADD(v_fecha, INTERVAL 1 DAY)),
                        v_estado_env
                    );
                END IF;

                SET v_sale = v_sale + 1;
            END WHILE;

        END LOOP t_loop;
        CLOSE cur_t;
    END;

    DROP TEMPORARY TABLE IF EXISTS t_comp;
    DROP TEMPORARY TABLE IF EXISTS t_libros;
    DROP TEMPORARY TABLE IF EXISTS t_lib_count;
END$$

DELIMITER ;

-- =============================================================================
-- PASO 3: Ejecutar
-- =============================================================================

CALL sp_ventas_masivas_037();
DROP PROCEDURE IF EXISTS sp_ventas_masivas_037;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
SELECT '✅ 037 migración completada' AS resultado;
SELECT COUNT(*) AS total_ordenes FROM ordenes_compra;
SELECT estado_orden, COUNT(*) AS cantidad FROM ordenes_compra GROUP BY estado_orden ORDER BY cantidad DESC;
SELECT estado_pago, COUNT(*) AS cantidad FROM pagos GROUP BY estado_pago ORDER BY cantidad DESC;
SELECT estado_envio, COUNT(*) AS cantidad FROM envios GROUP BY estado_envio ORDER BY cantidad DESC;
SELECT MIN(v) AS min_ventas_tienda, MAX(v) AS max_ventas_tienda, AVG(v) AS avg_ventas_tienda
FROM (
    SELECT t.id_tienda, COUNT(DISTINCT oc.id_orden) AS v
    FROM tiendas t
    JOIN libros l ON l.id_tienda = t.id_tienda
    JOIN detalle_orden dor ON dor.id_libro = l.id_libro
    JOIN ordenes_compra oc ON oc.id_orden = dor.id_orden
    GROUP BY t.id_tienda
) resumen;
