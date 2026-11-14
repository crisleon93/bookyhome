-- Configura días de despacho (máx 2), tarifa de envío (máx 18000 COP),
-- política de envíos y política de devoluciones para todas las tiendas.
-- Cada tienda recibe variaciones distintas para que no sean idénticas.

USE bookyhome;

-- Insertar config para la tienda que no tiene
INSERT INTO tienda_configuracion (id_tienda, tiempo_despacho_dias, tarifa_envio)
SELECT t.id_tienda, 1, 8000
FROM tiendas t
LEFT JOIN tienda_configuracion tc ON tc.id_tienda = t.id_tienda
WHERE tc.id_config IS NULL;

-- ── Días de despacho: 1 o 2 según paridad del id_tienda ──────────────────────
UPDATE tienda_configuracion
SET tiempo_despacho_dias = CASE
    WHEN MOD(id_tienda, 3) = 0 THEN 1
    WHEN MOD(id_tienda, 3) = 1 THEN 2
    ELSE 1
END;

-- ── Tarifa de envío: entre 5000 y 18000 en múltiplos de 1000 ─────────────────
UPDATE tienda_configuracion
SET tarifa_envio = CASE
    WHEN MOD(id_tienda, 7) = 0 THEN 18000
    WHEN MOD(id_tienda, 7) = 1 THEN 15000
    WHEN MOD(id_tienda, 7) = 2 THEN 12000
    WHEN MOD(id_tienda, 7) = 3 THEN 10000
    WHEN MOD(id_tienda, 7) = 4 THEN 8000
    WHEN MOD(id_tienda, 7) = 5 THEN 6000
    ELSE 5000
END;

-- ── Política de envíos: 6 variantes distintas ─────────────────────────────────
UPDATE tienda_configuracion
SET politica_envios = CASE
    WHEN MOD(id_tienda, 6) = 0 THEN
        'Realizamos envíos a todo el territorio nacional. El despacho se realiza dentro de los 2 días hábiles siguientes a la confirmación del pago. Trabajamos con empresas de mensajería certificadas. El comprador recibirá el número de guía una vez despachado el pedido.'
    WHEN MOD(id_tienda, 6) = 1 THEN
        'Enviamos a cualquier ciudad de Colombia. Los pedidos se despachan en 1 día hábil tras la confirmación del pago. Usamos transportadoras de confianza y el costo de envío se calcula según la ciudad de destino. Ofrecemos retiro gratis en nuestra tienda física.'
    WHEN MOD(id_tienda, 6) = 2 THEN
        'Despachos de lunes a viernes. Los pedidos confirmados antes de las 2 p.m. se procesan el mismo día. Cubrimos todas las ciudades principales y municipios con servicio de mensajería disponible. Para zonas apartadas el tiempo de entrega puede extenderse.'
    WHEN MOD(id_tienda, 6) = 3 THEN
        'Enviamos a nivel nacional con un plazo de despacho de 1 a 2 días hábiles. Los libros son empacados cuidadosamente para garantizar que lleguen en perfecto estado. Puedes consultar el estado de tu envío con el número de guía que te enviaremos al correo.'
    WHEN MOD(id_tienda, 6) = 4 THEN
        'El envío se realiza dentro de los 2 días hábiles posteriores al pago. Cubrimos todo Colombia con tarifas fijas por ciudad. Los pedidos con más de un libro pueden beneficiarse de tarifa combinada. El retiro en tienda siempre es gratuito y disponible de lunes a sábado.'
    ELSE
        'Despachamos pedidos en 1 día hábil para ciudades principales y en 2 días para el resto del país. Trabajamos con operadores logísticos reconocidos. El comprador asume el costo de envío indicado en el momento de la compra. Ante cualquier novedad en el envío, contáctanos directamente.'
END;

-- ── Política de devoluciones: 6 variantes distintas ──────────────────────────
UPDATE tienda_configuracion
SET politica_devoluciones = CASE
    WHEN MOD(id_tienda, 6) = 0 THEN
        'Aceptamos devoluciones dentro de los 5 días calendario siguientes a la recepción del pedido, siempre que el libro esté en las mismas condiciones en que fue enviado: sin uso, sin daños y con el empaque original. No se aceptan devoluciones de libros con marcas, subrayados o deterioro.'
    WHEN MOD(id_tienda, 6) = 1 THEN
        'El comprador puede solicitar la devolución dentro de los 3 días hábiles tras recibir el pedido si el libro presenta defectos de fábrica, páginas faltantes o daños atribuibles al embalaje. En esos casos cubrimos el costo del envío de retorno. No se aceptan cambios por preferencia del lector.'
    WHEN MOD(id_tienda, 6) = 2 THEN
        'Realizamos cambios o devoluciones si el producto llega en mal estado o no corresponde al pedido realizado. El comprador tiene 7 días desde la recepción para reportar el inconveniente. El artículo debe retornarse en su estado original. Los costos de envío de retorno son responsabilidad del comprador salvo error nuestro.'
    WHEN MOD(id_tienda, 6) = 3 THEN
        'No aceptamos devoluciones por cambio de opinión. Sin embargo, si el libro llega dañado, con páginas incorrectas o no corresponde al título pedido, gestionamos el cambio sin costo adicional. El reporte debe realizarse dentro de los 5 días hábiles posteriores a la entrega.'
    WHEN MOD(id_tienda, 6) = 4 THEN
        'Aceptamos devoluciones únicamente por error en el pedido o producto defectuoso. El comprador dispone de 4 días calendario tras la entrega para solicitar la devolución. El libro debe estar sin usar y en su empaque original. Una vez aprobada la solicitud, procesamos el reembolso en un plazo de 5 días hábiles.'
    ELSE
        'Los libros nuevos pueden devolverse dentro de los 7 días siguientes a la entrega si presentan defectos visibles o daños de transporte. Los libros usados se venden en el estado descrito en la publicación y no admiten devolución salvo descripción incorrecta. Contáctanos antes de enviar cualquier retorno para coordinar el proceso.'
END;

-- ── Verificación ──────────────────────────────────────────────────────────────
SELECT 'Resultado:' AS info;
SELECT
    tiempo_despacho_dias,
    COUNT(*) AS tiendas
FROM tienda_configuracion
GROUP BY tiempo_despacho_dias
ORDER BY tiempo_despacho_dias;

SELECT
    tarifa_envio,
    COUNT(*) AS tiendas
FROM tienda_configuracion
GROUP BY tarifa_envio
ORDER BY tarifa_envio;

SELECT
    COUNT(*) AS con_politica_envios
FROM tienda_configuracion
WHERE politica_envios IS NOT NULL AND politica_envios != '';

SELECT
    COUNT(*) AS con_politica_devoluciones
FROM tienda_configuracion
WHERE politica_devoluciones IS NOT NULL AND politica_devoluciones != '';

SELECT '076 - Configuración logística de tiendas aplicada' AS resultado;
