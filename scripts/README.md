# Scripts de BookyHome

Esta carpeta contiene herramientas operativas separadas por funcion.

## Carpetas

- `backups/`: crear backups, restaurarlos y configurar la tarea automatica.
- `verification/`: verificar requisitos del equipo, puertos y servicios Docker.

La carpeta `scripts/` debe mantenerse en Git para que todos los integrantes tengan las mismas herramientas. Los archivos generados se guardan en la carpeta raiz `backups/`, que esta excluida de Git porque puede contener datos reales.

## Requisitos

- Windows PowerShell.
- Docker Desktop iniciado.
- Los servicios de BookyHome levantados con `docker compose up -d`.
- Ejecutar los comandos desde la raiz del proyecto (`C:\BKH`).

## Ubicacion de la documentacion

Cada carpeta contiene un README con sus instrucciones especificas:

- [Guia de backups](backups/README.md)
- [Guia de verificacion](verification/README.md)

## Verificar plataforma e infraestructura

Para comprobar el hardware, software, puertos y servicios Docker, ejecuta desde la raiz:

```powershell
.\scripts\verification\verify-platform.ps1
```

El script revisa el equipo actual y actualiza el reporte:

```text
docs\implantacion\verificacion-plataforma.md
```

Ese reporte es la evidencia del criterio 1. No se actualiza este README ni el README principal. El resultado incluye sistema operativo, procesador, nucleos, RAM, espacio libre, herramientas instaladas, plataformas compatibles, puertos y estado de Docker.

Si cada integrante debe conservar su propia evidencia sin sobrescribir el reporte comun, puede usar un nombre diferente:

```powershell
.\scripts\verification\verify-platform.ps1 -ReportPath docs\implantacion\verificacion-JUAN.md
```

Se debe reemplazar `JUAN` por el nombre o identificador del integrante. Ese archivo puede compartirse por Git como evidencia; los archivos de `backups/` siguen siendo locales y estan excluidos por `.gitignore`.

## Crear un backup manual

Ejecuta:

```powershell
.\scripts\backups\backup-db.ps1
```

El script crea un archivo como:

```text
backups\bookyhome-20260824-200000.sql
```

El nombre incluye la fecha y hora de creacion. El archivo contiene la estructura y los datos de MySQL, como usuarios, libros, tiendas, pedidos, pagos y reclamos. No es una copia del codigo fuente ni incluye automaticamente los archivos de `uploads/`.

Por defecto, se eliminan los backups con mas de 30 dias cuando se ejecuta un nuevo backup. Para usar otra retencion:

```powershell
.\scripts\backups\backup-db.ps1 -RetentionDays 60
```

## Configurar backup automatico

Cada integrante debe configurar la tarea una sola vez en su propio computador:

```powershell
.\scripts\backups\configure-backup-task.ps1
```

Esto crea la tarea de Windows `BookyHome - Backup diario`, programada por defecto a las 8:00 p. m. y con retencion de 30 dias.

Para elegir otra hora y retencion:

```powershell
.\scripts\backups\configure-backup-task.ps1 -Time 21:00 -RetentionDays 30
```

La hora queda guardada internamente en el Programador de tareas de Windows. No se modifica ningun archivo del proyecto, por lo que `git add .` no sube la hora configurada ni cambia la hora de los demas integrantes.

La tarea crea un backup diario y, durante esa misma ejecucion, elimina los archivos que superen la retencion configurada. Docker Desktop y el computador deben estar disponibles a la hora programada. Si Docker esta apagado, esa ejecucion no podra crear el backup.

## Restaurar un backup

La restauracion carga un archivo `.sql` en MySQL y puede reemplazar los datos actuales. Antes de restaurar sobre la base principal, crea un backup actual y verifica el archivo que vas a usar.

Con los servicios iniciados, ejecuta:

```powershell
.\scripts\backups\restore-db.ps1 -BackupFile backups\bookyhome-AAAAMMDD-HHMMSS.sql -Force
```

El parametro `-Force` es obligatorio porque confirma que aceptas la restauracion. Cuando sea posible, prueba primero el archivo en una base de datos separada.

Para hacer una prueba segura, usa el script que crea la base `bookyhome_prueba` y valida que contenga objetos:

```powershell
.\scripts\backups\restore-test-db.ps1 -BackupFile backups\bookyhome-AAAAMMDD-HHMMSS.sql
```

Este comando no restaura en `bookyhome`. Si necesitas utilizar otra base de prueba:

```powershell
.\scripts\backups\restore-test-db.ps1 -BackupFile backups\bookyhome-AAAAMMDD-HHMMSS.sql -Database bookyhome_prueba_2
```

## Verificacion

Despues de crear un backup, comprueba que exista y que no tenga tamaño cero:

```powershell
Get-ChildItem .\backups\bookyhome-*.sql | Select-Object Name,Length,LastWriteTime
```

Los backups deben probarse periodicamente mediante una restauracion controlada. Si los archivos de `uploads/` son importantes, deben respaldarse mediante un procedimiento separado.
