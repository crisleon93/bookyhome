-- Migración: Actualizar planes de herramientas del vendedor en BookyHome
-- Agrega los planes: Gratuito, Básico, Estándar y Premium

DELETE FROM planes_herramientas WHERE id_plan IN (1, 2, 3, 4);

INSERT INTO planes_herramientas (
    id_plan, nombre_plan, precio_mensual,
    estadisticas_basicas, estadisticas_avanzadas, exportar_reportes, soporte_prioritario,
    historial_meses, impulsos_con_descuento, descripcion
) VALUES 
(1, 'Gratuito', 0.00, 1, 0, 0, 0, 1, 0.00, 'Estadísticas del mes en curso, reportes en pantalla y soporte estándar 48h.'),
(2, 'Básico', 15000.00, 1, 1, 0, 0, 3, 5.00, 'Estadísticas de hasta 3 meses, gráficos interactivos básicos y 5% de descuento en impulsos.'),
(3, 'Estándar', 29000.00, 1, 1, 1, 1, 12, 10.00, 'Estadísticas de hasta 12 meses, exportación a Excel/PDF, soporte prioritario en 2h y 10% en impulsos.'),
(4, 'Premium', 49000.00, 1, 1, 1, 1, 24, 20.00, 'Acceso ilimitado de historial de 24 meses, herramientas SEO y marketing avanzadas, soporte ultra-prioritario en 1h y 20% en impulsos.');
