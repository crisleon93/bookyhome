-- Script para insertar datos de prueba de Ventas, Impulsos y Planes para vendedores
-- Base de datos: bookyhome

USE bookyhome;

-- Desactivar restricciones de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- PRIMERO: CREAR TABLAS SI NO EXISTEN
-- =====================================================

-- Tabla de planes de herramientas del vendedor
CREATE TABLE IF NOT EXISTS planes_herramientas (
    id_plan INT AUTO_INCREMENT PRIMARY KEY,
    nombre_plan VARCHAR(50) NOT NULL,
    precio_mensual DECIMAL(10, 2) NOT NULL,
    estadisticas_basicas INT DEFAULT 0,
    estadisticas_avanzadas INT DEFAULT 0,
    exportar_reportes INT DEFAULT 0,
    soporte_prioritario INT DEFAULT 0,
    historial_meses INT DEFAULT 1,
    impulsos_con_descuento DECIMAL(5, 2) DEFAULT 0.00,
    descripcion TEXT
);

-- Tabla de suscripciones a planes de herramientas
CREATE TABLE IF NOT EXISTS suscripciones_herramientas (
    id_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_plan INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(50) DEFAULT 'Activa',
    metodo_pago VARCHAR(50),
    monto_pagado DECIMAL(10, 2),
    renovacion_automatica BOOLEAN DEFAULT FALSE
    -- FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    -- FOREIGN KEY (id_plan) REFERENCES planes_herramientas(id_plan)
);

-- Tabla de tipos de impulso
CREATE TABLE IF NOT EXISTS tipos_impulso (
    id_tipo_impulso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    duracion_dias INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de impulsos contratados
CREATE TABLE IF NOT EXISTS impulsos_contratados (
    id_impulso INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_tipo_impulso INT NOT NULL,
    id_libro INT,
    id_categoria INT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    monto_pagado DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Activo',
    impresiones INT DEFAULT 0,
    clics INT DEFAULT 0,
    ventas_generadas INT DEFAULT 0
    -- FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    -- FOREIGN KEY (id_tipo_impulso) REFERENCES tipos_impulso(id_tipo_impulso),
    -- FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    -- FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- =====================================================
-- SEGUNDO: INSERTAR PLANES DE HERRAMIENTAS
-- =====================================================

INSERT INTO planes_herramientas (
    id_plan, nombre_plan, precio_mensual,
    estadisticas_basicas, estadisticas_avanzadas, exportar_reportes, soporte_prioritario,
    historial_meses, impulsos_con_descuento, descripcion
) VALUES
(1, 'Gratuito', 0.00, 1, 0, 0, 0, 1, 0.00, 'Estadísticas del mes en curso, reportes en pantalla y soporte estándar 48h.'),
(2, 'Básico', 15000.00, 1, 1, 0, 0, 3, 5.00, 'Estadísticas de hasta 3 meses, gráficos interactivos básicos y 5% de descuento en impulsos.'),
(3, 'Estándar', 29000.00, 1, 1, 1, 1, 12, 10.00, 'Estadísticas de hasta 12 meses, exportación a Excel/PDF, soporte prioritario en 2h y 10% en impulsos.'),
(4, 'Premium', 49000.00, 1, 1, 1, 1, 24, 20.00, 'Acceso ilimitado de historial de 24 meses, herramientas SEO y marketing avanzadas, soporte ultra-prioritario en 1h y 20% en impulsos.')
ON DUPLICATE KEY UPDATE
    nombre_plan = VALUES(nombre_plan),
    precio_mensual = VALUES(precio_mensual),
    estadisticas_basicas = VALUES(estadisticas_basicas),
    estadisticas_avanzadas = VALUES(estadisticas_avanzadas),
    exportar_reportes = VALUES(exportar_reportes),
    soporte_prioritario = VALUES(soporte_prioritario),
    historial_meses = VALUES(historial_meses),
    impulsos_con_descuento = VALUES(impulsos_con_descuento),
    descripcion = VALUES(descripcion);

-- =====================================================
-- TERCERO: ACTUALIZAR TIPOS DE IMPULSO (sin duplicar)
-- Los tipos base ya existen en bookyhome.sql; solo normalizamos datos.
-- =====================================================

UPDATE tipos_impulso SET tipo = 'categoria' WHERE tipo = 'banner';

UPDATE tipos_impulso SET
    nombre = 'Libro destacado en Home',
    descripcion = 'Tu libro aparece destacado en la página principal por 7 días',
    precio = 25000.00,
    duracion_dias = 7,
    activo = 1
WHERE tipo = 'home';

UPDATE tipos_impulso SET
    nombre = 'Banner en categoría',
    descripcion = 'Banner promocional en la página de categoría por 5 días',
    precio = 18000.00,
    duracion_dias = 5,
    activo = 1
WHERE tipo = 'categoria';

UPDATE tipos_impulso SET
    nombre = 'Libro del Día',
    descripcion = 'Tu libro aparece como libro del día en la portada',
    precio = 35000.00,
    duracion_dias = 1,
    activo = 1
WHERE tipo = 'libro_dia';

UPDATE tipos_impulso SET
    nombre = 'Email a suscriptores',
    descripcion = 'Email promocional enviado a todos los suscriptores',
    precio = 22000.00,
    duracion_dias = 1,
    activo = 1
WHERE tipo = 'email';

UPDATE tipos_impulso t
INNER JOIN (
    SELECT tipo, MIN(id_tipo_impulso) AS id_conservar
    FROM tipos_impulso
    GROUP BY tipo
) canon ON t.tipo = canon.tipo AND t.id_tipo_impulso <> canon.id_conservar
SET t.activo = 0;

-- =====================================================
-- CUARTO: INSERTAR SUSCRIPCIONES DE PLANES (para vendedores existentes)
-- =====================================================

-- Suscripciones de prueba para tiendas de vendedores (IDs 26-30)
-- Asumimos que cada vendedor tiene una tienda con el mismo ID que su usuario

INSERT INTO suscripciones_herramientas (id_tienda, id_plan, fecha_inicio, fecha_fin, estado, metodo_pago, monto_pagado, renovacion_automatica) VALUES
-- Vendedor 26 (Tienda 26): Plan Básico
(26, 2, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Activa', 'Tarjeta de Crédito', 15000.00, TRUE),
-- Vendedor 27 (Tienda 27): Plan Estándar
(27, 3, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Activa', 'PSE', 29000.00, TRUE),
-- Vendedor 28 (Tienda 28): Plan Premium
(28, 4, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'Activa', 'Nequi', 49000.00, TRUE),
-- Vendedor 29 (Tienda 29): Plan Básico
(29, 2, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Activa', 'Daviplata', 15000.00, TRUE),
-- Vendedor 30 (Tienda 30): Plan Gratuito
(30, 1, DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Activa', 'Gratuito', 0.00, FALSE)
ON DUPLICATE KEY UPDATE
    id_plan = VALUES(id_plan),
    fecha_fin = VALUES(fecha_fin),
    estado = VALUES(estado),
    metodo_pago = VALUES(metodo_pago),
    monto_pagado = VALUES(monto_pagado),
    renovacion_automatica = VALUES(renovacion_automatica);

-- =====================================================
-- QUINTO: INSERTAR IMPULSOS CONTRATADOS
-- =====================================================

-- Impulsos de prueba para tiendas de vendedores (IDs 26-30)
-- Asumimos que existen libros con IDs para cada tienda

INSERT INTO impulsos_contratados (id_tienda, id_tipo_impulso, id_libro, fecha_inicio, fecha_fin, monto_pagado, estado) VALUES
-- Vendedor 26 (Tienda 26): Libro Destacado para libro 1 (con descuento 5% por plan Básico)
(26, 1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 23750.00, 'Activo'),
-- Vendedor 27 (Tienda 27): Banner Categoría para libro 2 (con descuento 10% por plan Estándar)
(27, 2, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY), 16200.00, 'Activo'),
-- Vendedor 28 (Tienda 28): Libro del Día para libro 3 (con descuento 20% por plan Premium)
(28, 3, 3, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 28000.00, 'Activo'),
-- Vendedor 29 (Tienda 29): Email Suscriptores (con descuento 5% por plan Básico)
(29, 4, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 20900.00, 'Finalizado'),
-- Vendedor 30 (Tienda 30): Libro Destacado para libro 4 (sin descuento por plan Gratuito)
(30, 1, 4, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 6 DAY), 25000.00, 'Activo')
ON DUPLICATE KEY UPDATE
    id_tipo_impulso = VALUES(id_tipo_impulso),
    fecha_fin = VALUES(fecha_fin),
    estado = VALUES(estado),
    monto_pagado = VALUES(monto_pagado);

-- =====================================================
-- SEXTO: INSERTAR VENTAS (ORDENES DE COMPRA)
-- =====================================================

-- Primero necesitamos direcciones de envío para los compradores (IDs 16-25)
INSERT INTO direcciones_envio (id_usuario, alias_direccion, direccion_completa, ciudad, codigo_postal, es_principal) VALUES
-- Dirección para comprador 16
(16, 'Casa Principal', 'Calle 123 #45-67, Barrio El Centro', 'Bogotá', '110111', TRUE),
-- Dirección para comprador 17
(17, 'Oficina', 'Avenida 789 #12-34, Edificio Torre Norte', 'Medellín', '050022', TRUE),
-- Dirección para comprador 18
(18, 'Apartamento', 'Carrera 45 #67-89, Apto 201', 'Cali', '760001', TRUE),
-- Dirección para comprador 19
(19, 'Casa Familia', 'Calle 89 #12-34, Barrio San José', 'Barranquilla', '080001', TRUE),
-- Dirección para comprador 20
(20, 'Residencia', 'Avenida 56 #78-90, Edificio Meridian', 'Pereira', '661001', TRUE)
ON DUPLICATE KEY UPDATE
    alias_direccion = VALUES(alias_direccion),
    direccion_completa = VALUES(direccion_completa),
    ciudad = VALUES(ciudad),
    codigo_postal = VALUES(codigo_postal),
    es_principal = VALUES(es_principal);

-- Ordenes de compra de prueba para compradores (IDs 16-25)
INSERT INTO ordenes_compra (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden) VALUES
-- Orden 1: Comprador 16 comprando por $50,000
(16, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 50000.00, 'pagado'),
-- Orden 2: Comprador 17 comprando por $80,000
(17, 2, DATE_SUB(NOW(), INTERVAL 3 DAY), 80000.00, 'pagado'),
-- Orden 3: Comprador 18 comprando por $120,000
(18, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), 120000.00, 'pagado'),
-- Orden 4: Comprador 19 comprando por $65,000
(19, 4, DATE_SUB(NOW(), INTERVAL 2 DAY), 65000.00, 'pagado'),
-- Orden 5: Comprador 20 comprando por $95,000 (pendiente)
(20, 5, NOW(), 95000.00, 'pendiente')
ON DUPLICATE KEY UPDATE
    total = VALUES(total),
    estado_orden = VALUES(estado_orden);

-- Detalle de las órdenes (asumiendo que existen libros con IDs 1-5 de diferentes tiendas)
INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final) VALUES
-- Orden 1: 2 libros del libro 1 (tienda 26) a $25,000 cada uno
(1, 1, 2, 25000.00, 0.00, 50000.00),
-- Orden 2: 1 libro del libro 2 (tienda 27) a $80,000
(2, 2, 1, 80000.00, 0.00, 80000.00),
-- Orden 3: 3 libros del libro 3 (tienda 28) a $40,000 cada uno
(3, 3, 3, 40000.00, 0.00, 120000.00),
-- Orden 4: 1 libro del libro 4 (tienda 29) a $65,000
(4, 4, 1, 65000.00, 0.00, 65000.00),
-- Orden 5: 1 libro del libro 5 (tienda 30) a $95,000
(5, 5, 1, 95000.00, 0.00, 95000.00)
ON DUPLICATE KEY UPDATE
    cantidad = VALUES(cantidad),
    precio_unitario = VALUES(precio_unitario),
    precio_final = VALUES(precio_final);

-- Pagos de las órdenes
INSERT INTO pagos (id_orden, metodo_pago, monto, referencia_transaccion, fecha_pago, estado_pago) VALUES
-- Pago de orden 1 (comprador 16)
(1, 'Tarjeta de Crédito', 50000.00, 'VISA-REF-12345', DATE_SUB(NOW(), INTERVAL 5 DAY), 'aprobado'),
-- Pago de orden 2 (comprador 17)
(2, 'PSE', 80000.00, 'PSE-REF-67890', DATE_SUB(NOW(), INTERVAL 3 DAY), 'aprobado'),
-- Pago de orden 3 (comprador 18)
(3, 'Nequi', 120000.00, 'NEQ-REF-11223', DATE_SUB(NOW(), INTERVAL 1 DAY), 'aprobado'),
-- Pago de orden 4 (comprador 19)
(4, 'Daviplata', 65000.00, 'DAVI-REF-99887', DATE_SUB(NOW(), INTERVAL 2 DAY), 'aprobado')
ON DUPLICATE KEY UPDATE
    metodo_pago = VALUES(metodo_pago),
    monto = VALUES(monto),
    referencia_transaccion = VALUES(referencia_transaccion),
    fecha_pago = VALUES(fecha_pago),
    estado_pago = VALUES(estado_pago);

-- =====================================================
-- CONFIRMACIÓN
-- =====================================================

SELECT '✅ Datos de prueba insertados exitosamente' AS mensaje;
SELECT '✅ Planes de herramientas' AS tipo, COUNT(*) AS cantidad FROM planes_herramientas;
SELECT '✅ Suscripciones activas (vendedores 26-30)' AS tipo, COUNT(*) AS cantidad FROM suscripciones_herramientas WHERE estado = 'Activa' AND id_tienda BETWEEN 26 AND 30;
SELECT '✅ Tipos de impulso' AS tipo, COUNT(*) AS cantidad FROM tipos_impulso;
SELECT '✅ Impulsos contratados (vendedores 26-30)' AS tipo, COUNT(*) AS cantidad FROM impulsos_contratados WHERE id_tienda BETWEEN 26 AND 30;
SELECT '✅ Ordenes de compra (compradores 16-25)' AS tipo, COUNT(*) AS cantidad FROM ordenes_compra WHERE id_usuario BETWEEN 16 AND 25;
SELECT '✅ Pagos realizados' AS tipo, COUNT(*) AS cantidad FROM pagos WHERE estado_pago = 'aprobado';

-- Resumen de distribución
SELECT 'Vendedores con planes activos' AS tipo, id_tienda, id_plan, estado FROM suscripciones_herramientas WHERE id_tienda BETWEEN 26 AND 30;
SELECT 'Compradores con ordenes' AS tipo, id_usuario, total, estado_orden FROM ordenes_compra WHERE id_usuario BETWEEN 16 AND 25;

-- Reactivar restricciones de foreign keys
SET FOREIGN_KEY_CHECKS = 1;