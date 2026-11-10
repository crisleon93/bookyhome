-- =============================================================================
-- Migración 030: Reemplazar usuarios de prueba por datos realistas
-- Afecta ÚNICAMENTE:
--   · id_usuario = 34  (vendedor_prueba2 / Tienda Prueba 2)
--   · id_usuario 208 al 282  (Libreria Faltante 001-075 de migración 027)
-- =============================================================================

USE bookyhome;

-- =============================================================================
-- ID 33: comprador_prueba → comprador real
-- =============================================================================

UPDATE usuarios SET
    nombre_usuario = 'Andrés Felipe Guerrero',
    correo_usuario = 'af.guerrero@gmail.com',
    telefono       = '3100876543'
WHERE id_usuario = 33;

-- =============================================================================
-- ID 34: vendedor_prueba2 → librería real
-- =============================================================================

UPDATE usuarios SET
    nombre_usuario = 'Librería Espiral de Letras',
    correo_usuario = 'ventas@espiraldeletras.co',
    telefono       = '3101987654'
WHERE id_usuario = 34;

UPDATE tiendas SET
    nombre_tienda = 'Espiral de Letras'
WHERE id_usuario = 34;

-- =============================================================================
-- IDs 208-282: Libreria Faltante 001-075 → librerías reales
-- Cada vendedor es un único establecimiento colombiano con nombre y correo
-- distintos. También se actualiza el nombre de su tienda asociada.
-- =============================================================================

-- 208 · Libreria Faltante 001
UPDATE usuarios SET nombre_usuario='Librería Áncora', correo_usuario='ventas@librerancora.co', telefono='3001110001' WHERE id_usuario=208;
UPDATE tiendas SET nombre_tienda='Librería Áncora' WHERE id_usuario=208;

-- 209 · Libreria Faltante 002
UPDATE usuarios SET nombre_usuario='Librería El Quijote Bogotá', correo_usuario='info@quijotelibros.co', telefono='3002220002' WHERE id_usuario=209;
UPDATE tiendas SET nombre_tienda='El Quijote Libros' WHERE id_usuario=209;

-- 210 · Libreria Faltante 003
UPDATE usuarios SET nombre_usuario='Casa del Lector Bogotá', correo_usuario='contacto@casadellector.com.co', telefono='3003330003' WHERE id_usuario=210;
UPDATE tiendas SET nombre_tienda='Casa del Lector' WHERE id_usuario=210;

-- 211 · Libreria Faltante 004
UPDATE usuarios SET nombre_usuario='Librería El Convento', correo_usuario='pedidos@libreconvento.co', telefono='3004440004' WHERE id_usuario=211;
UPDATE tiendas SET nombre_tienda='El Convento Libros' WHERE id_usuario=211;

-- 212 · Libreria Faltante 005
UPDATE usuarios SET nombre_usuario='Cúpula Literaria', correo_usuario='ventas@cupulaliteraria.co', telefono='3005550005' WHERE id_usuario=212;
UPDATE tiendas SET nombre_tienda='Cúpula Literaria' WHERE id_usuario=212;

-- 213 · Libreria Faltante 006
UPDATE usuarios SET nombre_usuario='Librería El Laberinto', correo_usuario='info@librelaberinto.co', telefono='3006660006' WHERE id_usuario=213;
UPDATE tiendas SET nombre_tienda='El Laberinto Libros' WHERE id_usuario=213;

-- 214 · Libreria Faltante 007
UPDATE usuarios SET nombre_usuario='Pasaje del Libro', correo_usuario='ventas@pasajedelibro.co', telefono='3007770007' WHERE id_usuario=214;
UPDATE tiendas SET nombre_tienda='Pasaje del Libro' WHERE id_usuario=214;

-- 215 · Libreria Faltante 008
UPDATE usuarios SET nombre_usuario='Librería La Tertulia Norte', correo_usuario='contacto@tertulianorte.co', telefono='3008880008' WHERE id_usuario=215;
UPDATE tiendas SET nombre_tienda='La Tertulia Norte' WHERE id_usuario=215;

-- 216 · Libreria Faltante 009
UPDATE usuarios SET nombre_usuario='Librería Altamira', correo_usuario='ventas@librealtamira.co', telefono='3009990009' WHERE id_usuario=216;
UPDATE tiendas SET nombre_tienda='Altamira Libros' WHERE id_usuario=216;

-- 217 · Libreria Faltante 010
UPDATE usuarios SET nombre_usuario='Librería Siete Vientos', correo_usuario='info@sietevientos.co', telefono='3010100010' WHERE id_usuario=217;
UPDATE tiendas SET nombre_tienda='Siete Vientos Libros' WHERE id_usuario=217;

-- 218 · Libreria Faltante 011
UPDATE usuarios SET nombre_usuario='Librería La Pepita', correo_usuario='pedidos@lapepita.co', telefono='3011110011' WHERE id_usuario=218;
UPDATE tiendas SET nombre_tienda='La Pepita Libros' WHERE id_usuario=218;

-- 219 · Libreria Faltante 012
UPDATE usuarios SET nombre_usuario='El Libro Viajero', correo_usuario='ventas@libroviajero.co', telefono='3012120012' WHERE id_usuario=219;
UPDATE tiendas SET nombre_tienda='El Libro Viajero' WHERE id_usuario=219;

-- 220 · Libreria Faltante 013
UPDATE usuarios SET nombre_usuario='Librería El Ático', correo_usuario='info@librelatico.co', telefono='3013130013' WHERE id_usuario=220;
UPDATE tiendas SET nombre_tienda='El Ático Libros' WHERE id_usuario=220;

-- 221 · Libreria Faltante 014
UPDATE usuarios SET nombre_usuario='Librería Cuéntame', correo_usuario='hola@cuentameli.co', telefono='3014140014' WHERE id_usuario=221;
UPDATE tiendas SET nombre_tienda='Cuéntame Libros' WHERE id_usuario=221;

-- 222 · Libreria Faltante 015
UPDATE usuarios SET nombre_usuario='El Rincón del Papel', correo_usuario='ventas@rinconpapel.co', telefono='3015150015' WHERE id_usuario=222;
UPDATE tiendas SET nombre_tienda='El Rincón del Papel' WHERE id_usuario=222;

-- 223 · Libreria Faltante 016
UPDATE usuarios SET nombre_usuario='Librería Estante 7', correo_usuario='contacto@estante7.co', telefono='3016160016' WHERE id_usuario=223;
UPDATE tiendas SET nombre_tienda='Estante 7 Libros' WHERE id_usuario=223;

-- 224 · Libreria Faltante 017
UPDATE usuarios SET nombre_usuario='Letras del Pacífico', correo_usuario='info@letraspacifico.co', telefono='3017170017' WHERE id_usuario=224;
UPDATE tiendas SET nombre_tienda='Letras del Pacífico' WHERE id_usuario=224;

-- 225 · Libreria Faltante 018
UPDATE usuarios SET nombre_usuario='Librería El Puente', correo_usuario='ventas@libreelpuente.co', telefono='3018180018' WHERE id_usuario=225;
UPDATE tiendas SET nombre_tienda='El Puente Libros' WHERE id_usuario=225;

-- 226 · Libreria Faltante 019
UPDATE usuarios SET nombre_usuario='Hogar del Libro Cali', correo_usuario='pedidos@hogardellibro.co', telefono='3019190019' WHERE id_usuario=226;
UPDATE tiendas SET nombre_tienda='Hogar del Libro' WHERE id_usuario=226;

-- 227 · Libreria Faltante 020
UPDATE usuarios SET nombre_usuario='Librería Meridiano', correo_usuario='info@meridianobooks.co', telefono='3020200020' WHERE id_usuario=227;
UPDATE tiendas SET nombre_tienda='Meridiano Libros' WHERE id_usuario=227;

-- 228 · Libreria Faltante 021
UPDATE usuarios SET nombre_usuario='El Páramo Libros', correo_usuario='ventas@paramolibros.co', telefono='3021210021' WHERE id_usuario=228;
UPDATE tiendas SET nombre_tienda='El Páramo Libros' WHERE id_usuario=228;

-- 229 · Libreria Faltante 022
UPDATE usuarios SET nombre_usuario='Librería La Aurora', correo_usuario='contacto@libraurora.co', telefono='3022220022' WHERE id_usuario=229;
UPDATE tiendas SET nombre_tienda='La Aurora Libros' WHERE id_usuario=229;

-- 230 · Libreria Faltante 023
UPDATE usuarios SET nombre_usuario='Libros de la Sabana', correo_usuario='info@librossabana.co', telefono='3023230023' WHERE id_usuario=230;
UPDATE tiendas SET nombre_tienda='Libros de la Sabana' WHERE id_usuario=230;

-- 231 · Libreria Faltante 024
UPDATE usuarios SET nombre_usuario='Librería El Cedro', correo_usuario='ventas@libreelcedro.co', telefono='3024240024' WHERE id_usuario=231;
UPDATE tiendas SET nombre_tienda='El Cedro Libros' WHERE id_usuario=231;

-- 232 · Libreria Faltante 025
UPDATE usuarios SET nombre_usuario='Torre de Babel Libros', correo_usuario='pedidos@torrebabellibros.co', telefono='3025250025' WHERE id_usuario=232;
UPDATE tiendas SET nombre_tienda='Torre de Babel' WHERE id_usuario=232;

-- 233 · Libreria Faltante 026
UPDATE usuarios SET nombre_usuario='Librería La Pluma', correo_usuario='info@libreapluma.co', telefono='3026260026' WHERE id_usuario=233;
UPDATE tiendas SET nombre_tienda='La Pluma Libros' WHERE id_usuario=233;

-- 234 · Libreria Faltante 027
UPDATE usuarios SET nombre_usuario='Anaquel Libros Bogotá', correo_usuario='ventas@anaquellibros.co', telefono='3027270027' WHERE id_usuario=234;
UPDATE tiendas SET nombre_tienda='Anaquel Libros' WHERE id_usuario=234;

-- 235 · Libreria Faltante 028
UPDATE usuarios SET nombre_usuario='Librería Los Cerezos', correo_usuario='contacto@loscerezos.co', telefono='3028280028' WHERE id_usuario=235;
UPDATE tiendas SET nombre_tienda='Los Cerezos Libros' WHERE id_usuario=235;

-- 236 · Libreria Faltante 029
UPDATE usuarios SET nombre_usuario='Librería El Compás', correo_usuario='info@libreelcompas.co', telefono='3029290029' WHERE id_usuario=236;
UPDATE tiendas SET nombre_tienda='El Compás Libros' WHERE id_usuario=236;

-- 237 · Libreria Faltante 030
UPDATE usuarios SET nombre_usuario='Páginas Abiertas', correo_usuario='ventas@paginasabiertas.co', telefono='3030300030' WHERE id_usuario=237;
UPDATE tiendas SET nombre_tienda='Páginas Abiertas' WHERE id_usuario=237;

-- 238 · Libreria Faltante 031
UPDATE usuarios SET nombre_usuario='Librería El Astrolabio', correo_usuario='pedidos@astrolabiolibros.co', telefono='3031310031' WHERE id_usuario=238;
UPDATE tiendas SET nombre_tienda='El Astrolabio Libros' WHERE id_usuario=238;

-- 239 · Libreria Faltante 032
UPDATE usuarios SET nombre_usuario='Librería El Mural', correo_usuario='info@libreelmural.co', telefono='3032320032' WHERE id_usuario=239;
UPDATE tiendas SET nombre_tienda='El Mural Libros' WHERE id_usuario=239;

-- 240 · Libreria Faltante 033
UPDATE usuarios SET nombre_usuario='Librería Tres Lunas', correo_usuario='ventas@treslunas.co', telefono='3033330033' WHERE id_usuario=240;
UPDATE tiendas SET nombre_tienda='Tres Lunas Libros' WHERE id_usuario=240;

-- 241 · Libreria Faltante 034
UPDATE usuarios SET nombre_usuario='Jardín de Libros', correo_usuario='contacto@jardinlibros.co', telefono='3034340034' WHERE id_usuario=241;
UPDATE tiendas SET nombre_tienda='Jardín de Libros' WHERE id_usuario=241;

-- 242 · Libreria Faltante 035
UPDATE usuarios SET nombre_usuario='Librería El Umbral', correo_usuario='info@libreelumbral.co', telefono='3035350035' WHERE id_usuario=242;
UPDATE tiendas SET nombre_tienda='El Umbral Libros' WHERE id_usuario=242;

-- 243 · Libreria Faltante 036
UPDATE usuarios SET nombre_usuario='Librería El Velero', correo_usuario='ventas@libreelvelero.co', telefono='3036360036' WHERE id_usuario=243;
UPDATE tiendas SET nombre_tienda='El Velero Libros' WHERE id_usuario=243;

-- 244 · Libreria Faltante 037
UPDATE usuarios SET nombre_usuario='Libros del Trópico', correo_usuario='pedidos@librostropico.co', telefono='3037370037' WHERE id_usuario=244;
UPDATE tiendas SET nombre_tienda='Libros del Trópico' WHERE id_usuario=244;

-- 245 · Libreria Faltante 038
UPDATE usuarios SET nombre_usuario='Librería El Colofón', correo_usuario='info@librecolofon.co', telefono='3038380038' WHERE id_usuario=245;
UPDATE tiendas SET nombre_tienda='El Colofón Libros' WHERE id_usuario=245;

-- 246 · Libreria Faltante 039
UPDATE usuarios SET nombre_usuario='Librería Mariposa de Papel', correo_usuario='ventas@mariposapapel.co', telefono='3039390039' WHERE id_usuario=246;
UPDATE tiendas SET nombre_tienda='Mariposa de Papel' WHERE id_usuario=246;

-- 247 · Libreria Faltante 040
UPDATE usuarios SET nombre_usuario='Librería El Tótem', correo_usuario='contacto@libreeltotem.co', telefono='3040400040' WHERE id_usuario=247;
UPDATE tiendas SET nombre_tienda='El Tótem Libros' WHERE id_usuario=247;

-- 248 · Libreria Faltante 041
UPDATE usuarios SET nombre_usuario='Libros del Magdalena', correo_usuario='info@libromagdalena.co', telefono='3041410041' WHERE id_usuario=248;
UPDATE tiendas SET nombre_tienda='Libros del Magdalena' WHERE id_usuario=248;

-- 249 · Libreria Faltante 042
UPDATE usuarios SET nombre_usuario='Librería El Arco Iris', correo_usuario='ventas@librearcoiris.co', telefono='3042420042' WHERE id_usuario=249;
UPDATE tiendas SET nombre_tienda='El Arco Iris Libros' WHERE id_usuario=249;

-- 250 · Libreria Faltante 043
UPDATE usuarios SET nombre_usuario='Punto de Lectura Medellín', correo_usuario='pedidos@puntolecturamed.co', telefono='3043430043' WHERE id_usuario=250;
UPDATE tiendas SET nombre_tienda='Punto de Lectura' WHERE id_usuario=250;

-- 251 · Libreria Faltante 044
UPDATE usuarios SET nombre_usuario='Refugio del Lector', correo_usuario='info@refugiolector.co', telefono='3044440044' WHERE id_usuario=251;
UPDATE tiendas SET nombre_tienda='Refugio del Lector' WHERE id_usuario=251;

-- 252 · Libreria Faltante 045
UPDATE usuarios SET nombre_usuario='Librería El Colibrí', correo_usuario='ventas@librecolibri.co', telefono='3045450045' WHERE id_usuario=252;
UPDATE tiendas SET nombre_tienda='El Colibrí Libros' WHERE id_usuario=252;

-- 253 · Libreria Faltante 046
UPDATE usuarios SET nombre_usuario='Libros del Caribe', correo_usuario='contacto@libroscaribe.co', telefono='3046460046' WHERE id_usuario=253;
UPDATE tiendas SET nombre_tienda='Libros del Caribe' WHERE id_usuario=253;

-- 254 · Libreria Faltante 047
UPDATE usuarios SET nombre_usuario='Librería El Crisol', correo_usuario='info@librecrisol.co', telefono='3047470047' WHERE id_usuario=254;
UPDATE tiendas SET nombre_tienda='El Crisol Libros' WHERE id_usuario=254;

-- 255 · Libreria Faltante 048
UPDATE usuarios SET nombre_usuario='Librería Orión', correo_usuario='ventas@libreorion.co', telefono='3048480048' WHERE id_usuario=255;
UPDATE tiendas SET nombre_tienda='Orión Libros' WHERE id_usuario=255;

-- 256 · Libreria Faltante 049
UPDATE usuarios SET nombre_usuario='La Librería del Barrio', correo_usuario='pedidos@librebarrio.co', telefono='3049490049' WHERE id_usuario=256;
UPDATE tiendas SET nombre_tienda='La del Barrio Libros' WHERE id_usuario=256;

-- 257 · Libreria Faltante 050
UPDATE usuarios SET nombre_usuario='Librería La Brújula', correo_usuario='info@labrujula.co', telefono='3050500050' WHERE id_usuario=257;
UPDATE tiendas SET nombre_tienda='La Brújula Libros' WHERE id_usuario=257;

-- 258 · Libreria Faltante 051
UPDATE usuarios SET nombre_usuario='Librería Espíritu del Libro', correo_usuario='ventas@espiritudellibro.co', telefono='3051510051' WHERE id_usuario=258;
UPDATE tiendas SET nombre_tienda='Espíritu del Libro' WHERE id_usuario=258;

-- 259 · Libreria Faltante 052
UPDATE usuarios SET nombre_usuario='Narrativa Viva Colombia', correo_usuario='contacto@narrativaviva.co', telefono='3052520052' WHERE id_usuario=259;
UPDATE tiendas SET nombre_tienda='Narrativa Viva' WHERE id_usuario=259;

-- 260 · Libreria Faltante 053
UPDATE usuarios SET nombre_usuario='Librería El Manglar', correo_usuario='info@libremanglar.co', telefono='3053530053' WHERE id_usuario=260;
UPDATE tiendas SET nombre_tienda='El Manglar Libros' WHERE id_usuario=260;

-- 261 · Libreria Faltante 054
UPDATE usuarios SET nombre_usuario='Librería Las Palmas', correo_usuario='ventas@librelaspalmas.co', telefono='3054540054' WHERE id_usuario=261;
UPDATE tiendas SET nombre_tienda='Las Palmas Libros' WHERE id_usuario=261;

-- 262 · Libreria Faltante 055
UPDATE usuarios SET nombre_usuario='Diente de León Libros', correo_usuario='pedidos@dienteleon.co', telefono='3055550055' WHERE id_usuario=262;
UPDATE tiendas SET nombre_tienda='Diente de León' WHERE id_usuario=262;

-- 263 · Libreria Faltante 056
UPDATE usuarios SET nombre_usuario='El Canto del Gallo Libros', correo_usuario='info@cantodegallo.co', telefono='3056560056' WHERE id_usuario=263;
UPDATE tiendas SET nombre_tienda='El Canto del Gallo' WHERE id_usuario=263;

-- 264 · Libreria Faltante 057
UPDATE usuarios SET nombre_usuario='Taller del Texto', correo_usuario='ventas@tallerdeltexto.co', telefono='3057570057' WHERE id_usuario=264;
UPDATE tiendas SET nombre_tienda='Taller del Texto' WHERE id_usuario=264;

-- 265 · Libreria Faltante 058
UPDATE usuarios SET nombre_usuario='Librería Pergamino', correo_usuario='contacto@librepergamino.co', telefono='3058580058' WHERE id_usuario=265;
UPDATE tiendas SET nombre_tienda='Pergamino Libros' WHERE id_usuario=265;

-- 266 · Libreria Faltante 059
UPDATE usuarios SET nombre_usuario='Librería El Silabario', correo_usuario='info@silabario.co', telefono='3059590059' WHERE id_usuario=266;
UPDATE tiendas SET nombre_tienda='El Silabario' WHERE id_usuario=266;

-- 267 · Libreria Faltante 060
UPDATE usuarios SET nombre_usuario='Librería La Mancha', correo_usuario='ventas@lamancha.co', telefono='3060600060' WHERE id_usuario=267;
UPDATE tiendas SET nombre_tienda='La Mancha Libros' WHERE id_usuario=267;

-- 268 · Libreria Faltante 061
UPDATE usuarios SET nombre_usuario='Librería El Compendio', correo_usuario='pedidos@librecompendio.co', telefono='3061610061' WHERE id_usuario=268;
UPDATE tiendas SET nombre_tienda='El Compendio Libros' WHERE id_usuario=268;

-- 269 · Libreria Faltante 062
UPDATE usuarios SET nombre_usuario='El Estudio Librería', correo_usuario='info@elestudiio.co', telefono='3062620062' WHERE id_usuario=269;
UPDATE tiendas SET nombre_tienda='El Estudio Libros' WHERE id_usuario=269;

-- 270 · Libreria Faltante 063
UPDATE usuarios SET nombre_usuario='Librería La Crónica', correo_usuario='ventas@lacronicali.co', telefono='3063630063' WHERE id_usuario=270;
UPDATE tiendas SET nombre_tienda='La Crónica Libros' WHERE id_usuario=270;

-- 271 · Libreria Faltante 064
UPDATE usuarios SET nombre_usuario='Librería El Archipiélago', correo_usuario='contacto@archpielago.co', telefono='3064640064' WHERE id_usuario=271;
UPDATE tiendas SET nombre_tienda='El Archipiélago Libros' WHERE id_usuario=271;

-- 272 · Libreria Faltante 065
UPDATE usuarios SET nombre_usuario='Librería Tayrona', correo_usuario='info@tayronalibros.co', telefono='3065650065' WHERE id_usuario=272;
UPDATE tiendas SET nombre_tienda='Tayrona Libros' WHERE id_usuario=272;

-- 273 · Libreria Faltante 066
UPDATE usuarios SET nombre_usuario='Primavera Libros', correo_usuario='ventas@primaverabooks.co', telefono='3066660066' WHERE id_usuario=273;
UPDATE tiendas SET nombre_tienda='Primavera Libros' WHERE id_usuario=273;

-- 274 · Libreria Faltante 067
UPDATE usuarios SET nombre_usuario='Librería El Ábaco', correo_usuario='pedidos@libreabaco.co', telefono='3067670067' WHERE id_usuario=274;
UPDATE tiendas SET nombre_tienda='El Ábaco Libros' WHERE id_usuario=274;

-- 275 · Libreria Faltante 068
UPDATE usuarios SET nombre_usuario='Libros de la Montaña', correo_usuario='info@librosmontana.co', telefono='3068680068' WHERE id_usuario=275;
UPDATE tiendas SET nombre_tienda='Libros de la Montaña' WHERE id_usuario=275;

-- 276 · Libreria Faltante 069
UPDATE usuarios SET nombre_usuario='Librería El Romancero', correo_usuario='ventas@libreromancero.co', telefono='3069690069' WHERE id_usuario=276;
UPDATE tiendas SET nombre_tienda='El Romancero Libros' WHERE id_usuario=276;

-- 277 · Libreria Faltante 070
UPDATE usuarios SET nombre_usuario='Librería El Zaguán', correo_usuario='contacto@librezaguan.co', telefono='3070700070' WHERE id_usuario=277;
UPDATE tiendas SET nombre_tienda='El Zaguán Libros' WHERE id_usuario=277;

-- 278 · Libreria Faltante 071
UPDATE usuarios SET nombre_usuario='Librería El Claustro', correo_usuario='info@libreclaustro.co', telefono='3071710071' WHERE id_usuario=278;
UPDATE tiendas SET nombre_tienda='El Claustro Libros' WHERE id_usuario=278;

-- 279 · Libreria Faltante 072
UPDATE usuarios SET nombre_usuario='Libros y Café San Martín', correo_usuario='ventas@libroscafesm.co', telefono='3072720072' WHERE id_usuario=279;
UPDATE tiendas SET nombre_tienda='Libros y Café San Martín' WHERE id_usuario=279;

-- 280 · Libreria Faltante 073
UPDATE usuarios SET nombre_usuario='Librería El Amanuense', correo_usuario='pedidos@amanuenselibros.co', telefono='3073730073' WHERE id_usuario=280;
UPDATE tiendas SET nombre_tienda='El Amanuense Libros' WHERE id_usuario=280;

-- 281 · Libreria Faltante 074
UPDATE usuarios SET nombre_usuario='Librería La Estación', correo_usuario='info@librelaestacion.co', telefono='3074740074' WHERE id_usuario=281;
UPDATE tiendas SET nombre_tienda='La Estación Libros' WHERE id_usuario=281;

-- 282 · Libreria Faltante 075
UPDATE usuarios SET nombre_usuario='Librería El Manuscrito', correo_usuario='ventas@libremanuscrito.co', telefono='3075750075' WHERE id_usuario=282;
UPDATE tiendas SET nombre_tienda='El Manuscrito Libros' WHERE id_usuario=282;


-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

SELECT '✅ 030 - Usuarios de prueba actualizados' AS resultado;

-- Confirmar que no quedan correos @bookyhome.test ni nombres "Faltante"
SELECT 'Correos @bookyhome.test pendientes' AS alerta, COUNT(*) AS cantidad
FROM usuarios WHERE correo_usuario LIKE '%@bookyhome.test';

SELECT 'Tiendas "Faltante" pendientes' AS alerta, COUNT(*) AS cantidad
FROM tiendas WHERE nombre_tienda LIKE '%Faltante%';

-- Revisar IDs 33 y 34 quedaron bien
SELECT id_usuario, nombre_usuario, correo_usuario, rol
FROM usuarios WHERE id_usuario IN (33, 34);
