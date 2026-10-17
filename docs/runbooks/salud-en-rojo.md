# Runbook: "Salud API" en rojo en Uptime Kuma

| Campo | Valor |
|---|---|
| Alerta | Monitor **Salud API** cambia a 🔴 DOWN en Uptime Kuma |
| Síntoma | `GET /health` no responde HTTP 200 (timeout o 5xx) |
| Servicio afectado | Backend FastAPI — todos los usuarios |
| Prioridad | **P1** |
| Tiempo máximo de resolución (SLO) | 2 h |
| Responsable N2 | Operador (`luis`) |
| Escalado a N3 | Administradora (`ana`) si no se resuelve en 30 min |
| Última actualización | 2026-10-17 |
| Probado por | — (completar tras primera prueba) |

---

## ¿Por qué importa este endpoint?

El endpoint `/health` verifica que el backend está en línea **y** que la conexión a MySQL funciona. Si está en rojo significa que los usuarios no pueden iniciar sesión, ver el catálogo ni realizar compras.

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
ssh ana@bookyhome-server
docker ps --filter name=bookyhome-caddy

# 2. Ver logs de Caddy
docker logs bookyhome-caddy --tail 50

# 3. Reiniciar Caddy si está en error
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml restart caddy

# 4. Verificar acceso desde el propio servidor
curl -s http://localhost:8000/health
```

Si Caddy no arranca, revisar `deploy/Caddyfile.prod` (¿dominio correcto?).

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
#    - Fallo de la migración al arrancar

# 4. Reiniciar el backend
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml restart backend

# 5. Esperar el health check (máx. 60 s) y verificar
sleep 65
curl -s https://bookyhome-api.onrender.com/health | python3 -m json.tool

# 6. Si no arranca: revisar variables de entorno
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml exec backend env | grep -E "^(DB_|SECRET_|MAIL_)"
```

**Si falta una variable crítica** (`DB_HOST`, `SECRET_KEY`): editar `/opt/bookyhome/.env.prod` con la variable correcta, luego:

```bash
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml up -d --force-recreate backend
```

---

## [C] Base de datos no disponible

El endpoint `/health` devuelve:

```json
{"status":"error","checks":{"database":{"status":"error","latency_ms":null}}}
```

```bash
# 1. Verificar que MySQL está corriendo y sano
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

# 3a. MySQL corriendo pero no acepta conexiones → reiniciar
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml restart mysql
sleep 30

# 3b. MySQL en estado "unhealthy" más de 2 reintentos:
#     Probablemente el volumen está lleno. Verificar espacio:
df -h /var/lib/docker/volumes/

# 4. Si hay suficiente espacio y MySQL sigue fallando → escalar a ana (N3)
```

---

## Verificación de resolución

```bash
# La alerta debe pasar a verde en Uptime Kuma (máx. 2 minutos tras corrección)
curl -s https://bookyhome-api.onrender.com/health
# Debe devolver HTTP 200 con:
# {"status":"ok","checks":{"database":{"status":"ok","latency_ms":<número>}}}
```

También correr la prueba de humo completa:

```bash
bash /opt/bookyhome/scripts/smoke-test.sh
# Esperado: 7/7 PASS
```

---

## Escalado

| Tiempo sin resolver | Acción |
|---|---|
| 0–30 min | Operador (`luis`) sigue el runbook |
| 30 min | Notificar a `ana` por Telegram y continuar |
| 1 h | `ana` toma control; evalúa rollback a versión anterior |
| 2 h | Ejecutar rollback: `bash /opt/bookyhome/scripts/desplegar.sh <version-anterior>` |

---

## Registro de incidentes

| Fecha | Causa | Tiempo resolución | Corrección permanente |
|---|---|---|---|
| — | — | — | — |

> Completar tras cada incidente real.
