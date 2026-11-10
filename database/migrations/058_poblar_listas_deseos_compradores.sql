-- Garantiza al menos 8 libros en una lista de deseos por comprador.
USE bookyhome;

INSERT INTO lista_deseos (id_usuario, nombre_lista, publica, fecha_creacion)
SELECT u.id_usuario, 'Mi lista de deseos', FALSE, NOW()
FROM usuarios u
WHERE u.rol = 'comprador'
  AND NOT EXISTS (
      SELECT 1
      FROM lista_deseos ld
      WHERE ld.id_usuario = u.id_usuario
  );

DROP TEMPORARY TABLE IF EXISTS tmp_listas_deseos_objetivo;
CREATE TEMPORARY TABLE tmp_listas_deseos_objetivo AS
SELECT u.id_usuario, MIN(ld.id_lista) AS id_lista
FROM usuarios u
JOIN lista_deseos ld ON ld.id_usuario = u.id_usuario
WHERE u.rol = 'comprador'
GROUP BY u.id_usuario;

DROP TEMPORARY TABLE IF EXISTS tmp_libros_para_deseos;
CREATE TEMPORARY TABLE tmp_libros_para_deseos AS
SELECT
    objetivo.id_usuario,
    objetivo.id_lista,
    l.id_libro,
    COALESCE(actuales.total_libros, 0) AS total_libros,
    ROW_NUMBER() OVER (PARTITION BY objetivo.id_lista ORDER BY l.id_libro) AS posicion
FROM tmp_listas_deseos_objetivo objetivo
JOIN libros l
  ON LOWER(COALESCE(l.estado_libro, 'activo')) NOT IN ('inactivo', 'agotado', 'eliminado')
LEFT JOIN (
    SELECT id_lista, COUNT(*) AS total_libros
    FROM lista_deseos_libros
    GROUP BY id_lista
) actuales ON actuales.id_lista = objetivo.id_lista
WHERE NOT EXISTS (
    SELECT 1
    FROM lista_deseos_libros existente
    WHERE existente.id_lista = objetivo.id_lista
      AND existente.id_libro = l.id_libro
);

INSERT INTO lista_deseos_libros (id_lista, id_libro, nota, fecha_agregado)
SELECT
    id_lista,
    id_libro,
    NULL,
    NOW()
FROM tmp_libros_para_deseos
WHERE posicion <= GREATEST(0, 8 - total_libros);

SELECT '058 - Listas de deseos completadas' AS resultado;
SELECT COUNT(*) AS compradores_con_minimo_8
FROM (
    SELECT u.id_usuario
    FROM usuarios u
    JOIN lista_deseos ld ON ld.id_usuario = u.id_usuario
    JOIN lista_deseos_libros ldl ON ldl.id_lista = ld.id_lista
    WHERE u.rol = 'comprador'
    GROUP BY u.id_usuario
    HAVING COUNT(DISTINCT ldl.id_libro) >= 8
) verificacion;

DROP TEMPORARY TABLE IF EXISTS tmp_libros_para_deseos;
DROP TEMPORARY TABLE IF EXISTS tmp_listas_deseos_objetivo;