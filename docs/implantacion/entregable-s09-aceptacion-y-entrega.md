# Entregable S09 — Aceptación y Entrega (sección 10 del plan)

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del plan | 1.1 |
| Versión del software | 1.0.1 |
| Fecha | 2026-10-17 |

---

## 10.1 Consolidación

| Sección | Completa según la lista (teoría 04) | Observaciones |
|---|---|---|
| 1. Ficha técnica | ✅ Sí | Inventario de software, SO, medición de consumo, matriz de requisitos, plataforma física y verificación con script ejecutado en Linux. |
| 2. Migración | ✅ Sí | Objetivo medible, origen de datos, estrategia big-bang, mapeo, rollback y evidencia de migración ejecutada (8/8 huellas idénticas, 17 min). |
| 3. Respaldo | ✅ Sí | Plan final con restic + mysqldump, regla 3-2-1, cron diario, retención 7d/4w/12m y restauración probada en 4 min 12 s (RTO 96.5 % de margen). |
| 4. Hosting y dominio | ✅ Sí | Estrategia por componente, dominio, registros DNS, diagrama de camino de petición, Caddyfile y estimación de costos. |
| 5. Instalación | ✅ Sí | Proceso de liberación SemVer, despliegue en servidor Linux y en Render/Neon, prueba de humo 5/5 PASS, estimación de costos. |
| 6. Configuración | ✅ Sí | Inventario de variables con validación al arrancar, servicios con healthcheck, endpoint `/health`, pruebas F-01–F-08 y lista de verificación posterior al despliegue (11/11). |
| 7. Seguridad | ✅ Sí | Usuarios de SO, SSH endurecido, UFW, roles de BD con pruebas de privilegios (5 denegaciones + 2 aprobadas), inventario de secretos sin secretos en el historial de Git. |
| 8. Pipeline y monitoreo | ✅ Sí | Tres workflows (ci/release/rollback), regla de `main`, evidencia de PR rechazado + liberación v1.0.1 + rollback v1.0.0, despliegue con rollback automático, Uptime Kuma con 5 monitores y evidencia de alerta real. |
| 9. Mantenimiento, soporte y capacitación | ✅ Sí | Calendario de mantenimiento, tabla EOL con 3 componentes críticos (MySQL 8.0, Node 20, Python 3.10), Dependabot en 5 ecosistemas, auditoría pip-audit/pnpm audit/Trivy, niveles N0–N3, matriz de prioridad, 2 runbooks, plan de capacitación para 4 públicos, guía rápida y FAQ. |

**Registro de cambios del plan:**

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-10-07 | Consolidación de las secciones 1–9; primera versión publicada |
| 1.1 | 2026-10-12 | Correcciones del simulacro cruzado: paso 5.2 con comando explícito de creación de red Docker; paso 6.2 con ruta del `.env.prod`; sección 3 con el flag `--events` en `mysqldump`; adición de sección 10 (S09) |

---

## 10.2 Pruebas de aceptación

| Campo | Valor |
|---|---|
| Casos ejecutados / total | 18 / 20 |
| Criterios de salida acordados | ≥ 90 % de casos en estado PASS; 0 defectos bloqueantes; defectos mayores con fecha de corrección comprometida antes del lanzamiento. |
| Defectos (bloqueantes / mayores / menores / cosméticos) | 0 / 1 / 2 / 1 |
| Decisión | **Aceptado con observaciones** |

**Resumen de casos ejecutados:**

| ID | Módulo | Descripción del caso | Resultado |
|---|---|---|---|
| CA-01 | Registro | Un visitante puede registrarse como comprador con datos válidos | ✅ PASS |
| CA-02 | Registro | El sistema rechaza un correo ya registrado con mensaje claro | ✅ PASS |
| CA-03 | Login | Un usuario registrado inicia sesión con credenciales correctas | ✅ PASS |
| CA-04 | Login | El sistema rechaza credenciales incorrectas con HTTP 401 | ✅ PASS |
| CA-05 | Catálogo | El catálogo muestra libros paginados y el buscador filtra por título | ✅ PASS |
| CA-06 | Catálogo | Los filtros por categoría, precio y calificación reducen los resultados correctamente | ✅ PASS |
| CA-07 | Detalle | La página de detalle muestra ISBN, precio, descripción e imagen del libro | ✅ PASS |
| CA-08 | Carrito | Un comprador autenticado agrega un libro al carrito y ve el subtotal | ✅ PASS |
| CA-09 | Carrito | El carrito persiste tras recargar la página (sesión activa) | ✅ PASS |
| CA-10 | Carrito | **No se puede actualizar la cantidad de un ítem** del carrito (RF-034 pendiente) | ❌ FAIL — defecto mayor |
| CA-11 | Checkout | El flujo de pago con datos de tarjeta de prueba completa la orden | ✅ PASS |
| CA-12 | Checkout | Una orden completada aparece en el historial del comprador | ✅ PASS |
| CA-13 | Vendedor | Un vendedor registrado puede publicar un libro con imagen y precio | ✅ PASS |
| CA-14 | Vendedor | El libro publicado aparece en el catálogo público en menos de 30 s | ✅ PASS |
| CA-15 | Librería | Un vendedor puede crear y editar su perfil de librería | ✅ PASS |
| CA-16 | Ofertas | El precio con descuento **no se muestra** en el catálogo (RF-040 pendiente) | ❌ FAIL — defecto menor |
| CA-17 | Admin | Un administrador puede bloquear y desbloquear cuentas de usuario | ✅ PASS |
| CA-18 | Salud | `GET /health` retorna HTTP 200 con base de datos `ok` | ✅ PASS |
| CA-19 | Móvil | La app móvil carga el catálogo y permite login desde dispositivo Android | ✅ PASS (ejecutado por evaluador externo) |
| CA-20 | Comparación | La comparación de libros lado a lado no está implementada (RF-033) | — OMITIDO (prioridad baja, conocido) |

**Defectos abiertos:**

| Defecto abierto | Severidad | Fecha de corrección comprometida |
|---|---|---|
| RF-034: no es posible actualizar cantidad de un ítem en el carrito | Mayor | 2026-10-31 (sprint S09) |
| RF-040: precio con descuento no aparece en el catálogo | Menor | 2026-11-07 (sprint S09) |
| Texto de error de login en inglés en algunas validaciones del frontend | Menor | 2026-10-24 |
| Imagen de portada sin texto alternativo en la vista de detalle | Cosmético | 2026-11-07 |

Enlace al detalle de casos y resultados: [`docs/aceptacion/`](../aceptacion/)

---

## 10.3 Simulacro cruzado

| Campo | Valor |
|---|---|
| Equipo que instaló | Equipo Alfa (empresa de práctica del bootcamp) |
| Duración / tiempo máximo | 72 min / 90 min |
| Huellas | ✅ Idénticas (8/8 tablas con `CHECKSUM TABLE`) |
| Prueba de humo | ✅ 7/7 PASS |
| Resultado | **Superado** |
| Desviaciones y corrección aplicada | 3 desviaciones (ver tabla 10.3.1); todas corregidas en la versión 1.1 del plan |

**Tabla 10.3.1 — Desviaciones y correcciones:**

| # | Sección del plan | Tipo | Descripción | Corrección aplicada en v1.1 |
|---|---|---|---|---|
| D-01 | 5.2 — Crear red Docker | Faltante | El plan indicaba `docker network create bookyhome-net` pero no especificaba el driver. El equipo instalador usó el default (bridge) sin saber si era correcto. | Se añadió `--driver bridge` y se explicó que `bridge` es el driver estándar para servicios en el mismo host. |
| D-02 | 6.2 — Archivo `.env.prod` | Ambiguo | El plan decía "copiar el archivo de configuración" sin indicar la ruta exacta destino (`/opt/bookyhome/deploy/.env.prod`). El equipo instalador lo colocó en `/opt/bookyhome/` y los contenedores no lo encontraron. | Se agregó la ruta absoluta destino y el comando `cp .env.prod /opt/bookyhome/deploy/.env.prod` con los permisos `chmod 600`. |
| D-03 | 3 — Respaldo (`mysqldump`) | Erróneo | El plan de respaldo en la sección 3 usaba `mysqldump` sin el flag `--events`, lo que generó una advertencia en el destino sobre la falta de eventos del scheduler. | Se añadió `--events` al comando de volcado en la sección 3. |

Enlace al registro firmado por el observador: [`docs/implantacion/registro-del-simulacro.md`](registro-del-simulacro.md)

---

## 10.4 Acta de entrega

Enlace: [`docs/implantacion/acta-de-entrega.md`](acta-de-entrega.md)

---

## 10.5 Socialización y lecciones aprendidas

| Qué funcionó | Qué no funcionó | Qué haríamos distinto |
|---|---|---|
| El pipeline de CI/CD permitió entregar con confianza: cada PR se validó con prueba de humo antes de llegar a main | RF-034 (actualizar cantidad en carrito) y RF-040 (precio con descuento) quedaron pendientes al final del sprint | Priorizar los RF de carrito desde la semana 3 en lugar de dejarlos para el final |
| Los runbooks (2) permitieron que el operador resolviera el incidente del cron sin escalar a la administradora | El simulacro reveló 3 ambigüedades en el plan que no se detectaron internamente | Ejecutar un simulacro interno con un miembro del equipo que no conociera los pasos antes del gate oficial |
| La regla 3-2-1 de respaldos funcionó: restauración en 4 min 12 s con huellas idénticas | La tabla EOL identificó 3 componentes vencidos (MySQL 8.0, Node 20) que deberían haberse migrado antes | Revisar la tabla EOL al inicio de cada sprint, no solo al final |
| El endpoint `/health` con verificación de base de datos simplificó el diagnóstico durante el simulacro | La comparación de libros (RF-033) no se llegó a implementar | Incluir RF de comparación en el diseño de navegación desde el inicio para no bloquearlo por rutas |
| La documentación de seguridad (usuarios, roles de BD, secretos) fue suficiente para que el equipo instalador tomara las acciones correctas | Los tiempos de soporte P1 dependen de que ambas personas estén reachables simultáneamente | Definir un protocolo de guardia rotativa desde la semana 7 |

**Retroalimentación recibida en la socialización y qué se hizo con ella:**

| Retroalimentación | Quién la dio | Qué se hizo |
|---|---|---|
| "El diagrama de camino de petición (sección 4.4) es muy útil; debería ser el primer elemento visual en la guía rápida" | Evaluador externo (bootcamp) | Se añadió el diagrama en la sección de introducción de `docs/ayuda/guia-rapida.md` |
| "Los tiempos de respuesta P1 de 30 min son agresivos para un equipo de 2 personas sin guardia formal" | Instructor | Se añadió en el acta de entrega la observación de que P1 aplica solo en horario laboral extendido (07:00–21:00 Bogotá); fuera de ese horario, el tiempo es de 2 h |
| "El RF-033 (comparación de libros) debería descartarse formalmente o ponerse en el roadmap" | Coordinador de la librería (cliente) | Se marcó RF-033 como `Postergado — roadmap v2` en la bitácora de lecciones aprendidas |
| "La app móvil no aparece en el acta de entrega como componente entregado" | Evaluador externo (bootcamp) | Se añadió el componente app-movil (Expo) en la sección 1 del acta de entrega |
