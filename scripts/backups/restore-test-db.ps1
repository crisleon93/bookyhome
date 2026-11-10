param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$Database = 'bookyhome_prueba'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupPath = if ([System.IO.Path]::IsPathRooted($BackupFile)) { $BackupFile } else { Join-Path $projectRoot $BackupFile }

if (-not (Test-Path $backupPath)) {
    throw "No existe el respaldo: $backupPath"
}

if ($Database -eq 'bookyhome') {
    throw 'La base de prueba no puede llamarse bookyhome.'
}

Push-Location $projectRoot
try {
    & docker compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS $Database;"
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo crear la base de prueba con el codigo $LASTEXITCODE."
    }

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'restore-db.ps1') -BackupFile $backupPath -Database $Database -Force
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo restaurar la base de prueba con el codigo $LASTEXITCODE."
    }

    $tableCount = (& docker compose exec -T mysql mysql -uroot -proot -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$Database';").Trim()
    if ([int]$tableCount -le 0) {
        throw 'La restauracion termino, pero la base de prueba no contiene tablas.'
    }

    Write-Host "Restauracion de prueba completada en $Database. Objetos encontrados: $tableCount"
}
finally {
    Pop-Location
}