# Plan de Implantación — BookyHome

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del plan | 1.0 |
| Fecha | 2026-10-07 |

## 1. Ficha técnica y matriz de requisitos — Semana 1

### 1.1 Descripción técnica

| Campo | Valor |
|---|---|
| Objetivo | Plataforma de comercio electrónico para descubrir y vender libros, con cuentas, catálogo, carrito, pagos, ventas, tiendas, reseñas y herramientas para vendedores. |
| Usuarios | Compradores, vendedores y administradores. |
| Servicios principales | Frontend web, API REST, base de datos MySQL, almacenamiento persistente de imágenes/archivos y envío de correo mediante proveedor externo. |
| Arquitectura | Aplicación web de tres capas: React/Vite, API FastAPI/Uvicorn y MySQL 8. Los servicios se desarrollan actualmente con Docker Compose; el frontend móvil con Expo es un cliente aparte. |
| Persistencia | Volumen Docker para MySQL y volumen para archivos subidos. La inicialización de la base de datos monta `database/migrations` en `/docker-entrypoint-initdb.d`. |

El Compose actual es una configuración de desarrollo: ejecuta Vite y publica los puertos 5173 (frontend), 8000 (API) y 3306 (MySQL) en el host. En producción se recomienda servir el frontend compilado detrás de un proxy HTTPS y dejar la base de datos y la API accesibles solo desde la red interna.

### 1.2 Inventario de software

Versiones observadas en las imágenes/contenedores del entorno de desarrollo o fijadas en los manifiestos del proyecto. Docker Engine 29.7.2 y Compose 5.5.0 corresponden al equipo de pruebas. Para ejecutar la prueba Linux se utilizó Docker CLI 29.8.2 y Compose 5.5.1. La versión definitiva instalada directamente en un servidor Linux debe registrarse al desplegarlo.

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---:|---|---|
| Ubuntu Server | Sistema operativo objetivo | 24.04 LTS | Componentes principalmente libres; términos de Ubuntu | Sin costo de licencia; Ubuntu Pro es opcional |
| Docker Engine | Ejecución de contenedores | Servidor 29.7.2, observado en Docker Desktop | Apache-2.0 | Sin costo para Docker Engine; Docker Desktop tiene términos de uso propios |
| Docker Compose | Orquestación local/servidor | 5.5.0 en Windows; 5.5.1 en prueba Linux | Apache-2.0 | Sin costo |
| MySQL Community Server | Base de datos | 8.0.46 | GPL-2.0 | Sin costo para Community; soporte/ediciones comerciales son opcionales |
| Python | Runtime del backend | 3.10.21 (`python:3.10-slim`) | PSF License | No |
| FastAPI | Framework de API | 0.135.1 | MIT | No |
| Uvicorn | Servidor ASGI | 0.42.0 | BSD-3-Clause | No |
| Pydantic | Validación y modelos | 2.12.5 | MIT | No |
| Node.js | Runtime frontend | 20.20.2 (`node:20-alpine`) | MIT y avisos de componentes incluidos | No |
| pnpm | Gestor de paquetes frontend | 10.34.3 | MIT | No |
| React / React DOM | Interfaz web | 19.2.4 | MIT | No |
| Vite | Servidor de desarrollo y bundler | 8.0.1 | MIT | No |
| Flowbite / Flowbite React | Componentes de interfaz | 4.0.2 / 0.12.17 | MIT | No |
| Passlib / bcrypt | Hash de contraseñas | 1.7.4 / 4.0.1 | BSD / Apache-2.0 | No |
| PyJWT / python-jose | Tokens de autenticación | 2.12.1 / 3.5.0 | MIT / MIT | No |
| Resend / FastAPI-Mail | Integración de correo | 2.26.0 / 1.6.2 | MIT / MIT | El SDK no; el proveedor puede cobrar según plan y volumen |
| Expo / React Native | Aplicación móvil cliente, fuera del servidor | 54.0.35 / 0.81.5 | MIT | No; servicios de publicación/tienda pueden tener costo |

Las versiones de dependencias Python están fijadas en `backend/requirements.txt`; las del frontend web y la app móvil, en sus respectivos `package.json` y archivos de bloqueo. El envío de correo depende de un proveedor externo y sus tarifas. Antes de distribuir el sistema, deben conservarse los avisos de licencia de dependencias transitivas.

### 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | Ubuntu Server 24.04 LTS (sistema objetivo; aún no medido en una VM Linux de este proyecto) |
| Arquitectura | x86_64 / amd64, compatible con las imágenes del stack |
| Fin de soporte estándar | Mayo de 2029, según el ciclo de mantenimiento LTS de Ubuntu |
| Licencia | Distribución basada principalmente en software libre y de código abierto; se aplican las licencias de cada paquete |
| Requisitos mínimos oficiales | Consultar la [documentación oficial de instalación de Ubuntu Server](https://ubuntu.com/server/docs/how-to/installation/) y la [página oficial de descarga](https://ubuntu.com/download/server). El dimensionamiento depende del perfil de instalación y de las cargas; los valores de este plan son requisitos de BookyHome, no una transcripción de los mínimos del instalador. |
| Referencia de soporte | [Ciclo oficial de lanzamientos y mantenimiento de Ubuntu](https://ubuntu.com/about/release-cycle) |

Se selecciona Ubuntu Server 24.04 LTS por su periodo de mantenimiento, soporte de Docker y disponibilidad de paquetes para la arquitectura objetivo.

### 1.4 Medición de consumo

Medición con `docker stats --no-stream` sobre los contenedores en ejecución. La columna “reposo” corresponde a muestras sin solicitudes de carga generadas; el frontend seguía ejecutando Vite en modo desarrollo y con sondeo de archivos habilitado, por lo que no representa un servidor de producción realmente inactivo.

| Servicio | RAM reposo | RAM pico observado | CPU pico durante prueba |
|---|---:|---:|---:|
| MySQL Community 8.0.46 | 423.5 MiB | 423.7 MiB | 1.47% |
| Backend FastAPI/Uvicorn | 103.5 MiB | 103.5 MiB | 15.60% |
| Frontend React/Vite | 257.4 MiB | 261.0 MiB | 43.94% |
| **Total de contenedores** | **784.4 MiB (0.77 GiB)** | **788.2 MiB (0.77 GiB)** | **61.01% (0.61 vCPU)** |

Prueba simulada: 10 clientes concurrentes; cada uno realizó 15 solicitudes GET al frontend (`/`) y 15 a la documentación de la API (`/docs`), para un total de 150 solicitudes a cada endpoint. Se muestreó `docker stats` durante la prueba. El total de CPU suma los máximos individuales observados y es una cota conservadora (no necesariamente simultánea); 100% equivale aproximadamente a un núcleo lógico. No se enviaron transacciones ni se ejercitó la base de datos con consultas de negocio; estos valores son una prueba de humo/carga HTTP ligera, no una prueba de capacidad de producción.

### 1.5 Matriz de requisitos

| Requisito | Mínimo | Recomendado | Justificación y cálculo |
|---|---|---|---|
| CPU | 2 vCPU | 4 vCPU | En la prueba ligera se observaron 0.61 vCPU agregados; con 50% de margen: 0.61 × 1.5 = 0.92 vCPU. Se redondea a 2 vCPU para incluir SO/Docker; se recomiendan 4 vCPU (2 × el mínimo) para crecimiento y cargas de base de datos aún no probadas. |
| RAM | 4 GB | 8 GB | Pico observado de contenedores: 0.77 GiB; con 50%: 0.77 × 1.5 = 1.16 GiB. Se reserva memoria adicional para SO, Docker y caché de MySQL; mínimo redondeado a 4 GB y 8 GB recomendados (2 × mínimo) para crecimiento. |
| Disco | 40 GB libres | 80 GB SSD | El script comprueba espacio libre, no capacidad total. Recomendado: 40 GB × 1.5 = 60 GB, redondeado a 80 GB para imágenes Docker, volúmenes persistentes, logs y respaldos. |
| Tipo de disco / IOPS | SSD SATA, mínimo 40 GB libres | SSD NVMe con espacio para datos y respaldos | MySQL requiere almacenamiento persistente; no se midieron IOPS, por lo que se validarán con una prueba de disco en el servidor destino. |
| Red | 100 Mbps simétricos | 1 Gbps en LAN y conexión estable a Internet | Estimación para una aplicación web de carga inicial baja/media; el ancho de banda real debe ajustarse al tráfico, las imágenes y el número de usuarios. No se ejecutó una prueba de red. |
| Arquitectura | x86_64 / amd64 | x86_64 / amd64 | Es la arquitectura seleccionada para el servidor y compatible con las imágenes Docker usadas. |
| Sistema operativo | Ubuntu Server 24.04 LTS | Ubuntu Server 24.04 LTS actualizado | Versión LTS seleccionada; el mantenimiento estándar llega hasta mayo de 2029. |
| Docker / runtime | Docker Engine y Docker Compose; imágenes MySQL 8, Python 3.10 y Node 20 | Versiones soportadas y fijadas, monitorización y actualizaciones controladas | Los tres servicios se ejecutan actualmente mediante Compose. La versión del motor Linux de producción aún debe registrarse. |
| Puertos | Desarrollo: 5173 (frontend), 8000 (API), 3306 (MySQL) | Producción: 80/443 públicos; 8000 y 3306 solo en red interna | El Compose actual publica los tres puertos en el host. En producción se debe restringir MySQL y colocar la API detrás de un proxy/firewall. |
| Crecimiento estimado de datos | 6 GB/año (estimación inicial) | 18 GB para 3 años, más respaldos | Supuesto de planificación: 100 imágenes/mes × 3 MB × 12 = 3.6 GB/año; datos de BD/logs estimados en 0.2 GB/mes × 12 = 2.4 GB/año; total 6 GB/año. Sustituir el supuesto por el volumen real al medir el uso. |

### 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Torre empresarial para una instalación pequeña; rack si ya existe centro de datos | La torre simplifica el despliegue y la ampliación en instalaciones sin rack. El rack facilita administración centralizada cuando ya hay infraestructura. |
| Nivel RAID del servidor de base de datos | RAID 10 con al menos cuatro unidades SSD | Combina rendimiento y tolerancia a fallos de un disco por espejo; ofrece aproximadamente la mitad de la capacidad bruta. RAID no sustituye copias de seguridad verificadas. |
| Plataforma de ejecución (bare metal / VM / contenedores) | Hipervisor tipo 1 (Proxmox VE/KVM), VM Ubuntu Server y Docker Compose dentro de la VM | Aísla el sistema, facilita restauración y administración de recursos. Para una implantación pequeña sin hipervisor, Docker Engine sobre Ubuntu en bare metal también es viable. |

### 1.7 Verificación de requisitos

Script: `scripts/verificar-requisitos.sh`.

Entorno de ejecución: contenedor efímero basado en Ubuntu 24.04.5 LTS (`ubuntu:24.04`), con el repositorio montado para ejecutar el script y el socket del motor Docker disponible. El CLI de Docker/Compose se suministró desde la imagen oficial `docker:cli`; no fue posible instalar paquetes dentro de Ubuntu porque el contenedor no tuvo acceso a los repositorios de Ubuntu. El nombre del host se omite por privacidad. Esta evidencia cumple la ejecución en Linux de laboratorio, pero no es una VM ni un servidor físico independiente.

Comando ejecutado dentro del contenedor:

```bash
bash scripts/verificar-requisitos.sh
```

Salida real:

```text
=== Verificación de requisitos BookyHome ===
Fecha: 2026-10-07 20:23:42 UTC
Servidor: nombre omitido por privacidad
Sistema operativo: Ubuntu 24.04.5 LTS
Entorno: contenedor Docker (recursos visibles para el contenedor)
Arquitectura: x86_64
CPU: 12 procesadores lógicos - 13th Gen Intel(R) Core(TM) i5-13420H
Memoria total: 7.6 GB
Memoria disponible: 6.0 GB
Disco raíz (/): capacidad 1006.9 GB; libre 933.9 GB

=== Herramientas del stack ===
Docker CLI: Docker version 29.8.2, build 7fc2dff
Docker Compose: Docker Compose version v5.5.1
Motor Docker: disponible
python3: no instalado en el host (puede ejecutarse dentro de Docker)
node: no instalado en el host (puede ejecutarse dentro de Docker)
npm: no instalado en el host (puede ejecutarse dentro de Docker)
pnpm: no instalado en el host (puede ejecutarse dentro de Docker)
mysql: no instalado en el host (puede ejecutarse dentro de Docker)

=== Validación del proyecto ===
Archivo Compose: detectado
Backend: detectado
Frontend: detectado
Base de datos: detectada

=== Requisitos mínimos del proyecto ===
- CPU: 2 procesadores lógicos
- RAM: 4 GB
- Espacio libre en disco: 40 GB
- Docker Engine y Docker Compose: requeridos
- Sistema operativo recomendado: Ubuntu Server 24.04 LTS

Comprobaciones:
  CPU: cumple
  RAM: cumple
  Espacio libre en disco (40 GB): cumple
  Docker Engine, Compose y archivo de proyecto: disponibles

Resultado: CUMPLE LOS REQUISITOS MÍNIMOS
Nota: en contenedor, disco y memoria son los recursos visibles para Docker y pueden no representar la capacidad física disponible.
Para validar producción, ejecute este script en el servidor destino.
```

Resultado: el entorno Linux de laboratorio cumple los umbrales que el script pudo observar y confirmó acceso al motor Docker, Compose y los archivos del proyecto. La cifra de disco libre pertenece al sistema de archivos overlay que Docker expuso al contenedor y no demuestra que el almacenamiento físico o la unidad Windows de respaldo tenga 40 GB libres. En una comprobación previa del equipo Windows anfitrión se observaron solo 6.0 GB libres en C:. Antes de certificar el destino de producción, ejecutar el script directamente en la VM/servidor Ubuntu y confirmar allí el espacio persistente disponible y el tipo de disco (SSD).
