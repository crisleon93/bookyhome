# Scripts de backups

Esta carpeta contiene las herramientas para respaldar y restaurar la base de datos MySQL de BookyHome.

## Archivos

- `backup-db.ps1`: crea un backup y elimina los archivos con mas de la retencion indicada.
- `restore-db.ps1`: restaura un archivo `.sql` en una base indicada.
- `restore-test-db.ps1`: crea una base separada y prueba la restauracion sin tocar `bookyhome`.
- `configure-backup-task.ps1`: registra la tarea diaria de Windows.

## Requisitos

Ejecutar desde la raiz del proyecto, con Docker Desktop y los servicios activos:

```powershell
docker compose up -d
```

## Uso

Crear un backup manual:

```powershell
.\scripts\backups\backup-db.ps1
```

Configurar backup diario a las 8:00 p. m. y conservar 30 dias:

```powershell
.\scripts\backups\configure-backup-task.ps1
```

Probar una restauracion de forma segura:

```powershell
.\scripts\backups\restore-test-db.ps1 -BackupFile backups\bookyhome-AAAAMMDD-HHMMSS.sql
```

Restaurar una base especifica requiere `-Force`:

```powershell
.\scripts\backups\restore-db.ps1 -BackupFile backups\bookyhome-AAAAMMDD-HHMMSS.sql -Database bookyhome -Force
```

Para mas informacion consulta [el plan de migracion y respaldos](../../docs/implantacion/plan-migracion-respaldos.md).
