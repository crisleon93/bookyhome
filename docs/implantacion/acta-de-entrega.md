# Acta de Entrega — BookyHome

| Campo | Valor |
|---|---|
| Proyecto | BookyHome — Plataforma de comercio electrónico de libros |
| Cliente (organización) | Librería Coordinadora del Bootcamp |
| Equipo que entrega | Equipo BookyHome |
| Fecha | 2026-10-17 |
| Lugar o medio | Videoconferencia + repositorio GitHub |

---

## 1. Alcance entregado

| Funcionalidad | Requisito | Caso de aceptación | Estado |
|---|---|---|---|
| Registro de compradores y vendedores | RF-001, RF-002 | CA-01, CA-02 | Aceptada |
| Inicio de sesión con JWT | RF-003 | CA-03, CA-04 | Aceptada |
| Catálogo con búsqueda y filtros | RF-005, RF-006, RF-007 | CA-05, CA-06 | Aceptada |
| Detalle de libro (ISBN, precio, imagen) | RF-008 | CA-07 | Aceptada |
| Carrito de compras | RF-009, RF-010 | CA-08, CA-09 | Aceptada con observaciones |
| Actualización de cantidad en carrito | RF-034 | CA-10 | Con observaciones — defecto mayor (corrección comprometida 2026-10-31) |
| Checkout y procesamiento de orden | RF-011, RF-012 | CA-11, CA-12 | Aceptada |
| Publicación de libros por vendedor | RF-013 | CA-13, CA-14 | Aceptada |
| Gestión de perfil de librería | RF-014 | CA-15 | Aceptada |
| Precio con descuento en catálogo | RF-040 | CA-16 | Con observaciones — defecto menor (corrección comprometida 2026-11-07) |
| Administración de usuarios | RF-023 | CA-17 | Aceptada |
| Endpoint de salud del sistema | RNF | CA-18 | Aceptada |
| Aplicación móvil (Expo — Android/iOS) | RF-móvil | CA-19 | Aceptada |
| Comparación de libros lado a lado | RF-033 | CA-20 | **Postergado — roadmap v2** (acuerdo explícito con el cliente) |

**Versión del software:** 1.0.1 · **Etiqueta Git:** `v1.0.1` · **Imagen:** `ghcr.io/bookyhome/bkh-backend:1.0.1`

---

## 2. Ambientes

| Ambiente | Dónde | URL |
|---|---|---|
| Producción (nube) | Render Web Service + Render Static Site | `https://bookyhome-api.onrender.com` / `https://bookyhome-web.onrender.com` |
| Base de datos producción | Neon PostgreSQL / Railway MySQL | Panel de Railway o Neon (acceso transferido al cliente) |
| Pruebas | VM Ubuntu 24.04 LTS del equipo (local) | `https://bookyhome.local` / `https://api.bookyhome.local` (Caddy + TLS interno) |
| Código fuente | GitHub | `https://github.com/bookyhome/bkh` (repositorio privado → transferir propiedad) |
| Registro de imágenes | GitHub Container Registry (GHCR) | `ghcr.io/bookyhome/bkh-backend` |

---

## 3. Documentación entregada

| Documento | Versión | Ubicación |
|---|---|---|
| Plan de Implantación (secciones 1–10) | 1.1 | `docs/implantacion/plan-implantacion.md` |
| Guía rápida y procedimientos | 1.0.1 | `docs/ayuda/guia-rapida.md` |
| Preguntas frecuentes | 1.0.1 | `docs/ayuda/preguntas-frecuentes.md` |
| Runbook: salud en rojo | 1.0 | `docs/runbooks/salud-en-rojo.md` |
| Runbook: respaldo diario sin latido | 1.0 | `docs/runbooks/respaldo-diario-sin-latido.md` |
| Entregable S09 (pruebas, simulacro, acta) | 1.0 | `docs/implantacion/entregable-s09-aceptacion-y-entrega.md` |
| Registro del simulacro cruzado | 1.0 | `docs/implantacion/registro-del-simulacro.md` |
| Bitácora de lecciones aprendidas | 1.0 | `docs/calidad/bitacora-lecciones-aprendidas.md` |
| CHANGELOG | 1.0.1 | `CHANGELOG.md` |

---

## 4. Resultado de las pruebas de aceptación

**Decisión:** Aceptado con observaciones

| Defecto abierto | Severidad | Fecha de corrección comprometida |
|---|---|---|
| RF-034: no es posible actualizar cantidad de un ítem en el carrito | Mayor | 2026-10-31 |
| RF-040: precio con descuento no aparece en el catálogo | Menor | 2026-11-07 |
| Texto de error de login en inglés en algunas validaciones | Menor | 2026-10-24 |
| Imagen de portada sin texto alternativo en detalle | Cosmético | 2026-11-07 |

---

## 5. Resultado del simulacro cruzado

| Campo | Valor |
|---|---|
| Equipo que instaló | Equipo Alfa (bootcamp) |
| Duración | 72 min (tiempo máximo: 90 min) |
| Huellas | ✅ Idénticas — 8/8 tablas con `CHECKSUM TABLE` |
| Desviaciones corregidas en la versión del plan | 3 (D-01: driver de red, D-02: ruta de `.env.prod`, D-03: flag `--events` en mysqldump) |

Enlace al registro completo: [`registro-del-simulacro.md`](registro-del-simulacro.md)

---

## 6. Transferencia de accesos

> ⚠️ Este acta no contiene secretos. Las contraseñas, llaves privadas y tokens se transfieren por canal cifrado separado (gestor de contraseñas compartido: Bitwarden).

| Acceso | Cómo se transfiere | Fecha | ¿Rotado después? |
|---|---|---|---|
| Repositorio GitHub y GHCR | Transferencia de propiedad del repo + invitación de organización al cliente | 2026-10-17 | El cliente debe revocar los tokens del equipo entregante |
| Servidor de producción (cuentas `ana` y `luis`) | El cliente crea sus propias cuentas con llave SSH; el equipo elimina sus `authorized_keys` | 2026-10-24 | Sí — tras confirmar acceso del cliente |
| Contraseñas (BD app, BD owner, restic, SMTP, Gemini) | Bitwarden: el equipo invita al correo del cliente y transfiere la colección "BookyHome-Prod" | 2026-10-17 | El cliente debe rotar todas las contraseñas en los 15 días posteriores a la recepción |
| Variables de entorno (`.env.prod`) | El cliente recibe el archivo por SCP desde la VM del equipo entregante hacia la suya | 2026-10-17 | Sí — rotar tras confirmar funcionamiento |
| Panel de Render y Neon/Railway | El cliente crea su propia cuenta; el equipo entregante elimina los servicios de su cuenta o transfiere el proyecto | 2026-10-24 | N/A — nueva cuenta del cliente |
| Dominio `bookyhome.com.co` | El registrador (Namecheap) mueve el dominio a la cuenta del cliente | 2026-10-24 | N/A — propiedad del cliente |

---

## 7. Niveles de servicio acordados

> Estos niveles aplican durante el periodo de garantía (90 días) con el equipo actual de 2 personas (ana + luis). Superado el periodo, se revisarán con el nuevo operador del cliente.

| Nivel de servicio | Compromiso | Cómo se mide |
|---|---|---|
| Disponibilidad mensual | ≥ 99 % (máximo 7.3 h de indisponibilidad/mes) | Uptime Kuma — monitor "Salud API" (60 s de intervalo); reporte mensual automático |
| Horario de soporte | Lunes–viernes 07:00–21:00 hora Bogotá (P2–P4); 24/7 para P1 | Telegram BookyHome-Ops; primera respuesta con hora de registro |
| Primera respuesta P1 (producción caída) | 30 min en horario extendido (07:00–21:00); 2 h fuera de horario | Marca de tiempo en Telegram |
| Solución P1 | 2 h desde la primera respuesta | Marca de tiempo en el issue de GitHub |
| Primera respuesta P2 (función crítica degradada) | 2 h en horario laboral | Telegram + issue de GitHub |
| Solución P2 | 8 h desde la primera respuesta | Issue de GitHub cerrado con evidencia |
| Primera respuesta P3 (función secundaria con error) | 1 día hábil | Issue de GitHub |
| Solución P3 | 5 días hábiles | Issue de GitHub cerrado |
| Primera respuesta P4 (cosmético / mejora) | 3 días hábiles | Issue de GitHub |
| Solución P4 | Próximo sprint (máximo 2 semanas) | Issue cerrado con etiqueta del sprint |
| RPO | 24 h (respaldo diario a las 20:00 h Bogotá) | Monitor "Respaldo diario" en Uptime Kuma (latido de 25 h) |
| RTO | 2 h (restauración probada: 14 min en simulacro) | Tiempo medido en el registro del simulacro / incidente |
| Ventana de mantenimiento | Domingos 02:00–04:00 hora Bogotá | Anuncio en Telegram con ≥ 48 h de anticipación |

---

## 8. Garantía

| Campo | Valor |
|---|---|
| Duración | 90 días desde la firma del acta (hasta 2027-01-15) |
| Cubre | Corrección de defectos encontrados en las pruebas de aceptación (RF-034, RF-040, textos de error, alt text); errores de instalación descubiertos en el simulacro ya corregidos; caídas de servicio causadas directamente por el software entregado |
| No cubre | Cambios de requisitos después de la firma; fallos causados por infraestructura del cliente (caída del proveedor de nube, falta de pago del hosting); migraciones de MySQL 8.0 y Node.js 20 a versiones no-EOL (planificadas pero fuera del alcance de la garantía); nuevas funcionalidades (RF-033 postergado) |

---

## 9. Pendientes

| Pendiente | Responsable (rol) | Fecha |
|---|---|---|
| Corregir RF-034 (actualizar cantidad en carrito) | Líder de desarrollo | 2026-10-31 |
| Corregir RF-040 (precio con descuento en catálogo) | Líder de desarrollo | 2026-11-07 |
| Corregir textos de error de login en inglés | Desarrollador frontend | 2026-10-24 |
| Añadir texto alternativo a imágenes de portada | Desarrollador frontend | 2026-11-07 |
| Migrar MySQL 8.0 → 8.4 LTS | Operador + Administradora | 2026-12-15 |
| Migrar Node.js 20 → 22 LTS | Desarrollador frontend | 2026-11-30 |
| Migrar Python 3.10 → 3.12 | Desarrollador backend | 2026-10-31 |
| Transferir acceso a servidor (crear cuentas del cliente, revocar llaves del equipo) | Administradora (`ana`) | 2026-10-24 |
| Transferir panel de Render / Neon al cliente | Operador (`luis`) | 2026-10-24 |
| Rotar todas las contraseñas de producción tras confirmar acceso del cliente | Cliente | 2026-11-01 |
| Capacitación de soporte N1 (2 personas del cliente) | Administradora (`ana`) | 2026-10-24 |
| Capacitación de operación N2 (operador del cliente) | Administradora + Operador | 2026-10-25 |
| Prueba de runbooks por el nuevo operador del cliente | Operador del cliente | 2026-10-26 |

---

## 10. Firmas

| Rol | Nombre (impreso o digital) | Firma | Fecha |
|---|---|---|---|
| Entrega (equipo) — líder técnico | __________________________ | __________________________ | 2026-10-17 |
| Entrega (equipo) — operador | __________________________ | __________________________ | 2026-10-17 |
| Recibe (cliente) — coordinador de la librería | __________________________ | __________________________ | 2026-10-17 |
| Testigo (instructor) | __________________________ | __________________________ | 2026-10-17 |
