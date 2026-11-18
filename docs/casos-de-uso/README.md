# Casos de uso de BookyHome

Este conjunto contiene los diagramas de casos de uso completos de BookyHome. Los diagramas se construyeron desde los 42 documentos HU, los 41 RF actuales, el reporte de conciliación, los casos de uso anteriores y el comportamiento verificable del backend/frontend.

## Imágenes disponibles

| Vista | PNG | SVG |
|---|---|---|
| Vista general | [Abrir PNG](diagrama-casos-de-uso.png) | [Abrir SVG](diagrama-casos-de-uso.svg) |
| Acceso y catálogo | [Abrir PNG](diagrama-casos-de-uso-acceso-catalogo.png) | [Abrir SVG](diagrama-casos-de-uso-acceso-catalogo.svg) |
| Comprador y compras | [Abrir PNG](diagrama-casos-de-uso-comprador.png) | [Abrir SVG](diagrama-casos-de-uso-comprador.svg) |
| Negocio y vendedor | [Abrir PNG](diagrama-casos-de-uso-vendedor.png) | [Abrir SVG](diagrama-casos-de-uso-vendedor.svg) |
| Comunidad y soporte | [Abrir PNG](diagrama-casos-de-uso-comunidad.png) | [Abrir SVG](diagrama-casos-de-uso-comunidad.svg) |
| Administración y moderación | [Abrir PNG](diagrama-casos-de-uso-administracion.png) | [Abrir SVG](diagrama-casos-de-uso-administracion.svg) |

## Actores

| Actor | Alcance |
|---|---|
| Visitante | Registro, inicio de sesión, recuperación y consulta pública del catálogo. |
| Usuario registrado | Perfil, preferencias, notificaciones, historial y sincronización. |
| Comprador | Carrito, pagos, pedidos, devoluciones, favoritos, reseñas, chat y reportes. |
| Negocio/Vendedor | Tienda, publicaciones, stock, ofertas, ventas, envíos y finanzas. |
| Administrador | Usuarios, bloqueo, categorías, moderación, soporte, auditoría y finanzas. |
| Servicios externos | Pago y mensajería participan como servicios usados por el sistema. |

## Cobertura funcional

### Identidad y perfil

- HU-001, HU-037, HU-038, HU-039: registro, verificación, inicio de sesión, recuperación y cierre.
- HU-014, HU-029, HU-030: perfil, preferencias, direcciones y acceso/sincronización multidispositivo.
- RF-001 a RF-004 y RF-015.

### Catálogo y publicaciones

- HU-002, HU-003, HU-004, HU-010 a HU-012 y HU-016.
- HU-019, HU-033, HU-040: stock, comparación y administración de categorías.
- RF-005 a RF-010, RF-018 y RF-033, RF-038 y RF-039.

### Compra y pagos

- HU-021, HU-022, HU-034, HU-041 y HU-042.
- Carrito, checkout, domicilio, retiro en tienda, pagos, comprobantes, pedidos, entrega y devoluciones.
- RF-023 a RF-025 y RF-034.

### Tienda y ventas

- HU-015, HU-020, HU-028 y HU-032.
- Perfil del negocio, publicaciones, imágenes, variantes, stock, ofertas, cupones, envíos, estadísticas e impulsos.
- RF-028, RF-032 y RF-037 a RF-040.

### Comunidad y comunicación

- HU-005 a HU-007, HU-009, HU-013, HU-017, HU-018 y HU-026.
- HU-031, HU-035 y HU-027.
- Favoritos, listas, recomendaciones, reseñas verificadas, comentarios, chat, notificaciones y compartición.
- RF-011 a RF-17, RF-026, RF-027, RF-031 y RF-035.

### Moderación y administración

- HU-008, HU-023 a HU-025 y HU-036.
- Reportes, seguimiento, moderación, bloqueo, auditoría y categorías.
- RF-017 a RF-022 y RF-036.

## Relaciones del UML

- `<<incluye>>`: el caso principal requiere completar otro caso.
- `<<extiende>>`: el caso secundario agrega comportamiento opcional o alternativo.
- `<<requiere>>`: la operación depende de una condición previa.
- `<<marca como verificada>>`: una reseña solo recibe el distintivo si se valida una compra elegible.

## Estado funcional explícito

Las imágenes incluyen únicamente casos definidos en el alcance; las limitaciones conocidas se conservan fuera de la representación como casos completados:

| Caso | Estado documental/verificable |
|---|---|
| Comparación de libros | Pendiente: no existe implementación web/backend. |
| Actualización independiente de cantidad en el carrito | Parcial: no existe endpoint PATCH/PUT; la suma actual incrementa el ítem existente. |
| Promociones visibles en catálogo | Parcial: el backend CRUD existe, pero el catálogo no consume el precio activo de forma completa. |
| Calificación de tiendas | Implementada en `perfil.py`, aunque el router asociado no está registrado en `main.py`. |
| Devoluciones, chat, notificaciones y soporte | Implementados en routers correspondientes. |
| Financias, impulsos y suscripciones | Implementados como módulos adicionales del backend. |
