#!/usr/bin/env bash
set -u

echo "=== Verificación de requisitos BookyHome ==="
echo "Fecha: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "Servidor: nombre omitido por privacidad"

os_name=$(uname -s)
architecture=$(uname -m)
cpu_cores=""
mem_total_kb=""
mem_avail_kb=""
disk_total_kb=""
disk_free_kb=""

format_gb() {
  awk -v kb="$1" 'BEGIN { printf "%.1f", kb / 1048576 }'
}

case "$os_name" in
  MINGW*|MSYS*|CYGWIN*)
    windows_stats=$(powershell.exe -NoProfile -NonInteractive -Command \
      '$os=Get-CimInstance Win32_OperatingSystem; $cpu=(Get-CimInstance Win32_Processor | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum; $disk=Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq ([char]67+[char]58); "$($os.Caption)|$cpu|$($os.TotalVisibleMemorySize)|$($os.FreePhysicalMemory)|$([math]::Floor($disk.Size/1KB))|$([math]::Floor($disk.FreeSpace/1KB))"' 2>/dev/null | tr -d '\r')
    IFS='|' read -r windows_os cpu_cores mem_total_kb mem_avail_kb disk_total_kb disk_free_kb <<EOF
$windows_stats
EOF
    if [ -n "$windows_os" ] && [ -n "$cpu_cores" ] && [ -n "$mem_total_kb" ] && [ -n "$disk_free_kb" ]; then
      echo "Sistema operativo: $windows_os (Git Bash)"
      echo "Arquitectura: $architecture"
      echo "CPU: $cpu_cores procesadores lógicos"
      echo "Memoria total: $(format_gb "$mem_total_kb") GB"
      echo "Memoria disponible: $(format_gb "$mem_avail_kb") GB"
      echo "Disco C: capacidad $(format_gb "$disk_total_kb") GB; libre $(format_gb "$disk_free_kb") GB"
    else
      echo "Sistema operativo: Windows (Git Bash)"
      echo "Arquitectura: $architecture"
      echo "CPU, memoria o disco: no se pudieron consultar con PowerShell"
      cpu_cores=""
    fi
    ;;
  *)
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      echo "Sistema operativo: ${PRETTY_NAME:-${NAME:-desconocido}}"
    else
      echo "Sistema operativo: $os_name"
    fi
    if [ -f /.dockerenv ]; then
      echo "Entorno: contenedor Docker (recursos visibles para el contenedor)"
    else
      echo "Entorno: sistema Linux"
    fi
    echo "Arquitectura: $architecture"

    cpu_cores=$(nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo "")
    if command -v lscpu >/dev/null 2>&1; then
      cpu_model=$(lscpu | sed -n 's/^Model name:[[:space:]]*//p' | head -n 1)
      if [ -n "$cpu_model" ]; then
        echo "CPU: ${cpu_cores:-no disponible} procesadores lógicos - $cpu_model"
      else
        echo "CPU: ${cpu_cores:-no disponible} procesadores lógicos"
      fi
    else
      echo "CPU: ${cpu_cores:-no disponible} procesadores lógicos"
    fi

    if [ -r /proc/meminfo ]; then
      mem_total_kb=$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)
      mem_avail_kb=$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)
      if [ -n "$mem_total_kb" ]; then
        echo "Memoria total: $(format_gb "$mem_total_kb") GB"
      else
        echo "Memoria total: no disponible"
      fi
      if [ -n "$mem_avail_kb" ]; then
        echo "Memoria disponible: $(format_gb "$mem_avail_kb") GB"
      else
        echo "Memoria disponible: no disponible"
      fi
    else
      echo "Memoria total: no disponible"
      echo "Memoria disponible: no disponible"
    fi

    if command -v df >/dev/null 2>&1; then
      disk_row=$(df -Pk / 2>/dev/null | tail -n 1)
      disk_total_kb=$(printf '%s\n' "$disk_row" | awk '{print $2}')
      disk_free_kb=$(printf '%s\n' "$disk_row" | awk '{print $4}')
      if [ -n "$disk_total_kb" ] && [ -n "$disk_free_kb" ]; then
        echo "Disco raíz (/): capacidad $(format_gb "$disk_total_kb") GB; libre $(format_gb "$disk_free_kb") GB"
      else
        echo "Espacio en disco: no disponible"
      fi
    else
      echo "Espacio en disco: no disponible"
    fi
    ;;
esac

echo ""
echo "=== Herramientas del stack ==="
if command -v docker >/dev/null 2>&1; then
  docker_version=$(docker --version 2>/dev/null || echo "no disponible")
  echo "Docker CLI: $docker_version"
  if compose_version=$(docker compose version 2>/dev/null); then
    compose_available=true
  else
    compose_version="no disponible"
    compose_available=false
  fi
  echo "Docker Compose: $compose_version"
  if docker info >/dev/null 2>&1; then
    docker_engine_ok=true
    echo "Motor Docker: disponible"
  else
    docker_engine_ok=false
    echo "Motor Docker: no disponible (Docker Desktop/daemon detenido o sin permisos)"
  fi
else
  docker_engine_ok=false
  compose_available=false
  compose_version="no disponible"
  echo "Docker CLI: no instalado"
  echo "Docker Compose: no disponible"
  echo "Motor Docker: no disponible"
fi

for tool in python3 node npm pnpm mysql; do
  if command -v "$tool" >/dev/null 2>&1; then
    case "$tool" in
      python3) version=$(python3 --version 2>/dev/null) ;;
      node) version=$(node --version 2>/dev/null) ;;
      npm) version=$(npm --version 2>/dev/null) ;;
      pnpm) version=$(pnpm --version 2>/dev/null) ;;
      mysql) version=$(mysql --version 2>/dev/null | head -n 1) ;;
    esac
    if [ -n "$version" ]; then
      echo "$tool: $version"
    else
      echo "$tool: no disponible (comando encontrado, pero no se pudo ejecutar)"
    fi
  else
    echo "$tool: no instalado en el host (puede ejecutarse dentro de Docker)"
  fi
done

echo ""
echo "=== Validación del proyecto ==="
if [ -f "docker-compose.yml" ] || [ -f "compose.yaml" ] || [ -f "compose.yml" ]; then
  echo "Archivo Compose: detectado"
  compose_file_ok=true
else
  echo "Archivo Compose: no encontrado"
  compose_file_ok=false
fi

if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
  echo "Backend: detectado"
fi
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Frontend: detectado"
fi
if [ -d "database" ]; then
  echo "Base de datos: detectada"
fi

echo ""
echo "=== Requisitos mínimos del proyecto ==="
echo "- CPU: 2 procesadores lógicos"
echo "- RAM: 4 GB"
echo "- Espacio libre en disco: 40 GB"
echo "- Docker Engine y Docker Compose: requeridos"
echo "- Sistema operativo recomendado: Ubuntu Server 24.04 LTS"

cpu_ok=false
mem_ok=false
disk_ok=false
compose_ok=false

if [[ "${cpu_cores:-}" =~ ^[0-9]+$ ]] && [ "$cpu_cores" -ge 2 ]; then
  cpu_ok=true
fi
if [[ "${mem_total_kb:-}" =~ ^[0-9]+$ ]] && [ "$mem_total_kb" -ge 4194304 ]; then
  mem_ok=true
fi
if [[ "${disk_free_kb:-}" =~ ^[0-9]+$ ]] && [ "$disk_free_kb" -ge 41943040 ]; then
  disk_ok=true
fi
if [ "${docker_engine_ok:-false}" = true ] && [ "${compose_available:-false}" = true ] && [ "${compose_file_ok:-false}" = true ]; then
  compose_ok=true
fi

echo ""
echo "Comprobaciones:"
printf "  CPU: %s\n" "$([ "$cpu_ok" = true ] && echo "cumple" || echo "no cumple/no disponible")"
printf "  RAM: %s\n" "$([ "$mem_ok" = true ] && echo "cumple" || echo "no cumple/no disponible")"
printf "  Espacio libre en disco (40 GB): %s\n" "$([ "$disk_ok" = true ] && echo "cumple" || echo "no cumple/no disponible")"
printf "  Docker Engine, Compose y archivo de proyecto: %s\n" "$([ "$compose_ok" = true ] && echo "disponibles" || echo "no disponibles/no detectados")"

echo ""
if [ "$cpu_ok" = true ] && [ "$mem_ok" = true ] && [ "$disk_ok" = true ] && [ "$compose_ok" = true ]; then
  echo "Resultado: CUMPLE LOS REQUISITOS MÍNIMOS"
else
  echo "Resultado: NO CUMPLE LOS REQUISITOS MÍNIMOS"
fi
case "$os_name" in
  MINGW*|MSYS*|CYGWIN*)
    echo "Nota: en Windows/Git Bash se reportan los recursos del host y la unidad C:."
    ;;
  *)
    if [ -f /.dockerenv ]; then
      echo "Nota: en contenedor, disco y memoria son los recursos visibles para Docker y pueden no representar la capacidad física disponible."
    fi
    ;;
esac
echo "Para validar producción, ejecute este script en el servidor destino."
