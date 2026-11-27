# Verificacion de plataforma

Esta carpeta contiene el script que verifica los requisitos de hardware, software, puertos y servicios Docker del proyecto.

## Uso

Ejecutar desde la raiz del proyecto:

```powershell
.\scripts\verification\verify-platform.ps1
```

El reporte se guarda o actualiza en:

```text
docs\implantacion\verificacion-plataforma.md
```

Para generar un reporte individual:

```powershell
.\scripts\verification\verify-platform.ps1 -ReportPath docs\implantacion\verificacion-IDENTIFICADOR.md
```

Usa un identificador no personal. El reporte puede incluir detalles del equipo local; revisalo y anonimiza la informacion que no quieras compartir antes de subirlo a Git.
