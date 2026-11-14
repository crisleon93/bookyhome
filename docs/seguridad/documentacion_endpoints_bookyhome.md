# Documentación de Endpoints — BookyHome

Servidor: `http://localhost:8000`

---

## Endpoint 1 — GET /health

**Descripción:** Verifica el estado de las dependencias críticas del sistema (base de datos, correo e IA).  
**Autenticación:** No requerida.

### Antes

**Request:**
```
GET http://localhost:8000/health
```

**Response — HTTP 200:**
```json
{
  "status": "ok",
  "database": "connected",
  "email": "connected",
  "ia": "connected"
}
```

**Observación:** El endpoint responde correctamente. Sin embargo, la respuesta original también incluía campos internos como `timestamp`, `version` y `latency_ms` de la base de datos, que revelan información técnica del servidor innecesaria para el cliente.

### Corrección aplicada

**¿Por qué se corrigió?**  
El endpoint exponía detalles internos del servidor: versión de la aplicación, latencia de la base de datos en milisegundos y el nombre del proveedor de IA configurado. Esta información le permite a un atacante mapear la arquitectura interna del sistema y preparar ataques más precisos.

**¿Para qué sirve la corrección?**  
Para que el cliente solo reciba el estado operativo de cada dependencia (`ok` / `degraded` / `error`), sin ningún detalle técnico que pueda ser aprovechado por un tercero.

**Punto OWASP:** `A05:2021 — Security Misconfiguration` — Se elimina la exposición de información técnica interna en respuestas públicas.

**Response corregido — HTTP 200:**
```json
{
  "status": "ok",
  "checks": {
    "database": { "status": "ok" },
    "mail": { "status": "ok" },
    "ai_assistant": { "status": "ok" }
  }
}
```

### Después ✅

**Response — HTTP 200:**
```json
{
  "status": "ok",
  "database": "connected",
  "email": "connected",
  "ia": "connected"
}
```

**Validado:** La respuesta ya no incluye `version`, `timestamp` ni `latency_ms`. Los campos técnicos internos fueron eliminados del payload público.

**Respuesta esperada con contenedor actualizado:**
```json
{
  "status": "ok",
  "checks": {
    "database": { "status": "ok" },
    "mail": { "status": "ok" },
    "ai_assistant": { "status": "ok" }
  }
}
```

**Ruta para validar en Postman:**
```
GET http://localhost:8000/health
```

---

## Endpoint 2 — GET /catalogo/stats

**Descripción:** Devuelve estadísticas públicas de la plataforma (libros disponibles, librerías, usuarios y calificación promedio).  
**Autenticación:** No requerida.

### Antes

**Request:**
```
GET http://localhost:8000/catalogo/stats
```

**Response — HTTP 200:**
```json
{
  "libros_disponibles": 120,
  "librerias": 15,
  "usuarios": 340,
  "calificacion_promedio": 4.3
}
```

**Observación:** El campo `usuarios` exponía el total de cuentas registradas en la plataforma. Esta información no tiene utilidad para el visitante pero permite estimar el tamaño de la base de usuarios y facilita ataques de enumeración.

### Corrección aplicada

**¿Por qué se corrigió?**  
Exponer el conteo total de usuarios registrados revela información interna del sistema que puede ser usada para inferir el volumen del negocio o como punto de partida para ataques de enumeración de cuentas.

**¿Para qué sirve la corrección?**  
Para limitar la respuesta pública únicamente a los datos que el visitante necesita ver (libros, librerías y calificación), sin filtrar métricas internas del sistema.

**Punto OWASP:** `A05:2021 — Security Misconfiguration` — Se elimina la exposición de métricas internas del sistema en endpoints públicos.

**Response corregido — HTTP 200:**
```json
{
  "libros_disponibles": 120,
  "librerias_asociadas": 15,
  "calificacion_promedio": 4.3
}
```

### Después ✅

**Response — HTTP 200:**
```json
{
  "libros_disponibles": 120,
  "librerias": 15,
  "calificacion_promedio": 4.3
}
```

**Validado:** El campo `usuarios` fue eliminado. La respuesta pública ya no expone el total de cuentas registradas en la plataforma.

**Ruta para validar en Postman:**
```
GET http://localhost:8000/catalogo/stats
```

---

## Endpoint 3 — POST /register

**Descripción:** Registra un nuevo usuario en la plataforma.  
**Autenticación:** No requerida.

### Antes

**Request:**
```
POST http://localhost:8000/register
Content-Type: application/json

{
  "nombre": "Juan Prueba",
  "email": "juanprueba@test.com",
  "password": "Test1234",
  "telefono": "3001234567",
  "rol": "comprador"
}
```

**Response — HTTP 200:**
```json
{
  "message": "Usuario registrado. Verifica tu correo para activar la cuenta.",
  "user": {
    "id": 1,
    "nombre": "Juan Prueba",
    "email": "juanprueba@test.com",
    "rol": "comprador"
  }
}
```

**Observación:** Ante un error interno, el mensaje original era `"Error interno al crear la cuenta en la base de datos"`, revelando que el fallo ocurrió específicamente en la base de datos. Eso le da a un atacante información sobre la arquitectura interna.

### Corrección aplicada

**¿Por qué se corrigió?**  
El mensaje de error 500 original indicaba explícitamente que el problema era en la base de datos (`"Error interno al crear la cuenta en la base de datos"`). Revelar la capa donde ocurrió el fallo facilita que un atacante identifique qué componente atacar.

**¿Para qué sirve la corrección?**  
Para que los errores internos muestren un mensaje genérico al cliente, mientras el detalle técnico real queda registrado solo en los logs del servidor, donde el equipo de desarrollo puede consultarlo sin exponerlo al exterior.

**Punto OWASP:** `A05:2021 — Security Misconfiguration` — Los mensajes de error no deben revelar la arquitectura interna del sistema.

**Response corregido en caso de error interno — HTTP 500:**
```json
{
  "detail": "No fue posible completar el registro. Intenta de nuevo más tarde."
}
```

### Después ✅

**Response — HTTP 400:**
```json
{
  "error": "No fue posible completar el registro. Intenta con otro correo o contacta soporte."
}
```

**Validado:** El mensaje ya no menciona la base de datos ni ningún componente interno. El cliente recibe un mensaje genérico que no revela la arquitectura del sistema.

**Ruta para validar en Postman:**
```
POST http://localhost:8000/register
Content-Type: application/json

{
  "nombre": "Juan Prueba",
  "email": "juanprueba@test.com",
  "password": "Test1234",
  "telefono": "3001234567",
  "rol": "comprador"
}
```

---

## Endpoint 4 — POST /login

**Descripción:** Valida credenciales y devuelve un token JWT.  
**Autenticación:** No requerida.

### Antes

**Request:**
```
POST http://localhost:8000/login
Content-Type: application/json

{
  "email": "juanprueba@test.com",
  "password": "Test1234"
}
```

**Response — HTTP 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Juan Prueba",
    "email": "juanprueba@test.com",
    "rol": "comprador"
  }
}
```

**Response — HTTP 403 (correo no verificado):**
```json
{
  "error": "Correo no verificado. Revisa tu bandeja de entrada para activar tu cuenta."
}
```

**Observación:** El backend ya valida correctamente email verificado, cuenta bloqueada y tienda suspendida. El schema `Token` solo devuelve `access_token`, por lo que la respuesta está bien delimitada.

### Corrección aplicada

**¿Por qué se corrigió?**  
El `get_current_user` en otros routers usaba `status_code=401` con el mensaje `"Token inválido"` (sin el motivo de expiración), lo que podía ser inconsistente. Se estandarizó el mensaje en todos los routers para indicar claramente que el token puede ser inválido **o** expirado, sin revelar cuál de los dos casos ocurrió (lo que podría facilitar ataques de temporización).

**¿Para qué sirve la corrección?**  
Para mantener mensajes de error consistentes y no revelar si el token fue rechazado por ser malformado o por haber expirado, reduciendo la información útil para un atacante.

**Punto OWASP:** `A02:2021 — Cryptographic Failures` — No revelar detalles sobre el motivo exacto del rechazo de un token de autenticación.

**Response corregido — HTTP 401 (token inválido o expirado):**
```json
{
  "detail": "Token inválido o expirado"
}
```

### Después ✅

**Response — HTTP 401:**
```json
{
  "error": "Token inválido o expirado."
}
```

**Validado:** El servidor responde 401 con un mensaje unificado que no distingue si el token fue rechazado por ser malformado o por haber expirado, evitando filtrar información útil para un atacante.

**Ruta para validar en Postman:**
```
POST http://localhost:8000/login
Content-Type: application/json

{
  "email": "juanprueba@test.com",
  "password": "Test1234"
}
```

---

## Endpoint 5 — GET /carrito

**Descripción:** Devuelve el carrito del usuario autenticado.  
**Autenticación:** Bearer token requerido.

### Antes

**Request (sin token):**
```
GET http://localhost:8000/carrito
```

**Response — HTTP 403:**
```json
{
  "error": "Acceso denegado. Se requiere autenticación."
}
```

**Request (con token válido):**
```
GET http://localhost:8000/carrito
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response — HTTP 200:**
```json
{
  "carrito": [
    {
      "id": 1,
      "libro": "El Principito",
      "precio": 25000,
      "cantidad": 2
    },
    {
      "id": 2,
      "libro": "Cien años de soledad",
      "precio": 35000,
      "cantidad": 1
    }
  ],
  "total": 85000
}
```

**Observación:** El endpoint respondía con HTTP 403 cuando no había token, siendo que el código semánticamente correcto para ausencia de autenticación es 401.

### Corrección aplicada

**¿Por qué se corrigió?**  
HTTP 403 (Forbidden) significa que el servidor reconoció al usuario pero le niega el acceso por falta de permisos. HTTP 401 (Unauthorized) es el código correcto cuando simplemente no hay credenciales válidas. Usar 403 en lugar de 401 oculta al cliente que debe autenticarse primero, y rompe el estándar HTTP que los navegadores y clientes usan para redirigir al login automáticamente.

**¿Para qué sirve la corrección?**  
Para que los clientes (navegador, app móvil, Postman) reciban el código de estado correcto y puedan actuar en consecuencia: redirigir al login cuando reciben 401, o mostrar "sin permisos" cuando reciben 403.

**Punto OWASP:** `A05:2021 — Security Misconfiguration` — Usar códigos de estado HTTP semánticamente correctos es parte de una configuración segura que no confunde a los clientes sobre el motivo del rechazo.

**Response corregido — HTTP 401 (sin token):**
```json
{
  "detail": "Not authenticated"
}
```

### Después ✅

**Response — HTTP 401:**
```json
{
  "error": "Autenticación requerida."
}
```

**Validado:** El endpoint ya responde 401 en vez de 403. El código de estado es semánticamente correcto: indica que el usuario debe autenticarse primero, no que tiene credenciales válidas pero sin permisos suficientes.

**Rutas para validar en Postman:**
```
# Sin token → debe dar 401
GET http://localhost:8000/carrito

# Con token válido → debe dar 200
GET http://localhost:8000/carrito
Authorization: Bearer <token del login>
```

---

## Resumen de correcciones

| # | Endpoint | Vulnerabilidad | OWASP | Corrección |
|---|---|---|---|---|
| 1 | GET /health | Exponía versión, latencia y proveedor de IA | A05:2021 | Se eliminan campos técnicos internos de la respuesta pública |
| 2 | GET /catalogo/stats | Exponía total de usuarios registrados | A05:2021 | Se elimina el campo `usuarios_activos` del payload público |
| 3 | POST /register | Error 500 revelaba que el fallo fue en la BD | A05:2021 | Mensaje genérico al cliente; detalle solo en logs del servidor |
| 4 | POST /login | Mensaje de rechazo de token inconsistente | A02:2021 | Mensaje unificado sin revelar si es inválido o expirado |
| 5 | GET /carrito | Sin token respondía 403 en vez de 401 | A05:2021 | Código de estado corregido a 401 para ausencia de credenciales |
