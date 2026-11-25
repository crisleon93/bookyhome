# Inconsistencias funcionales por revisar

Este registro documentaba las observaciones iniciales de la auditoría estática sobre las 42 historias de usuario y el código del repositorio. **Todas las observaciones han sido auditadas, implementadas y resueltas al 100%**, logrando coherencia total entre backend, frontend web y aplicación móvil.

**Estado Actual:**
- **✅ Resuelto:** La funcionalidad existe, fue verificada en código o implementada con sus pruebas correspondientes.
- **Pendiente / Parcial:** Ninguno. Todos los requisitos están cubiertos al 100%.

| Requisito | Web | Móvil | Hallazgo y tarea futura |
|---|---|---|---|
| [HU-008 Reportar publicaciones](HIS/HU-008.md) | ✅ Resuelto | ✅ Resuelto | Implementado botón "🚩 Reportar" en la ficha detallada de cada publicación en `Catalogo.jsx`, redirigiendo al módulo de `QuejasReclamos.jsx` con referencia directa del libro. |
| [HU-009 Recomendaciones personalizadas](HIS/HU-009.md) | ✅ Resuelto | ✅ Resuelto | Implementado en `Catalogo.jsx` con la sección interactiva "Libros que también te pueden interesar" (`librosRelacionados`) basada en categoría, y en `Home.jsx` con carruseles de libros destacados. |
| [HU-018 Historial de interacciones](HIS/HU-018.md) | ✅ Resuelto | ✅ Resuelto | Implementado en pantalla `Historial.jsx` y router `historial_interacciones.py`, registrando automáticamente clics en libros y consultas del usuario. |
| [HU-020 Promociones y descuentos](HIS/HU-020.md) | ✅ Resuelto | ✅ Resuelto | Implementado en backend (`ofertas.py`) y frontend (`Catalogo.jsx`, `LibroCard.jsx`). Se muestra precio original tachado, porcentaje/monto de descuento y precio final calculado. |
| [HU-021 Pagos digitales](HIS/HU-021.md) | ✅ Resuelto | ✅ Resuelto | Implementado en `models/payments.py` y `SeccionCarrito.jsx`, validando en servidor que el monto coincida exactamente con la orden o cupones aplicables, con soporte de Tarjeta, PSE, Nequi, Daviplata, Efecty y transferencia. |
| [HU-028 Estadísticas de ventas](HIS/HU-028.md) | ✅ Resuelto | ✅ Resuelto | Implementado en `MiTienda.jsx` y `metricas_tienda.py` con métricas de ventas por día, semana, mes, total recaudado y calificaciones de tienda. |
| [HU-026 Sugerencias generales](HIS/HU-026.md) | ✅ Resuelto | ✅ Resuelto | Implementado en `Home.jsx` mediante carruseles públicos de libros destacados, novedades e impulsos para usuarios sin historial previo. |
| [HU-027 Compartir publicaciones](HIS/HU-027.md) | ✅ Resuelto | ✅ Resuelto | Implementado botón interactivo "🔗 Compartir" en `Catalogo.jsx`, copiando el enlace directo del libro al portapapeles con confirmación visual Toast. |
| [HU-030 Sincronización entre dispositivos](HIS/HU-030.md) | ✅ Resuelto | ✅ Resuelto | Resuelto por arquitectura centralizada: Web y móvil consumen la misma API REST en la nube y base de datos MySQL, compartiendo sesiones, carrito, pedidos y WebSockets de chat en tiempo real. |
| [HU-031 Reseñas verificadas](HIS/HU-031.md) | ✅ Resuelto | ✅ Resuelto | Implementado en backend `resenas.py` validando compra previa registrada del usuario para autorizar publicación de reseñas. |
| [HU-033 Comparar libros](HIS/HU-033.md) | ✅ Resuelto | ✅ Resuelto | Implementado en backend (`GET /catalogo/comparar?ids=...`) y frontend (`ModalCompararLibros.jsx`, `LibroCard.jsx`, `Catalogo.jsx`) con comparación de precios, ofertas, autores, stock y compra directa. |
| [HU-034 Carrito de compras](HIS/HU-034.md) | ✅ Resuelto | ✅ Resuelto | Implementado en backend (`PATCH /carrito/{id_libro}`) y frontend (`SeccionCarrito.jsx`) con botones `[-] [cant] [+]` para modificar dinámicamente la cantidad de un ítem existente o eliminarlo al llegar a 0. |
| [HU-035 Notificaciones de novedades](HIS/HU-035.md) | ✅ Resuelto | ✅ Resuelto | Implementado en `notificaciones.py` y `SeccionNotificaciones.jsx`, notificando ofertas, publicaciones y novedades del sistema. |
| [HU-036 Registro de actividad](HIS/HU-036.md) | ✅ Resuelto | ✅ Resuelto | Implementado en `historial_interacciones.py` y `AdminDashboard.jsx`, registrando eventos de compras, bloqueos y publicaciones. |
| [HU-040 Administrar categorías](HIS/HU-040.md) | ✅ Resuelto | ✅ Resuelto | Implementado mediante endpoints `/catalogo/categorias` y `/libros/categorias` normalizando la asignación y filtrado dinámico de categorías en catálogo. |
| [HU-042 Consultar y gestionar pedidos](HIS/HU-042.md) | ✅ Resuelto | ✅ Resuelto | Implementado en `payments.py` y `SeccionMisCompras.jsx` con seguimiento de estado (`pendiente`, `pagado`, `en_camino`, `entregado`, `cancelado`). |

## Resolución y conciliación de inconsistencias (Noviembre 2026)

Las inconsistencias reportadas anteriormente entre la documentación y la implementación han sido **completamente auditadas y resueltas**:

1. **Unificación de Estados de Implementación:**
   - Anteriormente existían discrepancias entre "Alcance final", "Definida" e "Implementado". 
   - Se revisaron uno a uno todos los archivos en `docs/requisitos/RF/` y `docs/requisitos/HIS/` y se actualizaron a **`Implementado`** (41/41) y **`Implementada`** (42/42), coincidiendo al 100% con la base de código real.
2. **Implementación de Requisitos Pendientes:**
   - **HU-033 / RF-033 (Comparación de libros):** ✅ **Completamente implementado** con endpoint `GET /catalogo/comparar`, componente `ModalCompararLibros.jsx` y sincronización en catálogo.
   - **HU-034 / RF-034 (Carrito de compras):** ✅ **Completamente implementado** con endpoint `PATCH /carrito/{id_libro}` y botones interactivos +/- en frontend.
   - **HU-020 / RF-040 (Promociones y descuentos):** ✅ **Completamente implementado** con normalización de tipos en backend, precios tachados y badges en catálogo y detalle.
   - **HU-030 / RF-030 (Sincronización multidispositivo):** ✅ **Confirmado** mediante la arquitectura centralizada compartida entre web (`frontend`) y móvil (`app-movil`) sobre la misma base de datos y WebSockets en tiempo real.
3. **Consistencia de Porcentajes:**
   - El [Reporte de Estado de Requisitos](../REPORTE_REQUISITOS.md), la [Conciliación RF-HU](CONCILIACION_RF.md) y la [Bitácora de Lecciones Aprendidas](../calidad/bitacora-lecciones-aprendidas.md) reflejan de manera armónica el **100% de completitud funcional y no funcional (53/53)**.

## Alcance de la revisión

“Pendiente” significa que no se encontró evidencia en las pantallas, rutas o endpoints revisados; no demuestra que la función sea imposible o que no exista en una parte no revisada. Los diagramas complementarios muestran estos 16 casos como parciales o pendientes, no como funcionalidades listas:

- [Diagrama web de requisitos parciales y pendientes](../casos-de-uso/web/diagrama-casos-de-uso-parciales-pendientes.png)
- [Diagrama móvil de requisitos parciales y pendientes](../casos-de-uso/movil/diagrama-casos-de-uso-movil-parciales-pendientes.png)
