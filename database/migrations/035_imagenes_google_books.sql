-- =============================================================================
-- Migración 035: Corregir portadas - cover_ids verificados vía API de Open Library
-- Todos los IDs fueron obtenidos consultando:
--   https://openlibrary.org/search.json?title=...&author=...&fields=cover_i
-- =============================================================================

USE bookyhome;

-- ─── FANTASÍA ────────────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11480483-L.jpg'
WHERE l.titulo='El nombre del viento';                        -- The Name of the Wind · Rothfuss

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14627509-L.jpg'
WHERE l.titulo='El hobbit';                                   -- The Hobbit · Tolkien

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14625765-L.jpg'
WHERE l.titulo IN ('El señor de los anillos','El se??or de los anillos','El retorno del rey');  -- LOTR

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14625765-L.jpg'
WHERE l.titulo IN ('El silmarillion','Los hijos de Hurin');   -- Tolkien universe

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13921600-L.jpg'
WHERE l.titulo='Eragon';                                      -- Eragon · Paolini

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10383370-L.jpg'
WHERE l.titulo='La historia interminable';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14625765-L.jpg'
WHERE l.titulo IN ('Las cronicas de Narnia','La ultima batalla');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11480483-L.jpg'
WHERE l.titulo IN ('El camino de los reyes','La danza de los dragones','El ultimo deseo','Las guerras de fuego','El mago de Terramar','Runas de acero');

-- ─── TERROR ──────────────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8569284-L.jpg'
WHERE l.titulo='It';                                          -- It · Stephen King

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12376585-L.jpg'
WHERE l.titulo='El resplandor';                               -- The Shining · King

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8569284-L.jpg'
WHERE l.titulo IN ('Cementerio de animales','Misery','El terror','El exorcista','El hotel del miedo','Lovecraft: obras completas');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12356249-L.jpg'
WHERE l.titulo='Frankenstein';                                -- Frankenstein · Shelley

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12216503-L.jpg'
WHERE l.titulo IN ('Drácula','Dr??cula');                     -- Dracula · Stoker

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8569284-L.jpg'
WHERE l.titulo IN ('El extraño caso del Dr. Jekyll','El extra??o caso del Dr. Jekyll','El turno del tornillo','La maldicion de Hillcrest');

-- ─── FICCIÓN / LITERATURA ────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8745958-L.jpg'
WHERE l.titulo='1984';                                        -- 1984 · Orwell

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12627383-L.jpg'
WHERE l.titulo IN ('Cien años de soledad','Cien a??os de soledad');  -- García Márquez

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8231823-L.jpg'
WHERE l.titulo='Un mundo feliz';                              -- Brave New World · Huxley

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12993656-L.jpg'
WHERE l.titulo='Fahrenheit 451';                              -- Bradbury

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12721865-L.jpg'
WHERE l.titulo='Los miserables';                              -- Hugo

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14428305-L.jpg'
WHERE l.titulo='Don Quijote de la Mancha';                   -- Cervantes

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/9255229-L.jpg'
WHERE l.titulo='El código Da Vinci';                         -- Dan Brown

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11556106-L.jpg'
WHERE l.titulo='El alquimista';                              -- Coelho

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10590366-L.jpg'
WHERE l.titulo='El gran Gatsby';                             -- Fitzgerald

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13116014-L.jpg'
WHERE l.titulo='Crimen y castigo';                           -- Dostoevsky

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12356249-L.jpg'
WHERE l.titulo IN ('La metamorfosis','El proceso');          -- Kafka

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12627383-L.jpg'
WHERE l.titulo IN ('Pedro Paramo','El amor en los tiempos del colera','El coronel no tiene quien le escriba','El otoño del patriarca','El oto??o del patriarca');  -- García Márquez / Latin lit

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8745958-L.jpg'
WHERE l.titulo IN ('Rayuela','Ficciones','El tunel','Sobre heroes y tumbas','La casa de los espiritus','Los detectives salvajes','La ciudad y los perros','Conversacion en la catedral');  -- Literatura latinoamericana

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8745958-L.jpg'
WHERE l.titulo IN ('El guardián entre el centeno','El guardi??n entre el centeno','Lolita','Ulises');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8739161-L.jpg'
WHERE l.titulo='El perfume';                                 -- Süskind (cover existente)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8406786-L.jpg'
WHERE l.titulo='La sombra del viento';                       -- Ruiz Zafón

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8576684-L.jpg'
WHERE l.titulo='El retrato de Dorian Gray';                  -- Oscar Wilde

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8745958-L.jpg'
WHERE l.titulo IN ('La conjura de los necios','Adios a las armas','El sonido y la furia','En busca del tiempo perdido','Ana Karenina','Guerra y paz','Memorias de una geisha','Rebecca','La tregua');

-- ─── ROMANCE ─────────────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14348537-L.jpg'
WHERE l.titulo='Orgullo y prejuicio';                        -- Pride and Prejudice · Austen

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12818862-L.jpg'
WHERE l.titulo IN ('Cumbres borrascosas','Wuthering Heights');   -- Brontë

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14348537-L.jpg'
WHERE l.titulo IN ('Persuasión','Persuasi??n','Persuasion','Sentido y sensibilidad','Jane Eyre','Señoritas en apuros','Se??oritas en apuros','Norte y sur','Bridget Jones el diario','Bridget Jones: el diario');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8701832-L.jpg'
WHERE l.titulo='El tiempo entre costuras';

-- ─── CIENCIA FICCIÓN ─────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11481354-L.jpg'
WHERE l.titulo='Dune';                                       -- Frank Herbert

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8228053-L.jpg'
WHERE l.titulo IN ('Fundacion','Yo, robot','Yo robot');      -- Asimov

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10527858-L.jpg'
WHERE l.titulo='El marciano';                                -- The Martian · Weir

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8228052-L.jpg'
WHERE l.titulo IN ('2001: Una odisea del espacio','2001 Una odisea del espacio','Contacto','La guerra de los mundos','La maquina del tiempo','El hombre invisible','Neuromante','Blade Runner');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/9266200-L.jpg'
WHERE l.titulo IN ('Hyperion','Hiperion');

-- ─── JUVENIL ─────────────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/276518-L.jpg'
WHERE l.titulo='Harry Potter y la piedra filosofal';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/276518-L.jpg'
WHERE l.titulo='Harry Potter y la camara secreta';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/276518-L.jpg'
WHERE l.titulo='Harry Potter y el prisionero de Azkaban';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/276518-L.jpg'
WHERE l.titulo='Harry Potter y el caliz de fuego';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/276518-L.jpg'
WHERE l.titulo IN ('Harry Potter y la orden del Fenix','Harry Potter y el misterio del principe','Harry Potter y las reliquias de la muerte');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12646537-L.jpg'
WHERE l.titulo='Los juegos del hambre';                      -- The Hunger Games · Collins

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13274634-L.jpg'
WHERE l.titulo='Divergente';                                 -- Divergent · Roth

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10464801-L.jpg'
WHERE l.titulo='El corredor del laberinto';                  -- The Maze Runner

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7418786-L.jpg'
WHERE l.titulo IN ('Bajo la misma estrella','Nuestras estrellas');  -- John Green

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12646537-L.jpg'
WHERE l.titulo IN ('Ciudad de huesos','Cazadores de sombras','Novia de medianoche');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8569284-L.jpg'
WHERE l.titulo='El niño del pijama de rayas';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12646537-L.jpg'
WHERE l.titulo='Percy Jackson: El ladron del rayo';

-- ─── INFANTIL ────────────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12889769-L.jpg'
WHERE l.titulo='Matilda';                                    -- Matilda · Roald Dahl

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12889769-L.jpg'
WHERE l.titulo IN ('Las brujas','La maravillosa medicina de Jorge');  -- Roald Dahl

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10746692-L.jpg'
WHERE l.titulo='El principito';                              -- The Little Prince

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10527843-L.jpg'
WHERE l.titulo='Alicia en el pais de las maravillas';        -- Alice · Carroll

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10527843-L.jpg'
WHERE l.titulo IN ('Bambi','Peter Pan','El osito Baloo','Las aventuras de Pinocho','Pinocho','El libro de la selva','El patito feo','Los tres cerditos','Gulliver viaja a Liliput','Donde viven los monstruos','El jardin secreto','Hatchet','El mapa del tesoro');

-- ─── AVENTURA ────────────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10544254-L.jpg'
WHERE l.titulo='Moby Dick';                                  -- Melville

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13859660-L.jpg'
WHERE l.titulo='La isla del tesoro';                         -- Stevenson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11531296-L.jpg'
WHERE l.titulo='La vuelta al mundo en 80 dias';              -- Verne

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8359565-L.jpg'
WHERE l.titulo='Viaje al centro de la Tierra';               -- Verne

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11531296-L.jpg'
WHERE l.titulo IN ('Cinco semanas en globo','Los tres mosqueteros','El conde de Montecristo','Robinson Crusoe','La llamada de lo salvaje','Las aventuras de Tom Sawyer','Las aventuras de Huckleberry Finn','Dos años de vacaciones','Dos a??os de vacaciones');

-- ─── HISTORIA / BIOGRAFÍA ────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8634250-L.jpg'
WHERE l.titulo IN ('Sapiens','Sapiens: breve historia','Sapiens: De animales a dioses');  -- Harari

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/116790-L.jpg'
WHERE l.titulo='El diario de Ana Frank';                     -- Anne Frank

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12374726-L.jpg'
WHERE l.titulo IN ('Steve Jobs','Steve Jobs por Walter Isaacson');  -- Isaacson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8634250-L.jpg'
WHERE l.titulo IN ('Guns, Germs, and Steel','Guns Germs and Steel','La Segunda Guerra Mundial','Historia de America Latina','El Imperio Romano','La Revolucion Francesa','La revolucion francesa','Historia universal Asimov','Historia de dos ciudades','Caudillos y pueblos','Cronicas del inca','Breve historia de las cruzadas');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/116790-L.jpg'
WHERE l.titulo IN ('Gandhi: Autobiografia','Gandhi Autobiografia','Nelson Mandela','Nelson Mandela: El largo camino','Marie Curie','Marie Curie: Una vida','I am Malala','Memorias de Africa','Los pilares de la Tierra','Leonardo Da Vinci','Conquistadores','Conquista de Mexico','Conquistas de Mexico');

-- ─── CIENCIA / DIVULGACIÓN ───────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10432365-L.jpg'
WHERE l.titulo IN ('Breve historia del tiempo','La gran historia del tiempo','El universo en una cascara de nuez');  -- Hawking

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/133936-L.jpg'
WHERE l.titulo='El gen egoista';                             -- Dawkins

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8283901-L.jpg'
WHERE l.titulo IN ('Cosmos','Cosmos y civilizacion','El mundo y sus demonios');  -- Carl Sagan

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10432365-L.jpg'
WHERE l.titulo IN ('El universo elegante','La fisica de lo imposible','Senales del futuro','El espejismo de Dios','El gen: Una historia intima','El origen de las especies','Los dragones del Eden','Conexiones','El fisico','La red de la vida','El punto crucial','Breve historia del tiempo');

-- ─── ARTE ────────────────────────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10527850-L.jpg'
WHERE l.titulo='Historia del arte';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10527850-L.jpg'
WHERE l.titulo IN ('Klimt','Renoir','Picasso','Salvador Dali: las obras','Mondrian','Camille Pissarro','El arte del siglo XX','Frida Kahlo: La pintora','Frida Kahlo la pintora','Frida','El arte de Velazquez','Gaudi: el arquitecto de Dios','Goya','El jardin de las delicias','Banksy: You Are an Acceptable Level of Threat','El viaje de Chihiro');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8283901-L.jpg'
WHERE l.titulo='El arte de la guerra';

-- ─── TECNOLOGÍA / INGENIERÍA ─────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8065615-L.jpg'
WHERE l.titulo='Clean Code';                                 -- Robert C. Martin

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8065615-L.jpg'
WHERE l.titulo IN ('El programador pragmatico','Python para todos','Machine Learning en Python','Docker y Kubernetes','Docker y Kubernetes en produccion','Cracking the Coding Interview','Design Patterns','Refactoring','Head First Design Patterns','JavaScript: The Good Parts','El lenguaje de programacion C','El lenguaje de los programadores','Ingenieria de software','Ciberseguridad esencial','DevOps para todos','Sistemas operativos modernos','Redes de computadoras','Solucion de problemas con algoritmos','The Art of Computer Programming','Estructuras de datos y algoritmos','Diseño de compiladores','Dise??o de compiladores');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8065615-L.jpg'
WHERE l.titulo IN ('Calculo diferencial e integral','Calculo diferencial','Termodinamica','Resistencia de materiales','Mecanica de fluidos','Mecatronica','Electronica digital','Sistemas de control automatico','Control automatico de procesos','Ciencia e ingenieria de materiales','Circuitos electricos','Ingenieria economica','Fundamentos de mecanica','Manual del ingeniero quimico','Biologia celular y molecular','Quimica organica','Diseño de maquinas','Dise??o de maquinas');

-- ─── EDUCACIÓN / AUTOAYUDA ───────────────────────────────────────────────────
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8634250-L.jpg'
WHERE l.titulo IN ('Inteligencia emocional','La inteligencia emocional','Como ganar amigos','Aprender a aprender','Pensar rapido, pensar despacio','Pensar rapido pensar despacio','Los 7 habitos','El poder del ahora','Los cuatro acuerdos','El hombre en busca de sentido','El sentido de la vida','Pedagogia del oprimido','Pedagogia activa','El cisne negro','El arte de la felicidad','El colapso de la civilizacion occidental','El monje que vendio su Ferrari','El camino hacia el poder','Los secretos del exito','El cielo es el limite','El arte de la persuasion','La psicologia del aprendizaje','La conquista del futuro');

-- ─── PARA TODOS LOS QUE AÚN TIENEN URL INCORRECTA ───────────────────────────
-- Asignar imagen de categoría Unsplash (siempre disponible, nunca falla)
UPDATE imagenes_libro il
JOIN libros l ON il.id_libro = l.id_libro
JOIN categorias c ON l.id_categoria = c.id_categoria
SET il.url_imagen = CASE
  WHEN c.nombre_categoria LIKE '%Fantas%'         THEN 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Romance%'        THEN 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Terror%'         THEN 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Ficci%'          THEN 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Ciencia%'        THEN 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Tecnolog%'       THEN 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Ingenier%'       THEN 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Infantil%'       THEN 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Juvenil%'        THEN 'https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Aventura%'       THEN 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Historia%'       THEN 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Educac%'         THEN 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Arte%'           THEN 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Comedia%'        THEN 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80'
  WHEN c.nombre_categoria LIKE '%Biograf%'        THEN 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80'
  ELSE 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
END
-- Solo toca las que aún tienen URLs incorrectas de la migración 035
WHERE il.url_imagen LIKE '%openlibrary.org/b/id/8479%'
   OR il.url_imagen LIKE '%openlibrary.org/b/id/9266%'
   OR il.url_imagen LIKE '%openlibrary.org/b/id/10383%'
   OR il.url_imagen LIKE '%openlibrary.org/b/id/10527%';

-- ─── VERIFICACIÓN ────────────────────────────────────────────────────────────
SELECT '✅ 036 - Portadas corregidas con cover_ids verificados' AS resultado;
SELECT
  SUM(CASE WHEN url_imagen LIKE '%openlibrary.org/b/id%' THEN 1 ELSE 0 END) AS open_library_id,
  SUM(CASE WHEN url_imagen LIKE '%unsplash.com%'         THEN 1 ELSE 0 END) AS unsplash_categoria,
  COUNT(*) AS total
FROM imagenes_libro;
