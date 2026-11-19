# Diagramas de casos de uso

Los diagramas están organizados por plataforma en dos carpetas. Todos se entregan en un solo formato: PNG.

| Carpeta | Contenido |
|---|---|
| [Web](web/README.md) | Seis vistas de funciones disponibles y una vista de requisitos parciales/pendientes. |
| [Móvil](movil/README.md) | Tres vistas por rol y una vista de requisitos parciales/pendientes. |

## Resultado de la revisión

Se contrastaron las vistas con las 42 historias de usuario, la conciliación de RF, las rutas de navegación web y móvil y los endpoints registrados en `backend/app/main.py`. Las seis vistas web y tres móviles son suficientes como organización por área y rol, pero eso no significa que las 42 historias estén implementadas. La tabla de trazabilidad y las limitaciones están en el [índice web](web/README.md).

Se añadieron a las vistas de funciones disponibles el acceso desde ambas aplicaciones, el asistente Booky, las estadísticas de ventas, la consulta del historial de interacciones y la moderación explícita de reportes. La vista móvil del vendedor también muestra estadísticas y configuración de envíos. Las dos vistas complementarias enumeran los **14 requisitos con funciones parciales o pendientes**, separados por plataforma y rotulados para no confundirlos con capacidades listas.

Web y móvil comparten cuenta y servicios centrales, pero no todas las funciones tienen una pantalla en ambas plataformas. La [cobertura móvil](movil/README.md) distingue lo que se verificó en la navegación móvil.

Para consultar qué corregir después, está disponible el [registro aparte de inconsistencias funcionales](../requisitos/INCONSISTENCIAS_FUNCIONALES.md), con hallazgo y tarea futura para cada requisito.
