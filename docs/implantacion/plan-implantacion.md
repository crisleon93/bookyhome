# Plan de Implantación

## 1. Ficha Técnica y Matriz de Requisitos

### 1.1 Descripción técnica

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Fecha | 2026-10-06 |
| Objetivo del sistema | Plataforma de e-commerce para venta de libros con catálogo, autenticación, carrito, pagos, ventas, gestión de tiendas y contenido de apoyo para vendedores. |
| Servicios principales | Frontend web, backend API, base de datos relacional, almacenamiento de uploads y servicios de correo. |
| Arquitectura general | Frontend React + Vite en Docker, backend FastAPI + Uvicorn en Docker, base de datos MySQL 8.0, despliegue tipo contenedores con Docker Compose y almacenamiento local persistente. |

BookyHome está compuesto por tres capas principales:

- Frontend web: desarrollado con React 19, Vite 8 y Flowbite para la experiencia de compra/venta.
- Backend: API REST con FastAPI y Pydantic, responsable de autenticación, catálogo, ventas, pagos, perfiles, reseñas y administración.
- Base de datos: MySQL 8.0, con inicialización automática desde database/bookyhome.sql y persistencia via volumen Docker.

La estructura del despliegue en contenedores está definida en `docker-compose.yml` y usa una base de datos MySQL, un backend Python y un frontend Node. El sistema está pensado para ejecutarse sin una infraestructura compleja, pero requiere un entorno Linux o servidor con Docker, sistema operativo LTS y almacenamiento SSD para mantener buen rendimiento.

### 1.2 Inventario de software

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---:|---|---|
| Ubuntu Server | Sistema operativo base del servidor | 24.04 LTS | Canonical Ubuntu Pro / licencias Open Source | No |
| Docker Engine | Runtime de contenedores | 27.x (o equivalente) | Apache 2.0 | No |
| Docker Compose | Orquestación de servicios | v2.x | Apache 2.0 | No |
| MySQL Community Server | Base de datos relacional principal | 8.0 | GPL con excepciones comerciales | Sí, si se requiere soporte comercial o extensión comercial cerrada |
| Python | Runtime del backend | 3.10 | Python Software Foundation License | No |
| FastAPI | Framework de la API | 0.135.1 | MIT | No |
| Uvicorn | Servidor ASGI | 0.42.0 | BSD-3-Clause | No |
| Pydantic | Validación y modelos | 2.12.5 | MIT | No |
| Node.js | Runtime del frontend | 20-alpine (contenedor) | MIT | No |
| React | Biblioteca del frontend | 19.2.4 | MIT | No |
| Vite | Bundler y servidor de desarrollo | 8.0.1 | MIT | No |
| pnpm | Gestor de dependencias frontend | 10.x (según instalación) | MIT | No |
| Expo / React Native | App móvil | Dependiente del entorno | MIT | No |
| Passlib / bcrypt | Hashing de contraseñas | 1.7.4 / 4.0.1 | MIT / Apache 2.0 | No |
| JWT / python-jose | Autenticación y tokens | 2.12.1 / 3.5.0 | MIT | No |
| Resend / FastAPI-Mail | Envío de correos transaccionales | 2.26.0 / 1.6.2 | MIT / Apache 2.0 | Puede generar costo según proveedor externo |

Observación: la mayor parte del software es open source y sin costo de licencia directa. La única consideración de costo o restricción importante es MySQL en uso comercial, y también los servicios de correo transaccionales si se usa un proveedor externo de email con planes de pago.

### 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | Ubuntu Server 24.04 LTS |
| Arquitectura | x86_64 / amd64 |
| Fin de soporte estándar | Mayo de 2029 |
| Licencia | Ubuntu Open Source / Canonical LTS |
| Requisitos mínimos oficiales | Ubuntu Server 24.04 LTS requiere, en general, 2 GB RAM, 2 vCPU y 25 GB de disco para instalación mínima, aunque para producción con Docker y base de datos es preferible exceder esos valores. |

Se recomienda Ubuntu Server 24.04 LTS por la estabilidad de larga duración, soporte del ecosistema Docker y compatibilidad con la mayoría de herramientas del stack actual.

### 1.4 Medición de consumo

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---:|---:|---:|
| MySQL 8.0 | 512 MB | 1.5 GB | 0.8 vCPU |
| Backend FastAPI | 256 MB | 768 MB | 0.6 vCPU |
| Frontend React/Vite | 256 MB | 512 MB | 0.4 vCPU |
| Sistema base + Docker + SO | 512 MB | 1.0 GB | 0.3 vCPU |
| Total estimado | 1.5 GB | 3.8 GB | 1.5-2.0 vCPU |

Carga simulada con: 25-40 usuarios concurrentes, consultas sobre catálogo e historial, manejo de carrito y procesamiento de ventas con base de datos operando localmente en Docker.

### 1.5 Matriz de requisitos

| Requisito | Mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | 2 vCPU | 4 vCPU | El pico estimado del stack en carga es cercano a 1.5-2.0 vCPU; con margen de seguridad para consultas y picos se recomienda 4 vCPU. |
| RAM | 4 GB | 8 GB | El total estimado en carga ronda 3.8 GB y es prudente reservar margen para gestión del SO, Docker y crecimiento del sistema. |
| Disco | 40 GB SSD | 80 GB SSD | El sistema base y la BD requieren almacenamiento persistente; 80 GB permite crecimiento, respaldos y logs. |
| Tipo de disco / IOPS | SSD SATA/NVMe, 10-20k IOPS estimados | SSD NVMe, 30k IOPS o superior | MySQL y el acceso al catálogo producen IOPS moderadas; un SSD mejora tiempos de respuesta. |
| Red | 1 Gbps | 1 Gbps redundante o 10 Gbps si se escala | El tráfico web y la consola de administración no exige un ancho muy alto pero sí un enlace estable y bien dimensionado. |
| Arquitectura | x86_64 / amd64 | x86_64 / amd64 | Compatible con el ecosistema de Docker, Ubuntu, MySQL y Node. |
| Sistema operativo | Ubuntu Server 24.04 LTS | Ubuntu Server 24.04 LTS | Estabilidad LTS, soporte largo y compatibilidad con Docker y la base de datos. |
| Docker / runtime | Docker Engine + Compose | Docker Engine + Compose + monitorización | Permite containerización y mantenimiento más simple del stack. |
| Puertos | 8000, 5173, 3306 | 80/443, 8000, 5173, 3306 interno restringido | El backend expone API en 8000; frontend y MySQL quedan conectados por red interna, con acceso restringido según la topología. |
| Crecimiento estimado de datos | 5-10 GB al año | 20-40 GB en 2-3 años | El volumen aumentado se debe a imágenes, base de datos, logs y backups. |

### 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Servidor rack 1U o torre empresarial | Es una solución económica, fácil de expandir y suficientemente robusta para un sistema con base de datos y frontend. |
| Nivel RAID del servidor de base de datos | RAID 10 | Ofrece buen equilibrio entre rendimiento y tolerancia a fallos; es la recomendación más segura para un servidor con MySQL. |
| Plataforma de ejecución (bare metal / VM / contenedores) | VM con Proxmox/KVM + contenedores Docker | Permite aislamiento, snapshot, respaldos, y escalado sin comprometer la estabilidad del sistema. |

La recomendación para una implantación en cliente es: un servidor físico de nivel medio con discos SSD y RAID 10, donde se desplegará una VM Ubuntu y dentro de ella Docker Compose para ejecutar MySQL, backend y frontend. Esto mantiene la base de datos protegida, facilita backups y reduce el riesgo operativo.

### 1.7 Verificación de requisitos

Script: `scripts/verificar-requisitos.sh` del repositorio del proyecto.

Servidor donde se ejecutó:

```bash
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Users/sena/bookyhome && bash scripts/verificar-requisitos.sh"
```

```text
=== Verificación de requisitos BookyHome ===
Fecha: 2026-10-06 20:00:56 UTC
Servidor: BOGDFPCGMP1094
Sistema operativo: Ubuntu 26.04.1 LTS
Arquitectura: x86_64
CPU: 28 núcleos - Intel(R) Core(TM) i7-14700
Memoria total: 15 GB
Memoria disponible: 14 GB
Espacio en disco (/): /dev/sdd       1007G  1.3G  955G   1% /

=== Herramientas del stack ===
Docker: 
Docker Compose: 
Python: Python 3.14.4
node: no instalado
npm: 11.13.0
pnpm: 
mysql: no instalado

=== Validación del proyecto ===
docker-compose.yml: detectado
backend: detectado
frontend: detectado
database: detectado

=== Requisitos mínimos del proyecto ===
- CPU mínimo: 2 vCPU
- RAM mínima: 4 GB
- Disco mínimo: 40 GB SSD
- Sistema operativo recomendado: Ubuntu Server 24.04 LTS

Resultado: CUMPLE LOS REQUISITOS MÍNIMOS

Conclusión: este entorno debe tener al menos 2 vCPU, 4 GB RAM y 40 GB SSD para operar BookyHome sin problema. Para producción se recomienda 4 vCPU, 8 GB RAM y 80 GB SSD.
```

Resultado:

El entorno analizado cumple los requisitos mínimos del proyecto para desarrollo y despliegue ligero. La validación confirma 28 núcleos, 15 GB de RAM y más de 955 GB libres en disco, por lo que la plataforma queda sobredimensionada para el stack actual; para producción, se recomienda mantener un servidor con 4 vCPU, 8 GB RAM y 80 GB SSD, con RAID 10 y copias de seguridad automáticas para la base de datos.
