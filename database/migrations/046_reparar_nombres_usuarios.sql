-- =============================================================================
-- Migracion 046: Reparar caracteres perdidos en nombres de vendedores
-- =============================================================================

USE bookyhome;

UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Librer??a', CONCAT('Librer', _utf8mb4 0xC3AD, 'a'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Bogot??', CONCAT('Bogot', _utf8mb4 0xC3A1));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, '??ncora', CONCAT(_utf8mb4 0xC381, 'ncora'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'C??pula', CONCAT('C', _utf8mb4 0xC3BA, 'pula'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, '??tico', CONCAT(_utf8mb4 0xC381, 'tico'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Cu??ntame', CONCAT('Cu', _utf8mb4 0xC3A9, 'ntame'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Rinc??n', CONCAT('Rinc', _utf8mb4 0xC3B3, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Pac??fico', CONCAT('Pac', _utf8mb4 0xC3AD, 'fico'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'P??ramo', CONCAT('P', _utf8mb4 0xC3A1, 'ramo'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Comp??s', CONCAT('Comp', _utf8mb4 0xC3A1, 's'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'P??ginas', CONCAT('P', _utf8mb4 0xC3A1, 'ginas'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Jard??n', CONCAT('Jard', _utf8mb4 0xC3AD, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Tr??pico', CONCAT('Tr', _utf8mb4 0xC3B3, 'pico'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Colof??n', CONCAT('Colof', _utf8mb4 0xC3B3, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'T??tem', CONCAT('T', _utf8mb4 0xC3B3, 'tem'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Medell??n', CONCAT('Medell', _utf8mb4 0xC3AD, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Colibr??', CONCAT('Colibr', _utf8mb4 0xC3AD));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Ori??n', CONCAT('Ori', _utf8mb4 0xC3B3, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Br??jula', CONCAT('Br', _utf8mb4 0xC3BA, 'jula'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Esp??ritu', CONCAT('Esp', _utf8mb4 0xC3AD, 'ritu'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Le??n', CONCAT('Le', _utf8mb4 0xC3B3, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Cr??nica', CONCAT('Cr', _utf8mb4 0xC3B3, 'nica'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Archipi??lago', CONCAT('Archipi', _utf8mb4 0xC3A9, 'lago'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, '??baco', CONCAT(_utf8mb4 0xC381, 'baco'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Monta??a', CONCAT('Monta', _utf8mb4 0xC3B1, 'a'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Zagu??n', CONCAT('Zagu', _utf8mb4 0xC3A1, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Caf??', CONCAT('Caf', _utf8mb4 0xC3A9));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Mart??n', CONCAT('Mart', _utf8mb4 0xC3AD, 'n'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Andr??s', CONCAT('Andr', _utf8mb4 0xC3A9, 's'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Mu??oz', CONCAT('Mu', _utf8mb4 0xC3B1, 'oz'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Ni??o', CONCAT('Ni', _utf8mb4 0xC3B1, 'o'));
UPDATE usuarios
SET nombre_usuario = REPLACE(nombre_usuario, 'Estaci??n', CONCAT('Estaci', _utf8mb4 0xC3B3, 'n'));

SELECT COUNT(*) AS usuarios_con_marcador_danado
FROM usuarios
WHERE nombre_usuario LIKE '%??%';