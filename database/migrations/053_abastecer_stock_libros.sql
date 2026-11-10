-- Abastece cada libro para soportar compras de los compradores de prueba.
-- No reduce stocks existentes; solo eleva los que estan por debajo del minimo.
USE bookyhome;

UPDATE libros
SET stock = GREATEST(COALESCE(stock, 0), 133)
WHERE id_libro IS NOT NULL;

SELECT '053 - Stock minimo establecido en 133 unidades por libro' AS resultado;
SELECT COUNT(*) AS total_libros, SUM(stock) AS unidades_totales,
       MIN(stock) AS stock_minimo, MAX(stock) AS stock_maximo
FROM libros;
