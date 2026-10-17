# Runbook: Respaldo diario sin latido (monitor Push caído)

| Campo | Valor |
|---|---|
| Alerta | Monitor **Respaldo diario** cambia a 🔴 DOWN en Uptime Kuma |
| Síntoma | No se recibió el latido (push) del script de respaldo en las últimas 25 horas |
| Servicio afectado | Sistema de respaldos — datos en riesgo de pérdida sin copia reciente |
| Prioridad | **P2** |
| Tiempo máximo de resolución (SLO) | 4 h (antes de las 00:00 del día siguiente) |
| Responsable N2 | Operador (`luis`) |
| Escalado a N3 | Administradora (`ana`) si no se resuelve en 1 hora |
| Última actualización | 2026-10-17 |
| Probado por | — (completar tras primera prueba) |

---

## ¿Por qué importa este monitor?

El cron ejecuta `respaldo-restic.sh` cada día a las 20:00 h y al terminar llama a `latido-respaldo.sh` para notificar a Uptime Kuma. Si no llega el latido en 25 horas significa que el respaldo no se ejecutó, y los datos podrían perderse sin copia si ocurre un fallo del servidor.

---

## Árbol de decisión

```
¿No llegó el latido en 25 h?
│
├─► ¿El servidor está encendido y accesible?
│     ├─ NO → Problema de red/hosting → ir a [A] Servidor inaccesible
│     └─ SÍ → ir a →
│
├─► ¿El servicio cron está activo?
│     ├─ NO (inactive/dead) → ir a [B] Cron detenido
│     └─ SÍ → ir a →
│
└─► ¿El script de respaldo terminó sin error?
      ├─ NO (error en logs) → ir a [C] Error en el script de respaldo
      └─ SÍ, terminó OK → ir a [D] Latido no se envió
```

---

## [A] Servidor inaccesible

```bash
# Intentar ping al servidor
ping -c 4 bookyhome-server

# Si no responde: verificar en el panel de tu proveedor de hosting
# (VPS / Render / Railway) si hay incidentes o la máquina está apagada.
# Reiniciar la VM desde el panel si corresponde.
# Si no tienes acceso al panel: escalar a ana inmediatamente.
```

---

## [B] Cron detenido

```bash
ssh ana@bookyhome-server

# Verificar estado del servicio cron
sudo systemctl status cron

# Si está inactive/dead (frecuente tras reinicios del servidor):
sudo systemctl start cron
sudo systemctl enable cron   # asegurarse de que arranque automático esté activo

# Verificar que la tarea de respaldo está en el crontab del usuario 'respaldo'
sudo crontab -l -u respaldo
# Debe aparecer algo como:
# 0 20 * * * /opt/bookyhome/scripts/respaldo-restic.sh >> /var/log/respaldo.log 2>&1 && /opt/bookyhome/scripts/latido-respaldo.sh
```

---

## [C] Error en el script de respaldo

```bash
# Ver los últimos logs del respaldo
sudo tail -100 /var/log/respaldo.log

# Causas comunes:
# 1. Espacio en disco insuficiente
df -h /var/lib/docker/volumes/
df -h /opt/bookyhome/respaldos/

# 2. MySQL no estaba disponible al momento del respaldo
docker ps --filter name=bookyhome-mysql

# 3. Contraseña de restic incorrecta o repositorio corrupto
sudo -u respaldo restic -r /opt/bookyhome/respaldos/local check

# Ejecutar el respaldo manualmente tras corregir el problema:
sudo -u respaldo bash /opt/bookyhome/scripts/respaldo-restic.sh

# Verificar que terminó sin errores:
echo "Salida: $?"
sudo tail -20 /var/log/respaldo.log
```

---

## [D] Latido no se envió (respaldo OK pero no llegó la notificación)

```bash
# El respaldo se ejecutó pero curl falló al llamar a Uptime Kuma

# Ver log de latido
sudo tail -20 /var/log/respaldo.log
# Buscar línea: "Latido enviado" o error de curl

# Enviar el latido manualmente
bash /opt/bookyhome/scripts/latido-respaldo.sh

# Si curl falla: verificar que la URL push de Kuma sigue siendo válida
# La URL está en /opt/bookyhome/scripts/latido-respaldo.sh
# Si la URL cambió (por migración de Kuma): actualizar el script

# Verificar conectividad a la VM de Kuma
curl -s http://<ip-vm-kuma>:3001
```

---

## Verificación de resolución

```bash
# 1. Uptime Kuma debe mostrar el monitor en verde (puede tardar hasta 2 min)
# 2. Verificar que el respaldo más reciente es de hoy
sudo -u respaldo restic -r /opt/bookyhome/respaldos/local snapshots --last

# Debe mostrar una instantánea con fecha de hoy (o la de hace menos de 25 h)

# 3. Verificar integridad del último snapshot
sudo -u respaldo restic -r /opt/bookyhome/respaldos/local check
# Esperado: "no errors were found"
```

---

## Acciones preventivas tras el incidente

Si el cron se detuvo por un reinicio del servidor:

```bash
# Agregar watchdog systemd para el cron (previene que no arranque tras reboot)
sudo systemctl enable cron
sudo systemctl is-enabled cron   # debe mostrar "enabled"
```

---

## Escalado

| Tiempo sin resolver | Acción |
|---|---|
| 0–1 h | Operador (`luis`) sigue el runbook |
| 1 h | Notificar a `ana`; si el servidor tiene datos de producción sin copia, evaluare detener cambios hasta tener respaldo |
| 4 h | `ana` ejecuta el respaldo manualmente desde cualquier equipo con acceso SSH al servidor |

---

## Registro de incidentes

| Fecha | Causa | Tiempo resolución | Corrección permanente |
|---|---|---|---|
| 2026-10-17 | Cron detenido tras reinicio del servidor | 1 h 05 min | `systemctl enable cron` añadido al manual de instalación |

> Actualizar tras cada incidente.
