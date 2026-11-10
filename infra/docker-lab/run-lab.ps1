# run-lab.ps1 — BookyHome laboratorio Ansible
# Ejecuta el playbook contra un servidor "limpio" en Docker y captura la evidencia.
# Uso: .\infra\docker-lab\run-lab.ps1  (desde la raíz del repositorio)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$LAB  = "$ROOT\infra\docker-lab"
$KEYS = "$LAB\lab-keys"

Write-Host "`n=== BookyHome — Laboratorio Ansible ===" -ForegroundColor Cyan

# ─── 1. Generar llaves SSH del lab (se descartan al finalizar) ────────────────
Write-Host "`n[1/6] Generando llaves SSH del laboratorio..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $KEYS | Out-Null
if (-not (Test-Path "$KEYS\id_ed25519")) {
    & ssh-keygen -t ed25519 -f "$KEYS\id_ed25519" -N "" -C "lab@bookyhome" -q
    Write-Host "    Llaves generadas en $KEYS"
} else {
    Write-Host "    Llaves ya existen, reutilizando."
}

# ─── 2. Construir imágenes y levantar contenedores ───────────────────────────
Write-Host "`n[2/6] Construyendo servidor limpio y nodo de control..." -ForegroundColor Yellow
Set-Location $ROOT
docker compose -f "infra/docker-lab/compose.lab.yaml" up -d --build
if ($LASTEXITCODE -ne 0) { throw "Error al levantar los contenedores del lab" }

Write-Host "    Esperando a que el servidor esté listo (SSH)..."
Start-Sleep -Seconds 15

# ─── 3. Instalar colecciones de Ansible en el nodo de control ────────────────
Write-Host "`n[3/6] Instalando colecciones de Ansible..." -ForegroundColor Yellow
docker exec bkh-control ansible-galaxy collection install `
    community.general ansible.posix community.docker community.mysql `
    --force-with-deps 2>&1

# ─── 4. Verificar conectividad (ping) ─────────────────────────────────────────
Write-Host "`n[4/6] Comprobando acceso al servidor (ping)..." -ForegroundColor Yellow
docker exec bkh-control ansible `
    -i /workspace/infra/docker-lab/inventario-lab.ini `
    bookyhome_lab -m ping
if ($LASTEXITCODE -ne 0) { throw "Fallo el ping al servidor del lab" }

# ─── 5. Primera ejecución del playbook ───────────────────────────────────────
Write-Host "`n[5/6] PRIMERA EJECUCIÓN del playbook..." -ForegroundColor Green
$primera = docker exec bkh-control ansible-playbook `
    -i /workspace/infra/docker-lab/inventario-lab.ini `
    /workspace/infra/docker-lab/instalar-bookyhome-lab.yml `
    --diff 2>&1

$primera | Write-Host
$primera | Out-File "$LAB\evidencia-primera-ejecucion.txt" -Encoding utf8

# ─── 6. Segunda ejecución (idempotencia — debe dar changed=0) ─────────────────
Write-Host "`n[6/6] SEGUNDA EJECUCIÓN (idempotencia)..." -ForegroundColor Green
$segunda = docker exec bkh-control ansible-playbook `
    -i /workspace/infra/docker-lab/inventario-lab.ini `
    /workspace/infra/docker-lab/instalar-bookyhome-lab.yml 2>&1

$segunda | Write-Host
$segunda | Out-File "$LAB\evidencia-segunda-ejecucion.txt" -Encoding utf8

# ─── Verificar changed=0 ─────────────────────────────────────────────────────
$recap = $segunda | Select-String "changed="
Write-Host "`n--- PLAY RECAP (segunda ejecución) ---" -ForegroundColor Cyan
$recap | Write-Host

if ($recap -match "changed=0") {
    Write-Host "`n✔ IDEMPOTENCIA CONFIRMADA: changed=0" -ForegroundColor Green
} else {
    Write-Host "`n⚠ Revisar: la segunda ejecución tuvo cambios." -ForegroundColor Red
}

Write-Host "`nEvidencia guardada en:" -ForegroundColor Cyan
Write-Host "  $LAB\evidencia-primera-ejecucion.txt"
Write-Host "  $LAB\evidencia-segunda-ejecucion.txt"
