# Verificacion de plataforma e infraestructura

## Identificacion

| Campo | Resultado |
|---|---|
| Fecha de verificacion | 2026-08-24 16:25:27 |
| Equipo | DESKTOP-3N2KGUO |
| Sistema operativo | Microsoft Windows 11 Pro 10.0.26200 |
| Procesador | AMD Ryzen 5 5600GT with Radeon Graphics         (6 nucleos) |
| Memoria RAM | 15.87 GB |
| Espacio libre en C: | 650.39 GB |

## Requisitos definidos

| Recurso | Minimo recomendado | Resultado | Estado |
|---|---:|---:|---|
| Sistema operativo | Windows 10/11 | Microsoft Windows 11 Pro | Cumple |
| Memoria RAM | 8 GB | 15.87 GB | Cumple |
| Espacio libre | 10 GB | 650.39 GB | Cumple |
| Docker Desktop | Requerido | Cumple | Cumple |
| Git | Requerido para obtener el proyecto | Instalado | Cumple |
| Node.js | Requerido para ejecucion local | Instalado | Cumple |
| pnpm | Requerido para ejecucion local | Instalado | Cumple |

## Plataformas habilitadas

| Componente | Plataformas compatibles | Condicion |
|---|---|---|
| Equipo anfitrion | Windows 10/11, Linux x64 o macOS compatible con Docker | Docker Desktop o Docker Engine con Compose |
| Frontend web | Chrome, Edge o Firefox actuales | JavaScript habilitado y acceso al puerto 5173 |
| App movil | Android o iOS compatible con Expo Go | Celular y equipo anfitrion en la misma red para pruebas locales |
| Backend y MySQL | Contenedores Linux | Docker activo y puertos requeridos disponibles |

La plataforma probada por este reporte es Windows 11 con Docker Desktop. Las demas combinaciones requieren una prueba adicional.

## Requisitos de hardware y software

| Nivel | Procesador | RAM | Almacenamiento libre |
|---|---|---:|---:|
| Minimo tecnico | 64 bits, 2 nucleos; Intel Core i3 o AMD Ryzen 3 recientes | 4 GB | 10 GB |
| Recomendado para trabajar | Intel Core i3/i5 o AMD Ryzen 3/Ryzen 5 | 8 GB | 20 GB o mas |
| Ideal para desarrollo | Intel Core i5 o AMD Ryzen 5, 4 nucleos o mas | 16 GB | SSD con 20 GB o mas |

El procesador debe permitir virtualizacion. Intel Celeron o Pentium modernos pueden funcionar para pruebas, con menor rendimiento. SSD es recomendado.

El minimo tecnico puede iniciar el proyecto, pero 8 GB es el minimo recomendado para trabajar con Docker, VS Code y el navegador abiertos al mismo tiempo.

| Componente | Minimo | Recomendado |
|---|---|---|
| Sistema operativo | Windows 10/11 de 64 bits, Linux x64 o macOS compatible | Version actualizada |
| Docker | Docker Desktop o Docker Engine con Compose | Docker Desktop actualizado y virtualizacion activa |
| Git | Git instalado | Version actualizada |
| Node.js y pnpm | Solo si se ejecuta fuera de Docker | Node.js LTS y pnpm actualizado |
| Red | Internet para instalar; red local para app movil | Conexion estable |

## Puertos requeridos

| Puerto | Uso | Estado |
|---:|---|---|
| 3306 | MySQL | Estado obtenido durante la verificacion |
| 5173 | Frontend web | Estado obtenido durante la verificacion |
| 8000 | Backend FastAPI | Estado obtenido durante la verificacion |

| 3306 | Cumple |
| 5173 | Cumple |
| 8000 | Cumple |

## Servicios Docker

Version detectada: Docker version 29.7.2, build a7dcaa6

Resultado de Docker Compose: Docker Compose respondio correctamente.
Los estados detallados se deben confirmar con docker compose ps.

## Resultado

La plataforma fue verificada con el script `scripts/verification/verify-platform.ps1`. Si algun requisito aparece como No cumple, debe corregirse antes de ejecutar la solucion. Esta verificacion corresponde al entorno local; una instalacion productiva requiere ademas configurar seguridad, HTTPS y recursos del servidor.
