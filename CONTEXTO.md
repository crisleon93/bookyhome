# CONTEXTO DEL TALLER — Seguridad OWASP Top 10

Este archivo resume todo lo trabajado en el taller de seguridad para que puedas continuar en otra conversación sin perder el hilo.

---

## ¿Qué es este proyecto?

Es un taller práctico de seguridad web basado en **OWASP Top 10 (2021)**. Se parte de un archivo Node.js/Express intencionalmente vulnerable, se identifican las vulnerabilidades, se documentan con Postman y luego se corrige el código aplicando los criterios OWASP correspondientes.

---

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `RepoSeguridad.js` | Servidor Express **vulnerable** (punto de partida) |
| `RepoSeguridadCorregido.js` | Servidor Express **corregido** aplicando OWASP |
| `documentacion_endpoints.md` | Documentación de los endpoints **antes** (vulnerables) con pantallazos de Postman |
| `documentacion_endpoints_corregidos.md` | Documentación de los endpoints **después** (corregidos) con pantallazos de Postman |
| `aplicaci_n_did_ctica_owasp_top_10.html` | Aplicación interactiva con los 10 criterios OWASP explicados con código vulnerable y seguro |

---

## Vulnerabilidades encontradas en RepoSeguridad.js

### 1. Exposición de passwordHash — `A02:2021 Cryptographic Failures`
- **Dónde:** `GET /api/users/:id`
- **Problema:** La respuesta incluía el campo `passwordHash` de cada usuario.
- **Riesgo:** Un atacante podía obtener los hashes y atacarlos offline.

### 2. Sin validación del parámetro :id — `A03:2021 Injection`
- **Dónde:** `GET /api/users/:id`
- **Problema:** El parámetro `id` no era validado. Enviar `crash` hacía explotar el servidor.
- **Riesgo:** Entrada maliciosa podía causar comportamiento inesperado o revelar información.

### 3. Fuga de información interna en errores — `A05:2021 Security Misconfiguration`
- **Dónde:** `GET /api/users/999` y manejador global de errores
- **Problema:** Los errores devolvían rutas internas del servidor, nombre de tablas, host de base de datos y stack trace completo.
- **Riesgo:** Un atacante obtiene un mapa detallado de la arquitectura interna del servidor.

### 4. Sin validación del body en registro — `A04:2021 Insecure Design`
- **Dónde:** `POST /api/register`
- **Problema:** Aceptaba body vacío `{}` y registraba usuarios con `username: "undefined"` y `role: "undefined"`. No había lista blanca de roles.
- **Riesgo:** Registros malformados, corrupción de datos y posible escalación de privilegios.

---

## Correcciones aplicadas en RepoSeguridadCorregido.js

| Corrección | Criterio OWASP | Cómo se implementó |
|------------|---------------|---------------------|
| Eliminar `passwordHash` de respuestas | A02:2021 | Se usa destructuring para excluir el campo antes de enviar la respuesta |
| Validar que `:id` sea número entero positivo | A03:2021 | `parseInt()` + validación `isNaN()` con error 400 si falla |
| Mensajes de error genéricos sin detalles internos | A05:2021 | Manejador global reemplazado por respuesta genérica + log interno en consola |
| Validación de campos obligatorios en el body | A04:2021 | Verificación de presencia, tipo y valor no vacío de `username` y `role` |
| Lista blanca de roles permitidos | A04:2021 | Array `allowedRoles` con los roles válidos; cualquier otro es rechazado con error 400 |

---

## Endpoints documentados

### GET /api/users/:id — 4 casos probados

| id | Antes | Después |
|----|-------|---------|
| `1` | Devolvía passwordHash | Solo devuelve id, username, role |
| `2` | Devolvía passwordHash | Solo devuelve id, username, role |
| `999` | Filtraba ruta interna, tabla y host de BD | Error genérico: "Usuario no encontrado." |
| `crash` | Stack trace completo al cliente | Error 400: "ID de usuario inválido." |

### POST /api/register — 3 casos probados

| Body enviado | Antes | Después |
|-------------|-------|---------|
| `{ username, role }` válido | Registraba correctamente | Registra correctamente |
| `{}` vacío | Registraba con `undefined` | Error 400: campos requeridos |
| `{ role: "superadmin" }` | Aceptaba el rol | Error 400: rol no permitido |

---

## Próximo paso

Aplicar estos mismos criterios de seguridad OWASP al proyecto propio del aprendiz, identificando en su código las mismas categorías de vulnerabilidades y corrigiéndolas siguiendo el mismo patrón trabajado en este taller.

---

## Cómo usar este archivo en una nueva conversación

1. Abrí una nueva conversación con Kiro
2. Arrastrá este archivo `CONTEXTO.md` al chat
3. Arrastrá también los archivos de tu proyecto que querés corregir
4. Explicale qué querés hacer, por ejemplo:
   > "Tengo este contexto de un taller OWASP que hice. Ahora quiero aplicar las mismas correcciones a mi proyecto. Te adjunto los archivos."
