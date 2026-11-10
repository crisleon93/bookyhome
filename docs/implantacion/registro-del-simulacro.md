# Registro del Simulacro Cruzado — BookyHome

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo que entrega | Equipo BookyHome |
| Equipo que instala | Equipo Alfa |
| Observador | Instructor del bootcamp |
| Versión del plan | 1.0 (en ejecución) → 1.1 (tras correcciones) |
| Versión del software | 1.0.1 · Etiqueta Git: `v1.0.1` · Imagen: `ghcr.io/bookyhome/bkh-backend:1.0.1` |
| Servidor usado | VM de laboratorio — Ubuntu Server 24.04 LTS (equipo propio del equipo instalador) |
| Tiempo máximo acordado | 90 minutos |
| Hora de inicio | 10:00 h (hora Bogotá) |
| Hora de fin | 11:12 h (hora Bogotá) |

---

## Comprobación de servidor limpio

- [x] Sin contenedores ni volúmenes previos del proyecto (`docker ps -a` y `docker volume ls` vacíos)
- [x] Carpeta de instalación nueva (`/opt/bookyhome/` no existía antes del simulacro)
- [x] Contraseñas recibidas por un canal distinto al del paquete (paquete por correo → contraseñas por Telegram privado)

---

## Criterios

| # | Criterio | Logrado | Evidencia (salida o captura) |
|---|---|---|---|
| 1 | Requisitos verificados con el script | ✅ Sí | `bash scripts/verificar-requisitos.sh` → `Resultado: CUMPLE LOS REQUISITOS MÍNIMOS`; 2 vCPU, 8 GB RAM, 120 GB libres en SSD |
| 2 | Instalación completa, servicios sanos | ✅ Sí | `docker compose -f deploy/compose.prod.yaml ps` → 4 servicios `Up (healthy)` |
| 3 | Datos restaurados, huellas idénticas | ✅ Sí | `CHECKSUM TABLE` en origen vs. destino → 8/8 idénticas (ver tabla de huellas más abajo) |
| 4 | Prueba de humo en verde con la versión esperada | ✅ Sí | `bash scripts/smoke-test.sh` → 7/7 PASS; `/health` devuelve `"version":"1.0.1"` |
| 5 | Dentro del tiempo máximo | ✅ Sí | 72 min (< 90 min) |

### Tabla de huellas — comparación origen vs. destino en el simulacro

| Tabla | Checksum origen | Checksum destino | ¿Idénticas? |
|---|---|---|---|
| categorias | 1838403126 | 1838403126 | ✅ |
| usuarios | 4092817356 | 4092817356 | ✅ |
| tiendas | 2756389140 | 2756389140 | ✅ |
| libros | 3901745218 | 3901745218 | ✅ |
| ordenes_compra | 2845109377 | 2845109377 | ✅ |
| pagos | 1473092685 | 1473092685 | ✅ |
| notificaciones | 951648032 | 951648032 | ✅ |
| resenas_libros | 3182746901 | 3182746901 | ✅ |

---

## Desviaciones

| Hora | Sección y paso del plan | Tipo | Qué pasó | ¿Se preguntó? | ¿Invalida? |
|---|---|---|---|---|---|
| 10:08 | 5.2 — Crear red Docker | Faltante | El equipo instalador no supo qué driver usar al ejecutar `docker network create bookyhome-net`; el paso no lo especificaba. Crearon la red con el driver por defecto (bridge), que resultó correcto, pero requirió 4 min de revisión en la documentación de Docker. | No (lo resolvieron por su cuenta consultando la documentación oficial de Docker) | No — el driver bridge es el correcto y el sistema funcionó |
| 10:23 | 6.2 — Copiar `.env.prod` | Ambiguo | El plan decía "copiar el archivo de configuración al servidor" sin indicar la ruta destino exacta. El equipo lo colocó en `/opt/bookyhome/` en lugar de `/opt/bookyhome/deploy/`. Los contenedores no encontraron las variables de entorno y fallaron al arrancar. Tomó 8 min diagnosticar y mover el archivo. | Sí — el equipo consultó al equipo que entrega sobre la ruta. Se les respondió únicamente que consultaran el plan. Corrigieron la ruta sin más ayuda. | No — tras mover el archivo, los contenedores arrancaron correctamente |
| 10:38 | 3 — Restaurar respaldo (`mysqldump`) | Erróneo | Al ejecutar `mysqldump` con el comando del plan (sin `--events`), MySQL emitió la advertencia: `Warning: Skipping the data of table mysql.event`. El equipo detuvo el proceso para revisar si la advertencia invalidaba el respaldo. Tardó 6 min en confirmar que los eventos del scheduler no eran datos de negocio críticos y que la huella de la base sería idéntica sin ellos. Se añadió `--events` al volcado final para que no se repita. | Sí — el equipo consultó si debían preocuparse por la advertencia. Se les indicó que documentaran la desviación y continuaran. | No — la base quedó restaurada con 8/8 huellas idénticas |

---

## Resultado

| Campo | Valor |
|---|---|
| Duración total | 72 min |
| Tiempo de restauración (desde "levantar la base" hasta huellas idénticas) | 14 min (paso 2.8 del plan) |
| Comparación con el RTO del plan | RTO acordado: 2 h (120 min); restauración en 14 min — **86 % de margen** |
| Resultado | **Superado** |
| Motivo (si no se superó) | N/A |

---

## Plan corregido

Las tres desviaciones generaron correcciones inmediatas en la versión 1.1 del plan:

- **D-01** → sección 5.2: se añadió `--driver bridge` y la nota explicativa.
- **D-02** → sección 6.2: se añadió la ruta absoluta `/opt/bookyhome/deploy/.env.prod` y el comando `chmod 600`.
- **D-03** → sección 3: se añadió el flag `--events` al comando `mysqldump`.

No fue necesario repetir el simulacro porque ninguna de las tres desviaciones invalidó el intento.

---

Firma del observador (rol): ________________________________ Instructor del bootcamp

Fecha: 2026-10-17
