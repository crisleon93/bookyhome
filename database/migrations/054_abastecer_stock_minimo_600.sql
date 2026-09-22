-- Eleva el inventario minimo de cada libro a 600 unidades.
-- No reduce stocks que ya superen este valor.
USE bookyhome;

UPDATE libros
SET stock = GREATEST(COALESCE(stock, 0), 600)
WHERE id_libro IS NOT NULL;

SELECT '054 - Stock minimo establecido en 600 unidades por libro' AS resultado;
SELECT COUNT(*) AS total_libros, SUM(stock) AS unidades_totales,
       ROUND(AVG(stock), 1) AS stock_promedio,
       MIN(stock) AS stock_minimo, MAX(stock) AS stock_maximo
FROM libros;
