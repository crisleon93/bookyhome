-- Asegura las tablas requeridas por las vistas y funcionalidades de impulsos.
-- Es idempotente para bases existentes y volumenes Docker persistentes.

USE bookyhome;

CREATE TABLE IF NOT EXISTS tipos_impulso (
    id_tipo_impulso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    precio DECIMAL(10,2) NOT NULL,
    duracion_dias INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS impulsos_contratados (
    id_impulso INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_tipo_impulso INT NOT NULL,
    id_libro INT DEFAULT NULL,
    id_categoria INT DEFAULT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    monto_pagado DECIMAL(10,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'Activo',
    impresiones INT DEFAULT 0,
    clics INT DEFAULT 0,
    ventas_generadas INT DEFAULT 0,
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    FOREIGN KEY (id_tipo_impulso) REFERENCES tipos_impulso(id_tipo_impulso),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE IF NOT EXISTS pagos_impulsos (
    id_pago_impulso INT AUTO_INCREMENT PRIMARY KEY,
    id_impulso INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    referencia VARCHAR(100) DEFAULT NULL,
    estado_pago VARCHAR(30) DEFAULT 'Aprobado',
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_impulso) REFERENCES impulsos_contratados(id_impulso)
);
