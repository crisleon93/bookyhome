-- =============================================================================
-- Migracion 042: Corregir codificacion de notificaciones de ventas
-- =============================================================================

USE bookyhome;

-- Reparar notificaciones creadas por el trigger con el cliente en latin1.
UPDATE notificaciones
SET titulo = CONCAT(_utf8mb4 0xC2A1, 'Nueva venta!')
WHERE titulo = '??Nueva venta!';

-- Reparar el titulo del catalogo mostrado en las notificaciones de ejemplo.
UPDATE libros
SET titulo = CONCAT('El verano que me enamor', _utf8mb4 0xC3A9)
WHERE titulo = 'El verano que me enamor??';

DROP TRIGGER IF EXISTS trg_notificar_vendedor_nueva_orden;

DELIMITER $$

CREATE TRIGGER trg_notificar_vendedor_nueva_orden
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE v_id_vendedor INT;
    DECLARE v_titulo VARCHAR(100);

    SELECT t.id_usuario, l.titulo
      INTO v_id_vendedor, v_titulo
    FROM libros l
    INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
    WHERE l.id_libro = NEW.id_libro;

    INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia)
    VALUES (
        v_id_vendedor,
        'orden',
        CONCAT(_utf8mb4 0xC2A1, 'Nueva venta!'),
        CONCAT('Vendiste "', v_titulo, '" x', NEW.cantidad,
               ' en la orden #', NEW.id_orden, '.'),
        NEW.id_orden
    );
END$$

DELIMITER ;

SELECT '042 - Codificacion de notificaciones corregida' AS resultado;
