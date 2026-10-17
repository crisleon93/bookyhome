# Monitoreo con Uptime Kuma — BookyHome

Uptime Kuma corre en una **maquina distinta** de los servicios que vigila.
Si el servidor de BookyHome cae, Uptime Kuma sigue arriba y manda la alerta.

## Puesta en marcha

```bash
# En la maquina de monitoreo (no el servidor de BookyHome)
cd deploy/uptime-kuma
docker compose up -d

# Abrir el panel: http://<ip-de-esta-maquina>:3001
# Crear cuenta de administrador en el primer acceso
```

## Monitores a configurar

| # | Nombre | Tipo | URL / objetivo | Intervalo | Reintentos | Que hace si falla |
|---|---|---|---|---|---|---|
| 1 | API Salud | HTTP(s) | `https://bookyhome-api.onrender.com/health` | 60 s | 2 | Revisar logs, desplegar.sh a la version anterior si fue el ultimo cambio |
| 2 | API Raiz | HTTP(s) | `https://bookyhome-api.onrender.com/` | 60 s | 3 | Revisar logs del backend |
| 3 | Frontend | HTTP(s) | `https://bookyhome-web.onrender.com/` | 120 s | 3 | Revisar logs del frontend / CDN |
| 4 | Version correcta | Keyword (HTTP) | `https://bookyhome-api.onrender.com/health` — keyword: `"version":"1.0.1"` | 300 s | 2 | Verificar que el despliegue de la version esperada se completo |
| 5 | Respaldo diario | Push | Push URL (ver latido-respaldo.sh) | 25 h | 0 | Verificar cron de respaldo, logs de restic, ejecutar respaldo manual |

### Monitor 4 — Version correcta (keyword)

Configura el monitor tipo **Keyword (HTTP(s))** con la URL del health check
y como keyword el valor de version esperado:

```
"version":"1.0.1"
```

Cambia el keyword cada vez que liberes una version nueva.

### Monitor 5 — Latido de respaldo (Push)

1. En Uptime Kuma: **Add Monitor → Push**
2. Copia la **Push URL** que genera (algo como `https://<kuma-ip>:3001/api/push/XXXXX`)
3. Pon esa URL en la variable `KUMA_BACKUP_PUSH_URL` del servidor de BookyHome
   (en `/opt/bookyhome/deploy/.env.prod` o en el crontab del usuario `respaldo`)
4. El script `scripts/latido-respaldo.sh` envia el ping tras cada respaldo

Cron sugerido en el servidor de BookyHome:

```text
# /etc/cron.d/restic-bookyhome
# Respaldo + latido a Uptime Kuma
0   20 *   *   *    respaldo /opt/bookyhome/scripts/respaldo-restic.sh && \
                        /opt/bookyhome/scripts/latido-respaldo.sh
```

## Canal de alertas

Configurar en Uptime Kuma → Settings → Notifications:

| Canal | Tipo | Quien lo lee | Cuando |
|---|---|---|---|
| Telegram BookyHome-Ops | Telegram | ana (admin), luis (operador) | Cualquier monitor en DOWN |
| Email on-call | Email (SMTP) | ana@bookyhome.com.co | Monitor en DOWN por mas de 2 reintentos |

Horario de atencion: 24/7 (Telegram). Ana y Luis reciben notificaciones en el
telefono. Fuera de horario laboral (lunes a viernes 8:00–18:00) las alertas se
envian igual; si hay un monitor DOWN se evalua si requiere accion inmediata o
puede esperar al inicio del horario.
