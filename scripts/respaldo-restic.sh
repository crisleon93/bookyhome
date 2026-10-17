#!/usr/bin/env bash
# =============================================================================
# respaldo-restic.sh — Respaldo cifrado de la base de datos BookyHome con restic
# Proyecto : BookyHome
# Motor    : MySQL 8
# Uso      : bash scripts/respaldo-restic.sh
# Requiere : restic instalado, contenedor MySQL activo, repositorio restic init
# Semana   : 06 — Plan de respaldo final (reemplaza v0 de semana 2)
# =============================================================================
set -euo pipefail

# ---------- Configuración -----------------------------------------------------

# Repositorios restic (local + externo)
REPO_LOCAL="${RESTIC_REPOSITORY_LOCAL:-/var/respaldos/restic}"
REPO_REMOTO="${RESTIC_REPOSITORY_REMOTO:-sftp:respaldo@nas-libreria:/respaldos/bookyhome}"

# Contraseña de restic (debe estar en /etc/restic/password o en entorno)
# Prioridad: variable de entorno > archivo /etc/restic/password
if [[ -z "${RESTIC_PASSWORD:-}" ]] && [[ -f /etc/restic/password ]]; then
  export RESTIC_PASSWORD
  RESTIC_PASSWORD="$(cat /etc/restic/password)"
fi
if [[ -z "${RESTIC_PASSWORD:-}" ]]; then
  echo "ERROR: No se encontró RESTIC_PASSWORD ni /etc/restic/password"
  echo "       Genere una con: openssl rand -base64 32 > /etc/restic/password"
  echo "       Luego: chmod 600 /etc/restic/password"
  exit 1
fi

# Parámetros de la base de datos
BASE_DE_DATOS="${DB_NAME:-bookyhome}"
USUARIO_BD="${DB_USER:-root}"
CONTENEDOR_MYSQL="bookyhome-mysql"

# Directorio temporal para el volcado
DUMP_DIR="${DUMP_DIR:-/tmp/restic-dump}"
DUMP_FILE="${DUMP_DIR}/bookyhome-$(date -u +%Y%m%d-%H%M%S).sql.gz"

# Retención (política 3-2-1)
KEEP_DAILY=7
KEEP_WEEKLY=4
KEEP_MONTHLY=12

# Archivo de log
LOG_FILE="${LOG_FILE:-/var/log/restic-bookyhome.log}"

# ---------- Funciones ---------------------------------------------------------
log() {
  local msg="[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

error_exit() {
  log "ERROR: $*"
  exit 1
}

# ---------- Inicio ------------------------------------------------------------
log "════════════════════════════════════════════════════════════════"
log "  Respaldo cifrado BookyHome — restic + mysqldump"
log "════════════════════════════════════════════════════════════════"
log "Base de datos : $BASE_DE_DATOS"
log "Repo local    : $REPO_LOCAL"
log "Repo remoto   : $REPO_REMOTO"
log "Retención     : ${KEEP_DAILY} diarios, ${KEEP_WEEKLY} semanales, ${KEEP_MONTHLY} mensuales"

# ---------- 0. Verificar dependencias ----------------------------------------
command -v restic >/dev/null 2>&1 || error_exit "restic no está instalado"
docker inspect "$CONTENEDOR_MYSQL" --format '{{.State.Running}}' 2>/dev/null | grep -q "true" \
  || error_exit "El contenedor $CONTENEDOR_MYSQL no está en ejecución"
log "Dependencias: OK (restic + MySQL activos)"

# ---------- 1. Volcado de la base de datos ------------------------------------
mkdir -p "$DUMP_DIR"
log "Iniciando mysqldump..."

MYSQL_PASS="$(docker exec "$CONTENEDOR_MYSQL" printenv MYSQL_ROOT_PASSWORD)"

docker exec "$CONTENEDOR_MYSQL" \
  mysqldump \
    -u"$USUARIO_BD" \
    -p"$MYSQL_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    "$BASE_DE_DATOS" \
  2>/dev/null \
  | gzip -9 > "$DUMP_FILE"

if [[ ! -s "$DUMP_FILE" ]]; then
  error_exit "El volcado está vacío o no se creó"
fi

TAMANIO_BYTES=$(stat -c%s "$DUMP_FILE" 2>/dev/null || stat -f%z "$DUMP_FILE" 2>/dev/null)
TAMANIO_MB=$(awk "BEGIN { printf \"%.2f\", $TAMANIO_BYTES / 1048576 }")
log "Volcado creado: $DUMP_FILE (${TAMANIO_MB} MB comprimido)"

# Verificación: contar CREATE TABLE en el volcado
TABLAS=$(zcat "$DUMP_FILE" 2>/dev/null | grep -c "^CREATE TABLE" || echo 0)
log "Tablas en el volcado: $TABLAS"

# ---------- 2. Respaldo en repositorio LOCAL ----------------------------------
log "Ejecutando restic backup → repositorio local..."
restic -r "$REPO_LOCAL" backup "$DUMP_FILE" \
  --tag bookyhome \
  --tag "db-${BASE_DE_DATOS}" \
  --tag "$(date -u +%Y-%m-%d)" \
  2>&1 | tee -a "$LOG_FILE"

# ---------- 3. Respaldo en repositorio REMOTO (fuera del sitio) ---------------
log "Ejecutando restic backup → repositorio remoto..."
restic -r "$REPO_REMOTO" backup "$DUMP_FILE" \
  --tag bookyhome \
  --tag "db-${BASE_DE_DATOS}" \
  --tag "$(date -u +%Y-%m-%d)" \
  2>&1 | tee -a "$LOG_FILE"

# ---------- 4. Verificación automática (restic check) ------------------------
log "Verificando integridad del repositorio local..."
restic -r "$REPO_LOCAL" check 2>&1 | tee -a "$LOG_FILE"

log "Verificando integridad del repositorio remoto..."
restic -r "$REPO_REMOTO" check 2>&1 | tee -a "$LOG_FILE"

# ---------- 5. Aplicar retención (forget + prune) -----------------------------
log "Aplicando retención: ${KEEP_DAILY} diarios, ${KEEP_WEEKLY} semanales, ${KEEP_MONTHLY} mensuales"

for REPO in "$REPO_LOCAL" "$REPO_REMOTO"; do
  log "Retención en: $REPO"
  restic -r "$REPO" forget \
    --keep-daily "$KEEP_DAILY" \
    --keep-weekly "$KEEP_WEEKLY" \
    --keep-monthly "$KEEP_MONTHLY" \
    --prune 2>&1 | tee -a "$LOG_FILE"
done

# ---------- 6. Limpieza del volcado temporal ----------------------------------
rm -f "$DUMP_FILE"
log "Volcado temporal eliminado: $DUMP_FILE"

# ---------- 7. Resumen final --------------------------------------------------
log "════════════════════════════════════════════════════════════════"
log "  Respaldo completado con éxito"
log "  Base     : $BASE_DE_DATOS"
log "  Tamaño   : ${TAMANIO_MB} MB"
log "  Tablas   : $TABLAS"
log "  Local    : $REPO_LOCAL"
log "  Remoto   : $REPO_REMOTO"
log "  Retención: ${KEEP_DAILY}d / ${KEEP_WEEKLY}w / ${KEEP_MONTHLY}m"
log "════════════════════════════════════════════════════════════════"

echo ""
echo "Para ver instantáneas disponibles:"
echo "  restic -r $REPO_LOCAL snapshots"
echo ""
echo "Para restaurar:"
echo "  bash scripts/restaurar-restic.sh"
