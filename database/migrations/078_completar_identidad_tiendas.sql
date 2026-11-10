-- Completa email_publico, horario_atencion, descripcion y ciudad_origen
-- para todas las tiendas que tengan esos campos vacios.

USE bookyhome;

-- Email publico: generado a partir del nombre de la tienda (sin tildes ni espacios)
UPDATE tienda_configuracion tc
JOIN tiendas t ON t.id_tienda = tc.id_tienda
SET tc.email_publico = CONCAT(
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        SUBSTRING_INDEX(t.nombre_tienda, ' ', 2),
        ' ', ''),
        'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),
        'Á','a'),'É','e'),'Í','i'),'Ó','o'),'Ú','u'),'ñ','n')),
    '@bookyhome.co'
)
WHERE tc.email_publico IS NULL OR tc.email_publico = '';

-- Horario de atencion: 4 variantes segun paridad del id
UPDATE tienda_configuracion
SET horario_atencion = CASE
    WHEN MOD(id_tienda, 4) = 0 THEN 'Lun-Vie 9am-6pm, Sab 10am-2pm'
    WHEN MOD(id_tienda, 4) = 1 THEN 'Lun-Sab 8am-7pm'
    WHEN MOD(id_tienda, 4) = 2 THEN 'Lun-Vie 10am-6pm'
    ELSE                             'Lun-Dom 9am-5pm'
END
WHERE horario_atencion IS NULL OR horario_atencion = '';

-- Ciudad origen: tomar la ciudad de la direccion de la tienda si falta
UPDATE tienda_configuracion tc
JOIN tiendas t ON t.id_tienda = tc.id_tienda
SET tc.ciudad_origen = TRIM(SUBSTRING_INDEX(t.direccion, ',', -1))
WHERE (tc.ciudad_origen IS NULL OR tc.ciudad_origen = '')
  AND t.direccion IS NOT NULL AND t.direccion != '';

-- Descripcion: 6 variantes para las que no tienen
UPDATE tienda_configuracion tc
JOIN tiendas t ON t.id_tienda = tc.id_tienda
SET tc.descripcion = CASE
    WHEN MOD(t.id_tienda, 6) = 0 THEN
        'Somos una libreria especializada en ofrecer titulos de calidad para todos los gustos. Encontraras desde clasicos de la literatura universal hasta las novedades mas recientes. Nuestro objetivo es acercar el libro a cada lector.'
    WHEN MOD(t.id_tienda, 6) = 1 THEN
        'Libreria con amplio catalogo de libros nuevos y usados. Nos apasiona la lectura y queremos compartir esa pasion con nuestra comunidad. Ofrecemos atencion personalizada para ayudarte a encontrar tu proximo libro favorito.'
    WHEN MOD(t.id_tienda, 6) = 2 THEN
        'Tienda literaria con seleccion cuidadosa de titulos en distintos generos: ficcion, ciencia, historia, filosofia y mucho mas. Cada libro en nuestro catalogo fue elegido pensando en el lector exigente.'
    WHEN MOD(t.id_tienda, 6) = 3 THEN
        'Nos dedicamos a conectar lectores con los libros que cambian perspectivas. Contamos con un catalogo diverso, precios accesibles y envios rapidos a todo el pais. Tu proxima gran lectura esta aqui.'
    WHEN MOD(t.id_tienda, 6) = 4 THEN
        'Libreria independiente con anos de experiencia en la venta de libros. Priorizamos la calidad, el buen estado de cada ejemplar y la satisfaccion de nuestros compradores. Bienvenido a nuestro espacio literario.'
    ELSE
        'Espacio dedicado a los amantes de la lectura. Aqui encontraras titulos para todas las edades e intereses, desde literatura infantil hasta ensayos especializados. Enviamos con cuidado a cualquier ciudad de Colombia.'
END
WHERE tc.descripcion IS NULL OR tc.descripcion = '';

-- Verificacion
SELECT 'Resultado:' AS info;
SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN email_publico IS NOT NULL AND email_publico != '' THEN 1 ELSE 0 END) AS con_email,
    SUM(CASE WHEN horario_atencion IS NOT NULL AND horario_atencion != '' THEN 1 ELSE 0 END) AS con_horario,
    SUM(CASE WHEN descripcion IS NOT NULL AND descripcion != '' THEN 1 ELSE 0 END) AS con_descripcion,
    SUM(CASE WHEN ciudad_origen IS NOT NULL AND ciudad_origen != '' THEN 1 ELSE 0 END) AS con_ciudad
FROM tienda_configuracion;

SELECT '078 - Identidad de tiendas completada' AS resultado;
