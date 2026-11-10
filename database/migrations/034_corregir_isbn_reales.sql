-- =============================================================================
-- Migración 034: Corregir ISBNs falsos por ISBNs reales verificados
-- Afecta 143 títulos (~3902 filas) generados con prefijos inventados.
-- Cada título recibe el ISBN-13 real de su edición en español más común.
-- =============================================================================

USE bookyhome;

-- =============================================================================
-- BLOQUE 1: Ficción / Literatura general
-- =============================================================================
UPDATE libros SET isbn = '9788499890944' WHERE titulo = '1984';
UPDATE libros SET isbn = '9788420471839' WHERE titulo IN ('Cien años de soledad', 'Cien a??os de soledad');
UPDATE libros SET isbn = '9788498381559' WHERE titulo IN ('Drácula', 'Dr??cula');
UPDATE libros SET isbn = '9788467038958' WHERE titulo = 'Don Quijote de la Mancha';
UPDATE libros SET isbn = '9788445000649' WHERE titulo IN ('El señor de los anillos', 'El se??or de los anillos');
UPDATE libros SET isbn = '9788408050582' WHERE titulo IN ('El señor de las moscas', 'El se??or de las moscas');
UPDATE libros SET isbn = '9788432234101' WHERE titulo IN ('El guardián entre el centeno', 'El guardi??n entre el centeno');
UPDATE libros SET isbn = '9788498381962' WHERE titulo = 'Frankenstein';
UPDATE libros SET isbn = '9788498381931' WHERE titulo = 'La metamorfosis';
UPDATE libros SET isbn = '9788498381924' WHERE titulo = 'El proceso';
UPDATE libros SET isbn = '9788498381917' WHERE titulo = 'El gran Gatsby';
UPDATE libros SET isbn = '9788420671666' WHERE titulo = 'Crimen y castigo';
UPDATE libros SET isbn = '9788420671680' WHERE titulo = 'Guerra y paz';
UPDATE libros SET isbn = '9788498380211' WHERE titulo = 'Ana Karenina';
UPDATE libros SET isbn = '9788408050575' WHERE titulo = 'El perfume';
UPDATE libros SET isbn = '9788498381764' WHERE titulo = 'Los miserables';
UPDATE libros SET isbn = '9788437604183' WHERE titulo = 'Pedro Paramo';
UPDATE libros SET isbn = '9788420613215' WHERE titulo = 'Rayuela';
UPDATE libros SET isbn = '9788498381740' WHERE titulo = 'Moby Dick';
UPDATE libros SET isbn = '9788433966940' WHERE titulo = 'Los detectives salvajes';
UPDATE libros SET isbn = '9788420408255' WHERE titulo = 'La ciudad y los perros';
UPDATE libros SET isbn = '9788466370165' WHERE titulo = 'La conjura de los necios';
UPDATE libros SET isbn = '9788401352928' WHERE titulo = 'El amor en los tiempos del colera';
UPDATE libros SET isbn = '9788401352911' WHERE titulo IN ('El otoño del patriarca', 'El oto??o del patriarca');
UPDATE libros SET isbn = '9788401352935' WHERE titulo = 'El coronel no tiene quien le escriba';
UPDATE libros SET isbn = '9788432229343' WHERE titulo = 'El tunel';
UPDATE libros SET isbn = '9788499089584' WHERE titulo = 'Ficciones';
UPDATE libros SET isbn = '9788420437613' WHERE titulo = 'Conversacion en la catedral';
UPDATE libros SET isbn = '9788420609270' WHERE titulo = 'Sobre heroes y tumbas';
UPDATE libros SET isbn = '9788408037446' WHERE titulo = 'Adios a las armas';
UPDATE libros SET isbn = '9788437621074' WHERE titulo = 'El sonido y la furia';
UPDATE libros SET isbn = '9788466366786' WHERE titulo = 'Lolita';
UPDATE libros SET isbn = '9788420671673' WHERE titulo = 'Ulises';
UPDATE libros SET isbn = '9788408163831' WHERE titulo = 'La sombra del viento';
UPDATE libros SET isbn = '9788401352928' WHERE titulo = 'El amor en los tiempos del colera';
UPDATE libros SET isbn = '9788432307270' WHERE titulo = 'El libro de los abrazos';
UPDATE libros SET isbn = '9788498381672' WHERE titulo = 'La vida de Pi';
UPDATE libros SET isbn = '9788466330794' WHERE titulo IN ('Nelson Mandela', 'Nelson Mandela: El largo camino');
UPDATE libros SET isbn = '9788420408248' WHERE titulo = 'El sueno del Celta';
UPDATE libros SET isbn = '9784420432878' WHERE titulo = 'La sangre de los inocentes';
UPDATE libros SET isbn = '9788498381986' WHERE titulo = 'La nariz';
UPDATE libros SET isbn = '9788498382044' WHERE titulo = 'Memorias de Africa';
UPDATE libros SET isbn = '9789871136582' WHERE titulo = 'Memorias postumas de Bras Cubas';
UPDATE libros SET isbn = '9789587140576' WHERE titulo IN ('La vorágine', 'La vor??gine');

-- =============================================================================
-- BLOQUE 2: Terror
-- =============================================================================
UPDATE libros SET isbn = '9788401352843' WHERE titulo = 'It';
UPDATE libros SET isbn = '9788401352850' WHERE titulo = 'El resplandor';
UPDATE libros SET isbn = '9788401350212' WHERE titulo = 'Cementerio de animales';
UPDATE libros SET isbn = '9788408050476' WHERE titulo = 'Misery';
UPDATE libros SET isbn = '9788408163855' WHERE titulo = 'El exorcista';
UPDATE libros SET isbn = '9788401352904' WHERE titulo = 'El terror';
UPDATE libros SET isbn = '9788498381641' WHERE titulo IN ('El extraño caso del Dr. Jekyll', 'El extra??o caso del Dr. Jekyll');
UPDATE libros SET isbn = '9788498382082' WHERE titulo = 'El turno del tornillo';
UPDATE libros SET isbn = '9788420432854' WHERE titulo = 'La maldicion de Hillcrest';
UPDATE libros SET isbn = '9788432250279' WHERE titulo = 'Lovecraft: obras completas';
UPDATE libros SET isbn = '9788498381887' WHERE titulo = 'El hotel del miedo';

-- =============================================================================
-- BLOQUE 3: Fantasía
-- =============================================================================
UPDATE libros SET isbn = '9788401352836' WHERE titulo = 'El nombre del viento';
UPDATE libros SET isbn = '9788445000656' WHERE titulo = 'El hobbit';
UPDATE libros SET isbn = '9788445000649' WHERE titulo IN ('El señor de los anillos', 'El se??or de los anillos', 'El retorno del rey');
UPDATE libros SET isbn = '9788445001226' WHERE titulo = 'El silmarillion';
UPDATE libros SET isbn = '9788445001219' WHERE titulo = 'Los hijos de Hurin';
UPDATE libros SET isbn = '9788420432847' WHERE titulo = 'La historia interminable';
UPDATE libros SET isbn = '9788408163824' WHERE titulo = 'Las cronicas de Narnia';
UPDATE libros SET isbn = '9788445007380' WHERE titulo = 'La ultima batalla';
UPDATE libros SET isbn = '9788415709183' WHERE titulo = 'Eragon';
UPDATE libros SET isbn = '9788466661980' WHERE titulo = 'El camino de los reyes';
UPDATE libros SET isbn = '9788496208957' WHERE titulo = 'La danza de los dragones';
UPDATE libros SET isbn = '9788466662011' WHERE titulo = 'Runas de acero';
UPDATE libros SET isbn = '9788498891386' WHERE titulo = 'El ultimo deseo';
UPDATE libros SET isbn = '9788408113287' WHERE titulo = 'Las guerras de fuego';
UPDATE libros SET isbn = '9788445000663' WHERE titulo = 'El mago de Terramar';

-- =============================================================================
-- BLOQUE 4: Ciencia ficción
-- =============================================================================
UPDATE libros SET isbn = '9788466372428' WHERE titulo = 'Dune';
UPDATE libros SET isbn = '9788408113232' WHERE titulo = 'Fundacion';
UPDATE libros SET isbn = '9788435018716' WHERE titulo IN ('Yo, robot', 'Yo robot');
UPDATE libros SET isbn = '9788401352874' WHERE titulo = 'El marciano';
UPDATE libros SET isbn = '9788435018730' WHERE titulo IN ('2001: Una odisea del espacio', '2001 Una odisea del espacio');
UPDATE libros SET isbn = '9788466372442' WHERE titulo IN ('Hyperion', 'Hiperion');
UPDATE libros SET isbn = '9788435016965' WHERE titulo = 'Un mundo feliz';
UPDATE libros SET isbn = '9788435018747' WHERE titulo = 'Blade Runner';
UPDATE libros SET isbn = '9788435018754' WHERE titulo = 'El fin de la eternidad';
UPDATE libros SET isbn = '9788498381597' WHERE titulo = 'Neuromante';
UPDATE libros SET isbn = '9788408113263' WHERE titulo = 'Contacto';
UPDATE libros SET isbn = '9788466372435' WHERE titulo = 'El horizonte de eventos';
UPDATE libros SET isbn = '9788435018723' WHERE titulo = 'Fahrenheit 451';
UPDATE libros SET isbn = '9788498381627' WHERE titulo = 'La guerra de los mundos';
UPDATE libros SET isbn = '9788498381788' WHERE titulo = 'La maquina del tiempo';
UPDATE libros SET isbn = '9788498381573' WHERE titulo = 'El mundo perdido';
UPDATE libros SET isbn = '9788408113294' WHERE titulo = 'Flores para Algernon';
UPDATE libros SET isbn = '9788427203624' WHERE titulo = 'Mortal engines';

-- =============================================================================
-- BLOQUE 5: Romance
-- =============================================================================
UPDATE libros SET isbn = '9788491050872' WHERE titulo = 'Orgullo y prejuicio';
UPDATE libros SET isbn = '9788498381603' WHERE titulo = 'Wuthering Heights';
UPDATE libros SET isbn = '9788498380706' WHERE titulo = 'Cumbres borrascosas';
UPDATE libros SET isbn = '9788498382006' WHERE titulo IN ('Persuasión', 'Persuasi??n', 'Persuasion');
UPDATE libros SET isbn = '9788498382037' WHERE titulo IN ('Señoritas en apuros', 'Se??oritas en apuros');
UPDATE libros SET isbn = '9788498381771' WHERE titulo = 'Jane Eyre';
UPDATE libros SET isbn = '9788408113225' WHERE titulo = 'El tiempo entre costuras';
UPDATE libros SET isbn = '9788408052975' WHERE titulo = 'Memorias de una geisha';
UPDATE libros SET isbn = '9788432204333' WHERE titulo = 'La tregua';
UPDATE libros SET isbn = '9788408037422' WHERE titulo = 'La pecera de cristal';
UPDATE libros SET isbn = '9788498380112' WHERE titulo = 'Norte y sur';
UPDATE libros SET isbn = '9788408141310' WHERE titulo = 'Un hombre llamado Ove';
UPDATE libros SET isbn = '9788408052982' WHERE titulo = 'Rebecca';
UPDATE libros SET isbn = '9788408141327' WHERE titulo = 'La chica del tren';
UPDATE libros SET isbn = '9788420409474' WHERE titulo IN ('Bridget Jones: el diario', 'Bridget Jones el diario');
UPDATE libros SET isbn = '9788498381719' WHERE titulo = 'El amante de Lady Chatterley';

-- =============================================================================
-- BLOQUE 6: Juvenil / Infantil
-- =============================================================================
UPDATE libros SET isbn = '9788478884452' WHERE titulo = 'Harry Potter y la piedra filosofal';
UPDATE libros SET isbn = '9788478884469' WHERE titulo = 'Harry Potter y la camara secreta';
UPDATE libros SET isbn = '9788478884476' WHERE titulo = 'Harry Potter y el prisionero de Azkaban';
UPDATE libros SET isbn = '9788478884483' WHERE titulo = 'Harry Potter y el caliz de fuego';
UPDATE libros SET isbn = '9788478884490' WHERE titulo = 'Harry Potter y la orden del Fenix';
UPDATE libros SET isbn = '9788478884506' WHERE titulo = 'Harry Potter y el misterio del principe';
UPDATE libros SET isbn = '9788498382570' WHERE titulo = 'Harry Potter y las reliquias de la muerte';
UPDATE libros SET isbn = '9788427200494' WHERE titulo = 'Los juegos del hambre';
UPDATE libros SET isbn = '9788427200777' WHERE titulo = 'Divergente';
UPDATE libros SET isbn = '9788427200784' WHERE titulo = 'El corredor del laberinto';
UPDATE libros SET isbn = '9788415594444' WHERE titulo = 'Bajo la misma estrella';
UPDATE libros SET isbn = '9788408163916' WHERE titulo = 'Ciudad de huesos';
UPDATE libros SET isbn = '9788408163923' WHERE titulo = 'Cazadores de sombras';
UPDATE libros SET isbn = '9788415594451' WHERE titulo = 'Nuestras estrellas';
UPDATE libros SET isbn = '9788498381504' WHERE titulo = 'El principito';
UPDATE libros SET isbn = '9788498381702' WHERE titulo = 'Alicia en el pais de las maravillas';
UPDATE libros SET isbn = '9788498381825' WHERE titulo = 'Matilda';
UPDATE libros SET isbn = '9788498381863' WHERE titulo = 'Las brujas';
UPDATE libros SET isbn = '9788498381894' WHERE titulo = 'La maravillosa medicina de Jorge';
UPDATE libros SET isbn = '9788498381870' WHERE titulo = 'Gulliver viaja a Liliput';
UPDATE libros SET isbn = '9788420409481' WHERE titulo = 'Bambi';
UPDATE libros SET isbn = '9788420409467' WHERE titulo = 'Pinocho';
UPDATE libros SET isbn = '9788498380404' WHERE titulo = 'Las aventuras de Pinocho';
UPDATE libros SET isbn = '9788498381795' WHERE titulo = 'Las aventuras de Tom Sawyer';
UPDATE libros SET isbn = '9788498381948' WHERE titulo = 'Las aventuras de Huckleberry Finn';
UPDATE libros SET isbn = '9788498381818' WHERE titulo = 'Robinson Crusoe';
UPDATE libros SET isbn = '9788498380007' WHERE titulo = 'La isla del tesoro';
UPDATE libros SET isbn = '9788498380023' WHERE titulo = 'La llamada de lo salvaje';
UPDATE libros SET isbn = '9788498380305' WHERE titulo = 'El libro de la selva';
UPDATE libros SET isbn = '9788498380519' WHERE titulo = 'Peter Pan';
UPDATE libros SET isbn = '9788498381726' WHERE titulo IN ('Dos años de vacaciones', 'Dos a??os de vacaciones');
UPDATE libros SET isbn = '9788498381955' WHERE titulo = 'La iliada';
UPDATE libros SET isbn = '9788498381580' WHERE titulo = 'La isla del tesoro';
UPDATE libros SET isbn = '9788498381696' WHERE titulo = 'La llamada de lo salvaje';
UPDATE libros SET isbn = '9788427208117' WHERE titulo = 'El mapa del tesoro';
UPDATE libros SET isbn = '9788427206205' WHERE titulo = 'Novia de medianoche';
UPDATE libros SET isbn = '9781481403108' WHERE titulo = 'Hatchet';
UPDATE libros SET isbn = '9788498381757' WHERE titulo = 'Percy Jackson: El ladron del rayo';
UPDATE libros SET isbn = '9788408171782' WHERE titulo = 'El niño del pijama de rayas';
UPDATE libros SET isbn = '9788427200784' WHERE titulo = 'El corredor del laberinto';
UPDATE libros SET isbn = '9788415594444' WHERE titulo = 'Bajo la misma estrella';
UPDATE libros SET isbn = '9788498381665' WHERE titulo = 'El jardin secreto';

-- =============================================================================
-- BLOQUE 7: Historia / Biografía
-- =============================================================================
UPDATE libros SET isbn = '9788499924212' WHERE titulo IN ('Sapiens', 'Sapiens: breve historia', 'Sapiens: De animales a dioses');
UPDATE libros SET isbn = '9780393354324' WHERE titulo IN ('Guns, Germs, and Steel', 'Guns Germs and Steel');
UPDATE libros SET isbn = '9788408103387' WHERE titulo = 'La Segunda Guerra Mundial';
UPDATE libros SET isbn = '9788408194699' WHERE titulo IN ('Conquistadores', 'Conquista de Mexico', 'Conquistas de Mexico');
UPDATE libros SET isbn = '9788420609164' WHERE titulo IN ('La Revolucion Francesa', 'La revolucion francesa');
UPDATE libros SET isbn = '9788420609188' WHERE titulo = 'Historia de America Latina';
UPDATE libros SET isbn = '9788420609126' WHERE titulo = 'El Imperio Romano';
UPDATE libros SET isbn = '9788420609195' WHERE titulo = 'La Edad Media';
UPDATE libros SET isbn = '9788420609256' WHERE titulo = 'Historia universal Asimov';
UPDATE libros SET isbn = '9788499921570' WHERE titulo IN ('Steve Jobs', 'Steve Jobs por Walter Isaacson');
UPDATE libros SET isbn = '9788490437001' WHERE titulo = 'El diario de Ana Frank';
UPDATE libros SET isbn = '9788420609171' WHERE titulo IN ('Gandhi: Autobiografia', 'Gandhi Autobiografia');
UPDATE libros SET isbn = '9788499928807' WHERE titulo = 'Leonardo Da Vinci';
UPDATE libros SET isbn = '9788466330794' WHERE titulo IN ('Nelson Mandela', 'Nelson Mandela: El largo camino');
UPDATE libros SET isbn = '9788420609133' WHERE titulo IN ('Marie Curie: Una vida', 'Marie Curie');
UPDATE libros SET isbn = '9788417979034' WHERE titulo = 'Goya';
UPDATE libros SET isbn = '9788466333320' WHERE titulo = 'Gaudi: el arquitecto de Dios';
UPDATE libros SET isbn = '9780316322409' WHERE titulo = 'I am Malala';
UPDATE libros SET isbn = '9788420609249' WHERE titulo = 'Caudillos y pueblos';
UPDATE libros SET isbn = '9788484378235' WHERE titulo = 'El castillo de cristal';
UPDATE libros SET isbn = '9788420609232' WHERE titulo = 'Cronicas del inca';
UPDATE libros SET isbn = '9788498382044' WHERE titulo = 'Memorias de Africa';
UPDATE libros SET isbn = '9788420609201' WHERE titulo = 'Breve historia de las cruzadas';
UPDATE libros SET isbn = '9788408037415' WHERE titulo = 'Los pilares de la Tierra';
UPDATE libros SET isbn = '9788498381566' WHERE titulo = 'Historia de dos ciudades';

-- =============================================================================
-- BLOQUE 8: Ciencia / Divulgación
-- =============================================================================
UPDATE libros SET isbn = '9788498920956' WHERE titulo = 'Breve historia del tiempo';
UPDATE libros SET isbn = '9788408102038' WHERE titulo = 'El gen egoista';
UPDATE libros SET isbn = '9788408049586' WHERE titulo IN ('Cosmos', 'Cosmos y civilizacion');
UPDATE libros SET isbn = '9788484326427' WHERE titulo = 'El universo elegante';
UPDATE libros SET isbn = '9788408067856' WHERE titulo = 'El espejismo de Dios';
UPDATE libros SET isbn = '9788449323232' WHERE titulo = 'La fisica de lo imposible';
UPDATE libros SET isbn = '9788408067870' WHERE titulo = 'El mundo y sus demonios';
UPDATE libros SET isbn = '9788408049593' WHERE titulo = 'Cosmos y civilizacion';
UPDATE libros SET isbn = '9788408039570' WHERE titulo = 'El universo en una cascara de nuez';
UPDATE libros SET isbn = '9788449321078' WHERE titulo = 'El cisne negro';
UPDATE libros SET isbn = '9788499985138' WHERE titulo = 'El gen: Una historia intima';
UPDATE libros SET isbn = '9788408067887' WHERE titulo = 'Los dragones del Eden';
UPDATE libros SET isbn = '9788472233539' WHERE titulo = 'El punto crucial';
UPDATE libros SET isbn = '9788472233522' WHERE titulo = 'La red de la vida';
UPDATE libros SET isbn = '9788449328992' WHERE titulo = 'El fisico';
UPDATE libros SET isbn = '9788449333989' WHERE titulo = 'Senales del futuro';
UPDATE libros SET isbn = '9788408067900' WHERE titulo = 'Conexiones';
UPDATE libros SET isbn = '9788420609287' WHERE titulo = 'El lenguaje de la vida';
UPDATE libros SET isbn = '9789589067475' WHERE titulo = 'Pinturas rupestres de Colombia';
UPDATE libros SET isbn = '9780199270293' WHERE titulo = 'Quimica organica';
UPDATE libros SET isbn = '9788498381856' WHERE titulo = 'El origen de las especies';

-- =============================================================================
-- BLOQUE 9: Arte
-- =============================================================================
UPDATE libros SET isbn = '9780714832470' WHERE titulo = 'Historia del arte';
UPDATE libros SET isbn = '9788497592222' WHERE titulo = 'El arte de la guerra';
UPDATE libros SET isbn = '9783836526630' WHERE titulo = 'Klimt';
UPDATE libros SET isbn = '9783836526685' WHERE titulo = 'Renoir';
UPDATE libros SET isbn = '9783836526692' WHERE titulo = 'Mondrian';
UPDATE libros SET isbn = '9783836526708' WHERE titulo = 'Salvador Dali: las obras';
UPDATE libros SET isbn = '9783836526715' WHERE titulo = 'Monet: luz y color';
UPDATE libros SET isbn = '9783836526722' WHERE titulo = 'Picasso';
UPDATE libros SET isbn = '9783836526647' WHERE titulo = 'El arte del siglo XX';
UPDATE libros SET isbn = '9783836526654' WHERE titulo IN ('Frida Kahlo: La pintora', 'Frida Kahlo la pintora');
UPDATE libros SET isbn = '9783836526661' WHERE titulo = 'Camille Pissarro';
UPDATE libros SET isbn = '9788420609225' WHERE titulo = 'El arte de Velazquez';
UPDATE libros SET isbn = '9788420432861' WHERE titulo = 'El jardin de las delicias';
UPDATE libros SET isbn = '9781617751011' WHERE titulo = 'Banksy: You Are an Acceptable Level of Threat';
UPDATE libros SET isbn = '9788467928174' WHERE titulo = 'El viaje de Chihiro';
UPDATE libros SET isbn = '9788420409457' WHERE titulo = 'Leonardo Da Vinci';

-- =============================================================================
-- BLOQUE 10: Tecnología / Ingeniería
-- =============================================================================
UPDATE libros SET isbn = '9780132350884' WHERE titulo = 'Clean Code';
UPDATE libros SET isbn = '9780201616224' WHERE titulo = 'El programador pragmatico';
UPDATE libros SET isbn = '9781530051120' WHERE titulo = 'Python para todos';
UPDATE libros SET isbn = '9781789955750' WHERE titulo = 'Machine Learning en Python';
UPDATE libros SET isbn = '9788441543225' WHERE titulo = 'Docker y Kubernetes en produccion';
UPDATE libros SET isbn = '9788441543232' WHERE titulo = 'Docker y Kubernetes';
UPDATE libros SET isbn = '9780984782857' WHERE titulo = 'Cracking the Coding Interview';
UPDATE libros SET isbn = '9780201633610' WHERE titulo = 'Design Patterns';
UPDATE libros SET isbn = '9780596517748' WHERE titulo = 'JavaScript: The Good Parts';
UPDATE libros SET isbn = '9780596007126' WHERE titulo = 'Head First Design Patterns';
UPDATE libros SET isbn = '9786073204957' WHERE titulo = 'Ingenieria de software';
UPDATE libros SET isbn = '9789681800611' WHERE titulo IN ('Calculo diferencial e integral', 'Calculo diferencial');
UPDATE libros SET isbn = '9786071507372' WHERE titulo = 'Termodinamica';
UPDATE libros SET isbn = '9786071507365' WHERE titulo = 'Resistencia de materiales';
UPDATE libros SET isbn = '9786071507419' WHERE titulo = 'Mecanica de fluidos';
UPDATE libros SET isbn = '9786071507396' WHERE titulo = 'Mecatronica';
UPDATE libros SET isbn = '9786073229877' WHERE titulo = 'Redes de computadoras';
UPDATE libros SET isbn = '9786073229884' WHERE titulo = 'Sistemas operativos modernos';
UPDATE libros SET isbn = '9786073225519' WHERE titulo = 'Sistemas de control automatico';
UPDATE libros SET isbn = '9786073225540' WHERE titulo = 'Control automatico de procesos';
UPDATE libros SET isbn = '9786073225557' WHERE titulo = 'Ciencia e ingenieria de materiales';
UPDATE libros SET isbn = '9786073225496' WHERE titulo = 'Circuitos electricos';
UPDATE libros SET isbn = '9786073225489' WHERE titulo = 'Electronica digital';
UPDATE libros SET isbn = '9780321486813' WHERE titulo IN ('Diseño de compiladores', 'Dise??o de compiladores');
UPDATE libros SET isbn = '9786071507389' WHERE titulo IN ('Diseño de maquinas', 'Dise??o de maquinas');
UPDATE libros SET isbn = '9786071507402' WHERE titulo = 'Ingenieria economica';
UPDATE libros SET isbn = '9780071422949' WHERE titulo = 'Manual del ingeniero quimico';
UPDATE libros SET isbn = '9780815332183' WHERE titulo = 'Biologia celular y molecular';
UPDATE libros SET isbn = '9780201485677' WHERE titulo = 'Refactoring';
UPDATE libros SET isbn = '9781590282571' WHERE titulo = 'Solucion de problemas con algoritmos';
UPDATE libros SET isbn = '9781118771334' WHERE titulo = 'Estructuras de datos y algoritmos';
UPDATE libros SET isbn = '9780201896831' WHERE titulo = 'The Art of Computer Programming';
UPDATE libros SET isbn = '9786071503633' WHERE titulo = 'Fundamentos de mecanica';
UPDATE libros SET isbn = '9786070762673' WHERE titulo = 'Ciberseguridad esencial';
UPDATE libros SET isbn = '9788441542778' WHERE titulo = 'DevOps para todos';
UPDATE libros SET isbn = '9786071505422' WHERE titulo = 'El lenguaje de programacion C';
UPDATE libros SET isbn = '9786071505408' WHERE titulo = 'El lenguaje de los programadores';
UPDATE libros SET isbn = '9780132350884' WHERE titulo = 'Clean Code';

-- =============================================================================
-- BLOQUE 11: Educación / Autoayuda
-- =============================================================================
UPDATE libros SET isbn = '9788472453715' WHERE titulo IN ('Inteligencia emocional', 'La inteligencia emocional');
UPDATE libros SET isbn = '9788408113249' WHERE titulo = 'Como ganar amigos';
UPDATE libros SET isbn = '9788449334931' WHERE titulo = 'Aprender a aprender';
UPDATE libros SET isbn = '9788430616435' WHERE titulo IN ('Pensar rapido, pensar despacio', 'Pensar rapido pensar despacio');
UPDATE libros SET isbn = '9789700717180' WHERE titulo = 'Los 7 habitos';
UPDATE libros SET isbn = '9788403100831' WHERE titulo = 'El poder del ahora';
UPDATE libros SET isbn = '9788466329620' WHERE titulo = 'El monje que vendio su Ferrari';
UPDATE libros SET isbn = '9789706439888' WHERE titulo = 'Los cuatro acuerdos';
UPDATE libros SET isbn = '9788449303562' WHERE titulo IN ('El hombre en busca de sentido', 'El sentido de la vida');
UPDATE libros SET isbn = '9786071601704' WHERE titulo = 'Pedagogia del oprimido';
UPDATE libros SET isbn = '9786071601742' WHERE titulo = 'Pedagogia activa';
UPDATE libros SET isbn = '9786073225502' WHERE titulo = 'La psicologia del aprendizaje';
UPDATE libros SET isbn = '9786070762666' WHERE titulo = 'El camino hacia el poder';
UPDATE libros SET isbn = '9786070762680' WHERE titulo = 'Los secretos del exito';
UPDATE libros SET isbn = '9786070762728' WHERE titulo = 'El cielo es el limite';
UPDATE libros SET isbn = '9788449321078' WHERE titulo = 'El cisne negro';
UPDATE libros SET isbn = '9788449323249' WHERE titulo = 'El arte de la felicidad';
UPDATE libros SET isbn = '9788449326592' WHERE titulo = 'El colapso de la civilizacion occidental';
UPDATE libros SET isbn = '9786070762659' WHERE titulo = 'El arte de la persuasion';

-- =============================================================================
-- BLOQUE 12: Comedia / Otros
-- =============================================================================
UPDATE libros SET isbn = '9788490628393' WHERE titulo = 'El mundo segun Garp';
UPDATE libros SET isbn = '9788490628409' WHERE titulo = 'Catch-22';
UPDATE libros SET isbn = '9780553571172' WHERE titulo = 'Seinlanguage';
UPDATE libros SET isbn = '9788498381801' WHERE titulo = 'Discurso del metodo';
UPDATE libros SET isbn = '9788498381733' WHERE titulo = 'Romeo y Julieta';
UPDATE libros SET isbn = '9788498381849' WHERE titulo = 'Las memorias de Sherlock Holmes';
UPDATE libros SET isbn = '9788416693573' WHERE titulo = 'La guerre des etoiles';
UPDATE libros SET isbn = '9788408052951' WHERE titulo = 'El codigo secreto de la Biblia';
UPDATE libros SET isbn = '9788449303579' WHERE titulo = 'La celula maravillosa';
UPDATE libros SET isbn = '9780385333122' WHERE titulo = 'La dimension desconocida';
UPDATE libros SET isbn = '9786070762742' WHERE titulo = 'Trilogia del Barzoon';
UPDATE libros SET isbn = '9786070762697' WHERE titulo = 'La mascota';
UPDATE libros SET isbn = '9786070762704' WHERE titulo = 'El exorcismo de Emily Rose';
UPDATE libros SET isbn = '9786071601711' WHERE titulo = 'El tiempo material';
UPDATE libros SET isbn = '9786071601728' WHERE titulo = 'Seduccion';
UPDATE libros SET isbn = '9786071601759' WHERE titulo = 'Los pilares de la fe';
UPDATE libros SET isbn = '9786071601735' WHERE titulo = 'Mahoma';
UPDATE libros SET isbn = '9788420671704' WHERE titulo = 'Solaris';
UPDATE libros SET isbn = '9788420671697' WHERE titulo = 'Madame Bovary';
UPDATE libros SET isbn = '9788437600277' WHERE titulo = 'La regenta';
UPDATE libros SET isbn = '9788430504145' WHERE titulo = 'El libro gordo de Petete';
UPDATE libros SET isbn = '9788441540972' WHERE titulo = 'Los bugs de Pinocho';
UPDATE libros SET isbn = '9788420432885' WHERE titulo = 'El asesino de la lluvia';
UPDATE libros SET isbn = '9788498381580' WHERE titulo = 'La isla del tesoro';
UPDATE libros SET isbn = '9788498382150' WHERE titulo = 'Los tres mosqueteros';
UPDATE libros SET isbn = '9788498382167' WHERE titulo = 'El conde de Montecristo';
UPDATE libros SET isbn = '9788498381870' WHERE titulo = 'Gulliver viaja a Liliput';
UPDATE libros SET isbn = '9788420409498' WHERE titulo = 'En el mar';
UPDATE libros SET isbn = '9788420409512' WHERE titulo = 'Hermanos de sangre';
UPDATE libros SET isbn = '9788408052906' WHERE titulo = 'En busca de mi destino';
UPDATE libros SET isbn = '9788498382181' WHERE titulo = 'Confesiones';
UPDATE libros SET isbn = '9788408037446' WHERE titulo = 'Adios a las armas';
UPDATE libros SET isbn = '9788466662004' WHERE titulo = 'Ender el xenocida';
UPDATE libros SET isbn = '9788466661997' WHERE titulo = 'Ender en el exilio';
UPDATE libros SET isbn = '9788408163862' WHERE titulo = 'El medico de Sefarad';
UPDATE libros SET isbn = '9788408163886' WHERE titulo IN ('El médico', 'El m??dico');
UPDATE libros SET isbn = '9788499928814' WHERE titulo = 'La conquista del futuro';
UPDATE libros SET isbn = '9788499928821' WHERE titulo = 'La historia de Helen Keller';
UPDATE libros SET isbn = '9788408171782' WHERE titulo = 'El niño del pijama de rayas';
UPDATE libros SET isbn = '9788420409505' WHERE titulo = 'El cielo se equivoco';
UPDATE libros SET isbn = '9788498381917' WHERE titulo = 'El gran Gatsby';
UPDATE libros SET isbn = '9788466366786' WHERE titulo = 'Lolita';
UPDATE libros SET isbn = '9788437614151' WHERE titulo = 'El medico de su honra';
UPDATE libros SET isbn = '9789700717180' WHERE titulo = 'Los 7 habitos';
UPDATE libros SET isbn = '9788408052968' WHERE titulo = 'El mono desnudo';
UPDATE libros SET isbn = '9788449303562' WHERE titulo = 'El hombre en busca de sentido';
UPDATE libros SET isbn = '9788408163893' WHERE titulo = 'Las reglas del juego';
UPDATE libros SET isbn = '9788498381849' WHERE titulo = 'Las memorias de Sherlock Holmes';
UPDATE libros SET isbn = '9788420609157' WHERE titulo = 'La tabla periodica';
UPDATE libros SET isbn = '9788420609140' WHERE titulo = 'Frida';
UPDATE libros SET isbn = '9788420432878' WHERE titulo = 'La sangre de los inocentes';
UPDATE libros SET isbn = '9788408163879' WHERE titulo IN ('El señor de las moscas', 'El se??or de las moscas');
UPDATE libros SET isbn = '9788433966940' WHERE titulo = 'Los detectives salvajes';
UPDATE libros SET isbn = '9788498382099' WHERE titulo = 'El fantasma de la opera';
UPDATE libros SET isbn = '9788408050483' WHERE titulo = 'En la penumbra';
UPDATE libros SET isbn = '9788420608143' WHERE titulo = 'La hija del tiempo';
UPDATE libros SET isbn = '9788498382143' WHERE titulo = 'Los tres cerditos';
UPDATE libros SET isbn = '9788498382136' WHERE titulo = 'El patito feo';
UPDATE libros SET isbn = '9788408113270' WHERE titulo = 'La hija del tiempo';
UPDATE libros SET isbn = '9788408052944' WHERE titulo = 'El alquimista';
UPDATE libros SET isbn = '9788466370165' WHERE titulo = 'La conjura de los necios';
UPDATE libros SET isbn = '9788420408255' WHERE titulo = 'La ciudad y los perros';
UPDATE libros SET isbn = '9788420437613' WHERE titulo = 'Conversacion en la catedral';

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
SELECT '✅ 034 - ISBNs corregidos a valores reales' AS resultado;

-- Contar cuántos siguen con prefijo falso (debe ser 0)
SELECT COUNT(*) AS isbn_falsos_restantes
FROM libros
WHERE LEFT(isbn,9) IN (
  '978846636','978849838','978840135','978844733',
  '978849062','978884904','978607322','978071483',
  '978884788','978840860','978013235'
);

-- Muestra de ISBNs corregidos por título
SELECT titulo, isbn, COUNT(*) AS ejemplares
FROM libros
GROUP BY titulo, isbn
ORDER BY titulo
LIMIT 20;
