USE bookyhome;

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
    tarifa_envio DECIMAL(10,2) NOT NULL DEFAULT 0,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tienda_configuracion_tienda
        FOREIGN KEY (id_tienda) REFERENCES tiendas(id_tienda)
);

INSERT INTO tienda_configuracion (id_tienda)
SELECT t.id_tienda
FROM tiendas t
LEFT JOIN tienda_configuracion tc ON tc.id_tienda = t.id_tienda
WHERE tc.id_config IS NULL;
