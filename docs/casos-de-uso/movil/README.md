# Casos de uso móvil

Estas tres vistas se contrastaron con `app-movil/src/navigation/AppNavigator.jsx`, los menús por rol y las pantallas móviles.

| Rol | Diagrama |
|---|---|
| Comprador | [PNG](diagrama-casos-de-uso-movil-comprador.png) |
| Vendedor | [PNG](diagrama-casos-de-uso-movil-vendedor.png) |
| Administrador | [PNG](diagrama-casos-de-uso-movil-administrador.png) |
| Requisitos parciales y pendientes | [PNG](diagrama-casos-de-uso-movil-parciales-pendientes.png) |

## Alcance móvil

- **Comprador:** catálogo, perfil y direcciones, lista de deseos, carrito, compras, seguimiento, notificaciones, mensajes, reseñas, quejas y soporte. Incluye ingreso biométrico cuando el dispositivo lo admite.
- **Vendedor:** publicaciones e inventario, escaneo opcional de ISBN con la cámara, configuración de envíos, pedidos, estadísticas de ventas, cobros, promociones, herramientas, calificaciones, mensajes y soporte.
- **Administrador:** dashboard y reportes, usuarios, libros, tiendas, órdenes, finanzas, quejas, soporte y perfil.

Las funciones de negocio comunes a web y móvil se mantienen en las vistas web/sistema. Estos diagramas móviles destacan la navegación y las capacidades específicas disponibles en la aplicación; no implican que cada flujo sea exclusivo del móvil.

## Límites de cobertura

No todas las HU están implementadas en la aplicación móvil. La tabla de [trazabilidad de HU](../web/README.md#trazabilidad-de-las-42-hu) indica qué historias se verificaron en cada rol y separa las funciones pendientes o parciales de las disponibles. En particular, el historial de interacciones mostrado en web no tiene una pantalla móvil identificada; tampoco se atribuyen al móvil recomendaciones personalizadas, compartir publicaciones o comparar libros.

La vista [parciales y pendientes](diagrama-casos-de-uso-movil-parciales-pendientes.png) detalla todos los huecos documentados para móvil, incluidos los requisitos compartidos con web. Sus casos están marcados como `[PARCIAL]` o `[PENDIENTE]` y no representan funciones listas.
