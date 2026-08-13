-- Cuentas bancarias para vendedores de prueba

-- Cuentas para Vendedor 26 (Tienda 1)
INSERT INTO metodos_cobro_vendedor (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado) VALUES
(1, 'Ahorros', 'Bancolombia', '1234567890', 'Juan Pérez', '12345678', 1, 1),
(1, 'Nequi', 'Bancolombia', '3101234567', 'Juan Pérez', '12345678', 0, 1);

-- Cuentas para Vendedor 27 (Tienda 2)
INSERT INTO metodos_cobro_vendedor (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado) VALUES
(2, 'Corriente', 'Davivienda', '9876543210', 'María García', '87654321', 1, 1),
(2, 'Daviplata', 'Davivienda', '3009876543', 'María García', '87654321', 0, 1);

-- Cuentas para Vendedor 28 (Tienda 3)
INSERT INTO metodos_cobro_vendedor (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado) VALUES
(3, 'Ahorros', 'Banco de Bogotá', '5555555555', 'Carlos Rodríguez', '11223344', 1, 1),
(3, 'Nequi', 'Bancolombia', '3205555555', 'Carlos Rodríguez', '11223344', 0, 1);

-- Cuentas para Vendedor 29 (Tienda 4)
INSERT INTO metodos_cobro_vendedor (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado) VALUES
(4, 'Corriente', 'BBVA Colombia', '7777777777', 'Ana Martínez', '99887766', 1, 1),
(4, 'Nequi', 'Bancolombia', '3157777777', 'Ana Martínez', '99887766', 0, 1);

-- Cuentas para Vendedor 30 (Tienda 5)
INSERT INTO metodos_cobro_vendedor (id_tienda, tipo_cuenta, banco, numero_cuenta, nombre_titular, cedula_titular, es_principal, verificado) VALUES
(5, 'Ahorros', 'Scotiabank Colpatria', '8888888888', 'Pedro López', '44556677', 1, 1),
(5, 'Daviplata', 'Davivienda', '3018888888', 'Pedro López', '44556677', 0, 1);