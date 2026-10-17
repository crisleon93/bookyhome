#!/usr/bin/env bash
# smoke-test.sh — Prueba de humo BookyHome
# Verifica que los endpoints críticos respondan correctamente.
#
# Uso:
#   bash scripts/smoke-test.sh                        # apunta a localhost (dev)
#   bash scripts/smoke-test.sh https://api.bookyhome.com.co  # servidor/nube
#
# Salida: código 0 si todo pasa, código 1 si alguna prueba falla.

set -uo pipefail

BASE_URL="${1:-http://localhost:8000}"
FRONTEND_URL="${2:-http://localhost:5173}"
PASS=0
FAIL=0

# ─── Colores ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_ok()   { echo -e "${GREEN}  ✔ PASS${NC} $1"; PASS=$((PASS+1)); }
log_fail() { echo -e "${RED}  ✘ FAIL${NC} $1"; FAIL=$((FAIL+1)); }
log_info() { echo -e "${YELLOW}  →${NC} $1"; }

echo "========================================"
echo " Prueba de humo — BookyHome"
echo " API:      $BASE_URL"
echo " Frontend: $FRONTEND_URL"
echo " Fecha:    $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

check() {
  local description="$1"
  local url="$2"
  local expected_code="${3:-200}"
  local expected_body="${4:-}"

  response=$(curl -s -o /tmp/smoke_body -w "%{http_code}" \
    --max-time 15 --connect-timeout 5 "$url" 2>/dev/null)
  body=$(cat /tmp/smoke_body 2>/dev/null || echo "")

  if [ "$response" != "$expected_code" ]; then
    log_fail "$description — esperado HTTP $expected_code, obtuvo HTTP $response | URL: $url"
    return
  fi

  if [ -n "$expected_body" ] && ! echo "$body" | grep -q "$expected_body"; then
    log_fail "$description — HTTP $response OK pero body no contiene '$expected_body' | URL: $url"
    return
  fi

  log_ok "$description — HTTP $response"
}

# ─── API ──────────────────────────────────────────────────────────────────────
log_info "Comprobando API ($BASE_URL)..."

check "API raíz"                       "$BASE_URL/"                        200 "BookyHome"
check "API /docs (Swagger)"            "$BASE_URL/docs"                    200 "swagger"
check "API /catalogo/categorias"       "$BASE_URL/catalogo/categorias"     200
check "API /catalogo/busqueda-avanzada" "$BASE_URL/catalogo/busqueda-avanzada" 200

# ─── Endpoint de salud (verificación propia) ─────────────────────────────────
# Verifica que /health responda 200 y que la base de datos esté sana.
log_info "Comprobando endpoint de salud ($BASE_URL/health)..."

health_response=$(curl -s -o /tmp/smoke_health -w "%{http_code}" \
  --max-time 15 --connect-timeout 5 "$BASE_URL/health" 2>/dev/null)
health_body=$(cat /tmp/smoke_health 2>/dev/null || echo "")

if [ "$health_response" = "200" ]; then
  # Verificar que el estado de la base de datos sea "ok"
  db_status=$(echo "$health_body" | grep -o '"database"[[:space:]]*:[[:space:]]*{[^}]*"status"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | tail -1 | grep -o '"[^"]*"$' | tr -d '"')
  if [ "$db_status" = "ok" ]; then
    log_ok "API /health — HTTP 200, base de datos sana"
  else
    log_fail "API /health — HTTP 200 pero base de datos no sana: '$db_status'"
  fi
elif [ "$health_response" = "503" ]; then
  log_fail "API /health — HTTP 503 (dependencia crítica caída)"
else
  log_fail "API /health — esperado HTTP 200, obtuvo HTTP $health_response"
fi

# ─── Verificación propia: catálogo devuelve libros ───────────────────────────
# Comprueba que la API no solo responda, sino que devuelva datos reales.
log_info "Verificación propia: catálogo con datos..."

catalogo_body=$(curl -s --max-time 15 --connect-timeout 5 \
  "$BASE_URL/catalogo/busqueda-avanzada" 2>/dev/null || echo "")

# El endpoint de búsqueda avanzada devuelve un JSON con "libros" o "data"
if echo "$catalogo_body" | grep -q '"libros"\|"data"'; then
  log_ok "Catálogo devuelve estructura JSON con resultados"
else
  log_fail "Catálogo no devuelve estructura JSON esperada"
fi

# ─── Frontend ─────────────────────────────────────────────────────────────────
log_info "Comprobando Frontend ($FRONTEND_URL)..."

check "Frontend raíz"             "$FRONTEND_URL/"          200

# ─── Resultado ────────────────────────────────────────────────────────────────
echo "========================================"
echo -e " ${GREEN}Pasaron: $PASS${NC}  |  ${RED}Fallaron: $FAIL${NC}"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
  echo "RESULTADO: FALLA — $FAIL prueba(s) no pasaron"
  exit 1
else
  echo "RESULTADO: OK — todas las pruebas pasaron"
  exit 0
fi
