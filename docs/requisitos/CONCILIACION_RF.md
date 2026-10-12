# Conciliacion entre RF originales y documentacion actual

## Proposito y criterio

Este documento concilia el catalogo funcional original compartido por el equipo con los RF y las HU vigentes. Las HU apuntan a los IDs de los archivos actuales; esta matriz conserva la correspondencia con el ID y el significado original.

La columna de HU incluye las historias principales y aquellas que se relacionan directamente con el RF en sus criterios de aceptacion. `RF actual principal` identifica la definicion vigente del alcance central.

## Matriz de equivalencias

| RF original | Requisito original | HU vinculada (principal o transversal) | RF actual principal | Nota |
|---|---|---|---|---|
| RF-001 | Registro de usuario | HU-001 | RF-001 | Registro y verificacion de correo |
| RF-002 | Inicio de sesion | HU-037 | RF-002 | Historia separada de registro |
| RF-003 | Recuperacion de contrasena | HU-038 | RF-003 | Historia separada |
| RF-004 | Cierre de sesion | HU-039 | RF-004 | Historia separada |
| RF-005 | Publicacion de libros | HU-002, HU-035, HU-036 | RF-005 | HU-035 notifica publicaciones nuevas; HU-036 registra su actividad |
| RF-006 | Gestion de publicaciones | HU-010 | RF-006 | Coincide |
| RF-007 | Busqueda de libros | HU-003, HU-009 | RF-007 | HU-009 utiliza las busquedas para personalizar recomendaciones |
| RF-008 | Filtrado por categoria | HU-004 | RF-008 | Distinto de administrar categorias (RF-018) |
| RF-009 | Visualizacion de catalogo | HU-011 | RF-009 | Coincide |
| RF-010 | Visualizacion detallada | HU-012, HU-018 | RF-010 | HU-018 registra las publicaciones consultadas |
| RF-011 | Comunicacion con vendedor | HU-005, HU-013, HU-018, HU-036 | RF-011 | Notificacion, historial de mensajes y registro de actividad |
| RF-012 | Notificaciones de mensajes | HU-013 | RF-012 | La notificacion se genera a partir de RF-011 |
| RF-013 | Gestion de perfil de usuario | HU-014 | RF-015 | Mapeo por contenido |
| RF-014 | Gestion de perfil de negocio | HU-015 | RF-037 | Definicion agregada para completar el catalogo |
| RF-015 | Validacion de disponibilidad | HU-016 | RF-038 | Definicion agregada para completar el catalogo |
| RF-016 | Registro de actividad | HU-036 | RF-017 | Registro tecnico; distinto del historial visible RF-041 |
| RF-017 | Valoracion de libros | HU-017, HU-006, HU-033 | RF-013, RF-014 | Calificacion y comentarios separados; HU-033 compara calificaciones |
| RF-018 | Lista de favoritos | HU-007, HU-009 | RF-016 | HU-009 utiliza favoritos para personalizar recomendaciones |
| RF-019 | Historial de interaccion | HU-018, HU-009 | RF-041 | Historial visible del usuario usado tambien por recomendaciones |
| RF-020 | Gestion de stock | HU-019 | RF-039, RF-038 | El stock en cero cambia la disponibilidad |
| RF-021 | Promociones y descuentos | HU-020 | RF-040 | Definicion agregada para completar el catalogo |
| RF-022 | Metodos de pago | HU-021 | RF-025 | RF-025 actual incluye el proceso de pago |
| RF-023 | Confirmacion de transacciones | HU-022, HU-031 | RF-025, RF-023 | HU-031 consulta compras para validar la resena; RF actual RF-023 es historial de compras |
| RF-024 | Reporte de publicaciones | HU-008, HU-023, HU-024 | RF-019, RF-036 | Registro del reporte usado por seguimiento y moderacion |
| RF-025 | Moderacion de contenido | HU-024 | RF-020, RF-036 | Revision, acciones y actualizacion del seguimiento |
| RF-026 | Gestion de usuarios | HU-025 | RF-021, RF-022 | Gestion general y bloqueo separados |
| RF-027 | Recomendaciones personalizadas | HU-009, HU-026 | RF-026 | Personalizadas con historial y sugerencias iniciales sin historial |
| RF-028 | Compartir publicaciones | HU-027 | RF-027 | Mapeo por contenido |
| RF-029 | Estadisticas de ventas | HU-028 | RF-028 | Mapeo por contenido |
| RF-030 | Multidispositivo y sincronizacion | HU-029, HU-030 | RF-029, RF-030 | Acceso y sincronizacion como historias separadas |
| RF-031 | Resenas verificadas | HU-031 | RF-031 | Usa el historial de compras (RF actual RF-023) para validar y mostrar el distintivo |
| RF-032 | Configuracion de envios | HU-032 | RF-032 | Coincide |
| RF-033 | Comparacion de libros | HU-033 | RF-033, RF-013 | La comparacion incluye calificaciones cuando existen |
| RF-034 | Gestion de carrito de compras | HU-034 | RF-034, RF-024 | El checkout del carrito genera un pedido |
| RF-035 | Suscripcion a novedades | HU-035 | RF-035, RF-005, RF-040 | Notifica publicaciones y promociones; la descripcion original sobre resenas era contradictoria |
| RF-036 | Reporte y moderacion de contenido | HU-023, HU-024 | RF-036, RF-019, RF-020 | Seguimiento consulta el reporte y la moderacion actualiza su estado |

## Requisitos actuales adicionales

Estos requisitos actuales amplian el catalogo original y tienen historias propias:

| RF actual | Contenido | HU asociada | Diferencia de alcance |
|---|---|---|---|
| RF-018 | Gestion de categorias | HU-040 | Administracion de categorias; RF-008 solo filtra |
| RF-023 | Historial de compras | HU-041, HU-022, HU-031 | Compras realizadas; RF-041 registra libros vistos y mensajes |
| RF-024 | Gestion de pedidos | HU-042, HU-034 | Pedidos y estados; el checkout del carrito los genera |

Las definiciones RF-037 a RF-041 completan cinco funciones del catalogo original que no tenian un RF actual independiente: perfil de negocio, disponibilidad, stock, promociones e historial de interacciones.

## Duplicados y decisiones pendientes

- HU-006 cubre comentarios y HU-017 calificaciones; ambas son partes distintas del RF original de valoraciones.
- HU-009 cubre recomendaciones personalizadas con actividad e HU-026 sugerencias generales para usuarios sin historial.
- HU-008 registra reportes, HU-023 consulta su seguimiento y HU-024 aplica moderacion.
- RF-019, RF-020 y RF-036 tienen ahora alcances distintos: registro, moderacion y seguimiento.
- RF-013/RF-014 crean calificaciones/comentarios; RF-031 solo verifica la compra y muestra el distintivo.
- RF-017 registra eventos tecnicos; RF-041 muestra el historial personal de interacciones.
- RF-018 administra categorias; RF-008 permite filtrarlas. RF-023 conserva historial de compras y RF-024 gestiona pedidos.
- RF-035 se interpreta como notificaciones de novedades por su titulo, HU-035 y el RF actual; se descarta la descripcion original contradictoria sobre reseñas.

## Auditoria semantica de las asociaciones HU-RF

| HU | RF actual | Evaluacion | Hallazgo |
|---|---|---|---|
| HU-001 | RF-001 | Coherente | Registro, validaciones y confirmacion de correo. |
| HU-002 | RF-005 | Coherente | Publicar libros. |
| HU-003 | RF-007 | Coherente | Buscar libros. |
| HU-004 | RF-008 | Coherente | Filtrar por categoria. |
| HU-005 | RF-011 | Coherente | Comunicacion con vendedor. |
| HU-006 | RF-014 | Coherente | Publicar y consultar comentarios, sin calificar. |
| HU-007 | RF-016 | Coherente | Guardar favoritos. |
| HU-008 | RF-019 | Coherente | Registrar reportes. |
| HU-009 | RF-026, RF-007, RF-016, RF-041 | Coherente | Usa busquedas, favoritos e historial para personalizar recomendaciones. |
| HU-010 | RF-006 | Coherente | Gestionar publicaciones. |
| HU-011 | RF-009 | Coherente | Visualizar catalogo. |
| HU-012 | RF-010 | Coherente | Consultar ficha detallada. |
| HU-013 | RF-012, RF-011 | Coherente | La comunicacion genera la notificacion al negocio. |
| HU-014 | RF-015 | Coherente | Gestion de perfil de usuario. |
| HU-015 | RF-037 | Coherente | Gestion de perfil del negocio. |
| HU-016 | RF-038 | Coherente | Disponibilidad fisica o digital. |
| HU-017 | RF-013 | Coherente | Calificar libros, sin publicar comentarios. |
| HU-018 | RF-041, RF-010, RF-011 | Coherente | Registra consultas de libros y mensajes. |
| HU-019 | RF-039, RF-038 | Coherente | El stock en cero actualiza la disponibilidad. |
| HU-020 | RF-040 | Coherente | Promociones y descuentos. |
| HU-021 | RF-025 | Coherente | Realizar pagos digitales. |
| HU-022 | RF-025, RF-023 | Coherente | Confirma el pago y permite consultar la transaccion en el historial. |
| HU-023 | RF-019, RF-036 | Coherente | Consulta el seguimiento de un reporte previamente registrado. |
| HU-024 | RF-019, RF-020, RF-036 | Coherente | Consulta reportes, aplica moderacion y actualiza su seguimiento. |
| HU-025 | RF-021, RF-022 | Coherente | Gestion administrativa y bloqueo de usuarios. |
| HU-026 | RF-026 | Coherente | Sugerencias generales sin historial suficiente. |
| HU-027 | RF-027 | Coherente | Compartir publicaciones. |
| HU-028 | RF-028 | Coherente | Consultar estadisticas de ventas. |
| HU-029 | RF-029 | Coherente | Acceder desde varios dispositivos. |
| HU-030 | RF-030 | Coherente | Sincronizar informacion. |
| HU-031 | RF-031, RF-023 | Coherente | Consulta el historial de compras para verificar la resena. |
| HU-032 | RF-032 | Coherente | Configurar opciones de envio. |
| HU-033 | RF-033, RF-013 | Coherente | Compara libros e incluye su calificacion cuando existe. |
| HU-034 | RF-034, RF-024 | Coherente | Gestiona el carrito y genera un pedido al confirmar checkout. |
| HU-035 | RF-035, RF-005, RF-040 | Coherente | Notifica publicaciones nuevas y promociones. |
| HU-036 | RF-017, RF-005, RF-011, RF-025 | Coherente | Registra eventos de publicacion, comunicacion y pago para auditoria. |
| HU-037 | RF-002 | Coherente | Iniciar sesion. |
| HU-038 | RF-003 | Coherente | Recuperar contrasena. |
| HU-039 | RF-004 | Coherente | Cerrar sesion. |
| HU-040 | RF-018 | Coherente | Administrar categorias, distinto de filtrarlas. |
| HU-041 | RF-023 | Coherente | Consultar compras anteriores. |
| HU-042 | RF-024 | Coherente | Consultar pedidos y su estado. |

## Resultado de auditoria HU-RF

- Las 42 historias tienen ID unico y al menos un RF asociado.
- Los 41 RF actuales tienen al menos una HU asociada.
- Varias historias tienen mas de un RF asociado cuando sus criterios cubren directamente funciones relacionadas; los enlaces reflejan ese alcance transversal.
- No hay requisito de que el numero de HU sea igual al numero de RF: la relacion es de muchos a muchos.
- Las historias que antes se repetian ahora tienen alcances separados, descritos arriba.
- El catalogo contiene 36 funciones originales y cinco definiciones agregadas para completar funciones originales ausentes en los archivos actuales. Los RF-018, RF-023 y RF-024 actuales son funciones adicionales con HU propia.

## Siguiente paso recomendado

Actualizar los reportes de estado con los totales actuales y volver a comprobar los estados de implementacion; los reportes existentes discrepaban en el numero de RF implementados.