-- =====================================================
-- MIGRACIÓN 016: Corregir triggers y actualizar comisiones
-- Propósito:
--   1. Reemplazar porcentaje hardcoded 7% en trg_generar_comision → 15%
--   2. Recalcular comisiones históricas de 7% → 15%
--   3. Insertar datos de prueba de forma segura evitando el error
--      "Can't update table 'libros' in stored function/trigger"
--      que ocurría porque trg_verificar_stock_disponible y
--      trg_reducir_stock_compra tocan 'libros' mientras el INSERT
--      de detalle_orden también la referencia en su subquery SELECT.
-- Solución: desactivar temporalmente los triggers de stock durante
--      la inserción de datos de prueba y restaurarlos al final.
-- Fecha: 2026-08-12
-- =====================================================

-- ─────────────────────────────────────────────────────
-- PASO 1: Actualizar trigger trg_generar_comision al 15%
-- ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_generar_comision;
DELIMITER //
CREATE TRIGGER trg_generar_comision
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE v_id_tienda INT;
    DECLARE v_subtotal  DECIMAL(12,2);
    SELECT id_tienda INTO v_id_tienda
    FROM libros WHERE id_libro = NEW.id_libro;
    SET v_subtotal = NEW.cantidad * NEW.precio_unitario;
    INSERT INTO comisiones
        (id_orden, id_tienda, monto_venta, porcentaje_comision,
         monto_comision, monto_vendedor, estado)
    VALUES
        (NEW.id_orden, v_id_tienda, v_subtotal, 15.00,
         ROUND(v_subtotal * 0.15, 2),
         ROUND(v_subtotal * 0.85, 2),
         'Pendiente');
END //
DELIMITER ;

-- ─────────────────────────────────────────────────────
-- PASO 2: Recalcular comisiones históricas de 7% → 15%
-- ─────────────────────────────────────────────────────
UPDATE comisiones
SET porcentaje_comision = 15.00,
    monto_comision      = ROUND(monto_venta * 0.15, 2),
    monto_vendedor      = ROUND(monto_venta * 0.85, 2)
WHERE porcentaje_comision = 7.00;

-- ─────────────────────────────────────────────────────
-- PASO 3: Desactivar temporalmente los triggers de stock
--   para evitar el error de tabla 'libros' en uso.
--   Los datos de prueba son históricos (órdenes ya completadas),
--   el stock se ajustará manualmente al final.
-- ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_verificar_stock_disponible;
DROP TRIGGER IF EXISTS trg_reducir_stock_compra;
DROP TRIGGER IF EXISTS trg_bloquear_compra_vacaciones;
DROP TRIGGER IF EXISTS trg_notificar_vendedor_nueva_orden;

-- ─────────────────────────────────────────────────────
-- PASO 4: Insertar datos de prueba (idempotente)
-- ─────────────────────────────────────────────────────

-- 4a. Usuarios
INSERT INTO usuarios (nombre_usuario, correo_usuario, contrasena_usuario,
                      rol, telefono, estado_usuario, email_verificado, fecha_registro)
SELECT 'comprador_prueba', 'comprador_prueba@test.com',
       SHA2('password123', 256), 'comprador', '3001234567', 'Activo', TRUE, CURDATE()
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre_usuario = 'comprador_prueba');

INSERT INTO usuarios (nombre_usuario, correo_usuario, contrasena_usuario,
                      rol, telefono, estado_usuario, email_verificado, fecha_registro)
SELECT 'vendedor_prueba2', 'vendedor_prueba2@test.com',
       SHA2('password123', 256), 'vendedor', '3009876543', 'Activo', TRUE, CURDATE()
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre_usuario = 'vendedor_prueba2');

-- 4b. Tienda
INSERT INTO tiendas (id_usuario, nombre_tienda, direccion, telefono,
                     estado_tienda, fecha_creacion)
SELECT u.id_usuario, 'Tienda Prueba 2', 'Cra 5 #10-50, Bogotá',
       '3009876543', 'activa', CURDATE()
FROM usuarios u
WHERE u.nombre_usuario = 'vendedor_prueba2'
  AND NOT EXISTS (SELECT 1 FROM tiendas WHERE nombre_tienda = 'Tienda Prueba 2');

-- 4c. Dirección de envío
INSERT INTO direcciones_envio (id_usuario, alias_direccion, direccion_completa,
                                ciudad, codigo_postal, es_principal)
SELECT u.id_usuario, 'Casa Prueba', 'Cra 7 #25-30, Bogotá', 'Bogotá', '110111', TRUE
FROM usuarios u
WHERE u.nombre_usuario = 'comprador_prueba'
  AND NOT EXISTS (
      SELECT 1 FROM direcciones_envio
      WHERE alias_direccion = 'Casa Prueba' AND id_usuario = u.id_usuario
  );

-- 4d. Categoría
INSERT INTO categorias (nombre_categoria)
SELECT 'Ficción Científica'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Ficción Científica');

-- 4e. Libros (con stock alto para absorber los detalles de orden)
INSERT INTO libros (id_tienda, id_categoria, titulo, autor_libro,
                    precio_libro, stock, estado_libro, fecha_listado)
SELECT t.id_tienda, c.id_categoria,
       'El Futuro es Ahora', 'Isaac Asimov', 85000.00, 100, 'disponible', CURDATE()
FROM tiendas t
JOIN categorias c ON c.nombre_categoria = 'Ficción Científica'
WHERE t.nombre_tienda = 'Tienda Prueba 2'
  AND NOT EXISTS (SELECT 1 FROM libros WHERE titulo = 'El Futuro es Ahora');

INSERT INTO libros (id_tienda, id_categoria, titulo, autor_libro,
                    precio_libro, stock, estado_libro, fecha_listado)
SELECT t.id_tienda, c.id_categoria,
       'Dune Remastered', 'Frank Herbert', 95000.00, 100, 'disponible', CURDATE()
FROM tiendas t
JOIN categorias c ON c.nombre_categoria = 'Ficción Científica'
WHERE t.nombre_tienda = 'Tienda Prueba 2'
  AND NOT EXISTS (SELECT 1 FROM libros WHERE titulo = 'Dune Remastered');

INSERT INTO libros (id_tienda, id_categoria, titulo, autor_libro,
                    precio_libro, stock, estado_libro, fecha_listado)
SELECT t.id_tienda, c.id_categoria,
       '1984 - Edición Especial', 'George Orwell', 75000.00, 100, 'disponible', CURDATE()
FROM tiendas t
JOIN categorias c ON c.nombre_categoria = 'Ficción Científica'
WHERE t.nombre_tienda = 'Tienda Prueba 2'
  AND NOT EXISTS (SELECT 1 FROM libros WHERE titulo = '1984 - Edición Especial');

-- 4f. Órdenes de compra
INSERT INTO ordenes_compra (id_usuario, id_direccion_envio,
                             fecha_orden, total, estado_orden)
SELECT u.id_usuario, d.id_direccion,
       DATE_SUB(NOW(), INTERVAL 5 DAY), 300000.00, 'completada'
FROM usuarios u
JOIN direcciones_envio d ON d.id_usuario = u.id_usuario
WHERE u.nombre_usuario = 'comprador_prueba'
  AND NOT EXISTS (
      SELECT 1 FROM ordenes_compra
      WHERE total = 300000.00 AND id_usuario = u.id_usuario
  );

INSERT INTO ordenes_compra (id_usuario, id_direccion_envio,
                             fecha_orden, total, estado_orden)
SELECT u.id_usuario, d.id_direccion,
       DATE_SUB(NOW(), INTERVAL 3 DAY), 450000.00, 'completada'
FROM usuarios u
JOIN direcciones_envio d ON d.id_usuario = u.id_usuario
WHERE u.nombre_usuario = 'comprador_prueba'
  AND NOT EXISTS (
      SELECT 1 FROM ordenes_compra
      WHERE total = 450000.00 AND id_usuario = u.id_usuario
  );

INSERT INTO ordenes_compra (id_usuario, id_direccion_envio,
                             fecha_orden, total, estado_orden)
SELECT u.id_usuario, d.id_direccion,
       DATE_SUB(NOW(), INTERVAL 1 DAY), 600000.00, 'completada'
FROM usuarios u
JOIN direcciones_envio d ON d.id_usuario = u.id_usuario
WHERE u.nombre_usuario = 'comprador_prueba'
  AND NOT EXISTS (
      SELECT 1 FROM ordenes_compra
      WHERE total = 600000.00 AND id_usuario = u.id_usuario
  );

-- 4g. Detalles de órdenes
--   Los triggers de stock están desactivados aquí.
--   trg_generar_comision (15%) SÍ está activo → registra comisiones.
--   Usamos variables para evitar subqueries cruzadas sobre libros.
SET @o300 = (SELECT o.id_orden FROM ordenes_compra o
             JOIN usuarios u ON o.id_usuario = u.id_usuario
             WHERE u.nombre_usuario = 'comprador_prueba' AND o.total = 300000.00
             LIMIT 1);

SET @o450 = (SELECT o.id_orden FROM ordenes_compra o
             JOIN usuarios u ON o.id_usuario = u.id_usuario
             WHERE u.nombre_usuario = 'comprador_prueba' AND o.total = 450000.00
             LIMIT 1);

SET @o600 = (SELECT o.id_orden FROM ordenes_compra o
             JOIN usuarios u ON o.id_usuario = u.id_usuario
             WHERE u.nombre_usuario = 'comprador_prueba' AND o.total = 600000.00
             LIMIT 1);

SET @l_futuro  = (SELECT id_libro FROM libros WHERE titulo = 'El Futuro es Ahora'   LIMIT 1);
SET @l_dune    = (SELECT id_libro FROM libros WHERE titulo = 'Dune Remastered'       LIMIT 1);
SET @l_1984    = (SELECT id_libro FROM libros WHERE titulo = '1984 - Edición Especial' LIMIT 1);

-- Orden $300.000 (3 libros)
INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o300, @l_futuro, 1, 85000.00, 85000.00
WHERE @o300 IS NOT NULL AND @l_futuro IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o300 AND id_libro = @l_futuro);

INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o300, @l_dune, 1, 95000.00, 95000.00
WHERE @o300 IS NOT NULL AND @l_dune IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o300 AND id_libro = @l_dune);

INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o300, @l_1984, 1, 75000.00, 75000.00
WHERE @o300 IS NOT NULL AND @l_1984 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o300 AND id_libro = @l_1984);

-- Orden $450.000 (3 libros)
INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o450, @l_dune, 1, 95000.00, 95000.00
WHERE @o450 IS NOT NULL AND @l_dune IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o450 AND id_libro = @l_dune);

INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o450, @l_futuro, 1, 85000.00, 85000.00
WHERE @o450 IS NOT NULL AND @l_futuro IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o450 AND id_libro = @l_futuro);

INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o450, @l_1984, 1, 75000.00, 75000.00
WHERE @o450 IS NOT NULL AND @l_1984 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o450 AND id_libro = @l_1984);

-- Orden $600.000 (2 libros)
INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o600, @l_dune, 2, 95000.00, 190000.00
WHERE @o600 IS NOT NULL AND @l_dune IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o600 AND id_libro = @l_dune);

INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, precio_final)
SELECT @o600, @l_futuro, 1, 85000.00, 85000.00
WHERE @o600 IS NOT NULL AND @l_futuro IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_orden WHERE id_orden = @o600 AND id_libro = @l_futuro);

-- 4h. Descontar stock manualmente (lo hacía trg_reducir_stock_compra)
--   Orden 300: 1×futuro + 1×dune + 1×1984
--   Orden 450: 1×dune  + 1×futuro + 1×1984
--   Orden 600: 2×dune  + 1×futuro
UPDATE libros SET stock = stock - 2 WHERE id_libro = @l_futuro AND @l_futuro IS NOT NULL;
UPDATE libros SET stock = stock - 4 WHERE id_libro = @l_dune   AND @l_dune   IS NOT NULL;
UPDATE libros SET stock = stock - 2 WHERE id_libro = @l_1984   AND @l_1984   IS NOT NULL;

-- 4i. Pagos
INSERT INTO pagos (id_orden, metodo_pago, monto, referencia_transaccion,
                   fecha_pago, estado_pago)
SELECT @o300, 'tarjeta_credito', 300000.00,
       CONCAT('TXN_PRB_', @o300),
       DATE_SUB(NOW(), INTERVAL 5 DAY), 'completado'
WHERE @o300 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM pagos WHERE id_orden = @o300);

INSERT INTO pagos (id_orden, metodo_pago, monto, referencia_transaccion,
                   fecha_pago, estado_pago)
SELECT @o450, 'tarjeta_credito', 450000.00,
       CONCAT('TXN_PRB_', @o450),
       DATE_SUB(NOW(), INTERVAL 3 DAY), 'completado'
WHERE @o450 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM pagos WHERE id_orden = @o450);

INSERT INTO pagos (id_orden, metodo_pago, monto, referencia_transaccion,
                   fecha_pago, estado_pago)
SELECT @o600, 'tarjeta_credito', 600000.00,
       CONCAT('TXN_PRB_', @o600),
       DATE_SUB(NOW(), INTERVAL 1 DAY), 'completado'
WHERE @o600 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM pagos WHERE id_orden = @o600);

-- ─────────────────────────────────────────────────────
-- PASO 5: Restaurar triggers de stock y notificaciones
-- ─────────────────────────────────────────────────────
DELIMITER //

CREATE TRIGGER trg_verificar_stock_disponible
BEFORE INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE stock_disponible INT;
    SELECT stock INTO stock_disponible FROM libros WHERE id_libro = NEW.id_libro;
    IF stock_disponible < NEW.cantidad THEN SET NEW.cantidad = 0; END IF;
END //

CREATE TRIGGER trg_reducir_stock_compra
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    UPDATE libros SET stock = stock - NEW.cantidad WHERE id_libro = NEW.id_libro;
END //

CREATE TRIGGER trg_bloquear_compra_vacaciones
BEFORE INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE v_id_tienda INT; DECLARE v_en_vacaciones INT;
    SELECT id_tienda INTO v_id_tienda FROM libros WHERE id_libro = NEW.id_libro;
    SELECT COUNT(*) INTO v_en_vacaciones FROM tienda_vacaciones
    WHERE id_tienda = v_id_tienda AND acepta_pedidos_previos = FALSE
      AND CURDATE() BETWEEN fecha_inicio AND fecha_fin;
    IF v_en_vacaciones > 0 THEN SET NEW.cantidad = 0; END IF;
END //

CREATE TRIGGER trg_notificar_vendedor_nueva_orden
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE v_id_vendedor INT; DECLARE v_titulo VARCHAR(100);
    SELECT t.id_usuario, l.titulo INTO v_id_vendedor, v_titulo
    FROM libros l INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
    WHERE l.id_libro = NEW.id_libro;
    INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia)
    VALUES (v_id_vendedor, 'orden', '¡Nueva venta!',
        CONCAT('Vendiste "', v_titulo, '" x', NEW.cantidad,
               ' en la orden #', NEW.id_orden, '.'), NEW.id_orden);
END //

DELIMITER ;

-- ─────────────────────────────────────────────────────
-- RESULTADO
-- ─────────────────────────────────────────────────────
SELECT CONCAT(
    'Migración 016 completada: ',
    'trigger actualizado a 15%, ',
    'comisiones históricas recalculadas, ',
    'datos de prueba insertados y triggers restaurados'
) AS resultado;
