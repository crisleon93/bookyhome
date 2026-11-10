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
.\scripts\verification\verify-platform.ps1 -ReportPath docs\implantacion\verificacion-NOMBRE.md
```
