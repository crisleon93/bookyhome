# Entregable S05 — Configuración, Verificación y Migración Ejecutada

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del software | 1.0.0 |
| Fecha | 2026-10-17 |

---

## 6.1 Inventario de configuración

Las variables se separan en tres categorías: **obligatorias** (la app no arranca sin ellas), **secretos** (no se suben al repositorio) y **opcionales** (funciones degradadas si faltan, pero la app arranca).

### Variables obligatorias

| Variable | ¿Secreto? | Desarrollo | Servidor | Nube | Si falta… |
|---|---|---|---|---|---|
| `DB_HOST` | No | `mysql` (contenedor) | `mysql` (red Docker) | `roundhouse.proxy.rlwy.net` (Railway) | No arranca: mensaje claro |
| `DB_PORT` | No | `3306` | `3306` | `3306` | No arranca: mensaje claro |
| `DB_USER` | No | `root` | `root` | `root` | No arranca: mensaje claro |
| `DB_PASSWORD` | **Sí** | `.env` local (no en repo) | `/opt/bookyhome/deploy/.env.prod` (permisos 600) | Panel de Railway (variable secreta) | No arranca: mensaje claro |
| `DB_NAME` | No | `bookyhome` | `bookyhome` | `bookyhome` | No arranca: mensaje claro |
| `SECRET_KEY` | **Sí** | `.env` local | `.env.prod` (600) | Panel de Render (generateValue) | No arranca: mensaje claro |

### Variables de configuración (no secretos)

| Variable | ¿Secreto? | Desarrollo | Servidor | Nube | Si falta… |
|---|---|---|---|---|---|
| `PUBLIC_API_URL` | No | `http://192.168.1.10:8000` | `https://api.bookyhome.com.co` | `https://bookyhome-api.onrender.com` | Advertencia; enlaces de correo usan default |
| `FRONTEND_URL` | No | `http://localhost:5173` | `https://bookyhome.com.co` | `https://bookyhome-web.onrender.com` | Advertencia; redirección de correo usa default |
| `VITE_API_BASE_URL` | No | `http://localhost:8000` | `https://api.bookyhome.com.co` | `https://bookyhome-api.onrender.com` | Frontend no puede llamar a la API |
| `APP_VERSION` | No | `1.0.0` | `1.0.0` | `1.0.0` | `/health` reporta `unknown` |
| `MAIL_STARTTLS` | No | `true` | `true` | `true` | Default `true` |
| `MAIL_SSL_TLS` | No | `false` | `false` | `false` | Default `false` |
| `MAIL_PORT` | No | `587` | `587` | `587` | Default `587` |
| `MAIL_SERVER` | No | `smtp.gmail.com` | `smtp.gmail.com` | `smtp.gmail.com` | Correo no funciona |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` | `gemini-3.8-flash` | `gemini-3.8-flash` | Default del proveedor |
| `GEMINI_BASE_URL` | No | URL de Google AI | URL de Google AI | URL de Google AI | Default del proveedor |

### Secretos (credenciales de servicios externos)

| Variable | ¿Dónde vive en desarrollo? | ¿Dónde vive en servidor? | ¿Dónde vive en nube? |
|---|---|---|---|
| `DB_PASSWORD` | `backend/.env` (no en repo) | `deploy/.env.prod` (permisos 600, no en repo) | Panel de Railway → Variables → tipo "secret" |
| `SECRET_KEY` | `backend/.env` (no en repo) | `deploy/.env.prod` (permisos 600) | Panel de Render → `generateValue: true` |
| `MAIL_PASSWORD` | `backend/.env` (no en repo) | `deploy/.env.prod` (permisos 600) | Panel de Render → `sync: false` (secreto) |
| `GEMINI_API_KEY` | `backend/.env` (no en repo) | `deploy/.env.prod` (permisos 600) | Panel de Render → `sync: false` (secreto) |

### Variables de negocio (BookyPago)

| Variable | Desarrollo | Servidor | Nube | Si falta… |
|---|---|---|---|---|
| `BOOKYPAGO_COMISION` | `0.05` | `0.05` | `0.05` | Default `0.05` |
| `BOOKYPAGO_COMISION_FIJA` | `0.00` | `0.00` | `0.00` | Default `0.00` |
| `BOOKYPAGO_SALDO_MINIMO` | `0.00` | `0.00` | `0.00` | Default `0.00` |
| `BOOKYPAGO_SALDO_MAXIMO` | `10000000.00` | `10000000.00` | `10000000.00` | Default del código |
| `BOOKYPAGO_COMISION_VENTA` | `0.10` | `0.10` | `0.10` | Default `0.15` |
| `BOOKYPAGO_COMISION_IMPULSO` | `0.05` | `0.05` | `0.05` | Default `0.10` |
| `BOOKYPAGO_COMISION_PLAN` | `0.02` | `0.02` | `0.02` | Default `0.08` |
| `BOOKYPAGO_DIAS_PAGO` | `7` | `7` | `7` | Default `7` |
| `BOOKYPAGO_MINIMO_PAGO` | `50000` | `50000` | `50000` | Default `50000` |

### Respuestas a las preguntas guía

**¿Qué variables de tu proyecto son secretos? ¿Dónde vive cada una en cada ambiente?**

Los secretos son `DB_PASSWORD`, `SECRET_KEY`, `MAIL_PASSWORD` y `GEMINI_API_KEY`. En desarrollo viven en `backend/.env` (excluido de Git). En el servidor viven en `deploy/.env.prod` con permisos 600, también excluido de Git. En la nube viven como variables de entorno tipo "secret" en el panel del proveedor (Railway/Render), nunca en el repositorio.

**Si falta una variable, ¿tu proyecto lo dice al arrancar o falla después con un usuario?**

Desde la semana 5, el módulo `app/config.py` valida las variables obligatorias al arrancar. Si falta `DB_PASSWORD` o `SECRET_KEY`, el proceso termina inmediatamente con un mensaje que lista las variables faltantes y sugiere consultar `.env.example`. Antes de este cambio, la app arrancaba con defaults inseguros (por ejemplo `SECRET_KEY="tu_clave_secreta"`).

---

## 6.2 Servicios

| Servicio | Imagen / versión | Depende de | Política de reinicio | Healthcheck | Rotación de logs |
|---|---|---|---|---|---|
| `mysql` | `mysql:8.0` | — | `unless-stopped` | `mysqladmin ping` cada 10 s, 15 reintentos, `start_period` 120 s | `json-file`, max 10 MB × 3 archivos |
| `backend` | `ghcr.io/bookyhome/bkh-backend:1.0.0` | `mysql` (healthy) | `unless-stopped` | `GET /health` cada 15 s, 5 reintentos, `start_period` 60 s | `json-file`, max 10 MB × 3 archivos |
| `frontend` | `ghcr.io/bookyhome/bkh-frontend:1.0.0` | — | `unless-stopped` | — (servicio estático sin healthcheck) | `json-file`, max 10 MB × 3 archivos |
| `caddy` | `caddy:2.9-alpine` | `backend`, `frontend` | `unless-stopped` | — (proxy sin healthcheck propio) | `json-file`, max 10 MB × 3 archivos |

### Orden de arranque

```text
mysql (start_period 120s → healthy)
  ↓ condition: service_healthy
backend (start_period 60s → healthy)
  ↓
caddy → depende de backend + frontend
```

El `depends_on` con `condition: service_healthy` garantiza que el backend no arranque hasta que MySQL haya respondido al ping de `mysqladmin`. Si MySQL no está sano en 120 segundos, el backend no se inicia.

### Rotación de logs

Todos los servicios usan el driver `json-file` con `max-size: 10m` y `max-file: 3`. Esto significa que cada contenedor mantiene como máximo 3 archivos de log de 10 MB cada uno (30 MB por servicio, 120 MB total). Cuando un archivo llega a 10 MB, se rota; el más antiguo se elimina.

Configuración en `deploy/compose.prod.yaml`:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 6.3 Endpoint de salud

| Campo | Valor |
|---|---|
| Ruta | `GET /health` |
| Dependencias que verifica | Base de datos (MySQL), correo transaccional (SMTP), asistente IA (Gemini/OpenAI) |
| Respuesta si está sano | HTTP 200 — `{"status":"ok","timestamp":"...","version":"1.0.0","checks":{"database":{"status":"ok","latency_ms":3.2},"mail":{"status":"ok"},"ai_assistant":{"status":"ok","provider":"gemini"}}}` |
| Respuesta si falla una dependencia crítica | HTTP 503 — `{"status":"error","timestamp":"...","version":"1.0.0","checks":{"database":{"status":"error","detail":"..."},"mail":{"status":"ok"},"ai_assistant":{"status":"ok"}}}` |

### Clasificación de dependencias

| Dependencia | ¿Crítica? | ¿Bloquea el arranque? | Comentario |
|---|---|---|---|
| Base de datos (MySQL) | **Sí** | Sí — `depends_on: service_healthy` + `validate_config()` | Sin BD la app no funciona |
| Correo transaccional (SMTP) | No | No — solo advierte al arrancar | La recuperación de contraseña no funciona, pero el resto sí |
| Asistente IA (Gemini) | No | No — solo advierte al arrancar | El chat de IA no funciona, pero el catálogo y las compras sí |

**¿Qué dependencias revisa tu endpoint de salud? ¿Alguna no debería revisarse?**

Revisa tres: base de datos, correo e IA. La base de datos es la única crítica. El correo y la IA se reportan como `degraded` pero no hacen que el endpoint devuelva 503, porque un fallo en ellos no impide que los compradores naveguen el catálogo ni compren libros. Si en el futuro se decide que el correo es crítico (por ejemplo, si la recuperación de contraseña es esencial para el lanzamiento), se puede subir a crítica cambiando la condición `critical_ok`.

---

## 6.4 Pruebas

### Prueba de humo

Script: `scripts/smoke-test.sh`

Verificaciones incluidas:

| # | Verificación | Resultado esperado |
|---|---|---|
| 1 | API raíz (`GET /`) responde HTTP 200 y body contiene "BookyHome" | PASS |
| 2 | API `/docs` (Swagger) responde HTTP 200 | PASS |
| 3 | API `/catalogo/categorias` responde HTTP 200 | PASS |
| 4 | API `/catalogo/busqueda-avanzada` responde HTTP 200 | PASS |
| 5 | **Endpoint de salud** (`GET /health`) responde HTTP 200 y base de datos sana | PASS |
| 6 | **Catálogo con datos** — la respuesta contiene estructura JSON con `"libros"` o `"data"` | PASS |
| 7 | Frontend raíz responde HTTP 200 | PASS |

> Las verificaciones 5 y 6 son propias de la semana 5 (no existían en S04).

Salida contra el servidor local (2026-10-17):

```text
========================================
 Prueba de humo — BookyHome
 API:      http://localhost:8000
 Frontend: http://localhost:5173
 Fecha:    2026-10-17 14:20:00
========================================
  → Comprobando API (http://localhost:8000)...
  ✔ PASS API raíz — HTTP 200
  ✔ PASS API /docs (Swagger) — HTTP 200
  ✔ PASS API /catalogo/categorias — HTTP 200
  ✔ PASS API /catalogo/busqueda-avanzada — HTTP 200
  → Comprobando endpoint de salud (http://localhost:8000/health)...
  ✔ PASS API /health — HTTP 200, base de datos sana
  → Verificación propia: catálogo con datos...
  ✔ PASS Catálogo devuelve estructura JSON con resultados
  → Comprobando Frontend (http://localhost:5173)...
  ✔ PASS Frontend raíz — HTTP 200
========================================
 Pasaron: 7  |  Fallaron: 0
========================================
RESULTADO: OK — todas las pruebas pasaron
```

Salida contra la nube (Railway MySQL + Render API):

```text
========================================
 Prueba de humo — BookyHome
 API:      https://bookyhome-api.onrender.com
 Frontend: https://bookyhome-web.onrender.com
 Fecha:    2026-10-17 15:05:00
========================================
  → Comprobando API (https://bookyhome-api.onrender.com)...
  ✔ PASS API raíz — HTTP 200
  ✔ PASS API /docs (Swagger) — HTTP 200
  ✔ PASS API /catalogo/categorias — HTTP 200
  ✔ PASS API /catalogo/busqueda-avanzada — HTTP 200
  → Comprobando endpoint de salud (https://bookyhome-api.onrender.com/health)...
  ✔ PASS API /health — HTTP 200, base de datos sana
  → Verificación propia: catálogo con datos...
  ✔ PASS Catálogo devuelve estructura JSON con resultados
  → Comprobando Frontend (https://bookyhome-web.onrender.com)...
  ✔ PASS Frontend raíz — HTTP 200
========================================
 Pasaron: 7  |  Fallaron: 0
========================================
RESULTADO: OK — todas las pruebas pasaron
```

> Nota: el primer request a Render Free puede tardar 30–60 s por la suspensión por inactividad. El `smoke-test.sh` usa `--connect-timeout 5 --max-time 15` por request; si el servicio está frío, puede ser necesario re-ejecutar.

### Casos funcionales

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| F-01 | Catálogo muestra categorías | 1. `GET /catalogo/categorias` | HTTP 200 con array de categorías | ✅ 16 categorías devueltas |
| F-02 | Búsqueda avanzada retorna libros | 1. `GET /catalogo/busqueda-avanzada` | HTTP 200 con lista de libros | ✅ Libros devueltos con datos |
| F-03 | Health reporta base de datos sana | 1. `GET /health` | HTTP 200, `"database":{"status":"ok"}` | ✅ BD sana, latencia < 50 ms |
| F-04 | Health reporta versión correcta | 1. `GET /health` | `"version":"1.0.0"` | ✅ Versión 1.0.0 |
| F-05 | Login de usuario administrador | 1. `POST /auth/login` con credenciales de admin | HTTP 200 con token JWT | ✅ Token JWT válido |
| F-06 | Detalle de libro por ID | 1. `GET /libros/{id}` con ID existente | HTTP 200 con datos del libro | ✅ Libro con título, precio, stock |
| F-07 | Config faltante bloquea el arranque | 1. Eliminar `DB_PASSWORD` del `.env` 2. Reiniciar el backend | Mensaje: "BookyHome no puede arrancar" + lista de variables faltantes | ✅ Proceso termina con exit(1) y mensaje claro |
| F-08 | Logs rotan sin llenar el disco | 1. Levantar con `compose.prod.yaml` 2. Generar > 10 MB de logs 3. `docker inspect` | Máximo 3 archivos de 10 MB por servicio | ✅ 3 archivos × 10 MB por contenedor |

---

## 6.5 Lista de verificación posterior al despliegue

- [x] `docker compose -f deploy/compose.prod.yaml ps` muestra los contenedores en estado `Up (healthy)`
- [x] `GET /health` responde HTTP 200 con `"status":"ok"`
- [x] La base de datos responde `SELECT 1` desde el backend
- [x] El catálogo (`/catalogo/categorias`) devuelve resultados
- [x] El login (`/auth/login`) funciona con un usuario de prueba
- [x] `bash scripts/smoke-test.sh` retorna código 0 (7/7 PASS)
- [x] Los logs de cada contenedor no superan 30 MB (3 × 10 MB)
- [x] `deploy/.env.prod` tiene permisos 600 y no está en el repositorio
- [x] Ningún secreto aparece en los logs del contenedor
- [x] El respaldo post-instalación existe en `backups/` con tamaño > 0
- [x] La versión en `/health` coincide con la etiqueta del despliegue

---

## Checklist de cierre

- [x] Inventario de configuración completo por ambiente (§6.1)
- [x] Servicios documentados con dependencias de arranque, reinicio y logs (§6.2)
- [x] Endpoint de salud, prueba de humo ampliada y casos funcionales (§6.3–6.4)
- [x] Lista de verificación posterior al despliegue (§6.5)
- [x] Migración ejecutada con registro de la ventana, huellas iguales y prueba de humo tras el corte (§2.8)
- [x] Ningún secreto en el repositorio ni en el entregable
