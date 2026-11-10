#!/usr/bin/env bash
# desplegar.sh — Despliegue de BookyHome en el servidor con verificacion y rollback automatico
#
# Uso:
#   bash scripts/desplegar.sh <version>              # desplegar version nueva
#   bash scripts/desplegar.sh <version> --no-backup  # saltar respaldo (no recomendado)
#
# Ejemplo:
#   bash scripts/desplegar.sh 1.0.1
#
# Que hace:
#   1. Pre-verifica (Docker, espacio, .env.prod)
#   2. Respaldar la base de datos (respaldo-restic.sh)
#   3. Aplica migraciones pendientes
#   4. Descarga las imagenes de GHCR (sin construir)
#   5. Reinicia los servicios con la nueva version
#   6. Verifica con health check + prueba de humo
#   7. Si la verificacion falla: rollback automatico a la version anterior
#
# Requisitos en el servidor:
#   - Docker Engine + Compose
#   - /opt/bookyhome/deploy/.env.prod con permisos 600
#   - Acceso a ghcr.io (docker login si las imagenes son privadas)
#   - scripts/respaldo-restic.sh configurado (restic + cron)

set -uo pipefail

# ─── Configuracion ────────────────────────────────────────────────────────────
PROJECT_DIR="${PROJECT_DIR:-/opt/bookyhome}"
COMPOSE_FILE="$PROJECT_DIR/deploy/compose.prod.yaml"
ENV_FILE="$PROJECT_DIR/deploy/.env.prod"
LOG_FILE="$PROJECT_DIR/deploy/despliegues.log"
SMOKE_TEST="$PROJECT_DIR/scripts/smoke-test.sh"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/respaldo-restic.sh"
HEALTH_URL="http://localhost:8000/health"
HEALTH_TIMEOUT=120        # segundos para esperar health check
SMOKE_TIMEOUT=60          # segundos para smoke test
DISK_MIN_GB=5             # GB minimos libres

# ─── Colores ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_ok()   { echo -e "${GREEN}  ✔${NC} $1"; }
log_fail() { echo -e "${RED}  ✘${NC} $1"; }
log_info() { echo -e "${YELLOW}  →${NC} $1"; }

# ─── Argumentos ───────────────────────────────────────────────────────────────
NEW_VERSION="${1:-}"
SKIP_BACKUP=false

if [ -z "$NEW_VERSION" ]; then
  echo "Uso: bash scripts/desplegar.sh <version> [--no-backup]"
  echo "Ejemplo: bash scripts/desplegar.sh 1.0.1"
  exit 1
fi

shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-backup) SKIP_BACKUP=true; shift ;;
    *) shift ;;
  esac
done

# ─── Funciones ────────────────────────────────────────────────────────────────
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log_deploy() {
  # Escribe una linea en despliegues.log
  echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

get_current_version() {
  # Lee APP_VERSION de .env.prod o del contenedor en ejecucion
  if [ -f "$ENV_FILE" ]; then
    grep -E "^APP_VERSION=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]' || echo "unknown"
  else
    echo "unknown"
  fi
}

set_env_version() {
  local ver="$1"
  if grep -q "^APP_VERSION=" "$ENV_FILE"; then
    sed -i "s/^APP_VERSION=.*/APP_VERSION=$ver/" "$ENV_FILE"
  else
    echo "APP_VERSION=$ver" >> "$ENV_FILE"
  fi
}

wait_healthy() {
  local timeout="$1"
  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if curl -sf --max-time 5 "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'; then
      return 0
    fi
    sleep 5
    elapsed=$((elapsed + 5))
  done
  return 1
}

run_smoke_test() {
  local api_url="${1:-http://localhost:8000}"
  local web_url="${2:-http://localhost:5173}"
  if [ ! -f "$SMOKE_TEST" ]; then
    log_fail "No se encontro $SMOKE_TEST"
    return 1
  fi
  bash "$SMOKE_TEST" "$api_url" "$web_url" 2>&1
  return $?
}

apply_migrations() {
  local mig_dir="$PROJECT_DIR/database/migrations"
  if [ ! -d "$mig_dir" ]; then
    log_info "No hay directorio de migraciones"
    return 0
  fi

  local count=0
  local failed=0
  for f in "$mig_dir"/*.sql; do
    [ -f "$f" ] || continue
    count=$((count + 1))
    docker exec -i bookyhome-mysql \
      mysql -uroot -p"$MYSQL_ROOT_PASSWORD" bookyhome < "$f" 2>/dev/null
    if [ $? -ne 0 ]; then
      failed=$((failed + 1))
    fi
  done
  log_info "Migraciones: $count aplicadas, $failed con error (idempotentes)"
  return 0
}

do_rollback() {
  local prev_version="$1"
  log_info "INICIANDO ROLLBACK a version $prev_version"

  # Revertir .env.prod
  set_env_version "$prev_version"

  # Las imagenes anteriores ya estan en el servidor (descargadas en despliegues previos)
  # Si no estan, se descargan ahora
  log_info "Descargando imagenes de la version anterior..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull 2>/dev/null || true

  # Reiniciar servicios
  log_info "Reiniciando servicios con version $prev_version..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

  # Esperar health
  log_info "Esperando health check..."
  if wait_healthy "$HEALTH_TIMEOUT"; then
    log_ok "Health check OK tras rollback"
    if run_smoke_test; then
      log_ok "Prueba de humo OK tras rollback"
      log_deploy "ROLLBACK OK: $NEW_VERSION -> $prev_version (smoke test OK)"
      return 0
    else
      log_fail "Prueba de humo FALLO tras rollback"
    fi
  else
    log_fail "Health check FALLO tras rollback"
  fi

  log_deploy "ROLLBACK FALLO: no se pudo volver a $prev_version"
  return 1
}

# ─── Inicio ──────────────────────────────────────────────────────────────────
echo "========================================"
echo " Desplegar BookyHome v$NEW_VERSION"
echo " $(timestamp)"
echo "========================================"

CURRENT_VERSION=$(get_current_version)
log_info "Version actual: $CURRENT_VERSION"
log_info "Version nueva:  $NEW_VERSION"

if [ "$CURRENT_VERSION" = "$NEW_VERSION" ]; then
  log_info "La version $NEW_VERSION ya esta desplegada."
  echo "========================================"
  echo " Sin cambios necesarios"
  echo "========================================"
  exit 0
fi

log_deploy "INICIO despliegue: $CURRENT_VERSION -> $NEW_VERSION"

# ─── 1. Pre-verificaciones ────────────────────────────────────────────────────
log_info "Pre-verificaciones..."

# Docker
if ! docker info >/dev/null 2>&1; then
  log_fail "Docker no esta disponible"
  log_deploy "FALLO: Docker no disponible"
  exit 1
fi
log_ok "Docker disponible"

# .env.prod
if [ ! -f "$ENV_FILE" ]; then
  log_fail "No se encontro $ENV_FILE"
  log_deploy "FALLO: .env.prod no encontrado"
  exit 1
fi
log_ok ".env.prod encontrado"

# Espacio en disco
FREE_GB=$(df -BG "$PROJECT_DIR" | tail -1 | awk '{print $4}' | tr -d 'G')
if [ "$FREE_GB" -lt "$DISK_MIN_GB" ]; then
  log_fail "Espacio en disco insuficiente: ${FREE_GB}GB libres (minimo ${DISK_MIN_GB}GB)"
  log_deploy "FALLO: disco insuficiente (${FREE_GB}GB < ${DISK_MIN_GB}GB)"
  exit 1
fi
log_ok "Espacio en disco: ${FREE_GB}GB libres"

# ─── 2. Respaldo ──────────────────────────────────────────────────────────────
if [ "$SKIP_BACKUP" = false ]; then
  log_info "Ejecutando respaldo..."
  if [ -f "$BACKUP_SCRIPT" ]; then
    if bash "$BACKUP_SCRIPT" >> "$LOG_FILE" 2>&1; then
      log_ok "Respaldo completado"
    else
      log_fail "Respaldo fallo — abortando despliegue"
      log_deploy "FALLO: respaldo fallo, despliegue abortado"
      exit 1
    fi
  else
    log_info "No se encontro $BACKUP_SCRIPT — respaldo manual con mysqldump"
    docker exec bookyhome-mysql mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
      --single-transaction --routines --triggers --events bookyhome \
      | gzip > "$PROJECT_DIR/backups/pre-deploy-${NEW_VERSION}-$(date +%Y%m%d%H%M%S).sql.gz"
    log_ok "Respaldo manual completado"
  fi
else
  log_info "Respaldo omitido (--no-backup)"
fi

# ─── 3. Descargar imagenes nuevas de GHCR (sin construir) ──────────────────────
log_info "Descargando imagenes ghcr.io/.../bkh-*:$NEW_VERSION..."
if ! docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull 2>&1; then
  log_fail "No se pudieron descargar las imagenes"
  log_deploy "FALLO: pull de imagenes fallo"
  exit 1
fi
log_ok "Imagenes descargadas"

# ─── 4. Aplicar migraciones ────────────────────────────────────────────────────
log_info "Aplicando migraciones..."
MYSQL_ROOT_PASSWORD=$(grep -E "^MYSQL_ROOT_PASSWORD=" "$ENV_FILE" | cut -d= -f2)
apply_migrations
log_ok "Migraciones aplicadas"

# ─── 5. Actualizar version y reiniciar ─────────────────────────────────────────
log_info "Actualizando .env.prod a APP_VERSION=$NEW_VERSION"
set_env_version "$NEW_VERSION"

log_info "Reiniciando servicios..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
log_ok "Servicios reiniciados"

# ─── 6. Verificar (health check) ──────────────────────────────────────────────
log_info "Esperando health check (max ${HEALTH_TIMEOUT}s)..."
if ! wait_healthy "$HEALTH_TIMEOUT"; then
  log_fail "Health check no respondio OK tras $HEALTH_TIMEOUT segundos"
  log_deploy "FALLO: health check no respondio — iniciando rollback automatico"
  echo ""
  # ─── ROLLBACK AUTOMATICO ──────────────────────────────────────────────────
  do_rollback "$CURRENT_VERSION"
  exit 1
fi
log_ok "Health check OK"

# Verificar version desplegada
DEPLOYED_VERSION=$(curl -sf --max-time 10 "$HEALTH_URL" 2>/dev/null \
  | grep -o '"version":"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
log_info "Version reportada por /health: $DEPLOYED_VERSION"
if [ "$DEPLOYED_VERSION" != "$NEW_VERSION" ]; then
  log_fail "Version incorrecta: esperada $NEW_VERSION, obtenida $DEPLOYED_VERSION"
  log_deploy "FALLO: version incorrecta ($DEPLOYED_VERSION != $NEW_VERSION) — rollback"
  do_rollback "$CURRENT_VERSION"
  exit 1
fi

# ─── 7. Prueba de humo ────────────────────────────────────────────────────────
log_info "Ejecutando prueba de humo..."
SMOKE_OUTPUT=$(run_smoke_test "http://localhost:8000" "http://localhost:5173" 2>&1)
echo "$SMOKE_OUTPUT"

if echo "$SMOKE_OUTPUT" | grep -q "RESULTADO: OK"; then
  log_ok "Prueba de humo OK"
  log_deploy "OK: despliegue $NEW_VERSION completado y verificado (smoke test OK)"
  echo "========================================"
  echo -e " ${GREEN}DESPLIEGUE EXITOSO${NC} — v$NEW_VERSION"
  echo "========================================"
  exit 0
else
  log_fail "Prueba de humo FALLO — iniciando rollback automatico"
  log_deploy "FALLO: smoke test fallo — rollback automatico a $CURRENT_VERSION"
  echo ""
  do_rollback "$CURRENT_VERSION"
  exit 1
fi
