# Plan de migracion y respaldos de datos

## 1. Objetivo

Definir el procedimiento para actualizar la base de datos de BookyHome y proteger la informacion durante la puesta en produccion o la instalacion en un nuevo equipo.

## 2. Alcance

Este plan cubre la base de datos MySQL `bookyhome`, sus tablas, vistas, procedimientos, triggers y datos de configuracion. Incluye las migraciones SQL de `database/migrations/` y los backups generados por los scripts de `scripts/`.

Los archivos almacenados en `backend/uploads/` utilizan un volumen separado y no se incluyen automaticamente en el backup SQL. Si contienen informacion importante, deben copiarse con un procedimiento adicional.

## 3. Inventario de fuentes de datos

| Elemento | Ubicacion o servicio | Tratamiento |
|---|---|---|
| Base de datos principal | MySQL, base `bookyhome` | Migraciones y backup SQL |
| Estructura inicial | `database/bookyhome.sql` | Se usa en una base nueva |
| Cambios incrementales | `database/migrations/*.sql` | Se aplican en orden numerico |
| Archivos subidos | Volumen `uploads_data` en `/app/uploads` | Backup separado si aplica |
| Datos locales de desarrollo | `backend/app/data/*.json` | Copia separada si son necesarios |

## 4. Plan de migracion

### 4.1 Antes de migrar

1. Confirmar que existe un backup reciente y que no esta vacio:

```powershell
.\scripts\backups\backup-db.ps1
Get-ChildItem .\backups\bookyhome-*.sql | Select-Object Name,Length,LastWriteTime
```

2. Revisar el cambio SQL y sus dependencias.
3. Probar la migracion en una base de datos de desarrollo.
4. Informar al equipo sobre la ventana de mantenimiento.
5. Confirmar que Docker Desktop y MySQL esten disponibles.

### 4.2 Aplicar una migracion

Las migraciones se ejecutan en orden numerico. Desde la raiz del proyecto, con los servicios levantados:

```powershell
Get-Content database/migrations/NOMBRE.sql | docker compose exec -T mysql mysql -uroot -proot bookyhome
```

Ejemplo:

```powershell
Get-Content database/migrations/020_asegurar_tablas_impulsos.sql | docker compose exec -T mysql mysql -uroot -proot bookyhome
```

Cada migracion debe ser revisada antes de ejecutarse. Las migraciones idempotentes pueden volver a ejecutarse sin duplicar su estructura, pero no se debe asumir esto sin revisar el archivo.

### 4.3 Despues de migrar

1. Revisar los mensajes de MySQL.
2. Confirmar que las tablas, vistas y columnas esperadas existan.
3. Levantar o reiniciar el backend si el cambio afecta su modelo.
4. Probar el flujo funcional relacionado.
5. Registrar fecha, migracion aplicada, responsable y resultado.
6. Crear un nuevo backup despues de una migracion exitosa.

## 5. Plan de backups

| Elemento | Configuracion |
|---|---|
| Herramienta | `scripts/backups/backup-db.ps1` y `mysqldump` |
| Frecuencia | Diaria |
| Hora configurada en este equipo | 20:00 |
| Retencion | 30 dias |
| Ubicacion local | `backups/` |
| Versionamiento | Excluida de Git por contener datos potencialmente reales |
| Contenido | Estructura, datos, vistas, rutinas y triggers de MySQL |

Cada integrante configura su propia tarea de Windows. La hora no se almacena en el proyecto ni se modifica cuando otra persona hace `git add .` o sube cambios.

Para registrar la tarea automatica una sola vez:

```powershell
.\scripts\backups\configure-backup-task.ps1
```

Docker Desktop y el equipo deben estar disponibles a la hora configurada.

## 6. Restauracion y contingencia

1. Detener temporalmente las operaciones que escriban en la base.
2. Crear un backup actual antes de reemplazar datos.
3. Verificar el archivo de respaldo.
4. Preferiblemente restaurar primero en una base de prueba.
5. Ejecutar la prueba en una base separada:

```powershell
.\scripts\backups\restore-test-db.ps1 -BackupFile backups\bookyhome-AAAAMMDD-HHMMSS.sql
```

6. Revisar que las tablas, vistas y datos principales esten disponibles.
7. Ejecutar las pruebas funcionales relacionadas.
8. Registrar el resultado de la restauracion.

Si la restauracion de prueba falla, no se debe utilizar ese archivo en la base principal. Debe conservarse el ultimo backup valido y documentarse el incidente.

## 7. Verificacion de respaldos

Un backup valido debe cumplir como minimo:

- El comando termina sin errores.
- El archivo existe.
- El archivo tiene un tamaño mayor que cero.
- El archivo contiene estructura y datos esperados.
- Una restauracion controlada puede leer el archivo.

La prueba real de restauracion en una base separada se ejecuto el 2026-08-24 con `bookyhome-20260824-092757.sql`. Se creo `bookyhome_prueba` y se restauraron 75 objetos correctamente, sin modificar la base principal.

## 8. Riesgos y controles

| Riesgo | Control |
|---|---|
| Migracion incompatible | Probar primero en desarrollo y crear backup previo |
| Perdida de datos | Backup diario y retencion de 30 dias |
| Backup corrupto | Verificar tamaño y restaurar periodicamente en prueba |
| Docker apagado | Revisar la tarea y ejecutar un backup manual si se omitio una fecha |
| Perdida de archivos subidos | Respaldar el volumen `uploads_data` por separado |
| Ejecucion fuera de orden | Aplicar las migraciones siguiendo su numeracion |

## 9. Registro de cambios

| Fecha | Migracion o backup | Responsable | Resultado | Observaciones |
|---|---|---|---|---|
| 2026-08-24 | `020_asegurar_tablas_impulsos.sql` | Equipo tecnico | Aplicada | Se verifico la vista de ingresos y se genero un backup valido |
| 2026-08-24 | `bookyhome-20260824-092757.sql` | Equipo tecnico | Restauracion exitosa | Se restauro en `bookyhome_prueba` y se verificaron 75 objetos |

## 10. Evidencias

- [Guia de scripts](../../scripts/README.md)
- [Migraciones SQL](../../database/migrations/README.md)
- [Backup generado localmente](../../backups/)
- [Reporte de plataforma](verificacion-plataforma.md)

La carpeta `backups/` esta excluida de Git. Para la entrega se debe adjuntar una captura o exportacion controlada del archivo de backup, sin publicar datos sensibles.
