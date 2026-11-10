param(
    [int]$RetentionDays = 30
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backupDirectory = Join-Path $projectRoot 'backups'

New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outputPath = Join-Path $backupDirectory "bookyhome-$timestamp.sql"

Push-Location $projectRoot
try {
    & cmd.exe /c "docker compose exec -T mysql mysqldump -uroot -proot --single-transaction --routines --triggers bookyhome > `"$outputPath`""
    if ($LASTEXITCODE -ne 0) {
        throw "mysqldump fallo con el codigo $LASTEXITCODE."
    }

    if (-not (Test-Path $outputPath) -or (Get-Item $outputPath).Length -eq 0) {
        throw 'El archivo de respaldo no se creo o esta vacio.'
    }

    Get-ChildItem $backupDirectory -Filter 'bookyhome-*.sql' |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
        Remove-Item -Force

    Write-Host "Respaldo creado: $outputPath"
}
finally {
    Pop-Location
}
