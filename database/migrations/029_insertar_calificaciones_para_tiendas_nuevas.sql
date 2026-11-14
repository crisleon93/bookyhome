-- =============================================================================
-- Migración 029: calificaciones para tiendas nuevas
-- Agrega reseñas para las tiendas 76-151 con una puntuación realista.
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
    u.id_usuario,
    t.id_tienda,
    CASE MOD(t.id_tienda + u.id_usuario, 5)
        WHEN 0 THEN 5
        WHEN 1 THEN 4
        WHEN 2 THEN 5
        WHEN 3 THEN 3
        ELSE 4
    END AS calificacion,
    CASE MOD(t.id_tienda + u.id_usuario, 6)
        WHEN 0 THEN 'Excelente atención y buena experiencia de compra.'
        WHEN 1 THEN 'Muy buen servicio y buena variedad.'
        WHEN 2 THEN 'La tienda respondió rápido y tuvo buena presentación.'
        WHEN 3 THEN 'Buena entrega, aunque podía mejorar el empaque.'
        WHEN 4 THEN 'Muy recomendable para comprar libros.'
        ELSE 'Compra satisfactoria con buena atención.'
    END AS comentario,
    DATE_ADD('2025-01-01', INTERVAL (t.id_tienda + u.id_usuario) DAY) AS fecha_calificacion
FROM tiendas t
JOIN usuarios u
  ON u.rol = 'comprador'
WHERE t.id_tienda BETWEEN 76 AND 151
  AND NOT EXISTS (
      SELECT 1
      FROM calificaciones_tiendas c
      WHERE c.id_tienda = t.id_tienda
        AND c.id_usuario = u.id_usuario
  )
LIMIT 300;

SELECT '✅ 029 - Calificaciones para tiendas nuevas insertadas' AS resultado;
SELECT COUNT(*) AS total_calificaciones FROM calificaciones_tiendas;
SELECT ROUND(AVG(calificacion), 2) AS promedio_calificaciones FROM calificaciones_tiendas;
