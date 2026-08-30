-- =============================================================================
-- Migración 024: Insertar vendedores y sus librerías
-- Crea el usuario vendedor y la tienda en una sola transacción por librería
-- Contraseña: "Bookyhome2025*"
-- =============================================================================

USE bookyhome;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- VENDEDORES (usuario con rol vendedor + tienda asociada)
-- =============================================================================

-- Bogotá
INSERT INTO usuarios (nombre_usuario, correo_usuario, contrasena_usuario, rol, telefono, estado_usuario, email_verificado, fecha_registro) VALUES
('Libreria Nacional Bogota',      'ventas@librerianacional.co',      '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3001010101', 'Activo', TRUE, '2024-08-01'),
('Panamericana Libreria',          'info@panamericana.co',            '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3002020202', 'Activo', TRUE, '2024-08-05'),
('Casa Editorial Norma',           'pedidos@norma.co',                '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3003030303', 'Activo', TRUE, '2024-08-10'),
('Libreria Lerner Bogota',         'contacto@librerialerner.co',      '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3004040404', 'Activo', TRUE, '2024-08-15'),
('Bibliobog Libros',               'hola@bibliobog.co',               '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3005050505', 'Activo', TRUE, '2024-08-20'),
('Tinta Fresca Libreria',          'tintafresca@gmail.com',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3006060606', 'Activo', TRUE, '2024-08-25'),
('El Pendulo Libros',              'ventas@elpendulo.co',             '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3007070707', 'Activo', TRUE, '2024-09-01'),
('Libros y Letras Bogota',         'info@librosyletras.co',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3008080808', 'Activo', TRUE, '2024-09-05'),
('Mundo del Libro Bogota',         'mundodellibro@outlook.com',       '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3009090909', 'Activo', TRUE, '2024-09-10'),
('Literatura al Paso',             'literaturalpaso@gmail.com',       '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3010101010', 'Activo', TRUE, '2024-09-15'),
-- Medellín
('Libreria Wilborada Medellin',    'wilborada@gmail.com',             '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3011111111', 'Activo', TRUE, '2024-09-20'),
('Salvo Conducto Libros',          'info@salvoconducto.co',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3012121212', 'Activo', TRUE, '2024-09-25'),
('Otra Parte Libreria',            'otrapartelibros@gmail.com',       '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3013131313', 'Activo', TRUE, '2024-10-01'),
('Libreria El Greco Medellin',     'elgreco@hotmail.com',             '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3014141414', 'Activo', TRUE, '2024-10-05'),
('Novena Arte Libreria',           'novenarte@gmail.com',             '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3015151515', 'Activo', TRUE, '2024-10-10'),
('Libreria El Parque Medellin',    'elparquemed@outlook.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3016161616', 'Activo', TRUE, '2024-10-15'),
('Punto Libro Antioquia',          'puntolibro@gmail.com',            '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3017171717', 'Activo', TRUE, '2024-10-20'),
('Libros al Dia Medellin',         'librosaldia@yahoo.com',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3018181818', 'Activo', TRUE, '2024-10-25'),
('Casa Lectora Laureles',          'casalectora@gmail.com',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3019191919', 'Activo', TRUE, '2024-11-01'),
('Libreria Teseo Medellin',        'teseolibreria@gmail.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3020202020', 'Activo', TRUE, '2024-11-05'),
-- Cali
('Libreria Cervantes Cali',        'cervantescali@gmail.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3021212121', 'Activo', TRUE, '2024-11-10'),
('El Callejon del Libro Cali',     'calledelibro@outlook.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3022222223', 'Activo', TRUE, '2024-11-15'),
('Libreria Tertulia Cali',         'tertulia@hotmail.com',            '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3023232323', 'Activo', TRUE, '2024-11-20'),
('Papel y Tinta Cali',             'papelytinta@gmail.com',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3024242424', 'Activo', TRUE, '2024-11-25'),
('Librolandia Valle',              'librolandia@gmail.com',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3025252525', 'Activo', TRUE, '2024-12-01'),
('Libreria San Bosco Cali',        'sanboscocali@outlook.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3026262626', 'Activo', TRUE, '2024-12-05'),
('Lectura Continua Cali',          'lecturacontinua@yahoo.com',       '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3027272727', 'Activo', TRUE, '2024-12-10'),
('Bibliofilia Sur',                'bibliofiliasur@gmail.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3028282828', 'Activo', TRUE, '2024-12-15'),
-- Barranquilla / Costa
('Libreria Atlantico',             'libreraatlantico@gmail.com',      '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3029292929', 'Activo', TRUE, '2024-12-20'),
('Caribe Libros Barranquilla',     'caribelibros@outlook.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3030303030', 'Activo', TRUE, '2024-12-25'),
('El Portal del Saber Costa',      'portaldelsaber@gmail.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3031313131', 'Activo', TRUE, '2025-01-02'),
('Libreria Macondo Cartagena',     'macondolibros@gmail.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3032323232', 'Activo', TRUE, '2025-01-07'),
('Bocagrande Libros',              'bocagrandelibros@hotmail.com',    '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3033333333', 'Activo', TRUE, '2025-01-12'),
('Libreria Santa Marta Mar',       'santamartamar@gmail.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3034343434', 'Activo', TRUE, '2025-01-17'),
-- Bucaramanga / Santander
('Libreria UIS Bucaramanga',       'libuisc@gmail.com',               '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3035353535', 'Activo', TRUE, '2025-01-22'),
('Leamos Santander',               'leamossantander@outlook.com',     '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3036363636', 'Activo', TRUE, '2025-01-27'),
('Libreria El Refugio Buca',       'refugiobuca@gmail.com',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3037373737', 'Activo', TRUE, '2025-02-01'),
-- Pereira / Manizales / Armenia
('Libreria Eje Cafetero',          'ejecafetero@gmail.com',           '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3038383838', 'Activo', TRUE, '2025-02-06'),
('Cafe y Libros Manizales',        'cafeylibros@hotmail.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3039393939', 'Activo', TRUE, '2025-02-11'),
('Quindio Lectura Armenia',        'quindielectura@gmail.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3040404040', 'Activo', TRUE, '2025-02-16'),
-- Ibagué / Neiva / Villavicencio
('Libreria Tolima Grande',         'tolimage@gmail.com',              '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3041414141', 'Activo', TRUE, '2025-02-21'),
('Letras del Huila',               'letrashuila@outlook.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3042424242', 'Activo', TRUE, '2025-02-26'),
('Libreria Llanos Villavicencio',  'llanos@gmail.com',                '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3043434343', 'Activo', TRUE, '2025-03-03'),
-- Más librerías independientes variadas
('Narraciones del Sur',            'narracionesur@gmail.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3044444445', 'Activo', TRUE, '2025-03-08'),
('El Volumen Perfecto',            'volumenperfecto@gmail.com',       '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3045454545', 'Activo', TRUE, '2025-03-13'),
('Letras en Reposo',               'letrasenreposo@hotmail.com',      '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3046464646', 'Activo', TRUE, '2025-03-18'),
('Libreria El Abismo',             'elabismo@gmail.com',              '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3047474747', 'Activo', TRUE, '2025-03-23'),
('Palabra Viva Colombia',          'palabraviva@outlook.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3048484848', 'Activo', TRUE, '2025-03-28'),
('Libreria La Candelaria',         'lacandelaria@gmail.com',          '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3049494949', 'Activo', TRUE, '2025-04-02'),
('Nido de Libros',                 'nidodelibros@yahoo.com',          '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3050505050', 'Activo', TRUE, '2025-04-07'),
('Libreria Los Andes',             'losandes@gmail.com',              '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3051515151', 'Activo', TRUE, '2025-04-12'),
('Entre Hojas',                    'entrehojas@gmail.com',            '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3052525252', 'Activo', TRUE, '2025-04-17'),
('El Faro Libreria',               'elfarolibros@hotmail.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3053535353', 'Activo', TRUE, '2025-04-22'),
('Libros Sin Fronteras',           'sinfontera@gmail.com',            '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3054545454', 'Activo', TRUE, '2025-04-27'),
('La Madriguera Lectora',          'madrigueralectora@gmail.com',     '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3055555556', 'Activo', TRUE, '2025-05-02'),
('Libreria Galileo',               'galileolibros@outlook.com',       '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3056565656', 'Activo', TRUE, '2025-05-07'),
('Coleccion Privada Libros',       'coleccionprivada@gmail.com',      '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3057575757', 'Activo', TRUE, '2025-05-12'),
('Libreria El Origen',             'elorigen@hotmail.com',            '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3058585858', 'Activo', TRUE, '2025-05-17'),
('Tomo y Lomo',                    'tomyolomo@gmail.com',             '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3059595959', 'Activo', TRUE, '2025-05-22'),
('Hoja de Ruta Libros',            'hojarutalibros@yahoo.com',        '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3060606060', 'Activo', TRUE, '2025-05-27'),
('Quijote Libros Colombia',        'quijotelibros@gmail.com',         '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW', 'vendedor', '3061616161', 'Activo', TRUE, '2025-06-01');

-- =============================================================================
-- TIENDAS (una por vendedor, usando subconsulta por correo)
-- =============================================================================

INSERT INTO tiendas (id_usuario, nombre_tienda, direccion, telefono, estado_tienda, fecha_creacion) VALUES
((SELECT id_usuario FROM usuarios WHERE correo_usuario='ventas@librerianacional.co'),   'Librería Nacional',             'Calle 19 # 6-68, Bogotá',              '3001010101', 'activa', '2024-08-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='info@panamericana.co'),         'Panamericana',                  'Cra 7 # 32-29, Bogotá',               '3002020202', 'activa', '2024-08-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='pedidos@norma.co'),             'Norma Libros',                  'Av. El Dorado # 90-10, Bogotá',        '3003030303', 'activa', '2024-08-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='contacto@librerialerner.co'),   'Librería Lerner',               'Cra 7 # 15-35, Bogotá',               '3004040404', 'activa', '2024-08-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='hola@bibliobog.co'),            'Bibliobog',                     'Calle 53 # 13-24, Bogotá',            '3005050505', 'activa', '2024-08-20'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='tintafresca@gmail.com'),        'Tinta Fresca',                  'Calle 70 # 9-51, Bogotá',             '3006060606', 'activa', '2024-08-25'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='ventas@elpendulo.co'),          'El Péndulo',                    'Cra 9 # 82-24, Bogotá',               '3007070707', 'activa', '2024-09-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='info@librosyletras.co'),        'Libros y Letras',               'Calle 116 # 19-36, Bogotá',           '3008080808', 'activa', '2024-09-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='mundodellibro@outlook.com'),    'Mundo del Libro',               'Cra 15 # 79-60, Bogotá',              '3009090909', 'activa', '2024-09-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='literaturalpaso@gmail.com'),    'Literatura al Paso',            'Calle 93 # 12-14, Bogotá',            '3010101010', 'activa', '2024-09-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='wilborada@gmail.com'),          'Wilborada',                     'Cra 43A # 34-80, Medellín',           '3011111111', 'activa', '2024-09-20'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='info@salvoconducto.co'),        'Salvo Conducto',                'Calle 33 # 76-24, Medellín',          '3012121212', 'activa', '2024-09-25'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='otrapartelibros@gmail.com'),    'Otra Parte',                    'Cra 37 # 8A-43, Medellín',            '3013131313', 'activa', '2024-10-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='elgreco@hotmail.com'),          'El Greco',                      'Calle 10 # 43-20, Medellín',          '3014141414', 'activa', '2024-10-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='novenarte@gmail.com'),          'Novena Arte',                   'Cra 49 # 52-60, Medellín',            '3015151515', 'activa', '2024-10-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='elparquemed@outlook.com'),      'Librería El Parque',            'Calle 44 # 65-32, Medellín',          '3016161616', 'activa', '2024-10-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='puntolibro@gmail.com'),         'Punto Libro Antioquia',         'Cra 80 # 34-70, Medellín',            '3017171717', 'activa', '2024-10-20'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='librosaldia@yahoo.com'),        'Libros al Día',                 'Calle 50 # 50-45, Medellín',          '3018181818', 'activa', '2024-10-25'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='casalectora@gmail.com'),        'Casa Lectora',                  'Cra 73 # 33-12, Medellín',            '3019191919', 'activa', '2024-11-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='teseolibreria@gmail.com'),      'Librería Teseo',                'Calle 12 # 43A-98, Medellín',         '3020202020', 'activa', '2024-11-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='cervantescali@gmail.com'),      'Cervantes Libros',              'Av. 6N # 26-05, Cali',                '3021212121', 'activa', '2024-11-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='calledelibro@outlook.com'),     'El Callejón del Libro',         'Cra 5 # 12-43, Cali',                 '3022222223', 'activa', '2024-11-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='tertulia@hotmail.com'),         'Tertulia',                      'Av. Colombia # 5-32, Cali',           '3023232323', 'activa', '2024-11-20'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='papelytinta@gmail.com'),        'Papel y Tinta',                 'Calle 15N # 6-43, Cali',              '3024242424', 'activa', '2024-11-25'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='librolandia@gmail.com'),        'Librolandia',                   'Cra 39 # 10-12, Cali',                '3025252525', 'activa', '2024-12-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='sanboscocali@outlook.com'),     'San Bosco Libros',              'Calle 5 # 38-25, Cali',               '3026262626', 'activa', '2024-12-05'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='lecturacontinua@yahoo.com'),    'Lectura Continua',              'Cra 66 # 11-43, Cali',                '3027272727', 'activa', '2024-12-10'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='bibliofiliasur@gmail.com'),     'Bibliofilia Sur',               'Calle 70 # 43-10, Cali',              '3028282828', 'activa', '2024-12-15'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='libreraatlantico@gmail.com'),   'Librería Atlántico',            'Cra 43 # 74-50, Barranquilla',        '3029292929', 'activa', '2024-12-20'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='caribelibros@outlook.com'),     'Caribe Libros',                 'Calle 72 # 57-27, Barranquilla',      '3030303030', 'activa', '2024-12-25'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='portaldelsaber@gmail.com'),     'Portal del Saber',              'Cra 54 # 68-30, Barranquilla',        '3031313131', 'activa', '2025-01-02'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='macondolibros@gmail.com'),      'Macondo Libros',                'Cra 4 # 36-10, Cartagena',            '3032323232', 'activa', '2025-01-07'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='bocagrandelibros@hotmail.com'), 'Bocagrande Libros',             'Av. San Martín # 8-34, Cartagena',    '3033333333', 'activa', '2025-01-12'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='santamartamar@gmail.com'),      'Santa Marta Mar Libros',        'Cra 1 # 10-30, Santa Marta',          '3034343434', 'activa', '2025-01-17'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='libuisc@gmail.com'),            'Librería UIS',                  'Cra 27 # 9-02, Bucaramanga',          '3035353535', 'activa', '2025-01-22'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='leamossantander@outlook.com'),  'Leamos Santander',              'Calle 36 # 18-30, Bucaramanga',       '3036363636', 'activa', '2025-01-27'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='refugiobuca@gmail.com'),        'El Refugio',                    'Cra 33 # 48-05, Bucaramanga',         '3037373737', 'activa', '2025-02-01'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='ejecafetero@gmail.com'),        'Eje Cafetero Libros',           'Cra 8 # 19-50, Pereira',              '3038383838', 'activa', '2025-02-06'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='cafeylibros@hotmail.com'),      'Café y Libros',                 'Calle 23 # 22-10, Manizales',         '3039393939', 'activa', '2025-02-11'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='quindielectura@gmail.com'),     'Quindío Lectura',               'Cra 14 # 18-24, Armenia',             '3040404040', 'activa', '2025-02-16'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='tolimage@gmail.com'),           'Tolima Grande',                 'Cra 3 # 11-31, Ibagué',               '3041414141', 'activa', '2025-02-21'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='letrashuila@outlook.com'),      'Letras del Huila',              'Cra 5 # 8-20, Neiva',                 '3042424242', 'activa', '2025-02-26'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='llanos@gmail.com'),             'Llanos Libros',                 'Cra 30 # 35-20, Villavicencio',       '3043434343', 'activa', '2025-03-03'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='narracionesur@gmail.com'),      'Narraciones del Sur',           'Calle 8 # 15-43, Pasto',              '3044444445', 'activa', '2025-03-08'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='volumenperfecto@gmail.com'),    'El Volumen Perfecto',           'Cra 10 # 20-14, Bogotá',              '3045454545', 'activa', '2025-03-13'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='letrasenreposo@hotmail.com'),   'Letras en Reposo',              'Calle 45 # 7-23, Bogotá',             '3046464646', 'activa', '2025-03-18'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='elabismo@gmail.com'),           'El Abismo Libros',              'Cra 7 # 60-12, Bogotá',               '3047474747', 'activa', '2025-03-23'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='palabraviva@outlook.com'),      'Palabra Viva',                  'Calle 100 # 14-55, Bogotá',           '3048484848', 'activa', '2025-03-28'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='lacandelaria@gmail.com'),       'La Candelaria Libros',          'Calle 12B # 2-90, Bogotá',            '3049494949', 'activa', '2025-04-02'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='nidodelibros@yahoo.com'),       'Nido de Libros',                'Cra 11 # 82-71, Bogotá',              '3050505050', 'activa', '2025-04-07'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='losandes@gmail.com'),           'Los Andes Librería',            'Cra 1 # 18A-12, Bogotá',              '3051515151', 'activa', '2025-04-12'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='entrehojas@gmail.com'),         'Entre Hojas',                   'Calle 57 # 10-74, Bogotá',            '3052525252', 'activa', '2025-04-17'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='elfarolibros@hotmail.com'),     'El Faro Librería',              'Cra 13 # 93-40, Bogotá',              '3053535353', 'activa', '2025-04-22'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='sinfontera@gmail.com'),         'Libros Sin Fronteras',          'Calle 80 # 9-38, Bogotá',             '3054545454', 'activa', '2025-04-27'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='madrigueralectora@gmail.com'),  'La Madriguera Lectora',         'Cra 9 # 65-30, Bogotá',               '3055555556', 'activa', '2025-05-02'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='galileolibros@outlook.com'),    'Librería Galileo',              'Calle 53 # 13-24, Bogotá',            '3056565656', 'activa', '2025-05-07'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='coleccionprivada@gmail.com'),   'Colección Privada',             'Cra 15 # 87-14, Bogotá',              '3057575757', 'activa', '2025-05-12'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='elorigen@hotmail.com'),         'El Origen Libros',              'Calle 127 # 19-45, Bogotá',           '3058585858', 'activa', '2025-05-17'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='tomyolomo@gmail.com'),          'Tomo y Lomo',                   'Cra 7 # 22-10, Bogotá',               '3059595959', 'activa', '2025-05-22'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='hojarutalibros@yahoo.com'),     'Hoja de Ruta',                  'Calle 32 # 14-19, Bogotá',            '3060606060', 'activa', '2025-05-27'),
((SELECT id_usuario FROM usuarios WHERE correo_usuario='quijotelibros@gmail.com'),      'Quijote Libros',                'Cra 19 # 45-30, Bogotá',              '3061616161', 'activa', '2025-06-01');

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ 024 - Vendedores y tiendas insertados' AS resultado;
SELECT COUNT(*) AS total_vendedores FROM usuarios WHERE rol = 'vendedor';
SELECT COUNT(*) AS total_tiendas FROM tiendas WHERE estado_tienda = 'activa';
