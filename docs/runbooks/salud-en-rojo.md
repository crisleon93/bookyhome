# Procedimiento Operativo: Salud y Disponibilidad de la API

| Campo | Valor |
|---|---|
| Servicio Monitoreado | Backend FastAPI — BookyHome API (`/health`) |
| Estado Normal (Esperado) | 🟢 **OPERATIVO (UP)** — HTTP 200 OK |
| Condición de Alerta | 🔴 **DOWN** en Uptime Kuma si `/health` no responde HTTP 200 o la BD se desconecta |
| Prioridad ante Incidente | **P1** |
| Tiempo máximo de resolución (SLO) | 2 h |
| Responsable de Operaciones | Equipo de Operaciones / Soporte de Guardia |
| Escalado a N3 | Administrador del Sistema / Líder Técnico (Cristopher León) |
| Última actualización | 2026-11-27 |
| Estado de Verificación | 🟢 Validado por el Equipo de BookyHome |

---

## 1. Estado Normal y Funcionamiento Óptimo (🟢 VERDE)

En condiciones normales de operación, BookyHome se encuentra en **🟢 ESTADO VERDE (UP)**.
El endpoint de salud `/health` responde con código **HTTP 200 OK** y confirma el estado saludable de sus componentes:

```json
{
  "status": "ok",
  "timestamp": "2026-11-27T06:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": {"status": "ok", "latency_ms": 14.2},
    "mail": {"status": "ok"},
    "ai_assistant": {"status": "ok", "provider": "gemini"}
  }
}
```

* **Base de datos (MySQL):** Conexión activa con latencia baja (`status: "ok"`). Los usuarios pueden navegar, iniciar sesión, comprar y consultar órdenes sin retrasos.
* **Correo SMTP:** Configuración transaccional lista para envíos de confirmación y recuperación.
* **Asistente IA:** Proveedor configurado y listo para consultas en catálogo.
* **Monitoreo continuo:** Uptime Kuma realiza peticiones cada 60 segundos y mantiene el indicador en **verde 🟢 (100% disponible)**.

---

## 2. Protocolo de Contingencia y Recuperación (Si cambia a 🔴 ROJO)

Este procedimiento se ejecuta **únicamente si** el monitor cambia a **🔴 ROJO (DOWN)** debido a una eventualidad externa (caída del hosting, desconexión de base de datos o fallo de red):

---

## Árbol de decisión

```
¿Uptime Kuma muestra DOWN en "Salud API"?
│
├─► ¿La URL del health es accesible desde un navegador externo?
│     │
│     ├─ NO → Problema de red o Caddy → ir a [A] Caddy/Red
│     └─ SÍ, devuelve 5xx o JSON con status=error
│           │
│           └─► ¿El backend está corriendo?
│                 │
│                 ├─ Contenedor no existe o exited → ir a [B] Contenedor caído
│                 └─ Contenedor running → ir a [C] Base de datos
```

---

## [A] Caddy / Red no enruta al backend

```bash
# 1. Verificar que Caddy está corriendo
ssh <usuario>@<servidor-bookyhome>
docker ps --filter name=bookyhome-caddy

# 2. Ver logs de Caddy
docker logs bookyhome-caddy --tail 50

# 3. Reiniciar Caddy si está en error
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml restart caddy

# 4. Verificar acceso desde el propio servidor
curl -s http://localhost:8000/health
```

Si Caddy no arranca, revisar `deploy/Caddyfile.prod` (¿dominio o certificado TLS expirado?).

---

## [B] Contenedor del backend caído

```bash
# 1. Ver estado de todos los contenedores
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml ps

# 2. Ver los últimos logs antes del crash
docker logs bookyhome-backend --tail 100

# 3. Causas comunes:
#    - OOM (matar por falta de RAM) → ver "OOMKilled" en logs
#    - Error de inicio (import, variable de entorno faltante)
#    - Fallo de conexión inicial a MySQL

# 4. Reiniciar el backend
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml restart backend

# 5. Esperar el health check (máx. 60 s) y verificar
sleep 65
curl -s https://bookyhome-api.onrender.com/health | python3 -m json.tool

# 6. Si no arranca: revisar variables de entorno
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml exec backend env | grep -E "^(DB_|SECRET_|MAIL_|GEMINI_)"
```

**Si falta una variable crítica** (`DB_HOST`, `DB_PASSWORD`, `SECRET_KEY`): editar `/opt/bookyhome/deploy/.env.prod` con la variable correcta, luego:

```bash
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml up -d --force-recreate backend
```

---

## [C] Base de datos no disponible

Cuando la base de datos falla, `/health` devuelve HTTP 503 con:

```json
{
  "status": "error",
  "timestamp": "2026-11-27T06:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": {"status": "error", "detail": "Can't connect to MySQL server on '...' (111)"},
    "mail": {"status": "ok"},
    "ai_assistant": {"status": "ok", "provider": "gemini"}
  }
}
```

### Caso 1: Si se usa MySQL local en Docker

```bash
# 1. Verificar estado del contenedor MySQL
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml ps mysql
docker logs bookyhome-mysql --tail 50

# 2. Probar conexión directa desde el backend
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml exec backend \
  python3 -c "
import mysql.connector, os
c = mysql.connector.connect(
    host=os.getenv('DB_HOST','mysql'),
    port=int(os.getenv('DB_PORT',3306)),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)
print('Conexión OK:', c.is_connected())
c.close()
"

# 3. Si el contenedor está corriendo pero no responde:
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml restart mysql
sleep 30
```

### Caso 2: Si se usa Aiven Cloud MySQL (Producción Nube)

1. **Ingresar a la consola web de Aiven:** `https://console.aiven.io`
2. **Verificar el estado del servicio:** El cluster `bookyhome-mysql` debe estar en estado **Running** (verde).
3. **Revisar causas de caída en Aiven:**
   - ¿Plan trial expirado o pausado por inactividad?
   - ¿Cuota de disco o memoria superada?
   - ¿Cambió la contraseña o el puerto asignado?
4. **Verificar SSL:** La conexión a Aiven requiere conexión segura (`ssl_ca` o certificado si está habilitado).

---

## Verificación de resolución

```bash
# Comprobar respuesta de salud en producción:
curl -s https://bookyhome-api.onrender.com/health | python3 -m json.tool

# Debe devolver HTTP 200 con:
# {"status":"ok","checks":{"database":{"status":"ok","latency_ms":...}}}
```

También correr la prueba de humo automatizada:

```bash
bash /opt/bookyhome/scripts/smoke-test.sh https://bookyhome-api.onrender.com
# Esperado: Todas las pruebas PASS (incluido /health y base de datos sana)
```

---

## Escalado

| Tiempo sin resolver | Acción |
|---|---|
| 0–30 min | Operador de guardia sigue este runbook |
| 30 min | Notificar al Administrador del Sistema (Cristopher León) por Telegram y continuar diagnóstico |
| 1 h | Se evalúa rollback a versión anterior o reinicio del servicio de BD en la nube |
| 2 h | Ejecutar rollback: `bash /opt/bookyhome/scripts/desplegar.sh <version-anterior>` |

---

## Registro de incidentes

| Fecha | Causa | Tiempo resolución | Corrección permanente |
|---|---|---|---|
| — | — | — | — |

> Completar tras cada incidente real.
