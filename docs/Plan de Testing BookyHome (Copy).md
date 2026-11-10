bookyhome · plan de testing

# De 0% a 80% de cobertura antes de la última semana de noviembre

Línea base levantada el 7 de octubre de 2026 sobre el estado real del repositorio (backend FastAPI + frontend React/Vite). Estándar objetivo tomado de bc-testing-adso (cobertura y pirámide de pruebas) y bc-implantacion (pipeline CI/CD, CE-5).

Inicio: **2026-10-07** Objetivo: **antes de 2026-11-23** (última semana de nov.) Duración: **7 semanas** Meta de cobertura: **80% lógica de negocio**

0%

cobertura actual

0

archivos de test

12

routers backend sin probar

33

componentes jsx sin probar

0

workflows CI (.github)

## 01 Línea base — qué hay hoy

Sin herramientas de testing instaladas en ninguna capa: backend/requirements.txt no trae pytest; frontend/package.json no trae vitest ni @testing-library/react. No existe carpeta tests/ ni workflow en .github/. Cobertura real: **0%** en ambas capas.

Backend

FastAPI · 12 routers · 7 modelos · MySQL (mysql-connector)

Frontend

React 19 + Vite · 17 páginas · 33 componentes

CI/CD

Inexistente — ningún gate de cobertura posible hoy

## 02 Estándar exigido (bc-testing-adso / bc-implantacion)

Umbral

80% en lógica de negocio, nunca baja una vez alcanzado, exigido en CI

Patrón

AAA (Arrange-Act-Assert) en unitarias

Backend

pytest + TestClient

Frontend

Vitest + React Testing Library (perspectiva de usuario)

E2E

Playwright sobre flujos críticos

Integración

Contra BD real (MySQL) en Docker, no mocks

CI (CE-5)

GitHub Actions rechaza PR bajo el umbral

Entregable final

Informe de estrategia de testing

## 03 Huecos de validación encontrados (front/back)

| Ubicación | Problema | Riesgo |
| --- | --- | --- |
| backend/app/schemas.py:9-14 backend | UsuarioRegistro sin Field(): password y teléfono aceptan cualquier string. | Backend no replica las reglas del frontend (password ≥8, teléfono ^\\d{7,15}$) — un cliente distinto al SPA (Postman, móvil) puede registrar passwords vacíos. |
| backend/app/routers/auth.py:13-29 backend | forgot-password recibe dict crudo, no un schema Pydantic. | Sin tipado ni validación automática de forma; errores se detectan tarde, en tiempo de ejecución. |
| backend/app/routers/auth.py:33-45 backend | reset-password no valida longitud/fuerza de nueva_password antes de guardarla. | Se puede resetear a una contraseña de 1 carácter. |
| backend/app/schemas.py:83-87 backend | PagoRequest.amount sin gt=0; payment_method sin lista blanca. | Monto negativo o método de pago arbitrario llega a registrar_pago. |
| frontend/src/pages/Login.jsx, Register.jsx frontend | Única validación client-side real del proyecto; el resto de formularios (perfil, libros, ofertas) no se revisó aún en detalle. | Cobertura de validación desigual entre páginas — se audita página por página en semana 4. |

## 04 Ruta semana a semana

**Sem. 1**oct 7–13

### Montaje de herramientas setup

- Backend: agregar pytest, pytest-cov, httpx a requirements; conftest.py con fixture de TestClient y BD de prueba.
- Frontend: agregar vitest, @testing-library/react, jsdom, @vitest/coverage-v8; config en vite.config.js.
- Correr cobertura inicial (0%) para dejar número de partida documentado.

**Sem. 2**oct 14–20

### Unitarias backend — modelos unit

- AAA sobre models/usuarios.py, libro.py, carrito.py, payments.py, tiendas.py, oferta.py.
- Mock de la capa database.py para aislar lógica de negocio de la conexión MySQL real.

**Sem. 3**oct 21–27

### API backend + cierre de huecos de validación api

- TestClient sobre los 12 routers: estados HTTP, payloads inválidos, errores esperados.
- Corregir los 4 huecos de la sección 03: Field(min_length=8) en password, pattern en teléfono, schemas Pydantic en auth.py, gt=0 + whitelist en PagoRequest.
- Test de regresión para cada corrección (caso que fallaba antes, pasa después).

**Sem. 4**oct 28–nov 3

### Componentes frontend component

- RTL desde perspectiva de usuario: Login, Register, catálogo, carrito, checkout, dashboard admin/vendedor.
- Auditar validación client-side del resto de formularios (perfil, publicar libro, ofertas) y nivelar con lo hallado en sem. 3.

**Sem. 5**nov 4–10

### Integración contra BD real integration

- Servicio MySQL de prueba en docker-compose dedicado a CI/test.
- Suite de integración: flujo registro→login→publicar libro→comprar→pago contra BD real, sin mocks.
- Cerrar huecos de cobertura restantes en routers/modelos de menor prioridad.

**Sem. 6**nov 11–17

### E2E con Playwright e2e

- Flujos críticos: comprador (registro, compra, pago) y vendedor (publicar libro, gestionar ofertas, ocultar libro).
- Correr contra build de frontend + backend levantados vía docker-compose.

**Sem. 7**nov 18–24

### Gate de CI + cierre ci-gate

- Workflow en .github/workflows/: corre pytest+vitest, falla el PR si cobertura \< 80% en lógica de negocio.
- Empuje final de cobertura en los puntos que falten para llegar a 80%.
- Informe de estrategia de testing (entregable del estándar).
- Colchón de 1 semana antes del cierre de noviembre para imprevistos.

Fuentes del estándar: github.com/ergrato-dev/bc-testing-adso · github.com/ergrato-dev/bc-implantacion (CE-5) — líneas de código referenciadas corresponden al estado del repo bookyhome al 2026-10-07.