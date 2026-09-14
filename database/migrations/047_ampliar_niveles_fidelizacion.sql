-- Amplia la escala de fidelizacion a 10 niveles tipo liga.
DROP FUNCTION IF EXISTS fn_nivel_cliente;

DELIMITER //
CREATE FUNCTION fn_nivel_cliente(p_id_usuario INT)
RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    DECLARE total_compras DECIMAL(12,2);
    SELECT IFNULL(SUM(total), 0) INTO total_compras
    FROM ordenes_compra
    WHERE id_usuario = p_id_usuario
      AND estado_orden NOT IN ('Cancelada', 'Pendiente');

    IF total_compras >= 6500000 THEN RETURN 'Platino';
    ELSEIF total_compras >= 4500000 THEN RETURN 'Onix';
    ELSEIF total_compras >= 3200000 THEN RETURN 'Diamante';
    ELSEIF total_compras >= 2300000 THEN RETURN 'Obsidiana';
    ELSEIF total_compras >= 1700000 THEN RETURN 'Perla';
    ELSEIF total_compras >= 1200000 THEN RETURN 'Amatista';
    ELSEIF total_compras >= 800000 THEN RETURN 'Esmeralda';
    ELSEIF total_compras >= 500000 THEN RETURN 'Rubi';
    ELSEIF total_compras >= 300000 THEN RETURN 'Zafiro';
    ELSEIF total_compras >= 150000 THEN RETURN 'Oro';
    ELSEIF total_compras >= 50000 THEN RETURN 'Plata';
    ELSE RETURN 'Bronce';
    END IF;
END //
DELIMITER ;
