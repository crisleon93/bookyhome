# Bitacora de lecciones aprendidas de BookyHome

## 1. Objetivo

Registrar situaciones importantes del ciclo de vida del proyecto, su impacto, la respuesta del equipo y las acciones que deben repetirse o evitarse en futuras iteraciones.

## 2. Registro

| ID | Fecha | Etapa | Situacion observada | Impacto | Accion realizada | Leccion aprendida |
|---|---|---|---|---|---|---|
| LA-001 | 2026-08-24 | Migracion y respaldo | El backup fallo porque una vista referenciaba tablas de impulsos que no existian en la base activa | No se podia validar el respaldo completo | Se creo y aplico la migracion `020_asegurar_tablas_impulsos.sql`; la vista quedo en estado OK | Antes de respaldar se deben validar tablas, vistas, triggers y dependencias del esquema |
| LA-002 | 2026-08-24 | Recuperacion | No bastaba con comprobar que el archivo `.sql` tuviera contenido | Un archivo no vacio podia seguir siendo inutil para recuperar el sistema | Se creo `restore-test-db.ps1` y se restauro en `bookyhome_prueba` con 75 objetos | Todo backup debe probarse mediante una restauracion controlada |
| LA-003 | 2026-08-24 | Seguridad | Los endpoints de listar y bloquear usuarios no exigian rol administrativo | Un usuario no autenticado podia intentar acceder a funciones sensibles | Se agrego `require_role` y se verificaron respuestas `401` | La interfaz no es suficiente; cada endpoint debe validar permisos en backend |
| LA-004 | 2026-08-24 | Seguridad | El registro aceptaba un texto libre para el rol | Un usuario podia intentar registrarse con un rol no permitido | Se restringio el esquema a `comprador` o `vendedor` | Los valores de roles deben validarse en el servidor y no confiar en el cliente |
| LA-005 | 2026-08-24 | Infraestructura | La configuracion de puertos del frontend parecia inconsistente entre Dockerfile y Compose | Podia generar confusion durante el despliegue | Se verificaron logs y respuestas HTTP; Vite atendio correctamente en `5173` | Las dudas de despliegue deben comprobarse con logs, puertos publicados y pruebas HTTP |
| LA-006 | 2026-08-24 | Documentacion | Los scripts estaban inicialmente juntos y la regla `backups/` ignoraba tambien `scripts/backups/` | Git podia ocultar scripts necesarios para el equipo | Se separaron carpetas y se cambio la regla a `/backups/` | Las reglas de Git deben probarse con `git check-ignore` despues de reorganizar archivos |
| LA-007 | 2026-08-24 | Calidad | Los requisitos decian `Implementado`, pero no todos tenian mediciones o pruebas | Se podia confundir documentacion objetivo con evidencia real | Se creo una matriz RNF con estados Cumple, Parcial y Pendiente | Un requisito debe declararse cumplido solo con evidencia verificable |

## 3. Patrones identificados

- Validar primero el esquema real de la base antes de ejecutar operaciones de respaldo.
- Probar cambios pequenos inmediatamente despues de aplicarlos.
- Proteger los endpoints en backend aunque el frontend tambien oculte opciones.
- Mantener separadas las herramientas compartidas y los datos generados localmente.
- Registrar resultados y pendientes sin convertir expectativas en pruebas realizadas.

## 4. Acciones de mejora

1. Ejecutar pruebas automatizadas despues de cada cambio importante.
2. Mantener un inventario de migraciones y dependencias.
3. Probar backups en una base separada de forma periodica.
4. Actualizar el informe de calidad cuando se cierre una accion pendiente.
5. Revisar los secretos y la configuracion antes de publicar en produccion.

## 5. Responsables

El equipo debe completar nuevas filas cuando ocurra una incidencia o se cierre una accion de mejora. Cada registro debe incluir fecha, situacion, impacto, accion y aprendizaje.

## 10. Definicion del plan de mejora continua

El plan se define a partir de los resultados de la verificacion del software, la evaluacion de requisitos no funcionales y las lecciones aprendidas registradas. Las acciones se revisaran en cada iteracion y solo se marcaran como cerradas cuando exista la evidencia indicada.

| ID | Tipo | Hallazgo de verificacion | Accion | Responsable | Prioridad | Indicador y criterio de cierre | Estado |
|---|---|---|---|---|---|---|---|
| PMC-001 | Correctiva | La vista de ingresos fallo por tablas de impulsos ausentes | Validar el esquema completo antes de cada backup y mantener la migracion de aseguramiento | Backend y base de datos | Alta | `CHECK TABLE` sin errores y backup exitoso; cerrar con evidencia en la bitacora | En ejecucion |
| PMC-002 | Correctiva | Las rutas administrativas no exigian rol y el registro aceptaba roles libres | Mantener `require_role` en rutas sensibles y validacion de roles permitidos en los esquemas | Backend | Alta | Pruebas sin token, con rol no autorizado y con rol autorizado; respuestas esperadas `401`, `403` y `2xx` | En ejecucion |
| PMC-003 | Correctiva | La matriz RNF tenia requisitos declarados sin medicion suficiente | Completar las mediciones pendientes de login valido, publicacion, carga, disponibilidad y recursos | Calidad y backend | Alta | Cada RNF pendiente tiene prueba, resultado, fecha y evidencia; estado actualizado en `evaluacion-rnf.md` | Pendiente |
| PMC-004 | Preventiva | El backup podia ser valido como archivo, pero no necesariamente restaurable | Ejecutar una restauracion controlada en `bookyhome_prueba` de forma periodica y conservar el resultado | DevOps y base de datos | Alta | Restauracion exitosa, objetos recuperados registrados y fecha de la ultima prueba menor o igual a 30 dias | En ejecucion |
| PMC-005 | Preventiva | Las reglas de Git podian ocultar scripts necesarios | Probar cambios en `.gitignore` con `git check-ignore` y revisar archivos requeridos antes de cerrar una entrega | Todo el equipo | Media | Ningun script requerido aparece ignorado por error y la comprobacion queda registrada | En ejecucion |
| PMC-006 | Preventiva | La compatibilidad y usabilidad amplia aun no tienen evidencia completa | Ejecutar la matriz en Chrome, Edge y Firefox, en computador, tablet y celular, y completar validacion con usuarios finales | Frontend, movil y calidad | Media | Matriz diligenciada, incidencias registradas y casos criticos corregidos o aceptados | Pendiente |
| PMC-007 | Ajuste | El control de calidad depende de pruebas manuales y registros dispersos | Incorporar al flujo de cada cambio el build, validacion de Compose, pruebas de endpoints y actualizacion de evidencias | Lider de desarrollo | Media | Checklist de entrega completo en cada iteracion y cero requisitos declarados cumplidos sin evidencia | En ejecucion |
| PMC-008 | Ajuste | El seguimiento PSP no contiene tiempos reales ni defectos por integrante | Completar los registros individuales con tiempo, defectos y referencias a commits o pruebas, sin estimar datos no registrados | Cada integrante | Baja | Todas las filas confirmadas o marcadas como `No registrado`, con evidencia asociada | Pendiente |

### Criterio de seguimiento

En la reunion de cierre de cada iteracion, el equipo revisara el estado de las acciones, actualizara sus indicadores y registrara nuevas desviaciones en esta bitacora. Una accion vencida o sin evidencia se mantiene abierta y genera una nueva tarea de seguimiento; no se considera cerrada por la sola modificacion del codigo.

## 11. Avance minimo del proyecto

De acuerdo con el [Reporte de Estado de Requisitos](../requisitos/REPORTE_REQUISITOS.md), BookyHome alcanza un avance del **97.9%** sobre los requisitos funcionales y no funcionales con estado explicito: **47 de 48 requisitos implementados**. Este resultado supera el avance minimo requerido del **90%**.

El calculo se compone de:

- Requisitos funcionales: 35 de 36 implementados (**97.2%**).
- Requisitos no funcionales: 12 de 12 implementados (**100%**), segun el reporte de estado.
- Historias de usuario: se mantienen como `Definida` porque la documentacion no registra un estado de implementacion independiente; por ello no se incluyen en el porcentaje.

El requisito funcional RF-033, relacionado con la comparacion de libros, permanece como alcance final de baja prioridad. Su existencia no impide cumplir el umbral del 90%, pero debe conservarse como pendiente hasta que se implemente y verifique.

## 12. Herramienta de gestion del proyecto

El seguimiento del proyecto se realiza en **ClickUp**, mediante un espacio o lista de trabajo con tareas asignadas al equipo. La evidencia debe obtenerse directamente del tablero vigente, ya que los estados y responsables pueden cambiar durante cada iteracion.

| Evidencia requerida | Como se demuestra en ClickUp | Registro que debe conservarse |
|---|---|---|
| Tareas creadas | Vista de lista o tablero con las tareas del proyecto | Nombre, identificador y fecha de creacion |
| Tareas asignadas | Campo `Assignee` o responsable visible | Integrante asignado a cada tarea |
| Estado actualizado | Campo `Status` y fecha de ultima actualizacion | Pendiente, en progreso, en revision o completada |
| Tareas completadas | Filtro de tareas con estado `Completed` | Tarea, responsable, fecha de cierre y evidencia relacionada |
| Tareas pendientes | Filtro de tareas abiertas o atrasadas | Tarea, responsable, prioridad y fecha objetivo |
| Seguimiento real | Comparacion entre ClickUp, commits, pruebas y documentos | Enlace o captura del tablero y referencias tecnicas |

### Registro de evidencia de ClickUp

Antes de la entrega, el equipo debe completar esta tabla con la informacion visible en su espacio real de ClickUp y anexar capturas legibles o el enlace compartido al tablero:

| Tarea | Integrante asignado | Estado en ClickUp | Prioridad | Evidencia tecnica relacionada |
|---|---|---|---|---|
| Validar backup y restauracion | COMPLETAR CON CLICKUP | Completada / En revision | Alta | `scripts/backups/`, registro de restauracion |
| Proteger rutas administrativas | COMPLETAR CON CLICKUP | Completada / En revision | Alta | `backend/app/auth.py`, `backend/app/routers/usuarios.py` |
| Completar mediciones RNF | COMPLETAR CON CLICKUP | Pendiente / En progreso | Alta | `docs/calidad/evaluacion-rnf.md` |
| Implementar comparacion de libros | COMPLETAR CON CLICKUP | Pendiente | Baja | RF-033 |

**Evidencia de entrega:** agregar la URL compartida del espacio o lista de ClickUp y capturas donde se vean simultaneamente las tareas, los responsables y los estados. La informacion del tablero debe coincidir con los estados de requisitos, commits, pruebas y acciones de mejora; una captura aislada sin responsables o sin fecha no demuestra el seguimiento completo.
