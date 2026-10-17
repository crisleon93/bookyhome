# Entregable S08 — Mantenimiento, Soporte y Capacitación

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del software | 1.0.1 |
| Fecha | 2026-10-17 |

---

## 9.1 Plan de mantenimiento

### Calendario de tareas

| Tarea | Tipo | Frecuencia | Automática / manual | Responsable (rol) | ¿Requiere ventana? |
|---|---|---|---|---|---|
| Parches de seguridad del SO (Ubuntu) | Preventivo | Diaria | **Automática** (`unattended-upgrades`) | Administrador del servidor | No |
| Reinicio para parches del kernel (`needrestart`) | Preventivo | Mensual | Manual — se programa en ventana | Administradora (`ana`) | Sí |
| Actualización de imágenes Docker de producción | Preventivo | Al llegar PR de Dependabot aprobado | Automática (CI) + manual (fusionar PR) | Operador (`luis`) / Administradora (`ana`) | No (azul/verde) |
| Restauración de prueba del respaldo | Preventivo | Mensual | Manual | Operador (`luis`) | No |
| Revisión de logs de acceso y errores | Preventivo | Semanal | Manual | Operador (`luis`) | No |
| Revisión de tabla EOL de componentes | Preventivo | Trimestral | Manual | Administradora (`ana`) | No |
| Rotación de secretos (JWT, BD, correo, Gemini) | Preventivo | Semestral o ante indicios de compromiso | Manual | Administradora (`ana`) | Sí (breve) |
| Prueba de humo post-actualización | Correctivo/Preventivo | Cada despliegue | Automática (`scripts/smoke-test.sh` en CI y en servidor) | Pipeline CI / Operador | No |
| Auditoría de vulnerabilidades (pip-audit / npm audit) | Preventivo | Semanal (Dependabot) + mensual manual | Automática (Dependabot) + manual | Operador (`luis`) | No |
| Revisión de capacidad de disco y memoria | Preventivo | Mensual | Manual | Operador (`luis`) | No |

**Ventana de mantenimiento propuesta:** domingos de 02:00 a 04:00 hora de Bogotá (UTC−5). Coincide con el tráfico más bajo observado en los logs.

---

### Tabla de fin de soporte (EOL)

Fuentes consultadas el 2026-10-17.

| Componente | Versión en uso | Fin de soporte estándar | Fuente | Acción planeada |
|---|---|---|---|---|
| **MySQL Community 8.0** | 8.0.46 | **Abril 2026** 🔴 (ya vencido) | [MySQL Lifecycle](https://endoflife.date/mysql) | **Migrar a MySQL 8.4 LTS** (soporte hasta 2032) antes de fin de año 2026. Planificar migración en sprint S09. |
| **Python 3.10** | 3.10.21 | **Octubre 2026** 🟡 (inminente) | [Python EOL](https://endoflife.date/python) | **Actualizar a Python 3.12** en el Dockerfile del backend. Abrir PR antes del 31 de octubre 2026. |
| **Node.js 20 LTS (Iron)** | 20.20.2 | **Abril 2026** 🔴 (ya vencido — en maintenance) | [Node.js Releases](https://endoflife.date/nodejs) | **Actualizar a Node.js 22 LTS** en los Dockerfiles del frontend. Abrir PR antes de fin de año. |
| Ubuntu Server 24.04 LTS | 24.04 | Mayo 2029 (estándar) / Abril 2034 (ESM) | [Ubuntu Releases](https://ubuntu.com/about/release-cycle) | Sin acción urgente. Revisar en 2028. |
| FastAPI | 0.135.1 | Sin EOL anunciado (activo) | Repositorio de FastAPI | Actualizar via Dependabot. |
| Uvicorn | 0.42.0 | Sin EOL anunciado (activo) | PyPI | Actualizar via Dependabot. |
| Pydantic | 2.12.5 | Sin EOL anunciado (v2 activo) | PyPI | Actualizar via Dependabot. |
| React | 19.2.4 | Sin EOL anunciado (activo) | npm | Actualizar via Dependabot. |
| Vite | 8.0.1 | Sin EOL anunciado (activo) | npm | Actualizar via Dependabot. |
| Expo SDK | 54.0.35 | Expo mantiene los últimos 3 SDKs activos | [Expo SDK Releases](https://docs.expo.dev/versions/latest/) | Monitorear SDK 55/56 cuando salgan; actualizar antes de que SDK 54 quede sin soporte. |
| Caddy | 2.9-alpine | Sin EOL anunciado (activo) | [Caddy GitHub](https://github.com/caddyserver/caddy) | Actualizar via Dependabot (Docker). |
| Uptime Kuma | 1.x | Activo | [Uptime Kuma Releases](https://github.com/louislam/uptime-kuma/releases) | Seguir releases; actualizar cuando salga v2 estable. |
| Docker Engine | 29.x | Activo | [Docker Releases](https://docs.docker.com/engine/release-notes/) | Actualizar junto con el SO con `apt upgrade`. |

> **Componente que llega primero a su EOL:** MySQL 8.0 y Node.js 20 ya superaron su fecha de EOL (abril 2026). El siguiente es Python 3.10 en octubre 2026. La planificación de la migración comienza ahora (sprint S09).

---

### Política de actualizaciones

| Tipo | Plazo máximo | Cómo se decide y ejecuta |
|---|---|---|
| **Parche de seguridad crítico (CVE High/Critical)** | 48 h desde la alerta | Dependabot abre PR con prioridad → revisar impacto → si CI pasa: fusionar → desplegar con `scripts/desplegar.sh` → versión de parche |
| **Parche de seguridad moderado (CVE Medium)** | 7 días | Igual que crítico, pero puede esperar al ciclo semanal de revisión |
| **Actualización de parche (corrección de bugs)** | 14 días | CI en verde → fusionar → versión de parche |
| **Actualización menor (nueva funcionalidad compatible)** | 30 días | Revisar changelog → CI en verde → fusionar → versión menor |
| **Actualización mayor (cambio de versión principal, breaking changes)** | Planificada en sprint | Crear rama de actualización → probar en dev → PR con revisión de `ana` → versión mayor |
| **Actualización de imagen Docker base** | 7 días para seguridad, 30 para menor | PR de Dependabot → CI pasa → fusionar → nueva imagen en GHCR |
| **Migración de componente EOL** | Antes de la fecha de EOL (con 3 meses de margen) | Crear tarea en el backlog → sprint dedicado → pruebas en staging → despliegue en ventana de mantenimiento |

**Enlace a dependabot.yml:** [`.github/dependabot.yml`](../../.github/dependabot.yml)

---

### Resultado de la auditoría de dependencias

Ejecutada el 2026-10-17 sobre el estado actual del repositorio.

#### Backend Python — `uv run pip-audit`

```bash
cd backend
uv run pip-audit
```

| Herramienta | Hallazgo | Severidad | ¿En la imagen desplegada? | Decisión |
|---|---|---|---|---|
| pip-audit | `passlib 1.7.4` — sin mantenimiento activo (no CVE activo conocido) | Informativo | Sí | Monitorear; evaluar reemplazo por `bcrypt` directo o `argon2-cffi` en la siguiente actualización mayor |
| pip-audit | `mysql-connector-python 9.6.0` — sin CVEs activos | Informativo | Sí | Sin acción inmediata |
| pip-audit | Sin CVEs en las demás dependencias de producción | — | — | Sin acción |

#### Frontend web — `npm audit`

```bash
cd frontend
pnpm audit
```

| Herramienta | Hallazgo | Severidad | ¿En la imagen desplegada? | Decisión |
|---|---|---|---|---|
| pnpm audit | Sin vulnerabilidades reportadas en dependencias de producción | — | — | Sin acción |
| pnpm audit | 2 advisories en devDependencies (herramientas de build) | Baja | No (no van en la imagen prod) | Actualizar en el próximo ciclo de Dependabot |

#### App móvil — `npm audit`

```bash
cd app-movil
pnpm audit
```

| Herramienta | Hallazgo | Severidad | ¿En imagen desplegada? | Decisión |
|---|---|---|---|---|
| pnpm audit | Sin CVEs críticos ni altos | — | N/A (Expo build) | Actualizar según lleguen PRs de Dependabot |

#### Imágenes Docker base — Trivy (escaneo de imagen)

```bash
trivy image python:3.10-slim
trivy image node:20-alpine
trivy image mysql:8.0
```

| Herramienta | Imagen | Hallazgo | Severidad | Decisión |
|---|---|---|---|---|
| trivy | `python:3.10-slim` | CVEs de glibc/libssl (varios) | Medium | Migrar a Python 3.12-slim como parte del plan EOL |
| trivy | `node:20-alpine` | Alpine con openssl — algunos advisories | Low/Medium | Migrar a Node.js 22-alpine como parte del plan EOL |
| trivy | `mysql:8.0` | EOL + CVEs sin parche en 8.0 | **High** | **Migrar a `mysql:8.4`** en el siguiente sprint (S09) |

---

## 9.2 Soporte

### Niveles de soporte

| Nivel | Quién (rol) | Resuelve | Horario |
|---|---|---|---|
| **N0** | Ayudas en línea (guía rápida, FAQ) | Dudas de uso general, primeros pasos | Siempre (autoservicio) |
| **N1** | Soporte básico (miembro del equipo de turno) | Preguntas de uso que no cubre el N0, errores visuales, problemas de cuenta | Lunes–viernes 8:00–18:00 hora Bogotá |
| **N2** | Operador (`luis`) | Caídas de servicio, errores del servidor, problemas de respaldo, configuración de Uptime Kuma | Lunes–viernes 8:00–18:00 + alertas fuera de horario si son P1 |
| **N3** | Administradora (`ana`) | Problemas de seguridad, migraciones, rollback, cambios en infraestructura, incidentes sin resolver por N2 | 24/7 para P1 |

**Cobertura cuando la persona no está disponible:**

| Rol ausente | Cobertura |
|---|---|
| `luis` (N2) | `ana` asume N2 directamente; si `ana` también está fuera, documentar incidente y resolver en la siguiente jornada (solo si no es P1) |
| `ana` (N3) | `luis` gestiona hasta donde puede y documenta; si es P1, `ana` debe estar disponible (acordar con el equipo) |

---

**Canal único de reporte:** Telegram — grupo **BookyHome-Ops** (@bookyhome_ops) y formulario de issues de GitHub.

Para reportes externos (usuarios): [formulario de falla](https://github.com/bookyhome/biblioteca/issues/new?template=reporte-de-falla.md).

---

### Matriz de prioridad y tiempos de respuesta

| Prioridad | Definición | Primera respuesta | Solución o alternativa |
|---|---|---|---|
| **P1 — Crítico** | Producción caída, login sin funcionar, pérdida de datos | **30 minutos** (24/7) | 2 horas |
| **P2 — Alto** | Función crítica degradada (checkout lento, respaldo fallido, monitor en amarillo) | **2 horas** (horario laboral) | 8 horas |
| **P3 — Medio** | Función secundaria con error, bug no bloqueante | **1 día hábil** | 5 días hábiles |
| **P4 — Bajo** | Error cosmético, texto incorrecto, mejora menor | **3 días hábiles** | Próximo sprint |

> **¿Podemos cumplir estos tiempos?** Con el equipo actual de 2 personas (ana + luis), P1 y P2 son alcanzables si los dos miembros están disponibles. P1 requiere que `ana` esté siempre reachable por Telegram. Los tiempos de P3 y P4 son conservadores y realistas.

---

### Runbooks

| Runbook | Alerta o síntoma | Enlace | Probado por (rol, otro equipo) | Correcciones tras la prueba |
|---|---|---|---|---|
| `salud-en-rojo.md` | Monitor "Salud API" 🔴 DOWN en Uptime Kuma | [`docs/runbooks/salud-en-rojo.md`](../runbooks/salud-en-rojo.md) | — (pendiente de prueba por equipo externo) | — |
| `respaldo-diario-sin-latido.md` | Monitor "Respaldo diario" 🔴 DOWN en Uptime Kuma | [`docs/runbooks/respaldo-diario-sin-latido.md`](../runbooks/respaldo-diario-sin-latido.md) | Basado en incidente real 2026-10-17 (cron detenido) | Añadida sección de `systemctl enable cron` |

---

## 9.3 Capacitación

### Plan por público

| Público | Objetivos observables | Sesión (duración, modalidad) | Materiales | Cómo se evalúa |
|---|---|---|---|---|
| **Usuarios finales — compradores** | Registrarse, buscar un libro y agregarlo al carrito sin ayuda en menos de 2 minutos | 30 min, presencial o videoconferencia | [Guía rápida](../ayuda/guia-rapida.md) + datos de prueba (cuenta demo + catálogo de ejemplo) | Tarea de verificación: publicar una compra de prueba. Encuesta de satisfacción de 3 preguntas. |
| **Usuarios finales — vendedores** | Registrar una librería y publicar un libro (con imagen y precio) sin ayuda en menos de 5 minutos | 45 min, presencial o videoconferencia | [Guía rápida](../ayuda/guia-rapida.md) (sección vendedores) + tienda de prueba precreada | Tarea: publicar un libro de prueba. Se verifica que aparezca en el catálogo. |
| **Soporte N1** | Identificar y clasificar los 5 tipos de error más frecuentes (cuenta, catálogo, carrito, pago, app móvil) y escalar correctamente | 60 min, presencial | [Guía rápida](../ayuda/guia-rapida.md) + [Preguntas frecuentes](../ayuda/preguntas-frecuentes.md) + formulario de issues | Simulacro: resolver 3 casos de soporte de práctica con el tiempo y la escalada correcta |
| **Operación N2** | Seguir los dos runbooks de principio a fin, verificar resolución y registrar el incidente | 90 min, presencial (en el servidor) | [Runbooks](../runbooks/) + acceso SSH de prueba + Uptime Kuma de staging | Ejecutar el runbook `salud-en-rojo.md` en entorno de staging con falla simulada. Se mide el tiempo hasta resolución. |

---

### Cronograma de capacitaciones

| Fecha | Público | Responsable (rol) | Participantes esperados |
|---|---|---|---|
| 2026-10-24 | Soporte N1 | Administradora (`ana`) | 2 (miembros del equipo) |
| 2026-10-25 | Operación N2 | Administradora (`ana`) + Operador (`luis`) | 1 (operador nuevo o de reemplazo) |
| 2026-10-28 | Usuarios finales — vendedores (piloto) | Operador (`luis`) | 3 vendedores piloto |
| 2026-11-01 | Usuarios finales — compradores | Cualquier miembro del equipo | Según apertura al público |

---

## 9.4 Ayudas en línea

| Ayuda | Enlace en el repositorio | Versión del software | Probada por (rol) |
|---|---|---|---|
| Guía rápida | [`docs/ayuda/guia-rapida.md`](../ayuda/guia-rapida.md) | 1.0.1 | — (pendiente prueba por equipo externo) |
| Preguntas frecuentes | [`docs/ayuda/preguntas-frecuentes.md`](../ayuda/preguntas-frecuentes.md) | 1.0.1 | — (pendiente prueba por equipo externo) |

**Dónde se enlazan:**

- **README raíz del repositorio:** sección "Ayuda y soporte" enlaza ambas guías, el formulario de falla y los runbooks.
- **Formulario de reporte de falla** (`.github/ISSUE_TEMPLATE/config.yml`): enlaza la guía rápida y las preguntas frecuentes antes de abrir un issue.
- **Aplicación web (frontend):** se recomienda añadir un enlace de "Ayuda" en el Footer hacia `docs/ayuda/guia-rapida.md` (publicada en GitHub Pages o desplegada junto a la documentación).

---

## Lista de verificación de cierre

- [x] Calendario de mantenimiento, tabla EOL y política de actualizaciones
- [x] Dependabot activo (`.github/dependabot.yml`) — 5 ecosistemas: uv (backend), npm (frontend), npm (app-movil), docker, github-actions
- [x] Auditoría con pip-audit, pnpm audit y Trivy — hallazgos documentados con decisión
- [x] Niveles de soporte N0–N3, canal único (Telegram + GitHub issues), matriz de prioridad y tiempos propuestos
- [x] Runbooks documentados: `salud-en-rojo.md` y `respaldo-diario-sin-latido.md`
- [ ] Runbooks probados por otra persona (pendiente: prueba por equipo externo)
- [x] Plan de capacitación por público (compradores, vendedores, N1, N2)
- [x] Guía rápida (`docs/ayuda/guia-rapida.md`) creada y enlazada
- [x] Preguntas frecuentes (`docs/ayuda/preguntas-frecuentes.md`) creadas y enlazadas
- [ ] Guía rápida y FAQ probadas por persona externa (pendiente)
- [x] Ningún secreto ni dato personal real en el repositorio o el entregable

---

## Respuestas a las preguntas guía

**¿Qué componente llega primero a su fin de soporte? ¿Cuándo empiezas a planearlo?**

MySQL 8.0 y Node.js 20 ya superaron su EOL (abril 2026). Python 3.10 vence en octubre 2026 (este mes). La planificación comienza ahora: se abren tareas para migrar Python 3.10 → 3.12 y MySQL 8.0 → 8.4 en el sprint S09, antes de fin de año 2026.

**¿Quién cubre cada nivel de soporte? ¿Y cuando esa persona no esté?**

N0: las guías en línea. N1: cualquier miembro del equipo. N2: `luis` (operador); si no está disponible, `ana` asume. N3: `ana` (administradora); para P1 es irremplazable hasta que se sume otro miembro con acceso. El equipo es pequeño: la redundancia real es entre ana y luis, y la documentación (runbooks, guías) reduce la dependencia de personas específicas.

**¿Qué tiempos de respuesta puedes cumplir de verdad?**

P1 (30 min) y P2 (2 h) son alcanzables solo si ambas personas están disponibles y con Telegram activo. Fuera de horario laboral, P1 es la única emergencia que justifica interrumpir. P3 y P4 (días hábiles) son completamente alcanzables.

**¿Quiénes usarán tu software y qué debe saber hacer cada uno el primer día?**

- **Comprador:** buscar un libro, agregarlo al carrito, completar una compra.
- **Vendedor:** registrar su librería y publicar su primer libro.
- **Soporte N1:** usar la guía rápida y las FAQ para resolver dudas comunes, y saber cuándo escalar.
- **Operador N2:** seguir los runbooks y verificar que el sistema esté sano (Uptime Kuma + smoke test).
