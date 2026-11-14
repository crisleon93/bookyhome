-- Asegura las tablas requeridas por los triggers de impulsos y soporte.
-- Es idempotente para bases existentes y volúmenes Docker persistentes.

USE bookyhome;

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
);