-- DROP DATABASE bookyhome;
CREATE DATABASE bookyhome;
USE bookyhome;

-- =====================================================
-- ▸ SECCIoN 1: TABLAS PRINCIPALES
-- =====================================================

DROP TABLE IF EXISTS pagos_impulsos;
DROP TABLE IF EXISTS impulsos_contratados;
DROP TABLE IF EXISTS tipos_impulso;
DROP TABLE IF EXISTS suscripciones_herramientas;
DROP TABLE IF EXISTS planes_herramientas;
DROP TABLE IF EXISTS solicitudes_soporte;
DROP TABLE IF EXISTS historial_pagos_vendedor;
DROP TABLE IF EXISTS comisiones;
DROP TABLE IF EXISTS libro_variantes;
DROP TABLE IF EXISTS metricas_tienda;
DROP TABLE IF EXISTS tienda_vacaciones;
DROP TABLE IF EXISTS metodos_cobro_vendedor;
DROP TABLE IF EXISTS tienda_configuracion;
DROP TABLE IF EXISTS lista_deseos_libros;
DROP TABLE IF EXISTS lista_deseos;
DROP TABLE IF EXISTS suscripciones_tienda;
DROP TABLE IF EXISTS reportes_contenido;
DROP TABLE IF EXISTS historial_precios;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS devoluciones;
DROP TABLE IF EXISTS uso_cupones;
DROP TABLE IF EXISTS cupones_descuento;
DROP TABLE IF EXISTS carrito_compras;
DROP TABLE IF EXISTS oferta_libros;
DROP TABLE IF EXISTS log_actividad;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS salasChats;
DROP TABLE IF EXISTS envios;
DROP TABLE IF EXISTS empresas_mensajeria;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS detalle_orden;
DROP TABLE IF EXISTS ordenes_compra;
DROP TABLE IF EXISTS resenas_libros;
DROP TABLE IF EXISTS calificaciones_tiendas;
DROP TABLE IF EXISTS favoritos;
DROP TABLE IF EXISTS ofertas;
DROP TABLE IF EXISTS imagenes_libro;
DROP TABLE IF EXISTS libros;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS tiendas;
DROP TABLE IF EXISTS direcciones_envio;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    correo_usuario VARCHAR(100) UNIQUE NOT NULL,
    contrasena_usuario VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    telefono VARCHAR(50),
    foto_perfil VARCHAR(255),
    estado_usuario VARCHAR(50) DEFAULT 'Activo',
    preferencias TEXT,
    email_verificado BOOLEAN DEFAULT FALSE,
    token_verificacion VARCHAR(255),
    fecha_verificacion DATE,
    fecha_registro DATE
);

CREATE TABLE tiendas (
    id_tienda INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_tienda VARCHAR(50) NOT NULL,
    direccion VARCHAR(100),
    telefono VARCHAR(50),
    estado_tienda VARCHAR(50) DEFAULT 'activa',
    fecha_creacion DATE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE direcciones_envio (
    id_direccion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    alias_direccion VARCHAR(50) NOT NULL,
    direccion_completa VARCHAR(200) NOT NULL,
    ciudad VARCHAR(50),
    codigo_postal VARCHAR(10),
    es_principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE libros (
    id_libro INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_categoria INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    autor_libro VARCHAR(50) NOT NULL,
    descripcion_libro VARCHAR(300),
    precio_libro DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    estado_libro VARCHAR(50),
    fecha_publicacion DATE,
    fecha_listado DATE,
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE imagenes_libro (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_libro INT NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro)
);

CREATE TABLE ofertas (
    id_oferta INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    nombre_oferta VARCHAR(100),
    tipo_descuento VARCHAR(20),
    valor_descuento DECIMAL(10, 2) NOT NULL,
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

CREATE TABLE favoritos (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_libro INT NOT NULL,
    fecha DATE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro)
);

CREATE TABLE resenas_libros (
    id_resena INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_libro INT NOT NULL,
    calificacion INT NOT NULL,
    comentario VARCHAR(500),
    fecha_resena DATETIME,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro)
);

CREATE TABLE calificaciones_tiendas (
    id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_tienda INT NOT NULL,
    calificacion INT NOT NULL,
    comentario VARCHAR(500),
    fecha_calificacion DATETIME,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

CREATE TABLE ordenes_compra (
    id_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_direccion_envio INT NOT NULL,
    fecha_orden DATETIME,
    total DECIMAL(10, 2) NOT NULL,
    estado_orden VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_direccion_envio) REFERENCES direcciones_envio(id_direccion)
);

CREATE TABLE detalle_orden (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_libro INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) DEFAULT 0.00,
    precio_final DECIMAL(10,2) DEFAULT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro)
);

CREATE TABLE pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    referencia_transaccion VARCHAR(100),
    fecha_pago DATETIME,
    estado_pago VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden)
);

CREATE TABLE envios (
    id_envio INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_tienda INT NOT NULL,
    id_empresa INT DEFAULT NULL,
    empresa_mensajeria VARCHAR(50),
    numero_guia VARCHAR(100),
    costo_envio DECIMAL(10, 2),
    fecha_estimada_entrega DATE,
    fecha_despacho DATE DEFAULT NULL,
    estado_envio VARCHAR(50),
    acuerdo_envio VARCHAR(200) DEFAULT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

CREATE TABLE salasChats (
    id_sala INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_tienda INT NOT NULL,
    creado_en DATETIME,
    actualizado_en DATETIME,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    UNIQUE KEY uk_sala (id_usuario, id_tienda)
);

CREATE TABLE mensajes (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_sala INT NOT NULL,
    id_remitente INT NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    enviado_en DATETIME,
    mensaje_leido BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_sala) REFERENCES salasChats(id_sala),
    FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario)
);


-- =====================================================
-- ▸ SECCIoN 2: DATOS DE PRUEBA
-- =====================================================

INSERT INTO usuarios (nombre_usuario, correo_usuario, contrasena_usuario, rol, fecha_registro) VALUES
('Carlos Gomez','carlos@gmail.com','hash_pass_01','usuario','2024-01-10'),
('Ana Martinez','ana@gmail.com','hash_pass_02','vendedor','2024-02-14'),
('Luis Perez','luis@gmail.com','hash_pass_03','usuario','2024-03-02'),
('Maria Lopez','maria@gmail.com','hash_pass_04','vendedor','2024-04-20'),
('Juan Torres','juan@gmail.com','hash_pass_05','usuario','2024-05-11'),
('Paula Castro','paula@gmail.com','hash_pass_06','vendedor','2024-06-04'),
('Pedro Diaz','pedro@gmail.com','hash_pass_07','usuario','2024-07-18'),
('Laura Rios','laura@gmail.com','hash_pass_08','vendedor','2024-08-09'),
('Daniel Mora','daniel@gmail.com','hash_pass_09','usuario','2024-09-12'),
('Sara Pena','sara@gmail.com','hash_pass_10','vendedor','2024-10-07'),
('Julian Ortiz','julian@gmail.com','hash_pass_11','usuario','2024-11-28'),
('Sofia Ramirez','sofia@gmail.com','hash_pass_12','vendedor','2024-12-03'),
('Camilo Vega','camilo@gmail.com','hash_pass_13','usuario','2025-01-15'),
('Valentina Cruz','valentina@gmail.com','hash_pass_14','vendedor','2025-02-08'),
('Miguel Hernandez','miguel@gmail.com','hash_pass_15','usuario','2025-03-01');

INSERT INTO tiendas (id_usuario, nombre_tienda, direccion, telefono, fecha_creacion) VALUES
(2,'Libros Ana','Carrera 5 #20-14','3022222222','2024-02-20'),
(4,'Lectura Viva','Calle 8 #45-21','3044444444','2024-04-22'),
(6,'Tienda Paula Books','Calle 3 #11-9','3066666666','2024-06-10'),
(8,'Historias Bellas','Cra 40 #9-6','3088888888','2024-08-14'),
(10,'Sara Books','Calle 7 #15-3','3101010101','2024-10-09'),
(12,'Sofia Reads','Calle 18 #21-2','3121212121','2024-12-10'),
(14,'Tienda Valentina','Cra 11 #22-5','3141414141','2025-02-12');

INSERT INTO categorias (nombre_categoria) VALUES
('Fantasia'), ('Romance'), ('Terror'), ('Ficcion'), ('Ciencia'),
('Tecnologia'), ('Ingenieria'), ('Infantil'), ('Juvenil'), ('Aventura'),
('Historia'), ('Educacion'), ('Arte'), ('Comedia'), ('Biografia');

INSERT INTO libros (id_tienda, titulo, autor_libro, descripcion_libro, precio_libro, stock, id_categoria, estado_libro, fecha_publicacion, fecha_listado) VALUES
(1,'El Castillo Magico','A. Torres','Libro de fantasia epica',35000,10,1,'Disponible','2023-01-01','2024-02-01'),
(1,'Amor en Invierno','L. Moreno','Novela romantica juvenil',28000,5,2,'Disponible','2023-03-01','2024-03-10'),
(2,'La Sombra Oscura','D. Salazar','Historia de terror psicologico',40000,7,3,'Disponible','2023-04-01','2024-04-12'),
(2,'Viaje a Orion','M. Rojas','Ficcion espacial futurista',45000,12,4,'Disponible','2023-05-01','2024-05-05'),
(3,'El Universo y Tu','J. Diaz','Divulgacion cientifica',50000,8,5,'Disponible','2023-06-01','2024-06-01'),
(3,'Codigo Maquinado','P. Castro','Libro sobre IA y desarrollo',60000,6,6,'Disponible','2023-07-01','2024-06-20'),
(4,'Principios de Ingenieria','C. Lopez','Conceptos avanzados',70000,9,7,'Disponible','2023-08-01','2024-07-10'),
(4,'Cuentos para Dormir','S. Nino','Relatos infantiles',25000,20,8,'Disponible','2023-09-01','2024-08-02'),
(5,'Juventud en Fuga','R. Perez','Libro juvenil contemporaneo',30000,11,9,'Disponible','2023-10-01','2024-09-09'),
(5,'Aventura en la Selva','M. Castro','Historia llena de aventuras',27000,13,10,'Disponible','2023-11-01','2024-10-01'),
(6,'Civilizaciones Antiguas','L. Rios','Libro historico educativo',65000,4,11,'Disponible','2023-12-01','2024-11-04'),
(6,'Aprende Matematicas','A. Vargas','Libro educativo basico',35000,15,12,'Disponible','2024-01-01','2024-12-01'),
(7,'Arte Moderno','S. Diaz','Analisis artistico moderno',55000,7,13,'Disponible','2024-02-01','2025-01-15'),
(7,'Humor y Vida','T. Gomez','Libro comico ligero',20000,10,14,'Disponible','2024-03-01','2025-02-10'),
(7,'Biografia de un Genio','F. Ruiz','Historia de vida real',80000,3,15,'Disponible','2024-04-01','2025-03-01');

INSERT INTO imagenes_libro (id_libro, url_imagen, es_principal) VALUES
(1,'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',TRUE),
(2,'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80',TRUE),
(3,'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80',TRUE),
(4,'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',TRUE),
(5,'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80',TRUE),
(6,'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80',TRUE),
(7,'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',TRUE),
(8,'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',TRUE),
(9,'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',TRUE),
(10,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80',TRUE),
(11,'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80',TRUE),
(12,'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',TRUE),
(13,'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',TRUE),
(14,'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80',TRUE),
(15,'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',TRUE);

INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin) VALUES
(1,'Lanzamiento Fantasia','porcentaje',15.00,'2024-03-01 00:00:00','2024-03-31 23:59:59'),
(2,'Terror Nocturno','porcentaje',20.00,'2024-04-01 00:00:00','2024-04-30 23:59:59'),
(3,'Ciencia para Todos','fijo',5000.00,'2024-06-01 00:00:00','2024-06-30 23:59:59'),
(4,'Infantil 2x1','especial',50.00,'2024-08-01 00:00:00','2024-08-31 23:59:59'),
(5,'Juventud Rebelde','porcentaje',10.00,'2024-09-01 00:00:00','2024-09-30 23:59:59'),
(6,'Historia Viva','fijo',8000.00,'2024-11-01 00:00:00','2024-11-30 23:59:59'),
(7,'Arte Moderno','porcentaje',25.00,'2025-01-01 00:00:00','2025-01-31 23:59:59'),
(1,'Comedia para Reir','fijo',3000.00,'2025-02-01 00:00:00','2025-02-28 23:59:59');

INSERT INTO favoritos (id_usuario, id_libro, fecha) VALUES
(1,1,'2024-03-01'),(3,2,'2024-05-05'),(5,4,'2024-07-11'),(7,7,'2024-08-20'),
(9,9,'2024-10-05'),(11,11,'2024-11-20'),(13,13,'2025-01-30'),(15,15,'2025-03-10'),
(1,3,'2024-03-15'),(3,5,'2024-06-10'),(5,7,'2024-07-25'),(7,9,'2024-09-01'),
(9,11,'2024-11-05'),(11,13,'2024-12-15'),(13,15,'2025-02-01');

INSERT INTO direcciones_envio (id_usuario, alias_direccion, direccion_completa, ciudad, codigo_postal, es_principal) VALUES
(1,'Casa Principal','Calle 100 #20-15','Bogota','110111',TRUE),
(3,'Trabajo','Carrera 7 #72-05','Medellin','050010',TRUE),
(5,'Apartamento','Av. Sur #5-88','Cali','760001',TRUE),
(7,'Casa de Vacaciones','Via al Mar Km 5','Cartagena','130001',FALSE),
(9,'Oficina','Calle 50 #40-10','Barranquilla','080001',TRUE),
(11,'Residencia','Carrera 15 #3-20','Bucaramanga','680001',TRUE),
(13,'Universidad','Av. 2 #10-50','Pereira','660001',FALSE),
(15,'Tia','Calle 80 #10-30','Bogota','110112',FALSE),
(1,'Bodega','Carrera 3 #1-90','Bogota','110113',FALSE),
(3,'Casa Papa','Av. 30 #5-10','Medellin','050011',FALSE),
(5,'Casa Amiga','Calle 15 #50-10','Cali','760002',FALSE),
(7,'Apartamento Costa','Cra 1 #2-30','Santa Marta','470001',TRUE),
(9,'Centro Comercial','Cl 9 #4-50','Barranquilla','080002',FALSE),
(11,'Tienda Vecina','Cra 20 #15-5','Bucaramanga','680002',FALSE),
(13,'Campus Principal','Calle 1 #20-100','Pereira','660002',TRUE);

INSERT INTO ordenes_compra (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden) VALUES
(1,1,'2024-05-15 10:30:00',63000.00,'Entregada'),
(3,2,'2024-07-20 14:45:00',45000.00,'Entregada'),
(5,3,'2024-10-01 09:00:00',85000.00,'Enviada'),
(7,4,'2024-11-10 12:00:00',75000.00,'Pagada'),
(9,5,'2024-12-05 18:30:00',32000.00,'Entregada'),
(11,6,'2025-01-01 07:00:00',100000.00,'Pagada'),
(13,7,'2025-02-14 20:15:00',60000.00,'Pendiente'),
(1,1,'2024-06-01 11:00:00',75000.00,'Entregada'),
(3,2,'2024-08-25 09:30:00',40000.00,'Entregada'),
(5,3,'2024-11-15 16:00:00',55000.00,'Enviada'),
(7,4,'2024-12-20 19:40:00',25000.00,'Pagada'),
(9,5,'2025-01-10 13:20:00',95000.00,'Entregada'),
(11,6,'2025-02-01 15:00:00',35000.00,'Pagada'),
(13,7,'2025-03-05 08:10:00',105000.00,'Pendiente'),
(1,8,'2024-07-10 17:00:00',120000.00,'Cancelada');

INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario) VALUES
(1,1,1,35000.00),(1,2,1,28000.00),
(2,3,1,40000.00),
(3,5,1,50000.00),(3,9,1,30000.00),
(4,7,1,70000.00),
(5,8,1,25000.00),(5,14,1,7000.00),
(6,11,1,65000.00),(6,10,1,27000.00),
(7,12,1,35000.00),(7,14,1,20000.00),
(8,4,1,45000.00),(8,13,1,30000.00),
(9,3,1,40000.00),
(10,5,1,50000.00),
(11,8,1,25000.00),
(12,1,2,35000.00),(12,6,1,25000.00),
(13,12,1,35000.00),
(14,7,1,70000.00),(14,15,1,30000.00),
(15,1,2,35000.00),(15,3,1,40000.00);

INSERT INTO pagos (id_orden, metodo_pago, monto, referencia_transaccion, fecha_pago, estado_pago) VALUES
(1,'Tarjeta Credito',63000.00,'REF1A','2024-05-15 10:32:00','Aprobado'),
(2,'PSE',45000.00,'REF2B','2024-07-20 14:46:00','Aprobado'),
(3,'Transferencia',85000.00,'REF3C','2024-10-01 09:10:00','Aprobado'),
(4,'Tarjeta Credito',75000.00,'REF4D','2024-11-10 12:05:00','Aprobado'),
(5,'PSE',32000.00,'REF5E','2024-12-05 18:35:00','Aprobado'),
(6,'Transferencia',100000.00,'REF6F','2025-01-01 07:05:00','Aprobado'),
(7,'Tarjeta Credito',60000.00,'REF7G','2025-02-14 20:16:00','Pendiente'),
(8,'PSE',75000.00,'REF8H','2024-06-01 11:05:00','Aprobado'),
(9,'Transferencia',40000.00,'REF9I','2024-08-25 09:35:00','Aprobado'),
(10,'Tarjeta Credito',55000.00,'REF10J','2024-11-15 16:05:00','Aprobado'),
(11,'PSE',25000.00,'REF11K','2024-12-20 19:45:00','Aprobado'),
(12,'Transferencia',95000.00,'REF12L','2025-01-10 13:25:00','Aprobado'),
(13,'Tarjeta Credito',35000.00,'REF13M','2025-02-01 15:05:00','Aprobado'),
(14,'PSE',105000.00,'REF14N','2025-03-05 08:15:00','Rechazado'),
(15,'Transferencia',120000.00,'REF15O','2024-07-10 17:05:00','Aprobado');

INSERT INTO envios (id_orden, id_tienda, empresa_mensajeria, numero_guia, costo_envio, fecha_estimada_entrega, estado_envio) VALUES
(1,1,'Servientrega','SV1A',5000.00,'2024-05-18','Entregado'),
(2,2,'Servientrega','SV2B',5000.00,'2024-07-23','Entregado'),
(3,3,'Interrapidisimo','SV3C',5000.00,'2024-10-05','En Transito'),
(4,4,'Coordinadora','SV4D',5000.00,'2024-11-14','Recogido'),
(5,5,'Servientrega','SV5E',5000.00,'2024-12-09','Entregado'),
(6,6,'Envia','SV6F',10000.00,'2025-01-05','Recogido'),
(7,7,'TCC','SV7G',5000.00,'2025-02-18','Pendiente'),
(8,1,'Servientrega','SV8H',5000.00,'2024-06-05','Entregado'),
(9,2,'Servientrega','SV9I',5000.00,'2024-08-30','Entregado'),
(10,3,'Interrapidisimo','SV10J',5000.00,'2024-11-20','En Transito'),
(11,4,'Coordinadora','SV11K',5000.00,'2024-12-25','Recogido'),
(12,5,'Servientrega','SV12L',10000.00,'2025-01-15','Entregado'),
(13,6,'Envia','SV13M',5000.00,'2025-02-05','Recogido'),
(14,7,'TCC','SV14N',5000.00,'2025-03-10','Pendiente'),
(15,1,'Servientrega','SV15O',10000.00,'2024-07-15','Cancelado');

INSERT INTO resenas_libros (id_usuario, id_libro, calificacion, comentario, fecha_resena) VALUES
(1,1,5,'Excelente inicio de saga, muy recomendado.','2024-06-01 12:00:00'),
(3,3,4,'Buena trama, aunque esperaba un poco mas de terror.','2024-08-01 15:30:00'),
(5,5,5,'Perfecto para entender conceptos de ciencia basicos.','2024-11-10 08:45:00'),
(7,7,5,'Material de estudio avanzado muy util.','2024-12-15 10:00:00'),
(9,8,5,'A mi hijo le encanto, ilustraciones bellisimas.','2025-01-20 14:00:00'),
(11,11,4,'Datos historicos muy precisos.','2025-03-01 09:00:00'),
(1,4,3,'La ficcion es interesante, pero la edicion es fragil.','2024-07-01 11:30:00'),
(3,6,5,'Imprescindible para desarrolladores de IA.','2024-09-01 13:45:00'),
(5,9,4,'Una lectura juvenil fresca y emocionante.','2024-12-01 16:00:00'),
(7,12,5,'Ideal para principiantes, muy didactico.','2025-01-05 17:00:00'),
(9,14,5,'El libro mas divertido que he leido este ano.','2025-02-20 20:00:00'),
(11,2,4,'Romance tierno y bien escrito.','2024-04-01 14:30:00'),
(13,13,3,'Analisis profundo, aunque un poco denso.','2025-02-25 10:30:00'),
(15,15,5,'Una biografia inspiradora y bien documentada.','2025-04-01 18:00:00'),
(1,10,4,'Excelente aventura, buen ritmo narrativo.','2024-11-01 09:30:00');

INSERT INTO calificaciones_tiendas (id_usuario, id_tienda, calificacion, comentario, fecha_calificacion) VALUES
(1,1,5,'El envio fue rapido y el libro llego en perfecto estado.','2024-06-02 12:00:00'),
(3,2,4,'La tienda respondio rapido las dudas. El empaque podria mejorar.','2024-08-02 15:30:00'),
(5,3,5,'Muy buena atencion y seguimiento al pedido.','2024-11-11 08:45:00'),
(7,4,5,'Excelente stock de libros tecnicos.','2024-12-20 10:00:00'),
(9,5,4,'Precio justo y el vendedor fue amable.','2025-01-25 14:00:00'),
(11,6,5,'Mi tienda favorita, siempre tienen novedades.','2025-03-05 09:00:00'),
(13,7,3,'El envio tardo un poco mas de lo esperado.','2025-03-15 11:30:00'),
(1,1,5,'Volvere a comprar aqui sin duda.','2024-07-15 11:00:00'),
(3,2,5,'Todo perfecto en la segunda compra.','2024-09-05 13:45:00'),
(5,3,4,'Libro bien conservado. Recomendado.','2024-12-10 16:00:00'),
(7,4,3,'La comunicacion inicial fue lenta.','2025-01-01 17:00:00'),
(9,5,5,'Me resolvieron una duda del envio inmediatamente.','2025-02-05 20:00:00'),
(11,6,4,'Buena experiencia, todo claro.','2025-03-10 14:30:00'),
(13,7,5,'Grandes libros de arte.','2025-03-20 10:30:00'),
(15,1,4,'Compre para mi amigo, llego a tiempo.','2025-04-01 18:00:00');

INSERT INTO salasChats (id_usuario, id_tienda, creado_en, actualizado_en) VALUES
(1,1,'2024-03-02 10:00:00','2024-03-02 10:05:00'),
(3,2,'2024-05-06 14:00:00','2024-05-06 14:00:00'),
(5,3,'2024-07-12 16:30:00','2024-07-12 16:30:00'),
(7,4,'2024-08-21 11:00:00','2024-08-21 11:00:00'),
(9,5,'2024-10-06 09:00:00','2024-10-06 09:00:00'),
(11,6,'2024-11-21 14:00:00','2024-11-21 14:00:00'),
(13,7,'2025-01-31 18:00:00','2025-01-31 18:00:00'),
(1,2,'2024-04-01 15:00:00','2024-04-01 15:00:00'),
(3,3,'2024-06-15 10:30:00','2024-06-15 10:30:00'),
(5,4,'2024-09-01 12:00:00','2024-09-01 12:00:00'),
(7,5,'2024-10-20 08:00:00','2024-10-20 08:00:00'),
(9,6,'2024-12-05 13:00:00','2024-12-05 13:00:00'),
(11,7,'2025-02-10 16:00:00','2025-02-10 16:00:00'),
(13,1,'2025-03-01 09:00:00','2025-03-01 09:00:00'),
(15,2,'2025-04-01 11:00:00','2025-04-01 11:00:00');

INSERT INTO mensajes (id_sala, id_remitente, mensaje, enviado_en, mensaje_leido) VALUES
(1,1,'Hola, estoy interesado en este libro','2024-03-02 10:00:00',TRUE),
(1,2,'Claro, ¿que dudas tienes?','2024-03-02 10:05:00',TRUE),
(2,3,'¿Cuanto tarda el envio?','2024-05-06 14:00:00',FALSE),
(3,5,'¿Se puede reservar?','2024-07-12 16:30:00',FALSE),
(4,7,'¿Tiene la version de tapa dura?','2024-08-21 11:00:00',TRUE),
(4,8,'Solo nos queda tapa blanda, ¿le interesa?','2024-08-21 11:05:00',TRUE),
(5,9,'¿Aceptan pago contra entrega en Barranquilla?','2024-10-06 09:00:00',FALSE),
(6,11,'¿El precio es negociable?','2024-11-21 14:00:00',FALSE),
(7,13,'¿Es una edicion limitada?','2025-01-31 18:00:00',TRUE),
(7,14,'Si, es la edicion de aniversario.','2025-01-31 18:05:00',TRUE),
(8,1,'Hola, ¿tienen mas libros de historia?','2024-04-01 15:00:00',TRUE),
(9,3,'¿Podrian enviar una foto del lomo?','2024-06-15 10:30:00',TRUE),
(10,5,'¿El libro de ciencia esta sellado?','2024-09-01 12:00:00',FALSE),
(11,7,'¿Tienen la novela en ingles?','2024-10-20 08:00:00',FALSE),
(12,9,'Gracias por la info de la reserva!','2024-12-05 13:00:00',TRUE);


-- =====================================================
-- ▸ SECCIoN 3: PROCEDIMIENTOS ALMACENADOS
-- =====================================================

-- ── Procedimientos OUT ──────────────────────────────

-- Calcula el total de ventas de una tienda especifica sumando cantidad por precio de sus libros; retorna 0 si no hay ventas.
DROP PROCEDURE IF EXISTS total_ventas_tienda;
DELIMITER //
CREATE PROCEDURE total_ventas_tienda(IN p_id_tienda INT, OUT total_ventas DECIMAL(12,2))
BEGIN
    SELECT IFNULL(SUM(d.cantidad * d.precio_unitario), 0) INTO total_ventas
    FROM detalle_orden d
    INNER JOIN libros l ON d.id_libro = l.id_libro
    WHERE l.id_tienda = p_id_tienda;
END //
DELIMITER ;

-- Cuenta la cantidad de libros que pertenecen a una categoria especifica y retorna el total.
DROP PROCEDURE IF EXISTS contar_libros_categoria;
DELIMITER //
CREATE PROCEDURE contar_libros_categoria(IN p_categoria VARCHAR(50), OUT total_libros INT)
BEGIN
    SELECT COUNT(*) INTO total_libros
    FROM libros l
    INNER JOIN categorias c ON l.id_categoria = c.id_categoria
    WHERE c.nombre_categoria = p_categoria;
END //
DELIMITER ;

-- Calcula el promedio de calificaciones de una tienda especifica; retorna 0 si no tiene calificaciones.
DROP PROCEDURE IF EXISTS promedio_calificacion_tienda;
DELIMITER //
CREATE PROCEDURE promedio_calificacion_tienda(IN p_id_tienda INT, OUT promedio DECIMAL(3,2))
BEGIN
    SELECT IFNULL(AVG(calificacion), 0) INTO promedio
    FROM calificaciones_tiendas WHERE id_tienda = p_id_tienda;
END //
DELIMITER ;

-- Calcula el valor total del inventario de una tienda multiplicando precio por stock; retorna 0 si no hay productos.
DROP PROCEDURE IF EXISTS valor_inventario_tienda;
DELIMITER //
CREATE PROCEDURE valor_inventario_tienda(IN p_id_tienda INT, OUT valor_total DECIMAL(12,2))
BEGIN
    SELECT IFNULL(SUM(precio_libro * stock), 0) INTO valor_total
    FROM libros WHERE id_tienda = p_id_tienda;
END //
DELIMITER ;

-- Cuenta la cantidad de clientes activos en una ciudad especifica considerando su direccion principal.
DROP PROCEDURE IF EXISTS clientes_activos_ciudad;
DELIMITER //
CREATE PROCEDURE clientes_activos_ciudad(IN p_ciudad VARCHAR(50), OUT total_clientes INT)
BEGIN
    SELECT COUNT(DISTINCT u.id_usuario) INTO total_clientes
    FROM usuarios u
    INNER JOIN direcciones_envio d ON u.id_usuario = d.id_usuario
    WHERE d.ciudad = p_ciudad AND d.es_principal = TRUE;
END //
DELIMITER ;

-- Calcula el porcentaje de pedidos entregados respecto al total de pedidos; retorna 0 si no hay pedidos.
DROP PROCEDURE IF EXISTS tasa_conversion_pedidos;
DELIMITER //
CREATE PROCEDURE tasa_conversion_pedidos(OUT tasa_conversion DECIMAL(5,2))
BEGIN
    DECLARE total_pedidos INT;
    DECLARE pedidos_entregados INT;
    SELECT COUNT(*) INTO total_pedidos FROM ordenes_compra;
    SELECT COUNT(*) INTO pedidos_entregados FROM ordenes_compra WHERE estado_orden = 'Entregada';
    IF total_pedidos > 0 THEN
        SET tasa_conversion = (pedidos_entregados / total_pedidos) * 100;
    ELSE
        SET tasa_conversion = 0;
    END IF;
END //
DELIMITER ;

-- Calcula el total de ingresos de un mes y ano especificos, excluyendo pedidos cancelados; retorna 0 si no hay registros.
DROP PROCEDURE IF EXISTS ingresos_por_mes;
DELIMITER //
CREATE PROCEDURE ingresos_por_mes(IN p_mes INT, IN p_anio INT, OUT total DECIMAL(12,2))
BEGIN
    SELECT IFNULL(SUM(total), 0) INTO total
    FROM ordenes_compra
    WHERE MONTH(fecha_orden) = p_mes AND YEAR(fecha_orden) = p_anio
      AND estado_orden != 'Cancelada';
END //
DELIMITER ;

-- Obtiene el libro mas vendido junto con su ID, titulo y la cantidad total de unidades vendidas.
DROP PROCEDURE IF EXISTS libro_mas_vendido;
DELIMITER //
CREATE PROCEDURE libro_mas_vendido(OUT p_id_libro INT, OUT p_titulo VARCHAR(100), OUT total_vendido INT)
BEGIN
    SELECT l.id_libro, l.titulo, SUM(d.cantidad)
    INTO p_id_libro, p_titulo, total_vendido
    FROM detalle_orden d
    INNER JOIN libros l ON d.id_libro = l.id_libro
    GROUP BY l.id_libro, l.titulo
    ORDER BY total_vendido DESC LIMIT 1;
END //
DELIMITER ;

-- Calcula el porcentaje de mensajes leidos respecto al total de mensajes; retorna 0 si no hay registros.
DROP PROCEDURE IF EXISTS porcentaje_mensajes_leidos;
DELIMITER //
CREATE PROCEDURE porcentaje_mensajes_leidos(OUT porcentaje DECIMAL(5,2))
BEGIN
    DECLARE total_mensajes INT;
    DECLARE mensajes_leidos INT;
    SELECT COUNT(*) INTO total_mensajes FROM mensajes;
    SELECT COUNT(*) INTO mensajes_leidos FROM mensajes WHERE mensaje_leido = TRUE;
    IF total_mensajes > 0 THEN
        SET porcentaje = (mensajes_leidos / total_mensajes) * 100;
    ELSE
        SET porcentaje = 0;
    END IF;
END //
DELIMITER ;

-- Calcula el tiempo promedio de entrega en dias para pedidos entregados; retorna 0 si no hay registros.
DROP PROCEDURE IF EXISTS tiempo_promedio_entrega;
DELIMITER //
CREATE PROCEDURE tiempo_promedio_entrega(OUT dias_promedio DECIMAL(10,2))
BEGIN
    SELECT IFNULL(AVG(DATEDIFF(fecha_estimada_entrega, DATE(o.fecha_orden))), 0)
    INTO dias_promedio
    FROM ordenes_compra o
    INNER JOIN envios e ON o.id_orden = e.id_orden
    WHERE o.estado_orden = 'Entregada';
END //
DELIMITER ;

-- ── Procedimientos INOUT ─────────────────────────────

-- Aplica un descuento a un libro segun el porcentaje indicado, actualiza su precio y retorna el nuevo valor.
DROP PROCEDURE IF EXISTS aplicar_descuento_libro;
DELIMITER //
CREATE PROCEDURE aplicar_descuento_libro(IN p_id_libro INT, INOUT p_porcentaje DECIMAL(5,2))
BEGIN
    DECLARE precio_actual DECIMAL(10,2);
    DECLARE nuevo_precio DECIMAL(10,2);
    SELECT precio_libro INTO precio_actual FROM libros WHERE id_libro = p_id_libro;
    SET nuevo_precio = precio_actual - (precio_actual * p_porcentaje / 100);
    UPDATE libros SET precio_libro = nuevo_precio WHERE id_libro = p_id_libro;
    SET p_porcentaje = nuevo_precio;
END //
DELIMITER ;

-- Actualiza el stock de un libro sumando o restando la cantidad indicada y retorna el nuevo stock.
DROP PROCEDURE IF EXISTS actualizar_stock_libro;
DELIMITER //
CREATE PROCEDURE actualizar_stock_libro(IN p_id_libro INT, INOUT p_cambio INT)
BEGIN
    DECLARE stock_actual INT;
    SELECT stock INTO stock_actual FROM libros WHERE id_libro = p_id_libro;
    UPDATE libros SET stock = stock_actual + p_cambio WHERE id_libro = p_id_libro;
    SELECT stock INTO p_cambio FROM libros WHERE id_libro = p_id_libro;
END //
DELIMITER ;

-- Actualiza la calificacion de una tienda y retorna el nuevo promedio de calificaciones de esa tienda.
DROP PROCEDURE IF EXISTS actualizar_calificacion_tienda;
DELIMITER //
CREATE PROCEDURE actualizar_calificacion_tienda(IN p_id_calificacion INT, INOUT p_nueva_calificacion INT)
BEGIN
    DECLARE v_id_tienda INT;
    SELECT id_tienda INTO v_id_tienda FROM calificaciones_tiendas WHERE id_calificacion = p_id_calificacion;
    UPDATE calificaciones_tiendas SET calificacion = p_nueva_calificacion WHERE id_calificacion = p_id_calificacion;
    SELECT AVG(calificacion) INTO p_nueva_calificacion FROM calificaciones_tiendas WHERE id_tienda = v_id_tienda;
END //
DELIMITER ;

-- Actualiza el estado de una orden y retorna el estado actualizado.
DROP PROCEDURE IF EXISTS actualizar_estado_orden;
DELIMITER //
CREATE PROCEDURE actualizar_estado_orden(IN p_id_orden INT, INOUT p_estado VARCHAR(50))
BEGIN
    UPDATE ordenes_compra SET estado_orden = p_estado WHERE id_orden = p_id_orden;
    SELECT estado_orden INTO p_estado FROM ordenes_compra WHERE id_orden = p_id_orden;
END //
DELIMITER ;

-- Actualiza el correo de un usuario y retorna un mensaje de confirmacion con el nombre y el nuevo email.
DROP PROCEDURE IF EXISTS actualizar_info_usuario;
DELIMITER //
CREATE PROCEDURE actualizar_info_usuario(IN p_id_usuario INT, INOUT p_info VARCHAR(255))
BEGIN
    DECLARE v_nombre VARCHAR(50);
    SELECT nombre_usuario INTO v_nombre FROM usuarios WHERE id_usuario = p_id_usuario;
    UPDATE usuarios SET correo_usuario = p_info WHERE id_usuario = p_id_usuario;
    SET p_info = CONCAT('Usuario ', v_nombre, ' actualizado. Nuevo email: ', p_info);
END //
DELIMITER ;

-- ── Procedimientos con dos parametros ────────────────

-- Consulta los libros filtrando por autor (parcial) y categoria, mostrando titulo, autor, categoria, precio y stock.
DROP PROCEDURE IF EXISTS libros_por_autor_categoria;
DELIMITER //
CREATE PROCEDURE libros_por_autor_categoria(IN p_autor VARCHAR(50), IN p_categoria VARCHAR(50))
BEGIN
    SELECT l.titulo, l.autor_libro, c.nombre_categoria, l.precio_libro, l.stock
    FROM libros l
    INNER JOIN categorias c ON l.id_categoria = c.id_categoria
    WHERE l.autor_libro LIKE CONCAT('%', p_autor, '%') AND c.nombre_categoria = p_categoria;
END //
DELIMITER ;

-- Consulta las ventas de una tienda en un rango de fechas, mostrando detalles de pedidos, libros y subtotales.
DROP PROCEDURE IF EXISTS ventas_por_fechas_tienda;
DELIMITER //
CREATE PROCEDURE ventas_por_fechas_tienda(IN p_id_tienda INT, IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    SELECT o.id_orden, o.fecha_orden, l.titulo, d.cantidad, d.precio_unitario,
           d.cantidad * d.precio_unitario AS subtotal
    FROM ordenes_compra o
    INNER JOIN detalle_orden d ON o.id_orden = d.id_orden
    INNER JOIN libros l ON d.id_libro = l.id_libro
    WHERE l.id_tienda = p_id_tienda
      AND DATE(o.fecha_orden) BETWEEN p_fecha_inicio AND p_fecha_fin;
END //
DELIMITER ;

-- Consulta los libros de una tienda con stock por debajo de un umbral, indicando cuantas unidades faltan para el minimo.
DROP PROCEDURE IF EXISTS productos_bajo_stock;
DELIMITER //
CREATE PROCEDURE productos_bajo_stock(IN p_id_tienda INT, IN p_umbral INT)
BEGIN
    SELECT id_libro, titulo, stock, (p_umbral - stock) AS unidades_para_minimo
    FROM libros WHERE id_tienda = p_id_tienda AND stock < p_umbral ORDER BY stock ASC;
END //
DELIMITER ;

-- Consulta los clientes de una ciudad especifica con direccion principal, filtrando por su estado o rol.
DROP PROCEDURE IF EXISTS clientes_por_ciudad_estado;
DELIMITER //
CREATE PROCEDURE clientes_por_ciudad_estado(IN p_ciudad VARCHAR(50), IN p_estado VARCHAR(20))
BEGIN
    SELECT u.id_usuario, u.nombre_usuario, u.correo_usuario, d.ciudad, u.rol
    FROM usuarios u
    INNER JOIN direcciones_envio d ON u.id_usuario = d.id_usuario
    WHERE d.ciudad = p_ciudad AND d.es_principal = TRUE AND u.rol = p_estado;
END //
DELIMITER ;

-- Consulta las calificaciones de una tienda dentro de un rango, mostrando usuario, puntuacion, comentario y fecha.
DROP PROCEDURE IF EXISTS calificaciones_por_rango;
DELIMITER //
CREATE PROCEDURE calificaciones_por_rango(IN p_id_tienda INT, IN p_min INT, IN p_max INT)
BEGIN
    SELECT u.nombre_usuario, ct.calificacion, ct.comentario, ct.fecha_calificacion
    FROM calificaciones_tiendas ct
    INNER JOIN usuarios u ON ct.id_usuario = u.id_usuario
    WHERE ct.id_tienda = p_id_tienda AND ct.calificacion BETWEEN p_min AND p_max
    ORDER BY ct.calificacion DESC;
END //
DELIMITER ;

-- Lista los libros de una tienda si tiene stock disponible; de lo contrario, muestra un mensaje indicando que no hay libros.
DROP PROCEDURE IF EXISTS sp_libros_por_tienda_validado;
DELIMITER //
CREATE PROCEDURE sp_libros_por_tienda_validado(IN p_id_tienda INT)
BEGIN
    DECLARE v_total_stock INT;
    SELECT SUM(stock) INTO v_total_stock FROM libros WHERE id_tienda = p_id_tienda;
    IF v_total_stock > 0 THEN
        SELECT titulo, autor_libro, precio_libro, stock FROM libros WHERE id_tienda = p_id_tienda;
    ELSE
        SELECT 'Esta tienda no tiene libros disponibles actualmente' AS mensaje;
    END IF;
END //
DELIMITER ;

-- ── Procedimientos sin parametros (10) ─────────────

-- Lista los libros disponibles en stock con informacion de categoria y tienda, ordenados por fecha de publicacion reciente.
DROP PROCEDURE IF EXISTS sp_listar_libros_disponibles;
DELIMITER //
CREATE PROCEDURE sp_listar_libros_disponibles()
BEGIN
    SELECT l.id_libro, l.titulo, l.autor_libro,
           c.nombre_categoria, t.nombre_tienda,
           l.precio_libro, l.stock
    FROM libros l
    INNER JOIN categorias c ON l.id_categoria = c.id_categoria
    INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
    WHERE l.stock > 0 AND l.estado_libro = 'Disponible'
    ORDER BY l.fecha_listado DESC;
END //
DELIMITER ;

-- CORRECCIoN 1: Se quito estado_usuario del SELECT.
-- La columna se agrega en Seccion 7 (ALTER TABLE).
-- El SP se redefine despues del ALTER TABLE con estado_usuario incluido.

-- Lista todos los usuarios con su informacion basica, ordenados por fecha de registro reciente.
DROP PROCEDURE IF EXISTS sp_listar_usuarios;
DELIMITER //
CREATE PROCEDURE sp_listar_usuarios()
BEGIN
    SELECT id_usuario, nombre_usuario, correo_usuario,
           rol, fecha_registro
    FROM usuarios
    ORDER BY fecha_registro DESC;
END //
DELIMITER ;

-- Lista las ordenes pendientes con informacion del comprador, fecha y total, ordenadas por fecha ascendente.
DROP PROCEDURE IF EXISTS sp_ordenes_pendientes;
DELIMITER //
CREATE PROCEDURE sp_ordenes_pendientes()
BEGIN
    SELECT o.id_orden, u.nombre_usuario AS comprador,
           o.fecha_orden, o.total, o.estado_orden
    FROM ordenes_compra o
    INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
    WHERE o.estado_orden = 'Pendiente'
    ORDER BY o.fecha_orden ASC;
END //
DELIMITER ;

-- Lista las tiendas con informacion del propietario, telefono y fecha de creacion, ordenadas por las mas recientes.
DROP PROCEDURE IF EXISTS sp_listar_tiendas;
DELIMITER //
CREATE PROCEDURE sp_listar_tiendas()
BEGIN
    SELECT t.id_tienda, t.nombre_tienda,
           u.nombre_usuario AS propietario,
           t.telefono, t.fecha_creacion
    FROM tiendas t
    INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
    ORDER BY t.fecha_creacion DESC;
END //
DELIMITER ;

-- Lista los libros con stock critico o agotado, indicando el nivel de alerta y la tienda a la que pertenecen.
DROP PROCEDURE IF EXISTS sp_alerta_stock_critico;
DELIMITER //
CREATE PROCEDURE sp_alerta_stock_critico()
BEGIN
    SELECT l.id_libro, l.titulo, t.nombre_tienda,
           l.stock,
           CASE WHEN l.stock = 0 THEN 'AGOTADO'
                ELSE 'CRiTICO' END AS nivel_alerta
    FROM libros l
    INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
    WHERE l.stock <= 3
    ORDER BY l.stock ASC;
END //
DELIMITER ;

-- Genera un resumen por categoria con total de libros, stock acumulado y precio promedio, ordenado por cantidad de libros.
DROP PROCEDURE IF EXISTS sp_resumen_categorias;
DELIMITER //
CREATE PROCEDURE sp_resumen_categorias()
BEGIN
    SELECT c.nombre_categoria,
           COUNT(l.id_libro) AS total_libros,
           SUM(l.stock)      AS stock_total,
           AVG(l.precio_libro) AS precio_promedio
    FROM categorias c
    LEFT JOIN libros l ON c.id_categoria = l.id_categoria
    GROUP BY c.id_categoria, c.nombre_categoria
    ORDER BY total_libros DESC;
END //
DELIMITER ;

-- Lista los pagos rechazados con informacion del comprador, metodo de pago, monto y fecha, ordenados por los mas recientes.
DROP PROCEDURE IF EXISTS sp_pagos_rechazados;
DELIMITER //
CREATE PROCEDURE sp_pagos_rechazados()
BEGIN
    SELECT p.id_pago, u.nombre_usuario AS comprador,
           p.metodo_pago, p.monto,
           p.referencia_transaccion, p.fecha_pago
    FROM pagos p
    INNER JOIN ordenes_compra o ON p.id_orden = o.id_orden
    INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
    WHERE p.estado_pago = 'Rechazado'
    ORDER BY p.fecha_pago DESC;
END //
DELIMITER ;

-- CORRECCIoN 3: Se deja definido el SP pero NO se ejecuta aqui.
-- La tabla devoluciones se crea en Seccion 7.
-- El CALL se ejecuta despues de crear esa tabla.

-- Lista las devoluciones pendientes o en revision, mostrando cliente, motivo, estado y dias transcurridos desde la solicitud.
DROP PROCEDURE IF EXISTS sp_devoluciones_pendientes;
DELIMITER //
CREATE PROCEDURE sp_devoluciones_pendientes()
BEGIN
    SELECT d.id_devolucion, u.nombre_usuario AS cliente,
           d.motivo, d.estado_devolucion,
           d.fecha_solicitud,
           DATEDIFF(NOW(), d.fecha_solicitud) AS dias_abierto
    FROM devoluciones d
    INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
    WHERE d.estado_devolucion IN ('Solicitada', 'En Revision')
    ORDER BY dias_abierto DESC;
END //
DELIMITER ;

-- Genera un ranking de los libros mas vendidos, incluyendo unidades, ingresos y calificacion promedio.
DROP PROCEDURE IF EXISTS sp_ranking_libros_vendidos;
DELIMITER //
CREATE PROCEDURE sp_ranking_libros_vendidos()
BEGIN
    SELECT l.titulo, l.autor_libro,
           t.nombre_tienda,
           SUM(d.cantidad)                      AS unidades_vendidas,
           SUM(d.cantidad * d.precio_unitario)  AS ingresos_totales,
           ROUND(AVG(r.calificacion), 1)         AS calificacion_promedio
    FROM libros l
    INNER JOIN detalle_orden d ON l.id_libro = d.id_libro
    INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
    LEFT JOIN resenas_libros r ON l.id_libro = r.id_libro
    GROUP BY l.id_libro, l.titulo, l.autor_libro, t.nombre_tienda
    ORDER BY unidades_vendidas DESC
    LIMIT 10;
END //
DELIMITER ;

-- CORRECCIoN 4: Se deja definido pero NO se ejecuta aqui.
-- La tabla comisiones se crea en Seccion 9.
-- El CALL se ejecuta despues de crear esa tabla.

-- Genera un resumen financiero de la plataforma con totales de ordenes, ventas por estado, comisiones, tiendas y usuarios.
DROP PROCEDURE IF EXISTS sp_resumen_financiero_plataforma;
DELIMITER //
CREATE PROCEDURE sp_resumen_financiero_plataforma()
BEGIN
    SELECT
        COUNT(DISTINCT o.id_orden)              AS total_ordenes,
        SUM(CASE WHEN o.estado_orden = 'Entregada'  THEN o.total ELSE 0 END) AS ventas_completadas,
        SUM(CASE WHEN o.estado_orden = 'Cancelada'  THEN o.total ELSE 0 END) AS ventas_canceladas,
        SUM(CASE WHEN o.estado_orden = 'Pendiente'  THEN o.total ELSE 0 END) AS ventas_pendientes,
        SUM(c.monto_comision)                   AS comisiones_generadas,
        COUNT(DISTINCT t.id_tienda)             AS total_tiendas,
        COUNT(DISTINCT u.id_usuario)            AS total_usuarios
    FROM ordenes_compra o
    LEFT JOIN comisiones c ON o.id_orden = c.id_orden
    CROSS JOIN tiendas t
    CROSS JOIN usuarios u;
END //
DELIMITER ;

-- Ejecucion de los procedimientos sin parametros
-- (solo los que no dependen de tablas creadas despues)
CALL sp_listar_libros_disponibles();
CALL sp_listar_usuarios();
CALL sp_ordenes_pendientes();
CALL sp_listar_tiendas();
CALL sp_alerta_stock_critico();
CALL sp_resumen_categorias();
CALL sp_pagos_rechazados();
-- sp_devoluciones_pendientes: se llama despues de Seccion 7
-- sp_resumen_financiero_plataforma: se llama despues de Seccion 9
CALL sp_ranking_libros_vendidos();
SELECT '--- PROCEDIMIENTOS SIN PARaMETROS CREADOS ---' AS '';

-- ── Procedimientos con parametro simple IN (5) ─────

-- CORRECCIoN 2: sp_perfil_usuario sin telefono ni estado_usuario.
-- Se redefine con todas las columnas despues del ALTER TABLE.

-- Consulta el perfil de un usuario incluyendo datos basicos, total de ordenes y favoritos.
DROP PROCEDURE IF EXISTS sp_perfil_usuario;
DELIMITER //
CREATE PROCEDURE sp_perfil_usuario(IN p_id_usuario INT)
BEGIN
    SELECT u.id_usuario, u.nombre_usuario, u.correo_usuario,
           u.rol, u.fecha_registro,
           COUNT(DISTINCT o.id_orden)    AS total_ordenes,
           COUNT(DISTINCT f.id_favorito) AS total_favoritos
    FROM usuarios u
    LEFT JOIN ordenes_compra o ON u.id_usuario = o.id_usuario
    LEFT JOIN favoritos f ON u.id_usuario = f.id_usuario
    WHERE u.id_usuario = p_id_usuario
    GROUP BY u.id_usuario, u.nombre_usuario, u.correo_usuario,
             u.rol, u.fecha_registro;
END //
DELIMITER ;

-- Lista el catalogo de libros de una tienda con informacion detallada, ordenado por los mas recientes.
DROP PROCEDURE IF EXISTS sp_catalogo_tienda;
DELIMITER //
CREATE PROCEDURE sp_catalogo_tienda(IN p_id_tienda INT)
BEGIN
    SELECT l.id_libro, l.titulo, l.autor_libro,
           c.nombre_categoria, l.precio_libro,
           l.stock, l.estado_libro, l.fecha_listado
    FROM libros l
    INNER JOIN categorias c ON l.id_categoria = c.id_categoria
    WHERE l.id_tienda = p_id_tienda
    ORDER BY l.fecha_listado DESC;
END //
DELIMITER ;

-- Consulta el historial de compras de un usuario mostrando pedidos y libros adquiridos.
DROP PROCEDURE IF EXISTS sp_historial_compras_usuario;
DELIMITER //
CREATE PROCEDURE sp_historial_compras_usuario(IN p_id_usuario INT)
BEGIN
    SELECT o.id_orden, o.fecha_orden, o.total,
           o.estado_orden,
           GROUP_CONCAT(l.titulo SEPARATOR ', ') AS libros_comprados
    FROM ordenes_compra o
    INNER JOIN detalle_orden d ON o.id_orden = d.id_orden
    INNER JOIN libros l ON d.id_libro = l.id_libro
    WHERE o.id_usuario = p_id_usuario
    GROUP BY o.id_orden, o.fecha_orden, o.total, o.estado_orden
    ORDER BY o.fecha_orden DESC;
END //
DELIMITER ;

-- Lista las resenas de un libro con usuario, calificacion, comentario y fecha.
DROP PROCEDURE IF EXISTS sp_resenas_libro;
DELIMITER //
CREATE PROCEDURE sp_resenas_libro(IN p_id_libro INT)
BEGIN
    SELECT u.nombre_usuario, r.calificacion,
           r.comentario, r.fecha_resena
    FROM resenas_libros r
    INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
    WHERE r.id_libro = p_id_libro
    ORDER BY r.fecha_resena DESC;
END //
DELIMITER ;

-- CORRECCIoN 5: se deja definido pero NO se ejecuta aqui.
-- La tabla notificaciones se crea en Seccion 7.
DROP PROCEDURE IF EXISTS sp_notificaciones_usuario;
DELIMITER //
CREATE PROCEDURE sp_notificaciones_usuario(IN p_id_usuario INT)
BEGIN
    SELECT id_notificacion, tipo, titulo,
           cuerpo, leida, fecha_creacion
    FROM notificaciones
    WHERE id_usuario = p_id_usuario
    ORDER BY leida ASC, fecha_creacion DESC;
END //
DELIMITER ;

CALL sp_perfil_usuario(1);
CALL sp_catalogo_tienda(1);
CALL sp_historial_compras_usuario(1);
CALL sp_resenas_libro(1);
-- sp_notificaciones_usuario: se llama despues de Seccion 7
SELECT '--- PROCEDIMIENTOS CON PARaMETRO SIMPLE CREADOS ---' AS '';


-- =====================================================
-- ▸ SECCIoN 4: EJECUCIoN DE DEMOSTRACIoN
-- =====================================================

CALL total_ventas_tienda(1, @ventas_tienda1);
SELECT @ventas_tienda1 AS 'Total Ventas Tienda 1';

CALL contar_libros_categoria('Fantasia', @libros_fantasia);
SELECT @libros_fantasia AS 'Libros en Fantasia';

CALL promedio_calificacion_tienda(1, @prom_tienda1);
SELECT @prom_tienda1 AS 'Promedio Calificacion Tienda 1';

CALL tasa_conversion_pedidos(@tasa);
SELECT @tasa AS 'Tasa de Conversion (%)';

CALL libro_mas_vendido(@id, @titulo, @cantidad);
SELECT @id AS 'ID', @titulo AS 'Libro Mas Vendido', @cantidad AS 'Unidades';

CALL libros_por_autor_categoria('Torres', 'Fantasia');
CALL ventas_por_fechas_tienda(1, '2024-01-01', '2024-06-30');
CALL productos_bajo_stock(7, 5);

SELECT '--- BASE PRINCIPAL BooKyHome CREADA ---' AS '';

SELECT * FROM usuarios;


-- =====================================================
-- ▸ SECCIoN 5: VISTAS ANALiTICAS
-- =====================================================

-- Muestra el valor total del inventario por tienda calculando precio por stock.
DROP VIEW IF EXISTS vista_valor_inventario;
CREATE VIEW vista_valor_inventario AS
SELECT t.nombre_tienda, SUM(l.precio_libro * l.stock) AS valor_total_stock
FROM tiendas t JOIN libros l ON t.id_tienda = l.id_tienda
GROUP BY t.nombre_tienda;

-- Compara el interes (favoritos) y las ventas reales de cada libro.
DROP VIEW IF EXISTS vista_interes_vs_venta;
CREATE VIEW vista_interes_vs_venta AS
SELECT l.titulo,
    COUNT(DISTINCT f.id_favorito) AS total_favoritos,
    IFNULL(SUM(do.cantidad), 0) AS total_vendido
FROM libros l
LEFT JOIN favoritos f ON l.id_libro = f.id_libro
LEFT JOIN detalle_orden do ON l.id_libro = do.id_libro
LEFT JOIN ordenes_compra oc ON do.id_orden = oc.id_orden
    AND oc.estado_orden NOT IN ('Cancelada', 'Pendiente')
GROUP BY l.titulo;

-- Calcula el gasto promedio por usuario en pedidos no cancelados.
DROP VIEW IF EXISTS vista_ticket_promedio;
CREATE VIEW vista_ticket_promedio AS
SELECT u.nombre_usuario, AVG(oc.total) AS promedio_gasto
FROM usuarios u JOIN ordenes_compra oc ON u.id_usuario = oc.id_usuario
WHERE oc.estado_orden != 'Cancelada'
GROUP BY u.nombre_usuario;

-- Muestra los ingresos totales generados por cada categoria de libros.
DROP VIEW IF EXISTS vista_ventas_categoria;
CREATE VIEW vista_ventas_categoria AS
SELECT c.nombre_categoria,
    SUM(do.cantidad * do.precio_unitario) AS ingresos_totales
FROM categorias c
JOIN libros l ON c.id_categoria = l.id_categoria
JOIN detalle_orden do ON l.id_libro = do.id_libro
GROUP BY c.nombre_categoria ORDER BY ingresos_totales DESC;

-- Resume la reputacion de las tiendas con metricas de calificaciones y opiniones.
DROP VIEW IF EXISTS vista_reputacion_tiendas;
CREATE VIEW vista_reputacion_tiendas AS
SELECT t.nombre_tienda, u.nombre_usuario AS propietario,
    ROUND(AVG(ct.calificacion), 2) AS calificacion_media,
    COUNT(ct.id_calificacion) AS total_opiniones,
    MAX(ct.calificacion) AS mejor_calificacion,
    MIN(ct.calificacion) AS peor_calificacion,
    SUM(CASE WHEN ct.calificacion = 5 THEN 1 ELSE 0 END) AS total_5_estrellas,
    MAX(ct.fecha_calificacion) AS ultima_opinion
FROM tiendas t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
LEFT JOIN calificaciones_tiendas ct ON t.id_tienda = ct.id_tienda
GROUP BY t.id_tienda, t.nombre_tienda, u.nombre_usuario
ORDER BY calificacion_media DESC;

-- Muestra la cantidad de mensajes no leidos por usuario y tienda en chats de atencion.
DROP VIEW IF EXISTS vista_chats_atencion;
CREATE VIEW vista_chats_atencion AS
SELECT u.nombre_usuario, t.nombre_tienda,
    COUNT(m.id_mensaje) AS mensajes_sin_leer
FROM mensajes m
JOIN salasChats sc ON m.id_sala = sc.id_sala
JOIN usuarios u ON sc.id_usuario = u.id_usuario
JOIN tiendas t ON sc.id_tienda = t.id_tienda
WHERE m.mensaje_leido = FALSE
GROUP BY u.nombre_usuario, t.nombre_tienda;

-- Lista los libros con stock bajo o critico por tienda.
DROP VIEW IF EXISTS vista_alerta_stock;
CREATE VIEW vista_alerta_stock AS
SELECT l.titulo, t.nombre_tienda, l.stock
FROM libros l JOIN tiendas t ON l.id_tienda = t.id_tienda
WHERE l.stock <= 3;

-- Muestra el total de pedidos y recaudacion agrupados por ciudad.
DROP VIEW IF EXISTS vista_ventas_por_ciudad;
CREATE VIEW vista_ventas_por_ciudad AS
SELECT de.ciudad,
    COUNT(oc.id_orden) AS total_pedidos,
    SUM(oc.total) AS recaudacion_ciudad
FROM direcciones_envio de
JOIN ordenes_compra oc ON de.id_direccion = oc.id_direccion_envio
GROUP BY de.ciudad;

SELECT '--- VISTAS ANALiTICAS CREADAS ---' AS '';
SELECT * FROM vista_valor_inventario;
SELECT * FROM vista_interes_vs_venta LIMIT 5;
SELECT * FROM vista_ticket_promedio;
SELECT * FROM vista_ventas_categoria;
SELECT * FROM vista_reputacion_tiendas;
SELECT * FROM vista_chats_atencion;
SELECT * FROM vista_alerta_stock;
SELECT * FROM vista_ventas_por_ciudad;

-- Muestra el catalogo completo del marketplace con informacion de libros, categoria y tienda.
DROP VIEW IF EXISTS vista_catalogo_marketplace;
CREATE VIEW vista_catalogo_marketplace AS
SELECT l.id_libro, l.titulo, l.autor_libro, l.precio_libro, l.stock,
    c.nombre_categoria, t.nombre_tienda, t.direccion
FROM libros l
JOIN categorias c ON l.id_categoria = c.id_categoria
JOIN tiendas t ON l.id_tienda = t.id_tienda;

-- Lista las tiendas con mas de un libro en su catalogo junto con el total de libros.
DROP VIEW IF EXISTS vista_tiendas_con_catalogo;
CREATE VIEW vista_tiendas_con_catalogo AS
SELECT t.nombre_tienda, u.nombre_usuario AS propietario,
    COUNT(l.id_libro) AS total_libros
FROM tiendas t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
INNER JOIN libros l ON t.id_tienda = l.id_tienda
GROUP BY t.id_tienda, t.nombre_tienda, u.nombre_usuario
HAVING COUNT(l.id_libro) > 1
ORDER BY total_libros DESC;

-- Muestra los libros mejor valorados con estadisticas de resenas y calificaciones.
DROP VIEW IF EXISTS vista_libros_mejor_valorados;
CREATE VIEW vista_libros_mejor_valorados AS
SELECT l.titulo, l.autor_libro, t.nombre_tienda,
    COUNT(r.id_resena) AS total_resenas,
    ROUND(AVG(r.calificacion), 2) AS promedio_calificacion,
    MIN(r.calificacion) AS peor_nota, MAX(r.calificacion) AS mejor_nota
FROM libros l
INNER JOIN resenas_libros r ON l.id_libro = r.id_libro
INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
GROUP BY l.id_libro, l.titulo, l.autor_libro, t.nombre_tienda
HAVING AVG(r.calificacion) >= 4
ORDER BY promedio_calificacion DESC;

-- Identifica los compradores frecuentes mostrando numero de ordenes, gasto total y ticket promedio.
DROP VIEW IF EXISTS vista_compradores_frecuentes;
CREATE VIEW vista_compradores_frecuentes AS
SELECT u.nombre_usuario, u.correo_usuario,
    COUNT(o.id_orden) AS total_ordenes,
    SUM(o.total) AS gasto_total, AVG(o.total) AS ticket_promedio
FROM usuarios u
INNER JOIN ordenes_compra o ON u.id_usuario = o.id_usuario
WHERE o.estado_orden != 'Cancelada'
GROUP BY u.id_usuario, u.nombre_usuario, u.correo_usuario
HAVING COUNT(o.id_orden) > 1
ORDER BY total_ordenes DESC;

SELECT * FROM vista_tiendas_con_catalogo;
SELECT * FROM vista_libros_mejor_valorados;
SELECT * FROM vista_compradores_frecuentes;
SELECT '--- VISTAS CON HAVING CREADAS ---' AS '';


-- =====================================================
-- ▸ SECCIoN 6: TRIGGERS, FUNCIONES Y VISTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS log_actividad (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50),
    tipo_accion VARCHAR(20),
    descripcion VARCHAR(500),
    fecha_log DATETIME DEFAULT NOW()
);

-- Verifica antes de insertar que el stock sea suficiente; si no, ajusta la cantidad a 0.
DROP TRIGGER IF EXISTS trg_verificar_stock_disponible;
DELIMITER //
CREATE TRIGGER trg_verificar_stock_disponible
BEFORE INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE stock_disponible INT;
    SELECT stock INTO stock_disponible FROM libros WHERE id_libro = NEW.id_libro;
    IF stock_disponible < NEW.cantidad THEN SET NEW.cantidad = 0; END IF;
END //
DELIMITER ;

-- Reduce el stock del libro despues de registrar una compra.
DROP TRIGGER IF EXISTS trg_reducir_stock_compra;
DELIMITER //
CREATE TRIGGER trg_reducir_stock_compra
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    UPDATE libros SET stock = stock - NEW.cantidad WHERE id_libro = NEW.id_libro;
END //
DELIMITER ;

-- Restaura el stock y registra en log cuando una orden es cancelada.
DROP TRIGGER IF EXISTS trg_devolver_stock_cancelacion;
DELIMITER //
CREATE TRIGGER trg_devolver_stock_cancelacion
AFTER UPDATE ON ordenes_compra FOR EACH ROW
BEGIN
    IF NEW.estado_orden = 'Cancelada' AND OLD.estado_orden != 'Cancelada' THEN
        UPDATE libros l INNER JOIN detalle_orden d ON l.id_libro = d.id_libro
        SET l.stock = l.stock + d.cantidad WHERE d.id_orden = NEW.id_orden;
        INSERT INTO log_actividad (tabla_afectada, tipo_accion, descripcion)
        VALUES ('ordenes_compra', 'CANCELACIoN',
            CONCAT('Orden #', NEW.id_orden, ' cancelada. Stock restaurado.'));
    END IF;
END //
DELIMITER ;

-- Valida que la calificacion de resenas este entre 1 y 5.
DROP TRIGGER IF EXISTS trg_validar_calificacion_resena;
DELIMITER //
CREATE TRIGGER trg_validar_calificacion_resena
BEFORE INSERT ON resenas_libros FOR EACH ROW
BEGIN
    IF NEW.calificacion < 1 THEN SET NEW.calificacion = 1; END IF;
    IF NEW.calificacion > 5 THEN SET NEW.calificacion = 5; END IF;
END //
DELIMITER ;

-- Registra en log cada nueva calificacion realizada a una tienda.
DROP TRIGGER IF EXISTS trg_log_calificacion_tienda;
DELIMITER //
CREATE TRIGGER trg_log_calificacion_tienda
AFTER INSERT ON calificaciones_tiendas FOR EACH ROW
BEGIN
    INSERT INTO log_actividad (tabla_afectada, tipo_accion, descripcion)
    VALUES ('calificaciones_tiendas', 'NUEVA CALIFICACIoN',
        CONCAT('Usuario #', NEW.id_usuario, ' califico la tienda #',
               NEW.id_tienda, ' con ', NEW.calificacion, ' estrellas.'));
END //
DELIMITER ;

-- Calcula el precio de un libro aplicando un porcentaje de descuento.
DROP FUNCTION IF EXISTS fn_precio_con_descuento;
DELIMITER //
CREATE FUNCTION fn_precio_con_descuento(p_id_libro INT, p_porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2) DETERMINISTIC
BEGIN
    DECLARE precio_base DECIMAL(10,2);
    SELECT precio_libro INTO precio_base FROM libros WHERE id_libro = p_id_libro;
    RETURN precio_base - (precio_base * p_porcentaje / 100);
END //
DELIMITER ;

-- Determina el estado de stock de un libro (Disponible o Agotado).
DROP FUNCTION IF EXISTS fn_estado_stock;
DELIMITER //
CREATE FUNCTION fn_estado_stock(p_id_libro INT)
RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    DECLARE cantidad INT;
    SELECT stock INTO cantidad FROM libros WHERE id_libro = p_id_libro;
    IF cantidad > 0 THEN RETURN 'Disponible'; ELSE RETURN 'Agotado'; END IF;
END //
DELIMITER ;

-- Calcula el total gastado por un usuario en ordenes validas.
DROP FUNCTION IF EXISTS fn_total_gastado_usuario;
DELIMITER //
CREATE FUNCTION fn_total_gastado_usuario(p_id_usuario INT)
RETURNS DECIMAL(12,2) DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(12,2);
    SELECT IFNULL(SUM(total), 0) INTO total FROM ordenes_compra
    WHERE id_usuario = p_id_usuario AND estado_orden IN ('Entregada','Enviada','Pagada');
    RETURN total;
END //
DELIMITER ;

-- Calcula el promedio de calificaciones de un libro.
DROP FUNCTION IF EXISTS fn_promedio_resenas_libro;
DELIMITER //
CREATE FUNCTION fn_promedio_resenas_libro(p_id_libro INT)
RETURNS DECIMAL(3,1) DETERMINISTIC
BEGIN
    DECLARE promedio DECIMAL(3,1);
    SELECT IFNULL(ROUND(AVG(calificacion), 1), 0) INTO promedio
    FROM resenas_libros WHERE id_libro = p_id_libro;
    RETURN promedio;
END //
DELIMITER ;

-- Determina el nivel de cliente segun el total de compras realizadas.
DROP FUNCTION IF EXISTS fn_nivel_cliente;
DELIMITER //
CREATE FUNCTION fn_nivel_cliente(p_id_usuario INT)
RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    DECLARE total_compras DECIMAL(12,2);
    SELECT IFNULL(SUM(total), 0) INTO total_compras FROM ordenes_compra
    WHERE id_usuario = p_id_usuario AND estado_orden NOT IN ('Cancelada','Pendiente');
    IF total_compras >= 300000 THEN RETURN 'Platino';
    ELSEIF total_compras >= 150000 THEN RETURN 'Oro';
    ELSEIF total_compras >= 50000 THEN RETURN 'Plata';
    ELSE RETURN 'Bronce'; END IF;
END //
DELIMITER ;

-- Muestra el catalogo disponible con informacion de imagen principal.
DROP VIEW IF EXISTS vista_catalogo_disponible;
CREATE VIEW vista_catalogo_disponible AS
SELECT l.id_libro, l.titulo, l.autor_libro, c.nombre_categoria AS categoria,
       t.nombre_tienda AS tienda, l.precio_libro, l.stock, i.url_imagen AS imagen_principal
FROM libros l
INNER JOIN categorias c ON l.id_categoria = c.id_categoria
INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
LEFT JOIN imagenes_libro i ON l.id_libro = i.id_libro AND i.es_principal = TRUE
WHERE l.stock > 0 AND l.estado_libro = 'Disponible';

-- Muestra el detalle completo de ordenes incluyendo pagos, productos y destino.
DROP VIEW IF EXISTS vista_ordenes_detalladas;
CREATE VIEW vista_ordenes_detalladas AS
SELECT o.id_orden, u.nombre_usuario AS comprador, l.titulo AS libro,
       d.cantidad, d.precio_unitario, (d.cantidad * d.precio_unitario) AS subtotal,
       o.total AS total_orden, o.estado_orden, p.metodo_pago, p.estado_pago,
       o.fecha_orden, de.ciudad AS ciudad_destino
FROM ordenes_compra o
INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
INNER JOIN detalle_orden d ON o.id_orden = d.id_orden
INNER JOIN libros l ON d.id_libro = l.id_libro
INNER JOIN pagos p ON o.id_orden = p.id_orden
INNER JOIN direcciones_envio de ON o.id_direccion_envio = de.id_direccion;

-- Genera un ranking de tiendas segun calificaciones y cantidad de libros.
DROP VIEW IF EXISTS vista_ranking_tiendas;
CREATE VIEW vista_ranking_tiendas AS
SELECT t.id_tienda, t.nombre_tienda, u.nombre_usuario AS propietario,
       COUNT(ct.id_calificacion) AS total_calificaciones,
       ROUND(AVG(ct.calificacion), 2) AS promedio_calificacion,
       COUNT(DISTINCT l.id_libro) AS total_libros
FROM tiendas t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
LEFT JOIN calificaciones_tiendas ct ON t.id_tienda = ct.id_tienda
LEFT JOIN libros l ON t.id_tienda = l.id_tienda
GROUP BY t.id_tienda, t.nombre_tienda, u.nombre_usuario
ORDER BY promedio_calificacion DESC;

-- Resume la actividad reciente de usuarios en compras y resenas.
DROP VIEW IF EXISTS vista_actividad_usuarios;
CREATE VIEW vista_actividad_usuarios AS
SELECT u.id_usuario, u.nombre_usuario, u.rol,
       COUNT(DISTINCT o.id_orden) AS ordenes_realizadas,
       COUNT(DISTINCT r.id_resena) AS resenas_escritas,
       MAX(o.fecha_orden) AS ultima_compra
FROM usuarios u
LEFT JOIN ordenes_compra o ON u.id_usuario = o.id_usuario
    AND DATEDIFF(NOW(), o.fecha_orden) <= 90
LEFT JOIN resenas_libros r ON u.id_usuario = r.id_usuario
    AND DATEDIFF(NOW(), r.fecha_resena) <= 90
GROUP BY u.id_usuario, u.nombre_usuario, u.rol;

-- Muestra los libros mas vendidos con ingresos y calificacion promedio.
DROP VIEW IF EXISTS vista_libros_mas_vendidos;
CREATE VIEW vista_libros_mas_vendidos AS
SELECT l.id_libro, l.titulo, l.autor_libro, t.nombre_tienda,
       SUM(d.cantidad) AS unidades_vendidas,
       SUM(d.cantidad * d.precio_unitario) AS ingresos_generados,
       ROUND(AVG(r.calificacion), 1) AS calificacion_promedio
FROM libros l
INNER JOIN detalle_orden d ON l.id_libro = d.id_libro
INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
LEFT JOIN resenas_libros r ON l.id_libro = r.id_libro
GROUP BY l.id_libro, l.titulo, l.autor_libro, t.nombre_tienda
ORDER BY unidades_vendidas DESC;

-- Triggers BEFORE/AFTER DELETE
-- Evita eliminar usuarios con ordenes activas y registra el intento en el log.
DROP TRIGGER IF EXISTS trg_bloquear_borrado_usuario_activo;
DELIMITER //
CREATE TRIGGER trg_bloquear_borrado_usuario_activo
BEFORE DELETE ON usuarios FOR EACH ROW
BEGIN
    DECLARE v_ordenes_activas INT;
    SELECT COUNT(*) INTO v_ordenes_activas FROM ordenes_compra
    WHERE id_usuario = OLD.id_usuario AND estado_orden IN ('Pendiente', 'Pagada', 'Enviada');
    IF v_ordenes_activas > 0 THEN
        INSERT INTO log_actividad (tabla_afectada, tipo_accion, descripcion)
        VALUES ('usuarios', 'BORRADO BLOQUEADO',
            CONCAT('Intento de borrar usuario #', OLD.id_usuario,
                   ' con ', v_ordenes_activas, ' orden(es) activa(s).'));
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede eliminar un usuario con ordenes activas.';
    END IF;
END //
DELIMITER ;

-- Registra en el log la informacion del libro antes de ser eliminado.
DROP TRIGGER IF EXISTS trg_log_antes_borrar_libro;
DELIMITER //
CREATE TRIGGER trg_log_antes_borrar_libro
BEFORE DELETE ON libros FOR EACH ROW
BEGIN
    INSERT INTO log_actividad (tabla_afectada, tipo_accion, descripcion)
    VALUES ('libros', 'PRE-BORRADO',
        CONCAT('Libro a eliminar — ID: ', OLD.id_libro,
               ' | Titulo: ', OLD.titulo,
               ' | Tienda: ', OLD.id_tienda,
               ' | Stock: ', OLD.stock,
               ' | Precio: ', OLD.precio_libro));
END //
DELIMITER ;

-- Elimina favoritos asociados al borrar un libro y registra la accion en el log.
DROP TRIGGER IF EXISTS trg_limpiar_favoritos_al_borrar_libro;
DELIMITER //
CREATE TRIGGER trg_limpiar_favoritos_al_borrar_libro
AFTER DELETE ON libros FOR EACH ROW
BEGIN
    DELETE FROM favoritos WHERE id_libro = OLD.id_libro;
    INSERT INTO log_actividad (tabla_afectada, tipo_accion, descripcion)
    VALUES ('libros', 'BORRADO',
        CONCAT('Libro #', OLD.id_libro, ' "', OLD.titulo,
               '" eliminado. Favoritos asociados limpiados.'));
END //
DELIMITER ;

-- Registra en el log la eliminacion de una calificacion de tienda.
DROP TRIGGER IF EXISTS trg_log_borrado_calificacion;
DELIMITER //
CREATE TRIGGER trg_log_borrado_calificacion
AFTER DELETE ON calificaciones_tiendas FOR EACH ROW
BEGIN
    INSERT INTO log_actividad (tabla_afectada, tipo_accion, descripcion)
    VALUES ('calificaciones_tiendas', 'BORRADO',
        CONCAT('Calificacion eliminada — Tienda #', OLD.id_tienda,
               ' | Usuario #', OLD.id_usuario,
               ' | Estrellas: ', OLD.calificacion,
               ' | Comentario: ', LEFT(OLD.comentario, 80)));
END //
DELIMITER ;

SELECT '--- TRIGGERS Y FUNCIONES CREADOS ---' AS '';


-- =====================================================
-- ▸ SECCIoN 7: MEJORAS Y NUEVAS TABLAS
-- =====================================================

-- ALTER TABLE: agrega telefono, foto_perfil y estado_usuario solo si faltan
SET @schema := DATABASE();

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'telefono') = 0,
    'ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20) DEFAULT NULL AFTER correo_usuario',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'foto_perfil') = 0,
    'ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) DEFAULT NULL AFTER telefono',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema AND table_name = 'usuarios' AND column_name = 'estado_usuario') = 0,
    'ALTER TABLE usuarios ADD COLUMN estado_usuario VARCHAR(20) DEFAULT ''Activo'' AFTER foto_perfil',
    'SELECT 1'
) INTO @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE usuarios SET telefono='3011111111', estado_usuario='Activo' WHERE id_usuario=1;
UPDATE usuarios SET telefono='3022222222', estado_usuario='Activo' WHERE id_usuario=2;
UPDATE usuarios SET telefono='3033333333', estado_usuario='Activo' WHERE id_usuario=3;
UPDATE usuarios SET telefono='3044444444', estado_usuario='Activo' WHERE id_usuario=4;
UPDATE usuarios SET telefono='3055555555', estado_usuario='Activo' WHERE id_usuario=5;
UPDATE usuarios SET telefono='3066666666', estado_usuario='Activo' WHERE id_usuario=6;
UPDATE usuarios SET telefono='3077777777', estado_usuario='Activo' WHERE id_usuario=7;
UPDATE usuarios SET telefono='3088888888', estado_usuario='Activo' WHERE id_usuario=8;
UPDATE usuarios SET telefono='3099999999', estado_usuario='Activo' WHERE id_usuario=9;
UPDATE usuarios SET telefono='3101010101', estado_usuario='Activo' WHERE id_usuario=10;
UPDATE usuarios SET telefono='3111111111', estado_usuario='Activo' WHERE id_usuario=11;
UPDATE usuarios SET telefono='3121212121', estado_usuario='Activo' WHERE id_usuario=12;
UPDATE usuarios SET telefono='3131313131', estado_usuario='Activo' WHERE id_usuario=13;
UPDATE usuarios SET telefono='3141414141', estado_usuario='Activo' WHERE id_usuario=14;
UPDATE usuarios SET telefono='3151515151', estado_usuario='Activo' WHERE id_usuario=15;

-- CORRECCIoN 1 (redefinicion): ahora que estado_usuario existe,
-- se recrea sp_listar_usuarios con la columna completa.

-- Lista todos los usuarios con su informacion basica incluyendo estado, ordenados por fecha de registro reciente.
DROP PROCEDURE IF EXISTS sp_listar_usuarios;
DELIMITER //
CREATE PROCEDURE sp_listar_usuarios()
BEGIN
    SELECT id_usuario, nombre_usuario, correo_usuario,
           rol, fecha_registro, estado_usuario
    FROM usuarios
    ORDER BY fecha_registro DESC;
END //
DELIMITER ;

-- CORRECCIoN 2 (redefinicion): ahora que telefono y estado_usuario
-- existen, se recrea sp_perfil_usuario completo con fn_nivel_cliente.

-- Consulta el perfil de un usuario incluyendo datos personales, actividad, favoritos y nivel de cliente.
DROP PROCEDURE IF EXISTS sp_perfil_usuario;
DELIMITER //
CREATE PROCEDURE sp_perfil_usuario(IN p_id_usuario INT)
BEGIN
    SELECT u.id_usuario, u.nombre_usuario, u.correo_usuario,
           u.telefono, u.rol, u.fecha_registro, u.estado_usuario,
           COUNT(DISTINCT o.id_orden)    AS total_ordenes,
           COUNT(DISTINCT f.id_favorito) AS total_favoritos,
           fn_nivel_cliente(u.id_usuario) AS nivel_cliente
    FROM usuarios u
    LEFT JOIN ordenes_compra o ON u.id_usuario = o.id_usuario
    LEFT JOIN favoritos f ON u.id_usuario = f.id_usuario
    WHERE u.id_usuario = p_id_usuario
    GROUP BY u.id_usuario, u.nombre_usuario, u.correo_usuario,
             u.telefono, u.rol, u.fecha_registro, u.estado_usuario;
END //
DELIMITER ;

CREATE TABLE IF NOT EXISTS empresas_mensajeria (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(100) NOT NULL,
    sitio_web VARCHAR(150),
    telefono_soporte VARCHAR(20),
    cobertura_nacional BOOLEAN DEFAULT TRUE,
    activa BOOLEAN DEFAULT TRUE
);

INSERT INTO empresas_mensajeria (nombre_empresa, sitio_web, telefono_soporte, cobertura_nacional) VALUES
('Servientrega','https://www.servientrega.com','018000111888',TRUE),
('Interrapidisimo','https://www.interrapidisimo.com','018000912345',TRUE),
('Coordinadora','https://www.coordinadora.com','4445050',TRUE),
('Envia','https://www.envia.com.co','018000952525',TRUE),
('TCC','https://www.tcc.com.co','3106000',TRUE),
('Deprisa (Avianca)','https://www.deprisa.com','5879696',TRUE),
('4-72 (Postal)','https://www.4-72.com.co','4720000',TRUE),
('DHL Colombia','https://www.dhl.com/co','4232020',TRUE),
('FedEx Colombia','https://www.fedex.com/es-co','6495151',FALSE),
('Listo! (exito)','https://www.exito.com','018000410100',FALSE);

ALTER TABLE envios ADD CONSTRAINT fk_envio_empresa
    FOREIGN KEY (id_empresa) REFERENCES empresas_mensajeria(id_empresa);

SET SQL_SAFE_UPDATES = 0;
UPDATE envios SET id_empresa=1 WHERE empresa_mensajeria='Servientrega';
UPDATE envios SET id_empresa=2 WHERE empresa_mensajeria='Interrapidisimo';
UPDATE envios SET id_empresa=3 WHERE empresa_mensajeria='Coordinadora';
UPDATE envios SET id_empresa=4 WHERE empresa_mensajeria='Envia';
UPDATE envios SET id_empresa=5 WHERE empresa_mensajeria='TCC';
SET SQL_SAFE_UPDATES = 1;

CREATE TABLE IF NOT EXISTS oferta_libros (
    id_oferta_libro INT AUTO_INCREMENT PRIMARY KEY,
    id_oferta INT NOT NULL,
    id_libro INT NOT NULL,
    FOREIGN KEY (id_oferta) REFERENCES ofertas(id_oferta),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    UNIQUE KEY uk_oferta_libro (id_oferta, id_libro)
);

INSERT INTO oferta_libros (id_oferta, id_libro) VALUES
(1,1),(1,2),(2,3),(3,5),(3,6),(4,8),(5,9),(5,10),(6,11),(7,13),(7,14),(8,14),(8,15);

CREATE TABLE IF NOT EXISTS carrito_compras (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_libro INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    UNIQUE KEY uk_carrito (id_usuario, id_libro)
);

INSERT INTO carrito_compras (id_usuario, id_libro, cantidad) VALUES
(1,6,1),(1,7,1),(3,1,2),(5,3,1),(5,11,1),(7,2,1),(9,4,1),(11,15,1),(13,5,2),(15,8,3);

CREATE TABLE IF NOT EXISTS cupones_descuento (
    id_cupon INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT DEFAULT NULL,
    codigo_cupon VARCHAR(20) UNIQUE NOT NULL,
    tipo_descuento VARCHAR(20) NOT NULL,
    valor_descuento DECIMAL(10,2) NOT NULL,
    minimo_compra DECIMAL(10,2) DEFAULT 0.00,
    usos_maximos INT DEFAULT 1,
    usos_actuales INT DEFAULT 0,
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO cupones_descuento (id_tienda, codigo_cupon, tipo_descuento, valor_descuento, minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin) VALUES
(NULL,'BIENVENIDO10','porcentaje',10.00,30000,100,12,'2025-01-01 00:00:00','2025-12-31 23:59:59'),
(1,'ANA15','porcentaje',15.00,50000,50,5,'2025-02-01 00:00:00','2025-06-30 23:59:59'),
(2,'LECTURA5K','fijo',5000,40000,30,3,'2025-03-01 00:00:00','2025-05-31 23:59:59'),
(3,'PAULA20','porcentaje',20.00,60000,20,0,'2025-04-01 00:00:00','2025-07-31 23:59:59'),
(NULL,'LIBROFEST','fijo',8000,70000,200,47,'2025-03-15 00:00:00','2025-04-15 23:59:59'),
(5,'SARA10','porcentaje',10.00,25000,40,8,'2025-01-15 00:00:00','2025-08-31 23:59:59'),
(7,'VALENTINA25','porcentaje',25.00,80000,10,1,'2025-03-01 00:00:00','2025-04-30 23:59:59');

CREATE TABLE IF NOT EXISTS uso_cupones (
    id_uso INT AUTO_INCREMENT PRIMARY KEY,
    id_cupon INT NOT NULL,
    id_usuario INT NOT NULL,
    id_orden INT NOT NULL,
    descuento_aplicado DECIMAL(10,2) NOT NULL,
    fecha_uso DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_cupon) REFERENCES cupones_descuento(id_cupon),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden)
);

INSERT INTO uso_cupones (id_cupon, id_usuario, id_orden, descuento_aplicado) VALUES
(1,1,1,6300.00),(1,3,2,4500.00),(2,1,8,7500.00),(3,5,3,5000.00),(5,9,5,3200.00);

CREATE TABLE IF NOT EXISTS devoluciones (
    id_devolucion INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_usuario INT NOT NULL,
    motivo VARCHAR(300) NOT NULL,
    estado_devolucion VARCHAR(50) DEFAULT 'Solicitada',
    tipo_resolucion VARCHAR(50) DEFAULT NULL,
    monto_reembolso DECIMAL(10,2) DEFAULT NULL,
    fecha_solicitud DATETIME DEFAULT NOW(),
    fecha_resolucion DATETIME DEFAULT NULL,
    notas_vendedor VARCHAR(300) DEFAULT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

INSERT INTO devoluciones (id_orden, id_usuario, motivo, estado_devolucion, tipo_resolucion, monto_reembolso, fecha_solicitud, fecha_resolucion, notas_vendedor) VALUES
(1,1,'El libro llego con paginas danadas.','Reembolsada','Reembolso',35000.00,'2024-05-20 10:00:00','2024-05-22 14:00:00','Se verifico el dano. Reembolso aprobado.'),
(5,9,'Me enviaron el libro equivocado.','Aprobada','Cambio',NULL,'2024-12-10 09:00:00','2024-12-12 11:00:00','Se coordina envio del libro correcto.'),
(8,1,'La edicion no corresponde a la anunciada.','En Revision',NULL,NULL,'2024-06-05 15:00:00',NULL,NULL),
(2,3,'El libro tardo 15 dias mas de lo prometido.','Rechazada',NULL,NULL,'2024-08-10 12:00:00','2024-08-11 10:00:00','El retraso fue por la mensajeria.'),
(12,9,'Uno de los libros llego humedo.','Solicitada',NULL,NULL,'2025-01-12 08:00:00',NULL,NULL);

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    cuerpo VARCHAR(300) NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    id_referencia INT DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, leida, id_referencia) VALUES
(1,'orden','¡Orden confirmada!','Tu orden #1 ha sido confirmada y esta siendo preparada.',TRUE,1),
(1,'envio','Tu pedido esta en camino','Tu orden #1 fue despachada. Guia: SV1A.',TRUE,1),
(1,'envio','¡Pedido entregado!','Tu orden #1 fue entregada. ¡Disfruta tu libro!',TRUE,1),
(1,'devolucion','Devolucion procesada','Tu solicitud fue aprobada. Reembolso: $35.000.',TRUE,1),
(3,'orden','¡Orden confirmada!','Tu orden #2 ha sido confirmada.',TRUE,2),
(5,'mensaje','Nuevo mensaje del vendedor','Tienda Paula Books respondio tu consulta.',FALSE,3),
(7,'mensaje','Respuesta de la tienda','Historias Bellas respondio: Solo tenemos tapa blanda.',TRUE,4),
(9,'oferta','¡Nueva oferta en Sara Books!','10% de descuento en juveniles. Codigo: SARA10.',FALSE,5),
(11,'sistema','Cupon especial para ti','Usa BIENVENIDO10 en tu proxima compra.',FALSE,NULL),
(13,'orden','Orden pendiente de pago','Tu orden #14 tiene un pago rechazado.',FALSE,14);

-- CORRECCIoN 5 (ejecucion): ahora que notificaciones existe,
-- ya se puede llamar sp_notificaciones_usuario.
CALL sp_notificaciones_usuario(1);
SELECT '--- sp_notificaciones_usuario ejecutado ---' AS '';

-- CORRECCIoN 3 (ejecucion): ahora que devoluciones existe,
-- ya se puede llamar sp_devoluciones_pendientes.
CALL sp_devoluciones_pendientes();
SELECT '--- sp_devoluciones_pendientes ejecutado ---' AS '';

CREATE TABLE IF NOT EXISTS historial_precios (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_libro INT NOT NULL,
    precio_anterior DECIMAL(10,2) NOT NULL,
    precio_nuevo DECIMAL(10,2) NOT NULL,
    motivo VARCHAR(200) DEFAULT NULL,
    cambiado_por INT DEFAULT NULL,
    fecha_cambio DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    FOREIGN KEY (cambiado_por) REFERENCES usuarios(id_usuario)
);

INSERT INTO historial_precios (id_libro, precio_anterior, precio_nuevo, motivo, cambiado_por) VALUES
(1,40000,35000,'Ajuste de precio por temporada',2),
(3,45000,40000,'Precio reducido por competencia',4),
(5,55000,50000,'Promocion de lanzamiento',6),
(6,65000,60000,'Precio ajustado tras resenas positivas',6),
(7,75000,70000,'Descuento por volumen de stock',8),
(11,70000,65000,'Precio especial para estudiantes',10),
(15,85000,80000,'Correccion de precio inicial',14);

CREATE TABLE IF NOT EXISTS reportes_contenido (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_reporta INT NOT NULL,
    tipo_contenido VARCHAR(30) NOT NULL,
    id_contenido INT NOT NULL,
    motivo VARCHAR(300) NOT NULL,
    estado_reporte VARCHAR(30) DEFAULT 'Pendiente',
    fecha_reporte DATETIME DEFAULT NOW(),
    fecha_resolucion DATETIME DEFAULT NULL,
    FOREIGN KEY (id_usuario_reporta) REFERENCES usuarios(id_usuario)
);

INSERT INTO reportes_contenido (id_usuario_reporta, tipo_contenido, id_contenido, motivo, estado_reporte) VALUES
(1,'resena',3,'La resena contiene lenguaje ofensivo.','Resuelto'),
(5,'libro',6,'La descripcion no corresponde al contenido real.','En revision'),
(9,'tienda',3,'La tienda no responde mensajes.','Pendiente'),
(13,'resena',7,'Posible resena falsa.','Pendiente'),
(7,'mensaje',8,'El vendedor envio publicidad no solicitada.','Desestimado');

CREATE TABLE IF NOT EXISTS suscripciones_tienda (
    id_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_tienda INT NOT NULL,
    recibir_notificaciones BOOLEAN DEFAULT TRUE,
    fecha_suscripcion DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    UNIQUE KEY uk_suscripcion (id_usuario, id_tienda)
);

INSERT INTO suscripciones_tienda (id_usuario, id_tienda, recibir_notificaciones) VALUES
(1,1,TRUE),(1,2,TRUE),(3,1,FALSE),(3,3,TRUE),(5,2,TRUE),(5,4,TRUE),
(7,5,TRUE),(9,6,TRUE),(11,7,TRUE),(13,1,FALSE),(15,2,TRUE),(7,3,TRUE),
(9,4,FALSE),(11,5,TRUE),(1,7,TRUE);

CREATE TABLE IF NOT EXISTS lista_deseos (
    id_lista INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_lista VARCHAR(100) NOT NULL,
    publica BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS lista_deseos_libros (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_lista INT NOT NULL,
    id_libro INT NOT NULL,
    nota VARCHAR(200) DEFAULT NULL,
    fecha_agregado DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_lista) REFERENCES lista_deseos(id_lista),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    UNIQUE KEY uk_lista_libro (id_lista, id_libro)
);

INSERT INTO lista_deseos (id_usuario, nombre_lista, publica) VALUES
(1,'Para leer este ano',TRUE),(1,'Regalos pendientes',FALSE),
(3,'Mi coleccion de ciencia',TRUE),(5,'Libros para mis hijos',FALSE),
(7,'Ingenieria avanzada',TRUE),(9,'Aventuras favoritas',TRUE),(13,'Arte e historia',FALSE);

INSERT INTO lista_deseos_libros (id_lista, id_libro, nota) VALUES
(1,4,'Me la recomendo un amigo'),(1,6,'Para aprender sobre IA'),(1,11,NULL),
(2,15,'Para el cumpleanos de mi hermano'),(3,5,NULL),(3,6,'Edicion especial si hay'),
(4,8,'Para Sofia (7 anos)'),(4,9,'Para Miguel (13 anos)'),(5,7,'Texto base del semestre'),
(6,10,NULL),(7,13,'Para el proyecto final'),(7,11,NULL);

-- Registra en historial los cambios de precio de un libro antes de actualizarlo.
DROP TRIGGER IF EXISTS trg_historial_precio;
DELIMITER //
CREATE TRIGGER trg_historial_precio
BEFORE UPDATE ON libros FOR EACH ROW
BEGIN
    IF OLD.precio_libro <> NEW.precio_libro THEN
        INSERT INTO historial_precios (id_libro, precio_anterior, precio_nuevo, motivo, fecha_cambio)
        VALUES (OLD.id_libro, OLD.precio_libro, NEW.precio_libro, 'Actualizacion directa', NOW());
    END IF;
END //
DELIMITER ;

-- Notifica al usuario cuando cambia el estado de su orden.
DROP TRIGGER IF EXISTS trg_notificar_cambio_orden;
DELIMITER //
CREATE TRIGGER trg_notificar_cambio_orden
AFTER UPDATE ON ordenes_compra FOR EACH ROW
BEGIN
    IF OLD.estado_orden <> NEW.estado_orden THEN
        INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia)
        VALUES (NEW.id_usuario, 'orden',
            CONCAT('Orden #', NEW.id_orden, ' actualizada'),
            CONCAT('El estado de tu orden cambio a: ', NEW.estado_orden, '.'),
            NEW.id_orden);
    END IF;
END //
DELIMITER ;

-- Genera una notificacion al destinatario cuando se envia un nuevo mensaje.
DROP TRIGGER IF EXISTS trg_notificar_mensaje;
DELIMITER //
CREATE TRIGGER trg_notificar_mensaje
AFTER INSERT ON mensajes FOR EACH ROW
BEGIN
    DECLARE v_id_destino INT;
    DECLARE v_nombre VARCHAR(50);
    SELECT nombre_usuario INTO v_nombre FROM usuarios WHERE id_usuario = NEW.id_remitente;
    SELECT IF(id_usuario = NEW.id_remitente, id_tienda, id_usuario)
    INTO v_id_destino FROM salasChats WHERE id_sala = NEW.id_sala;
    INSERT INTO notificaciones (id_usuario, tipo, titulo, cuerpo, id_referencia)
    VALUES (v_id_destino, 'mensaje',
        CONCAT('Nuevo mensaje de ', v_nombre),
        SUBSTRING(NEW.mensaje, 1, 100), NEW.id_sala);
END //
DELIMITER ;

-- Incrementa el uso de un cupon y lo desactiva si alcanza el limite.
DROP TRIGGER IF EXISTS trg_incrementar_uso_cupon;
DELIMITER //
CREATE TRIGGER trg_incrementar_uso_cupon
AFTER INSERT ON uso_cupones FOR EACH ROW
BEGIN
    UPDATE cupones_descuento SET usos_actuales = usos_actuales + 1 WHERE id_cupon = NEW.id_cupon;
    UPDATE cupones_descuento SET activo = FALSE
    WHERE id_cupon = NEW.id_cupon AND usos_actuales >= usos_maximos;
END //
DELIMITER ;

-- Calcula el precio final de un libro aplicando un cupon valido.
DROP FUNCTION IF EXISTS fn_precio_con_cupon;
DELIMITER //
CREATE FUNCTION fn_precio_con_cupon(p_id_libro INT, p_codigo_cupon VARCHAR(20))
RETURNS DECIMAL(10,2) DETERMINISTIC
BEGIN
    DECLARE precio_base DECIMAL(10,2); DECLARE tipo VARCHAR(20);
    DECLARE valor DECIMAL(10,2); DECLARE precio_final DECIMAL(10,2);
    SELECT precio_libro INTO precio_base FROM libros WHERE id_libro = p_id_libro;
    SELECT tipo_descuento, valor_descuento INTO tipo, valor
    FROM cupones_descuento WHERE codigo_cupon = p_codigo_cupon AND activo = TRUE
      AND NOW() BETWEEN fecha_inicio AND fecha_fin LIMIT 1;
    IF tipo = 'porcentaje' THEN SET precio_final = precio_base - (precio_base * valor / 100);
    ELSEIF tipo = 'fijo' THEN SET precio_final = GREATEST(precio_base - valor, 0);
    ELSE SET precio_final = precio_base; END IF;
    RETURN precio_final;
END //
DELIMITER ;

-- Valida un cupon segun estado, fecha, uso y si el usuario ya lo utilizo.
DROP FUNCTION IF EXISTS fn_cupon_valido;
DELIMITER //
CREATE FUNCTION fn_cupon_valido(p_codigo VARCHAR(20), p_id_usuario INT)
RETURNS VARCHAR(50) DETERMINISTIC
BEGIN
    DECLARE v_activo BOOLEAN; DECLARE v_usos_max INT;
    DECLARE v_usos_act INT; DECLARE v_fecha_fin DATETIME; DECLARE v_ya_usado INT;
    SELECT activo, usos_maximos, usos_actuales, fecha_fin
    INTO v_activo, v_usos_max, v_usos_act, v_fecha_fin
    FROM cupones_descuento WHERE codigo_cupon = p_codigo LIMIT 1;
    IF v_activo IS NULL THEN RETURN 'Cupon no existe'; END IF;
    IF v_activo = FALSE THEN RETURN 'Cupon inactivo'; END IF;
    IF NOW() > v_fecha_fin THEN RETURN 'Cupon vencido'; END IF;
    IF v_usos_act >= v_usos_max THEN RETURN 'Cupon agotado'; END IF;
    SELECT COUNT(*) INTO v_ya_usado FROM uso_cupones uc
    INNER JOIN cupones_descuento cd ON uc.id_cupon = cd.id_cupon
    WHERE cd.codigo_cupon = p_codigo AND uc.id_usuario = p_id_usuario;
    IF v_ya_usado > 0 THEN RETURN 'Ya usaste este cupon'; END IF;
    RETURN 'Valido';
END //
DELIMITER ;

-- Analiza el desempeno de envios por empresa, estado y tiempos promedio.
DROP VIEW IF EXISTS vista_analisis_envios;
CREATE VIEW vista_analisis_envios AS
SELECT em.nombre_empresa, em.sitio_web, e.estado_envio,
    COUNT(e.id_envio) AS cantidad_paquetes,
    ROUND(AVG(e.costo_envio), 0) AS costo_promedio,
    ROUND(AVG(DATEDIFF(e.fecha_estimada_entrega, DATE(o.fecha_orden))), 1) AS dias_entrega_promedio
FROM empresas_mensajeria em
LEFT JOIN envios e ON em.id_empresa = e.id_empresa
LEFT JOIN ordenes_compra o ON e.id_orden = o.id_orden
WHERE em.activa = TRUE
GROUP BY em.id_empresa, em.nombre_empresa, em.sitio_web, e.estado_envio
ORDER BY em.nombre_empresa, e.estado_envio;

-- Evalua el impacto de ofertas activas en ventas, ingresos y productos promocionados.
DROP VIEW IF EXISTS vista_impacto_ofertas;
CREATE VIEW vista_impacto_ofertas AS
SELECT o.nombre_oferta, o.tipo_descuento, o.valor_descuento, t.nombre_tienda,
    COUNT(DISTINCT ol.id_libro) AS libros_en_oferta,
    IFNULL(SUM(do.cantidad), 0) AS unidades_vendidas_promo,
    IFNULL(SUM(do.cantidad * do.precio_unitario), 0) AS ingresos_durante_oferta,
    o.fecha_inicio, o.fecha_fin
FROM ofertas o
INNER JOIN tiendas t ON o.id_tienda = t.id_tienda
INNER JOIN oferta_libros ol ON o.id_oferta = ol.id_oferta
LEFT JOIN detalle_orden do ON ol.id_libro = do.id_libro
LEFT JOIN ordenes_compra oc ON do.id_orden = oc.id_orden
    AND DATE(oc.fecha_orden) BETWEEN DATE(o.fecha_inicio) AND DATE(o.fecha_fin)
    AND oc.estado_orden NOT IN ('Cancelada', 'Pendiente')
WHERE CURRENT_DATE BETWEEN DATE(o.fecha_inicio) AND DATE(o.fecha_fin)
GROUP BY o.id_oferta, o.nombre_oferta, o.tipo_descuento,
         o.valor_descuento, t.nombre_tienda, o.fecha_inicio, o.fecha_fin
ORDER BY unidades_vendidas_promo DESC;

-- Resume el contenido del carrito de cada usuario con totales de items, unidades y valor estimado.
DROP VIEW IF EXISTS vista_carrito_usuario;
CREATE VIEW vista_carrito_usuario AS
SELECT c.id_usuario, u.nombre_usuario,
    COUNT(c.id_carrito) AS items_en_carrito,
    SUM(c.cantidad) AS unidades_totales,
    SUM(l.precio_libro * c.cantidad) AS total_estimado
FROM carrito_compras c
INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
INNER JOIN libros l ON c.id_libro = l.id_libro
GROUP BY c.id_usuario, u.nombre_usuario;

-- Muestra el detalle de devoluciones con informacion del cliente, orden y estado.
DROP VIEW IF EXISTS vista_devoluciones;
CREATE VIEW vista_devoluciones AS
SELECT d.id_devolucion, u.nombre_usuario AS cliente, o.id_orden,
    o.total AS valor_orden, d.motivo, d.estado_devolucion,
    d.tipo_resolucion, d.monto_reembolso, d.fecha_solicitud, d.notas_vendedor
FROM devoluciones d
INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
INNER JOIN ordenes_compra o ON d.id_orden = o.id_orden
ORDER BY d.fecha_solicitud DESC;

-- Lista las notificaciones pendientes por usuario con conteo y fecha de la mas reciente.
DROP VIEW IF EXISTS vista_notificaciones_pendientes;
CREATE VIEW vista_notificaciones_pendientes AS
SELECT n.id_usuario, u.nombre_usuario, COUNT(*) AS total_no_leidas,
    MAX(n.fecha_creacion) AS ultima_notificacion
FROM notificaciones n
INNER JOIN usuarios u ON n.id_usuario = u.id_usuario
WHERE n.leida = FALSE
GROUP BY n.id_usuario, u.nombre_usuario
ORDER BY total_no_leidas DESC;

-- Muestra las opciones de envio con estadisticas de uso y tiempos promedio de entrega.
DROP VIEW IF EXISTS vista_opciones_envio;
CREATE VIEW vista_opciones_envio AS
SELECT em.id_empresa, em.nombre_empresa, em.sitio_web, em.telefono_soporte,
    COUNT(e.id_envio) AS envios_realizados,
    ROUND(AVG(DATEDIFF(e.fecha_estimada_entrega, DATE(o.fecha_orden))), 1) AS dias_promedio
FROM empresas_mensajeria em
LEFT JOIN envios e ON em.id_empresa = e.id_empresa
LEFT JOIN ordenes_compra o ON e.id_orden = o.id_orden
WHERE em.activa = TRUE
GROUP BY em.id_empresa, em.nombre_empresa, em.sitio_web, em.telefono_soporte
ORDER BY envios_realizados DESC;

SELECT * FROM vista_analisis_envios;
SELECT * FROM vista_impacto_ofertas;
SELECT '--- MEJORAS Y NUEVAS TABLAS APLICADAS ---' AS '';


-- =====================================================
-- ▸ SECCIoN 8: MoDULO VENDEDOR
-- =====================================================

CREATE TABLE IF NOT EXISTS tienda_configuracion (
    id_config INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL UNIQUE,
    descripcion TEXT DEFAULT NULL,
    logo_url VARCHAR(255) DEFAULT NULL,
    banner_url VARCHAR(255) DEFAULT NULL,
    horario_atencion VARCHAR(200) DEFAULT NULL,
    politica_devoluciones TEXT DEFAULT NULL,
    politica_envios TEXT DEFAULT NULL,
    tiempo_despacho_dias INT DEFAULT 2,
    ciudad_origen VARCHAR(50) DEFAULT NULL,
    acepta_negociacion BOOLEAN DEFAULT FALSE,
    email_publico VARCHAR(100) DEFAULT NULL,
    redes_sociales VARCHAR(500) DEFAULT NULL,
    fecha_actualizacion DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO tienda_configuracion (id_tienda, descripcion, logo_url, banner_url, horario_atencion, politica_devoluciones, politica_envios, tiempo_despacho_dias, ciudad_origen, acepta_negociacion, email_publico, redes_sociales) VALUES
(1,'Libreria especializada en fantasia, romance y literatura juvenil.','https://bookyhome.com/tiendas/ana/logo.jpg','https://bookyhome.com/tiendas/ana/banner.jpg','Lun-Vie 9am-6pm','Devoluciones hasta 10 dias despues de recibido.','Envio gratis en compras mayores a $100.000.',2,'Bogota',TRUE,'librosana@gmail.com','{\"instagram\":\"@libros_ana\"}'),
(2,'Los mejores libros de terror, ficcion y ciencia.','https://bookyhome.com/tiendas/lecturaviva/logo.jpg','https://bookyhome.com/tiendas/lecturaviva/banner.jpg','Lun-Sab 8am-7pm','Cambios en los primeros 7 dias.','Coordinadora y TCC. 3-5 dias habiles.',3,'Medellin',FALSE,'lecturaviva@gmail.com','{\"instagram\":\"@lectura_viva\"}'),
(3,'Ciencia, tecnologia e ingenieria para estudiantes.','https://bookyhome.com/tiendas/paula/logo.jpg','https://bookyhome.com/tiendas/paula/banner.jpg','Lun-Vie 7am-5pm','Solo devoluciones si llego en mal estado.','Despacho por Envia. Guia enviada por chat.',1,'Cali',TRUE,'paulabooks@gmail.com','{\"instagram\":\"@paula_books\"}'),
(4,'Cuentos infantiles, juveniles y aventura.','https://bookyhome.com/tiendas/historias/logo.jpg','https://bookyhome.com/tiendas/historias/banner.jpg','Lun-Vie 9am-5pm','Devolucion sin preguntas en 15 dias.','Coordinadora. Empaque especial de regalo.',2,'Barranquilla',TRUE,'historiasbellas@gmail.com','{\"instagram\":\"@historias_bellas\"}'),
(5,'Literatura juvenil y de aventura.','https://bookyhome.com/tiendas/sara/logo.jpg','https://bookyhome.com/tiendas/sara/banner.jpg','Mar-Sab 10am-6pm','Devoluciones en primeros 5 dias.','Servientrega. Gratis en compras mayores a $80.000.',2,'Bucaramanga',FALSE,'sarabooks@gmail.com','{\"instagram\":\"@sara_books\"}'),
(6,'Historia, educacion y arte.','https://bookyhome.com/tiendas/sofia/logo.jpg','https://bookyhome.com/tiendas/sofia/banner.jpg','Lun-Vie 8am-4pm','Cambios en 7 dias si hay defecto.','4-72 y Servientrega para cobertura nacional.',3,'Pereira',TRUE,'sofiareads@gmail.com','{\"facebook\":\"SofiaReadsLibros\"}'),
(7,'Arte, comedia y biografias.','https://bookyhome.com/tiendas/valentina/logo.jpg','https://bookyhome.com/tiendas/valentina/banner.jpg','Lun-Sab 9am-7pm','Devolucion de 10 dias sin uso.','DHL y Servientrega. Embalaje reforzado.',2,'Bogota',TRUE,'valentinalibros@gmail.com','{\"instagram\":\"@tienda_valentina\"}');

CREATE TABLE IF NOT EXISTS metodos_cobro_vendedor (
    id_metodo INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    tipo_cuenta VARCHAR(30) NOT NULL,
    banco VARCHAR(50) NOT NULL,
    numero_cuenta VARCHAR(30) NOT NULL,
    nombre_titular VARCHAR(100) NOT NULL,
    cedula_titular VARCHAR(20) NOT NULL,
    es_principal BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    fecha_registro DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO metodos_cobro_vendedor (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado) VALUES
(1,'Ahorros','Bancolombia','123-456789-01','Ana Martinez','1020304050',TRUE,TRUE),
(2,'Corriente','Davivienda','234-567890-12','Maria Lopez','2030405060',TRUE,TRUE),
(3,'Nequi','Bancolombia','3066666666','Paula Castro','3040506070',TRUE,TRUE),
(4,'Ahorros','BBVA','345-678901-23','Laura Rios','4050607080',TRUE,FALSE),
(5,'Daviplata','Davivienda','3101010101','Sara Pena','5060708090',TRUE,TRUE),
(6,'Ahorros','Banco Bogota','456-789012-34','Sofia Ramirez','6070809000',TRUE,TRUE),
(7,'Corriente','Bancolombia','567-890123-45','Valentina Cruz','7080900011',TRUE,FALSE);

CREATE TABLE IF NOT EXISTS tienda_vacaciones (
    id_vacacion INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    mensaje_clientes VARCHAR(300) DEFAULT NULL,
    acepta_pedidos_previos BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO tienda_vacaciones (id_tienda, fecha_inicio, fecha_fin, mensaje_clientes, acepta_pedidos_previos) VALUES
(1,'2025-04-18','2025-04-27','Estamos en Semana Santa. Volvemos el 28 de abril.',TRUE),
(3,'2025-06-15','2025-06-30','Vacaciones de mitad de ano. Reabrimos en julio.',FALSE),
(5,'2025-12-24','2026-01-05','Felices fiestas. Regresamos el 6 de enero.',TRUE),
(7,'2025-05-01','2025-05-04','Cerrados por festivos. Reabrimos el 5 de mayo.',TRUE);

CREATE TABLE IF NOT EXISTS libro_variantes (
    id_variante INT AUTO_INCREMENT PRIMARY KEY,
    id_libro INT NOT NULL,
    tipo_tapa VARCHAR(30) DEFAULT NULL,
    idioma VARCHAR(30) DEFAULT 'Espanol',
    edicion VARCHAR(50) DEFAULT NULL,
    isbn VARCHAR(20) DEFAULT NULL,
    precio_variante DECIMAL(10,2) NOT NULL,
    stock_variante INT NOT NULL DEFAULT 0,
    peso_gramos INT DEFAULT NULL,
    numero_paginas INT DEFAULT NULL,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro)
);

INSERT INTO libro_variantes (id_libro, tipo_tapa, idioma, edicion, isbn, precio_variante, stock_variante, peso_gramos, numero_paginas) VALUES
(1,'Tapa Blanda','Espanol','1ra Edicion','978-1-001-00001-1',35000,8,320,380),
(1,'Tapa Dura','Espanol','1ra Edicion','978-1-001-00001-2',55000,3,580,380),
(1,'Digital','Espanol','1ra Edicion',NULL,18000,999,NULL,380),
(2,'Tapa Blanda','Espanol','1ra Edicion','978-1-001-00002-1',28000,5,280,310),
(2,'Digital','Espanol','1ra Edicion',NULL,12000,999,NULL,310),
(3,'Tapa Blanda','Espanol','2da Edicion','978-1-001-00003-1',40000,7,340,420),
(3,'Tapa Dura','Espanol','2da Edicion','978-1-001-00003-2',62000,2,600,420),
(4,'Tapa Blanda','Espanol','1ra Edicion','978-1-001-00004-1',45000,10,300,350),
(4,'Tapa Blanda','Ingles','1ra Edicion','978-1-001-00004-3',48000,4,300,350),
(5,'Tapa Dura','Espanol','Edicion Ilustrada','978-1-001-00005-1',75000,3,700,500),
(5,'Tapa Blanda','Espanol','3ra Edicion','978-1-001-00005-2',50000,8,420,500),
(7,'Tapa Dura','Espanol','Edicion Universitaria','978-1-001-00007-1',85000,4,900,680),
(7,'Tapa Blanda','Espanol','Edicion Universitaria','978-1-001-00007-2',70000,9,650,680),
(13,'Tapa Dura','Espanol','Edicion Coleccionista','978-1-001-00013-1',85000,2,1200,280),
(13,'Tapa Blanda','Espanol','1ra Edicion','978-1-001-00013-2',55000,7,500,280),
(15,'Tapa Dura','Espanol','Edicion de Lujo','978-1-001-00015-1',110000,1,800,420),
(15,'Tapa Blanda','Espanol','1ra Edicion','978-1-001-00015-2',80000,3,450,420);

CREATE TABLE IF NOT EXISTS metricas_tienda (
    id_metrica INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    periodo_mes INT NOT NULL,
    periodo_anio INT NOT NULL,
    total_ordenes INT DEFAULT 0,
    ordenes_completadas INT DEFAULT 0,
    ordenes_canceladas INT DEFAULT 0,
    ingresos_brutos DECIMAL(12,2) DEFAULT 0.00,
    ingresos_netos DECIMAL(12,2) DEFAULT 0.00,
    promedio_calificacion DECIMAL(3,2) DEFAULT 0.00,
    nuevos_seguidores INT DEFAULT 0,
    libros_mas_vendido VARCHAR(100) DEFAULT NULL,
    fecha_calculo DATETIME DEFAULT NOW(),
    UNIQUE KEY uk_metrica (id_tienda, periodo_mes, periodo_anio),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO metricas_tienda (id_tienda, periodo_mes, periodo_anio, total_ordenes, ordenes_completadas, ordenes_canceladas, ingresos_brutos, ingresos_netos, promedio_calificacion, nuevos_seguidores, libros_mas_vendido) VALUES
(1,5,2024,3,2,0,173000,138000,5.00,5,'El Castillo Magico'),
(1,6,2024,2,2,0,120000,120000,5.00,3,'Amor en Invierno'),
(1,7,2024,1,0,1,120000,0,4.50,2,'El Castillo Magico'),
(2,7,2024,1,1,0,40000,40000,4.00,2,'La Sombra Oscura'),
(3,10,2024,1,0,0,85000,85000,5.00,3,'El Universo y Tu'),
(4,11,2024,1,0,0,75000,75000,4.00,2,'Principios de Ingenieria'),
(5,12,2024,2,1,0,57000,57000,4.50,4,'Aventura en la Selva'),
(6,1,2025,1,0,0,100000,100000,5.00,3,'Civilizaciones Antiguas'),
(7,2,2025,2,0,0,140000,140000,4.00,5,'Arte Moderno');

-- Pausa automaticamente los libros de una tienda cuando entra en periodo de vacaciones y registra la accion.
DROP TRIGGER IF EXISTS trg_pausar_tienda_vacaciones;
DELIMITER //
CREATE TRIGGER trg_pausar_tienda_vacaciones
AFTER INSERT ON tienda_vacaciones FOR EACH ROW
BEGIN
    IF NEW.fecha_inicio <= CURDATE() THEN
        UPDATE libros SET estado_libro = 'Tienda en vacaciones' WHERE id_tienda = NEW.id_tienda;
        INSERT INTO log_actividad (tabla_afectada, tipo_accion, descripcion)
        VALUES ('tiendas', 'VACACIONES',
            CONCAT('Tienda #', NEW.id_tienda, ' pausada hasta ', NEW.fecha_fin));
    END IF;
END //
DELIMITER ;

-- Sincroniza el stock general del libro cuando cambia el stock de sus variantes.
DROP TRIGGER IF EXISTS trg_sync_stock_variante;
DELIMITER //
CREATE TRIGGER trg_sync_stock_variante
AFTER UPDATE ON libro_variantes FOR EACH ROW
BEGIN
    IF OLD.stock_variante <> NEW.stock_variante THEN
        UPDATE libros SET stock = (
            SELECT SUM(stock_variante) FROM libro_variantes
            WHERE id_libro = NEW.id_libro AND tipo_tapa != 'Digital' AND activa = TRUE
        ) WHERE id_libro = NEW.id_libro;
    END IF;
END //
DELIMITER ;

-- Notifica al vendedor cuando se registra una nueva venta de uno de sus libros.
DROP TRIGGER IF EXISTS trg_notificar_vendedor_nueva_orden;
DELIMITER //
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

-- Bloquea compras de libros si la tienda esta en vacaciones y no acepta pedidos.
DROP TRIGGER IF EXISTS trg_bloquear_compra_vacaciones;
DELIMITER //
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
DELIMITER ;

-- Muestra un panel resumido para vendedores con metricas, estado y desempeno de la tienda.
DROP VIEW IF EXISTS vista_panel_vendedor;
CREATE VIEW vista_panel_vendedor AS
SELECT t.id_tienda, t.nombre_tienda, u.nombre_usuario AS propietario,
    tc.ciudad_origen, tc.tiempo_despacho_dias, tc.acepta_negociacion,
    COUNT(DISTINCT l.id_libro) AS total_libros,
    SUM(l.stock) AS stock_total,
    COUNT(DISTINCT ss.id_suscripcion) AS total_seguidores,
    ROUND(AVG(ct.calificacion), 2) AS calificacion_promedio,
    IFNULL(SUM(CASE WHEN o.estado_orden NOT IN ('Cancelada','Pendiente') THEN o.total ELSE 0 END), 0) AS ingresos_totales,
    CASE WHEN EXISTS (SELECT 1 FROM tienda_vacaciones tv
        WHERE tv.id_tienda = t.id_tienda AND CURDATE() BETWEEN tv.fecha_inicio AND tv.fecha_fin)
    THEN 'En vacaciones' ELSE 'Activa' END AS estado_tienda
FROM tiendas t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
LEFT JOIN tienda_configuracion tc ON t.id_tienda = tc.id_tienda
LEFT JOIN libros l ON t.id_tienda = l.id_tienda
LEFT JOIN suscripciones_tienda ss ON t.id_tienda = ss.id_tienda
LEFT JOIN calificaciones_tiendas ct ON t.id_tienda = ct.id_tienda
LEFT JOIN detalle_orden d ON l.id_libro = d.id_libro
LEFT JOIN ordenes_compra o ON d.id_orden = o.id_orden
GROUP BY t.id_tienda, t.nombre_tienda, u.nombre_usuario,
         tc.ciudad_origen, tc.tiempo_despacho_dias, tc.acepta_negociacion;

-- Lista las variantes de libros con detalles como edicion, idioma, precio y stock.
DROP VIEW IF EXISTS vista_variantes_libros;
CREATE VIEW vista_variantes_libros AS
SELECT l.id_libro, l.titulo, l.autor_libro, t.nombre_tienda,
    lv.tipo_tapa, lv.idioma, lv.edicion, lv.isbn,
    lv.precio_variante, lv.stock_variante, lv.numero_paginas, lv.activa
FROM libro_variantes lv
INNER JOIN libros l ON lv.id_libro = l.id_libro
INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
ORDER BY l.id_libro, lv.precio_variante;

-- Calcula y guarda metricas mensuales de una tienda incluyendo ventas, calificaciones y libro mas vendido.
DROP PROCEDURE IF EXISTS sp_calcular_metricas_mes;
DELIMITER //
CREATE PROCEDURE sp_calcular_metricas_mes(IN p_id_tienda INT, IN p_mes INT, IN p_anio INT)
BEGIN
    DECLARE v_ordenes INT DEFAULT 0; DECLARE v_completadas INT DEFAULT 0;
    DECLARE v_canceladas INT DEFAULT 0; DECLARE v_brutos DECIMAL(12,2) DEFAULT 0;
    DECLARE v_netos DECIMAL(12,2) DEFAULT 0; DECLARE v_calificacion DECIMAL(3,2) DEFAULT 0;
    DECLARE v_seguidores INT DEFAULT 0; DECLARE v_libro_top VARCHAR(100) DEFAULT '';
    SELECT COUNT(DISTINCT o.id_orden),
           SUM(CASE WHEN o.estado_orden = 'Entregada' THEN 1 ELSE 0 END),
           SUM(CASE WHEN o.estado_orden = 'Cancelada' THEN 1 ELSE 0 END),
           IFNULL(SUM(d.cantidad * d.precio_unitario), 0)
    INTO v_ordenes, v_completadas, v_canceladas, v_brutos
    FROM ordenes_compra o
    INNER JOIN detalle_orden d ON o.id_orden = d.id_orden
    INNER JOIN libros l ON d.id_libro = l.id_libro
    WHERE l.id_tienda = p_id_tienda
      AND MONTH(o.fecha_orden) = p_mes AND YEAR(o.fecha_orden) = p_anio;
    SELECT IFNULL(ROUND(AVG(calificacion), 2), 0) INTO v_calificacion
    FROM calificaciones_tiendas
    WHERE id_tienda = p_id_tienda AND MONTH(fecha_calificacion) = p_mes
      AND YEAR(fecha_calificacion) = p_anio;
    SELECT l.titulo INTO v_libro_top
    FROM detalle_orden d INNER JOIN libros l ON d.id_libro = l.id_libro
    INNER JOIN ordenes_compra o ON d.id_orden = o.id_orden
    WHERE l.id_tienda = p_id_tienda AND MONTH(o.fecha_orden) = p_mes
      AND YEAR(o.fecha_orden) = p_anio
    GROUP BY l.id_libro, l.titulo ORDER BY SUM(d.cantidad) DESC LIMIT 1;
    DELETE FROM metricas_tienda
    WHERE id_tienda = p_id_tienda AND periodo_mes = p_mes AND periodo_anio = p_anio;
    INSERT INTO metricas_tienda
        (id_tienda, periodo_mes, periodo_anio, total_ordenes, ordenes_completadas,
         ordenes_canceladas, ingresos_brutos, ingresos_netos,
         promedio_calificacion, nuevos_seguidores, libros_mas_vendido, fecha_calculo)
    VALUES (p_id_tienda, p_mes, p_anio, v_ordenes, v_completadas, v_canceladas,
            v_brutos, v_brutos, v_calificacion, v_seguidores, v_libro_top, NOW());
    SELECT CONCAT('Metricas calculadas para tienda #', p_id_tienda, ' - ', p_mes, '/', p_anio) AS resultado;
END //
DELIMITER ;

SELECT '--- MoDULO VENDEDOR APLICADO ---' AS '';


-- =====================================================
-- ▸ SECCIoN 9: MODELO DE INGRESOS
-- =====================================================

CREATE TABLE IF NOT EXISTS comisiones (
    id_comision INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_tienda INT NOT NULL,
    monto_venta DECIMAL(12,2) NOT NULL,
    porcentaje_comision DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    monto_comision DECIMAL(12,2) NOT NULL,
    monto_vendedor DECIMAL(12,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'Pendiente',
    fecha_generacion DATETIME DEFAULT NOW(),
    fecha_pago_vendedor DATETIME DEFAULT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO comisiones (id_orden, id_tienda, monto_venta, porcentaje_comision, monto_comision, monto_vendedor, estado, fecha_generacion)
SELECT o.id_orden, l.id_tienda,
    SUM(d.cantidad * d.precio_unitario),
    7.00,
    ROUND(SUM(d.cantidad * d.precio_unitario) * 0.07, 2),
    ROUND(SUM(d.cantidad * d.precio_unitario) * 0.93, 2),
    CASE WHEN o.estado_orden = 'Entregada' THEN 'Pagada'
         WHEN o.estado_orden = 'Cancelada' THEN 'Devuelta' ELSE 'Pendiente' END,
    o.fecha_orden
FROM ordenes_compra o
INNER JOIN detalle_orden d ON o.id_orden = d.id_orden
INNER JOIN libros l ON d.id_libro = l.id_libro
GROUP BY o.id_orden, l.id_tienda, o.estado_orden, o.fecha_orden;

-- CORRECCIoN 4 (ejecucion): ahora que comisiones existe,
-- ya se puede llamar sp_resumen_financiero_plataforma.
CALL sp_resumen_financiero_plataforma();
SELECT '--- sp_resumen_financiero_plataforma ejecutado ---' AS '';

CREATE TABLE IF NOT EXISTS historial_pagos_vendedor (
    id_pago_vendedor INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    total_ventas DECIMAL(12,2) NOT NULL,
    total_comisiones DECIMAL(12,2) NOT NULL,
    total_reembolsos DECIMAL(12,2) DEFAULT 0.00,
    monto_transferido DECIMAL(12,2) NOT NULL,
    id_cuenta_destino INT NOT NULL,
    referencia_transferencia VARCHAR(100) DEFAULT NULL,
    estado_transferencia VARCHAR(30) DEFAULT 'Completada',
    fecha_transferencia DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    FOREIGN KEY (id_cuenta_destino) REFERENCES metodos_cobro_vendedor(id_metodo)
);

INSERT INTO historial_pagos_vendedor (id_tienda, periodo_inicio, periodo_fin, total_ventas, total_comisiones, total_reembolsos, monto_transferido, id_cuenta_destino, referencia_transferencia, estado_transferencia, fecha_transferencia) VALUES
(1,'2024-05-01','2024-05-31',173000,12110,35000,125890,1,'TRF-2024-05-001','Completada','2024-06-05 09:00:00'),
(1,'2024-06-01','2024-06-30',120000,8400,0,111600,1,'TRF-2024-06-001','Completada','2024-07-05 09:00:00'),
(2,'2024-07-01','2024-07-31',40000,2800,0,37200,2,'TRF-2024-07-002','Completada','2024-08-05 09:00:00'),
(3,'2024-10-01','2024-10-31',85000,5950,5000,74050,3,'TRF-2024-10-003','Completada','2024-11-05 09:00:00'),
(6,'2025-01-01','2025-01-31',100000,7000,0,93000,6,'TRF-2025-01-006','Completada','2025-02-05 09:00:00'),
(7,'2025-02-01','2025-02-28',140000,9800,0,130200,7,'TRF-2025-02-007','Completada','2025-03-05 09:00:00'),
(1,'2025-03-01','2025-03-31',63000,4410,0,58590,1,'TRF-2025-03-001','Pendiente',NULL);

CREATE TABLE IF NOT EXISTS tipos_impulso (
    id_tipo_impulso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    precio DECIMAL(10,2) NOT NULL,
    duracion_dias INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

INSERT INTO tipos_impulso (nombre, descripcion, precio, duracion_dias, tipo) VALUES
('Libro destacado en Home','Tu libro aparece en la seccion principal.',25000,7,'home'),
('Banner en categoria','Tu tienda como banner en una categoria especifica.',18000,5,'categoria'),
('Libro del Dia','Solo un libro por dia puede tener este impulso.',35000,1,'libro_dia'),
('Email a suscriptores','Email personalizado a todos los usuarios suscritos.',22000,1,'email');

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

INSERT INTO impulsos_contratados (id_tienda, id_tipo_impulso, id_libro, id_categoria, fecha_inicio, fecha_fin, monto_pagado, estado, impresiones, clics, ventas_generadas) VALUES
(1,1,1,NULL,'2024-03-01 00:00:00','2024-03-08 00:00:00',25000,'Finalizado',1240,87,5),
(2,2,NULL,3,'2024-04-10 00:00:00','2024-04-15 00:00:00',18000,'Finalizado',890,62,3),
(3,3,5,NULL,'2024-06-15 00:00:00','2024-06-16 00:00:00',35000,'Finalizado',3200,210,12),
(5,1,9,NULL,'2024-10-01 00:00:00','2024-10-08 00:00:00',25000,'Finalizado',980,71,6),
(6,3,11,NULL,'2024-11-05 00:00:00','2024-11-06 00:00:00',35000,'Finalizado',2900,185,9),
(7,1,13,NULL,'2025-01-15 00:00:00','2025-01-22 00:00:00',25000,'Finalizado',1100,92,7),
(1,3,2,NULL,'2025-03-20 00:00:00','2025-03-21 00:00:00',35000,'Activo',420,31,2);

CREATE TABLE IF NOT EXISTS pagos_impulsos (
    id_pago_impulso INT AUTO_INCREMENT PRIMARY KEY,
    id_impulso INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    referencia VARCHAR(100) DEFAULT NULL,
    estado_pago VARCHAR(30) DEFAULT 'Aprobado',
    fecha_pago DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_impulso) REFERENCES impulsos_contratados(id_impulso)
);

INSERT INTO pagos_impulsos (id_impulso, metodo_pago, monto, referencia, estado_pago, fecha_pago) VALUES
(1,'Tarjeta Credito',25000,'IMP-REF-001','Aprobado','2024-02-28 10:00:00'),
(2,'PSE',18000,'IMP-REF-002','Aprobado','2024-04-09 14:00:00'),
(3,'Transferencia',35000,'IMP-REF-003','Aprobado','2024-06-14 09:00:00'),
(4,'Tarjeta Credito',25000,'IMP-REF-004','Aprobado','2024-09-30 10:00:00'),
(5,'Transferencia',35000,'IMP-REF-005','Aprobado','2024-11-04 09:00:00'),
(6,'PSE',25000,'IMP-REF-006','Aprobado','2025-01-14 11:00:00'),
(7,'Transferencia',35000,'IMP-REF-007','Aprobado','2025-03-19 09:00:00');

CREATE TABLE IF NOT EXISTS planes_herramientas (
    id_plan INT AUTO_INCREMENT PRIMARY KEY,
    nombre_plan VARCHAR(50) NOT NULL,
    precio_mensual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estadisticas_basicas BOOLEAN DEFAULT TRUE,
    estadisticas_avanzadas BOOLEAN DEFAULT FALSE,
    exportar_reportes BOOLEAN DEFAULT FALSE,
    soporte_prioritario BOOLEAN DEFAULT FALSE,
    historial_meses INT DEFAULT 1,
    impulsos_con_descuento DECIMAL(5,2) DEFAULT 0.00,
    descripcion VARCHAR(300)
);

INSERT INTO planes_herramientas (nombre_plan, precio_mensual, estadisticas_basicas, estadisticas_avanzadas, exportar_reportes, soporte_prioritario, historial_meses, impulsos_con_descuento, descripcion) VALUES
('Gratuito',0.00,TRUE,FALSE,FALSE,FALSE,1,0.00,'Resumen del mes, ventas totales e ingresos. Soporte estandar con respuesta en 48h.'),
('Herramientas Pro',29000.00,TRUE,TRUE,TRUE,TRUE,12,10.00,'Estadisticas completas, exporta en Excel/PDF, soporte prioritario en 2h, 10% en impulsos y 12 meses de historial.');

CREATE TABLE IF NOT EXISTS suscripciones_herramientas (
    id_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_plan INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    renovacion_automatica BOOLEAN DEFAULT TRUE,
    estado VARCHAR(30) DEFAULT 'Activa',
    metodo_pago VARCHAR(50) DEFAULT NULL,
    monto_pagado DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda),
    FOREIGN KEY (id_plan) REFERENCES planes_herramientas(id_plan)
);

INSERT INTO suscripciones_herramientas (id_tienda, id_plan, fecha_inicio, fecha_fin, renovacion_automatica, estado, metodo_pago, monto_pagado) VALUES
(1,2,'2024-06-01','2025-06-01',TRUE,'Activa','Tarjeta Credito',29000),
(3,2,'2024-10-01','2025-10-01',TRUE,'Activa','PSE',29000),
(6,2,'2025-01-01','2026-01-01',TRUE,'Activa','Transferencia',29000),
(7,2,'2025-02-01','2026-02-01',FALSE,'Activa','Tarjeta Credito',29000),
(2,2,'2024-04-01','2024-10-01',FALSE,'Vencida','PSE',29000),
(4,1,'2024-01-01','2099-12-31',FALSE,'Activa',NULL,0.00),
(5,1,'2024-01-01','2099-12-31',FALSE,'Activa',NULL,0.00);

CREATE TABLE IF NOT EXISTS solicitudes_soporte (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    asunto VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'Normal',
    estado VARCHAR(30) DEFAULT 'Abierto',
    respuesta TEXT DEFAULT NULL,
    tiempo_respuesta_horas INT DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT NOW(),
    fecha_resolucion DATETIME DEFAULT NULL,
    FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO solicitudes_soporte (id_tienda, asunto, descripcion, categoria, prioridad, estado, respuesta, tiempo_respuesta_horas, fecha_creacion, fecha_resolucion) VALUES
(1,'No me llego el pago de mayo','El periodo de mayo ya cerro pero no veo la transferencia.','pago','Urgente','Resuelto','Verificamos la transferencia. Hubo un retraso bancario.',1,'2024-06-06 08:00:00','2024-06-06 09:00:00'),
(3,'Error al subir imagen','Al subir la foto de portada aparece error 413.','tecnico','Urgente','Resuelto','El archivo superaba 5MB. Reducela para solucionar.',2,'2024-11-01 10:00:00','2024-11-01 12:00:00'),
(2,'Quiero cancelar una orden','El cliente pidio cancelar la orden #9 pero ya la despache.','envio','Normal','Resuelto','Coordinar la devolucion directamente con el cliente.',36,'2024-08-26 14:00:00','2024-08-28 02:00:00'),
(4,'Cuenta bancaria rechazada','Registre mi cuenta del BBVA pero aparece como no verificada.','cuenta','Normal','En revision',NULL,NULL,'2025-01-15 09:00:00',NULL),
(5,'Como acceder a estadisticas avanzadas','Tengo plan gratuito, ¿como veo mas detalle?','otro','Normal','Resuelto','Con el plan Herramientas Pro ($29.000/mes) tienes acceso completo.',28,'2025-03-01 10:00:00','2025-03-02 14:00:00');

-- Genera automaticamente la comision de la plataforma y del vendedor al registrar un detalle de orden.
DROP TRIGGER IF EXISTS trg_generar_comision;
DELIMITER //
CREATE TRIGGER trg_generar_comision
AFTER INSERT ON detalle_orden FOR EACH ROW
BEGIN
    DECLARE v_id_tienda INT; DECLARE v_subtotal DECIMAL(12,2);
    SELECT id_tienda INTO v_id_tienda FROM libros WHERE id_libro = NEW.id_libro;
    SET v_subtotal = NEW.cantidad * NEW.precio_unitario;
    INSERT INTO comisiones (id_orden, id_tienda, monto_venta, porcentaje_comision, monto_comision, monto_vendedor, estado)
    VALUES (NEW.id_orden, v_id_tienda, v_subtotal, 7.00,
            ROUND(v_subtotal * 0.07, 2), ROUND(v_subtotal * 0.93, 2), 'Pendiente');
END //
DELIMITER ;

-- Actualiza el estado de comisiones cuando una orden es entregada o cancelada.
DROP TRIGGER IF EXISTS trg_pagar_comision_entrega;
DELIMITER //
CREATE TRIGGER trg_pagar_comision_entrega
AFTER UPDATE ON ordenes_compra FOR EACH ROW
BEGIN
    IF NEW.estado_orden = 'Entregada' AND OLD.estado_orden != 'Entregada' THEN
        UPDATE comisiones SET estado = 'Pagada',
            fecha_pago_vendedor = DATE_ADD(NOW(), INTERVAL 3 DAY)
        WHERE id_orden = NEW.id_orden;
    END IF;
    IF NEW.estado_orden = 'Cancelada' AND OLD.estado_orden != 'Cancelada' THEN
        UPDATE comisiones SET estado = 'Devuelta' WHERE id_orden = NEW.id_orden;
    END IF;
END //
DELIMITER ;

-- Aplica descuento automatico en impulsos si la tienda tiene suscripcion Pro activa.
DROP TRIGGER IF EXISTS trg_descuento_impulso_pro;
DELIMITER //
CREATE TRIGGER trg_descuento_impulso_pro
BEFORE INSERT ON impulsos_contratados FOR EACH ROW
BEGIN
    DECLARE v_tiene_pro INT; DECLARE v_precio_base DECIMAL(10,2);
    SELECT COUNT(*) INTO v_tiene_pro FROM suscripciones_herramientas sh
    INNER JOIN planes_herramientas ph ON sh.id_plan = ph.id_plan
    WHERE sh.id_tienda = NEW.id_tienda AND sh.estado = 'Activa'
      AND ph.impulsos_con_descuento > 0 AND CURDATE() BETWEEN sh.fecha_inicio AND sh.fecha_fin;
    IF v_tiene_pro > 0 THEN
        SELECT precio INTO v_precio_base FROM tipos_impulso WHERE id_tipo_impulso = NEW.id_tipo_impulso;
        SET NEW.monto_pagado = ROUND(v_precio_base * 0.90, 2);
    END IF;
END //
DELIMITER ;

-- Asigna prioridad de soporte segun si la tienda cuenta con plan Pro activo.
DROP TRIGGER IF EXISTS trg_prioridad_soporte_pro;
DELIMITER //
CREATE TRIGGER trg_prioridad_soporte_pro
BEFORE INSERT ON solicitudes_soporte FOR EACH ROW
BEGIN
    DECLARE v_tiene_pro INT;
    SELECT COUNT(*) INTO v_tiene_pro FROM suscripciones_herramientas sh
    INNER JOIN planes_herramientas ph ON sh.id_plan = ph.id_plan
    WHERE sh.id_tienda = NEW.id_tienda AND sh.estado = 'Activa'
      AND ph.soporte_prioritario = TRUE AND CURDATE() BETWEEN sh.fecha_inicio AND sh.fecha_fin;
    IF v_tiene_pro > 0 THEN SET NEW.prioridad = 'Urgente';
    ELSE SET NEW.prioridad = 'Normal'; END IF;
END //
DELIMITER ;

-- Resume los ingresos por comisiones agrupados por mes y ano.
DROP VIEW IF EXISTS vista_ingresos_comisiones;
CREATE VIEW vista_ingresos_comisiones AS
SELECT YEAR(fecha_generacion) AS anio, MONTH(fecha_generacion) AS mes,
    SUM(monto_comision) AS ingresos_comisiones
FROM comisiones WHERE estado IN ('Pagada', 'Pendiente')
GROUP BY YEAR(fecha_generacion), MONTH(fecha_generacion)
ORDER BY anio DESC, mes DESC;

-- Resume los ingresos generados por impulsos de visibilidad por mes.
DROP VIEW IF EXISTS vista_ingresos_impulsos;
CREATE VIEW vista_ingresos_impulsos AS
SELECT YEAR(pi.fecha_pago) AS anio, MONTH(pi.fecha_pago) AS mes,
    SUM(pi.monto) AS ingresos_impulsos
FROM pagos_impulsos pi WHERE pi.estado_pago = 'Aprobado'
GROUP BY YEAR(pi.fecha_pago), MONTH(pi.fecha_pago)
ORDER BY anio DESC, mes DESC;

-- Resume los ingresos provenientes de suscripciones a herramientas Pro.
DROP VIEW IF EXISTS vista_ingresos_herramientas;
CREATE VIEW vista_ingresos_herramientas AS
SELECT YEAR(sh.fecha_inicio) AS anio, MONTH(sh.fecha_inicio) AS mes,
    SUM(sh.monto_pagado) AS ingresos_herramientas
FROM suscripciones_herramientas sh
WHERE sh.estado != 'Cancelada' AND sh.monto_pagado > 0
GROUP BY YEAR(sh.fecha_inicio), MONTH(sh.fecha_inicio)
ORDER BY anio DESC, mes DESC;

-- Muestra las comisiones pendientes por tienda y monto a pagar a vendedores.
DROP VIEW IF EXISTS vista_comisiones_pendientes;
CREATE VIEW vista_comisiones_pendientes AS
SELECT t.nombre_tienda, u.nombre_usuario AS vendedor,
    COUNT(c.id_comision) AS ordenes_pendientes,
    SUM(c.monto_venta) AS ventas_totales,
    SUM(c.monto_comision) AS comision_bookyhome,
    SUM(c.monto_vendedor) AS por_pagar_vendedor
FROM comisiones c
INNER JOIN tiendas t ON c.id_tienda = t.id_tienda
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
WHERE c.estado = 'Pendiente'
GROUP BY t.id_tienda, t.nombre_tienda, u.nombre_usuario
ORDER BY por_pagar_vendedor DESC;

-- Analiza el rendimiento de campanas de impulsos con metricas de conversion.
DROP VIEW IF EXISTS vista_rendimiento_impulsos;
CREATE VIEW vista_rendimiento_impulsos AS
SELECT t.nombre_tienda, ti.nombre AS tipo_impulso, l.titulo AS libro_impulsado,
    ic.monto_pagado, ic.impresiones, ic.clics, ic.ventas_generadas,
    CASE WHEN ic.impresiones > 0 THEN ROUND((ic.clics / ic.impresiones) * 100, 2) ELSE 0 END AS tasa_clic_pct,
    CASE WHEN ic.clics > 0 THEN ROUND((ic.ventas_generadas / ic.clics) * 100, 2) ELSE 0 END AS tasa_conversion_pct,
    ic.estado
FROM impulsos_contratados ic
INNER JOIN tiendas t ON ic.id_tienda = t.id_tienda
INNER JOIN tipos_impulso ti ON ic.id_tipo_impulso = ti.id_tipo_impulso
LEFT JOIN libros l ON ic.id_libro = l.id_libro
ORDER BY ic.fecha_inicio DESC;

-- Muestra el estado de suscripcion freemium de las tiendas y acceso actual a beneficios.
DROP VIEW IF EXISTS vista_estado_freemium;
CREATE VIEW vista_estado_freemium AS
SELECT t.nombre_tienda, u.nombre_usuario AS vendedor, ph.nombre_plan,
    ph.precio_mensual, ph.estadisticas_avanzadas, ph.exportar_reportes,
    ph.soporte_prioritario, sh.fecha_fin, sh.estado AS estado_suscripcion,
    CASE WHEN CURDATE() BETWEEN sh.fecha_inicio AND sh.fecha_fin AND sh.estado = 'Activa'
    THEN 'Activo' ELSE 'Inactivo' END AS acceso_actual
FROM tiendas t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
LEFT JOIN suscripciones_herramientas sh ON t.id_tienda = sh.id_tienda
LEFT JOIN planes_herramientas ph ON sh.id_plan = ph.id_plan
ORDER BY ph.precio_mensual DESC;

-- Genera un resumen financiero mensual agrupando ingresos por comisiones, impulsos y herramientas.
DROP PROCEDURE IF EXISTS sp_resumen_financiero_mes;
DELIMITER //
CREATE PROCEDURE sp_resumen_financiero_mes(IN p_mes INT, IN p_anio INT)
BEGIN
    SELECT 'Comisiones por ventas' AS fuente, COUNT(*) AS transacciones,
        SUM(monto_comision) AS ingresos_bookyhome,
        SUM(monto_vendedor) AS pagado_a_vendedores
    FROM comisiones
    WHERE MONTH(fecha_generacion) = p_mes AND YEAR(fecha_generacion) = p_anio
      AND estado IN ('Pagada', 'Pendiente');
    SELECT 'Impulsos de visibilidad' AS fuente, COUNT(*) AS transacciones,
        SUM(pi.monto) AS ingresos_bookyhome, 0 AS pagado_a_vendedores
    FROM pagos_impulsos pi
    WHERE MONTH(pi.fecha_pago) = p_mes AND YEAR(pi.fecha_pago) = p_anio
      AND pi.estado_pago = 'Aprobado';
    SELECT 'Herramientas Pro' AS fuente, COUNT(*) AS transacciones,
        SUM(monto_pagado) AS ingresos_bookyhome, 0 AS pagado_a_vendedores
    FROM suscripciones_herramientas
    WHERE MONTH(fecha_inicio) = p_mes AND YEAR(fecha_inicio) = p_anio
      AND estado != 'Cancelada' AND monto_pagado > 0;
END //
DELIMITER ;

SELECT '--- MODELO DE INGRESOS APLICADO ---' AS '';

-- =====================================================
-- ▸ STORED PROCEDURE: /api/stored/libros
-- =====================================================

-- Lista todos los libros disponibles en el sistema mostrando informacion basica como titulo, autor, categoria, tienda, precio y stock.
DROP PROCEDURE IF EXISTS sp_listar_libros_disponibles;
DELIMITER //
CREATE PROCEDURE sp_listar_libros_disponibles()
BEGIN
    SELECT 
        l.id_libro, 
        l.titulo, 
        l.autor_libro, 
        c.nombre_categoria, 
        t.nombre_tienda, 
        l.precio_libro, 
        l.stock
    FROM libros l
    INNER JOIN categorias c ON l.id_categoria = c.id_categoria
    INNER JOIN tiendas t ON l.id_tienda = t.id_tienda;
END //
DELIMITER ;

-- =====================================================
-- ▸ VISTA: DETALLES DEL CARRITO (usada por el frontend)
-- =====================================================

-- Muestra el detalle del carrito de compras con informacion del libro, tienda, imagen principal, cantidad y total por producto, solo incluyendo libros con stock disponible.
DROP VIEW IF EXISTS v_detalles_carrito;
CREATE VIEW v_detalles_carrito AS
SELECT 
    cc.id_carrito,
    cc.id_usuario,
    cc.id_libro,
    l.titulo,
    l.autor_libro,
    l.precio_libro,
    cc.cantidad,
    (cc.cantidad * l.precio_libro) AS total,
    l.stock,
    t.nombre_tienda,
    i.url_imagen AS imagen_principal
FROM carrito_compras cc
INNER JOIN libros l ON cc.id_libro = l.id_libro
INNER JOIN tiendas t ON l.id_tienda = t.id_tienda
LEFT JOIN imagenes_libro i ON l.id_libro = i.id_libro AND i.es_principal = TRUE
WHERE l.stock > 0;


-- =====================================================
-- ▸ VERIFICACIoN FINAL
-- =====================================================

SELECT '=== RESUMEN TOTAL DE BooKyHome ===' AS '';
SELECT 'usuarios'             AS Tabla, COUNT(*) AS Registros FROM usuarios;
SELECT 'tiendas'              AS Tabla, COUNT(*) AS Registros FROM tiendas;
SELECT 'libros'               AS Tabla, COUNT(*) AS Registros FROM libros;
SELECT 'ordenes_compra'       AS Tabla, COUNT(*) AS Registros FROM ordenes_compra;
SELECT 'pagos'                AS Tabla, COUNT(*) AS Registros FROM pagos;
SELECT 'envios'               AS Tabla, COUNT(*) AS Registros FROM envios;
SELECT 'carrito_compras'      AS Tabla, COUNT(*) AS Registros FROM carrito_compras;
SELECT 'cupones_descuento'    AS Tabla, COUNT(*) AS Registros FROM cupones_descuento;
SELECT 'devoluciones'         AS Tabla, COUNT(*) AS Registros FROM devoluciones;
SELECT 'notificaciones'       AS Tabla, COUNT(*) AS Registros FROM notificaciones;
SELECT 'comisiones'           AS Tabla, COUNT(*) AS Registros FROM comisiones;
SELECT 'impulsos_contratados' AS Tabla, COUNT(*) AS Registros FROM impulsos_contratados;
SELECT 'libro_variantes'      AS Tabla, COUNT(*) AS Registros FROM libro_variantes;
SELECT 'metricas_tienda'      AS Tabla, COUNT(*) AS Registros FROM metricas_tienda;
SELECT 'log_actividad'        AS Tabla, COUNT(*) AS Registros FROM log_actividad;

CALL sp_listar_libros_disponibles();
SELECT * FROM v_detalles_carrito;

-- poblacion de las tablas para pruebas en la pagina 

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. USUARIOS (Compradores, Vendedores y 1 Admin)
-- Contraseña para ingresar a cualquiera: La tuya encriptada con Bcrypt
-- =============================================================================
INSERT INTO usuarios (nombre_usuario, correo_usuario, telefono, estado_usuario, contrasena_usuario, rol, fecha_registro, email_verificado) VALUES
('Camila Rojas',        'camila.rojas@gmail.com',     '3001234567', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-01-15', TRUE),
('Andres Felipe Gomez',  'andres.gomez@hotmail.com',   '3012345678', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-01-20', TRUE),
('Valentina Castro',     'valentina.castro@gmail.com', '3023456789', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-02-02', TRUE),
('Juan Pablo Martinez',  'jp.martinez@outlook.com',    '3034567890', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-02-10', TRUE),
('Laura Daniela Perez',  'laura.perez@gmail.com',      '3045678901', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-02-18', TRUE),
('Santiago Ramirez',     'santiago.ramirez@gmail.com', '3056789012', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-03-01', TRUE),
('Mariana Lopez',        'mariana.lopez@yahoo.com',    '3067890123', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-03-12', TRUE),
('Daniel Esteban Torres','daniel.torres@gmail.com',    '3078901234', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-03-20', TRUE),
('Isabella Sanchez',     'isabella.sanchez@gmail.com', '3089012345', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-04-05', TRUE),
('Nicolas Vargas',       'nicolas.vargas@hotmail.com', '3090123456', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'comprador', '2025-04-22', TRUE),
('Libreria El Sotano SAS',     'contacto@elsotano.co',       '3101111111', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '2024-11-10', TRUE),
('Pagina Trece Libros',        'ventas@paginatrece.co',      '3102222222', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '2024-11-15', TRUE),
('Rincon Literario Bogota',    'info@rinconliterario.co',    '3103333333', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '2024-12-01', TRUE),
('Libros Usados Medellin',     'contacto@librosusadosmed.co','3104444444', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '2024-12-10', TRUE),
('Universo de Tinta',          'hola@universodetinta.co',    '3105555555', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '2025-01-05', TRUE),
('Tienda en Vacaciones Test',  'pausa@vacacionestest.co',    '3106666666', 'Suspendido', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '2025-01-08', TRUE),
('Administrador BookyHome', 'admin@bookyhome.co', '3000000000', 'Activo', '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'admin', '2024-10-01', TRUE);

-- =============================================================================
-- 2. TIENDAS
-- =============================================================================
INSERT INTO tiendas (id_usuario, nombre_tienda, direccion, telefono, estado_tienda, fecha_creacion) VALUES
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'contacto@elsotano.co'), 'Librería El Sótano', 'Calle 45 # 13-22', '3101111111', 'Activo', '2024-11-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'ventas@paginatrece.co'), 'Página Trece', 'Carrera 7 # 54-10', '3102222222', 'Activo', '2024-11-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'info@rinconliterario.co'), 'El Rincón Literario', 'Av. El Poblado # 10-50', '3103333333', 'Activo', '2024-12-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'contacto@librosusadosmed.co'), 'Libros Usados Medellín', 'Circular 4 # 73-15', '3104444444', 'Activo', '2024-12-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'hola@universodetinta.co'), 'Universo de Tinta', 'Calle 18 # 6-31', '3105555555', 'Activo', '2025-01-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'pausa@vacacionestest.co'), 'Tienda Test Pausada', 'Carrera 15 # 85-12', '3106666666', 'Inactivo', '2025-01-08');

-- =============================================================================
-- 3. CALIFICACIONES TIENDAS
-- =============================================================================
INSERT INTO calificaciones_tiendas (id_tienda, id_usuario, calificacion, comentario, fecha_calificacion) VALUES
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), 5, 'Excelente atención y el libro llegó impecable.', '2025-02-10'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), 4, 'Buen catálogo, demoró un día más de lo esperado.', '2025-02-22'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), 5, '¡Encontré ediciones hermosas de fantasía!', '2025-03-05'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'jp.martinez@outlook.com'), 4, 'Buen empaque y libros muy bien cuidados.', '2025-03-18'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'laura.perez@gmail.com'), 4, 'Libro usado en perfecto estado económico.', '2025-04-02'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'santiago.ramirez@gmail.com'), 5, 'Entrega superrápida y el manga venía con extras.', '2025-04-15'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'mariana.lopez@yahoo.com'), 5, 'Servicio muy profesional.', '2025-04-20'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), (SELECT id_usuario FROM usuarios WHERE correo_usuario = 'daniel.torres@gmail.com'), 3, 'El libro es genial pero la transportadora se demoró.', '2025-04-25');

-- =============================================================================
-- 4. LIBROS (Los 30 libros originales adaptados a tus categorías)
-- =============================================================================
INSERT INTO libros (id_tienda, id_categoria, titulo, autor_libro, descripcion_libro, precio_libro, stock, estado_libro, fecha_publicacion, fecha_listado) VALUES
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 4, 'Cien años de soledad', 'Gabriel García Márquez', 'La saga de la familia Buendía en el pueblo ficticio de Macondo.', 45000.00, 10, 'Visible', '1967-05-30', '2025-01-15'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 4, '1984', 'George Orwell', 'Una inquietante visión totalitaria del futuro bajo la vigilancia constante del Gran Hermano.', 35000.00, 15, 'Visible', '1949-06-08', '2025-01-16'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 11, 'Sapiens: De animales a dioses', 'Yuval Noah Harari', 'Una breve historia de la humanidad, desde los primeros humanos hasta los avances de hoy.', 59000.00, 7, 'Visible', '2011-01-01', '2025-01-17'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 1, 'Padre Rico, Padre Pobre', 'Robert Kiyosaki', 'Evidencia lo que los ricos enseñan a sus hijos sobre el dinero que la clase media no.', 38000.00, 0, 'Visible', '1997-04-01', '2025-01-18'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 4, 'El amor en los tiempos del cólera', 'Gabriel García Márquez', 'La historia de amor verdadero entre Fermina Daza y Florentino Ariza que resiste el tiempo.', 42000.00, 4, 'Visible', '1985-03-06', '2025-01-19'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 11, 'Breve historia del tiempo', 'Stephen Hawking', 'Un viaje a través del espacio y el tiempo explicando los agujeros negros y el Big Bang.', 39000.00, 3, 'Visible', '1988-04-01', '2025-01-20'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 4, 'Crimen y castigo', 'Fiódor Dostoyevski', 'El dilema moral y psicológico del joven Raskólnikov tras cometer un asesinato.', 32000.00, 2, 'Visible', '1866-01-01', '2025-01-21'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 1, 'El Señor de los Anillos: La Comunidad del Anillo', 'J.R.R. Tolkien', 'El inicio del viaje del hobbit Frodo Bolsón para destruir el Anillo Único.', 55000.00, 8, 'Visible', '1954-07-29', '2025-01-22'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 1, 'Harry Potter y la piedra filosofal', 'J.K. Rowling', 'Un niño huérfano descubre en su undécimo cumpleaños que es un mago.', 42000.00, 12, 'Visible', '1997-06-26', '2025-01-23'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 4, 'Fahrenheit 451', 'Ray Bradbury', 'Una sociedad futura donde los libros están prohibidos y los bomberos los queman.', 29000.00, 6, 'Visible', '1953-10-19', '2025-01-24'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 1, 'Crónicas de Narnia: El león, la bruja y el ropero', 'C.S. Lewis', 'Cuatro hermanos descubren un mundo mágico detrás de un armario.', 34000.00, 11, 'Visible', '1950-10-16', '2025-01-25'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 4, 'Un mundo feliz', 'Aldous Huxley', 'Una sociedad utópica que ha sacrificado las emociones y el arte por estabilidad.', 31000.00, 5, 'Visible', '1932-02-01', '2025-01-26'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 1, 'El Hobbit', 'J.R.R. Tolkien', 'La gran aventura de Bilbo Bolsón junto a enanos para rescatar un tesoro.', 48000.00, 9, 'Visible', '1937-09-21', '2025-01-27'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 15, 'Steve Jobs', 'Walter Isaacson', 'La biografía exclusiva del fundador de Apple basada en más de cuarenta entrevistas.', 65000.00, 5, 'Visible', '2011-10-24', '2025-01-28'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 1, 'Hábitos Atómicos', 'James Clear', 'Una guía práctica para romper malos hábitos y desarrollar buenos comportamientos.', 49000.00, 20, 'Visible', '2018-10-16', '2025-01-29'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 10, 'El infinito en un junco', 'Irene Vallejo', 'Un ensayo hermoso sobre la invención de los libros en el mundo antiguo.', 69000.00, 4, 'Visible', '2019-09-01', '2025-01-30'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 15, 'Frida Kahlo: Una biografía', 'Hayden Herrera', 'La biografía definitiva de la pintora mexicana llena de arte y dolor.', 45000.00, 2, 'Visible', '1983-03-01', '2025-01-31'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 10, 'Moderna de Pueblo: Idiotizadas', 'Raquel Córcoles', 'Un cómic divertido que cuestiona los antiguos mitos de las princesas.', 38000.00, 6, 'Visible', '2017-10-24', '2025-02-01'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), 3, 'El Resplandor', 'Stephen King', 'Un escritor se traslada con su familia a un hotel aislado donde despiertan fuerzas oscuras.', 25000.00, 1, 'Visible', '1977-01-28', '2025-02-02'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), 3, 'Drácula', 'Bram Stoker', 'La clásica historia de terror del conde vampiro de Transilvania.', 22000.00, 3, 'Visible', '1897-05-26', '2025-02-03'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), 3, 'It (Eso)', 'Stephen King', 'Un grupo de niños es aterrorizado por un monstruo que cambia de forma.', 68000.00, 4, 'Visible', '1986-09-15', '2025-02-04'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), 4, 'Don Quijote de la Mancha', 'Miguel de Cervantes', 'Las aventuras del famoso caballero andante y su escudero Sancho Panza.', 50000.00, 2, 'Visible', '1605-01-16', '2025-02-05'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), 3, 'Frankenstein', 'Mary Shelley', 'Un científico crea una criatura a partir de restos humanos y sufre las consecuencias.', 18000.00, 5, 'Visible', '1818-01-01', '2025-02-06'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 14, 'Maus', 'Art Spiegelman', 'La historia de un superviviente del Holocausto relatada mediante cómics de animales.', 75000.00, 4, 'Visible', '1986-09-01', '2025-02-07'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 2, 'Orgullo y Prejuicio', 'Jane Austen', 'La tormentosa relación entre Elizabeth Bennet y el aristócrata Fitzwilliam Darcy.', 28000.00, 6, 'Visible', '1813-01-28', '2025-02-08'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 9, 'Heartstopper: Volumen 1', 'Alice Oseman', 'Dos chicos se conocen, se hacen amigos y empiezan a enamorarse en esta novela gráfica.', 52000.00, 9, 'Visible', '2019-02-07', '2025-02-09'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 2, 'Bajo la misma estrella', 'John Green', 'La emotiva historia de amor de dos adolescentes que sufren cáncer.', 25000.00, 12, 'Visible', '2012-01-10', '2025-02-10'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 9, 'Kimetsu no Yaiba - Tomo 1', 'Koyoharu Gotouge', 'Tanjiro se convierte en cazador de demonios para salvar a su hermana Nezuko.', 35000.00, 18, 'Visible', '2016-06-03', '2025-02-11'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 9, 'El principito', 'Antoine de Saint-Exupéry', 'Un piloto perdido en el desierto conoce a un pequeño príncipe de otro planeta.', 20000.00, 25, 'Visible', '1943-04-06', '2025-02-12'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 4, 'Libro de Prueba Oculto', 'Autor Anónimo', 'Este libro no debería verse en el catálogo general.', 15000.00, 5, 'Oculto', '2025-01-01', '2025-02-13');
-- =============================================================================
-- 5. IMÁGENES DE LIBRO
-- =============================================================================
INSERT INTO imagenes_libro (id_libro, url_imagen, es_principal) VALUES
((SELECT id_libro FROM libros WHERE titulo = 'Cien años de soledad'), 'https://covers.openlibrary.org/b/id/12711612-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = '1984'), 'https://covers.openlibrary.org/b/id/12642132-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Sapiens: De animales a dioses'), 'https://covers.openlibrary.org/b/id/12918451-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Padre Rico, Padre Pobre'), 'https://covers.openlibrary.org/b/id/12967681-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'El amor en los tiempos del cólera'), 'https://covers.openlibrary.org/b/id/12754622-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Breve historia del tiempo'), 'https://covers.openlibrary.org/b/id/10414133-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Crimen y castigo'), 'https://covers.openlibrary.org/b/id/12655122-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'El Señor de los Anillos: La Comunidad del Anillo'), 'https://covers.openlibrary.org/b/id/12836262-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Harry Potter y la piedra filosofal'), 'https://covers.openlibrary.org/b/id/10521270-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Fahrenheit 451'), 'https://covers.openlibrary.org/b/id/12923521-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Crónicas de Narnia: El león, la bruja y el ropero'), 'https://covers.openlibrary.org/b/id/12788523-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Un mundo feliz'), 'https://covers.openlibrary.org/b/id/12814522-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'El Hobbit'), 'https://covers.openlibrary.org/b/id/12546521-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Steve Jobs'), 'https://covers.openlibrary.org/b/id/8394017-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Hábitos Atómicos'), 'https://covers.openlibrary.org/b/id/12885449-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'El infinito en un junco'), 'https://covers.openlibrary.org/b/id/10214152-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Frida Kahlo: Una biografía'), 'https://covers.openlibrary.org/b/id/11252110-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Moderna de Pueblo: Idiotizadas'), 'https://covers.openlibrary.org/b/id/9521142-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'El Resplandor'), 'https://covers.openlibrary.org/b/id/11440713-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Drácula'), 'https://covers.openlibrary.org/b/id/12612142-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'It (Eso)'), 'https://covers.openlibrary.org/b/id/12852110-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Don Quijote de la Mancha'), 'https://covers.openlibrary.org/b/id/12752210-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Frankenstein'), 'https://covers.openlibrary.org/b/id/12711225-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Maus'), 'https://covers.openlibrary.org/b/id/12390124-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Orgullo y Prejuicio'), 'https://covers.openlibrary.org/b/id/12739345-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Heartstopper: Volumen 1'), 'https://covers.openlibrary.org/b/id/12845621-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Bajo la misma estrella'), 'https://covers.openlibrary.org/b/id/12411542-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'Kimetsu no Yaiba - Tomo 1'), 'https://covers.openlibrary.org/b/id/10322110-L.jpg', 1),
((SELECT id_libro FROM libros WHERE titulo = 'El principito'), 'https://covers.openlibrary.org/b/id/12688412-L.jpg', 1);

-- =============================================================================
-- 6. VARIANTES DE LIBROS (Formatos, Precios y Stocks correspondientes)
-- =============================================================================
INSERT INTO libro_variantes (id_libro, tipo_tapa, idioma, edicion, isbn, precio_variante, stock_variante, peso_gramos, numero_paginas, activa) VALUES
((SELECT id_libro FROM libros WHERE titulo = 'Cien años de soledad'), 'Tapa Blanda', 'Español', 'Edición Conmemorativa', '9780307474728', 45000.00, 10, 450, 496, 1),
((SELECT id_libro FROM libros WHERE titulo = '1984'), 'Tapa Blanda', 'Español', 'Primera Edición', '9780451524935', 35000.00, 15, 300, 328, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Sapiens: De animales a dioses'), 'Tapa Dura', 'Español', 'Décima Impresión', '9780062316097', 59000.00, 7, 600, 496, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Padre Rico, Padre Pobre'), 'Tapa Blanda', 'Español', 'Edición Ampliada', '9781612680194', 38000.00, 0, 250, 207, 1),
((SELECT id_libro FROM libros WHERE titulo = 'El amor en los tiempos del cólera'), 'Tapa Blanda', 'Español', 'Edición Especial', '9780307387264', 42000.00, 4, 380, 368, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Breve historia del tiempo'), 'Tapa Blanda', 'Español', 'Crítica', '9780553380163', 39000.00, 3, 280, 256, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Crimen y castigo'), 'Tapa Dura', 'Español', 'Clásicos Universales', '9788497940122', 32000.00, 2, 700, 608, 1),
((SELECT id_libro FROM libros WHERE titulo = 'El Señor de los Anillos: La Comunidad del Anillo'), 'Tapa Dura', 'Español', 'Ilustrada', '9780618346257', 55000.00, 8, 800, 423, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Harry Potter y la piedra filosofal'), 'Tapa Blanda', 'Español', 'Salamandra', '9780747532699', 42000.00, 12, 310, 223, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Fahrenheit 451'), 'Tapa Blanda', 'Español', 'Debolsillo', '9780345342966', 29000.00, 6, 200, 176, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Crónicas de Narnia: El león, la bruja y el ropero'), 'Tapa Blanda', 'Español', 'Destino', '9780064471046', 34000.00, 11, 220, 206, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Un mundo feliz'), 'Tapa Blanda', 'Español', 'Plaza & Janés', '9780060850524', 31000.00, 5, 270, 288, 1),
((SELECT id_libro FROM libros WHERE titulo = 'El Hobbit'), 'Tapa Dura', 'Español', 'Minotauro', '9780261102217', 48000.00, 9, 400, 310, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Steve Jobs'), 'Tapa Dura', 'Español', 'Biografías Debate', '9781451648539', 65000.00, 5, 900, 744, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Hábitos Atómicos'), 'Tapa Blanda', 'Español', 'Diana', '9780525538288', 49000.00, 20, 340, 320, 1),
((SELECT id_libro FROM libros WHERE titulo = 'El infinito en un junco'), 'Tapa Dura', 'Español', 'Siruela Colección', '9788417860790', 69000.00, 4, 520, 452, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Frida Kahlo: Una biografía'), 'Tapa Blanda', 'Español', 'Circe', '9780060085896', 45000.00, 2, 580, 528, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Moderna de Pueblo: Idiotizadas'), 'Tapa Blanda', 'Español', 'Zenith Cómic', '9788408176886', 38000.00, 6, 410, 208, 1),
((SELECT id_libro FROM libros WHERE titulo = 'El Resplandor'), 'Tapa Blanda', 'Español', 'Best Seller', '9780385121682', 25000.00, 1, 460, 447, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Drácula'), 'Tapa Blanda', 'Español', 'Penguin Clásicos', '9780141439846', 22000.00, 3, 400, 416, 1),
((SELECT id_libro FROM libros WHERE titulo = 'It (Eso)'), 'Tapa Blanda', 'Español', 'DeBolsillo Max', '9780450411434', 68000.00, 4, 1100, 1138, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Don Quijote de la Mancha'), 'Tapa Dura', 'Español', 'RAE Centenario', '9788420412146', 50000.00, 2, 1300, 1056, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Frankenstein'), 'Tapa Blanda', 'Español', 'Austral', '9780141439471', 18000.00, 5, 260, 288, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Maus'), 'Tapa Blanda', 'Español', 'Completa', '9780304747231', 75000.00, 4, 480, 296, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Orgullo y Prejuicio'), 'Tapa Dura', 'Español', 'Alba Clásicos', '9780141439518', 28000.00, 6, 440, 432, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Heartstopper: Volumen 1'), 'Tapa Blanda', 'Español', 'Crossbooks', '9781510106284', 52000.00, 9, 320, 288, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Bajo la misma estrella'), 'Tapa Blanda', 'Español', 'Nube de Tinta', '9780316055437', 25000.00, 12, 330, 313, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Kimetsu no Yaiba - Tomo 1'), 'Tapa Blanda', 'Español', 'Norma Editorial', '9781974700523', 35000.00, 18, 180, 192, 1),
((SELECT id_libro FROM libros WHERE titulo = 'El principito'), 'Tapa Blanda', 'Español', 'Salamandra Infantil', '9780156012195', 20000.00, 25, 120, 96, 1),
((SELECT id_libro FROM libros WHERE titulo = 'Libro de Prueba Oculto'), 'Tapa Blanda', 'Español', 'Demo', '1111111111111', 15000.00, 5, 150, 100, 1);

-- =============================================================================
-- 7. RESEÑAS DE LIBROS
-- =============================================================================
INSERT INTO resenas_libros (id_usuario, id_libro, calificacion, comentario, fecha_resena) VALUES
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El amor en los tiempos del cólera'), 5, 'Gabo tiene una forma única de narrar el romance. Hermosa edición.', '2025-05-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Breve historia del tiempo'), 4, 'Un poco complejo en algunas partes, pero Hawking lo hace bastante accesible.', '2025-05-04'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El Hobbit'), 5, 'Una aventura fantástica perfecta. Ideal para leer antes de la trilogía principal.', '2025-05-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'jp.martinez@outlook.com'), (SELECT id_libro FROM libros WHERE titulo = 'Fahrenheit 451'), 4, 'Una distopía impresionante que te pone a pensar sobre el valor de la cultura.', '2025-05-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'laura.perez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Un mundo feliz'), 4, 'Excelente crítica social. El contraste con 1984 es fascinante.', '2025-05-18'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'santiago.ramirez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El Señor de los Anillos: La Comunidad del Anillo'), 5, 'La mejor obra de fantasía jamás escrita. El nivel de detalle del mundo es increíble.', '2025-05-22'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'mariana.lopez@yahoo.com'), (SELECT id_libro FROM libros WHERE titulo = 'Orgullo y Prejuicio'), 5, 'Mi novela romántica favorita. Los diálogos entre Elizabeth y Darcy son magníficos.', '2025-05-26'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'daniel.torres@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Drácula'), 4, 'El formato epistolar (por cartas y diarios) hace que la atmósfera sea muy inmersiva.', '2025-06-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'isabella.sanchez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Heartstopper: Volumen 1'), 5, 'Una historia preciosa, ligera y con ilustraciones hermosas. Se lee de una sentada.', '2025-06-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'nicolas.vargas@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Kimetsu no Yaiba - Tomo 1'), 4, 'Gran inicio para este manga, el arte de las batallas está muy bien logrado.', '2025-06-12'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Bajo la misma estrella'), 3, 'Es una historia conmovedora, pero cae en demasiados clichés adolescentes.', '2025-06-18'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'It (Eso)'), 5, 'Una obra maestra del terror. King logra construir un pueblo entero lleno de miedos.', '2025-06-22');

-- =============================================================================
-- 8. FAVORITOS (Los 10 registros completos del script)
-- =============================================================================
INSERT INTO favoritos (id_usuario, id_libro, fecha) VALUES
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Cien años de soledad'), '2026-01-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = '1984'), '2026-01-20'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El amor en los tiempos del cólera'), '2026-02-02'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = '1984'), '2026-01-22'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Breve historia del tiempo'), '2026-02-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'It (Eso)'), '2026-03-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Harry Potter y la piedra filosofal'), '2026-01-25'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El Hobbit'), '2026-02-18'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Crónicas de Narnia: El león, la bruja y el ropero'), '2026-03-12'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'jp.martinez@outlook.com'), (SELECT id_libro FROM libros WHERE titulo = 'Hábitos Atómicos'), '2026-02-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'jp.martinez@outlook.com'), (SELECT id_libro FROM libros WHERE titulo = 'Fahrenheit 451'), '2026-02-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'laura.perez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Padre Rico, Padre Pobre'), '2026-02-28'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'laura.perez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Un mundo feliz'), '2026-03-20'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'santiago.ramirez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Sapiens: De animales a dioses'), '2026-01-30'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'santiago.ramirez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El Señor de los Anillos: La Comunidad del Anillo'), '2026-02-25'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'mariana.lopez@yahoo.com'), (SELECT id_libro FROM libros WHERE titulo = 'Orgullo y Prejuicio'), '2026-03-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'mariana.lopez@yahoo.com'), (SELECT id_libro FROM libros WHERE titulo = 'El Resplandor'), '2026-03-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'daniel.torres@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Maus'), '2026-03-22'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'isabella.sanchez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Heartstopper: Volumen 1'), '2026-04-02'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'nicolas.vargas@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Kimetsu no Yaiba - Tomo 1'), '2026-04-10');

-- =============================================================================
-- 9. OFERTAS
-- =============================================================================
INSERT INTO ofertas (id_tienda, nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin) VALUES
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 'Black Friday Literario', 'Porcentaje', 20.00, '2026-11-20 00:00:00', '2026-11-27 23:59:59'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 'Descuento Clásicos', 'Fijo', 5000.00, '2026-06-01 08:00:00', '2026-07-01 18:00:00'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 'Bono Universitario', 'Porcentaje', 15.00, '2026-01-10 00:00:00', '2026-12-31 23:59:59'),

((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 'Mes de la Ciencia Ficción', 'Porcentaje', 25.00, '2026-07-01 00:00:00', '2026-07-31 23:59:59'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Página Trece'), 'Especial Fantasía Juvenil', 'Fijo', 8000.00, '2026-06-15 00:00:00', '2026-07-15 23:59:59'),

((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 'Semana del Arte y Fotografía', 'Porcentaje', 30.00, '2026-08-05 09:00:00', '2026-08-12 21:00:00'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 'Descuento Biografías', 'Fijo', 6000.00, '2026-06-20 00:00:00', '2026-07-20 23:59:59'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'El Rincón Literario'), 'Feria del Libro Local', 'Porcentaje', 10.00, '2026-04-15 00:00:00', '2026-04-30 23:59:59'),

((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), 'Liquidación de Joyas Ocultas', 'Porcentaje', 40.00, '2026-06-25 00:00:00', '2026-07-05 23:59:59'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Libros Usados Medellín'), 'Bono Lector Frecuente', 'Fijo', 4000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),

((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 'Otaku Day Especial Manga', 'Porcentaje', 15.00, '2026-06-26 00:00:00', '2026-06-28 23:59:59'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 'Semana de la Novela Gráfica', 'Fijo', 7000.00, '2026-09-10 00:00:00', '2026-09-17 23:59:59'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Universo de Tinta'), 'Promo Orgullo Geek', 'Porcentaje', 20.00, '2026-05-20 00:00:00', '2026-05-30 23:59:59'),

((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Tienda Test Pausada'), 'Oferta Expirada de Prueba', 'Porcentaje', 50.00, '2025-11-01 00:00:00', '2025-11-30 23:59:59'),
((SELECT id_tienda FROM tiendas WHERE nombre_tienda = 'Librería El Sótano'), 'Navidad Anticipada', 'Porcentaje', 18.00, '2026-12-01 00:00:00', '2026-12-24 23:59:59');
-- =============================================================================
-- 10. OFERTA_LIBROS
-- =============================================================================
INSERT INTO oferta_libros (id_oferta, id_libro) VALUES
-- 1. Black Friday Literario (Librería El Sótano) -> Cien años de soledad, 1984, Sapiens
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Black Friday Literario' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Cien años de soledad' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Black Friday Literario' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = '1984' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Black Friday Literario' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Sapiens: De animales a dioses' LIMIT 1)),

-- 2. Descuento Clásicos (Librería El Sótano) -> El amor en los tiempos del cólera, Crimen y castigo
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Descuento Clásicos' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'El amor en los tiempos del cólera' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Descuento Clásicos' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Crimen y castigo' LIMIT 1)),

-- 3. Mes de la Ciencia Ficción (Página Trece) -> Fahrenheit 451, Un mundo feliz
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Mes de la Ciencia Ficción' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Fahrenheit 451' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Mes de la Ciencia Ficción' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Un mundo feliz' LIMIT 1)),

-- 4. Especial Fantasía Juvenil (Página Trece) -> El Señor de los Anillos, Harry Potter, El Hobbit
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Especial Fantasía Juvenil' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'El Señor de los Anillos: La Comunidad del Anillo' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Especial Fantasía Juvenil' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Harry Potter y la piedra filosofal' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Especial Fantasía Juvenil' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'El Hobbit' LIMIT 1)),

-- 5. Semana del Arte y Fotografía (El Rincón Literario) -> El infinito en un junco, Moderna de Pueblo
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Semana del Arte y Fotografía' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'El infinito en un junco' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Semana del Arte y Fotografía' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Moderna de Pueblo: Idiotizadas' LIMIT 1)),

-- 6. Descuento Biografías (El Rincón Literario) -> Steve Jobs, Frida Kahlo
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Descuento Biografías' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Steve Jobs' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Descuento Biografías' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Frida Kahlo: Una biografía' LIMIT 1)),

-- 7. Liquidación de Joyas Ocultas (Libros Usados Medellín) -> El Resplandor, Drácula, Don Quijote
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Liquidación de Joyas Ocultas' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'El Resplandor' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Liquidación de Joyas Ocultas' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Drácula' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Liquidación de Joyas Ocultas' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Don Quijote de la Mancha' LIMIT 1)),

-- 8. Otaku Day Especial Manga (Universo de Tinta) -> Kimetsu no Yaiba
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Otaku Day Especial Manga' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Kimetsu no Yaiba - Tomo 1' LIMIT 1)),

-- 9. Semana de la Novela Gráfica (Universo de Tinta) -> Maus, Heartstopper
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Semana de la Novela Gráfica' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Maus' LIMIT 1)),
((SELECT id_oferta FROM ofertas WHERE nombre_oferta = 'Semana de la Novela Gráfica' LIMIT 1), (SELECT id_libro FROM libros WHERE titulo = 'Heartstopper: Volumen 1' LIMIT 1));

-- =============================================================================
-- 11. CARRITO_COMPRAS
-- =============================================================================
INSERT INTO carrito_compras (id_usuario, id_libro, cantidad, fecha_agregado) VALUES
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Sapiens: De animales a dioses' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El Hobbit' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Don Quijote de la Mancha' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Kimetsu no Yaiba - Tomo 1' LIMIT 1), 3, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Heartstopper: Volumen 1' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'jp.martinez@outlook.com'), (SELECT id_libro FROM libros WHERE titulo = 'Padre Rico, Padre Pobre' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'jp.martinez@outlook.com'), (SELECT id_libro FROM libros WHERE titulo = 'Hábitos Atómicos' LIMIT 1), 2, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'laura.perez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = '1984' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'laura.perez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Un mundo feliz' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'santiago.ramirez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'El Resplandor' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'santiago.ramirez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Drácula' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'mariana.lopez@yahoo.com'), (SELECT id_libro FROM libros WHERE titulo = 'El infinito en un junco' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'daniel.torres@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Maus' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'daniel.torres@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Crimen y castigo' LIMIT 1), 1, NOW()),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'isabella.sanchez@gmail.com'), (SELECT id_libro FROM libros WHERE titulo = 'Bajo la misma estrella' LIMIT 1), 1, NOW());

-- =============================================================================
-- 12. ORDENES COMPRAS (Las 10 órdenes completas del script)
-- =============================================================================
INSERT INTO ordenes_compra (id_usuario, id_direccion_envio, fecha_orden, total, estado_orden) VALUES
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'camila.rojas@gmail.com'), 1, '2026-05-10 14:22:00', 80000.00, 'Entregado'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'andres.gomez@hotmail.com'), 1, '2026-05-15 09:45:00', 35000.00, 'Entregado'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'valentina.castro@gmail.com'), 1, '2026-05-20 18:30:00', 126000.00, 'Enviado'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'jp.martinez@outlook.com'), 1, '2026-06-01 11:15:00', 147000.00, 'Entregado'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'laura.perez@gmail.com'), 1, '2026-06-12 16:05:00', 31000.00, 'Procesando'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'santiago.ramirez@gmail.com'), 1, '2026-06-18 20:10:00', 114000.00, 'Entregado'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'mariana.lopez@yahoo.com'), 1, '2026-06-22 13:40:00', 25000.00, 'Cancelado'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario = 'daniel.torres@gmail.com'), 1, '2026-06-25 10:00:00', 75000.00, 'Procesando');

-- =========================================================================
-- 2. INSERTAR DESGLOSE DE PRODUCTOS (detalle_orden)
-- =========================================================================
INSERT INTO detalle_orden (id_orden, id_libro, cantidad, precio_unitario, porcentaje_descuento, precio_final) VALUES
(1, 1, 1, 45000.00, 0.00, 45000.00),
(1, 2, 1, 35000.00, 0.00, 35000.00),
(2, 2, 1, 35000.00, 0.00, 35000.00),
(3, 28, 3, 35000.00, 20.00, 84000.00),
(3, 9, 1, 42000.00, 0.00, 42000.00),
(4, 15, 3, 49000.00, 0.00, 147000.00),
(5, 12, 1, 31000.00, 0.00, 31000.00),
(6, 3, 1, 59000.00, 0.00, 59000.00),
(6, 8, 1, 55000.00, 0.00, 55000.00),
(7, 19, 1, 25000.00, 0.00, 25000.00),
(8, 24, 1, 75000.00, 0.00, 75000.00);

-- =========================================================================
-- 3. INSERTAR ESTADO FINANCIERO (pagos)
-- =========================================================================
INSERT INTO pagos (id_orden, metodo_pago, monto, referencia_transaccion, fecha_pago, estado_pago) VALUES
(1, 'Tarjeta de Crédito', 80000.00, 'REF-99238411', '2026-05-10 14:25:00', 'Aprobado'),
(2, 'PSE', 35000.00, 'PSE-88123049', '2026-05-15 09:48:00', 'Aprobado'),
(3, 'Tarjeta de Débito', 126000.00, 'REF-44102933', '2026-05-20 18:32:00', 'Aprobado'),
(4, 'PSE', 147000.00, 'PSE-11029485', '2026-06-01 11:18:00', 'Aprobado'),
(5, 'Efectivo (Baloto)', 31000.00, 'BAL-55291048', '2026-06-12 17:30:00', 'Aprobado'),
(6, 'Tarjeta de Crédito', 114000.00, 'REF-33948102', '2026-06-18 20:12:00', 'Aprobado'),
(7, 'PSE', 25000.00, 'PSE-77382910', '2026-06-22 13:41:00', 'Rechazado'),
(8, 'Tarjeta de Crédito', 75000.00, 'REF-55102934', '2026-06-25 10:02:00', 'Aprobado');

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=== BooKyHome LISTA PARA USAR ===' AS '';
select * from usuarios;

-- Agregar la columna oculto a la tabla libros
ALTER TABLE libros 
ADD COLUMN oculto TINYINT(1) NOT NULL DEFAULT 0;

-- Modificar el rol de usuarios por comprador
SET SQL_SAFE_UPDATES = 0;

UPDATE usuarios 
SET rol = 'comprador' 
WHERE rol = 'usuario';

SET SQL_SAFE_UPDATES = 1;

-- Modificar el rol admin
-- UPDATE usuarios
 -- SET rol = 'admin'
-- WHERE id_usuario = 17;

-- Modificar el procedure sp_listar_libros_disponibles para poder ocultar los libros desde administrador y mostrar imágenes
DROP PROCEDURE IF EXISTS sp_listar_libros_disponibles;

DELIMITER $$
CREATE PROCEDURE sp_listar_libros_disponibles()
BEGIN
    SELECT
        l.id_libro,
        l.titulo,
        l.autor_libro,
        c.nombre_categoria,
        t.nombre_tienda,
        l.precio_libro,
        l.stock,
        l.oculto,
        (SELECT url_imagen FROM imagenes_libro WHERE id_libro = l.id_libro AND es_principal = 1 LIMIT 1) AS imagen
    FROM libros l
    INNER JOIN categorias c ON l.id_categoria = c.id_categoria
    INNER JOIN tiendas t ON l.id_tienda = t.id_tienda;
END$$
DELIMITER ;

-- configurar contraseñas
SET FOREIGN_KEY_CHECKS = 0;

UPDATE usuarios 
SET contrasena_usuario = '$2b$12$K7wEjaD8lR1Wif1XySzWF.VaudwNItv8Mxuf8j8uHLhVyJcdrWHVe' 
WHERE id_usuario > 0;

SET FOREIGN_KEY_CHECKS = 1;
