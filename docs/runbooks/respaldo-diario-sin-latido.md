# Procedimiento Operativo: Monitoreo y Verificación del Respaldo Diario

| Campo | Valor |
|---|---|
| Servicio Monitoreado | Sistema Automatizado de Respaldos de BookyHome |
| Estado Normal (Esperado) | 🟢 **OPERATIVO (UP)** — Respaldo ejecutado y latido recibido diariamente |
| Condición de Alerta | 🔴 **DOWN** en Uptime Kuma si pasan más de 25 h sin recibir el latido de confirmación |
| Prioridad ante Incidente | **P2** |
| Tiempo máximo de resolución (SLO) | 4 h (antes de la siguiente ventana de respaldo) |
| Responsable de Operaciones | Equipo de Operaciones / Soporte de Guardia |
| Escalado a N3 | Administrador del Sistema / Líder Técnico (Cristopher León) |
| Última actualización | 2026-11-27 |
| Estado de Verificación | 🟢 Validado por el Equipo de BookyHome |

---

## 1. Estado Normal y Funcionamiento Óptimo (🟢 VERDE)

En condiciones normales de operación, la política de respaldos de BookyHome se mantiene en **🟢 ESTADO VERDE (UP)**:
* **Ejecución diaria programada:** La tarea de respaldo se ejecuta automáticamente cada día a las 20:00 h.
* **Integridad de datos:** Se genera una copia completa de la base de datos MySQL (usuarios, catálogo, órdenes, pagos y reclamos).
* **Confirmación de latido (Push):** Al finalizar con éxito, el script envía un ping HTTP a Uptime Kuma (`latido-respaldo.sh`) confirmando la operación.
* **Retención automática:** Se conservan los últimos 30 días de copias y se depuran automáticamente los archivos antiguos.
* **Monitoreo en verde:** Uptime Kuma registra el latido y mantiene el monitor en **verde 🟢**.

---

## 2. Protocolo de Contingencia (Si cambia a 🔴 ROJO / Monitor Caído)

Este procedimiento se ejecuta **únicamente si** el monitor cambia a **🔴 ROJO (DOWN)** debido a que no se recibió la confirmación en 25 horas:

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
# (VPS / Render / Aiven Cloud) si hay incidentes o la máquina está apagada.
# Reiniciar la VM desde el panel si corresponde.
# Si no tienes acceso al panel: escalar al Administrador del Sistema inmediatamente.
```

---

## [B] Cron detenido

```bash
ssh <usuario>@<servidor-bookyhome>

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
| 0–1 h | Operador de guardia sigue el runbook |
| 1 h | Notificar a Cristopher León; si el servidor tiene datos de producción sin copia, evaluar detener cambios hasta tener respaldo |
| 4 h | El Administrador ejecuta el respaldo manualmente desde cualquier equipo con acceso SSH o consola |

> **Nota para entornos Windows / Desarrollo local:**
> En Windows no se usa cron, sino el Programador de Tareas configurado con `scripts\backups\configure-backup-task.ps1`. Si un backup local falla, verificar que Docker Desktop esté encendido y ejecutar manualmente `.\scripts\backups\backup-db.ps1`.

---

## Registro de incidentes

| Fecha | Causa | Tiempo resolución | Corrección permanente |
|---|---|---|---|
| 2026-10-17 | Cron detenido tras reinicio del servidor | 1 h 05 min | `systemctl enable cron` añadido al manual de instalación |

> Actualizar tras cada incidente.
