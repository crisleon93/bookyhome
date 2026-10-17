# Entregable S04 — Procedimiento de Despliegue (Plan de Instalación v1)

| Campo                    | Valor                        |
|--------------------------|------------------------------|
| Proyecto                 | BookyHome                    |
| Equipo                   | Equipo BookyHome             |
| Versión del plan         | v1                           |
| Versión del software     | 1.0.0                        |
| Fecha                    | 2026-10-17                   |

---

## 5.1 Proceso de liberación

### Pasos

| # | Paso | Comando o acción | Resultado esperado |
|---|---|---|---|
| 1 | Pruebas en verde | CI del repositorio (GitHub Actions / prueba de humo local) | Todos los checks pasan; `scripts/smoke-test.sh` retorna código 0 |
| 2 | Actualizar CHANGELOG | Editar `CHANGELOG.md`, mover entradas de `[Unreleased]` a `[1.0.0]` | Sección `[1.0.0]` completa con la fecha |
| 3 | Crear etiqueta | `git tag -a v1.0.0 -m "Versión 1.0.0 — primera versión de producción"` | Etiqueta anotada creada localmente |
| 4 | Publicar etiqueta | `git push origin v1.0.0` | Etiqueta visible en GitHub → Releases |
| 5 | Construir imagen backend | `docker build -t ghcr.io/bookyhome/bkh-backend:1.0.0 --build-arg APP_VERSION=1.0.0 ./backend` | Imagen listada: `docker images \| grep 1.0.0` |
| 6 | Construir imagen frontend | `docker build -t ghcr.io/bookyhome/bkh-frontend:1.0.0 --build-arg APP_VERSION=1.0.0 ./frontend` | Imagen listada con la etiqueta |
| 7 | Publicar imágenes | `docker push ghcr.io/bookyhome/bkh-backend:1.0.0` y `bkh-frontend:1.0.0` | Imágenes en el registro de contenedores (GHCR) |
| 8 | Crear notas de versión en GitHub | Ir a Releases → "Draft a new release" → seleccionar `v1.0.0` → pegar sección del CHANGELOG | Release publicado en GitHub |

### Esquema SemVer

| Tipo de cambio | Incrementa | Criterio |
|---|---|---|
| Cambio incompatible en la API o la BD | **MAYOR** (X.0.0) | Eliminar endpoint, cambiar estructura de tabla sin migración compatible hacia atrás |
| Nueva funcionalidad compatible | **MENOR** (0.X.0) | Nuevo endpoint, nueva pantalla, nueva tabla con FK opcional |
| Corrección de errores o ajuste de datos | **PARCHE** (0.0.X) | Fix de bug, corrección de migración de datos, ajuste de estilo |

### Enlace al CHANGELOG

[`CHANGELOG.md`](../../CHANGELOG.md) en la raíz del repositorio.

---

## 5.2 Despliegue en servidor Linux

### Estructura en el servidor

```
/opt/bookyhome/
├── deploy/
│   ├── compose.prod.yaml       ← Compose de producción (sin volúmenes de código)
│   ├── Caddyfile.prod          ← Reverse proxy con TLS Let's Encrypt
│   └── .env.prod               ← Variables de entorno (NO en el repo)
├── scripts/
│   ├── respaldar.sh
│   ├── restaurar.sh
│   ├── verificar-requisitos.sh
│   └── smoke-test.sh
└── backups/                    ← Respaldos generados localmente
```

### Variables de entorno

| Variable | Propósito | Ejemplo (ficticio) |
|---|---|---|
| `APP_VERSION` | Versión desplegada | `1.0.0` |
| `DB_PASSWORD` | Contraseña de MySQL | `S3cr3t0Fuerte!` |
| `DB_NAME` | Nombre de la base de datos | `bookyhome` |
| `SECRET_KEY` | Clave JWT (64 hex aleatorios) | `a1b2c3...` |
| `PUBLIC_API_URL` | URL pública de la API | `https://api.bookyhome.com.co` |
| `FRONTEND_URL` | URL del frontend | `https://bookyhome.com.co` |
| `VITE_API_BASE_URL` | URL de la API para el frontend | `https://api.bookyhome.com.co` |
| `MAIL_USERNAME` | Correo para envíos transaccionales | `noreply@bookyhome.com.co` |
| `GEMINI_API_KEY` | Clave del asistente IA | `AIza...` |

### Instalación inicial

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Verificar requisitos | `bash scripts/verificar-requisitos.sh` | `Resultado: CUMPLE LOS REQUISITOS MÍNIMOS` (código 0) |
| 2 | Crear carpeta del proyecto | `sudo mkdir -p /opt/bookyhome && sudo chown $USER: /opt/bookyhome` | Carpeta creada con permisos del usuario de despliegue |
| 3 | Clonar el repositorio | `git clone <url-repo> /opt/bookyhome && cd /opt/bookyhome` | Carpeta con todos los archivos del proyecto |
| 4 | Configurar variables de entorno | `cp deploy/env.prod.example deploy/.env.prod && nano deploy/.env.prod` | Archivo `deploy/.env.prod` con todos los valores completados |
| 5 | Instalar Caddy (servidor) | `sudo apt install -y caddy` | `caddy version` muestra v2.x |
| 6 | Descargar imágenes | `APP_VERSION=1.0.0 docker compose -f deploy/compose.prod.yaml pull` | Imágenes descargadas desde el registro |
| 7 | Levantar servicios | `APP_VERSION=1.0.0 docker compose -f deploy/compose.prod.yaml up -d` | Los cuatro contenedores en estado `Up (healthy)` |
| 8 | Aplicar migraciones (primera vez) | `for f in database/migrations/*.sql; do docker compose -f deploy/compose.prod.yaml exec -T mysql mysql -uroot -p"${DB_PASSWORD}" bookyhome < "$f"; done` | Cada migración sin errores de SQL |
| 9 | Respaldo post-instalación | `bash scripts/respaldar.sh` | Archivo `.sql.gz` en `backups/` con tamaño > 0 |
| 10 | Prueba de humo | `bash scripts/smoke-test.sh https://api.bookyhome.com.co https://bookyhome.com.co` | `RESULTADO: OK — todas las pruebas pasaron` |

### Actualización

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Respaldo previo | `bash scripts/respaldar.sh` | Archivo de respaldo datestampado en `backups/` |
| 2 | Bajar el repositorio | `git pull origin main` | Últimos archivos incluyendo las nuevas migraciones |
| 3 | Descargar nueva imagen | `APP_VERSION=1.0.1 docker compose -f deploy/compose.prod.yaml pull` | Nueva imagen descargada |
| 4 | Recrear contenedores | `APP_VERSION=1.0.1 docker compose -f deploy/compose.prod.yaml up -d --no-deps backend frontend` | Contenedores reiniciados con la nueva versión; MySQL sigue corriendo |
| 5 | Aplicar migraciones nuevas | `bash scripts/aplicar-migraciones-nuevas.sh` | Solo las migraciones no aplicadas se ejecutan |
| 6 | Prueba de humo | `bash scripts/smoke-test.sh https://api.bookyhome.com.co https://bookyhome.com.co` | `RESULTADO: OK` |

### Rollback

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Detener los servicios (sin BD) | `docker compose -f deploy/compose.prod.yaml stop backend frontend caddy` | Solo mysql sigue corriendo |
| 2 | Restaurar el respaldo de BD | `bash scripts/restaurar.sh --archivo backups/<archivo-pre-update>.sql.gz --base bookyhome` | Todos los conteos de tablas coinciden con el pre-actualización |
| 3 | Volver a la imagen anterior | `APP_VERSION=1.0.0 docker compose -f deploy/compose.prod.yaml up -d --no-deps backend frontend caddy` | Contenedores reiniciados con la versión anterior |
| 4 | Prueba de humo | `bash scripts/smoke-test.sh https://api.bookyhome.com.co https://bookyhome.com.co` | `RESULTADO: OK` |

### Clasificación de migraciones

| Migración | Tipo de cambio | ¿Compatible hacia atrás? |
|---|---|---|
| `001`–`003` | Columnas nuevas con `DEFAULT NULL` en tablas existentes | ✅ Sí — la versión anterior ignora columnas extra |
| `005` — verificación de correo | Columnas `email_verificado`, `token_verificacion` con `DEFAULT NULL` | ✅ Sí |
| `006`–`009` | Nuevas tablas (tickets, mensajes, tokens) | ✅ Sí — no afectan tablas existentes |
| `010` — ISBN a libros | `ALTER TABLE libros ADD COLUMN isbn VARCHAR(13)` | ✅ Sí — columna nullable |
| `017` — libros digitales | Nueva columna `archivo_digital` y tabla `acceso_libros_digitales` | ✅ Sí |
| `023`–`059` | Inserción y corrección de datos de prueba/seed | ✅ Sí — DML idempotente con `INSERT IGNORE` / `UPDATE` |
| `060`–`083` | Datos de prueba, triggers, comisiones, notificaciones | ✅ Sí — ninguna elimina columnas ni cambia tipos |

> Todas las migraciones de la v1.0.0 son compatibles hacia atrás: agregan columnas nullable o insertan datos. Ninguna elimina columnas, cambia tipos de datos existentes ni elimina tablas, por lo que un rollback de la aplicación sin restaurar la BD es posible para esta versión.

### Evidencia (servidor local / laboratorio)

Prueba de humo ejecutada el 2026-10-17 con los tres contenedores de Docker Compose corriendo localmente:

```
========================================
 Prueba de humo — BookyHome
 API:      http://localhost:8000
 Frontend: http://localhost:5173
 Fecha:    2026-10-17 12:35:33
========================================
  → Comprobando API (http://localhost:8000)...
  ✔ PASS API raíz — HTTP 200
  ✔ PASS API /docs (Swagger) — HTTP 200
  ✔ PASS API /catalogo/categorias — HTTP 200
  ✔ PASS API /catalogo/busqueda-avanzada — HTTP 200
  → Comprobando Frontend (http://localhost:5173)...
  ✔ PASS Frontend raíz — HTTP 200
========================================
 Pasaron: 5  |  Fallaron: 0
========================================
RESULTADO: OK — todas las pruebas pasaron
```

---

## 5.3 Despliegue en la nube

### Componentes

| Componente | Proveedor y plan | Región | Configuración |
|---|---|---|---|
| API (backend FastAPI) | **Render** — Web Service (Free) | Oregon (US West) | Blueprint `deploy/render.yaml`; imagen Docker construida desde `backend/Dockerfile` |
| Frontend (build estático) | **Render** — Static Site (Free) | CDN global | Blueprint `deploy/render.yaml`; `pnpm run build` → `frontend/dist` |
| Base de datos | **Neon** — Free tier (PostgreSQL) | AWS us-east-1 | `DATABASE_URL` configurada en el panel de Render como variable de entorno |

> **Nota sobre la base de datos:** BookyHome usa MySQL 8 en desarrollo. Neon ofrece PostgreSQL gestionado. Para la nube con Render+Neon se requiere adaptar el driver de conexión (`asyncpg` / `psycopg2`) y verificar la compatibilidad de las migraciones SQL (principalmente las funciones específicas de MySQL como `NOW()`, `AUTO_INCREMENT`). Alternativa sin cambio de motor: **Railway** (plan Hobby, ~5 USD/mes) que sí ofrece MySQL gestionado.

**URL pública (Render):**
- Frontend: `https://bookyhome-web.onrender.com`
- API: `https://bookyhome-api.onrender.com`

### Procedimiento de despliegue en Render + Neon

1. Crear cuenta en [render.com](https://render.com) y [neon.tech](https://neon.tech).
2. En Neon: crear proyecto `bookyhome` → copiar la `DATABASE_URL` (formato: `postgresql://user:pass@host/db?sslmode=require`).
3. En Render: ir a **Blueprints** → **New Blueprint** → seleccionar el repositorio → Render detecta `deploy/render.yaml` automáticamente.
4. En el panel de Render, completar las variables marcadas como `sync: false` en `render.yaml`:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD` (extraídos de la `DATABASE_URL` de Neon)
   - `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`
   - `GEMINI_API_KEY`
5. Hacer clic en **Apply** — Render construye las imágenes y despliega.
6. Verificar que ambos servicios muestren estado **Live** en el panel.
7. Ejecutar la prueba de humo contra las URLs públicas:
   ```bash
   bash scripts/smoke-test.sh \
     https://bookyhome-api.onrender.com \
     https://bookyhome-web.onrender.com
   ```

### Rollback en el PaaS

- **Render:** en el panel del servicio → **Deploys** → seleccionar el deploy anterior → **Rollback to this deploy**. Render vuelve a la imagen anterior sin downtime.
- Si se necesita revertir la BD: restaurar el respaldo desde `backups/` usando `scripts/restaurar.sh` apuntando a la cadena de conexión de Neon.

### Límites del plan gratuito que afectan al cliente

| Servicio | Límite | Impacto para el cliente | Fuente |
|---|---|---|---|
| Render Free (Web Service) | Se **suspende tras 15 minutos de inactividad**; tarda ~30–60 s en despertar | La primera petición del día puede tardar hasta 1 minuto en responder | [render.com/docs/free#spinning-down-on-idle](https://render.com/docs/free#spinning-down-on-idle) — consultado 2026-10-17 |
| Render Free (Static Site) | Sin suspensión (solo archivos estáticos en CDN) | Sin impacto | [render.com/pricing](https://render.com/pricing) — 2026-10-17 |
| Neon Free | 0.5 GB de almacenamiento; se **suspende tras 5 días de inactividad**; 191,9 horas de compute/mes | Si la BD se suspende, la API falla hasta que Neon la despierta (~5 s) | [neon.tech/docs/introduction/plans](https://neon.tech/docs/introduction/plans) — 2026-10-17 |

### Estado del despliegue en la nube

**Fecha de intento:** 2026-10-17

| Componente | Estado | Detalle |
|---|---|---|
| Render Web Service (API) | ⚠️ Build exitoso, runtime falla | La imagen Docker construyó correctamente. El backend arranca pero no puede conectarse a la BD: usa `mysql-connector-python` y Neon ofrece PostgreSQL — motores incompatibles. |
| Neon (PostgreSQL) | ✅ Proyecto creado | Base de datos `neondb` en `AWS us-east-1`. No compatible con el driver MySQL del backend sin refactorizar la capa de datos. |
| Railway (MySQL) | ✅ Instancia MySQL online | MySQL 8 disponible en `mysql.railway.internal:3306`. El host interno solo es accesible desde la red de Railway — no desde Render. |
| Render Static Site (Frontend) | 🔜 Pendiente | Se configura después de que la API esté estable. |

**Causa raíz:** BookyHome usa MySQL 8 con `mysql-connector-python`. Los PaaS con base de datos gratuita compatibles con MySQL (Railway) usan red interna que no es accesible desde Render. Las alternativas gratuitas con PostgreSQL (Neon, Supabase) requieren cambiar el driver de conexión del backend.

**Opciones para completar el despliegue:**
1. **Railway completo** — mover también el backend a Railway; así el backend y MySQL comparten la red interna `railway.internal` sin costo de egress.
2. **Refactorizar a PostgreSQL** — cambiar `mysql-connector-python` por `asyncpg`/`psycopg2` y adaptar las migraciones SQL para usar Neon o Supabase.
3. **Fly.io** — permite desplegar el stack completo con MySQL en la misma región sin restricciones de red interna.

---

## 5.4 Estimación de costos

| Concepto | Alternativa 1 — Render + Neon (PaaS gratuito) | Alternativa 2 — Render Starter + Railway MySQL (PaaS pago básico) |
|---|---|---|
| Frontend | $0/mes (Static Site Free) | $0/mes (Static Site Free) |
| API (backend) | $0/mes (Web Service Free — con suspensión) | $7/mes (Render Starter — sin suspensión, 512 MB RAM) |
| Base de datos | $0/mes (Neon Free — 0.5 GB, suspensión) | $5/mes (Railway Hobby MySQL — 1 GB, sin suspensión) |
| Almacenamiento imágenes | $0 (volumen Docker en servidor) | $0–$5/mes (Cloudflare R2 Free: 10 GB/mes gratis) |
| **Total mensual** | **$0/mes** | **~$12/mes** |
| **Total anual** | **$0/año** | **~$144/año** |
| Horas de administración al mes | ~1 h (monitoreo, renovación manual si hay incidentes) | ~0.5 h (alertas automáticas incluidas en plan pago) |
| Fuente y fecha | [render.com/pricing](https://render.com/pricing), [neon.tech/pricing](https://neon.tech/pricing) — 2026-10-17 | [render.com/pricing](https://render.com/pricing), [railway.app/pricing](https://railway.app/pricing) — 2026-10-17 |

### Recomendación al cliente

**Para el lanzamiento inicial:** usar la **Alternativa 1 (gratuita)** durante los primeros 3 meses para validar la tracción del proyecto. La suspensión por inactividad en el plan gratuito de Render es el principal inconveniente: la primera petición del día puede tardar hasta 1 minuto. Se puede mitigar con un servicio de "keep-alive" (ping cada 14 minutos) gratuito como UptimeRobot.

**Cuando el volumen lo justifique** (más de ~20 usuarios activos diarios o ventas recurrentes): migrar a la **Alternativa 2** (~$12/mes). Esto elimina la suspensión, garantiza disponibilidad 24/7 y da acceso a métricas de rendimiento. La inversión se justifica con 2–3 ventas al mes en la plataforma.

---

## Checklist de cierre

- [x] Versión 1.0.0 liberada: proceso de etiqueta, imágenes y notas de versión documentados (§5.1)
- [x] `CHANGELOG.md` creado en la raíz del repositorio con sección [1.0.0]
- [x] Procedimiento de instalación en servidor con comandos exactos y resultado esperado (§5.2)
- [x] Procedimiento de actualización y rollback documentados con comandos (§5.2)
- [x] Clasificación de migraciones con compatibilidad hacia atrás (§5.2)
- [x] `scripts/smoke-test.sh` con endpoints reales, probado y con resultado 5/5 PASS (§5.2)
- [x] Despliegue en la nube documentado (Render + Neon) con Blueprint `deploy/render.yaml` (§5.3)
- [x] Límites del plan gratuito documentados con fuente y fecha (§5.3)
- [x] Estimación de costos con dos alternativas y recomendación (§5.4)
- [x] `deploy/` con `compose.prod.yaml`, `Caddyfile.prod`, `env.prod.example` y `render.yaml`
- [x] Ningún secreto en el repositorio (`deploy/.env.prod` en `.gitignore`)
