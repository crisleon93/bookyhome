-- Corrige los caracteres rotos en politica_envios y politica_devoluciones
-- causados por encoding incorrecto en la migración 076.

USE bookyhome;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Politica de envios: 6 variantes limpias
UPDATE tienda_configuracion SET politica_envios = CASE
    WHEN MOD(id_tienda, 6) = 0 THEN
        'Realizamos envios a todo el territorio nacional. El despacho se realiza dentro de los 2 dias habiles siguientes a la confirmacion del pago. Trabajamos con empresas de mensajeria certificadas. El comprador recibira el numero de guia una vez despachado el pedido.'
    WHEN MOD(id_tienda, 6) = 1 THEN
        'Enviamos a cualquier ciudad de Colombia. Los pedidos se despachan en 1 dia habil tras la confirmacion del pago. Usamos transportadoras de confianza y el costo de envio se calcula segun la ciudad de destino. Ofrecemos retiro gratis en nuestra tienda fisica.'
    WHEN MOD(id_tienda, 6) = 2 THEN
        'Despachos de lunes a viernes. Los pedidos confirmados antes de las 2 p.m. se procesan el mismo dia. Cubrimos todas las ciudades principales y municipios con servicio de mensajeria disponible. Para zonas apartadas el tiempo de entrega puede extenderse.'
    WHEN MOD(id_tienda, 6) = 3 THEN
        'Enviamos a nivel nacional con un plazo de despacho de 1 a 2 dias habiles. Los libros son empacados cuidadosamente para garantizar que lleguen en perfecto estado. Puedes consultar el estado de tu envio con el numero de guia que te enviaremos al correo.'
    WHEN MOD(id_tienda, 6) = 4 THEN
        'El envio se realiza dentro de los 2 dias habiles posteriores al pago. Cubrimos todo Colombia con tarifas fijas por ciudad. Los pedidos con mas de un libro pueden beneficiarse de tarifa combinada. El retiro en tienda siempre es gratuito y disponible de lunes a sabado.'
    ELSE
        'Despachamos pedidos en 1 dia habil para ciudades principales y en 2 dias para el resto del pais. Trabajamos con operadores logisticos reconocidos. El comprador asume el costo de envio indicado en el momento de la compra. Ante cualquier novedad en el envio, contactanos directamente.'
END;

-- Politica de devoluciones: 6 variantes limpias
UPDATE tienda_configuracion SET politica_devoluciones = CASE
    WHEN MOD(id_tienda, 6) = 0 THEN
        'Aceptamos devoluciones dentro de los 5 dias calendario siguientes a la recepcion del pedido, siempre que el libro este en las mismas condiciones en que fue enviado: sin uso, sin danos y con el empaque original. No se aceptan devoluciones de libros con marcas, subrayados o deterioro.'
    WHEN MOD(id_tienda, 6) = 1 THEN
        'El comprador puede solicitar la devolucion dentro de los 3 dias habiles tras recibir el pedido si el libro presenta defectos de fabrica, paginas faltantes o danos atribuibles al embalaje. En esos casos cubrimos el costo del envio de retorno. No se aceptan cambios por preferencia del lector.'
    WHEN MOD(id_tienda, 6) = 2 THEN
        'Realizamos cambios o devoluciones si el producto llega en mal estado o no corresponde al pedido realizado. El comprador tiene 7 dias desde la recepcion para reportar el inconveniente. El articulo debe retornarse en su estado original. Los costos de envio de retorno son responsabilidad del comprador salvo error nuestro.'
    WHEN MOD(id_tienda, 6) = 3 THEN
        'No aceptamos devoluciones por cambio de opinion. Sin embargo, si el libro llega danado, con paginas incorrectas o no corresponde al titulo pedido, gestionamos el cambio sin costo adicional. El reporte debe realizarse dentro de los 5 dias habiles posteriores a la entrega.'
    WHEN MOD(id_tienda, 6) = 4 THEN
        'Aceptamos devoluciones unicamente por error en el pedido o producto defectuoso. El comprador dispone de 4 dias calendario tras la entrega para solicitar la devolucion. El libro debe estar sin usar y en su empaque original. Una vez aprobada la solicitud, procesamos el reembolso en un plazo de 5 dias habiles.'
    ELSE
        'Los libros nuevos pueden devolverse dentro de los 7 dias siguientes a la entrega si presentan defectos visibles o danos de transporte. Los libros usados se venden en el estado descrito en la publicacion y no admiten devolucion salvo descripcion incorrecta. Contactanos antes de enviar cualquier retorno para coordinar el proceso.'
END;

SELECT 'Verificacion:' AS info;
SELECT tc.politica_envios FROM tienda_configuracion tc JOIN tiendas t ON t.id_tienda = tc.id_tienda WHERE t.nombre_tienda LIKE '%Cervantes%';

SELECT '077 - Politicas corregidas sin caracteres rotos' AS resultado;
