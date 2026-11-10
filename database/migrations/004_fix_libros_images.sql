-- Actualizar stored procedure sp_listar_libros_disponibles para incluir imágenes
DROP PROCEDURE IF EXISTS sp_listar_libros_disponibles;

DELIMITER $$
CREATE PROCEDURE sp_listar_libros_disponibles()
BEGIN
    SELECT
        l.id_libro,
        l.titulo,
        l.autor_libro,
        c.nombre_categoria,
        t.nombre_tienda,
        l.precio_libro,
        l.stock,
        l.oculto,
        (SELECT url_imagen FROM imagenes_libro WHERE id_libro = l.id_libro AND es_principal = 1 LIMIT 1) AS imagen
    FROM libros l
    INNER JOIN categorias c ON l.id_categoria = c.id_categoria
    INNER JOIN tiendas t ON l.id_tienda = t.id_tienda;
END$$
DELIMITER ;
