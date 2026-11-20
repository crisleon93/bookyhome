# Casos de uso web

Las seis vistas se contrastaron con las 42 HU, la matriz de conciliación RF-HU, `frontend/src/App.jsx`, `frontend/src/` y los routers registrados en `backend/app/main.py`.

| Vista | Diagrama |
|---|---|
| General | [PNG](diagrama-casos-de-uso.png) |
| Acceso y catálogo | [PNG](diagrama-casos-de-uso-acceso-catalogo.png) |
| Comprador: compra y postventa | [PNG](diagrama-casos-de-uso-comprador.png) |
| Vendedor: tienda y ventas | [PNG](diagrama-casos-de-uso-vendedor.png) |
| Comunidad y soporte | [PNG](diagrama-casos-de-uso-comunidad.png) |
| Administración | [PNG](diagrama-casos-de-uso-administracion.png) |
| Requisitos parciales y pendientes | [PNG](diagrama-casos-de-uso-parciales-pendientes.png) |

## Cobertura por rol

- **Visitante:** catálogo público, búsqueda, detalle de libros y tiendas, registro, inicio de sesión y recuperación.
- **Comprador:** perfil, direcciones, carrito, compra, pedidos, seguimiento, cancelación, devoluciones, favoritos, listas, reseñas, chat, notificaciones e historial.
- **Vendedor:** tienda, publicaciones, variantes e inventario, ofertas, cupones, pedidos, envíos, cobros, estadísticas, suscripciones e impulsos.
- **Administrador:** usuarios, publicaciones y tiendas, órdenes, finanzas, indicadores, moderación de reportes y solicitudes de soporte.
- **Asistente Booky:** disponible en la aplicación web; el proveedor IA configurado es opcional y existe una respuesta local.
- **Correo SMTP:** servicio opcional para verificación y recuperación; no es una pasarela de pago.

## Trazabilidad de las 42 HU

La columna de estado distingue si la función se encontró en el proyecto; “en diagrama” por sí solo no significa que una historia esté completa. Las funciones comunes se muestran en las vistas web y, cuando existe una pantalla móvil verificada, también se indica la vista móvil.

| HU | Vista web | Vista móvil | Estado frente al proyecto |
|---|---|---|---|
| HU-001 Registrar usuario | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-002 Publicar libros | [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada. |
| HU-003 Buscar libros | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-004 Filtrar por categoría | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-005 Comunicarse con vendedor | [Comunidad](diagrama-casos-de-uso-comunidad.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-006 Comentar libros | [Comunidad](diagrama-casos-de-uso-comunidad.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada mediante reseñas y comentarios. |
| HU-007 Guardar favoritos | [Comunidad](diagrama-casos-de-uso-comunidad.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada mediante favoritos/listas. |
| HU-008 Reportar publicaciones | [Comunidad](diagrama-casos-de-uso-comunidad.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial en web y pendiente en móvil: hay quejas y reportes, pero no un flujo ligado directamente a una publicación. |
| HU-009 Recomendaciones personalizadas | [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Pendiente: no se encontró un servicio que genere y muestre listas según búsquedas, favoritos e historial. |
| HU-010 Gestionar publicaciones | [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada. |
| HU-011 Visualizar catálogo | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-012 Ver detalle de libro | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-013 Notificaciones de mensajes | [Comunidad](diagrama-casos-de-uso-comunidad.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-014 Gestionar perfil de usuario | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-015 Gestionar perfil de negocio | [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada. |
| HU-016 Validar disponibilidad | [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada mediante stock y disponibilidad. |
| HU-017 Calificar libros | [Comunidad](diagrama-casos-de-uso-comunidad.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada mediante reseñas. |
| HU-018 Historial de interacciones | [Comunidad](diagrama-casos-de-uso-comunidad.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial en web y pendiente en móvil: existe pantalla/API web, pero no se hallaron llamadas automáticas desde navegación ni pantalla móvil. |
| HU-019 Gestionar stock | [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada. |
| HU-020 Promociones y descuentos | [Vendedor](diagrama-casos-de-uso-vendedor.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png), [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial: se gestionan ofertas/cupones; la aplicación del precio promocional al catálogo es incompleta. |
| HU-021 Realizar pagos digitales | [Compra](diagrama-casos-de-uso-comprador.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png), [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial: el flujo de pago es interno; no se identificó pasarela externa y hay validaciones pendientes. |
| HU-022 Confirmar transacciones | [Compra](diagrama-casos-de-uso-comprador.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada dentro del flujo interno de pedido/pago. |
| HU-023 Seguimiento de reportes | [Comunidad](diagrama-casos-de-uso-comunidad.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada mediante consulta de quejas/reclamos. |
| HU-024 Moderar contenido | [Administración](diagrama-casos-de-uso-administracion.png) | — | Representada en el flujo administrativo web. |
| HU-025 Gestionar usuarios | [Administración](diagrama-casos-de-uso-administracion.png) | [Administrador](../movil/diagrama-casos-de-uso-movil-administrador.png) | Representada. |
| HU-026 Sugerencias generales | [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Pendiente: no se encontró una lista de libros populares/destacados presentada como recomendación. |
| HU-027 Compartir publicaciones | [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Pendiente: no se encontró compartir enlace de una publicación; compartir en el chat móvil es otro flujo. |
| HU-028 Estadísticas de ventas | [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada. |
| HU-029 Acceso multidispositivo | [General](diagrama-casos-de-uso.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada mediante la misma cuenta en web y móvil. |
| HU-030 Sincronización entre dispositivos | [General](diagrama-casos-de-uso.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png), [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial: comparten servicios centrales; no se identificó un proceso independiente de sincronización ni su gestión de errores. |
| HU-031 Reseñas verificadas | [Comunidad](diagrama-casos-de-uso-comunidad.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png), [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial: el backend exige compra registrada para publicar, pero no se identificó un distintivo visible de reseña verificada. |
| HU-032 Opciones de envío | [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada mediante la configuración de envío/retiro. |
| HU-033 Comparar libros | [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Pendiente; no se encontró la función de comparación lado a lado. |
| HU-034 Carrito de compras | [Compra](diagrama-casos-de-uso-comprador.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png), [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial: no hay actualización independiente de la cantidad de un artículo ya agregado. |
| HU-035 Notificaciones de novedades | [Comunidad](diagrama-casos-de-uso-comunidad.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png), [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial: existe notificación general, pero no se verificó el envío segmentado de novedades ni todas sus preferencias. |
| HU-036 Registrar actividad | [Comunidad](diagrama-casos-de-uso-comunidad.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Parcial: existe API de historial, pero no se hallaron llamadas automáticas desde las acciones de navegación. |
| HU-037 Iniciar sesión | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-038 Recuperar contraseña | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-039 Cerrar sesión | [Acceso](diagrama-casos-de-uso-acceso-catalogo.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-040 Administrar categorías | [Administración](diagrama-casos-de-uso-administracion.png), [Pendientes](diagrama-casos-de-uso-parciales-pendientes.png) | [Pendientes móvil](../movil/diagrama-casos-de-uso-movil-parciales-pendientes.png) | Pendiente: solo se identificaron endpoints de consulta; no hay CRUD de categorías en las pantallas ni en la API registrada. |
| HU-041 Historial de compras | [Compra](diagrama-casos-de-uso-comprador.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) | Representada. |
| HU-042 Consultar y gestionar pedidos | [Compra](diagrama-casos-de-uso-comprador.png) y [Vendedor](diagrama-casos-de-uso-vendedor.png) | [Comprador](../movil/diagrama-casos-de-uso-movil-comprador.png) y [Vendedor](../movil/diagrama-casos-de-uso-movil-vendedor.png) | Representada según el rol. |

## Limitaciones que afectan a los diagramas

- La vista [parciales y pendientes](diagrama-casos-de-uso-parciales-pendientes.png) agrupa los HU-008, 009, 018, 020, 021, 026, 027, 030, 031, 033, 034, 035, 036 y 040; no deben interpretarse como funciones completas.
- El pago se registra en el flujo interno de BookyHome. No se identificó una pasarela de pago externa integrada.
- No se identificó un servicio externo de envío; el vendedor registra y actualiza la información de envío.
- La actualización independiente de la cantidad en el carrito y la visualización completa del precio promocional son parciales.
- Las recomendaciones, compartir publicaciones, comparar libros y administrar categorías no se presentan como funciones implementadas.
- Las reseñas de libros requieren una compra registrada. Calificar una tienda está disponible mediante rutas de `perfil.py`; el router independiente `calificaciones_tiendas.py` no se registra en `main.py`.
- La tabla refleja lo observado en el código. `docs/requisitos/REPORTE_REQUISITOS.md` y algunos estados RF/HU no son coherentes entre sí; no se usaron como única evidencia de implementación.
- El [registro aparte de inconsistencias funcionales](../../requisitos/INCONSISTENCIAS_FUNCIONALES.md) detalla cada hallazgo y la tarea sugerida para resolverlo más adelante.

## Notación UML

- `A ..> B : <<include>>` indica que el caso `A` incorpora obligatoriamente el caso `B`.
- `A ..> B : <<extend>>` indica que `A` agrega comportamiento opcional al caso base `B`.
- Las precondiciones, integraciones opcionales y limitaciones se expresan como notas.
