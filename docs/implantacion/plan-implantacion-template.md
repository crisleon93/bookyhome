# Plan de Implantación — [Nombre del proyecto]

| Campo | Valor |
|---|---|
| Proyecto | |
| Equipo | |
| Versión del plan | |
| Fecha | |

## 1. Ficha técnica y matriz de requisitos — Semana 1

### 1.1 Descripción técnica

| Campo | Valor |
|---|---|
| Objetivo | |
| Usuarios | |
| Servicios principales | |
| Arquitectura | |
| Persistencia | |

Describe en 3-5 líneas qué hace el sistema, sus capas/servicios y quiénes lo utilizan.

### 1.2 Inventario de software

Incluye cada componente directo del servidor, la versión exacta y la licencia de esa versión. Distingue software sin costo de licencia de servicios comerciales opcionales.

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---:|---|---|
| | | | | |

### 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | |
| Arquitectura | |
| Fin de soporte estándar | |
| Licencia | |
| Requisitos mínimos oficiales (enlace) | |
| Referencia oficial de soporte | |

### 1.4 Medición de consumo

Mide con `docker stats` o el monitor del sistema, en reposo y durante una carga simulada. Registra el entorno y aclara las limitaciones de la prueba; no presentes estimaciones como mediciones.

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---:|---:|---:|
| | | | |
| **Total** | | | |

Carga simulada y herramienta utilizada:

### 1.5 Matriz de requisitos

Calcula el recomendado desde la medición pico y deja visible un margen de 30-50%. Incluye reserva para el sistema operativo y servicios base cuando corresponda.

| Requisito | Mínimo | Recomendado | Justificación y cálculo |
|---|---|---|---|
| CPU | | | |
| RAM | | | |
| Disco | | | |
| Tipo de disco / IOPS | | | |
| Red | | | |
| Arquitectura | | | |
| Sistema operativo | | | |
| Docker / runtime | | | |
| Puertos | | | |
| Crecimiento estimado de datos | | | |

Crecimiento estimado de datos: registros o archivos por mes × tamaño promedio × meses del periodo estimado. Indica los supuestos usados.

### 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | | |
| Nivel RAID del servidor de base de datos | | |
| Plataforma de ejecución (bare metal / VM / contenedores) | | |

### 1.7 Verificación de requisitos

Script: `scripts/verificar-requisitos.sh`. Ejecuta en el servidor Linux indicado para el despliegue y pega la salida real. No incluyas IPs, nombres reales de host, usuarios ni contraseñas. Si la evidencia se obtiene en otro sistema operativo, identifícala como preliminar y no la presentes como ejecución Linux.

Servidor/entorno (alias no identificable):

```bash
bash scripts/verificar-requisitos.sh
```

Salida completa:

```text
<!-- pegar aquí la salida real, sin datos identificables -->
```

Resultado y acciones necesarias:
