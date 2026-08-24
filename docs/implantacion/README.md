# Evidencias de implantacion

Esta carpeta contiene las evidencias relacionadas con la preparacion de la plataforma e infraestructura del criterio 1.

## Archivos

- `verificacion-plataforma.md`: reporte con los requisitos de hardware y software, plataformas compatibles, puertos y estado de los servicios Docker.
- `plan-migracion-respaldos.md`: procedimiento de migracion, backups, restauracion, verificacion y contingencia.
- `acta-despliegue.md`: evidencia de arquitectura, servicios, puertos, publicacion local y pendientes de produccion.
- `gestion-usuarios-permisos.md`: roles, permisos, controles de seguridad y pruebas recomendadas.

Las practicas de calidad y PSP estan documentadas en [../calidad/marco-calidad-psp.md](../calidad/marco-calidad-psp.md).

## Generar o actualizar el reporte

Desde la raiz del proyecto, con Docker Desktop iniciado y los servicios levantados, ejecutar:

```powershell
.\scripts\verification\verify-platform.ps1
```

El script verifica el computador actual y actualiza `verificacion-plataforma.md` con los datos obtenidos. Por ejemplo, registra sistema operativo, procesador, nucleos, RAM, espacio libre, herramientas instaladas y puertos disponibles.

El reporte predeterminado es compartido. Para que cada integrante conserve una evidencia independiente, usar otro nombre:

```powershell
.\scripts\verification\verify-platform.ps1 -ReportPath docs\implantacion\verificacion-NOMBRE.md
```

Reemplazar `NOMBRE` por el identificador del integrante. Los reportes de verificacion si se pueden compartir por Git porque no contienen backups de la base de datos.
