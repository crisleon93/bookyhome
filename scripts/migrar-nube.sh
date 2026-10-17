#!/usr/bin/env bash
# migrar-nube.sh — Migración de datos de MySQL local a MySQL en la nube (Railway)
#
# Sigue el plan de migración de la Semana 2 (entregable-s02-planes.md § 2):
#   1. Respaldo completo antes de iniciar
#   2. Volcado de la base origen (mysqldump)
#   3. Carga en la base destino (mysql < dump.sql)
#   4. Comparación de huellas (CHECKSUM TABLE) origen vs destino
#   5. Prueba de humo tras el corte
#
# Uso:
#   bash scripts/migrar-nube.sh
#
# Variables requeridas (en el entorno o pasadas como argumentos):
#   SRC_DB_HOST, SRC_DB_PORT, SRC_DB_USER, SRC_DB_PASSWORD, SRC_DB_NAME
#   DST_DB_HOST, DST_DB_PORT, DST_DB_USER, DST_DB_PASSWORD, DST_DB_NAME

set -euo pipefail

# ─── Colores ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_ok()   { echo -e "${GREEN}  ✔${NC} $1"; }
log_fail() { echo -e "${RED}  ✘${NC} $1"; }
log_info() { echo -e "${YELLOW}  →${NC} $1"; }

# ─── Configuración ────────────────────────────────────────────────────────────
# Origen (MySQL local / Docker)
SRC_DB_HOST="${SRC_DB_HOST:-127.0.0.1}"
SRC_DB_PORT="${SRC_DB_PORT:-3306}"
SRC_DB_USER="${SRC_DB_USER:-root}"
SRC_DB_PASSWORD="${SRC_DB_PASSWORD:?Falta SRC_DB_PASSWORD}"
SRC_DB_NAME="${SRC_DB_NAME:-bookyhome}"

# Destino (MySQL en Railway / nube)
DST_DB_HOST="${DST_DB_HOST:?Falta DST_DB_HOST}"
DST_DB_PORT="${DST_DB_PORT:-3306}"
DST_DB_USER="${DST_DB_USER:?Falta DST_DB_USER}"
DST_DB_PASSWORD="${DST_DB_PASSWORD:?Falta DST_DB_PASSWORD}"
DST_DB_NAME="${DST_DB_NAME:-bookyhome}"

# Archivo de volcado temporal
DUMP_FILE="/tmp/migracion-bookyhome-$(date +%Y%m%d-%H%M%S).sql"

# Tablas críticas para comparar huellas
TABLAS criticas="usuarios tiendas libros categorias ordenes_compra pagos"
TABLAS_CRC="usuarios tiendas libros categorias ordenes_compra pagos notificaciones resenas_libros"

echo "========================================"
echo " Migración BookyHome — Local → Nube"
echo " Origen:   ${SRC_DB_HOST}:${SRC_DB_PORT}/${SRC_DB_NAME}"
echo " Destino:   ${DST_DB_HOST}:${DST_DB_PORT}/${DST_DB_NAME}"
echo " Inicio:    $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ─── Paso 1: Respaldo pre-migración ───────────────────────────────────────────
log_info "Paso 1: Respaldo pre-migración..."
bash scripts/respaldar.sh
log_ok "Respaldo completado"

# ─── Paso 2: Volcado de la base origen ────────────────────────────────────────
log_info "Paso 2: Volcando base origen (${SRC_DB_NAME})..."
mysqldump \
  --host="$SRC_DB_HOST" --port="$SRC_DB_PORT" \
  --user="$SRC_DB_USER" --password="$SRC_DB_PASSWORD" \
  --single-transaction --routines --triggers --events \
  --default-character-set=utf8mb4 \
  "$SRC_DB_NAME" > "$DUMP_FILE"
DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
log_ok "Volcado generado: $DUMP_FILE ($DUMP_SIZE)"

# ─── Paso 3: Carga en la base destino ────────────────────────────────────────
log_info "Paso 3: Cargando en base destino (${DST_DB_NAME})..."
mysql \
  --host="$DST_DB_HOST" --port="$DST_DB_PORT" \
  --user="$DST_DB_USER" --password="$DST_DB_PASSWORD" \
  --default-character-set=utf8mb4 \
  "$DST_DB_NAME" < "$DUMP_FILE"
log_ok "Carga completada"

# ─── Paso 4: Comparación de huellas (CHECKSUM TABLE) ──────────────────────────
log_info "Paso 4: Comparando huellas (CHECKSUM TABLE)..."

echo ""
echo "--- Huellas ORIGEN ---"
SRC_CHECKSUMS=$(mysql \
  --host="$SRC_DB_HOST" --port="$SRC_DB_PORT" \
  --user="$SRC_DB_USER" --password="$SRC_DB_PASSWORD" \
  --silent --raw \
  -e "CHECKSUM TABLE ${TABLAS_CRC// /, };" \
  "$SRC_DB_NAME")
echo "$SRC_CHECKSUMS"

echo ""
echo "--- Huellas DESTINO ---"
DST_CHECKSUMS=$(mysql \
  --host="$DST_DB_HOST" --port="$DST_DB_PORT" \
  --user="$DST_DB_USER" --password="$DST_DB_PASSWORD" \
  --silent --raw \
  -e "CHECKSUM TABLE ${TABLAS_CRC// /, };" \
  "$DST_DB_NAME")
echo "$DST_CHECKSUMS"

# Comparar
echo ""
echo "--- Comparación ---"
MISMATCH=0
while IFS=$'\t' read -r tabla checksum; do
  dst_checksum=$(echo "$DST_CHECKSUMS" | grep "^${tabla}	" | cut -f2)
  if [ "$checksum" = "$dst_checksum" ]; then
    log_ok "$tabla: huellas coinciden ($checksum)"
  else
    log_fail "$tabla: huellas NO coinciden (origen=$checksum, destino=$dst_checksum)"
    MISMATCH=$((MISMATCH+1))
  fi
done <<< "$SRC_CHECKSUMS"

if [ "$MISMATCH" -gt 0 ]; then
  echo ""
  echo "RESULTADO: FALLA — $MISMATCH tabla(s) con huellas diferentes"
  exit 1
fi

# ─── Paso 5: Prueba de humo contra el destino ─────────────────────────────────
log_info "Paso 5: Prueba de humo (consultas básicas en destino)..."
QUERY_FAIL=0

for tabla in $TABLAS_CRITICAS; do
  count=$(mysql \
    --host="$DST_DB_HOST" --port="$DST_DB_PORT" \
    --user="$DST_DB_USER" --password="$DST_DB_PASSWORD" \
    --silent --raw \
    -e "SELECT COUNT(*) FROM ${tabla};" \
    "$DST_DB_NAME")
  if [ "$count" -gt 0 ] 2>/dev/null; then
    log_ok "SELECT COUNT(*) FROM ${tabla} → $count filas"
  else
    log_fail "SELECT COUNT(*) FROM ${tabla} → 0 filas o error"
    QUERY_FAIL=$((QUERY_FAIL+1))
  fi
done

if [ "$QUERY_FAIL" -gt 0 ]; then
  echo ""
  echo "RESULTADO: FALLA — $QUERY_FAIL consulta(s) sin resultados"
  exit 1
fi

# ─── Limpieza ─────────────────────────────────────────────────────────────────
rm -f "$DUMP_FILE"

echo ""
echo "========================================"
echo " RESULTADO: MIGRACIÓN EXITOSA"
echo " Fin:      $(date '+%Y-%m-%d %H:%M:%S')"
echo " Huellas:   todas coinciden"
echo "========================================"
