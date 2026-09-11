-- =============================================================================
-- Migracion 043: Reparar caracteres perdidos en libros y notificaciones
-- Los valores con ?? fueron guardados por ejecuciones anteriores usando latin1.
-- Se usan literales UTF-8 explicitos para que esta migracion sea segura desde
-- cualquier consola o cliente MySQL.
-- =============================================================================

USE bookyhome;

-- -----------------------------------------------------------------------------
-- Libros: titulos y autores
-- -----------------------------------------------------------------------------
UPDATE libros SET titulo = REPLACE(titulo, 'Dr??cula', CONCAT('Dr', _utf8mb4 0xC3A1, 'cula'));
UPDATE libros SET titulo = REPLACE(titulo, 'Cien a??os de soledad', CONCAT('Cien a', _utf8mb4 0xC3B1, 'os de soledad'));
UPDATE libros SET titulo = REPLACE(titulo, 'Cumbres borrascosas', 'Cumbres borrascosas');
UPDATE libros SET titulo = REPLACE(titulo, 'El se??or de los anillos', CONCAT('El se', _utf8mb4 0xC3B1, 'or de los anillos'));
UPDATE libros SET titulo = REPLACE(titulo, 'El se??or de las moscas', CONCAT('El se', _utf8mb4 0xC3B1, 'or de las moscas'));
UPDATE libros SET titulo = REPLACE(titulo, 'Rayuela', 'Rayuela');
UPDATE libros SET titulo = REPLACE(titulo, 'Dos a??os de vacaciones', CONCAT('Dos a', _utf8mb4 0xC3B1, 'os de vacaciones'));
UPDATE libros SET titulo = REPLACE(titulo, 'Dise??o de compiladores', CONCAT('Dise', _utf8mb4 0xC3B1, 'o de compiladores'));
UPDATE libros SET titulo = REPLACE(titulo, 'El extra??o caso del Dr. Jekyll', CONCAT('El extra', _utf8mb4 0xC3B1, 'o caso del Dr. Jekyll'));
UPDATE libros SET titulo = REPLACE(titulo, 'El ni??o del pijama de rayas', CONCAT('El ni', _utf8mb4 0xC3B1, 'o del pijama de rayas'));
UPDATE libros SET titulo = REPLACE(titulo, 'La vor??gine', CONCAT('La vor', _utf8mb4 0xC3A1, 'gine'));
UPDATE libros SET titulo = REPLACE(titulo, 'Libro 2 - Librer??a Faltante 074', CONCAT('Libro 2 - Librer', _utf8mb4 0xC3AD, 'a Faltante 074'));
UPDATE libros SET titulo = REPLACE(titulo, 'Libro 1 - Librer??a Faltante 074', CONCAT('Libro 1 - Librer', _utf8mb4 0xC3AD, 'a Faltante 074'));
UPDATE libros SET titulo = REPLACE(titulo, 'Libro 3 - Librer??a Faltante 075', CONCAT('Libro 3 - Librer', _utf8mb4 0xC3AD, 'a Faltante 075'));
UPDATE libros SET titulo = REPLACE(titulo, 'Libro 2 - Librer??a Faltante 075', CONCAT('Libro 2 - Librer', _utf8mb4 0xC3AD, 'a Faltante 075'));
UPDATE libros SET titulo = REPLACE(titulo, 'Libro 1 - Librer??a Faltante 075', CONCAT('Libro 1 - Librer', _utf8mb4 0xC3AD, 'a Faltante 075'));
UPDATE libros SET titulo = REPLACE(titulo, 'El ladr??n de rayos', CONCAT('El ladr', _utf8mb4 0xC3B3, 'n de rayos'));
UPDATE libros SET titulo = REPLACE(titulo, 'El m??dico', CONCAT('El m', _utf8mb4 0xC3A9, 'dico'));
UPDATE libros SET titulo = REPLACE(titulo, 'El oto??o del patriarca', CONCAT('El oto', _utf8mb4 0xC3B1, 'o del patriarca'));
UPDATE libros SET titulo = REPLACE(titulo, 'Dise??o de maquinas', CONCAT('Dise', _utf8mb4 0xC3B1, 'o de maquinas'));
UPDATE libros SET titulo = REPLACE(titulo, 'Se??oritas en apuros', CONCAT('Se', _utf8mb4 0xC3B1, 'oritas en apuros'));
UPDATE libros SET titulo = REPLACE(titulo, 'Persuasi??n', CONCAT('Persuasi', _utf8mb4 0xC3B3, 'n'));
UPDATE libros SET titulo = REPLACE(titulo, 'El guardi??n entre el centeno', CONCAT('El guardi', _utf8mb4 0xC3A1, 'n entre el centeno'));
UPDATE libros SET titulo = REPLACE(titulo, 'El coraz??n de las tinieblas', CONCAT('El coraz', _utf8mb4 0xC3B3, 'n de las tinieblas'));
UPDATE libros SET titulo = REPLACE(titulo, 'Pinturas rupestres de Colombia', 'Pinturas rupestres de Colombia');
UPDATE libros SET titulo = REPLACE(titulo, 'Guerra y paz', 'Guerra y paz');
UPDATE libros SET autor_libro = REPLACE(autor_libro, 'Bola??o', CONCAT('Bola', _utf8mb4 0xC3B1, 'o'));
UPDATE libros SET autor_libro = REPLACE(autor_libro, 'Fi??dor', CONCAT('Fi', _utf8mb4 0xC3B3, 'dor'));
UPDATE libros SET autor_libro = REPLACE(autor_libro, 'Tolst??i', CONCAT('Tolst', _utf8mb4 0xC3B3, 'i'));
UPDATE libros SET autor_libro = REPLACE(autor_libro, 'Bront??', CONCAT('Bront', _utf8mb4 0xC3AB));
UPDATE libros SET autor_libro = REPLACE(autor_libro, 'Casta??o-Uribe', CONCAT('Casta', _utf8mb4 0xC3B1, 'o-Uribe'));
UPDATE libros SET autor_libro = REPLACE(autor_libro, 'Cort??zar', CONCAT('Cort', _utf8mb4 0xC3A1, 'zar'));
UPDATE libros SET autor_libro = REPLACE(autor_libro, 'Charlotte Bront??', CONCAT('Charlotte Bront', _utf8mb4 0xC3AB));

-- Descripciones de libros: patrones repetidos en el catalogo generado.
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'po??ticos', CONCAT('po', _utf8mb4 0xC3A9, 'ticos'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'hom??nidos', CONCAT('hom', _utf8mb4 0xC3AD, 'nidos'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'ense??a', CONCAT('ense', _utf8mb4 0xC3B1, 'a'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'esc??ptico', CONCAT('esc', _utf8mb4 0xC3A9, 'ptico'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'island??s', CONCAT('island', _utf8mb4 0xC3A9, 's'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'exc??ntr', CONCAT('exc', _utf8mb4 0xC3A9, 'ntr'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'llam??', CONCAT('llam', _utf8mb4 0xC3B3));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'Yuk??n', CONCAT('Yuk', _utf8mb4 0xC3B3, 'n'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'Ocean??a', CONCAT('Ocean', _utf8mb4 0xC3AD, 'a'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'redefini??', CONCAT('redefini', _utf8mb4 0xC3B3));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'pr??ctico', CONCAT('pr', _utf8mb4 0xC3A1, 'ctico'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'Edici??n', CONCAT('Edici', _utf8mb4 0xC3B3, 'n'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'gru??on', CONCAT('gru', _utf8mb4 0xC3B1, 'on'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'Espa??a', CONCAT('Espa', _utf8mb4 0xC3B1, 'a'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'astr??noma', CONCAT('astr', _utf8mb4 0xC3B3, 'noma'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'se??al', CONCAT('se', _utf8mb4 0xC3B1, 'al'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'ni??o', CONCAT('ni', _utf8mb4 0xC3B1, 'o'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'dise??o', CONCAT('dise', _utf8mb4 0xC3B1, 'o'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'p??ramos', CONCAT('p', _utf8mb4 0xC3A1, 'ramos'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'aerost??tico', CONCAT('aerost', _utf8mb4 0xC3A1, 'tico'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'peque??o', CONCAT('peque', _utf8mb4 0xC3B1, 'o'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'telekin??ticos', CONCAT('telekin', _utf8mb4 0xC3A9, 'ticos'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'terror??fica', CONCAT('terror', _utf8mb4 0xC3AD, 'fica'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'a??os', CONCAT('a', _utf8mb4 0xC3B1, 'os'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'caribe??a', CONCAT('caribe', _utf8mb4 0xC3B1, 'a'));
UPDATE libros
SET descripcion_libro = REPLACE(descripcion_libro, 'Dr??cula', CONCAT('Dr', _utf8mb4 0xC3A1, 'cula'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'a??o', CONCAT('a', _utf8mb4 0xC3B1, 'o'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'ni??a', CONCAT('ni', _utf8mb4 0xC3B1, 'a'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'ni??os', CONCAT('ni', _utf8mb4 0xC3B1, 'os'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'monta??a', CONCAT('monta', _utf8mb4 0xC3B1, 'a'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Se??or', CONCAT('Se', _utf8mb4 0xC3B1, 'or'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'se??or', CONCAT('se', _utf8mb4 0xC3B1, 'or'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'cirug??a', CONCAT('cirug', _utf8mb4 0xC3AD, 'a'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Ces??rea', CONCAT('Ces', _utf8mb4 0xC3A1, 'rea'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'trav??s', CONCAT('trav', _utf8mb4 0xC3A9, 's'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'cambiar??', CONCAT('cambiar', _utf8mb4 0xC3A1));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Rask??lnikov', CONCAT('Rask', _utf8mb4 0xC3B3, 'lnikov'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'tr??gica', CONCAT('tr', _utf8mb4 0xC3A1, 'gica'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'obsesi??n', CONCAT('obsesi', _utf8mb4 0xC3B3, 'n'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Dubl??n', CONCAT('Dubl', _utf8mb4 0xC3AD, 'n'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'caballer??a', CONCAT('caballer', _utf8mb4 0xC3AD, 'a'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'napole??nicas', CONCAT('napole', _utf8mb4 0xC3B3, 'nicas'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'c??lera', CONCAT('c', _utf8mb4 0xC3B3, 'lera'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'expulsi??n', CONCAT('expulsi', _utf8mb4 0xC3B3, 'n'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Aleks??i', CONCAT('Aleks', _utf8mb4 0xC3A9, 'i'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 't??cnicas', CONCAT('t', _utf8mb4 0xC3A9, 'cnicas'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, '??ngeles', CONCAT(_utf8mb4 0xC3A1, 'ngeles'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'parad??jicas', CONCAT('parad', _utf8mb4 0xC3B3, 'jicas'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Bols??n', CONCAT('Bols', _utf8mb4 0xC3B3, 'n'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Biograf??a', CONCAT('Biograf', _utf8mb4 0xC3AD, 'a'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'm??s', CONCAT('m', _utf8mb4 0xC3A1, 's'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 't??ctica', CONCAT('t', _utf8mb4 0xC3A1, 'ctica'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'filosof??a', CONCAT('filosof', _utf8mb4 0xC3AD, 'a'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'pr??ncipe', CONCAT('pr', _utf8mb4 0xC3AD, 'ncipe'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'aristocr??tica', CONCAT('aristocr', _utf8mb4 0xC3A1, 'tica'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Am??rica', CONCAT('Am', _utf8mb4 0xC3A9, 'rica'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Ni??os', CONCAT('Ni', _utf8mb4 0xC3B1, 'os'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'h??roe', CONCAT('h', _utf8mb4 0xC3A9, 'roe'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'despu??s', CONCAT('despu', _utf8mb4 0xC3A9, 's'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'adicci??n', CONCAT('adicci', _utf8mb4 0xC3B3, 'n'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'arist??crata', CONCAT('arist', _utf8mb4 0xC3B3, 'crata'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'Colecci??n', CONCAT('Colecci', _utf8mb4 0xC3B3, 'n'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'T??tulo', CONCAT('T', _utf8mb4 0xC3AD, 'tulo'));
UPDATE libros SET descripcion_libro = REPLACE(descripcion_libro, 'rotaci??n', CONCAT('rotaci', _utf8mb4 0xC3B3, 'n'));

-- Mensajes de prueba: restaurar el contenido completo, incluida la puntuacion.
UPDATE notificaciones SET cuerpo = CONCAT(_utf8mb4 0xC2A1, 'Hola! Gracias por escribirnos. ', _utf8mb4 0xC2BF, 'Qu', _utf8mb4 0xC3A9, ' libro te interesa?') WHERE id_notificacion = 23;
UPDATE notificaciones SET cuerpo = CONCAT('Estoy buscando el libro "Cien a', _utf8mb4 0xC3B1, 'os de soledad", ', _utf8mb4 0xC2BF, 'lo tienen disponible?') WHERE id_notificacion = 24;
UPDATE notificaciones SET cuerpo = CONCAT('S', _utf8mb4 0xC3AD, ', lo tenemos disponible. Es una edici', _utf8mb4 0xC3B3, 'n muy bonita, cuesta $45.000. ', _utf8mb4 0xC2BF, 'Te interesa?') WHERE id_notificacion = 25;
UPDATE notificaciones SET cuerpo = CONCAT(_utf8mb4 0xC2BF, 'Cu', _utf8mb4 0xC3A1, 'nto tardar', _utf8mb4 0xC3AD, 'a el env', _utf8mb4 0xC3AD, 'o a Bogot', _utf8mb4 0xC3A1, ' y cu', _utf8mb4 0xC3A1, 'l ser', _utf8mb4 0xC3AD, 'a el costo?') WHERE id_notificacion = 26;
UPDATE notificaciones SET cuerpo = CONCAT('Perfecto, me interesa. ', _utf8mb4 0xC2BF, 'C', _utf8mb4 0xC3B3, 'mo puedo hacer el pago?') WHERE id_notificacion = 28;

UPDATE libros
SET descripcion_libro = CONCAT('Colecci', _utf8mb4 0xC3B3, 'n 2 para Librer', _utf8mb4 0xC3AD, 'a Faltante 074. T', _utf8mb4 0xC3AD, 'tulo pensado para una librer', _utf8mb4 0xC3AD, 'a moderna con stock activo y buena rotaci', _utf8mb4 0xC3B3, 'n en cat', _utf8mb4 0xC3A1, 'logo.')
WHERE id_libro = 785;
UPDATE libros
SET descripcion_libro = CONCAT('Colecci', _utf8mb4 0xC3B3, 'n 1 para Librer', _utf8mb4 0xC3AD, 'a Faltante 074. T', _utf8mb4 0xC3AD, 'tulo pensado para una librer', _utf8mb4 0xC3AD, 'a moderna con stock activo y buena rotaci', _utf8mb4 0xC3B3, 'n en cat', _utf8mb4 0xC3A1, 'logo.')
WHERE id_libro = 786;
UPDATE libros
SET descripcion_libro = CONCAT('Colecci', _utf8mb4 0xC3B3, 'n 3 para Librer', _utf8mb4 0xC3AD, 'a Faltante 075. T', _utf8mb4 0xC3AD, 'tulo pensado para una librer', _utf8mb4 0xC3AD, 'a moderna con stock activo y buena rotaci', _utf8mb4 0xC3B3, 'n en cat', _utf8mb4 0xC3A1, 'logo.')
WHERE id_libro = 787;
UPDATE libros
SET descripcion_libro = CONCAT('Colecci', _utf8mb4 0xC3B3, 'n 2 para Librer', _utf8mb4 0xC3AD, 'a Faltante 075. T', _utf8mb4 0xC3AD, 'tulo pensado para una librer', _utf8mb4 0xC3AD, 'a moderna con stock activo y buena rotaci', _utf8mb4 0xC3B3, 'n en cat', _utf8mb4 0xC3A1, 'logo.')
WHERE id_libro = 788;
UPDATE libros
SET descripcion_libro = CONCAT('Colecci', _utf8mb4 0xC3B3, 'n 1 para Librer', _utf8mb4 0xC3AD, 'a Faltante 075. T', _utf8mb4 0xC3AD, 'tulo pensado para una librer', _utf8mb4 0xC3AD, 'a moderna con stock activo y buena rotaci', _utf8mb4 0xC3B3, 'n en cat', _utf8mb4 0xC3A1, 'logo.')
WHERE id_libro = 789;

-- Aplicar los mismos patrones a notificaciones históricas.
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'Edici??n', CONCAT('Edici', _utf8mb4 0xC3B3, 'n')),
	cuerpo = REPLACE(cuerpo, 'Edici??n', CONCAT('Edici', _utf8mb4 0xC3B3, 'n'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'Dos a??os', CONCAT('Dos a', _utf8mb4 0xC3B1, 'os')),
	cuerpo = REPLACE(cuerpo, 'Dos a??os', CONCAT('Dos a', _utf8mb4 0xC3B1, 'os'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'Dise??o', CONCAT('Dise', _utf8mb4 0xC3B1, 'o')),
	cuerpo = REPLACE(cuerpo, 'Dise??o', CONCAT('Dise', _utf8mb4 0xC3B1, 'o'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El ni??o', CONCAT('El ni', _utf8mb4 0xC3B1, 'o')),
	cuerpo = REPLACE(cuerpo, 'El ni??o', CONCAT('El ni', _utf8mb4 0xC3B1, 'o'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El oto??o', CONCAT('El oto', _utf8mb4 0xC3B1, 'o')),
	cuerpo = REPLACE(cuerpo, 'El oto??o', CONCAT('El oto', _utf8mb4 0xC3B1, 'o'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El ladr??n', CONCAT('El ladr', _utf8mb4 0xC3B3, 'n')),
	cuerpo = REPLACE(cuerpo, 'El ladr??n', CONCAT('El ladr', _utf8mb4 0xC3B3, 'n'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El se??or', CONCAT('El se', _utf8mb4 0xC3B1, 'or')),
	cuerpo = REPLACE(cuerpo, 'El se??or', CONCAT('El se', _utf8mb4 0xC3B1, 'or'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El m??dico', CONCAT('El m', _utf8mb4 0xC3A9, 'dico')),
	cuerpo = REPLACE(cuerpo, 'El m??dico', CONCAT('El m', _utf8mb4 0xC3A9, 'dico'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El verano que me enamor??', CONCAT('El verano que me enamor', _utf8mb4 0xC3A9)),
	cuerpo = REPLACE(cuerpo, 'El verano que me enamor??', CONCAT('El verano que me enamor', _utf8mb4 0xC3A9));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El coraz??n', CONCAT('El coraz', _utf8mb4 0xC3B3, 'n')),
	cuerpo = REPLACE(cuerpo, 'El coraz??n', CONCAT('El coraz', _utf8mb4 0xC3B3, 'n'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El guardi??n', CONCAT('El guardi', _utf8mb4 0xC3A1, 'n')),
	cuerpo = REPLACE(cuerpo, 'El guardi??n', CONCAT('El guardi', _utf8mb4 0xC3A1, 'n'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'Persuasi??n', CONCAT('Persuasi', _utf8mb4 0xC3B3, 'n')),
	cuerpo = REPLACE(cuerpo, 'Persuasi??n', CONCAT('Persuasi', _utf8mb4 0xC3B3, 'n'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'Se??oritas', CONCAT('Se', _utf8mb4 0xC3B1, 'oritas')),
	cuerpo = REPLACE(cuerpo, 'Se??oritas', CONCAT('Se', _utf8mb4 0xC3B1, 'oritas'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'Dr??cula', CONCAT('Dr', _utf8mb4 0xC3A1, 'cula')),
	cuerpo = REPLACE(cuerpo, 'Dr??cula', CONCAT('Dr', _utf8mb4 0xC3A1, 'cula'));
UPDATE notificaciones
SET titulo = REPLACE(titulo, 'El extra??o', CONCAT('El extra', _utf8mb4 0xC3B1, 'o')),
	cuerpo = REPLACE(cuerpo, 'El extra??o', CONCAT('El extra', _utf8mb4 0xC3B1, 'o'));
UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'ser??a', CONCAT('ser', _utf8mb4 0xC3AD, 'a'));
UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'env??o', CONCAT('env', _utf8mb4 0xC3AD, 'o'));
UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'Bogot??', CONCAT('Bogot', _utf8mb4 0xC3A1));
UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'd??as', CONCAT('d', _utf8mb4 0xC3AD, 'as'));
UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'h??biles', CONCAT('h', _utf8mb4 0xC3A1, 'biles'));
UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'ma??ana', CONCAT('ma', _utf8mb4 0xC3B1, 'ana'));

-- -----------------------------------------------------------------------------
-- Notificaciones de mensajes
-- -----------------------------------------------------------------------------
UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, '??Hola!', CONCAT(_utf8mb4 0xC2A1, 'Hola!'))
WHERE cuerpo LIKE '%??Hola!%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, '??Qu?? libro', CONCAT(_utf8mb4 0xC2BF, 'Qu', _utf8mb4 0xC3A9, ' libro'))
WHERE cuerpo LIKE '%??Qu?? libro%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'Cien a??os', CONCAT('Cien a', _utf8mb4 0xC3B1, 'os'))
WHERE cuerpo LIKE '%Cien a??os%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, '??lo tienen', CONCAT(_utf8mb4 0xC2BF, 'lo tienen'))
WHERE cuerpo LIKE '%??lo tienen%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'S??,', CONCAT('S', _utf8mb4 0xC3AD, ','))
WHERE cuerpo LIKE '%S??,%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, 'edici??n', CONCAT('edici', _utf8mb4 0xC3B3, 'n'))
WHERE cuerpo LIKE '%edici??n%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, '??Te interesa?', CONCAT(_utf8mb4 0xC2BF, 'Te interesa?'))
WHERE cuerpo LIKE '%??Te interesa?%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, '??Cu??nto tardar??a el env??o a Bogot?? y cu??l', CONCAT(_utf8mb4 0xC2BF, 'Cu', _utf8mb4 0xC3A1, 'nto tardar', _utf8mb4 0xC3AD, 'a el env', _utf8mb4 0xC3AD, 'o a Bogot', _utf8mb4 0xC3A1, ' y cu', _utf8mb4 0xC3A1, 'l'))
WHERE cuerpo LIKE '%??Cu??nto tardar??a el env??o a Bogot?? y cu??l%';

UPDATE notificaciones
SET cuerpo = REPLACE(cuerpo, '??C??mo', CONCAT(_utf8mb4 0xC2BF, 'C', _utf8mb4 0xC3B3, 'mo'))
WHERE cuerpo LIKE '%??C??mo%';

SELECT '043 - Caracteres raros reparados' AS resultado;
