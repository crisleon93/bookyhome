#!/usr/bin/env bash
# =============================================================================
# restaurar.sh — Restauración de respaldo BookyHome en base de prueba
# Proyecto : BookyHome
# Uso      : bash scripts/restaurar.sh --archivo <ruta.sql.gz> --base <nombre>
# IMPORTANTE: nunca restaurar en 'bookyhome' directamente; usar base de prueba
# Semana   : 02 — Plan de Respaldo (evidencia de restauración)
# =============================================================================
set -euo pipefail

ARCHIVO=""
BASE_DESTINO=""
USUARIO="root"
CONTENEDOR_MYSQL="bookyhome-mysql"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --archivo) ARCHIVO="$2";      shift 2 ;;
    --base)    BASE_DESTINO="$2"; shift 2 ;;
    *) echo "Opción desconocida: $1"; exit 1 ;;
  esac
done

if [[ -z "$ARCHIVO" || -z "$BASE_DESTINO" ]]; then
  echo "Uso: bash scripts/restaurar.sh --archivo <ruta.sql.gz> --base <nombre>"
  exit 1
fi

if [[ "$BASE_DESTINO" == "bookyhome" ]]; then
  echo "ERROR: Por seguridad no se permite restaurar sobre la base principal 'bookyhome'."
  echo "       Use un nombre diferente, p.ej.: bookyhome_prueba"
  exit 1
fi

if [[ ! -f "$ARCHIVO" ]]; then
  echo "ERROR: No existe el archivo: $ARCHIVO"
  exit 1
fi

PASS="$(docker exec "$CONTENEDOR_MYSQL" printenv MYSQL_ROOT_PASSWORD)"

log() {
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $*"
}

log "=== Inicio de restauración ==="
log "Archivo  : $ARCHIVO"
log "Base     : $BASE_DESTINO"

# Contar tablas ANTES (en producción, para referencia cruzada)
TABLAS_PROD=$(docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO" -p"$PASS" -N \
  -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='bookyhome';" \
  2>/dev/null | tr -d '[:space:]')
log "Tablas en bookyhome (producción): $TABLAS_PROD"

# Crear base destino si no existe
docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO" -p"$PASS" \
  -e "DROP DATABASE IF EXISTS \`$BASE_DESTINO\`; CREATE DATABASE \`$BASE_DESTINO\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" \
  2>/dev/null
log "Base '$BASE_DESTINO' creada"

# Restaurar
zcat "$ARCHIVO" | docker exec -i "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO" -p"$PASS" "$BASE_DESTINO" 2>/dev/null
log "Volcado restaurado"

# Contar tablas y filas DESPUÉS en la base restaurada
TABLAS_REST=$(docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO" -p"$PASS" -N \
  -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$BASE_DESTINO';" \
  2>/dev/null | tr -d '[:space:]')
log "Tablas en $BASE_DESTINO (restaurada): $TABLAS_REST"

# Conteos por tabla para evidencia
log "--- Conteos por tabla ---"
docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO" -p"$PASS" -e \
  "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='$BASE_DESTINO' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;" \
  2>/dev/null

log "=== Restauración completada ==="
log "Para limpiar la base de prueba:"
log "  docker compose exec mysql mysql -uroot -p<pass> -e 'DROP DATABASE \`$BASE_DESTINO\`;'"
