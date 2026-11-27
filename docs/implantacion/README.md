# Documentacion de implantacion

Esta carpeta contiene evidencias y procedimientos para la implantacion, operacion y entrega de BookyHome.

## Documentos principales

- `verificacion-plataforma.md`: reporte con los requisitos de hardware y software, plataformas compatibles, puertos y estado de los servicios Docker.
- `plan-migracion-respaldos.md`: procedimiento de migracion, backups, restauracion, verificacion y contingencia.
- `acta-despliegue.md`: evidencia de arquitectura, servicios, puertos, publicacion local y pendientes de produccion.
- `acta-de-entrega.md`: evidencia de entrega del proyecto.
- `gestion-usuarios-permisos.md`: roles, permisos, controles de seguridad y pruebas recomendadas.
- `entregable-s02` a `entregable-s10`: evidencias de los entregables de implantacion.

Las practicas de calidad y PSP estan documentadas en [../calidad/marco-calidad-psp.md](../calidad/marco-calidad-psp.md).

## Generar o actualizar el reporte

Desde la raiz del proyecto, con Docker Desktop iniciado y los servicios levantados, ejecutar:

```powershell
.\scripts\verification\verify-platform.ps1
```

El script verifica el computador actual y actualiza `verificacion-plataforma.md` con los datos obtenidos. Por ejemplo, registra sistema operativo, procesador, nucleos, RAM, espacio libre, herramientas instaladas y puertos disponibles.

El reporte versionado corresponde a una verificacion del 2026-08-24; vuelve a generarlo antes de usarlo como evidencia del estado actual.

El reporte predeterminado es compartido. Puede incluir identificadores y caracteristicas del equipo local; revisalo y anonimiza cualquier dato que no quieras compartir antes de subirlo. Para que cada integrante conserve una evidencia independiente, usar otro nombre:

```powershell
.\scripts\verification\verify-platform.ps1 -ReportPath docs\implantacion\verificacion-NOMBRE.md
```

Reemplazar `NOMBRE` por un identificador no personal. El reporte no contiene backups de la base de datos, pero eso no significa que todos sus datos de entorno sean publicables.
