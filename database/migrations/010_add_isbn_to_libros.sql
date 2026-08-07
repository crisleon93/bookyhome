-- Migration: Agregar campo ISBN a tabla libros
-- Fecha: 2026-08-07
-- Propósito: Soportar búsqueda de libros por código de barras/ISBN

USE bookyhome;

-- Agregar campo ISBN a la tabla libros
ALTER TABLE libros 
ADD COLUMN isbn VARCHAR(20) NULL AFTER autor_libro,
ADD INDEX idx_isbn (isbn);

-- Comentario: El campo ISBN permite almacenar tanto ISBN-10 como ISBN-13
-- El índice mejora el rendimiento de búsquedas por ISBN