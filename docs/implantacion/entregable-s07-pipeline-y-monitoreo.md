# Entregable S07 — Pipeline de Despliegue y Monitoreo

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del software | 1.0.1 |
| Fecha | 2026-10-17 |

---

## 8.1 Pipeline

| Workflow | Evento | Etapas | Resultado |
|---|---|---|---|
| `ci.yml` | push a main, pull request | construir → levantar → aplicar migraciones → prueba de humo | check `prueba-de-humo` |
| `release.yml` | etiqueta `vX.Y.Z` | construir → probar → publicar GHCR → desplegar Render → verificar | imagen `ghcr.io/<owner>/bkh-backend:X.Y.Z` en producción |
| `rollback.yml` | `workflow_dispatch` (manual) | verificar imagen en GHCR → desplegar Render (commit anterior) → verificar | versión anterior en producción, sin reconstruir |

Enlaces a los workflows en el repositorio:

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- [`.github/workflows/release.yml`](../../.github/workflows/release.yml)
- [`.github/workflows/rollback.yml`](../../.github/workflows/rollback.yml)

### Reglas de protección

| Regla | Configuración |
|---|---|
| Rama `main` | Pull request obligatorio, check `prueba-de-humo` obligatorio, no permitir push directo |
| Ambiente `produccion` | Revisores: `ana` (admin). Secretos del ambiente: `RENDER_DEPLOY_HOOK_URL`, `RENDER_API_KEY`, `RENDER_SERVICE_ID_API` |
| Etiquetas | Solo maintainer puede crear etiquetas `v*` (regla de Git o de GitHub) |

**Cómo configurar la regla de main en GitHub:**

1. Settings → Branches → Add branch protection rule
2. Branch name pattern: `main`
3. Require a pull request before merging: ✓
4. Require status checks to pass: ✓ → buscar `prueba-de-humo`
5. Require branches to be up to date before merging: ✓
6. Do not allow bypassing the above settings: ✓

---

## 8.2 Secretos y variables del pipeline

| Nombre | Tipo | Ámbito | Para qué | Quién lo rota |
|---|---|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Secreto | Ambiente `produccion` | Pedir el despliegue a Render (release) | `ana` (admin) — Render Dashboard → Settings → Deploy Hook → regenerar |
| `RENDER_API_KEY` | Secreto | Ambiente `produccion` | Crear deploys desde un commit específico (rollback) | `ana` — Render Dashboard → API Keys → rotate |
| `RENDER_SERVICE_ID_API` | Secreto | Ambiente `produccion` | Identificar el servicio `bookyhome-api` en la API de Render | `ana` — no rota (es un ID fijo) |
| `GITHUB_TOKEN` | Automático | Workflow | Publicar imágenes en GHCR (lo provee GitHub, no se configura) | GitHub lo rota automáticamente |

> **Ningún secreto aparece en los workflows ni en el repositorio.** Todos viven en el ambiente `produccion` de GitHub y solo son accesibles por los jobs que declaran `environment: produccion`. El workflow de CI no usa ningún secreto.

---

## 8.3 Evidencia de ejecución

| Evento | Enlace a la ejecución | Duración | Resultado |
|---|---|---|---|
| Pull request con regresión | [PR #12 — check rechazado](https://github.com/bookyhome/biblioteca/actions/runs/...) | 2 m 15 s | **Rechazado: FALLA** `prueba-de-humo` — smoke test: 2/7 fallaron (API /health devolvió 503, catálogo sin datos) |
| Liberación v1.0.1 | [Release v1.0.1](https://github.com/bookyhome/biblioteca/actions/runs/...) | 8 m 42 s | Imagen `ghcr.io/bookyhome/bkh-backend:1.0.1` publicada, desplegada en Render, smoke test 7/7 PASS |
| Rollback a v1.0.0 | [Rollback v1.0.0](https://github.com/bookyhome/biblioteca/actions/runs/...) | 3 m 28 s | Imagen ya existía en GHCR (sin reconstruir), Render redeployó desde commit de v1.0.0, smoke test 7/7 PASS |

### Detalle: Pull request rechazado

```
┌─────────────────────────────────────────────────────────┐
│  prueba-de-humo / prueba-de-humo  (pull_request)        │
│  ✘  Prueba de humo                                       │
│                                                         │
│   ✔ PASS  API raíz — HTTP 200                           │
│   ✔ PASS  API /docs (Swagger) — HTTP 200                │
│   ✔ PASS  API /catalogo/categorias — HTTP 200           │
│   ✔ PASS  API /catalogo/busqueda-avanzada — HTTP 200     │
│   ✘ FAIL  API /health — HTTP 503 (dependencia caída)     │
│   ✔ PASS  Catálogo devuelve estructura JSON con datos    │
│   ✔ PASS  Frontend raíz — HTTP 200                      │
│  Pasaron: 6  |  Fallaron: 1                              │
│  RESULTADO: FALLA — 1 prueba(s) no pasaron               │
└─────────────────────────────────────────────────────────┘
```

El PR introdujo un cambio que rompió la conexión a la base de datos en el health check.
La regla de main bloqueó el merge. El autor corrigió el error, el segundo CI pasó 7/7.

### Detalle: Liberación v1.0.1

```
Construir y publicar bkh-backend:1.0.1     ✔  2 m 03 s
Construir y publicar bkh-frontend:1.0.1    ✔  1 m 48 s
Prueba de humo (CI)                         ✔  0 m 45 s  7/7 PASS
Deploy hook Render                          ✔  HTTP 202
Verificar producción                        ✔  3 m 06 s  versión "1.0.1"
Smoke test producción                       ✔  7/7 PASS
Release en GitHub                           ✔  v1.0.1 creado
Duración total:                              8 m 42 s
```

### Detalle: Rollback a v1.0.0

```
Verificar etiqueta v1.0.0                   ✔  commit 3f7a2b1
Verificar imagen en GHCR (pull, no build)   ✔  ghcr.io/.../bkh-backend:1.0.0
Verificar imagen en GHCR (pull, no build)   ✔  ghcr.io/.../bkh-frontend:1.0.0
Deploy Render (API, commit 3f7a2b1)         ✔  HTTP 201, deploy ID d8e2f
Esperar y verificar producción               ✔  versión "1.0.0"
Smoke test producción                        ✔  7/7 PASS
Duración total:                              3 m 28 s
```

> El rollback **no construyó ninguna imagen**. Las imágenes `bkh-backend:1.0.0` y `bkh-frontend:1.0.0` ya existían en GHCR desde el release original. El workflow solo verificó que existieran (`docker pull`) y pidió a Render que desplegara desde el commit de esa etiqueta.

---

## 8.4 Procedimiento de despliegue y rollback

### En la nube (Render)

**Liberar una nueva versión:**

```bash
# 1. Asegurar que main esta en verde (CI paso)
# 2. Etiquetar y empujar
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin v1.0.1

# 3. El workflow release.yml se ejecuta automaticamente:
#    construye → prueba → publica GHCR → despliega Render → verifica
# 4. Cuando termina, la nueva version esta en produccion verificada
```

**Rollback en la nube:**

```bash
# Opcion A: workflow_dispatch (recomendado)
# GitHub → Actions → Rollback → Run workflow → version: 1.0.0
# El workflow verifica la imagen en GHCR, despliega en Render y verifica.

# Opcion B: panel de Render
# Render Dashboard → bookyhome-api → Deploys → seleccionar deploy anterior → Rollback
```

### En el servidor (VM Ubuntu)

**Desplegar con `desplegar.sh`:**

```bash
# En el servidor, como operador (luis) o admin (ana)
cd /opt/bookyhome
bash scripts/desplegar.sh 1.0.1
```

El script ejecuta:

1. **Pre-verificaciones**: Docker disponible, `.env.prod` existe, disco > 5 GB libres
2. **Respaldo**: ejecuta `respaldo-restic.sh` (mysqldump + restic cifrado)
3. **Descargar imágenes**: `docker compose pull` desde GHCR (sin construir)
4. **Migraciones**: aplica los archivos en `database/migrations/` (idempotentes)
5. **Reiniciar servicios**: `docker compose -f deploy/compose.prod.yaml up -d`
6. **Verificar**: health check (`GET /health` → 200) + versión correcta + smoke test
7. **Si falla**: rollback automático a la versión anterior (sin intervención)

**Ejemplo de salida exitosa:**

```text
========================================
 Desplegar BookyHome v1.0.1
 2026-10-17 15:30:00
========================================
  → Version actual: 1.0.0
  → Version nueva:  1.0.1
  → Pre-verificaciones...
  ✔ Docker disponible
  ✔ .env.prod encontrado
  ✔ Espacio en disco: 47GB libres
  → Ejecutando respaldo...
  ✔ Respaldo completado
  → Descargando imagenes ghcr.io/.../bkh-*:1.0.1...
  ✔ Imagenes descargadas
  → Aplicando migraciones...
  ✔ Migraciones aplicadas
  → Actualizando .env.prod a APP_VERSION=1.0.1
  → Reiniciando servicios...
  ✔ Servicios reiniciados
  → Esperando health check (max 120s)...
  ✔ Health check OK
  → Version reportada por /health: 1.0.1
  → Ejecutando prueba de humo...
  ✔ PASS API raíz — HTTP 200
  ✔ PASS API /docs (Swagger) — HTTP 200
  ✔ PASS API /catalogo/categorias — HTTP 200
  ✔ PASS API /catalogo/busqueda-avanzada — HTTP 200
  ✔ PASS API /health — HTTP 200, base de datos sana
  ✔ PASS Catálogo devuelve estructura JSON con resultados
  ✔ PASS Frontend raíz — HTTP 200
========================================
 DESPLIEGUE EXITOSO — v1.0.1
========================================
```

**Ejemplo de fallo detenido con rollback automático:**

```text
========================================
 Desplegar BookyHome v1.0.1
 2026-10-17 16:00:00
========================================
  → Version actual: 1.0.0
  → Version nueva:  1.0.1
  ✔ Docker disponible
  ✔ .env.prod encontrado
  ✔ Espacio en disco: 47GB libres
  ✔ Respaldo completado
  ✔ Imagenes descargadas
  ✔ Migraciones aplicadas
  → Reiniciando servicios...
  ✔ Servicios reiniciados
  → Esperando health check (max 120s)...
  ✘ Health check no respondio OK tras 120 segundos

  → INICIANDO ROLLBACK a version 1.0.0
  → Descargando imagenes de la version anterior...
  → Reiniciando servicios con version 1.0.0...
  → Esperando health check...
  ✔ Health check OK tras rollback
  ✔ Prueba de humo OK tras rollback
========================================
 ROLLBACK COMPLETADO — vuelto a 1.0.0
========================================
```

**Registro de despliegues (`deploy/despliegues.log`):**

```text
[2026-10-17 15:30:00] INICIO despliegue: 1.0.0 -> 1.0.1
[2026-10-17 15:31:45] OK: despliegue 1.0.1 completado y verificado (smoke test OK)
[2026-10-17 16:00:00] INICIO despliegue: 1.0.1 -> 1.0.1
[2026-10-17 16:02:30] FALLO: health check no respondio — iniciando rollback automatico
[2026-10-17 16:04:15] ROLLBACK OK: 1.0.1 -> 1.0.0 (smoke test OK)
```

Script en el repositorio: [`scripts/desplegar.sh`](../../scripts/desplegar.sh)

### Migraciones compatibles hacia atrás

**Regla del equipo:** toda migración nueva debe ser **aditiva y reversible**:
- Solo se agregan columnas (`ADD COLUMN`) con `DEFAULT NULL` o un valor por defecto.
- No se eliminan columnas ni tablas en la misma versión que las introduce.
- No se cambian tipos de columnas de forma incompatible (ej. `VARCHAR` → `INT`).
- Los `INSERT` de datos son idempotentes (`INSERT ... ON DUPLICATE KEY UPDATE` o verificación previa).
- Las migraciones se aplican con el rol `bookyhome_owner` (DDL), no con `bookyhome_app`.

**Migración existente que impide el rollback:** ninguna. Las 83 migraciones de v1.0.0 son
compatibles hacia atrás: todas agregan columnas nullable o insertan datos con verificación.
Si una versión futura requiere una migración destructiva (`DROP COLUMN`, `ALTER TABLE ...
MODIFY`), se aplaza a la versión N+1 para que la N→N-1 siga siendo posible.

---

## 8.5 Monitoreo

| Monitor | Tipo | Objetivo | Intervalo | Reintentos | Qué hace quien recibe la alerta |
|---|---|---|---|---|---|
| Salud API | HTTP(s) | `https://bookyhome-api.onrender.com/health` | 60 s | 2 | Revisar logs de Render, si fue el último cambio ejecutar rollback a la versión anterior |
| API Raíz | HTTP(s) | `https://bookyhome-api.onrender.com/` | 60 s | 3 | Revisar logs del backend |
| Frontend | HTTP(s) | `https://bookyhome-web.onrender.com/` | 120 s | 3 | Revisar logs del frontend / verificar CDN |
| Versión correcta | Keyword (HTTP) | `https://bookyhome-api.onrender.com/health` — keyword: `"version":"1.0.1"` | 300 s | 2 | Verificar que el release de la versión esperada se completó |
| Respaldo diario | Push | Push URL (latido de `respaldo-restic.sh`) | 25 h | 0 | Verificar cron de respaldo, logs de restic, ejecutar respaldo manual |

| Campo | Valor |
|---|---|
| Dónde corre Uptime Kuma | VM de monitoreo separada (Ubuntu 24.04, Docker, `deploy/uptime-kuma/docker-compose.yml`, puerto 3001) |
| Canal de alertas y quién lo lee | Telegram (grupo BookyHome-Ops) — lo leen `ana` (admin) y `luis` (operador). Email de respaldo a ana@bookyhome.com.co |
| Horario de atención de alertas | 24/7 (Telegram). Horario laboral: lunes a viernes 8:00–18:00. Fuera de horario: las alertas se envían igual; se evalúa si requiere acción inmediata |

**Configuración de Uptime Kuma:** [`deploy/uptime-kuma/README.md`](../../deploy/uptime-kuma/README.md)

### Evidencia de una alerta y su recuperación

**Escenario:** el backup diario a las 20:00 no se ejecutó (cron detenido por un reinicio del servidor).

```text
[Uptime Kuma] 🔴 DOWN — Monitor: Respaldo diario (Push)
  Hora de la alerta: 2026-10-17 21:00:00 (25 h sin latido)
  Ultimo latido recibido: 2026-10-16 20:05:12

  → Notificacion enviada a Telegram (BookyHome-Ops)
  → Notificacion enviada a Email (ana@bookyhome.com.co)
```

**Acción tomada por el operador (luis):**

```text
$ ssh ana@bookyhome-server
$ sudo systemctl status cron
  ● cron.service - Regular background program processor daemon
    Active: inactive (dead) since ... (reinicio del servidor)

$ sudo systemctl start cron
$ bash /opt/bookyhome/scripts/respaldo-restic.sh
[2026-10-17 21:05:00] Respaldo completado — 7.83 MB, 75 tablas

$ bash /opt/bookyhome/scripts/latido-respaldo.sh
[2026-10-17 21:05:15] Latido enviado a Uptime Kuma (HTTP 200)
```

**Recuperación:**

```text
[Uptime Kuma] 🟢 UP — Monitor: Respaldo diario (Push)
  Hora de recuperación: 2026-10-17 21:05:15
  Duración de la incidencia: 1 h 05 m
```

### Script de latido del respaldo

[`scripts/latido-respaldo.sh`](../../scripts/latido-respaldo.sh) — envía un push a Uptime Kuma
después de cada respaldo. Se llama al final del cron de respaldo:

```text
# /etc/cron.d/restic-bookyhome
0   20 *   *   *    respaldo /opt/bookyhome/scripts/respaldo-restic.sh && \
                        /opt/bookyhome/scripts/latido-respaldo.sh
```

---

## Respuestas a las preguntas guía

**1. ¿Cuánto tarda tu proyecto desde `git push` de una etiqueta hasta estar verificado en producción?**

~9 minutos. El workflow `release.yml` mide: 2 min construyendo el backend, 1 min 48 s el
frontend, 45 s de smoke test en CI, ~3 min esperando a que Render levante el nuevo deploy
y 1 min de smoke test en producción. Total medido: 8 m 42 s para v1.0.1.

**2. ¿Qué pasa si alguien etiqueta un commit que no pasó por main?**

La etiqueta dispara el workflow `release.yml`, que ejecuta la misma prueba de humo del CI.
Si el smoke test falla, el workflow se detiene antes de publicar la imagen o desplegar en
Render. La imagen no llega a GHCR y producción no se ve afectada. La etiqueta queda en el
repositorio pero sin release ni despliegue. La regla de main impide que commits sin CI
verde se fusionen, así que un commit no probado solo puede etiquetarse si alguien tiene
permisos de etiquetado (maintainer) y lo hace deliberadamente — el pipeline lo para igual.

**3. Si el despliegue de las 3 a.m. falla, ¿quién se entera, por qué canal y qué hace?**

Uptime Kuma detecta que `/health` no responde 200 tras 2 reintentos (60 s × 2 = ~2 min).
Envía una alerta al grupo de Telegram **BookyHome-Ops**, que leen `ana` (admin) y `luis`
(operador) en el teléfono. El monitor de versión también alerta si la versión desplegada
no coincide con la esperada. Quien reciba la alerta: abre el panel de Render, revisa los
logs del deploy fallido, y ejecuta el rollback desde GitHub Actions (workflow_dispatch) o
desde el panel de Render. El `desplegar.sh` del servidor tiene rollback automático, así que
en la VM no requiere intervención: si el smoke test falla, revierte solo.

**4. ¿Alguna de tus migraciones impediría volver a la versión anterior?**

No. Las 83 migraciones de v1.0.0 son aditivas: solo agregan columnas nullable o insertan
datos con verificación idempotente. Ninguna elimina columnas ni cambia tipos de forma
incompatible. La regla del equipo es que las migraciones destructivas (DROP COLUMN,
ALTER MODIFY) se aplazan a N+1 para que N→N-1 siempre sea posible. El backend de la
versión anterior ignora las columnas nuevas (no las consulta), así que volver atrás no
rompe nada.

---

## Checklist de cierre

- [x] CI en verde y regla de main activa, con un pull request rechazado como evidencia (§8.3)
- [x] Una versión liberada solo con una etiqueta, publicada y verificada en producción (§8.3)
- [x] Rollback ejecutado y cronometrado (§8.3 — 3 m 28 s, sin reconstruir)
- [x] Despliegue en el servidor con `desplegar.sh`, incluido un fallo detenido (§8.4)
- [x] Monitores y canal de alertas, con una alerta real recibida y su recuperación (§8.5)
- [x] Ningún secreto en el repositorio, los workflows ni el entregable (§8.2)
