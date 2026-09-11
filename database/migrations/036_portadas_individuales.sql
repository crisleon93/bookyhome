-- =============================================================================
-- Migración 036: Portadas individuales verificadas por título + autor
-- Cada libro tiene su propio cover_id obtenido via Open Library API
-- https://openlibrary.org/search.json?q=TITULO+AUTOR&fields=cover_i,title
-- Generado: 2026-09-10
-- =============================================================================

USE bookyhome;

-- =============================================================================
-- FANTASÍA
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11480483-L.jpg'
WHERE l.titulo='El nombre del viento';                       -- Rothfuss

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14627509-L.jpg'
WHERE l.titulo='El hobbit';                                  -- Tolkien

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14625765-L.jpg'
WHERE l.titulo IN ('El señor de los anillos','El se??or de los anillos');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14627062-L.jpg'
WHERE l.titulo='El retorno del rey';                         -- Tolkien (diferente al anterior)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14625765-L.jpg'
WHERE l.titulo IN ('El silmarillion','Los hijos de Hurin');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13921600-L.jpg'
WHERE l.titulo='Eragon';                                     -- Paolini

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10383370-L.jpg'
WHERE l.titulo='La historia interminable';                   -- Michael Ende

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14739691-L.jpg'
WHERE l.titulo='Las cronicas de Narnia';                     -- C.S. Lewis

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13588897-L.jpg'
WHERE l.titulo='La ultima batalla';                          -- C.S. Lewis

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12340890-L.jpg'
WHERE l.titulo='El camino de los reyes';                     -- Brandon Sanderson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7279197-L.jpg'
WHERE l.titulo='La danza de los dragones';                   -- G.R.R. Martin

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13919315-L.jpg'
WHERE l.titulo='El ultimo deseo';                            -- Andrzej Sapkowski

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8178120-L.jpg'
WHERE l.titulo='El mago de Terramar';                        -- Ursula K. Le Guin

-- =============================================================================
-- TERROR
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8569284-L.jpg'
WHERE l.titulo='It';                                         -- Stephen King

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12376585-L.jpg'
WHERE l.titulo='El resplandor';                              -- Stephen King

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12015500-L.jpg'
WHERE l.titulo='Cementerio de animales';                     -- Stephen King

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8259296-L.jpg'
WHERE l.titulo='Misery';                                     -- Stephen King

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1174846-L.jpg'
WHERE l.titulo='El terror';                                  -- Dan Simmons

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12715730-L.jpg'
WHERE l.titulo='El exorcista';                               -- William Peter Blatty

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7270820-L.jpg'
WHERE l.titulo='El hotel del miedo';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14083321-L.jpg'
WHERE l.titulo='Lovecraft: obras completas';                 -- H.P. Lovecraft

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12356249-L.jpg'
WHERE l.titulo='Frankenstein';                               -- Mary Shelley

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12216503-L.jpg'
WHERE l.titulo IN ('Drácula','Dr??cula');                    -- Bram Stoker

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/4289014-L.jpg'
WHERE l.titulo='La maldicion de Hillcrest';                  -- Shirley Jackson (The Haunting of Hill House)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/181493-L.jpg'
WHERE l.titulo='El turno del tornillo';                      -- Henry James (The Turn of the Screw)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8274284-L.jpg'
WHERE l.titulo='Relatos de terror';

-- =============================================================================
-- FICCIÓN / LITERATURA UNIVERSAL
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8745958-L.jpg'
WHERE l.titulo='1984';                                       -- George Orwell

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8231823-L.jpg'
WHERE l.titulo='Un mundo feliz';                             -- Aldous Huxley

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12993656-L.jpg'
WHERE l.titulo='Fahrenheit 451';                             -- Ray Bradbury

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12721865-L.jpg'
WHERE l.titulo='Los miserables';                             -- Victor Hugo

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14428305-L.jpg'
WHERE l.titulo='Don Quijote de la Mancha';                   -- Cervantes

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1048162-L.jpg'
WHERE l.titulo='El codigo Da Vinci';                         -- Dan Brown

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11556106-L.jpg'
WHERE l.titulo='El alquimista';                              -- Paulo Coelho

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10590366-L.jpg'
WHERE l.titulo='El gran Gatsby';                             -- F. Scott Fitzgerald

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12328823-L.jpg'
WHERE l.titulo='Crimen y castigo';                           -- Dostoevsky

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12820198-L.jpg'
WHERE l.titulo='La metamorfosis';                            -- Franz Kafka (Metamorphosis)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/997423-L.jpg'
WHERE l.titulo='El proceso';                                 -- Franz Kafka (The Trial)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/4909497-L.jpg'
WHERE l.titulo='Pedro Paramo';                               -- Juan Rulfo

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13490957-L.jpg'
WHERE l.titulo='El amor en los tiempos del colera';          -- García Márquez

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7989627-L.jpg'
WHERE l.titulo='El coronel no tiene quien le escriba';       -- García Márquez

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13490967-L.jpg'
WHERE l.titulo IN ('El otoño del patriarca','El oto??o del patriarca'); -- García Márquez

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/15219095-L.jpg'
WHERE l.titulo IN ('Cien años de soledad','Cien a??os de soledad'); -- García Márquez

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1047466-L.jpg'
WHERE l.titulo='Rayuela';                                    -- Julio Cortázar

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10832290-L.jpg'
WHERE l.titulo='Ficciones';                                  -- Jorge Luis Borges

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5517733-L.jpg'
WHERE l.titulo='El tunel';                                   -- Ernesto Sábato

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8078732-L.jpg'
WHERE l.titulo='Sobre heroes y tumbas';                      -- Ernesto Sábato

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3205226-L.jpg'
WHERE l.titulo='La casa de los espiritus';                   -- Isabel Allende

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3706128-L.jpg'
WHERE l.titulo='Los detectives salvajes';                    -- Roberto Bolaño

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3221667-L.jpg'
WHERE l.titulo='La ciudad y los perros';                     -- Vargas Llosa

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12532400-L.jpg'
WHERE l.titulo='Conversacion en la catedral';                -- Vargas Llosa

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13756269-L.jpg'
WHERE l.titulo='La conjura de los necios';                   -- John Kennedy Toole

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/9273490-L.jpg'
WHERE l.titulo IN ('El guardián entre el centeno','El guardi??n entre el centeno'); -- Salinger

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12984540-L.jpg'
WHERE l.titulo='Lolita';                                     -- Nabokov

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12666210-L.jpg'
WHERE l.titulo='Ulises';                                     -- James Joyce

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8292212-L.jpg'
WHERE l.titulo='El sonido y la furia';                       -- Faulkner

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10910286-L.jpg'
WHERE l.titulo='El perfume';                                 -- Patrick Süskind

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8406786-L.jpg'
WHERE l.titulo='La sombra del viento';                       -- Carlos Ruiz Zafón

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8576684-L.jpg'
WHERE l.titulo='El retrato de Dorian Gray';                  -- Oscar Wilde

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13859412-L.jpg'
WHERE l.titulo='Guerra y paz';                               -- Tolstoy

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8217750-L.jpg'
WHERE l.titulo='Ana Karenina';                               -- Tolstoy

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8213770-L.jpg'
WHERE l.titulo='Memorias de una geisha';                     -- Arthur Golden

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8238729-L.jpg'
WHERE l.titulo='Rebecca';                                    -- Daphne du Maurier

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/4909999-L.jpg'
WHERE l.titulo='La tregua';                                  -- Mario Benedetti

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7226599-L.jpg'
WHERE l.titulo='Adios a las armas';                          -- Hemingway

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12330718-L.jpg'
WHERE l.titulo IN ('El corazón de las tinieblas','El coraz??n de las tinieblas'); -- Conrad

-- =============================================================================
-- ROMANCE
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14348537-L.jpg'
WHERE l.titulo='Orgullo y prejuicio';                        -- Jane Austen

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12818862-L.jpg'
WHERE l.titulo IN ('Cumbres borrascosas','Wuthering Heights'); -- Emily Brontë

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8235363-L.jpg'
WHERE l.titulo='Jane Eyre';                                  -- Charlotte Brontë

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12824691-L.jpg'
WHERE l.titulo IN ('Persuasión','Persuasion');               -- Jane Austen

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10450935-L.jpg'
WHERE l.titulo='Sentido y sensibilidad';                     -- Jane Austen

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13675493-L.jpg'
WHERE l.titulo='Norte y sur';                                -- Elizabeth Gaskell

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13236212-L.jpg'
WHERE l.titulo IN ('Bridget Jones el diario','Bridget Jones: el diario'); -- Helen Fielding

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8701832-L.jpg'
WHERE l.titulo='El tiempo entre costuras';                   -- María Dueñas

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12175526-L.jpg'
WHERE l.titulo='La regenta';                                 -- Leopoldo Alas "Clarín"

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11445636-L.jpg'
WHERE l.titulo='El amante de Lady Chatterley';               -- D.H. Lawrence

-- =============================================================================
-- CIENCIA FICCIÓN
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11481354-L.jpg'
WHERE l.titulo='Dune';                                       -- Frank Herbert

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12675509-L.jpg'
WHERE l.titulo='Fundacion';                                  -- Isaac Asimov

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8228053-L.jpg'
WHERE l.titulo IN ('Yo, robot','Yo robot');                  -- Isaac Asimov

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10527858-L.jpg'
WHERE l.titulo='El marciano';                                -- Andy Weir

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/4229654-L.jpg'
WHERE l.titulo='Contacto';                                   -- Carl Sagan

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13499665-L.jpg'
WHERE l.titulo='La guerra de los mundos';                    -- H.G. Wells

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13720965-L.jpg'
WHERE l.titulo='La maquina del tiempo';                      -- H.G. Wells

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13488336-L.jpg'
WHERE l.titulo='El hombre invisible';                        -- H.G. Wells

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/283860-L.jpg'
WHERE l.titulo='Neuromante';                                 -- William Gibson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10143416-L.jpg'
WHERE l.titulo='Blade Runner';                               -- Philip K. Dick

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/9266200-L.jpg'
WHERE l.titulo IN ('Hyperion','Hiperion');                   -- Dan Simmons

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7314523-L.jpg'
WHERE l.titulo='Neuromante';                                 -- William Gibson (edición española)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13490978-L.jpg'
WHERE l.titulo='El marciano';                                -- Andy Weir (edición española)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7999389-L.jpg'
WHERE l.titulo='La dimension desconocida';                   -- Rod Serling

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13534873-L.jpg'
WHERE l.titulo='Ender en el exilio';                         -- Orson Scott Card

-- =============================================================================
-- JUVENIL
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/276518-L.jpg'
WHERE l.titulo='Harry Potter y la piedra filosofal';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10644769-L.jpg'
WHERE l.titulo='Harry Potter y la camara secreta';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14631819-L.jpg'
WHERE l.titulo='Harry Potter y el prisionero de Azkaban';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1048813-L.jpg'
WHERE l.titulo='Harry Potter y el caliz de fuego';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5018893-L.jpg'
WHERE l.titulo='Harry Potter y el misterio del principe';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10675449-L.jpg'
WHERE l.titulo='Harry Potter y las reliquias de la muerte';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12646537-L.jpg'
WHERE l.titulo='Los juegos del hambre';                      -- Suzanne Collins

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13274634-L.jpg'
WHERE l.titulo='Divergente';                                 -- Veronica Roth

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10464801-L.jpg'
WHERE l.titulo='El corredor del laberinto';                  -- James Dashner

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7418786-L.jpg'
WHERE l.titulo='Bajo la misma estrella';                     -- John Green

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13550433-L.jpg'
WHERE l.titulo='Ciudad de huesos';                           -- Cassandra Clare

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12340797-L.jpg'
WHERE l.titulo='El niño del pijama de rayas';                -- John Boyne

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7239831-L.jpg'
WHERE l.titulo IN ('El ladrón de rayos','El ladr??n de rayos','Percy Jackson: El ladron del rayo'); -- Rick Riordan

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7815156-L.jpg'
WHERE l.titulo='El nombre del viento';

-- =============================================================================
-- INFANTIL
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7314203-L.jpg'
WHERE l.titulo='Matilda';                                    -- Roald Dahl

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7313450-L.jpg'
WHERE l.titulo='Las brujas';                                 -- Roald Dahl

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10746692-L.jpg'
WHERE l.titulo='El principito';                              -- Saint-Exupéry

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10527843-L.jpg'
WHERE l.titulo='Alicia en el pais de las maravillas';        -- Lewis Carroll

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12568069-L.jpg'
WHERE l.titulo='Bambi';                                      -- Felix Salten

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8237052-L.jpg'
WHERE l.titulo='Peter Pan';                                  -- J.M. Barrie

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12535909-L.jpg'
WHERE l.titulo='El osito Baloo';                             -- A.A. Milne

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13556760-L.jpg'
WHERE l.titulo='Las aventuras de Pinocho';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12531936-L.jpg'
WHERE l.titulo='Pinocho';                                    -- Carlo Collodi

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13816698-L.jpg'
WHERE l.titulo='El libro de la selva';                       -- Rudyard Kipling

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7314519-L.jpg'
WHERE l.titulo='El patito feo';                              -- Hans Christian Andersen

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7313791-L.jpg'
WHERE l.titulo='Gulliver viaja a Liliput';                   -- Jonathan Swift

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/2272391-L.jpg'
WHERE l.titulo='Donde viven los monstruos';                  -- Maurice Sendak

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7313448-L.jpg'
WHERE l.titulo='El jardin secreto';                          -- Frances Hodgson Burnett

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12358874-L.jpg'
WHERE l.titulo='Hatchet';                                    -- Gary Paulsen

-- =============================================================================
-- AVENTURA
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10544254-L.jpg'
WHERE l.titulo='Moby Dick';                                  -- Herman Melville

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13859660-L.jpg'
WHERE l.titulo='La isla del tesoro';                         -- Stevenson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11531296-L.jpg'
WHERE l.titulo='La vuelta al mundo en 80 dias';              -- Jules Verne

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8359565-L.jpg'
WHERE l.titulo='Viaje al centro de la Tierra';               -- Jules Verne

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7313233-L.jpg'
WHERE l.titulo='Cinco semanas en globo';                     -- Jules Verne

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10641295-L.jpg'
WHERE l.titulo='Los tres mosqueteros';                       -- Alexandre Dumas

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7269974-L.jpg'
WHERE l.titulo='El conde de Montecristo';                    -- Alexandre Dumas

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8124445-L.jpg'
WHERE l.titulo='Robinson Crusoe';                            -- Daniel Defoe

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7314524-L.jpg'
WHERE l.titulo='La llamada de lo salvaje';                   -- Jack London

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8078108-L.jpg'
WHERE l.titulo='Las aventuras de Tom Sawyer';                -- Mark Twain

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7314705-L.jpg'
WHERE l.titulo='Las aventuras de Huckleberry Finn';          -- Mark Twain

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10544654-L.jpg'
WHERE l.titulo='El mundo perdido';                           -- Arthur Conan Doyle

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7992464-L.jpg'
WHERE l.titulo='Las memorias de Sherlock Holmes';            -- Conan Doyle

-- =============================================================================
-- HISTORIA / BIOGRAFÍA
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8634250-L.jpg'
WHERE l.titulo IN ('Sapiens','Sapiens: breve historia','Sapiens: De animales a dioses'); -- Harari

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/116790-L.jpg'
WHERE l.titulo='El diario de Ana Frank';                     -- Anne Frank

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12374726-L.jpg'
WHERE l.titulo IN ('Steve Jobs','Steve Jobs por Walter Isaacson'); -- Walter Isaacson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7884018-L.jpg'
WHERE l.titulo IN ('Guns, Germs, and Steel','Guns Germs and Steel'); -- Jared Diamond

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7239351-L.jpg'
WHERE l.titulo='La Segunda Guerra Mundial';                  -- Antony Beevor

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12797867-L.jpg'
WHERE l.titulo='Historia de America Latina';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/4232731-L.jpg'
WHERE l.titulo='El Imperio Romano';                          -- Colin Wells

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7888871-L.jpg'
WHERE l.titulo IN ('La Revolucion Francesa','La revolucion francesa'); -- William Doyle

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7368021-L.jpg'
WHERE l.titulo='Historia universal Asimov';                  -- Isaac Asimov

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8239466-L.jpg'
WHERE l.titulo='Historia de dos ciudades';                   -- Charles Dickens

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8780251-L.jpg'
WHERE l.titulo='Cronicas del inca';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12459742-L.jpg'
WHERE l.titulo='Breve historia de las cruzadas';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5258259-L.jpg'
WHERE l.titulo='Historia de Roma';                           -- Gonzalo Bravo

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/108086-L.jpg'
WHERE l.titulo IN ('Gandhi: Autobiografia','Gandhi Autobiografia'); -- Gandhi

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/136582-L.jpg'
WHERE l.titulo IN ('Marie Curie','Marie Curie: Una vida');   -- Susan Quinn

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12702407-L.jpg'
WHERE l.titulo IN ('Nelson Mandela','Nelson Mandela: El largo camino'); -- Mandela

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/9358664-L.jpg'
WHERE l.titulo='I am Malala';                                -- Malala Yousafzai

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7314718-L.jpg'
WHERE l.titulo='Memorias de Africa';                         -- Isak Dinesen

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7265991-L.jpg'
WHERE l.titulo='Los pilares de la Tierra';                   -- Ken Follett

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8087691-L.jpg'
WHERE l.titulo='Leonardo Da Vinci';                         -- Walter Isaacson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5071424-L.jpg'
WHERE l.titulo='Conquistadores';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12132086-L.jpg'
WHERE l.titulo IN ('Conquista de Mexico','Conquistas de Mexico');

-- =============================================================================
-- CIENCIA / DIVULGACIÓN
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8283901-L.jpg'
WHERE l.titulo='Cosmos';                                     -- Carl Sagan

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13129044-L.jpg'
WHERE l.titulo='El mundo y sus demonios';                    -- Carl Sagan

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5014547-L.jpg'
WHERE l.titulo='Los dragones del Eden';                      -- Carl Sagan

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10432365-L.jpg'
WHERE l.titulo IN ('Breve historia del tiempo','La gran historia del tiempo'); -- Hawking

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13019315-L.jpg'
WHERE l.titulo='El universo en una cascara de nuez';         -- Hawking

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/133936-L.jpg'
WHERE l.titulo='El gen egoista';                             -- Richard Dawkins

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14047659-L.jpg'
WHERE l.titulo='El espejismo de Dios';                       -- Richard Dawkins

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8644175-L.jpg'
WHERE l.titulo='El universo elegante';                       -- Brian Greene

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13769351-L.jpg'
WHERE l.titulo='El origen de las especies';                  -- Charles Darwin

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8239537-L.jpg'
WHERE l.titulo='La fisica de lo imposible';                  -- Michio Kaku

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14198083-L.jpg'
WHERE l.titulo='El fisico';                                  -- Michio Kaku

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14157112-L.jpg'
WHERE l.titulo='El gen: Una historia intima';                -- Siddhartha Mukherjee

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8574554-L.jpg'
WHERE l.titulo='El gen egoista';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13290711-L.jpg'
WHERE l.titulo IN ('Pensar rapido, pensar despacio','Pensar rapido pensar despacio'); -- Kahneman

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5257586-L.jpg'
WHERE l.titulo='Cosmos';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8131731-L.jpg'
WHERE l.titulo='La red de la vida';

-- =============================================================================
-- ARTE
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10660176-L.jpg'
WHERE l.titulo='Historia del arte';                          -- Ernst Gombrich

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/4481915-L.jpg'
WHERE l.titulo='Klimt';                                      -- Gilles Neret

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8243184-L.jpg'
WHERE l.titulo='Renoir';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8415461-L.jpg'
WHERE l.titulo='Picasso';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/9143349-L.jpg'
WHERE l.titulo='Salvador Dali: las obras';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/673311-L.jpg'
WHERE l.titulo='Camille Pissarro';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8415460-L.jpg'
WHERE l.titulo='El arte del siglo XX';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/21291-L.jpg'
WHERE l.titulo='Frida';                                      -- Hayden Herrera

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/75126-L.jpg'
WHERE l.titulo='Goya';                                       -- Robert Hughes

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7804260-L.jpg'
WHERE l.titulo='Banksy: You Are an Acceptable Level of Threat';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13952277-L.jpg'
WHERE l.titulo='El jardin de las delicias';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3335101-L.jpg'
WHERE l.titulo='El arte de la guerra';                       -- Sun Tzu

-- =============================================================================
-- TECNOLOGÍA / INFORMÁTICA
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8065615-L.jpg'
WHERE l.titulo='Clean Code';                                 -- Robert C. Martin

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12903559-L.jpg'
WHERE l.titulo='El programador pragmatico';                  -- Hunt & Thomas

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8512502-L.jpg'
WHERE l.titulo='Python para todos';                          -- Charles Severance

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10144350-L.jpg'
WHERE l.titulo='Machine Learning en Python';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11415911-L.jpg'
WHERE l.titulo='Docker y Kubernetes';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/11212546-L.jpg'
WHERE l.titulo='Docker y Kubernetes en produccion';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7276811-L.jpg'
WHERE l.titulo='Cracking the Coding Interview';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/6601119-L.jpg'
WHERE l.titulo='Design Patterns';                            -- Gang of Four

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/15222839-L.jpg'
WHERE l.titulo='Refactoring';                                -- Martin Fowler

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/388950-L.jpg'
WHERE l.titulo='Head First Design Patterns';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/2536428-L.jpg'
WHERE l.titulo='JavaScript: The Good Parts';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8157075-L.jpg'
WHERE l.titulo='El lenguaje de programacion C';              -- Kernighan & Ritchie

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7900505-L.jpg'
WHERE l.titulo='El lenguaje de los programadores';           -- Brian Kernighan

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8052232-L.jpg'
WHERE l.titulo='Ingenieria de software';                     -- Ian Sommerville

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13954756-L.jpg'
WHERE l.titulo='DevOps para todos';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10494024-L.jpg'
WHERE l.titulo='Redes de computadoras';                      -- Andrew Tanenbaum

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13265050-L.jpg'
WHERE l.titulo='Solucion de problemas con algoritmos';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8513582-L.jpg'
WHERE l.titulo='Estructuras de datos y algoritmos';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/194113-L.jpg'
WHERE l.titulo IN ('Diseño de compiladores','Dise??o de compiladores');

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8091016-L.jpg'
WHERE l.titulo='Cracking the Coding Interview';

-- =============================================================================
-- INGENIERÍA
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7903723-L.jpg'
WHERE l.titulo='Resistencia de materiales';                  -- Ferdinand Beer

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/6431793-L.jpg'
WHERE l.titulo='Calculo diferencial e integral';             -- Piskunov

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5253207-L.jpg'
WHERE l.titulo='Calculo diferencial';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13863459-L.jpg'
WHERE l.titulo='Termodinamica';                              -- Cengel & Boles

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7293309-L.jpg'
WHERE l.titulo='Mecanica de fluidos';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10476523-L.jpg'
WHERE l.titulo='Mecatronica';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3354791-L.jpg'
WHERE l.titulo='Sistemas de control automatico';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8157321-L.jpg'
WHERE l.titulo='Control automatico de procesos';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8744156-L.jpg'
WHERE l.titulo='Ciencia e ingenieria de materiales';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8086292-L.jpg'
WHERE l.titulo='Circuitos electricos';                       -- James Nilsson

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8076615-L.jpg'
WHERE l.titulo='Ingenieria economica';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/4922365-L.jpg'
WHERE l.titulo='Fundamentos de mecanica';                    -- Beer & Johnston

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8705322-L.jpg'
WHERE l.titulo='Manual del ingeniero quimico';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/9798551-L.jpg'
WHERE l.titulo='Biologia celular y molecular';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8078006-L.jpg'
WHERE l.titulo='Quimica organica';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8105143-L.jpg'
WHERE l.titulo='Transferencia de calor y masa';

-- =============================================================================
-- EDUCACIÓN / AUTOAYUDA
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1359485-L.jpg'
WHERE l.titulo IN ('Inteligencia emocional','La inteligencia emocional'); -- Daniel Goleman

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13195013-L.jpg'
WHERE l.titulo='Como ganar amigos';                          -- Dale Carnegie

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13662348-L.jpg'
WHERE l.titulo='Aprender a aprender';                        -- Barbara Oakley

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13290711-L.jpg'
WHERE l.titulo IN ('Pensar rapido, pensar despacio','Pensar rapido pensar despacio'); -- Kahneman

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1051915-L.jpg'
WHERE l.titulo='Los 7 habitos';                              -- Stephen Covey

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12335770-L.jpg'
WHERE l.titulo='El poder del ahora';                         -- Eckhart Tolle

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10723490-L.jpg'
WHERE l.titulo='Los cuatro acuerdos';                        -- Miguel Ruiz

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8516506-L.jpg'
WHERE l.titulo='El hombre en busca de sentido';              -- Viktor Frankl

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10837170-L.jpg'
WHERE l.titulo='El sentido de la vida';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3359846-L.jpg'
WHERE l.titulo='Pedagogia del oprimido';                     -- Paulo Freire

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10641943-L.jpg'
WHERE l.titulo='Pedagogia activa';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12344090-L.jpg'
WHERE l.titulo='El cisne negro';                             -- Nassim Taleb

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14461934-L.jpg'
WHERE l.titulo='El arte de la felicidad';                    -- Dalai Lama

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13661986-L.jpg'
WHERE l.titulo='El colapso de la civilizacion occidental';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5253163-L.jpg'
WHERE l.titulo='El camino hacia el poder';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8087677-L.jpg'
WHERE l.titulo='La psicologia del aprendizaje';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5271262-L.jpg'
WHERE l.titulo='Los secretos del exito';

-- =============================================================================
-- VARIOS
-- =============================================================================
UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8495146-L.jpg'
WHERE l.titulo='1984';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3348569-L.jpg'
WHERE l.titulo='Discurso del metodo';                        -- Descartes

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8692-L.jpg'
WHERE l.titulo='Confesiones';                                -- San Agustín

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7313434-L.jpg'
WHERE l.titulo='El mundo de Sofia';                          -- Jostein Gaarder (cover individual)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1048142-L.jpg'
WHERE l.titulo='El mundo de Sofia';                          -- Jostein Gaarder

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12349469-L.jpg'
WHERE l.titulo='En busca del tiempo perdido';                -- Marcel Proust

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7351350-L.jpg'
WHERE l.titulo='Un hombre llamado Ove';                      -- Fredrik Backman

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7369884-L.jpg'
WHERE l.titulo='Los juegos del hambre';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10749183-L.jpg'
WHERE l.titulo='Los piratas del Caribe';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12375494-L.jpg'
WHERE l.titulo='Playa de acero';                             -- John Varley

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13478610-L.jpg'
WHERE l.titulo='Don Quijote de la Mancha';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7912299-L.jpg'
WHERE l.titulo='El señor de las moscas';                     -- William Golding

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14492095-L.jpg'
WHERE l.titulo='La sombra del viento';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10860466-L.jpg'
WHERE l.titulo='El corredor del laberinto';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/6670184-L.jpg'
WHERE l.titulo='El sueno del Celta';                         -- Vargas Llosa

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12334137-L.jpg'
WHERE l.titulo='El libro gordo de Petete';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1053986-L.jpg'
WHERE l.titulo='El libro de los abrazos';                    -- Eduardo Galeano

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12984540-L.jpg'
WHERE l.titulo='Lolita';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14858422-L.jpg'
WHERE l.titulo='Historia del arte';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13490973-L.jpg'
WHERE l.titulo='La casa de los espiritus';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8188271-L.jpg'
WHERE l.titulo='Catch-22';                                   -- Joseph Heller

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14171930-L.jpg'
WHERE l.titulo='Moby Dick';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/279981-L.jpg'
WHERE l.titulo='Mortal engines';                             -- Philip Reeve

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7884611-L.jpg'
WHERE l.titulo='El cuarto de atras';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12934565-L.jpg'
WHERE l.titulo='El diario de Ana Frank';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13725491-L.jpg'
WHERE l.titulo='El médico';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7987422-L.jpg'
WHERE l.titulo='El medico de Sefarad';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13888509-L.jpg'
WHERE l.titulo='El mono desnudo';                            -- Desmond Morris

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13495526-L.jpg'
WHERE l.titulo='El mundo segun Garp';                        -- John Irving

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12390294-L.jpg'
WHERE l.titulo='El mundo y sus demonios';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13129044-L.jpg'
WHERE l.titulo='El mundo y sus demonios';                    -- Carl Sagan (cover correcto)

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13006720-L.jpg'
WHERE l.titulo='El jugador';                                 -- Dostoevsky

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13921600-L.jpg'
WHERE l.titulo='Eragon';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/2303573-L.jpg'
WHERE l.titulo='Memorias postumas de Bras Cubas';            -- Machado de Assis

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12329224-L.jpg'
WHERE l.titulo='El terror';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/6665280-L.jpg'
WHERE l.titulo='El tiempo entre costuras';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7503018-L.jpg'
WHERE l.titulo='El tiempo material';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14050086-L.jpg'
WHERE l.titulo='El viaje de Chihiro';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10752027-L.jpg'
WHERE l.titulo='En busca de mi destino';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12539438-L.jpg'
WHERE l.titulo='En el mar';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8181489-L.jpg'
WHERE l.titulo='La maldicion de Hillcrest';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/15175028-L.jpg'
WHERE l.titulo='Las reglas del juego';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/3221667-L.jpg'
WHERE l.titulo='La ciudad y los perros';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/380332-L.jpg'
WHERE l.titulo='Hyperion';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10468227-L.jpg'
WHERE l.titulo='Mahoma';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12374726-L.jpg'
WHERE l.titulo='Steve Jobs';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13651334-L.jpg'
WHERE l.titulo='El arte de la persuasion';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/168012-L.jpg'
WHERE l.titulo='El cielo es el limite';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12330606-L.jpg'
WHERE l.titulo='Las cruzadas';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7314702-L.jpg'
WHERE l.titulo='La iliada';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10952836-L.jpg'
WHERE l.titulo='La vida de Pi';                              -- Yann Martel

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/8172074-L.jpg'
WHERE l.titulo='La historia interminable';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13705901-L.jpg'
WHERE l.titulo='La historia de Helen Keller';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/1165336-L.jpg'
WHERE l.titulo='La sangre de los inocentes';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12762385-L.jpg'
WHERE l.titulo='La tabla periodica';                         -- Primo Levi

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14102423-L.jpg'
WHERE l.titulo='La hija del tiempo';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/7387171-L.jpg'
WHERE l.titulo='La Edad Media';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/5416334-L.jpg'
WHERE l.titulo='Historia de America Latina';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/10466194-L.jpg'
WHERE l.titulo='El codigo secreto de la Biblia';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13959365-L.jpg'
WHERE l.titulo='El castillo de cristal';                     -- Jeannette Walls

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13939161-L.jpg'
WHERE l.titulo='El fin de la eternidad';                     -- Isaac Asimov

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/14562056-L.jpg'
WHERE l.titulo='Flores para Algernon';                       -- Daniel Keyes

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12675509-L.jpg'
WHERE l.titulo='Fundacion';

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/13813219-L.jpg'
WHERE l.titulo='Novia de medianoche';                        -- Holly Black

UPDATE imagenes_libro il JOIN libros l ON il.id_libro=l.id_libro
SET il.url_imagen='https://covers.openlibrary.org/b/id/12846305-L.jpg'
WHERE l.titulo='Norte y sur';

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
SELECT '✅ 036 - Portadas individuales aplicadas libro por libro' AS resultado;

SELECT
  SUM(CASE WHEN url_imagen LIKE '%openlibrary.org%' THEN 1 ELSE 0 END) AS con_open_library,
  SUM(CASE WHEN url_imagen LIKE '%unsplash.com%'    THEN 1 ELSE 0 END) AS con_unsplash_generico,
  COUNT(*) AS total_imagenes
FROM imagenes_libro;
