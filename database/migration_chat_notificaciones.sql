-- =====================================================
-- MIGRACIÓN: Agregar tablas para Chat, Notificaciones e Historial
-- =====================================================

-- ============= TABLA: NOTIFICACIONES =============

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    referencia_id INT,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    INDEX idx_usuario (id_usuario),
    INDEX idx_leida (leida),
    INDEX idx_fecha (fecha_creacion)
);

-- ============= TABLA: HISTORIAL_INTERACCIONES =============

CREATE TABLE IF NOT EXISTS historial_interacciones (
    id_interaccion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    id_libro INT,
    id_tienda INT,
    descripcion VARCHAR(500),
    fecha_interaccion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    INDEX idx_usuario (id_usuario),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (fecha_interaccion)
);

-- ============= ALTERAR TABLA: SALASCHAT (si es necesario) =============

-- Las siguientes líneas aseguran que la estructura está correcta
-- Si la tabla ya existe, ALTER TABLE no hará cambios si los campos ya existen

ALTER TABLE salasChats 
ADD COLUMN IF NOT EXISTS creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============= ALTERAR TABLA: MENSAJES (si es necesario) =============

ALTER TABLE mensajes 
ADD COLUMN IF NOT EXISTS mensaje_leido BOOLEAN DEFAULT FALSE;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE QUERIES
-- =====================================================

-- Índices para salasChats
CREATE INDEX IF NOT EXISTS idx_sala_usuario ON salasChats(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sala_tienda ON salasChats(id_tienda);
CREATE INDEX IF NOT EXISTS idx_sala_actualizado ON salasChats(actualizado_en);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_mensaje_sala ON mensajes(id_sala);
CREATE INDEX IF NOT EXISTS idx_mensaje_remitente ON mensajes(id_remitente);
CREATE INDEX IF NOT EXISTS idx_mensaje_leido ON mensajes(mensaje_leido);
CREATE INDEX IF NOT EXISTS idx_mensaje_fecha ON mensajes(enviado_en);

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar notificaciones de ejemplo
INSERT INTO notificaciones (id_usuario, tipo, titulo, descripcion, referencia_id, leida) VALUES
(1, 'sistema', 'Bienvenido a BookyHome', 'Gracias por registrarte en nuestra plataforma', NULL, FALSE),
(1, 'oferta', 'Nueva oferta disponible', 'Hay una nueva oferta en tus libros favoritos', 1, TRUE),
(2, 'pedido', 'Pedido recibido', 'Tu pedido #001 ha sido recibido', NULL, TRUE),
(3, 'entrega', 'Tu envío está en camino', 'Tu pedido se entregará en 2 días', NULL, FALSE);

-- Insertar interacciones de ejemplo
INSERT INTO historial_interacciones (id_usuario, tipo, id_libro, id_tienda, descripcion) VALUES
(1, 'visualizacion', 1, 1, 'El usuario visualizó el libro'),
(1, 'compra', 1, 1, 'El usuario compró El Castillo Mágico'),
(1, 'resena', 1, 1, 'El usuario dejó una reseña'),
(2, 'visualizacion', 2, 1, 'El usuario visualizó el libro'),
(2, 'favorito', 2, 1, 'El usuario agregó a favoritos'),
(3, 'carrito', 3, 2, 'El usuario agregó al carrito');
