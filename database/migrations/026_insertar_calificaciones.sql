-- =============================================================================
-- Migración 026: insertar calificaciones de tiendas para cerrar la base de prueba
-- Objetivo: pasar de ~23 calificaciones actuales a ~300 (~277 nuevas)
-- =============================================================================

USE bookyhome;

INSERT INTO calificaciones_tiendas (
    id_usuario,
    id_tienda,
    calificacion,
    comentario,
    fecha_calificacion
)
SELECT
    ((n.n - 1) % 36) + 1 AS id_usuario,
    ((n.n - 1) % 14) + 1 AS id_tienda,
    CASE MOD(n.n, 5)
        WHEN 0 THEN 5
        WHEN 1 THEN 4
        WHEN 2 THEN 5
        WHEN 3 THEN 3
        ELSE 4
    END AS calificacion,
    CASE MOD(n.n, 6)
        WHEN 0 THEN 'Excelente servicio, atención rápida y muy buena selección.'
        WHEN 1 THEN 'Muy buena experiencia de compra y entrega.'
        WHEN 2 THEN 'La tienda respondió bien y el proceso fue claro.'
        WHEN 3 THEN 'Buena atención, aunque podría mejorar el empaque.'
        WHEN 4 THEN 'Muy recomendable, productos bien presentados.'
        ELSE 'Compra satisfactoria con buena comunicación y calidad.'
    END AS comentario,
    DATE_ADD('2024-01-01', INTERVAL n.n DAY) AS fecha_calificacion
FROM (
    SELECT (@row := @row + 1) AS n
    FROM information_schema.columns c1
    CROSS JOIN information_schema.columns c2
    CROSS JOIN (SELECT @row := 0) vars
    LIMIT 300
) AS n
WHERE NOT EXISTS (
    SELECT 1
    FROM calificaciones_tiendas c
    WHERE c.id_usuario = ((n.n - 1) % 36) + 1
      AND c.id_tienda = ((n.n - 1) % 14) + 1
      AND c.fecha_calificacion = DATE_ADD('2024-01-01', INTERVAL n.n DAY)
);

SELECT '✅ 026 - Calificaciones de tiendas insertadas' AS resultado;
SELECT COUNT(*) AS total_calificaciones FROM calificaciones_tiendas;
