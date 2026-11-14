# Marco de calidad, CMMI y PSP de BookyHome

## 1. Objetivo

Establecer las practicas usadas para revisar la calidad de BookyHome, controlar cambios y registrar el trabajo individual del equipo.

Este documento sirve como evidencia del criterio 7. No declara una certificacion ISO o CMMI; organiza las practicas del proyecto usando sus conceptos como referencia.

## 2. Referencias aplicadas

- **ISO/IEC 25000 (SQuaRE):** familia de normas para evaluar la calidad de productos y sistemas de software.
- **ISO/IEC 25010:** modelo de caracteristicas de calidad usado como referencia para funcionalidad, eficiencia, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad y portabilidad.
- **CMMI:** referencia para planificar, gestionar requisitos, controlar cambios, verificar resultados, validar el producto y gestionar riesgos.
- **PSP (Personal Software Process):** disciplina individual para estimar, registrar tiempo, registrar defectos y aprender de los resultados.

## 3. Matriz de practicas de calidad

| Referencia | Practica en BookyHome | Evidencia | Estado |
|---|---|---|---|
| ISO/IEC 25010 - Funcionalidad | Casos de uso para registro, login, catalogo, libros, carrito y checkout | `docs/aceptacion/Plantilla_Caso_de_prueba.xlsx` | Aplicada |
| ISO/IEC 25010 - Seguridad | JWT, bcrypt, roles, usuarios activos y restricciones administrativas | `backend/app/auth.py`, `backend/app/routers/usuarios.py` | Aplicada |
| ISO/IEC 25010 - Mantenibilidad | Separacion por routers, modelos, paginas y componentes | `backend/app/`, `frontend/src/` | Aplicada |
| ISO/IEC 25010 - Fiabilidad | Healthcheck de MySQL, backups y restauracion de prueba | `docker-compose.yml`, `scripts/backups/` | Aplicada |
| ISO/IEC 25010 - Compatibilidad | Matriz de plataformas y verificacion local | `docs/implantacion/verificacion-plataforma.md` | Parcial |
| ISO/IEC 25010 - Eficiencia | Paginacion y build del frontend | `pnpm build`, routers de catalogo | Parcial |
| CMMI - Gestion de requisitos | Historias, requisitos funcionales y no funcionales | `docs/requisitos/` | Aplicada |
| CMMI - Planificacion | Plan de migracion, respaldos y acciones de calidad | `docs/implantacion/plan-migracion-respaldos.md` | Aplicada |
| CMMI - Verificacion | Build, sintaxis Python, Compose, endpoints y restauracion controlada | Registros de comandos y reportes | Aplicada |
| CMMI - Validacion | Casos ejecutados con resultados y capturas | `docs/aceptacion/Plantilla_Caso_de_prueba.xlsx` | Parcial |
| CMMI - Gestion de riesgos | Riesgos y controles documentados | Informe de calidad y plan de migracion | Aplicada |
| PSP - Medicion personal | Registro de tiempo, cambios, defectos y lecciones aprendidas | Registro de este documento | En ejecucion |

## 4. Criterio de trabajo del equipo

1. Leer el requisito antes de modificar el codigo.
2. Crear cambios pequenos y relacionados con un requisito.
3. Revisar los archivos afectados antes de probar.
4. Ejecutar una validacion enfocada despues de cada cambio.
5. Registrar defectos encontrados, causa y solucion.
6. Actualizar la documentacion y la evidencia.
7. No declarar un requisito cumplido sin una prueba o evidencia asociada.

## 5. Registro PSP individual

Git permite identificar a los integrantes y algunos aportes registrados, pero no permite conocer con precision las horas trabajadas fuera del repositorio. Las areas siguientes son ejemplos observados en los commits y no una asignacion exclusiva: todos los integrantes pueden haber trabajado en movil, frontend, backend y otras partes del proyecto. Las horas estimadas y reales deben ser confirmadas por cada integrante.

| Fecha | Integrante | Ejemplos de aportes observados en Git | Tiempo estimado | Tiempo real | Defectos encontrados | Defectos corregidos | Evidencia |
|---|---|---|---:|---:|---:|---:|---|
| 2026-08-24 | `crisleon93` | Cambios observados en frontend, backend, movil, autenticacion, pedidos y soporte | Por confirmar | Por confirmar | Por revisar en la bitacora individual | Por registrar | Historial Git: 152 commits |
| 2026-08-24 | `liznayibe52-a11y` | Cambios observados en movil, funciones de comprador y vendedor, calificaciones y correcciones | Por confirmar | Por confirmar | Por revisar en la bitacora individual | Por registrar | Historial Git: 35 commits |
| 2026-08-24 | `vanegas3a` | Cambios observados en movil, perfil, historial, notificaciones, recuperacion, responsive, recomendaciones y administracion | Por confirmar | Por confirmar | Por revisar en la bitacora individual | Por registrar | Historial Git: 16 commits |
| 2026-08-24 | `juanpineda313` | Cambios observados en movil, finanzas, nomina, soporte, envios, tienda, catalogo, chat, requisitos y otras areas | Por confirmar | Por confirmar | Por revisar en la bitacora individual | Por registrar | Historial Git: 12 commits |
| AAAA-MM-DD | NOMBRE | ACTIVIDAD | 0 | 0 | 0 | 0 | RUTA O COMMIT |

### Fuente de los integrantes

La lista anterior se obtuvo con `git shortlog -sne --all`. Los nombres corresponden a las identidades configuradas en los commits, no necesariamente a los nombres completos de las personas. Cada integrante debe confirmar su identidad, actividad y tiempos antes de la entrega.

### Como completar el registro

Cada integrante debe completar o confirmar su propia fila siguiendo estos pasos:

1. Confirmar que el usuario de Git corresponde a su identidad y escribir el nombre completo si el equipo lo requiere.
2. Revisar los ejemplos de aportes y corregirlos o ampliarlos según el trabajo realizado en movil, frontend, backend, base de datos o documentacion.
3. Registrar el tiempo estimado antes de una actividad cuando exista ese dato; si no se registro previamente, escribir `No registrado` en lugar de inventarlo.
4. Registrar el tiempo real trabajado usando la memoria personal, agenda, tablero o registro de trabajo disponible.
5. Anotar los defectos encontrados y corregidos solo cuando puedan describirse con claridad.
6. Agregar como evidencia el hash de un commit, la ruta de un archivo, una prueba o una captura.
7. No modificar las filas de los demas integrantes.

El historial Git sirve para comprobar autor, fecha, commit y archivos modificados. Las horas no deben calcularse restando la hora de un commit y la del siguiente, porque ese intervalo no representa necesariamente tiempo de programacion.

## 6. Registro de defectos

| ID | Fecha | Modulo | Defecto | Causa | Correccion | Verificacion | Estado |
|---|---|---|---|---|---|---|---|
| DEF-001 | 2026-08-24 | Base de datos | Vista de ingresos invalida | Faltaban tablas de impulsos | Migracion `020_asegurar_tablas_impulsos.sql` | `CHECK TABLE` y backup exitoso | Cerrado |
| DEF-002 | 2026-08-24 | Autorizacion | Endpoints administrativos sin dependencia de rol | Rutas no exigian administrador | Se agrego `require_role` | Peticiones sin token devuelven `401` | Cerrado |
| DEF-003 | AAAA-MM-DD | MODULO | DESCRIPCION | CAUSA | CORRECCION | PRUEBA | Pendiente |

## 7. Evidencias de validacion

- Evaluacion detallada de requisitos no funcionales en `docs/calidad/evaluacion-rnf.md`.
- `pnpm build` finalizo correctamente.
- `docker compose config` finalizo correctamente.
- Frontend y backend respondieron con HTTP `200`.
- MySQL aparecio como `healthy`.
- La restauracion en `bookyhome_prueba` recupero 75 objetos.
- El backend rechazo accesos sin token a rutas administrativas con `401`.
- `git diff --check` no reporto errores de formato.

## 8. Resultado

BookyHome tiene practicas de calidad documentadas y evidencias tecnicas asociadas. El criterio queda en estado **parcial avanzado** hasta completar los registros individuales PSP, las pruebas formales restantes y la validacion completa de requisitos no funcionales.
