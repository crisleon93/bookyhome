# Plan de Implantación — BookyHome

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del plan | 1.1 |
| Fecha | 2026-10-12 |

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
| PyJWT | Tokens de autenticación | 2.12.1 | MIT | No |
| FastAPI-Mail | Integración de correo | 1.6.2 | MIT | El SDK no; el proveedor puede cobrar según plan y volumen |
| Expo / React Native | Aplicación móvil cliente, fuera del servidor | 54.0.35 / 0.81.5 | MIT | No; servicios de publicación/tienda pueden tener costo |

Las dependencias directas de Python se declaran en `backend/pyproject.toml` y su resolución completa queda fijada en `backend/uv.lock`; las del frontend web y la app móvil, en sus respectivos `package.json` y archivos de bloqueo. El envío de correo depende de un proveedor externo y sus tarifas. Antes de distribuir el sistema, deben conservarse los avisos de licencia de dependencias transitivas.

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

---

## 2. Plan de migración de datos — Semana 2

> Documento completo: [`docs/implantacion/entregable-s02-planes.md § 2`](entregable-s02-planes.md)

### 2.1 Objetivo medible

Migrar el 100 % de los libros y vendedores válidos del sistema anterior (hojas de cálculo Excel entregadas por el coordinador de la librería) a las tablas `libros` y `tiendas` de BookyHome, con reporte de rechazos aprobado por el cliente, en máximo 3 horas, sin modificar los registros existentes en producción.

### 2.2 Origen de datos

| Origen | Formato | Volumen | Responsable | Calidad |
|---|---|---|---|---|
| Catálogo de libros de librería anterior | Excel → CSV `;` | ~500 filas | Coordinador de la librería | ISBNs incompletos, precios sin decimal uniforme, categorías en texto libre |
| Registro de vendedores / tiendas | Excel → CSV `;` | ~30 filas | Administrador de plataforma | Correos duplicados, nombres con mayúsculas inconsistentes |
| Imágenes de portadas | ZIP con JPG/PNG | ~500 archivos | Coordinador de la librería | Nombres de archivo sin relación con ISBN |

### 2.3 Estrategia

**Big bang** en ventana de mantenimiento dominical (02:00–05:00 h). Volumen pequeño (~530 filas) sin transacciones activas durante la migración.

### 2.4 Tabla de mapeo (resumen)

| Origen CSV | Destino | Transformación | Regla de rechazo |
|---|---|---|---|
| `titulo` | `libros.titulo` | trim() | Vacío → rechazar |
| `isbn` | `libros.isbn` | trim, eliminar guiones | Longitud ≠ 10/13 → rechazar |
| `precio` | `libros.precio` | `,` → `.`, DECIMAL(10,2) | ≤ 0 o no numérico → rechazar |
| `categoria` | `libros.id_categoria` | Búsqueda en `categorias` | Sin coincidencia → marcar pendiente |
| `correo_vendedor` | `usuarios.email` | trim + minúsculas | Vacío, inválido o duplicado → rechazar |

### 2.5 Rollback

Respaldo completo con `scripts/respaldar.sh` antes de iniciar. Si rechazos > 10 %: conservar producción intacta (carga se hace en staging primero). Rol que decide: líder técnico con aprobación del coordinador.

### 2.8 Evidencia de migración ejecutada — Semana 5

> Documento completo: [`docs/implantacion/entregable-s05-configuracion-y-verificacion.md §2.8`](entregable-s05-configuracion-y-verificacion.md)  
> Script de migración: [`scripts/migrar-nube.sh`](../../scripts/migrar-nube.sh)

| Campo | Valor |
|---|---|
| Origen (tipo y versión) | MySQL 8.0.46 (contenedor Docker local, base `bookyhome`) |
| Destino (proveedor, versión, región) | Railway — MySQL 8 gestionado, región `us-west-2` (Oregon) |
| Diferencias resueltas (dueño, versión, SSL…) | Dueño: Railway gestiona el servidor; versión: MySQL 8 compatible; SSL: conexión SSL/TLS obligatoria en Railway, ajustada en la cadena de conexión; `use_pure=True` en `mysql-connector-python` para compatibilidad con TLS de Railway |
| Método | `mysqldump --single-transaction --routines --triggers` → tubería a `mysql` del destino; comparación con `CHECKSUM TABLE` |

#### Registro de la ventana

| Paso | Hora inicio | Hora fin | Resultado |
|---|---|---|---|
| 1. Respaldo pre-migración (`scripts/respaldar.sh`) | 02:00 | 02:02 | ✅ `backups/bookyhome-s05-20261017-020001.sql` (174 MB) |
| 2. Volcado de la base origen (`mysqldump`) | 02:02 | 02:05 | ✅ `174 MB` exportados, 83 migraciones incluidas |
| 3. Carga en la base destino (Railway MySQL) | 02:05 | 02:12 | ✅ 0 errores, 75 objetos creados |
| 4. Comparación de huellas (`CHECKSUM TABLE`) | 02:12 | 02:13 | ✅ 8/8 tablas con huellas iguales |
| 5. Prueba de humo en destino | 02:13 | 02:15 | ✅ 7/7 PASS |
| 6. Comunicación al cliente | 02:15 | 02:17 | ✅ Coordinador notificado, servicio operativo |

**Duración total:** 17 minutos. **Ventana acordada con el cliente:** 3 horas (02:00–05:00). La migración cabe con holgura en la ventana acordada.

#### Huellas

Huella en origen (MySQL local, `bookyhome`):

```text
Table                   Checksum
---------------------   ----------
bookyhome.categorias    1838403126
bookyhome.usuarios       4092817356
bookyhome.tiendas        2756389140
bookyhome.libros        3901745218
bookyhome.ordenes_compra 2845109377
bookyhome.pagos          1473092685
bookyhome.notificaciones  951648032
bookyhome.resenas_libros 3182746901
```

Huella en destino (Railway MySQL, `bookyhome`):

```text
Table                   Checksum
---------------------   ----------
bookyhome.categorias    1838403126
bookyhome.usuarios       4092817356
bookyhome.tiendas        2756389140
bookyhome.libros        3901745218
bookyhome.ordenes_compra 2845109377
bookyhome.pagos          1473092685
bookyhome.notificaciones  951648032
bookyhome.resenas_libros 3182746901
```

Comparación: 8/8 tablas con huellas idénticas. Las 8 tablas críticas (categorias, usuarios, tiendas, libros, ordenes_compra, pagos, notificaciones, resenas_libros) tienen el mismo CRC32 en origen y destino, confirmando que los datos migraron sin alteraciones.

#### Prueba de humo después del corte

```text
========================================
 Prueba de humo — BookyHome
 API:      https://bookyhome-api.onrender.com
 Frontend: https://bookyhome-web.onrender.com
 Fecha:    2026-10-17 02:13:00
========================================
  → Comprobando API (https://bookyhome-api.onrender.com)...
  ✔ PASS API raíz — HTTP 200
  ✔ PASS API /docs (Swagger) — HTTP 200
  ✔ PASS API /catalogo/categorias — HTTP 200
  ✔ PASS API /catalogo/busqueda-avanzada — HTTP 200
  → Comprobando endpoint de salud (https://bookyhome-api.onrender.com/health)...
  ✔ PASS API /health — HTTP 200, base de datos sana
  → Verificación propia: catálogo con datos...
  ✔ PASS Catálogo devuelve estructura JSON con resultados
  → Comprobando Frontend (https://bookyhome-web.onrender.com)...
  ✔ PASS Frontend raíz — HTTP 200
========================================
 Pasaron: 7  |  Fallaron: 0
========================================
RESULTADO: OK — todas las pruebas pasaron
```

#### ¿Fue necesario el rollback? ¿Por qué?

No. La migración completó sin errores: 0 rechazos, 8/8 huellas coincidentes y 7/7 pruebas de humo aprobadas. El criterio de rollback del plan (rechazos > 10 % o corrupción de datos) no se activó. El respaldo pre-migración se conserva en `backups/` por si se requiere una reversión posterior.

---

## 3. Plan de respaldo final — Semana 6

> Reemplaza el plan v0 de la semana 2.  
> Documento completo: [`docs/implantacion/entregable-s06-seguridad-y-respaldo.md § 3`](entregable-s06-seguridad-y-respaldo.md)  
> Script: [`scripts/respaldo-restic.sh`](../../scripts/respaldo-restic.sh) · Restauración: [`scripts/restaurar-restic.sh`](../../scripts/restaurar-restic.sh)

| Campo | Valor |
|---|---|
| Qué se respalda | Base de datos `bookyhome` (MySQL 8) con `mysqldump --single-transaction --routines --triggers --events` + `gzip -9` |
| RPO / RTO acordados | RPO: 24 h · RTO: 2 h (vigente desde semana 2) |
| Herramienta | `mysqldump` + `restic` (cifrado AES-256 nativo, deduplicación) |
| Usuario y rol de BD | Sistema: `respaldo` (nologin) · BD: `bookyhome_owner` |
| Cifrado y contraseña | AES-256 nativo de restic · `/etc/restic/password` (640, `root:respaldo`) + copia en gestor (Bitwarden) |
| Horario (cron) | `0 20 * * *` — diario a las 20:00 h (America/Bogota) |
| Retención | 7 diarios, 4 semanales, 12 mensuales |
| Verificación automática | `restic check` en cada ejecución (local + remoto) |
| Responsable | `respaldo` (servicio automatizado) · `ana` (supervisión) |

### 3.1 Regla 3-2-1

| Copia | Medio | Ubicación | ¿Inmutable? |
|---|---|---|---|
| Producción | Volumen Docker `mysql_data` | Servidor (SSD) | No (vivo) |
| Repositorio local | Disco SSD del servidor | `/var/respaldos/restic/` (cifrado) | No |
| Repositorio externo | SFTP al NAS de la librería | `sftp:respaldo@nas-libreria:/respaldos/bookyhome/` (cifrado) | No (WORM opcional) |

### 3.2 Restauración probada (2026-10-17)

| Campo | Valor |
|---|---|
| Quién restauró | Operador (`luis`), siguiendo solo el procedimiento escrito |
| Instantánea | `8a3f2c1d` (2026-10-17 20:00 UTC), repositorio local |
| Tiempo total | 4 min 12 s (252 s) |
| RTO acordado | 2 h (7200 s) — **cumple con 96.5 % de margen** |
| Huellas | 8/8 tablas con `CHECKSUM TABLE` idénticas |

> Plan v0 (semana 2) archivado en [`entregable-s02-planes.md § 3`](entregable-s02-planes.md). Diferencias: v0 usaba `gpg --symmetric` manual sin repositorio cifrado ni copia fuera del sitio automatizada; el plan final usa restic con repositorios local y remoto, verificación automática y retención programada.

---

## 4. Estrategia de hosting y dominio — Semana 3

> Documento completo: [`docs/implantacion/entregable-s03-hosting-y-dominio.md`](entregable-s03-hosting-y-dominio.md)  
> Archivo de reverse proxy: [`Caddyfile`](../../Caddyfile) en la raíz del repositorio.

### 4.1 Tipo de hosting por componente

| Componente | Tipo | Proveedor candidato | Justificación |
|---|---|---|---|
| Frontend (build estático React/Vite) | Estático (CDN) | Render Static Site | Solo archivos HTML/CSS/JS; CDN y HTTPS incluidos sin costo de servidor |
| API REST (FastAPI/Uvicorn en Docker) | PaaS (contenedor) | Render Web Service | Corre la imagen Docker sin administrar SO; escalado y reinicio automáticos |
| Base de datos MySQL 8 | DBaaS / gestionado | PlanetScale o Railway | Backups automáticos y conexiones seguras sin gestionar el servidor de BD |
| Archivos subidos (imágenes de libros) | Object storage | Backblaze B2 / Cloudflare R2 | Los volúmenes Docker no escalan en PaaS; object storage integra con URL pública |
| App móvil (Expo) | Sin servidor propio | Expo Application Services (EAS) | Cliente distribuido vía tiendas; no requiere hosting de servidor |

> Alternativa en servidor propio: VM Ubuntu 24.04 LTS con Docker Compose para los tres servicios (frontend como archivos estáticos, API y MySQL), expuestos al exterior únicamente a través de Caddy en los puertos 80/443.

### 4.2 Dominio

| Campo | Valor |
|---|---|
| Dominio principal | `bookyhome.com.co` |
| Subdominio de API | `api.bookyhome.com.co` |
| Tipo | Propio |
| Registrador candidato | Namecheap o Google Domains |
| Responsable de pago y renovación | Coordinador de la librería (propietario del dominio) |

Dominio local de prueba: `bookyhome.local` / `api.bookyhome.local` con `tls internal` de Caddy.

### 4.3 Registros DNS (valores ficticios — se actualizarán en la semana 4)

| Nombre | Tipo | Valor | TTL | Propósito |
|---|---|---|---|---|
| `@` | `A` | `<ip-servidor>` | `3600` | Raíz del dominio |
| `www` | `CNAME` | `bookyhome.com.co.` | `3600` | Alias www |
| `api` | `CNAME` | `<servicio>.onrender.com.` | `3600` | API en PaaS |
| `@` | `TXT` | `v=spf1 include:_spf.google.com ~all` | `3600` | SPF anti-spam |

### 4.4 Camino de una petición

```
Usuario
  │
  ▼ DNS: bookyhome.com.co → <ip-servidor>
  │
  ▼ TCP :443 (HTTPS / TLS — Caddy + Let's Encrypt)
  │
  ┌──────────────────────────────────────────────────────────┐
  │  Servidor Ubuntu 24.04 LTS                               │
  │  Caddy (80 / 443)                                        │
  │    ├── bookyhome.com.co     → frontend :5173 (interno)   │
  │    └── api.bookyhome.com.co → backend  :8000 (interno)   │
  │  Red interna Docker                                      │
  │    backend :8000 ──────────────→ mysql :3306             │
  └──────────────────────────────────────────────────────────┘
```

**Puertos abiertos a Internet:** `80/tcp` (HTTP + ACME), `443/tcp` (HTTPS), `22/tcp` (SSH).  
**Cerrados al exterior:** `8000` (API), `3306` (MySQL), `5173` (Vite dev).

### 4.5 Reverse proxy

Archivo `Caddyfile` en la raíz del repositorio. Publica el frontend y la API detrás de TLS con `tls internal` para pruebas locales.

```bash
# Comandos de prueba local
caddy trust
caddy run --config Caddyfile
curl --resolve bookyhome.local:443:127.0.0.1 https://bookyhome.local/ -o /dev/null -s -w "%{http_code}\n"
curl --resolve api.bookyhome.local:443:127.0.0.1 https://api.bookyhome.local/health -s
```

### 4.6 Transferencia de archivos

| Qué se transfiere | Método | Autenticación | Frecuencia |
|---|---|---|---|
| Respaldos de BD (`.sql.gz`) | SFTP | Llave SSH Ed25519 (usuario solo-SFTP, sin shell) | Diaria |
| Imágenes de libros (`uploads_data`) | rsync sobre SSH | Misma llave SSH de respaldo | Semanal / por despliegue |
| Código / imagen Docker | Git push + CI/CD | Clave SSH del repositorio | Por despliegue |
| Archivo `.env` | SCP manual | Llave SSH del responsable técnico | Solo al instalar o rotar credenciales |

---

## 5. Plan de instalación v1 — Semana 4

> Documento completo: [`docs/implantacion/entregable-s04-procedimiento-despliegue.md`](entregable-s04-procedimiento-despliegue.md)  
> Plan v0 (semana 2): [`docs/implantacion/entregable-s02-planes.md § 5`](entregable-s02-planes.md)

### 5.1 Proceso de liberación

Versión `1.0.0` con SemVer. Proceso: pruebas en verde → CHANGELOG → `git tag -a v1.0.0` → `git push origin v1.0.0` → `docker build` + `docker push` → notas de versión en GitHub.  
Ver [`CHANGELOG.md`](../../CHANGELOG.md) en la raíz del repositorio.

### 5.2 Despliegue en servidor Linux

Estructura en `/opt/bookyhome/`: carpetas `deploy/`, `scripts/`, `backups/`.  
Archivos en `deploy/`: `compose.prod.yaml`, `Caddyfile.prod`, `.env.prod` (no en repo).

**Prueba de humo ejecutada 2026-10-17 (5/5 PASS):**

```
  ✔ PASS API raíz — HTTP 200
  ✔ PASS API /docs (Swagger) — HTTP 200
  ✔ PASS API /catalogo/categorias — HTTP 200
  ✔ PASS API /catalogo/busqueda-avanzada — HTTP 200
  ✔ PASS Frontend raíz — HTTP 200
  RESULTADO: OK — todas las pruebas pasaron
```

Todas las 83 migraciones de v1.0.0 son compatibles hacia atrás (columnas nullable, DML idempotente). Rollback posible sin restaurar BD para esta versión.

### 5.3 Despliegue en la nube

| Componente | Proveedor | Plan |
|---|---|---|
| API | Render Web Service | Free (con suspensión por inactividad) |
| Frontend | Render Static Site | Free (CDN, sin suspensión) |
| Base de datos | Neon PostgreSQL | Free (0.5 GB, suspensión tras 5 días) |

Blueprint: `deploy/render.yaml`. URLs: `https://bookyhome-api.onrender.com` y `https://bookyhome-web.onrender.com`.

### 5.4 Estimación de costos

| Alternativa | Costo mensual | Costo anual |
|---|---|---|
| Render + Neon (gratuito) | $0 | $0 |
| Render Starter + Railway MySQL | ~$12 | ~$144 |

**Recomendación:** iniciar con la alternativa gratuita los primeros 3 meses; migrar a la paga cuando haya más de ~20 usuarios activos diarios.

---

## 6. Configuración, verificación y migración ejecutada — Semana 5

> Documento completo: [`docs/implantacion/entregable-s05-configuracion-y-verificacion.md`](entregable-s05-configuracion-y-verificacion.md)

### 6.1 Inventario de configuración

Las variables obligatorias (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SECRET_KEY`) se validan al arrancar mediante `backend/app/config.py`. Si falta alguna, el proceso termina con un mensaje claro antes de aceptar tráfico.

| Variable | ¿Secreto? | Desarrollo | Servidor | Nube | Si falta… |
|---|---|---|---|---|---|
| `DB_HOST` | No | `mysql` (contenedor) | `mysql` (red Docker) | `roundhouse.proxy.rlwy.net` | No arranca: mensaje claro |
| `DB_PASSWORD` | **Sí** | `.env` local | `.env.prod` (600) | Panel de Railway | No arranca: mensaje claro |
| `SECRET_KEY` | **Sí** | `.env` local | `.env.prod` (600) | Panel de Render | No arranca: mensaje claro |
| `MAIL_PASSWORD` | **Sí** | `.env` local | `.env.prod` (600) | Panel de Render | Advertencia; correo no funciona |
| `GEMINI_API_KEY` | **Sí** | `.env` local | `.env.prod` (600) | Panel de Render | Advertencia; IA no funciona |

> Inventario completo con todas las variables en [`entregable-s05 §6.1`](entregable-s05-configuracion-y-verificacion.md).

### 6.2 Servicios

| Servicio | Imagen / versión | Depende de | Política de reinicio | Healthcheck | Rotación de logs |
|---|---|---|---|---|---|
| `mysql` | `mysql:8.0` | — | `unless-stopped` | `mysqladmin ping` cada 10 s | `json-file`, 3 × 10 MB |
| `backend` | `bkh-backend:1.0.0` | `mysql` (healthy) | `unless-stopped` | `GET /health` cada 15 s | `json-file`, 3 × 10 MB |
| `frontend` | `bkh-frontend:1.0.0` | — | `unless-stopped` | — | `json-file`, 3 × 10 MB |
| `caddy` | `caddy:2.9-alpine` | `backend`, `frontend` | `unless-stopped` | — | `json-file`, 3 × 10 MB |

Configuración en [`deploy/compose.prod.yaml`](../../deploy/compose.prod.yaml).

### 6.3 Endpoint de salud

| Campo | Valor |
|---|---|
| Ruta | `GET /health` |
| Dependencias que verifica | Base de datos (MySQL), correo (SMTP), asistente IA (Gemini/OpenAI) |
| Respuesta si está sano | HTTP 200 — `{"status":"ok","checks":{"database":{"status":"ok","latency_ms":3.2},...}}` |
| Respuesta si falla la BD | HTTP 503 — `{"status":"error","checks":{"database":{"status":"error",...}}}` |

Código: [`backend/app/routers/health.py`](../../backend/app/routers/health.py). Solo la base de datos es crítica; el correo y la IA se reportan como `degraded` pero no bloquean el servicio.

### 6.4 Pruebas

Prueba de humo (`scripts/smoke-test.sh`) con 7 verificaciones: API raíz, Swagger, categorías, búsqueda avanzada, **endpoint de salud** (propia), **catálogo con datos** (propia) y frontend.

Salida: 7/7 PASS en servidor local y en la nube.

Casos funcionales: 8 casos (F-01 a F-08) cubriendo catálogo, salud, login, detalle de libro, validación de config faltante y rotación de logs. Ver detalle en el entregable.

### 6.5 Lista de verificación posterior al despliegue

- [x] Contenedores en estado `Up (healthy)`
- [x] `GET /health` responde HTTP 200
- [x] Base de datos responde `SELECT 1`
- [x] Catálogo devuelve resultados
- [x] Login funciona
- [x] Prueba de humo 7/7 PASS
- [x] Logs no superan 30 MB por servicio
- [x] `.env.prod` con permisos 600, no en repo
- [x] Ningún secreto en logs
- [x] Respaldo post-instalación > 0
- [x] Versión en `/health` coincide con la etiqueta

---

## 7. Seguridad, Usuarios y Plan de Respaldo Final — Semana 6

> Documento completo: [`docs/implantacion/entregable-s06-seguridad-y-respaldo.md`](entregable-s06-seguridad-y-respaldo.md)  
> Scripts: [`crear-roles-bd.sh`](../../scripts/crear-roles-bd.sh), [`respaldo-restic.sh`](../../scripts/respaldo-restic.sh), [`restaurar-restic.sh`](../../scripts/restaurar-restic.sh)

### 7.1 Usuarios del sistema operativo

| Cuenta | Tipo | Persona o servicio | Grupos | Inicia sesión | sudo permitido |
|---|---|---|---|---|---|
| `ana` | Persona | Administradora | `sudo`, `despliegue` | Llave SSH | Todo, con contraseña |
| `luis` | Persona | Operador | `despliegue` | Llave SSH | `/usr/local/bin/reiniciar-bookyhome` |
| `respaldo` | Servicio | cron + restic | `respaldo` | No (nologin) | Nada |

Archivos sensibles: `/opt/bookyhome` (`root:despliegue`, 2770), `.env.prod` (`root:despliegue`, 640), `/etc/restic/password` (`root:respaldo`, 640).

### 7.2 Acceso remoto y firewall

SSH endurecido (`/etc/ssh/sshd_config.d/10-endurecer.conf`): `PasswordAuthentication no`, `PermitRootLogin no`, `AllowUsers ana luis`.

UFW: `default deny incoming`; puertos abiertos: 22 (SSH), 80/443 (Caddy). MySQL (3306) y API (8000) no expuestos al host (solo red interna Docker). Ver evidencia con `docker compose ps` y `nc -zv` desde otro equipo en el entregable.

### 7.3 Roles de la base de datos

| Rol | Privilegios | No puede | Lo usa | Dónde vive la contraseña |
|---|---|---|---|---|
| `bookyhome_owner` | `ALL PRIVILEGES ON bookyhome.*` (DDL incluido) | Crear usuarios ni bases | Migraciones | Gestor de contraseñas (Bitwarden) |
| `bookyhome_app` | `SELECT, INSERT, UPDATE, DELETE` | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `INDEX`, `GRANT` | La app (backend) | `.env.prod` del servidor (600) |

Script: [`scripts/crear-roles-bd.sh`](../../scripts/crear-roles-bd.sh) (sin contraseñas reales; las genera con `openssl rand`).

### 7.4 Pruebas de privilegios

| Rol | Operación | Resultado |
|---|---|---|
| `bookyhome_app` | `DROP TABLE usuarios` | ❌ `DROP command denied` |
| `bookyhome_app` | `CREATE TABLE hack (id INT)` | ❌ `CREATE command denied` |
| `bookyhome_app` | `ALTER TABLE libros ADD COLUMN x INT` | ❌ `ALTER command denied` |
| `bookyhome_app` | `TRUNCATE TABLE usuarios` | ❌ `DROP command denied` |
| `bookyhome_app` | `GRANT SELECT ON bookyhome.* TO 'otro'@'%'` | ❌ `Access denied` |
| `bookyhome_app` | `SELECT * FROM usuarios` | ✅ 285 filas |
| `bookyhome_owner` | `CREATE TABLE prueba (id INT)` | ✅ Tabla creada |
| `bookyhome_owner` | `CREATE USER 'intruso'@'%'` | ❌ `Access denied; you need CREATE USER` |

### 7.5 Inventario de secretos

| Secreto | Da acceso a | Dónde vive | Permisos | Cómo se rota |
|---|---|---|---|---|
| `DB_PASSWORD` (app) | BD (CRUD de datos) | `.env.prod` (servidor) / panel (nube) | 600 | `crear-roles-bd.sh` → actualizar `.env.prod` → reiniciar |
| `DB_MIGRATION_PASSWORD` (owner) | BD (DDL completo) | Gestor de contraseñas | — | `crear-roles-bd.sh` → ejecutar en MySQL → actualizar gestor |
| `SECRET_KEY` | Firma JWT | `.env.prod` (servidor) / panel (nube) | 600 | `python3 -c "import secrets; print(secrets.token_hex(32))"` → reiniciar |
| `MAIL_PASSWORD` | Correo SMTP | `.env.prod` / panel | 600 | App password del proveedor → reiniciar |
| `GEMINI_API_KEY` | API Gemini | `.env.prod` / panel | 600 | Revocar en Google AI Studio → nueva clave → reiniciar |
| Contraseña restic | Todos los respaldos | `/etc/restic/password` + gestor (fuera del servidor) | 640 | `restic key add` → `restic key remove` → actualizar gestor |
| Llaves SSH | Acceso al servidor | `authorized_keys` (servidor) / `id_ed25519` (cliente) | 600 | `ssh-keygen -t ed25519` → añadir → eliminar la antigua |

Revisión del historial de Git: ningún `.env` commiteado, ninguna contraseña real ni API key en el historial. El `docker-compose.yml` de desarrollo usa `MYSQL_ROOT_PASSWORD: root` (desarrollo local, no producción).

### Plan de respaldo final

Reemplaza la sección 3 (ver arriba). Resumen: `mysqldump` + `restic` con cifrado AES-256, repositorios local y SFTP al NAS (3-2-1), cron diario a las 20:00 h, retención 7d/4w/12m, verificación automática con `restic check`.

### Restauración de desastre probada

| Campo | Valor |
|---|---|
| Fecha | 2026-10-17 |
| Quién restauró | Operador (`luis`), sin ayuda de la administradora |
| Instantánea | `8a3f2c1d` (repo local) |
| Tiempo total | 4 min 12 s (252 s) |
| RTO | 2 h — cumple con 96.5 % de margen |
| Huellas | 8/8 tablas con `CHECKSUM TABLE` idénticas |
