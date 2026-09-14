-- Poblar planes, tipos de impulso y datos iniciales para tiendas existentes.
-- Idempotente: puede ejecutarse varias veces sin duplicar registros.

USE bookyhome;

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

INSERT INTO tipos_impulso (nombre, descripcion, precio, duracion_dias, tipo, activo)
SELECT datos.nombre, datos.descripcion, datos.precio, datos.duracion_dias, datos.tipo, 1
FROM (
    SELECT 'Libro destacado en Home' AS nombre, 'Tu libro aparece destacado en la página principal por 7 días' AS descripcion, 25000.00 AS precio, 7 AS duracion_dias, 'home' AS tipo
    UNION ALL SELECT 'Banner en categoría', 'Banner promocional en la página de categoría por 5 días', 18000.00, 5, 'categoria'
    UNION ALL SELECT 'Libro del Día', 'Tu libro aparece como libro del día en la portada', 35000.00, 1, 'libro_dia'
    UNION ALL SELECT 'Email a suscriptores', 'Email promocional enviado a todos los suscriptores', 22000.00, 1, 'email'
) AS datos
WHERE NOT EXISTS (
    SELECT 1 FROM tipos_impulso existente WHERE existente.tipo = datos.tipo
);

INSERT INTO suscripciones_herramientas (
    id_tienda, id_plan, fecha_inicio, fecha_fin, estado, metodo_pago, monto_pagado, renovacion_automatica
)
SELECT
    t.id_tienda, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY),
    'Activa', 'Gratuito', 0.00, FALSE
FROM tiendas t
WHERE NOT EXISTS (
    SELECT 1
    FROM suscripciones_herramientas sh
    WHERE sh.id_tienda = t.id_tienda AND sh.estado = 'Activa'
);

INSERT INTO impulsos_contratados (
    id_tienda, id_tipo_impulso, id_libro, fecha_inicio, fecha_fin, monto_pagado, estado
)
SELECT
    libros_tienda.id_tienda,
    tipo.id_tipo_impulso,
    libros_tienda.id_libro,
    NOW(),
    DATE_ADD(NOW(), INTERVAL tipo.duracion_dias DAY),
    tipo.precio,
    'Activo'
FROM (
    SELECT t.id_tienda, MIN(l.id_libro) AS id_libro
    FROM tiendas t
    INNER JOIN libros l ON l.id_tienda = t.id_tienda
    GROUP BY t.id_tienda
) AS libros_tienda
INNER JOIN tipos_impulso tipo ON tipo.tipo = 'home' AND tipo.activo = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM impulsos_contratados ic
    WHERE ic.id_tienda = libros_tienda.id_tienda
);