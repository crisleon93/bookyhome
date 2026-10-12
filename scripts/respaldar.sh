#!/usr/bin/env bash
# =============================================================================
# respaldar.sh — Respaldo de la base de datos BookyHome (MySQL)
# Proyecto : BookyHome
# Uso      : bash scripts/respaldar.sh [--retencion DIAS] [--base NOMBRE]
# Requiere : Docker Engine con el servicio mysql levantado (docker compose up)
# Semana   : 02 — Plan de Respaldo
# =============================================================================
set -euo pipefail

# ---------- Parámetros con valores por defecto --------------------------------
RETENCION_DIAS=30
BASE_DE_DATOS="bookyhome"
USUARIO="root"
CONTENEDOR_MYSQL="bookyhome-mysql"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --retencion) RETENCION_DIAS="$2"; shift 2 ;;
    --base)      BASE_DE_DATOS="$2"; shift 2 ;;
    *) echo "Opción desconocida: $1"; exit 1 ;;
  esac
done

# ---------- Rutas -------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +"%Y%m%d-%H%M%S")"
ARCHIVO="$BACKUP_DIR/${BASE_DE_DATOS}-${TIMESTAMP}.sql.gz"
ARCHIVO_LOG="$BACKUP_DIR/respaldar.log"

log() {
  local msg="[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $*"
  echo "$msg"
  echo "$msg" >> "$ARCHIVO_LOG"
}

log "=== Inicio de respaldo BookyHome ==="
log "Base       : $BASE_DE_DATOS"
log "Contenedor : $CONTENEDOR_MYSQL"
log "Destino    : $ARCHIVO"
log "Retención  : $RETENCION_DIAS días"

# ---------- 1. Verificar que el contenedor está disponible -------------------
if ! docker inspect "$CONTENEDOR_MYSQL" --format '{{.State.Running}}' 2>/dev/null | grep -q "true"; then
  log "ERROR: El contenedor $CONTENEDOR_MYSQL no está en ejecución."
  log "       Levante el proyecto con: docker compose up -d"
  exit 1
fi
log "Contenedor activo: OK"

# ---------- 2. Ejecutar mysqldump y comprimir en un solo paso ---------------
# --single-transaction : respaldo consistente sin bloquear tablas InnoDB
# --routines           : incluye funciones y procedimientos almacenados
# --triggers           : incluye triggers
# --events             : incluye eventos programados
# La salida se comprime con gzip para reducir el tamaño en disco.
docker exec "$CONTENEDOR_MYSQL" \
  mysqldump \
    -u"$USUARIO" \
    -p"$(docker exec "$CONTENEDOR_MYSQL" printenv MYSQL_ROOT_PASSWORD)" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    "$BASE_DE_DATOS" \
  2>/dev/null \
  | gzip -9 > "$ARCHIVO"

if [[ ! -f "$ARCHIVO" || ! -s "$ARCHIVO" ]]; then
  log "ERROR: El archivo de respaldo no se creó o está vacío."
  exit 1
fi

TAMANIO_BYTES=$(stat -c%s "$ARCHIVO" 2>/dev/null || stat -f%z "$ARCHIVO" 2>/dev/null || echo "0")
TAMANIO_MB=$(awk "BEGIN { printf \"%.2f\", $TAMANIO_BYTES / 1048576 }")
log "Respaldo creado: $ARCHIVO (${TAMANIO_MB} MB)"

# ---------- 3. Verificación básica del archivo ------------------------------
LINEAS=$(zcat "$ARCHIVO" 2>/dev/null | grep -c "^CREATE TABLE" || echo 0)
log "Tablas encontradas en el volcado: $LINEAS"
if [[ "$LINEAS" -eq 0 ]]; then
  log "ADVERTENCIA: No se detectaron sentencias CREATE TABLE. Verifique el archivo manualmente."
fi

# ---------- 4. Retención: eliminar respaldos más antiguos ------------------
ELIMINADOS=0
while IFS= read -r -d '' viejo; do
  rm -f "$viejo"
  log "Eliminado por retención: $(basename "$viejo")"
  (( ELIMINADOS++ )) || true
done < <(find "$BACKUP_DIR" -maxdepth 1 -name "${BASE_DE_DATOS}-*.sql.gz" \
           -mtime +"$RETENCION_DIAS" -print0 2>/dev/null)

log "Archivos eliminados por retención: $ELIMINADOS"

# ---------- 5. Resumen final -------------------------------------------------
log "=== Respaldo completado con éxito ==="
log "Archivo  : $ARCHIVO"
log "Tamaño   : ${TAMANIO_MB} MB"
log "Tablas   : $LINEAS"
echo ""
echo "Para restaurar en una base de prueba:"
echo "  bash scripts/restaurar.sh --archivo $ARCHIVO --base ${BASE_DE_DATOS}_prueba"
