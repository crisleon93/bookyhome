#!/usr/bin/env bash
# =============================================================================
# crear-roles-bd.sh — Creación de roles de base de datos con mínimo privilegio
# Proyecto : BookyHome
# Motor    : MySQL 8
# Uso      : bash scripts/crear-roles-bd.sh [--host HOST] [--port PUERTO]
# Notas    : NO contiene contraseñas reales. Las contraseñas se leen de
#            variables de entorno o se generan aleatoriamente y se muestran
#            una sola vez. Ejecutar como root de MySQL o como admin de la BD.
# Semana   : 06 — Seguridad, Usuarios y Plan de Respaldo Final
# =============================================================================
set -euo pipefail

# ---------- Parámetros --------------------------------------------------------
MYSQL_HOST="${DB_HOST:-127.0.0.1}"
MYSQL_PORT="${DB_PORT:-3306}"
MYSQL_ADMIN_USER="${MYSQL_ADMIN_USER:-root}"
MYSQL_ADMIN_PASSWORD="${MYSQL_ADMIN_PASSWORD:-}"
BASE_DE_DATOS="${DB_NAME:-bookyhome}"
CONTENEDOR_MYSQL="bookyhome-mysql"

# Prefijo para los nombres de rol
PREFIX="bookyhome"

# Roles a crear
ROL_OWNER="${PREFIX}_owner"
ROL_APP="${PREFIX}_app"

# Contraseñas: se leen de entorno o se generan aleatoriamente
OWNER_PASSWORD="${OWNER_PASSWORD:-$(openssl rand -base64 24)}"
APP_PASSWORD="${APP_PASSWORD:-$(openssl rand -base64 24)}"

# Hosts permitidos para conectarse (desde la red Docker interna)
ALLOW_HOST="${ALLOW_HOST:-%}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) MYSQL_HOST="$2"; shift 2 ;;
    --port) MYSQL_PORT="$2"; shift 2 ;;
    *) echo "Opción desconocida: $1"; exit 1 ;;
  esac
done

log() {
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $*"
}

# ---------- Función para ejecutar SQL -----------------------------------------
# Si el contenedor Docker está activo, ejecuta dentro de él.
# Si no, usa el cliente mysql del host.
exec_sql() {
  local sql="$1"
  if docker inspect "$CONTENEDOR_MYSQL" --format '{{.State.Running}}' 2>/dev/null | grep -q "true"; then
    docker exec -i "$CONTENEDOR_MYSQL" \
      mysql -u"$MYSQL_ADMIN_USER" -p"$(docker exec "$CONTENEDOR_MYSQL" printenv MYSQL_ROOT_PASSWORD)" \
      "$BASE_DE_DATOS" 2>/dev/null <<< "$sql"
  else
    mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_ADMIN_USER" -p"$MYSQL_ADMIN_PASSWORD" \
      "$BASE_DE_DATOS" 2>/dev/null <<< "$sql"
  fi
}

# ---------- 1. Crear rol owner (migraciones) ----------------------------------
# Privilegios: ALL PRIVILEGES en bookyhome.* (incluye DDL: CREATE, ALTER, DROP)
# No puede: CREATE USER, CREATE DATABASE (esos son privilegios globales)
log "Creando rol owner: ${ROL_OWNER}"
exec_sql "
CREATE USER IF NOT EXISTS '${ROL_OWNER}'@'${ALLOW_HOST}'
  IDENTIFIED BY '${OWNER_PASSWORD}';

GRANT ALL PRIVILEGES ON \`${BASE_DE_DATOS}\`.*
  TO '${ROL_OWNER}'@'${ALLOW_HOST}';
"
log "  Rol owner creado con ALL PRIVILEGES en ${BASE_DE_DATOS}.*"

# ---------- 2. Crear rol app (aplicación) ------------------------------------
# Privilegios: SELECT, INSERT, UPDATE, DELETE únicamente
# No puede: CREATE, ALTER, DROP, TRUNCATE, INDEX, REFERENCES, GRANT
log "Creando rol app: ${ROL_APP}"
exec_sql "
CREATE USER IF NOT EXISTS '${ROL_APP}'@'${ALLOW_HOST}'
  IDENTIFIED BY '${APP_PASSWORD}';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON \`${BASE_DE_DATOS}\`.*
  TO '${ROL_APP}'@'${ALLOW_HOST}';
"
log "  Rol app creado con SELECT, INSERT, UPDATE, DELETE en ${BASE_DE_DATOS}.*"

# ---------- 3. Revocar privilegios peligrosos del rol app --------------------
# Asegurarse de que el rol app NO tenga DDL explícito
exec_sql "
REVOKE CREATE, ALTER, DROP, INDEX, REFERENCES, LOCK TABLES, GRANT OPTION
  ON \`${BASE_DE_DATOS}\`.*
  FROM '${ROL_APP}'@'${ALLOW_HOST}' ;
" 2>/dev/null || true
log "  DDL revocado del rol app (CREATE, ALTER, DROP, INDEX, REFERENCES)"

# ---------- 4. Aplicar permisos -----------------------------------------------
exec_sql "FLUSH PRIVILEGES;"
log "Privilegios aplicados (FLUSH PRIVILEGES)"

# ---------- 5. Resumen --------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  Roles de base de datos creados para BookyHome                   ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Rol owner (${ROL_OWNER}):                                       "
echo "║    ALL PRIVILEGES ON ${BASE_DE_DATOS}.* (incluye DDL)            "
echo "║    Usado por: migraciones únicamente                            "
echo "║    Contraseña: GUARDAR en gestor de contraseñas                 "
echo "║                                                                  "
echo "║  Rol app (${ROL_APP}):                                           "
echo "║    SELECT, INSERT, UPDATE, DELETE ON ${BASE_DE_DATOS}.*        "
echo "║    No puede: CREATE, ALTER, DROP, TRUNCATE, INDEX               "
echo "║    Usado por: la aplicación (backend FastAPI)                    "
echo "║    Contraseña: va en .env del servidor (permisos 600)           "
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠  ANOTE ESTAS CONTRASEÑAS AHORA. No se mostrarán de nuevo:"
echo "    OWNER_PASSWORD=${OWNER_PASSWORD}"
echo "    APP_PASSWORD=${APP_PASSWORD}"
echo ""
echo "Pruebas de privilegios (deben fallar con el rol app):"
echo "  docker exec -i bookyhome-mysql mysql -u${ROL_APP} -p'${APP_PASSWORD}' -e \"DROP TABLE usuarios;\" bookyhome"
