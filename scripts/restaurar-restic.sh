#!/usr/bin/env bash
# =============================================================================
# restaurar-restic.sh — Restauración de desastre desde repositorio restic
# Proyecto : BookyHome
# Motor    : MySQL 8
# Uso      : bash scripts/restaurar-restic.sh [--repo REPO] [--snapshot ID]
#                                           [--base NOMBRE] [--listar]
# Requiere : restic instalado, contenedor MySQL activo
# IMPORTANTE: NUNCA restaurar sobre la base 'bookyhome' en producción sin
#            detener el backend primero. Usar base de prueba por defecto.
# Semana   : 06 — Plan de respaldo final
# =============================================================================
set -euo pipefail

# ---------- Parámetros --------------------------------------------------------
REPO="${RESTIC_REPOSITORY_LOCAL:-/var/respaldos/restic}"
SNAPSHOT="latest"
BASE_DESTINO="bookyhome_restauracion"
CONTENEDOR_MYSQL="bookyhome-mysql"
USUARIO_BD="root"
DUMP_DIR="/tmp/restic-restore"
LISTAR=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)      REPO="$2"; shift 2 ;;
    --snapshot)  SNAPSHOT="$2"; shift 2 ;;
    --base)      BASE_DESTINO="$2"; shift 2 ;;
    --listar)    LISTAR=true; shift ;;
    *) echo "Opción desconocida: $1"; exit 1 ;;
  esac
done

# Contraseña de restic
if [[ -z "${RESTIC_PASSWORD:-}" ]] && [[ -f /etc/restic/password ]]; then
  export RESTIC_PASSWORD
  RESTIC_PASSWORD="$(cat /etc/restic/password)"
fi
if [[ -z "${RESTIC_PASSWORD:-}" ]]; then
  echo "ERROR: No se encontró RESTIC_PASSWORD ni /etc/restic/password"
  exit 1
fi

log() {
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $*"
}

# ---------- Modo listar instantáneas ------------------------------------------
if [[ "$LISTAR" == "true" ]]; then
  echo "Instantáneas disponibles en $REPO:"
  echo ""
  restic -r "$REPO" snapshots
  echo ""
  echo "Para restaurar una específica:"
  echo "  bash scripts/restaurar-restic.sh --snapshot <ID> --base bookyhome_prueba"
  exit 0
fi

# ---------- Verificar dependencias --------------------------------------------
command -v restic >/dev/null 2>&1 || { echo "ERROR: restic no está instalado"; exit 1; }
docker inspect "$CONTENEDOR_MYSQL" --format '{{.State.Running}}' 2>/dev/null | grep -q "true" \
  || { echo "ERROR: El contenedor $CONTENEDOR_MYSQL no está en ejecución"; exit 1; }

# ---------- Protección: no restaurar sobre producción -------------------------
if [[ "$BASE_DESTINO" == "bookyhome" ]]; then
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  ⚠ PELIGRO: Intenta restaurar sobre la base de producción  ║"
  echo "║  Use --base bookyhome_restauracion o detenga el backend     ║"
  echo "║  y confirme explícitamente.                                 ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  read -p "¿Está seguro? Escriba 'RESTAURAR-PRODUCCION' para confirmar: " confirmacion
  [[ "$confirmacion" == "RESTAURAR-PRODUCCION" ]] || { echo "Operación cancelada."; exit 1; }
fi

MYSQL_PASS="$(docker exec "$CONTENEDOR_MYSQL" printenv MYSQL_ROOT_PASSWORD)"

log "════════════════════════════════════════════════════════════════"
log "  Restauración de desastre — BookyHome"
log "════════════════════════════════════════════════════════════════"
log "Repositorio : $REPO"
log "Instantánea : $SNAPSHOT"
log "Base destino: $BASE_DESTINO"
INICIO=$(date +%s)

# ---------- 1. Restaurar archivo del repositorio restic -----------------------
mkdir -p "$DUMP_DIR"
log "Restaurando instantánea desde restic..."
restic -r "$REPO" restore "$SNAPSHOT" --target "$DUMP_DIR"
DUMP_FILE=$(find "$DUMP_DIR" -name "*.sql.gz" -print -quit)
if [[ -z "$DUMP_FILE" || ! -s "$DUMP_FILE" ]]; then
  echo "ERROR: No se encontró archivo .sql.gz en la restauración"
  exit 1
fi
log "Archivo restaurado: $DUMP_FILE ($(stat -c%s "$DUMP_FILE" 2>/dev/null) bytes)"

# ---------- 2. Huellas ANTES de restaurar (producción, referencia) -------------
log "--- Huellas antes de restaurar (producción) ---"
docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO_BD" -p"$MYSQL_PASS" -e \
  "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES \
   WHERE TABLE_SCHEMA='bookyhome' AND TABLE_TYPE='BASE TABLE' \
   ORDER BY TABLE_NAME;" 2>/dev/null

# ---------- 3. Crear base destino ---------------------------------------------
log "Creando base destino: $BASE_DESTINO"
docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO_BD" -p"$MYSQL_PASS" \
  -e "DROP DATABASE IF EXISTS \`$BASE_DESTINO\`; \
      CREATE DATABASE \`$BASE_DESTINO\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" \
  2>/dev/null

# ---------- 4. Restaurar el volcado -------------------------------------------
log "Restaurando volcado en $BASE_DESTINO..."
zcat "$DUMP_FILE" | docker exec -i "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO_BD" -p"$MYSQL_PASS" "$BASE_DESTINO" 2>/dev/null

FIN=$(date +%s)
TIEMPO_SEG=$((FIN - INICIO))

# ---------- 5. Huellas DESPUÉS de restaurar -----------------------------------
log "--- Huellas después de restaurar ($BASE_DESTINO) ---"
docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO_BD" -p"$MYSQL_PASS" -e \
  "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES \
   WHERE TABLE_SCHEMA='$BASE_DESTINO' AND TABLE_TYPE='BASE TABLE' \
   ORDER BY TABLE_NAME;" 2>/dev/null

# ---------- 6. Comparación de huellas ----------------------------------------
log "--- Comparación de huellas (CHECKSUM TABLE) ---"
docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO_BD" -p"$MYSQL_PASS" -e \
  "CHECKSUM TABLE bookyhome.usuarios, bookyhome.tiendas, bookyhome.libros, \
   bookyhome.ordenes_compra, bookyhome.pagos, bookyhome.notificaciones, \
   bookyhome.resenas_libros, bookyhome.categorias;" 2>/dev/null
echo ""
docker exec "$CONTENEDOR_MYSQL" \
  mysql -u"$USUARIO_BD" -p"$MYSQL_PASS" -e \
  "CHECKSUM TABLE ${BASE_DESTINO}.usuarios, ${BASE_DESTINO}.tiendas, ${BASE_DESTINO}.libros, \
   ${BASE_DESTINO}.ordenes_compra, ${BASE_DESTINO}.pagos, ${BASE_DESTINO}.notificaciones, \
   ${BASE_DESTINO}.resenas_libros, ${BASE_DESTINO}.categorias;" 2>/dev/null

# ---------- 7. Resumen --------------------------------------------------------
log "════════════════════════════════════════════════════════════════"
log "  Restauración completada"
log "  Tiempo total : ${TIEMPO_SEG} segundos"
log "  Base destino : $BASE_DESTINO"
log "  RTO acordado : 2 horas (7200 segundos)"
if [[ $TIEMPO_SEG -lt 7200 ]]; then
  log "  Estado       : ✅ CUMPLE el RTO"
else
  log "  Estado       : ⚠ EXCEDE el RTO"
fi
log "════════════════════════════════════════════════════════════════"
echo ""
echo "Para limpiar la base restaurada:"
echo "  docker exec -i bookyhome-mysql mysql -uroot -p'<pass>' -e 'DROP DATABASE \`$BASE_DESTINO\`;'"
