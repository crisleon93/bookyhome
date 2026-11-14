-- =============================================================================
-- Migración 032: Completar libros para que TODAS las tiendas tengan mínimo 35
-- Estrategia:
--   · Tiendas 15-75  (sin libros): insertar 35 libros reales cada una
--   · Tiendas 76-150 (con 3):      insertar 32 libros mas cada una
-- Los titulos rotan sobre un catalogo de ~120 titulos reales variados por
-- categoria. Los precios, stock y fechas son realistas.
-- =============================================================================

USE bookyhome;

DROP PROCEDURE IF EXISTS sp_completar_libros;

DELIMITER $$

CREATE PROCEDURE sp_completar_libros()
BEGIN
  DECLARE v_tienda   INT;
  DECLARE v_slot     INT;
  DECLARE v_cat      INT;
  DECLARE v_titulo   VARCHAR(100);
  DECLARE v_autor    VARCHAR(50);
  DECLARE v_isbn     VARCHAR(20);
  DECLARE v_desc     VARCHAR(300);
  DECLARE v_precio   DECIMAL(10,2);
  DECLARE v_stock    INT;
  DECLARE v_fecha    DATE;
  DECLARE v_existing INT;
  DECLARE v_ultima_tienda INT;

  -- Catalogo: 35 entradas (una por slot), cada slot define titulo/autor/cat/precio/fecha
  -- El catalogo se aplica igual a cada tienda; como libros pueden repetirse entre tiendas, no hay duplicado

  -- Iterar sobre los IDs reales; AUTO_INCREMENT puede tener huecos.
  SET v_tienda = 0;
  SELECT MIN(id_tienda) INTO v_tienda FROM tiendas WHERE id_tienda > v_tienda;
  WHILE v_tienda IS NOT NULL DO

    -- Determinar cuantos libros necesita esta tienda
    SELECT COUNT(*) INTO v_existing FROM libros WHERE id_tienda = v_tienda;

    SET v_slot = v_existing + 1;

    WHILE v_slot <= 35 DO

      -- Calcular categoria, titulo, autor, etc. basado en slot y tienda
      SET v_cat = 1 + ((v_slot + v_tienda) % 16);
      IF v_cat = 0 THEN SET v_cat = 16; END IF;

      -- Titulo basado en cat y slot rotativo
      CASE v_cat
        WHEN 1 THEN
          SET v_titulo = ELT(1 + (v_slot % 10),
            'El nombre del viento','Las guerras de fuego','El hobbit',
            'Las cronicas de Narnia','Eragon','La historia interminable',
            'Los hijos de Hurin','El camino de los reyes',
            'El silmarillion','El señor de los anillos');
          SET v_autor = ELT(1 + (v_slot % 10),
            'Patrick Rothfuss','Joan de Deu Prats','J.R.R. Tolkien',
            'C.S. Lewis','Christopher Paolini','Michael Ende',
            'J.R.R. Tolkien','Brandon Sanderson',
            'J.R.R. Tolkien','J.R.R. Tolkien');
          SET v_isbn = CONCAT('978846636', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 40000 + (v_slot * 1000);
          SET v_fecha = '2008-03-15';
        WHEN 2 THEN
          SET v_titulo = ELT(1 + (v_slot % 8),
            'Orgullo y prejuicio','El tiempo entre costuras','La regenta',
            'Ana Karenina','Norte y sur','Persuasion',
            'Cumbres borrascosas','Sentido y sensibilidad');
          SET v_autor = ELT(1 + (v_slot % 8),
            'Jane Austen','Maria Duenas','Leopoldo Alas',
            'Lev Tolstói','Elizabeth Gaskell','Jane Austen',
            'Emily Brontë','Jane Austen');
          SET v_isbn = CONCAT('978849838', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 36000 + (v_slot * 900);
          SET v_fecha = '1997-05-20';
        WHEN 3 THEN
          SET v_titulo = ELT(1 + (v_slot % 7),
            'It','Drácula','Frankenstein',
            'El resplandor','El exorcista','Cementerio de animales',
            'El terror');
          SET v_autor = ELT(1 + (v_slot % 7),
            'Stephen King','Bram Stoker','Mary Shelley',
            'Stephen King','William Peter Blatty','Stephen King',
            'Dan Simmons');
          SET v_isbn = CONCAT('978840135', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 40000 + (v_slot * 800);
          SET v_fecha = '1985-09-01';
        WHEN 4 THEN
          SET v_titulo = ELT(1 + (v_slot % 9),
            'Cien años de soledad','El coronel no tiene quien le escriba',
            'Pedro Paramo','Rayuela','Los miserables',
            'La sombra del viento','1984','Ficciones','El proceso');
          SET v_autor = ELT(1 + (v_slot % 9),
            'Gabriel Garcia Marquez','Gabriel Garcia Marquez',
            'Juan Rulfo','Julio Cortázar','Victor Hugo',
            'Carlos Ruiz Zafon','George Orwell','Jorge Luis Borges','Franz Kafka');
          SET v_isbn = CONCAT('978840835', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 42000 + (v_slot * 1100);
          SET v_fecha = '1978-01-01';
        WHEN 5 THEN
          SET v_titulo = ELT(1 + (v_slot % 7),
            'Breve historia del tiempo','El gen egoista','Cosmos',
            'El universo elegante','El espejismo de Dios',
            'La fisica de lo imposible','El mundo y sus demonios');
          SET v_autor = ELT(1 + (v_slot % 7),
            'Stephen Hawking','Richard Dawkins','Carl Sagan',
            'Brian Greene','Richard Dawkins',
            'Michio Kaku','Carl Sagan');
          SET v_isbn = CONCAT('978884992', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 44000 + (v_slot * 1200);
          SET v_fecha = '2003-06-10';
        WHEN 6 THEN
          SET v_titulo = ELT(1 + (v_slot % 7),
            'Clean Code','El programador pragmatico','Python para todos',
            'Machine Learning en Python','Docker y Kubernetes',
            'Cracking the Coding Interview','Design Patterns');
          SET v_autor = ELT(1 + (v_slot % 7),
            'Robert C. Martin','Andrew Hunt','Charles Severance',
            'Sebastian Raschka','Brendan Burns',
            'Gayle Laakmann','Gang of Four');
          SET v_isbn = CONCAT('978013235', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 72000 + (v_slot * 1500);
          SET v_fecha = '2012-04-01';
        WHEN 7 THEN
          SET v_titulo = ELT(1 + (v_slot % 6),
            'Calculo diferencial e integral','Resistencia de materiales',
            'Mecanica de fluidos','Termodinamica',
            'Ingenieria de software','Electronica digital');
          SET v_autor = ELT(1 + (v_slot % 6),
            'Piskunov','Ferdinand Beer',
            'Frank White','Cengel & Boles',
            'Ian Sommerville','Floyd Thomas');
          SET v_isbn = CONCAT('978607322', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 88000 + (v_slot * 2000);
          SET v_fecha = '2013-08-01';
        WHEN 8 THEN
          SET v_titulo = ELT(1 + (v_slot % 8),
            'Matilda','El principito','Alicia en el pais de las maravillas',
            'Peter Pan','Las aventuras de Pinocho','El libro de la selva',
            'Bambi','El patito feo');
          SET v_autor = ELT(1 + (v_slot % 8),
            'Roald Dahl','Antoine de Saint-Exupery','Lewis Carroll',
            'J.M. Barrie','Carlo Collodi','Rudyard Kipling',
            'Felix Salten','Hans Christian Andersen');
          SET v_isbn = CONCAT('978849838', LPAD((v_tienda * 100 + v_slot + 500) % 10000, 4, '0'));
          SET v_precio = 25000 + (v_slot * 600);
          SET v_fecha = '1968-01-01';
        WHEN 9 THEN
          SET v_titulo = ELT(1 + (v_slot % 8),
            'Harry Potter y la piedra filosofal','Los juegos del hambre',
            'Divergente','El corredor del laberinto','Bajo la misma estrella',
            'Harry Potter y la camara secreta','Ciudad de huesos',
            'Nuestras estrellas');
          SET v_autor = ELT(1 + (v_slot % 8),
            'J.K. Rowling','Suzanne Collins',
            'Veronica Roth','James Dashner','John Green',
            'J.K. Rowling','Cassandra Clare',
            'John Green');
          SET v_isbn = CONCAT('978884788', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 38000 + (v_slot * 800);
          SET v_fecha = '2010-01-01';
        WHEN 10 THEN
          SET v_titulo = ELT(1 + (v_slot % 7),
            'La isla del tesoro','Moby Dick','La llamada de lo salvaje',
            'La vuelta al mundo en 80 dias','Viaje al centro de la Tierra',
            'Los tres mosqueteros','El conde de Montecristo');
          SET v_autor = ELT(1 + (v_slot % 7),
            'Robert L. Stevenson','Herman Melville','Jack London',
            'Julio Verne','Julio Verne',
            'Alexandre Dumas','Alexandre Dumas');
          SET v_isbn = CONCAT('978849838', LPAD((v_tienda * 100 + v_slot + 200) % 10000, 4, '0'));
          SET v_precio = 32000 + (v_slot * 900);
          SET v_fecha = '1890-01-01';
        WHEN 11 THEN
          SET v_titulo = ELT(1 + (v_slot % 7),
            'Sapiens','Guns Germs and Steel','La Segunda Guerra Mundial',
            'Historia de America Latina','El Imperio Romano',
            'La Revolucion Francesa','Conquistas de Mexico');
          SET v_autor = ELT(1 + (v_slot % 7),
            'Yuval Noah Harari','Jared Diamond','Antony Beevor',
            'Tulio Halperin','Colin Wells',
            'William Doyle','Fernando Cervantes');
          SET v_isbn = CONCAT('978840860', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 46000 + (v_slot * 1000);
          SET v_fecha = '2005-01-01';
        WHEN 12 THEN
          SET v_titulo = ELT(1 + (v_slot % 7),
            'Inteligencia emocional','Como ganar amigos','Aprender a aprender',
            'Pensar rapido pensar despacio','Los 7 habitos',
            'El poder del ahora','Los cuatro acuerdos');
          SET v_autor = ELT(1 + (v_slot % 7),
            'Daniel Goleman','Dale Carnegie','Barbara Oakley',
            'Daniel Kahneman','Stephen Covey',
            'Eckhart Tolle','Miguel Ruiz');
          SET v_isbn = CONCAT('978844733', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 36000 + (v_slot * 800);
          SET v_fecha = '2004-01-01';
        WHEN 13 THEN
          SET v_titulo = ELT(1 + (v_slot % 6),
            'Historia del arte','El arte de la guerra',
            'Klimt','Leonardo Da Vinci',
            'Picasso','El arte de Velazquez');
          SET v_autor = ELT(1 + (v_slot % 6),
            'Ernst Gombrich','Sun Tzu',
            'Gilles Neret','Walter Isaacson',
            'Pierre Daix','Jonathan Brown');
          SET v_isbn = CONCAT('978071483', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 60000 + (v_slot * 1500);
          SET v_fecha = '2006-01-01';
        WHEN 14 THEN
          SET v_titulo = ELT(1 + (v_slot % 6),
            'El mundo segun Garp','Catch-22',
            'Bridget Jones el diario','El libro de los abrazos',
            'Seinlanguage','Don Quijote de la Mancha');
          SET v_autor = ELT(1 + (v_slot % 6),
            'John Irving','Joseph Heller',
            'Helen Fielding','Eduardo Galeano',
            'Jerry Seinfeld','Miguel de Cervantes');
          SET v_isbn = CONCAT('978849062', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 33000 + (v_slot * 700);
          SET v_fecha = '1994-01-01';
        WHEN 15 THEN
          SET v_titulo = ELT(1 + (v_slot % 7),
            'El diario de Ana Frank','Steve Jobs','Gandhi Autobiografia',
            'Nelson Mandela','Leonardo Da Vinci','Marie Curie',
            'Frida Kahlo la pintora');
          SET v_autor = ELT(1 + (v_slot % 7),
            'Ana Frank','Walter Isaacson','Mahatma Gandhi',
            'Nelson Mandela','Walter Isaacson','Susan Quinn',
            'Hayden Herrera');
          SET v_isbn = CONCAT('978884904', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 42000 + (v_slot * 1000);
          SET v_fecha = '2008-01-01';
        ELSE -- 16 Fic. Científica
          SET v_titulo = ELT(1 + (v_slot % 8),
            'Dune','Fundacion','Neuromante',
            '2001 Una odisea del espacio','Yo robot','El marciano',
            'Hyperion','Un mundo feliz');
          SET v_autor = ELT(1 + (v_slot % 8),
            'Frank Herbert','Isaac Asimov','William Gibson',
            'Arthur C. Clarke','Isaac Asimov','Andy Weir',
            'Dan Simmons','Aldous Huxley');
          SET v_isbn = CONCAT('978846637', LPAD((v_tienda * 100 + v_slot) % 10000, 4, '0'));
          SET v_precio = 42000 + (v_slot * 1000);
          SET v_fecha = '2002-01-01';
      END CASE;

      -- Descripcion real segun titulo
      SET v_desc = CASE v_titulo
        -- FANTASIA
        WHEN 'El nombre del viento'       THEN 'La historia de Kvothe, un legendario mago contada en primera persona desde su infancia hasta convertirse en el hombre mas temido del mundo.'
        WHEN 'Las guerras de fuego'       THEN 'Epic aventura juvenil sobre guerras elementales que amenazan el equilibrio entre los reinos de fuego, tierra, agua y aire.'
        WHEN 'El hobbit'                  THEN 'Bilbo Bolson emprende una aventura inesperada con un grupo de enanos para reclamar un tesoro custodiado por el dragon Smaug.'
        WHEN 'Las cronicas de Narnia'     THEN 'Siete novelas ambientadas en el mundo magico de Narnia gobernado por el leon Aslan, donde los ninos descubren que son protagonistas de una historia antigua.'
        WHEN 'Eragon'                     THEN 'Un joven granjero descubre un huevo de dragon que al eclosionar cambiara su destino y lo convertira en el ultimo de los Jinetes de Dragon.'
        WHEN 'La historia interminable'   THEN 'Bastian Balthazar Bux descubre un libro magico que lo transporta a Fantasia, un mundo que se desvanece y que solo el puede salvar.'
        WHEN 'Los hijos de Hurin'         THEN 'La tragica historia del heroe Turin Turambar, maldecido por Morgoth, que busca redimir a su familia en los primeros tiempos de la Tierra Media.'
        WHEN 'El camino de los reyes'     THEN 'En el mundo de Roshar azotado por tormentas magicas, tres personajes convergen en un conflicto que determinara el destino de la humanidad.'
        WHEN 'El silmarillion'            THEN 'Los mitos y leyendas de la Tierra Media desde la Creacion hasta el fin de la Primera Edad, fundamento de toda la mitologia tolkieniana.'
        WHEN 'El señor de los anillos'    THEN 'La gran epopeya de fantasia sobre la destruccion del Unico Anillo y la caida del Senor Oscuro Sauron, narrada a traves de la travesia de la Comunidad del Anillo.'
        WHEN 'Las guerras de fuego'       THEN 'Aventura epica juvenil sobre la guerra entre las fuerzas elementales que amenaza con destruir el equilibrio del mundo magico.'
        -- ROMANCE
        WHEN 'Orgullo y prejuicio'        THEN 'La historia de amor entre Elizabeth Bennet y el senor Darcy en la Inglaterra del siglo XIX, donde los prejuicios sociales y el orgullo personal deben superarse para encontrar la felicidad.'
        WHEN 'El tiempo entre costuras'   THEN 'Una costurera espanola se convierte en espia durante la Segunda Guerra Mundial, tejiendo secretos entre las telas de sus elegantes vestidos en el Marruecos colonial.'
        WHEN 'La regenta'                 THEN 'Ana Ozores, casada con el Regente de Vetusta, es cortejada por el canonigo De Pas y el seductor Alvaro Mesia en esta critica social de la Espana del siglo XIX.'
        WHEN 'Ana Karenina'               THEN 'La tragica historia de amor de Anna Karenina, una mujer de la alta sociedad rusa que abandona a su marido por el apuesto conde Vronski con devastadoras consecuencias.'
        WHEN 'Norte y sur'                THEN 'Margaret Hale se muda del campo ingles al norte industrial y choca con el autoritario John Thornton, propietario de una fabrica, en esta novela de contrastes sociales y amor.'
        WHEN 'Persuasion'                 THEN 'Anne Elliot reencontrara al capitan Wentworth, a quien fue persuadida de rechazar anos atras, en esta reflexion de Jane Austen sobre el arrepentimiento y el amor maduro.'
        WHEN 'Cumbres borrascosas'        THEN 'El turbulento y apasionado amor entre Heathcliff y Catherine Earnshaw en los paramos yorkshirenses, una historia de obsesion y venganza que trasciende la muerte.'
        WHEN 'Sentido y sensibilidad'     THEN 'Las hermanas Elinor y Marianne Dashwood navegan el matrimonio y la sociedad inglesa del siglo XIX, representando la razon y la pasion respectivamente.'
        -- TERROR
        WHEN 'It'                         THEN 'Un grupo de ninos se enfrenta a una entidad maligna que adopta la forma de sus miedos en el pueblo de Derry, Maine, y deben volver de adultos para completar lo que empezaron.'
        WHEN 'Dracula'                    THEN 'El conde Dracula viaja desde Transylvania hasta la Inglaterra victoriana en busca de sangre fresca, perseguido por el profesor Van Helsing y un grupo de valientes.'
        WHEN 'Drácula'                    THEN 'El conde Dracula viaja desde Transylvania hasta la Inglaterra victoriana en busca de sangre fresca, perseguido por el profesor Van Helsing y un grupo de valientes.'
        WHEN 'Dr??cula'                    THEN 'El conde Dracula viaja desde Transylvania hasta la Inglaterra victoriana en busca de sangre fresca, perseguido por el profesor Van Helsing y un grupo de valientes.'
        WHEN 'Frankenstein'               THEN 'El joven cientifico Victor Frankenstein crea vida a partir de materia inerte, pero su criatura, abandonada y rechazada, se convierte en su perseguidor implacable.'
        WHEN 'El resplandor'              THEN 'Jack Torrance acepta cuidar un hotel en las Montanas Rocosas durante el invierno, pero las fuerzas sobrenaturales del lugar despiertan su lado mas oscuro frente a su familia.'
        WHEN 'El exorcista'               THEN 'La joven Regan MacNeil es poseida por una entidad diabolica y su madre desesperada recurre a dos sacerdotes para realizar un exorcismo que desafiara su fe.'
        WHEN 'Cementerio de animales'     THEN 'La familia Creed descubre que el cementerio cercano a su nueva casa tiene el poder de devolver la vida a los muertos, con consecuencias que van mas alla de lo imaginable.'
        WHEN 'El terror'                  THEN 'En 1845 dos barcos quedan atrapados en el hielo artico durante anos. Ademas del frio y el hambre, la tripulacion enfrenta una criatura sobrenatural que los acecha.'
        -- FICCION
        WHEN 'Cien años de soledad'       THEN 'Siete generaciones de la familia Buendia en el pueblo de Macondo, desde su fundacion hasta su apocaliptica destruccion, tejidas con el realismo magico de Garcia Marquez.'
        WHEN 'Cien a??os de soledad'       THEN 'Siete generaciones de la familia Buendia en el pueblo de Macondo, desde su fundacion hasta su apocaliptica destruccion, tejidas con el realismo magico de Garcia Marquez.'
        WHEN 'El coronel no tiene quien le escriba' THEN 'Un anciano coronel espera durante quince anos la pension que le prometieron por su participacion en la guerra, en esta novela breve y perfecta de Garcia Marquez.'
        WHEN 'Pedro Paramo'               THEN 'Juan Preciado viaja a Comala buscando a su padre Pedro Paramo y encuentra un pueblo fantasma habitado por muertos que le revelan una historia de poder y pasion.'
        WHEN 'Rayuela'                    THEN 'Horacio Oliveira busca a la Maga por Paris y Buenos Aires en esta novela experimental de Cortazar que puede leerse en distintos ordenes y que redefinió la literatura latinoamericana.'
        WHEN 'Los miserables'             THEN 'Jean Valjean, expreso convicto que busca redimirse, y el implacable inspector Javert se persiguen por la Francia del siglo XIX en esta epica del bien contra el mal.'
        WHEN 'La sombra del viento'       THEN 'En la Barcelona de la posguerra, el joven Daniel descubre en el Cementerio de los Libros Olvidados una novela que lo lleva a investigar el misterioso destino de su autor.'
        WHEN '1984'                       THEN 'En el totalitario estado de Oceanía, Winston Smith trabaja para el Ministerio de la Verdad reescribiendo la historia, hasta que decide rebelarse contra el Gran Hermano.'
        WHEN 'Ficciones'                  THEN 'Catorce cuentos que desafian la realidad: laberintos infinitos, bibliotecas universales y posibilidades alternativas de la existencia humana, obra cumbre de Jorge Luis Borges.'
        WHEN 'El proceso'                 THEN 'Josef K. es arrestado una manana sin saber de que se le acusa, y su kafkiana busqueda de una justicia incomprensible se convierte en una pesadilla absurda y aterradora.'
        WHEN 'La conjura de los necios'   THEN 'Ignatius Reilly, un excéntrico inadaptado de Nueva Orleans, protagoniza una serie de calamitosas aventuras en esta comedia oscar posthuma de Toole.'
        WHEN 'El mundo segun Garp'        THEN 'La vida de T.S. Garp, hijo de una enfermera feminista y un aviador en estado vegetativo, narrada con humor y tragedia en partes iguales por John Irving.'
        WHEN 'Catch-22'                   THEN 'El soldado Yossarian intenta que lo declaren loco para escapar de la guerra, pero la paradoja del Articulo 22 hace que cualquier hombre que quiera evitar el combate demuestre que esta cuerdo.'
        WHEN 'Don Quijote de la Mancha'   THEN 'El caballero andante Alonso Quijano, enloquecido por las novelas de caballeria, sale al mundo como Don Quijote de la Mancha acompanado de su fiel escudero Sancho Panza.'
        -- CIENCIA
        WHEN 'Breve historia del tiempo'  THEN 'Stephen Hawking explora los misterios del universo, desde el Big Bang hasta los agujeros negros, en el libro de divulgacion cientifica mas vendido de la historia.'
        WHEN 'El gen egoista'             THEN 'Richard Dawkins propone que los genes son los verdaderos protagonistas de la evolucion y que los organismos somos sus vehiculos temporales en esta revolucionaria obra.'
        WHEN 'Cosmos'                     THEN 'Carl Sagan lleva al lector en un viaje por el universo explorando el origen de la vida, la evolucion de la conciencia humana y nuestro lugar en el cosmos.'
        WHEN 'El universo elegante'       THEN 'Brian Greene explica la teoria de cuerdas y las dimensiones extra del universo de manera accesible, revelando la busqueda de una teoria unificada de la fisica.'
        WHEN 'El espejismo de Dios'       THEN 'Richard Dawkins argumenta desde la ciencia y la filosofia que la existencia de Dios es una hipotesis que puede y debe evaluarse con el mismo rigor que cualquier otra.'
        WHEN 'La fisica de lo imposible'  THEN 'Michio Kaku analiza si tecnologias como los rayos de la muerte, la invisibilidad o los viajes en el tiempo son realmente imposibles o solo cuestiones de tiempo.'
        WHEN 'El mundo y sus demonios'    THEN 'Carl Sagan defiende el pensamiento cientifico escéptico como la mejor herramienta de la humanidad frente a la supersticion, la pseudociencia y la demagogia.'
        WHEN 'El espejismo de Dios'       THEN 'Richard Dawkins argumenta desde la ciencia y la filosofia por que la fe religiosa es incompatible con el pensamiento racional y cientifico moderno.'
        -- TECNOLOGIA
        WHEN 'Clean Code'                 THEN 'Robert C. Martin enseña a escribir codigo limpio, legible y mantenible con principios practicos aplicables en cualquier lenguaje de programacion profesional.'
        WHEN 'El programador pragmatico'  THEN 'Andrew Hunt y David Thomas presentan consejos practicos y filosofia de desarrollo de software para programadores que quieren mejorar su carrera y su codigo.'
        WHEN 'Python para todos'          THEN 'Introduccion practica a la programacion con Python de Charles Severance, orientada a principiantes y ampliamente usada en cursos universitarios de informatica.'
        WHEN 'Machine Learning en Python' THEN 'Sebastian Raschka guia al lector a traves de los algoritmos fundamentales de aprendizaje automatico implementados en Python con ejemplos del mundo real.'
        WHEN 'Docker y Kubernetes'        THEN 'Guia practica para contenerizar aplicaciones con Docker y orquestarlas con Kubernetes, cubriendo despliegue, escalado y alta disponibilidad en produccion.'
        WHEN 'Cracking the Coding Interview' THEN 'Gayle Laakmann McDowell prepara a los candidatos para las entrevistas tecnicas de Google, Facebook y Amazon con 189 problemas de programacion y soluciones detalladas.'
        WHEN 'Design Patterns'            THEN 'El clasico Gang of Four presenta 23 patrones de diseno orientado a objetos que resuelven problemas recurrentes en el desarrollo de software de manera elegante.'
        -- INGENIERIA
        WHEN 'Calculo diferencial e integral' THEN 'Texto clasico de Piskunov que cubre el calculo diferencial e integral con numerosos ejercicios resueltos, ampliamente usado en ingenieria en el mundo hispanohablante.'
        WHEN 'Resistencia de materiales'  THEN 'Ferdinand Beer presenta el analisis mecanico de estructuras y materiales bajo tension, compresion y torsion, texto fundamental para la ingenieria civil y mecanica.'
        WHEN 'Mecanica de fluidos'        THEN 'Frank White aborda el comportamiento de fluidos en reposo y en movimiento con aplicaciones en ingenieria aeronautica, civil, mecanica y quimica.'
        WHEN 'Termodinamica'              THEN 'Cengel y Boles presentan los principios de la termodinamica con aplicaciones en motores, turbinas y sistemas de refrigeracion en ingenieria mecanica.'
        WHEN 'Ingenieria de software'     THEN 'Ian Sommerville cubre los procesos, metodologias, diseno y aseguramiento de calidad en el desarrollo profesional de software a gran escala.'
        WHEN 'Electronica digital'        THEN 'Floyd Thomas explica los fundamentos de la logica digital, circuitos combinacionales y secuenciales, y sistemas de numeracion esenciales en ingenieria electronica.'
        -- INFANTIL
        WHEN 'Matilda'                    THEN 'La pequena Matilda posee poderes telecinetcos y una mente prodigiosa que usa para enfrentarse a su cruel directora de escuela, la senora Trunchbull, en esta obra de Roald Dahl.'
        WHEN 'El principito'              THEN 'Un aviador encuentra en el desierto a un pequeno principe venido de otro planeta que le narra sus viajes por el universo y le enseña que lo esencial es invisible a los ojos.'
        WHEN 'Alicia en el pais de las maravillas' THEN 'Alicia cae por una madriguera y descubre un mundo absurdo y magico habitado por el Sombrerero Loco, la Reina de Corazones y personajes igualmente excéntricos.'
        WHEN 'Peter Pan'                  THEN 'El nino que nunca crece lleva a Wendy y sus hermanos a Nunca Jamas, donde tendran que enfrentarse al malvado Capitan Garfio junto a los Ninos Perdidos.'
        WHEN 'Las aventuras de Pinocho'   THEN 'El carpintero Gepetto talla una marioneta de madera que cobra vida. Pinocho debera demostrar que es valiente, honrado y generoso para convertirse en un nino de verdad.'
        WHEN 'El libro de la selva'       THEN 'El nino Mowgli es criado por lobos en la jungla india y aprende las leyes de la selva de sus mentores Baloo el oso y Bagheera la pantera, mientras huye del tigre Shere Khan.'
        WHEN 'Bambi'                      THEN 'El cervatillo Bambi crece en el bosque aprendiendo sobre la vida, el amor y la perdida en esta conmovedora historia de Felix Salten que inspirara una generacion de lectores.'
        WHEN 'El patito feo'              THEN 'Un patito diferente a los demas sufre el rechazo de quienes lo rodean hasta descubrir que su diferencia es en realidad su mayor belleza en este cuento de Andersen.'
        -- JUVENIL
        WHEN 'Harry Potter y la piedra filosofal' THEN 'Harry Potter descubre que es un mago y comienza sus estudios en Hogwarts, donde debera enfrentarse al mago Voldemort, quien mato a sus padres cuando era un bebe.'
        WHEN 'Los juegos del hambre'      THEN 'En Panem, una nacion distopica, la joven Katniss Everdeen se ofrece voluntaria para reemplazar a su hermana en los Juegos del Hambre, un concurso mortal televisado.'
        WHEN 'Divergente'                 THEN 'En una Chicago futura dividida en facciones por virtudes, Tris Prior descubre que no encaja en ninguna: es Divergente, y eso la convierte en un peligro para el regimen.'
        WHEN 'El corredor del laberinto'  THEN 'Thomas despierta en el Claro sin recuerdos de su pasado, rodeado de jovenes que llevan anos intentando escapar de un laberinto mortal vigilado por criaturas mecanicas.'
        WHEN 'Bajo la misma estrella'     THEN 'Hazel y Gus se conocen en un grupo de apoyo para pacientes de cancer y se enamoran en una historia sobre la vida, el amor y lo que significa dejar huella en el mundo.'
        WHEN 'Harry Potter y la camara secreta' THEN 'En su segundo ano en Hogwarts, Harry descubre que la Camara de los Secretos ha sido abierta y que una criatura misteriosa esta petrificando a los estudiantes del colegio.'
        WHEN 'Ciudad de huesos'           THEN 'Clary Fray descubre que no es humana sino una Cazadora de Sombras al ser arrastrada al mundo oculto de los Nefilim, los vampiros, los hombres lobo y los demonios.'
        WHEN 'Nuestras estrellas'         THEN 'Hazel y Augustus, dos adolescentes con cancer, se enamoran en un grupo de apoyo y emprenden un viaje a Amsterdam para conocer al autor de su libro favorito.'
        -- AVENTURA
        WHEN 'La isla del tesoro'         THEN 'El joven Jim Hawkins embarca en el Hispaniola junto al perverso Long John Silver para buscar el tesoro del capitan Flint en esta aventura pirata clasica de Stevenson.'
        WHEN 'Moby Dick'                  THEN 'El capitan Ahab guia a su tripulacion en una obsesiva persecucion de la ballena blanca que le arranco la pierna en una de las novelas mas profundas de la literatura americana.'
        WHEN 'La llamada de lo salvaje'   THEN 'Buck, un perro domesticado del sur de California, es robado y vendido como perro de trineo en el Yukón durante la fiebre del oro, redescubriendo su naturaleza salvaje.'
        WHEN 'La vuelta al mundo en 80 dias' THEN 'El excéntrico ingles Phileas Fogg apuesta que puede dar la vuelta al mundo en exactamente ochenta dias junto a su fiel criado Passepartout en esta aventura de Jules Verne.'
        WHEN 'Viaje al centro de la Tierra' THEN 'El profesor Lidenbrock y su sobrino Axel descienden por un volcan islandés en busca del centro de la Tierra, encontrando dinosaurios, mares subterraneos y maravillas.'
        WHEN 'Los tres mosqueteros'       THEN 'D Artagnan llega a Paris y se une a Athos, Porthos y Aramis para defender al rey Luis XIII y a la reina Ana de los intrigas del cardenal Richelieu y Milady de Winter.'
        WHEN 'El conde de Montecristo'    THEN 'Edmond Dantes, injustamente encarcelado en el Castillo de If, escapa y regresa como el misterioso Conde de Montecristo para ejecutar su perfecta venganza sobre sus enemigos.'
        -- HISTORIA
        WHEN 'Sapiens'                    THEN 'Yuval Noah Harari traza la historia de la humanidad desde los primeros homínidos en las sabanas africanas hasta los imperantes tecnologicos del siglo XXI.'
        WHEN 'Guns Germs and Steel'       THEN 'Jared Diamond explica por que algunos pueblos dominaron a otros usando la geografia, la biologia y los inventos tecnologicos como factores determinantes de la historia.'
        WHEN 'La Segunda Guerra Mundial'  THEN 'Antony Beevor narra la mayor catastrofe belica de la historia desde todos sus frentes, con un rigor historiografico y una narracion que parece novela.'
        WHEN 'Historia de America Latina' THEN 'Tulio Halperin Donghi ofrece el analisis mas completo y sistematico de la evolucion politica, economica y social de America Latina desde la Independencia.'
        WHEN 'El Imperio Romano'          THEN 'Colin Wells traza el ascenso y la caida del Imperio Romano desde sus origenes republicanos hasta la fragmentacion final, analizando su legado para la civilizacion occidental.'
        WHEN 'La Revolucion Francesa'     THEN 'William Doyle reconstruye los origenes, el desarrollo y las consecuencias de la Revolucion Francesa, el acontecimiento que redefinio el mundo politico moderno.'
        WHEN 'Conquistas de Mexico'       THEN 'Fernando Cervantes narra la conquista de Mexico revisando las motivaciones de los conquistadores espanoles y la resistencia de las civilizaciones indigenas desde nuevas perspectivas.'
        -- EDUCACION
        WHEN 'Inteligencia emocional'     THEN 'Daniel Goleman argumenta que la inteligencia emocional, la capacidad de reconocer y gestionar emociones propias y ajenas, puede importar mas que el cociente intelectual.'
        WHEN 'Como ganar amigos'          THEN 'Dale Carnegie presenta los principios que han ayudado a millones de personas a mejorar sus relaciones personales y profesionales desde su publicacion en 1936.'
        WHEN 'Aprender a aprender'        THEN 'Barbara Oakley revela las tecnicas neurocientificas mas efectivas para aprender cualquier materia, desde matematicas hasta musica, de manera mas rapida y profunda.'
        WHEN 'Pensar rapido pensar despacio' THEN 'Daniel Kahneman, Premio Nobel de Economia, distingue entre el pensamiento rapido e intuitivo y el lento y deliberado, revelando como tomamos decisiones irracionalmente.'
        WHEN 'Los 7 habitos'              THEN 'Stephen Covey presenta siete habitos fundamentales de las personas altamente efectivas, una guia atemporal para el liderazgo personal y la productividad con proposito.'
        WHEN 'El poder del ahora'         THEN 'Eckhart Tolle guia al lector hacia la iluminacion espiritual a traves de la presencia consciente en el momento presente, desvinculandose de la mente y el ego.'
        WHEN 'Los cuatro acuerdos'        THEN 'Miguel Ruiz revela cuatro principios de la sabiduria tolteca que, al convertirse en habitos, transforman radicalmente la experiencia de vida hacia la libertad y la felicidad.'
        -- ARTE
        WHEN 'Historia del arte'          THEN 'Ernst Gombrich escribio el libro de divulgacion artistica mas leido del mundo, que lleva al lector desde las pinturas rupestres hasta el arte contemporaneo con claridad incomparable.'
        WHEN 'El arte de la guerra'       THEN 'El tratado militar chino de Sun Tzu, escrito hace 2500 anos, ofrece estrategias aplicables al liderazgo, los negocios y la vida cotidiana con una vigencia sorprendente.'
        WHEN 'Klimt'                      THEN 'Estudio monografico sobre la vida y la obra del pintor simbolista austriaco Gustav Klimt, creador de iconos como El Beso, con profusa ilustracion de sus obras mas importantes.'
        WHEN 'Leonardo Da Vinci'          THEN 'Walter Isaacson traza la vida y la mente prodigiosa de Leonardo Da Vinci basandose en sus cuadernos de notas, revelando la union unica entre arte, ciencia y curiosidad insaciable.'
        WHEN 'Picasso'                    THEN 'Pierre Daix ofrece un recorrido por la vida y la obra del genio del cubismo, desde su infancia en Malaga hasta su prolifica produccion artistica a lo largo del siglo XX.'
        WHEN 'El arte de Velazquez'       THEN 'Jonathan Brown analiza la obra del pintor mas importante del Siglo de Oro espanol, Diego Velazquez, situandola en el contexto historico y cultural de la corte de Felipe IV.'
        -- COMEDIA
        WHEN 'Bridget Jones el diario'    THEN 'Las aventuras y desventuras de Bridget Jones, una soltera britanica de treinta anos que registra en su diario sus intentos de mejorar su vida amorosa, su peso y su carrera.'
        WHEN 'El libro de los abrazos'    THEN 'Eduardo Galeano recoge en breves textos poéticos sus reflexiones sobre la vida, la memoria, el amor y la dignidad humana con la maestria narrativa que lo caracteriza.'
        WHEN 'Seinlanguage'               THEN 'Jerry Seinfeld recopila los monologos mas celebres de su carrera sobre las peculiaridades de la vida cotidiana con el humor incisivo y observacional que lo hizo famoso.'
        WHEN 'Catch-22'                   THEN 'El soldado Yossarian intenta que lo declaren loco para escapar de la guerra, atrapado en la paradoja del Articulo 22: quien quiere evitar el combate demuestra que esta cuerdo.'
        WHEN 'El mundo segun Garp'        THEN 'T.S. Garp, hijo de una famosa feminista, navega una vida llena de humor negro, tragedia y personajes extravagantes en esta novela que desafia la clasificacion de genero.'
        WHEN 'Don Quijote de la Mancha'   THEN 'El ingenioso hidalgo Alonso Quijano, enloquecido por las novelas de caballeria, sale al mundo como Don Quijote de la Mancha acompanado de su fiel escudero Sancho Panza.'
        -- BIOGRAFIA
        WHEN 'El diario de Ana Frank'     THEN 'El diario personal de Ana Frank, una adolescente judia que se escondio durante dos anos con su familia en Amsterdam para huir del holocausto nazi, es un testimonio inmortal.'
        WHEN 'Steve Jobs'                 THEN 'La biografia exclusiva del cofundador de Apple, basada en mas de cuarenta entrevistas con Jobs y cien con familiares, amigos y rivales, escrita por Walter Isaacson.'
        WHEN 'Gandhi Autobiografia'       THEN 'Mahatma Gandhi narra su vida y la evolucion de su pensamiento sobre la no violencia y la resistencia pacifica en esta autobiografia que el mismo llamó Mis experimentos con la verdad.'
        WHEN 'Nelson Mandela'             THEN 'El lider sudafricano Nelson Mandela relata en primera persona su lucha contra el apartheid, sus 27 anos de prision en Robben Island y su camino hacia la presidencia de Sudafrica.'
        WHEN 'Marie Curie'                THEN 'La vida extraordinaria de Marie Curie, la primera mujer en ganar el Nobel y la unica en ganarlo dos veces, narrando su trabajo pionero sobre la radiactividad en una epoca hostil a las mujeres.'
        WHEN 'Frida Kahlo la pintora'     THEN 'Analisis de la vida y las obras de Frida Kahlo, la pintora mexicana cuya arte autobiografico e intensamente personal la convirtio en un icono cultural del siglo XX.'
        -- FIC. CIENTIFICA
        WHEN 'Dune'                       THEN 'En el planeta desertico Arrakis, unica fuente de la especia mas valiosa del universo, Paul Atreides lidera una revolucion que cambiara el destino de toda la humanidad.'
        WHEN 'Fundacion'                  THEN 'El matematico Hari Seldon predice el colapso del Imperio Galactico y funda la Fundacion para preservar el conocimiento y acortar la oscuridad que seguira.'
        WHEN 'Neuromante'                 THEN 'Case, un hacker desechado, es contratado para un robo en el ciberespacio en esta novela fundacional del ciberpunk que invento la palabra matrix y vislumbro internet.'
        WHEN '2001 Una odisea del espacio' THEN 'Una mision tripulada a Jupiter controlada por la computadora HAL 9000 desencadena un viaje hacia los confines del universo y la evolucion de la conciencia humana.'
        WHEN 'Yo robot'                   THEN 'Isaac Asimov explora las Tres Leyes de la Robotica en nueve cuentos interconectados que plantean preguntas filosoficas sobre la inteligencia artificial y la etica.'
        WHEN 'El marciano'                THEN 'El astronauta Mark Watney queda abandonado en Marte y debe sobrevivir solo usando su ingenio como botanico hasta que la NASA organice una mision de rescate.'
        WHEN 'Hyperion'                   THEN 'Siete peregrinos viajan al planeta Hyperion donde cada uno narra su historia, en una estructura inspirada en los Cuentos de Canterbury que mezcla generos y desafios filosoficos.'
        WHEN 'Un mundo feliz'             THEN 'En un futuro donde la humanidad ha eliminado la guerra, el sufrimiento y la familia, Bernard Marx cuestiona si este mundo perfecto es realmente humano o simplemente una jaula dorada.'
        ELSE 'Obra esencial de la literatura universal que ha marcado generaciones de lectores con su narrativa cautivadora y su profundo impacto cultural.'
      END;
      SET v_stock = 5 + (v_slot % 20);

      INSERT INTO libros
        (id_tienda, id_categoria, titulo, autor_libro, isbn,
         descripcion_libro, precio_libro, stock, estado_libro,
         fecha_publicacion, fecha_listado)
      VALUES
        (v_tienda, v_cat, v_titulo, v_autor, v_isbn,
         v_desc, v_precio, v_stock, 'Visible',
         v_fecha, CURDATE());

      SET v_slot = v_slot + 1;
    END WHILE;

    SET v_ultima_tienda = v_tienda;
    SET v_tienda = NULL;
    SELECT MIN(id_tienda) INTO v_tienda FROM tiendas WHERE id_tienda > v_ultima_tienda;
  END WHILE;

END$$

DELIMITER ;

CALL sp_completar_libros();
DROP PROCEDURE IF EXISTS sp_completar_libros;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
SELECT '✅ 032 - Libros completados a minimo 35 por tienda' AS resultado;

SELECT
  MIN(cnt) AS minimo,
  MAX(cnt) AS maximo,
  AVG(cnt) AS promedio,
  SUM(cnt) AS total_libros
FROM (
  SELECT id_tienda, COUNT(*) AS cnt FROM libros GROUP BY id_tienda
) t;

SELECT COUNT(*) AS tiendas_por_debajo_35 FROM (
  SELECT id_tienda, COUNT(*) AS cnt FROM libros GROUP BY id_tienda HAVING cnt < 35
) x;
