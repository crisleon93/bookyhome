param(
    [string]$Time = '20:00',
    [int]$RetentionDays = 30
)

$ErrorActionPreference = 'Stop'
$taskName = 'BookyHome - Backup diario'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backupScript = Join-Path $PSScriptRoot 'backup-db.ps1'

if (-not (Test-Path $backupScript)) {
    throw "No existe el script de backup: $backupScript"
}

try {
    $parsedTime = [datetime]::ParseExact($Time, 'HH:mm', $null)
}
catch {
    throw 'La hora debe tener el formato HH:mm, por ejemplo 23:00.'
}

$powerShell = (Get-Command powershell.exe).Source
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -RetentionDays $RetentionDays"
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $parsedTime
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Crea el backup diario de la base BookyHome y elimina respaldos con la retencion configurada.' -Force | Out-Null

Write-Host "Tarea configurada: $taskName"
Write-Host "Hora diaria: $($parsedTime.ToString('HH:mm'))"
Write-Host "Retencion: $RetentionDays dias"
Write-Host 'Docker Desktop debe estar iniciado para que el backup pueda ejecutarse.'
