-- =============================================================================
-- Migración 027: cerrar el objetivo de 150 tiendas
-- Se crean 75 vendedores adicionales y 75 tiendas asociadas.
-- =============================================================================

USE bookyhome;

SET @rownum := 0;
INSERT INTO usuarios (
    nombre_usuario,
    correo_usuario,
    contrasena_usuario,
    rol,
    telefono,
    estado_usuario,
    email_verificado,
    fecha_registro
)
SELECT
    CONCAT('Libreria Faltante ', LPAD(@rownum := @rownum + 1, 3, '0')) AS nombre_usuario,
    CONCAT('libreria.faltante.', LPAD(@rownum, 3, '0'), '@bookyhome.test') AS correo_usuario,
    '$2b$12$quJWnYOoFcA4JVMhaYKIvu7lLc2ZLFlQF8nCPTvAWPgnwoNMOWVNW' AS contrasena_usuario,
    'vendedor' AS rol,
    CONCAT('300', LPAD(@rownum + 1000, 8, '0')) AS telefono,
    'Activo' AS estado_usuario,
    TRUE AS email_verificado,
    DATE_ADD('2025-01-01', INTERVAL @rownum MONTH) AS fecha_registro
FROM information_schema.columns c1
CROSS JOIN information_schema.columns c2
WHERE NOT EXISTS (
    SELECT 1
    FROM usuarios u
    WHERE u.correo_usuario = CONCAT('libreria.faltante.', LPAD(@rownum, 3, '0'), '@bookyhome.test')
)
LIMIT 75;

SET @rownum := 0;
INSERT INTO tiendas (
    id_usuario,
    nombre_tienda,
    direccion,
    telefono,
    estado_tienda,
    fecha_creacion
)
SELECT
    u.id_usuario,
    CONCAT('Librería Faltante ', LPAD(@rownum := @rownum + 1, 3, '0')) AS nombre_tienda,
    CONCAT('Cra ', MOD(@rownum, 50) + 1, ' # ', ((@rownum * 7) MOD 100) + 1, '-', ((@rownum * 11) MOD 90) + 10, ', Bogotá') AS direccion,
    CONCAT('301', LPAD(@rownum + 1000, 7, '0')) AS telefono,
    'activa' AS estado_tienda,
    DATE_ADD('2025-01-01', INTERVAL @rownum WEEK) AS fecha_creacion
FROM (
    SELECT 1 AS n
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
    UNION ALL SELECT 7
    UNION ALL SELECT 8
    UNION ALL SELECT 9
    UNION ALL SELECT 10
    UNION ALL SELECT 11
    UNION ALL SELECT 12
    UNION ALL SELECT 13
    UNION ALL SELECT 14
    UNION ALL SELECT 15
    UNION ALL SELECT 16
    UNION ALL SELECT 17
    UNION ALL SELECT 18
    UNION ALL SELECT 19
    UNION ALL SELECT 20
    UNION ALL SELECT 21
    UNION ALL SELECT 22
    UNION ALL SELECT 23
    UNION ALL SELECT 24
    UNION ALL SELECT 25
    UNION ALL SELECT 26
    UNION ALL SELECT 27
    UNION ALL SELECT 28
    UNION ALL SELECT 29
    UNION ALL SELECT 30
    UNION ALL SELECT 31
    UNION ALL SELECT 32
    UNION ALL SELECT 33
    UNION ALL SELECT 34
    UNION ALL SELECT 35
    UNION ALL SELECT 36
    UNION ALL SELECT 37
    UNION ALL SELECT 38
    UNION ALL SELECT 39
    UNION ALL SELECT 40
    UNION ALL SELECT 41
    UNION ALL SELECT 42
    UNION ALL SELECT 43
    UNION ALL SELECT 44
    UNION ALL SELECT 45
    UNION ALL SELECT 46
    UNION ALL SELECT 47
    UNION ALL SELECT 48
    UNION ALL SELECT 49
    UNION ALL SELECT 50
    UNION ALL SELECT 51
    UNION ALL SELECT 52
    UNION ALL SELECT 53
    UNION ALL SELECT 54
    UNION ALL SELECT 55
    UNION ALL SELECT 56
    UNION ALL SELECT 57
    UNION ALL SELECT 58
    UNION ALL SELECT 59
    UNION ALL SELECT 60
    UNION ALL SELECT 61
    UNION ALL SELECT 62
    UNION ALL SELECT 63
    UNION ALL SELECT 64
    UNION ALL SELECT 65
    UNION ALL SELECT 66
    UNION ALL SELECT 67
    UNION ALL SELECT 68
    UNION ALL SELECT 69
    UNION ALL SELECT 70
    UNION ALL SELECT 71
    UNION ALL SELECT 72
    UNION ALL SELECT 73
    UNION ALL SELECT 74
    UNION ALL SELECT 75
) AS nums
JOIN usuarios u
  ON u.correo_usuario = CONCAT('libreria.faltante.', LPAD(nums.n, 3, '0'), '@bookyhome.test')
WHERE NOT EXISTS (
    SELECT 1
    FROM tiendas t
    WHERE t.nombre_tienda = CONCAT('Librería Faltante ', LPAD(nums.n, 3, '0'))
);

SELECT '✅ 027 - Tiendas faltantes insertadas' AS resultado;
SELECT COUNT(*) AS total_vendedores FROM usuarios WHERE rol = 'vendedor';
SELECT COUNT(*) AS total_tiendas FROM tiendas;
