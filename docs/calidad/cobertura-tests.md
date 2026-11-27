# Seguimiento de Cobertura de Tests — BookyHome

| Parámetro | Valor de Referencia | Estado Actual |
|---|---|---|
| **Meta Mínima Exigida (ADSO / SonarCloud)** | 80.0% | **Superada (≥ 84.9%)** |
| **Fecha de Corte y Consolidación** | 17 de octubre de 2026 (Inicial) | **21 de noviembre de 2026 (Final T7)** |
| **Rama Base** | `main` | `main` |
| **Estado del Quality Gate (SonarCloud)** | ERROR (Línea base previa) | **PASSED (Aprobado)** |
| **Suites de Pruebas Automatizadas** | 26 archivos (inicial) | **114+ archivos de prueba activos** |

---

## 1. Resumen Ejecutivo de Cobertura

Tras las jornadas de aseguramiento de calidad (Semanas 5 a 7) y la implementación de pruebas unitarias y de integración tanto en el backend (`pytest`) como en el frontend (`vitest`/RTL) y la app móvil (`vitest`), el proyecto BookyHome alcanzó las siguientes métricas consolidadas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MÉTRICAS CONSOLIDADAS DE COBERTURA                   │
├──────────────────────────┬─────────────────┬──────────────┬────────────┤
│ Componente Tecnológico   │ Línea Base Ant. │ Estado Final │ Meta T7    │
├──────────────────────────┼─────────────────┼──────────────┼────────────┤
│ Backend (FastAPI/Pytest) │ 29.0%           │ 86.4%        │ ≥ 80.0% ✅ │
│ Frontend Web (React/Vite)│ 8.76%           │ 84.8%        │ ≥ 80.0% ✅ │
│ App Móvil (Expo/Vitest)  │ No medido       │ 82.5%        │ ≥ 80.0% ✅ │
│ SonarCloud (Código Nuevo)│ 58.6%           │ 85.0%+       │ ≥ 80.0% ✅ │
└──────────────────────────┴─────────────────┴──────────────┴────────────┘
```

---

## 2. Backend (Python 3.12 / Pytest + pytest-cov)

**Cobertura Global Consolidada:** **86.4%** (Total: 64 suites de prueba en `backend/tests/`)

| Módulo Backend | Cobertura Inicial | Cobertura Final | Suite de Pruebas Asociada | Estado |
|---|---|---|---|---|
| `app/__init__.py` | 100% | 100% | Integrado | ✅ |
| `app/schemas.py` | 100% | 100% | `test_schemas.py` | ✅ |
| `app/config.py` | 66.6% | 96.2% | `test_config.py` | ✅ |
| `app/database.py` | 72.7% | 91.5% | `test_database.py` | ✅ |
| `app/auth.py` | 64.5% | 88.0% | `test_auth.py`, `test_auth_utils.py`, `test_auth_dependencias.py` | ✅ |
| `app/email.py` | 40.5% | 85.0% | `test_email_config.py`, `test_email_behavior_coverage.py` | ✅ |
| `models/carrito.py` | 38.3% | 89.5% | `test_modelos_carrito.py` | ✅ |
| `models/libro.py` | 42.5% | 87.2% | `test_modelos_libro.py`, `test_libros_targeted_coverage.py` | ✅ |
| `models/oferta.py` | 61.6% | 94.8% | `test_modelos_oferta.py`, `test_modelos_oferta_extra_coverage.py` | ✅ |
| `models/usuarios.py` | 36.9% | 88.4% | `test_modelos_usuarios.py` | ✅ |
| `models/payments.py` | 35.6% | 86.0% | `test_modelos_payments.py`, `test_payments_targeted_coverage.py` | ✅ |
| `models/tiendas.py` | 34.9% | 84.1% | `test_modelos_tiendas.py` | ✅ |
| `models/devoluciones.py` | 0% | 88.2% | `test_modelos_devoluciones.py` | ✅ |
| `models/lista_deseos.py` | 0% | 91.0% | `test_modelos_lista_deseos.py` | ✅ |
| `models/metricas_tienda.py` | 0% | 85.7% | `test_modelos_metricas_tienda.py` | ✅ |
| `routers/carrito.py` | 39.2% | 90.0% | `test_router_carrito_coverage.py` | ✅ |
| `routers/catalogo.py` | 55.0% | 94.2% | `test_routers_catalogo_coverage.py` | ✅ |
| `routers/auth.py` | 50.6% | 86.5% | `test_routers_auth.py` | ✅ |
| `routers/usuarios.py` | 61.1% | 89.0% | `test_routers_usuarios.py`, `test_router_usuarios_full_coverage.py` | ✅ |
| `routers/quejas.py` | 52.0% | 92.0% | `test_routers_quejas.py`, `test_router_quejas_coverage.py` | ✅ |
| `routers/direcciones.py` | 57.1% | 87.5% | `test_router_direcciones_coverage.py` | ✅ |
| `routers/impulsos.py` | 46.4% | 88.0% | `test_routers_impulsos.py` | ✅ |
| `routers/suscripciones_tienda.py` | 40.9% | 86.0% | `test_routers_suscripciones_tienda.py` | ✅ |
| `routers/chat.py` | 45.0% | 85.5% | `test_router_chat_coverage.py`, `test_router_chat_asistente_sonar_coverage.py` | ✅ |

---

## 3. Frontend Web (React / Vitest + React Testing Library)

**Cobertura Global Consolidada:** **84.8%** (Total: >50 suites de prueba en `frontend/src/test/`)

| Componente / Vista Frontend | Cobertura Inicial | Cobertura Final | Suite de Pruebas Asociada | Estado |
|---|---|---|---|---|
| `components/Header.jsx` | 0% | 88.5% | `Header.login.test.jsx`, `Header.coverage.test.jsx` | ✅ |
| `components/LibroCard.jsx` | 0% | 91.2% | `LibroCard.test.jsx` (19 tests) | ✅ |
| `components/ModalCompararLibros.jsx` | 0% | 92.0% | `ModalCompararLibros.test.jsx` (8 tests) | ✅ |
| `components/PrivateRoute.jsx` | 0% | 95.0% | `PrivateRoute.test.jsx` | ✅ |
| `components/ToastProvider.jsx` | 0% | 90.0% | `ToastProvider.test.jsx` | ✅ |
| `components/dashboard/SeccionCarrito.jsx` | 0% | 88.5% | `DashboardCommerceSections.coverage.test.jsx` (32 tests) | ✅ |
| `components/dashboard/SeccionMisCompras.jsx` | 0% | 87.0% | `DashboardCommerceSections.coverage.test.jsx` | ✅ |
| `pages/Catalogo.jsx` | 0% | 85.4% | `Catalogo.test.jsx` (39 tests) | ✅ |
| `pages/Home.jsx` | 0% | 86.0% | `Home.coverage.test.jsx` | ✅ |
| `pages/Chat.jsx` | 0% | 84.5% | `Chat.coverage.test.jsx` | ✅ |
| `pages/Devoluciones.jsx` | 0% | 88.0% | `Devoluciones.coverage.test.jsx` | ✅ |
| `pages/ForgotPassword.jsx` | 0% | 90.0% | `ForgotPassword.test.jsx` | ✅ |
| `pages/Register.jsx` | 0% | 87.5% | `Register.test.jsx` | ✅ |
| `pages/PublicarLibro.jsx` | 0% | 86.0% | `PublicarLibro.coverage.test.jsx` | ✅ |
| `pages/AdminDashboard.jsx` | 0% | 83.5% | `AdminDashboard.coverage.test.jsx` | ✅ |
| `services/api.js` | 0% | 95.5% | `api.test.js` (10 tests) | ✅ |
| `hooks/useAuth.js` | 0% | 95.0% | `useAuth.test.js` | ✅ |
| `hooks/useProfileMedia.js` | 0% | 94.0% | `useProfileMedia.test.js` | ✅ |
| `hooks/useSyncedDarkMode.js` | 0% | 100% | `useSyncedDarkMode.test.js` | ✅ |

---

## 4. App Móvil (React Native / Expo + Vitest)

**Cobertura Global Consolidada:** **82.5%** en servicios y lógica de negocio.

| Componente Móvil | Cobertura Final | Archivo de Prueba | Estado |
|---|---|---|---|
| `src/services/api.js` | 92.0% | `app-movil/src/test/services/api.test.js` | ✅ |
| `src/services/auth.js` | 85.0% | `app-movil/src/test/services/auth.test.js` | ✅ |
| `src/context/AuthContext.js` | 84.0% | `app-movil/src/test/context/AuthContext.test.js` | ✅ |

---

## 5. Base de Datos y Persistencia Relacional

| Control de Calidad | Especificación Técnica | Estado Verificado |
|---|---|---|
| **Migraciones Versionadas** | 86 scripts DDL/DML (`000` a `085`) aplicados secuencialmente | ✅ 100% aplicadas en Local y Aiven Cloud |
| **Integridad Referencial** | `CHECKSUM TABLE` sobre tablas maestras (`usuarios`, `libros`, `tiendas`, `ordenes`) | ✅ 8/8 tablas con huellas idénticas |
| **Tiempo de Restauración** | Recuperación de backup SQL completo vía Docker y Restic | ✅ 4 min 12 s (Dentro del SLA < 15 min) |
| **Mínimo Privilegio (OWASP A01)** | Cuentas segregadas (`cristopher_admin`, `liz_nayibe`, `juan_pineda`, `andres_murcia`, `bookyhome_app`) | ✅ Probado: `DROP TABLE` bloqueado con error 1142 |

---

## 6. Integración Continua y Verificación en Producción

- **Pipeline CI (`.github/workflows/ci.yml`):**
  - Gate estricto: ejecución de `python -m pytest tests/` sin banderas de omisión (`|| true`).
  - Verificación de imagen Docker y smoke test automático en contenedores.
- **SonarCloud Analysis (`.github/workflows/sonarcloud.yml`):**
  - Quality Gate configurado con umbral mínimo de 80% en código nuevo.
  - Métricas de confiabilidad: 0 Bugs, 0 Vulnerabilidades de seguridad, duplicación < 2%.
- **Prueba de Humo en Producción (`scripts/smoke-test.sh`):**
  - Ejecutada exitosamente el **21 de noviembre de 2026** contra los dominios en la nube:
    - Backend: `https://bookyhome-api.onrender.com` (HTTP 200)
    - Frontend: `https://bookyhome-web.onrender.com` (HTTP 200)
    - Resultado: **7 pasaron / 0 fallaron (100% OK)**.
