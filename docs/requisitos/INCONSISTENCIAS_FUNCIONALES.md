# Inconsistencias funcionales por revisar

Este registro separa los hallazgos de los [diagramas de secuencia](../diagramas-secuencia-bookyhome.md) para que puedan resolverse después. Se basa en una revisión estática de las 42 historias, las pantallas/rutas y los endpoints del repositorio. No se modificó la implementación de estas funciones.

**Estado**

- **Parcial:** existe parte de la función, pero no se identificó toda la conducta descrita en la historia.
- **Pendiente:** no se encontró evidencia suficiente de la función en la plataforma indicada.

| Requisito | Web | Móvil | Hallazgo y tarea futura |
|---|---|---|---|
| [HU-008 Reportar publicaciones](HIS/HU-008.md) | Parcial | Pendiente | Hay quejas/reportes generales, pero no se encontró una acción para reportar directamente un libro desde su publicación. Añadir ese flujo y asociar el reporte al libro. |
| [HU-009 Recomendaciones personalizadas](HIS/HU-009.md) | Pendiente | Pendiente | No se encontró un servicio que genere y muestre libros a partir de búsquedas, favoritos e historial. Implementar generación y visualización de recomendaciones. |
| [HU-018 Historial de interacciones](HIS/HU-018.md) | Parcial | Pendiente | Web tiene pantalla y API para consultar/registrar historial, pero no se encontraron llamadas automáticas desde acciones de navegación. Móvil no tiene pantalla identificada. Conectar los eventos y decidir si se requiere pantalla móvil. |
| [HU-020 Promociones y descuentos](HIS/HU-020.md) | Parcial | Parcial | Se gestionan ofertas/cupones, pero el precio promocional no se refleja completamente en el catálogo. Aplicar y mostrar precio original, precio descontado y estado de promoción. |
| [HU-021 Pagos digitales](HIS/HU-021.md) | Parcial | Parcial | Existe un flujo de pago interno; no se identificó una pasarela externa integrada. El backend rechaza montos superiores al total, pero acepta montos menores sin comprobar que exista un cupón válido que lo justifique. Validar el cupón y el monto esperado en servidor, además del método de pago. |
| [HU-028 Estadísticas de ventas](HIS/HU-028.md) | Parcial | Parcial | Web y móvil consultan ventas/órdenes del día, semana y mes, y el panel web muestra calificaciones de tienda; no se encontró un indicador de visitas. Completar ese indicador o ajustar el alcance aprobado. |
| [HU-026 Sugerencias generales](HIS/HU-026.md) | Pendiente | Pendiente | No se encontró una lista de libros populares/destacados presentada como sugerencias para usuarios sin historial. Implementar fuente y sección de sugerencias. |
| [HU-027 Compartir publicaciones](HIS/HU-027.md) | Pendiente | Pendiente | No se encontró compartir enlace de un libro desde su publicación. La opción de compartir invitaciones/mensajes en el chat móvil no cubre esta historia. |
| [HU-030 Sincronización entre dispositivos](HIS/HU-030.md) | Parcial | Parcial | Web y móvil comparten cuenta y servicios centrales, pero no se identificó un proceso explícito de sincronización, detección de inconsistencias o manejo de errores. Definir si basta el almacenamiento central o si se requiere sincronización adicional. |
| [HU-031 Reseñas verificadas](HIS/HU-031.md) | Parcial | Parcial | El backend exige compra registrada para publicar una reseña, pero no se encontró un distintivo visible que identifique la reseña como verificada. Añadirlo si forma parte del comportamiento esperado. |
| [HU-033 Comparar libros](HIS/HU-033.md) | Pendiente | Pendiente | No se encontró una función para comparar libros lado a lado. |
| [HU-034 Carrito de compras](HIS/HU-034.md) | Parcial | Parcial | Se pueden agregar/quitar productos, pero no se encontró una operación independiente para modificar la cantidad de un producto ya agregado. |
| [HU-035 Notificaciones de novedades](HIS/HU-035.md) | Parcial | Parcial | Existe infraestructura de notificaciones, pero no se verificó el envío segmentado de publicaciones/promociones según intereses ni todas las preferencias de usuario. |
| [HU-036 Registro de actividad](HIS/HU-036.md) | Parcial | Parcial | Existe API de historial, pero no se encontraron llamadas automáticas desde las acciones de navegación para registrar los eventos descritos. Aclarar también si se necesita una bitácora administrativa distinta del historial del usuario. |
| [HU-040 Administrar categorías](HIS/HU-040.md) | Pendiente | Pendiente | Se encontraron operaciones de consulta, pero no operaciones de crear, editar o eliminar categorías ni una pantalla para administrarlas. |
| [HU-042 Consultar y gestionar pedidos](HIS/HU-042.md) | Parcial | Parcial | Se consulta el historial y estado de las órdenes, pero el endpoint de cancelación no comprueba que la orden esté en un estado cancelable antes de marcarla cancelada. Definir estados permitidos y validarlos en servidor. |

## Inconsistencia en el estado de requisitos

El [reporte de estado de requisitos](REPORTE_REQUISITOS.md) combina “Implementado”, “Alcance final” y “Pendiente” de forma que sus totales y conclusiones pueden resultar contradictorios; además, las HU se describen como definidas sin un estado de implementación propio. En particular, RF-018 figura como implementado y enumera operaciones CRUD para categorías, pero no se encontraron esas rutas; HU-040 está asociada a RF-018 y se mantiene pendiente. La [conciliación RF-HU](CONCILIACION_RF.md) recomienda actualizar esos estados. Antes de usar porcentajes de avance, conviene acordar una única regla de estado y reconciliarla con el código.

## Alcance de la revisión

“Pendiente” significa que no se encontró evidencia en las pantallas, rutas o endpoints revisados; no demuestra que la función sea imposible o que no exista en una parte no revisada. Los diagramas complementarios muestran estos 16 casos como parciales o pendientes, no como funcionalidades listas:

- [Diagrama web de requisitos parciales y pendientes](../casos-de-uso/web/diagrama-casos-de-uso-parciales-pendientes.png)
- [Diagrama móvil de requisitos parciales y pendientes](../casos-de-uso/movil/diagrama-casos-de-uso-movil-parciales-pendientes.png)
