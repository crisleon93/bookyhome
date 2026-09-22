-- Corrige el hash de los usuarios sembrados para que acepten Bookyhome2025*.
USE bookyhome;

UPDATE usuarios
SET contrasena_usuario = '$2b$12$oThv7vhZNwgLTTfMkSd7j.ClL.FY9Sm/XlLwlFWoKZD74YhkMKLWG'
WHERE id_usuario BETWEEN 37 AND 284;

SELECT '059 - Password de usuarios sembrados corregido' AS resultado,
       ROW_COUNT() AS usuarios_actualizados;