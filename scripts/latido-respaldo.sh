#!/usr/bin/env bash
# latido-respaldo.sh — Envia un latido (push) a Uptime Kuma tras cada respaldo
#
# Uptime Kuma vigila que el respaldo diario se ejecute.
# Si no recibe el ping en 25 horas, dispara una alerta.
#
# Configuracion:
#   - Variable de entorno KUMA_BACKUP_PUSH_URL (en /opt/bookyhome/deploy/.env.prod
#     o en el crontab del usuario respaldo)
#   - La URL se obtiene en Uptime Kuma: Add Monitor → Push → copiar la Push URL
#
# Uso (desde cron o al final de respaldo-restic.sh):
#   bash /opt/bookyhome/scripts/latido-respaldo.sh
#
# Cron sugerido (despues del respaldo a las 20:00):
#   5 20 * * * respaldo /opt/bookyhome/scripts/respaldo-restic.sh && /opt/bookyhome/scripts/latido-respaldo.sh

PUSH_URL="${KUMA_BACKUP_PUSH_URL:-}"

if [ -z "$PUSH_URL" ]; then
  echo "KUMA_BACKUP_PUSH_URL no configurada — latido omitido"
  exit 0
fi

# Enviar el ping
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$PUSH_URL" 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Latido enviado a Uptime Kuma (HTTP $RESPONSE)"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] No se pudo enviar latido a Uptime Kuma (HTTP $RESPONSE)"
fi
