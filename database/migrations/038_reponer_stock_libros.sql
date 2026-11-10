-- =============================================================================
-- Migración 038: Ajustar stock variado tras ventas masivas de migración 037
-- Objetivo: dejar un escenario realista para la demo del perfil vendedor:
--   ~15% libros agotados   (stock = 0)  → alerta roja
--   ~20% libros stock bajo (stock 1-3)  → alerta amarilla
--   ~35% libros stock medio (stock 4-10)
--   ~30% libros stock alto  (stock 11-30)
-- También restaura los triggers de stock por si la 037 los dejó caídos.
-- =============================================================================

USE bookyhome;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- PASO 1: Restaurar triggers de stock (idempotente)
-- =============================================================================

DROP TRIGGER IF EXISTS trg_verificar_stock_disponible;
DROP TRIGGER IF EXISTS trg_reducir_stock_compra;
DROP TRIGGER IF EXISTS trg_bloquear_compra_vacaciones;
DROP TRIGGER IF EXISTS trg_notificar_vendedor_nueva_orden;

DELIMITER $$

CREATE TRIGGER trg_verificar_stock_disponible
BEFORE INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE stock_disponible INT;
    SELECT stock INTO stock_disponible FROM libros WHERE id_libro = NEW.id_libro;
    IF stock_disponible < NEW.cantidad THEN SET NEW.cantidad = 0; END IF;
END$$

CREATE TRIGGER trg_reducir_stock_compra
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    UPDATE libros SET stock = stock - NEW.cantidad WHERE id_libro = NEW.id_libro;
END$$

CREATE TRIGGER trg_bloquear_compra_vacaciones
BEFORE INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE v_id_tienda     INT;
    DECLARE v_en_vacaciones INT;
    SELECT id_tienda INTO v_id_tienda FROM libros WHERE id_libro = NEW.id_libro;
    SELECT COUNT(*) INTO v_en_vacaciones
    FROM tienda_vacaciones
    WHERE id_tienda = v_id_tienda
      AND acepta_pedidos_previos = FALSE
      AND CURDATE() BETWEEN fecha_inicio AND fecha_fin;
    IF v_en_vacaciones > 0 THEN SET NEW.cantidad = 0; END IF;
END$$

CREATE TRIGGER trg_notificar_vendedor_nueva_orden
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE v_id_vendedor INT;
    DECLARE v_titulo      VARCHAR(100);
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

-- =============================================================================
-- PASO 2: Asignar stock variado a TODOS los libros según su id_libro
-- Se usa MOD para distribuir los rangos de forma determinista y uniforme.
--
--   id_libro MOD 20 = 0,1,2        → agotado   (stock = 0)   ~15%
--   id_libro MOD 20 = 3,4,5,6      → bajo      (stock 1-3)   ~20%
--   id_libro MOD 20 = 7..13        → medio     (stock 4-10)  ~35%
--   id_libro MOD 20 = 14..19       → alto      (stock 11-30) ~30%
--
-- Dentro de cada rango se usa otro MOD para variar el valor exacto.
-- =============================================================================

UPDATE libros
SET stock = CASE
    -- ── Agotado ──────────────────────────────────────────────────────
    WHEN (id_libro MOD 20) IN (0, 1, 2)
        THEN 0

    -- ── Stock bajo (1–3) ─────────────────────────────────────────────
    WHEN (id_libro MOD 20) IN (3, 4, 5, 6)
        THEN 1 + (id_libro MOD 3)           -- valores: 1, 2 o 3

    -- ── Stock medio (4–10) ───────────────────────────────────────────
    WHEN (id_libro MOD 20) IN (7, 8, 9, 10, 11, 12, 13)
        THEN 4 + (id_libro MOD 7)           -- valores: 4, 5, 6, 7, 8, 9 o 10

    -- ── Stock alto (11–30) ───────────────────────────────────────────
    ELSE
        11 + (id_libro MOD 20)              -- valores: 11 … 30
END;

-- =============================================================================
-- PASO 3: Sincronizar estado_libro según el stock resultante
-- =============================================================================

UPDATE libros
SET estado_libro = CASE
    WHEN stock = 0 THEN 'Agotado'
    ELSE                'Disponible'
END
WHERE estado_libro IN ('Disponible', 'Agotado');

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
SELECT '✅ 038 migración completada' AS resultado;

SELECT
    COUNT(*)                                                        AS total_libros,
    SUM(CASE WHEN stock = 0              THEN 1 ELSE 0 END)        AS agotados,
    SUM(CASE WHEN stock BETWEEN 1 AND 3  THEN 1 ELSE 0 END)        AS stock_bajo_1_3,
    SUM(CASE WHEN stock BETWEEN 4 AND 10 THEN 1 ELSE 0 END)        AS stock_medio_4_10,
    SUM(CASE WHEN stock > 10             THEN 1 ELSE 0 END)        AS stock_alto_mas_10,
    ROUND(AVG(stock), 1)                                           AS promedio_stock,
    MIN(stock)                                                      AS minimo,
    MAX(stock)                                                      AS maximo
FROM libros;

SELECT estado_libro, COUNT(*) AS cantidad
FROM libros
GROUP BY estado_libro
ORDER BY cantidad DESC;
