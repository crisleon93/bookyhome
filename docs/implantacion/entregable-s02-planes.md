# Entregable S02 — Planes de Migración, Respaldo e Instalación (v0)

| Campo   | Valor                          |
|---------|-------------------------------|
| Proyecto | BookyHome                    |
| Equipo  | Equipo BookyHome               |
| Fecha   | 2026-10-12                     |

---

## 2. Plan de migración de datos

### 2.1 Objetivo medible

Migrar el 100 % de los libros y vendedores válidos del sistema anterior (hojas de cálculo Excel entregadas por el coordinador de la librería) a las tablas `libros` y `tiendas` de BookyHome, con reporte de rechazos aprobado por el cliente, en máximo 3 horas, sin modificar los registros existentes en producción.

### 2.2 Inventario de origen

| Origen | Formato | Volumen estimado | Responsable de entregarlo | Estado de calidad |
|---|---|---|---|---|
| Catálogo de libros de la librería anterior | Excel `.xlsx` exportado a CSV `;` | ~500 filas | Rol: coordinador de la librería | ISBNs incompletos, precios sin separador decimal uniforme, categorías en texto libre |
| Registro de vendedores / tiendas | Excel `.xlsx` | ~30 filas | Rol: administrador de plataforma | Correos duplicados, nombres con mayúsculas inconsistentes, teléfonos sin formato |
| Imágenes de portadas | Carpeta ZIP con JPG/PNG | ~500 archivos | Rol: coordinador de la librería | Nombres de archivo no relacionados con ISBN, tamaños variables |

### 2.3 Estrategia

**Estrategia de corte:** Big bang — se migra todo el catálogo en una sola ventana de mantenimiento, ya que el volumen es pequeño (~530 filas) y el sistema anterior no registra transacciones activas durante la migración.

**Ventana de mantenimiento propuesta:** domingo entre las 02:00 y las 05:00 hora local, cuando el tráfico de la plataforma es mínimo. La ventana cubre: carga en staging → transformación → validación → carga en producción → verificación → comunicación al cliente.

### 2.4 Tabla de mapeo

| Origen (CSV) | Destino (tabla.columna) | Transformación | Regla de rechazo |
|---|---|---|---|
| `titulo` | `libros.titulo` | trim() | Vacío → rechazar |
| `isbn` | `libros.isbn` | trim, eliminar guiones | Vacío o longitud ≠ 10/13 → rechazar |
| `precio` | `libros.precio` | Reemplazar `,` por `.`, convertir a DECIMAL(10,2) | No numérico o ≤ 0 → rechazar |
| `categoria` | `libros.id_categoria` | Buscar en tabla `categorias` (coincidencia insensible a mayúsculas) | Sin coincidencia → marcar como pendiente de revisión |
| `autor` | `libros.autor` | trim, normalizar a "Apellido, Nombre" si hay coma | Vacío → rechazar |
| `descripcion` | `libros.descripcion` | trim, limitar a 2 000 caracteres | — |
| `stock` | `libros.stock` | Convertir a INT | No entero o < 0 → forzar a 0, registrar en log |
| `nombre_tienda` | `tiendas.nombre` | trim + title case | Vacío → rechazar |
| `correo_vendedor` | `tiendas.correo` / `usuarios.email` | trim + minúsculas | Vacío o formato inválido → rechazar; duplicado en BD → rechazar |
| `telefono` | `tiendas.telefono` | Eliminar espacios y caracteres no numéricos | — |
| Archivo imagen `<nombre>.jpg` | Volumen `uploads_data` | Renombrar a `<isbn>.jpg` si existe coincidencia | Sin coincidencia de ISBN → colocar en carpeta `pendientes/` |

### 2.5 Validaciones

| Validación | Consulta o método | Resultado esperado |
|---|---|---|
| Conciliación de conteos | `SELECT COUNT(*) FROM libros WHERE fecha_migracion = CURDATE()` vs. filas CSV | `migrados + rechazados = total origen` |
| Sin duplicados de ISBN | `SELECT isbn, COUNT(*) FROM libros GROUP BY isbn HAVING COUNT(*) > 1` | 0 filas |
| Precios en rango | `SELECT COUNT(*) FROM libros WHERE precio <= 0 OR precio > 9999999` | 0 filas |
| Categorías asignadas | `SELECT COUNT(*) FROM libros WHERE id_categoria IS NULL AND fecha_migracion = CURDATE()` | 0 filas (o solo las marcadas como pendiente de revisión, documentadas) |
| Tiendas sin correo duplicado | `SELECT email, COUNT(*) FROM usuarios GROUP BY email HAVING COUNT(*) > 1` | 0 filas |
| Integridad referencial | Ejecutar `SHOW ENGINE INNODB STATUS` tras la carga | Sin errores de FK |
| Imágenes huérfanas | Listar archivos en `pendientes/` | Debe estar vacío o contener solo los documentados en el reporte |

### 2.6 Rollback

**Criterio para ejecutar rollback:** si al finalizar la carga en producción el conteo de rechazos supera el 10 % del total de filas origen, o si se detecta corrupción de datos en tablas relacionadas (`ordenes_compra`, `tiendas`).

**Método principal:** antes de iniciar la migración se ejecuta `scripts/respaldar.sh` y se registra el nombre del archivo. Si se activa el rollback, se restaura ese archivo en una base limpia y se apunta el servicio ahí (o se detiene la migración y se conserva la producción sin cambios, dado que la carga se hace en staging primero).

**Rol que decide:** líder técnico del equipo, con aprobación del coordinador de la librería (cliente).

### 2.7 Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Archivo CSV con codificación incorrecta (Windows-1252 en vez de UTF-8) | Alta | Medio | Convertir con `iconv` o Power Query antes de la migración; validar caracteres especiales en staging |
| ISBN duplicado entre el catálogo nuevo y los libros existentes | Media | Alto | Ejecutar la consulta de duplicados en staging antes de mover a producción; rechazar el duplicado |
| Falla de Docker durante la ventana | Baja | Alto | Tener respaldo completo pre-migración; script idempotente para reiniciar desde el último punto de control |
| Categorías del CSV no coinciden con `categorias` | Alta | Bajo | Ejecutar pre-mapeo con el cliente antes de la migración; lista de equivalencias firmada |
| Pérdida de imágenes de portadas | Media | Medio | Conservar el ZIP original; las imágenes no bloquean la migración de datos |
| Ventana de mantenimiento insuficiente | Baja | Medio | Ensayo previo en entorno de staging con el mismo volumen; cronometrar cada fase |

---

## 3. Plan de respaldo (v0)

### 3.1 Qué se respalda

| Elemento | Ubicación | Método | ¿Contiene datos personales? |
|---|---|---|---|
| Base de datos principal | Servicio `mysql` (contenedor `bookyhome-mysql`), base `bookyhome` | `mysqldump --single-transaction --routines --triggers --events` comprimido con `gzip -9` | Sí — correos, teléfonos, direcciones de usuarios |
| Archivos subidos (imágenes de libros, documentos) | Volumen Docker `uploads_data` montado en `/app/uploads` | `docker run --rm -v uploads_data:/data -v ./backups:/backup alpine tar czf /backup/uploads-<fecha>.tar.gz /data` | No directamente (imágenes de productos) |
| Archivo de variables de entorno activas | `backend/.env` (excluido de Git) | Copia manual cifrada antes de cada despliegue | Sí — credenciales de servicios externos |

### 3.2 Objetivos

| RPO | RTO | Justificación (acordada con el cliente) |
|---|---|---|
| 24 horas | 2 horas | El sistema es una plataforma de e-commerce para libros; una pérdida de hasta un día de transacciones es tolerable para la fase inicial. El tiempo de restauración de 2 horas permite recuperar el servicio antes de que los compradores noten una interrupción prolongada. Estos valores se revisarán cuando el volumen de ventas aumente. |

### 3.3 Política

| Aspecto | Decisión |
|---|---|
| Tipo | Completo diario — el volumen de la base es pequeño (~180 MB volcado sin comprimir) y el costo de almacenamiento es bajo; no se justifica diferencial/incremental en esta fase |
| Frecuencia y hora | Diaria a las 20:00 hora local (cuando el tráfico es mínimo) |
| Retención | 30 días para respaldos diarios; los respaldos del último día de cada mes se retienen 12 meses |
| Copia 1 — ubicación y medio | Carpeta `backups/` en el mismo servidor (disco local SSD) |
| Copia 2 — ubicación y medio | Carpeta compartida en unidad NAS de la librería (red interna, protocolo SMB/SSHFS) |
| Copia 3 (fuera del sitio) | Bucket de almacenamiento en la nube (ej. Amazon S3 o equivalente) sincronizado tras cada respaldo exitoso |
| Cifrado | El archivo `.sql.gz` se cifra con `gpg --symmetric --cipher-algo AES256` antes de subir a la copia 3; la clave se custodia por el responsable técnico y el coordinador de la librería |
| Responsable (rol) | Responsable técnico del equipo BookyHome; el coordinador de la librería es el propietario del dato |

### 3.4 Procedimiento de restauración

1. **Detectar y decidir:** confirmar el tipo de incidente (corrupción, borrado accidental, falla de hardware) y decidir si se restaura parcialmente (una tabla) o la base completa.
2. **Contener:** detener el servicio backend (`docker compose stop backend`) para evitar escrituras adicionales durante la restauración.
3. **Elegir el respaldo:** identificar el último respaldo válido (verificar que el archivo tenga tamaño > 0 y que `gzip -t` no reporte error). Preferir el respaldo más reciente previo al incidente.
4. **Respaldar el estado actual (pre-restauración):** ejecutar `bash scripts/respaldar.sh` sobre la base actual (aunque esté corrupta), para conservar evidencia forense.
5. **Restaurar:** crear la base destino, descomprimir y restaurar:
   ```bash
   # En la máquina de producción
   bash scripts/restaurar.sh --archivo backups/<archivo>.sql.gz --base bookyhome_recuperacion
   # Verificar y, si todo está correcto, renombrar o apuntar el servicio a la nueva base
   ```
6. **Verificar:** ejecutar las consultas de validación (conteos de tablas clave, integridad referencial, acceso desde la API) antes de reabrir el tráfico.
7. **Reabrir y comunicar:** reiniciar el backend (`docker compose start backend`), verificar el frontend, y notificar al coordinador de la librería con el tiempo de inactividad y el estado final.
8. **Registrar:** documentar en `docs/implantacion/registro-incidentes.md`: fecha, causa, respaldo utilizado, tiempo de recuperación real y acciones preventivas.

### 3.5 Evidencia de restauración

**Nota sobre la herramienta de respaldo:** la práctica de laboratorio de la semana 2 usa `pg_dump` de PostgreSQL como referencia. BookyHome usa MySQL 8, por lo que `scripts/respaldar.sh` está adaptado para usar `mysqldump --single-transaction --routines --triggers`, que es el equivalente funcional para ese motor: ambos generan un volcado consistente de la base sin bloquear operaciones en curso, incluyendo rutinas y triggers. El enunciado indica explícitamente "adaptado de la práctica 01 **a tu base de datos**".

Respaldo ejecutado el 2026-10-12 con `scripts/respaldar.sh` (comando equivalente manual vía PowerShell al no disponer de bash nativo en Windows):

```
Archivo generado : backups/bookyhome-s02-20261012-183158.sql
Tamaño           : 178 121 KB (~174 MB sin comprimir)
Base restaurada  : bookyhome_s02_prueba
```

#### Conteos antes de restaurar (base `bookyhome` — producción)

| Tabla | Filas en producción |
|---|---|
| usuarios | 285 |
| tiendas | 151 |
| libros | 5 258 |
| ordenes_compra | 23 439 |
| pagos | 23 402 |
| notificaciones | 653 851 |
| resenas_libros | 310 367 |
| categorias | 16 |
| **Total objetos (tablas + vistas)** | **75** |

#### Conteos después de restaurar (base `bookyhome_s02_prueba`)

| Tabla | Filas restauradas | ¿Coincide? |
|---|---|---|
| usuarios | 285 | ✅ |
| tiendas | 151 | ✅ |
| libros | 5 258 | ✅ |
| ordenes_compra | 23 439 | ✅ |
| pagos | 23 402 | ✅ |
| notificaciones | 653 851 | ✅ |
| resenas_libros | 310 367 | ✅ |
| categorias | 16 | ✅ |
| **Total objetos (tablas + vistas)** | **75** | ✅ |

**Tiempo de restauración medido:** ~95 segundos (base de 174 MB sobre Docker Engine local en Windows con disco SSD).

**Conclusión:** la restauración es completa y verificable; todos los conteos de tablas clave coinciden exactamente con los de la base de producción al momento del respaldo.

### 3.6 Calendario de pruebas

| Prueba | Frecuencia | Responsable |
|---|---|---|
| Restauración en base de prueba local (`bookyhome_prueba`) | Mensual (primer domingo de cada mes) | Responsable técnico |
| Verificación de integridad del archivo (`gzip -t`) | Semanal, automática vía cron/tarea programada | Sistema automatizado |
| Restauración completa en VM de staging (simula producción) | Trimestral | Responsable técnico + coordinador de la librería |
| Revisión y actualización del RPO/RTO | Semestral o tras un incidente real | Responsable técnico + coordinador de la librería |

---

## 5. Plan de instalación (v0)

### Tabla resumen

| # | Sección | Contenido |
|---|---|---|
| 1 | Alcance | Despliegue inicial de BookyHome en servidor Ubuntu Server 24.04 LTS usando Docker Compose; incluye frontend React/Vite, API FastAPI y base de datos MySQL 8. No incluye la app móvil Expo (cliente independiente). |
| 2 | Ambientes | **Desarrollo:** equipo local Windows con Docker Desktop. **Staging:** VM Ubuntu Server 24.04 LTS (recursos equivalentes al mínimo definido en la semana 1). **Producción:** servidor físico o VM Ubuntu Server 24.04 LTS con los recursos recomendados de la semana 1. |
| 3 | Roles | **Responsable técnico:** ejecuta el procedimiento y toma decisiones técnicas. **Coordinador de la librería (cliente):** aprueba la ventana y verifica el funcionamiento al final. **Responsable de respaldos:** verifica el respaldo pre-instalación y el post-instalación. |
| 4 | Prerrequisitos | Ver sección 1 (ficha técnica, semana 1): 2 vCPU mínimo, 4 GB RAM, 40 GB libres, Ubuntu Server 24.04 LTS, Docker Engine, Docker Compose. Puerto 80/443 abierto al exterior; 8000 y 3306 solo en red interna. |
| 5 | Preparación | Clonar repositorio, copiar `.env.example` a `.env` y completar variables, verificar que `scripts/verificar-requisitos.sh` retorna código 0, tener respaldo reciente disponible antes de iniciar. |
| 6 | Procedimiento | Ver pasos detallados abajo. |
| 7 | Migración de datos | Ver sección 2 de este documento. |
| 8 | Verificación | Ver lista de comprobaciones al final del procedimiento. |
| 9 | Rollback | Detener los contenedores (`docker compose down`), restaurar el respaldo pre-instalación con `scripts/restaurar.sh`, notificar al cliente. |
| 10 | Cronograma | Ver tabla de ventana abajo. |

---

### Procedimiento detallado

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Verificar requisitos del servidor | `bash scripts/verificar-requisitos.sh` | Salida: `Resultado: CUMPLE LOS REQUISITOS MÍNIMOS` (código de salida 0) |
| 2 | Clonar el repositorio | `git clone <url-repositorio> /opt/bookyhome && cd /opt/bookyhome` | Carpeta `/opt/bookyhome` creada con todos los archivos del proyecto |
| 3 | Configurar variables de entorno | `cp backend/.env.example backend/.env && nano backend/.env` | Archivo `backend/.env` con todas las variables completadas (DB, correo, JWT, etc.) |
| 4 | Construir imágenes Docker | `docker compose build --no-cache` | Imágenes `bkh-backend` y `bkh-frontend` construidas sin errores |
| 5 | Levantar los servicios | `docker compose up -d` | Los tres contenedores (`bookyhome-mysql`, `contenedor-back`, `contenedor-front`) en estado `Up (healthy)` |
| 6 | Verificar salud de la base de datos | `docker compose exec mysql mysql -uroot -p<pass> -e "SHOW DATABASES;"` | Aparece `bookyhome` en la lista |
| 7 | Aplicar migraciones pendientes | `for f in database/migrations/*.sql; do Get-Content $f \| docker compose exec -T mysql mysql -uroot -p<pass> bookyhome; done` | Cada migración sin errores de SQL |
| 8 | Ejecutar respaldo post-instalación | `bash scripts/respaldar.sh` | Archivo `.sql.gz` creado en `backups/` con tamaño > 0 |
| 9 | Verificar el frontend | `curl -o /dev/null -s -w "%{http_code}" http://localhost:5173` | HTTP 200 |
| 10 | Verificar la API | `curl -s http://localhost:8000/health` | JSON con `{"status":"ok"}` o equivalente |
| 11 | Ejecutar comprobaciones de negocio | Acceder a `/api/libros` y confirmar que devuelve registros | Al menos una fila en `libros` |
| 12 | Notificar al cliente | Enviar correo con resultado, tiempo de inactividad y respaldo disponible | Confirmación escrita del coordinador de la librería |

---

### Lista de verificación post-instalación

- [ ] `docker compose ps` muestra los tres contenedores en estado `Up (healthy)`
- [ ] `bash scripts/verificar-requisitos.sh` retorna código 0
- [ ] La API responde en el puerto configurado
- [ ] El frontend carga en el navegador sin errores de consola críticos
- [ ] El login de un usuario administrador funciona
- [ ] El catálogo de libros muestra resultados
- [ ] El respaldo post-instalación existe y tiene tamaño > 0
- [ ] No hay IPs, contraseñas ni tokens expuestos en los logs del contenedor

---

### Cronograma de la ventana de instalación

| Fase | Duración estimada | Acumulado |
|---|---|---|
| Verificación de requisitos y preparación del entorno | 15 min | 15 min |
| Clonado, configuración de `.env` | 10 min | 25 min |
| Build de imágenes Docker | 10 min | 35 min |
| Levantado de servicios y verificación de salud | 5 min | 40 min |
| Aplicación de migraciones | 10 min | 50 min |
| Respaldo post-instalación | 5 min | 55 min |
| Verificaciones funcionales y de negocio | 15 min | 70 min |
| Comunicación al cliente y cierre | 10 min | 80 min |
| **Margen de contingencia** | 40 min | **120 min** |

**Punto de no retorno:** una vez aplicadas las migraciones (paso 7) y con usuarios activos conectados, el rollback requiere restaurar el respaldo pre-instalación. Antes de ese paso, detener los contenedores es suficiente para revertir.

---

## Checklist de cierre

- [x] Plan de migración con origen real identificado, tabla de mapeo, reglas de rechazo, validaciones, rollback y matriz de riesgos
- [x] Plan de respaldo con qué se respalda, RPO/RTO, frecuencia, retención, 3-2-1 y procedimiento de restauración de 8 pasos
- [x] Evidencia de restauración real de la base del proyecto (conteos antes y después)
- [x] Plan de instalación v0 con las 10 secciones, ninguna vacía
- [x] `scripts/respaldar.sh` en el repositorio del proyecto
- [x] Sin IPs, hosts, usuarios ni contraseñas reales
