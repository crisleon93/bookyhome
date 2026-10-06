#!/usr/bin/env bash
set -u

echo "=== Verificación de requisitos BookyHome ==="
echo "Fecha: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

echo "Servidor: $(hostname 2>/dev/null || echo 'desconocido')"

if [ -f /etc/os-release ]; then
  . /etc/os-release
  echo "Sistema operativo: ${PRETTY_NAME:-$NAME}"
  echo "Arquitectura: $(uname -m)"
else
  echo "Sistema operativo: $(uname -s)"
  echo "Arquitectura: $(uname -m)"
fi

if command -v lscpu >/dev/null 2>&1; then
  cpu_model=$(lscpu | sed -n 's/^Model name:\s*//p' | head -n 1)
  cpu_cores=$(nproc 2>/dev/null || echo "$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 1)" )
  if [ -n "$cpu_model" ]; then
    echo "CPU: ${cpu_cores} núcleos - ${cpu_model}"
  else
    echo "CPU: ${cpu_cores} núcleos"
  fi
else
  echo "CPU: $(nproc 2>/dev/null || echo 'no disponible')"
fi

if [ -r /proc/meminfo ]; then
  mem_total_kb=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
  mem_total_mb=$((mem_total_kb / 1024))
  mem_total_gb=$((mem_total_mb / 1024))
  mem_avail_kb=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
  mem_avail_mb=$((mem_avail_kb / 1024))
  mem_avail_gb=$((mem_avail_mb / 1024))
  echo "Memoria total: ${mem_total_gb} GB"
  echo "Memoria disponible: ${mem_avail_gb} GB"
else
  echo "Memoria total: no disponible"
  echo "Memoria disponible: no disponible"
fi

if command -v df >/dev/null 2>&1; then
  disk_info=$(df -h / | tail -n +2 | head -n 1)
  echo "Espacio en disco (/): ${disk_info}"
else
  echo "Espacio en disco: no disponible"
fi

echo ""
echo "=== Herramientas del stack ==="
for tool in docker docker-compose python3 node npm pnpm mysql; do
  if command -v "$tool" >/dev/null 2>&1; then
    case "$tool" in
      docker)
        echo "Docker: $(docker --version 2>/dev/null | head -n 1)"
        ;;
      docker-compose)
        echo "Docker Compose: $(docker compose version 2>/dev/null | head -n 1 || echo 'no disponible')"
        ;;
      python3)
        echo "Python: $(python3 --version 2>/dev/null)"
        ;;
      node)
        echo "Node.js: $(node --version 2>/dev/null)"
        ;;
      npm)
        echo "npm: $(npm --version 2>/dev/null)"
        ;;
      pnpm)
        echo "pnpm: $(pnpm --version 2>/dev/null)"
        ;;
      mysql)
        echo "MySQL: $(mysql --version 2>/dev/null | head -n 1)"
        ;;
    esac
  else
    echo "${tool}: no instalado"
  fi
done

echo ""
echo "=== Validación del proyecto ==="
if [ -f "docker-compose.yml" ]; then
  echo "docker-compose.yml: detectado"
else
  echo "docker-compose.yml: no encontrado"
fi

if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
  echo "backend: detectado"
fi

if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "frontend: detectado"
fi

if [ -d "database" ]; then
  echo "database: detectado"
fi

echo ""
echo "=== Requisitos mínimos del proyecto ==="
echo "- CPU mínimo: 2 vCPU"
echo "- RAM mínima: 4 GB"
echo "- Disco mínimo: 40 GB SSD"
echo "- Sistema operativo recomendado: Ubuntu Server 24.04 LTS"

cpu_ok=false
mem_ok=false
disk_ok=false

if [ -n "${cpu_cores:-}" ] && [ "$cpu_cores" -ge 2 ]; then
  cpu_ok=true
fi

if [ -n "${mem_total_gb:-}" ] && [ "$mem_total_gb" -ge 4 ]; then
  mem_ok=true
fi

if command -v df >/dev/null 2>&1; then
  disk_free_kb=$(df -k / 2>/dev/null | tail -n +2 | awk '{print $4}' | head -n 1)
  if [ -n "$disk_free_kb" ] && [ "$disk_free_kb" -ge 41943040 ]; then
    disk_ok=true
  fi
fi

echo ""
printf "Resultado: "
if [ "$cpu_ok" = true ] && [ "$mem_ok" = true ] && [ "$disk_ok" = true ]; then
  echo "CUMPLE LOS REQUISITOS MÍNIMOS"
else
  echo "NO CUMPLE LOS REQUISITOS MÍNIMOS"
fi

echo ""
echo "Conclusión: este entorno debe tener al menos 2 vCPU, 4 GB RAM y 40 GB SSD para operar BookyHome sin problema. Para producción se recomienda 4 vCPU, 8 GB RAM y 80 GB SSD."
