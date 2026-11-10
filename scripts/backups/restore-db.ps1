param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [ValidatePattern('^[A-Za-z0-9_]+$')]
    [string]$Database = 'bookyhome',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupPath = if ([System.IO.Path]::IsPathRooted($BackupFile)) { $BackupFile } else { Join-Path $projectRoot $BackupFile }

if (-not (Test-Path $backupPath)) {
    throw "No existe el respaldo: $backupPath"
}

if (-not $Force) {
    throw 'La restauracion reemplaza datos. Repite el comando agregando -Force.'
}

Push-Location $projectRoot
try {
    & cmd.exe /c "docker compose exec -T mysql mysql -uroot -proot $Database < `"$backupPath`""
    if ($LASTEXITCODE -ne 0) {
        throw "mysql fallo al restaurar con el codigo $LASTEXITCODE."
    }

    Write-Host "Restauracion completada desde: $backupPath en la base $Database"
}
finally {
    Pop-Location
}
