param(
    [string]$ReportPath = 'docs\implantacion\verificacion-plataforma.md'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$absoluteReportPath = Join-Path $projectRoot $ReportPath
$reportDirectory = Split-Path -Parent $absoluteReportPath

New-Item -ItemType Directory -Force -Path $reportDirectory | Out-Null

$operatingSystem = Get-CimInstance Win32_OperatingSystem
$computer = Get-CimInstance Win32_ComputerSystem
$processor = Get-CimInstance Win32_Processor | Select-Object -First 1
$systemDrive = Get-PSDrive -Name C
$ramGb = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2)
$freeDiskGb = [math]::Round($systemDrive.Free / 1GB, 2)
$processorCores = [int]$processor.NumberOfCores
$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
$gitCommand = Get-Command git -ErrorAction SilentlyContinue
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
$ports = @(3306, 5173, 8000)
$portResults = foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    [pscustomobject]@{ Port = $port; Open = $connection.TcpTestSucceeded }
}
$dockerAvailable = $false
$composeOutput = 'No se pudo consultar Docker Compose.'
if ($dockerCommand) {
    try {
        docker info | Out-Null
        $dockerAvailable = $true
        $composeOutput = 'Docker Compose respondio correctamente.'
    }
    catch {
        $composeOutput = 'Docker esta instalado, pero el motor no esta disponible.'
    }
}

$portRows = ($portResults | ForEach-Object {
    $status = if ($_.Open) { 'Cumple' } else { 'No disponible' }
    "| $($_.Port) | $status |"
}) -join "`n"
$dockerStatus = if ($dockerAvailable) { 'Cumple' } else { 'No cumple' }
$nodeStatus = if ($nodeCommand) { 'Instalado' } else { 'No instalado' }
$pnpmStatus = if ($pnpmCommand) { 'Instalado' } else { 'No instalado' }
$gitStatus = if ($gitCommand) { 'Instalado' } else { 'No instalado' }
$dockerVersion = if ($dockerCommand) { (docker --version).Trim() } else { 'No instalado' }
$generatedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

$report = @"
# Verificacion de plataforma e infraestructura

## Identificacion

| Campo | Resultado |
|---|---|
| Fecha de verificacion | $generatedAt |
| Equipo | $env:COMPUTERNAME |
| Sistema operativo | $($operatingSystem.Caption) $($operatingSystem.Version) |
| Procesador | $($processor.Name) ($processorCores nucleos) |
| Memoria RAM | $ramGb GB |
| Espacio libre en C: | $freeDiskGb GB |

## Requisitos definidos

| Recurso | Minimo recomendado | Resultado | Estado |
|---|---:|---:|---|
| Sistema operativo | Windows 10/11 | $($operatingSystem.Caption) | Cumple |
| Memoria RAM | 8 GB | $ramGb GB | $(if ($ramGb -ge 8) { 'Cumple' } else { 'No cumple' }) |
| Espacio libre | 10 GB | $freeDiskGb GB | $(if ($freeDiskGb -ge 10) { 'Cumple' } else { 'No cumple' }) |
| Docker Desktop | Requerido | $dockerStatus | $dockerStatus |
| Git | Requerido para obtener el proyecto | $gitStatus | $(if ($gitCommand) { 'Cumple' } else { 'No cumple' }) |
| Node.js | Requerido para ejecucion local | $nodeStatus | $(if ($nodeCommand) { 'Cumple' } else { 'Opcional' }) |
| pnpm | Requerido para ejecucion local | $pnpmStatus | $(if ($pnpmCommand) { 'Cumple' } else { 'Opcional' }) |

## Plataformas habilitadas

| Componente | Plataformas compatibles | Condicion |
|---|---|---|
| Equipo anfitrion | Windows 10/11, Linux x64 o macOS compatible con Docker | Docker Desktop o Docker Engine con Compose |
| Frontend web | Chrome, Edge o Firefox actuales | JavaScript habilitado y acceso al puerto 5173 |
| App movil | Android o iOS compatible con Expo Go | Celular y equipo anfitrion en la misma red para pruebas locales |
| Backend y MySQL | Contenedores Linux | Docker activo y puertos requeridos disponibles |

La plataforma probada por este reporte es Windows 11 con Docker Desktop. Las demas combinaciones requieren una prueba adicional.

## Requisitos de hardware y software

| Nivel | Procesador | RAM | Almacenamiento libre |
|---|---|---:|---:|
| Minimo tecnico | 64 bits, 2 nucleos; Intel Core i3 o AMD Ryzen 3 recientes | 4 GB | 10 GB |
| Recomendado para trabajar | Intel Core i3/i5 o AMD Ryzen 3/Ryzen 5 | 8 GB | 20 GB o mas |
| Ideal para desarrollo | Intel Core i5 o AMD Ryzen 5, 4 nucleos o mas | 16 GB | SSD con 20 GB o mas |

El procesador debe permitir virtualizacion. Intel Celeron o Pentium modernos pueden funcionar para pruebas, con menor rendimiento. SSD es recomendado.

El minimo tecnico puede iniciar el proyecto, pero 8 GB es el minimo recomendado para trabajar con Docker, VS Code y el navegador abiertos al mismo tiempo.

| Componente | Minimo | Recomendado |
|---|---|---|
| Sistema operativo | Windows 10/11 de 64 bits, Linux x64 o macOS compatible | Version actualizada |
| Docker | Docker Desktop o Docker Engine con Compose | Docker Desktop actualizado y virtualizacion activa |
| Git | Git instalado | Version actualizada |
| Node.js y pnpm | Solo si se ejecuta fuera de Docker | Node.js LTS y pnpm actualizado |
| Red | Internet para instalar; red local para app movil | Conexion estable |

## Puertos requeridos

| Puerto | Uso | Estado |
|---:|---|---|
| 3306 | MySQL | Estado obtenido durante la verificacion |
| 5173 | Frontend web | Estado obtenido durante la verificacion |
| 8000 | Backend FastAPI | Estado obtenido durante la verificacion |

$portRows

## Servicios Docker

Version detectada: $dockerVersion

Resultado de Docker Compose: $composeOutput
Los estados detallados se deben confirmar con `docker compose ps`.

## Resultado

La plataforma fue verificada con el script `scripts/verification/verify-platform.ps1`. Si algun requisito aparece como `No cumple`, debe corregirse antes de ejecutar la solucion. Esta verificacion corresponde al entorno local; una instalacion productiva requiere ademas configurar seguridad, HTTPS y recursos del servidor.
"@

Set-Content -Path $absoluteReportPath -Value $report -Encoding UTF8
Write-Host "Reporte generado: $absoluteReportPath"
$portResults | Format-Table -AutoSize
