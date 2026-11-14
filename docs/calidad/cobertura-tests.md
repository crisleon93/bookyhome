# Seguimiento de Cobertura de Tests — BookyHome

| Campo | Valor |
|---|---|
| Meta mínima | 80% |
| Rama de trabajo | `cobertura/backend-80` |
| Última actualización | 2026-10-17 |

---

## Backend (Python / pytest)

**Cobertura global:** 29% → en progreso

| Archivo | Cobertura antes | Cobertura esperada | Archivo de test | Estado |
|---|---|---|---|---|
| `app/__init__.py` | 100% | 100% | — | ✅ |
| `app/schemas.py` | 100% | 100% | `test_schemas.py` | ✅ |
| `app/main.py` | 94.5% | 94.5% | — | ✅ |
| `routers/quejas_patch.py` | 100% | 100% | — | ✅ |
| `app/config.py` | 66.6% | ~95% | `test_config.py` | ✅ Cubierto |
| `app/auth.py` | 64.5% | ~85% | `test_auth.py` + `test_auth_utils.py` + `test_auth_dependencias.py` | ✅ Cubierto |
| `app/database.py` | 72.7% | ~88% | `test_database.py` | ✅ Cubierto |
| `models/oferta.py` | 61.6% | ~95% | `test_modelos_oferta.py` | ✅ Cubierto |
| `routers/usuarios.py` | 61.1% | ~90% | `test_routers_usuarios.py` | ✅ Cubierto |
| `routers/auth.py` | 50.6% | ~85% | `test_routers_auth.py` | 🔄 Pendiente |
| `app/email.py` | 40.5% | ~80% | `test_email_config.py` | 🔄 Pendiente |
| `models/usuarios.py` | 36.9% | ~80% | `test_modelos_usuarios.py` | 🔄 Pendiente |
| `models/payments.py` | 35.6% | ~80% | `test_modelos_payments.py` | 🔄 Pendiente |
| `models/tiendas.py` | 34.9% | ~80% | `test_modelos_tiendas.py` | 🔄 Pendiente |
| `models/carrito.py` | 38.3% | ~80% | `test_modelos_carrito.py` | 🔄 Pendiente |
| `models/libro.py` | 42.5% | ~80% | `test_modelos_libro.py` | 🔄 Pendiente |
| `routers/direcciones.py` | 57.1% | ~80% | — | 🔄 Pendiente |
| `routers/impulsos.py` | 46.4% | ~80% | — | 🔄 Pendiente |
| `routers/suscripciones_tienda.py` | 40.9% | ~80% | — | 🔄 Pendiente |
| `routers/carrito.py` | 39.2% | ~80% | — | 🔄 Pendiente |
| `models/devoluciones.py` | 0% | — | — | ⏸ Omitido |
| `models/lista_deseos.py` | 0% | — | — | ⏸ Omitido |
| `models/metricas_tienda.py` | 0% | — | — | ⏸ Omitido |

---

## Frontend (React / Vitest)

**Cobertura global:** 8.76% → pendiente

| Archivo | Cobertura antes | Cobertura esperada | Archivo de test | Estado |
|---|---|---|---|---|
| `components/Header.jsx` | — | ~80% | `test/components/Header.login.test.jsx` | 🔄 Pendiente |
| `components/LibroCard.jsx` | — | ~80% | `test/components/LibroCard.test.jsx` | 🔄 Pendiente |
| `components/PrivateRoute.jsx` | — | ~80% | `test/components/PrivateRoute.test.jsx` | 🔄 Pendiente |
| `components/SeccionOfertas.jsx` | — | ~80% | `test/components/SeccionOfertas.auditoria.test.jsx` | 🔄 Pendiente |
| `hooks/useAuth.js` | — | ~80% | `test/hooks/useAuth.test.js` | 🔄 Pendiente |
| `pages/AdminDashboard.jsx` | — | ~80% | `test/pages/AdminDashboard.test.jsx` | 🔄 Pendiente |
| `pages/Catalogo.jsx` | — | ~80% | `test/pages/Catalogo.test.jsx` | 🔄 Pendiente |
| `pages/ForgotPassword.jsx` | — | ~80% | `test/pages/ForgotPassword.test.jsx` | 🔄 Pendiente |
| `pages/PublicarLibro.jsx` | — | ~80% | `test/pages/PublicarLibro.test.jsx` | 🔄 Pendiente |
| `pages/Register.jsx` | — | ~80% | `test/pages/Register.test.jsx` | 🔄 Pendiente |
| `utils/toastProvider.jsx` | — | ~80% | `test/utils/toastProvider.test.jsx` | 🔄 Pendiente |

---

## App Móvil (React Native / Vitest)

**Cobertura global:** pendiente de medir

| Archivo | Cobertura antes | Cobertura esperada | Archivo de test | Estado |
|---|---|---|---|---|
| `src/services/api.js` | — | ~80% | `src/test/services/api.test.js` | 🔄 Pendiente |

---

## Base de datos (SQL / migraciones)

| Elemento | Descripción | Estado |
|---|---|---|
| 84 migraciones (`000` → `084`) | Scripts DDL/DML aplicados en orden | ✅ Aplicadas |
| `bookyhome.sql` | Volcado completo de la BD | ✅ Existente |
| Verificación de integridad | `CHECKSUM TABLE` 8/8 tablas | ✅ Verificado (semana 5) |
| Restauración probada | 4 min 12 s, 8/8 huellas idénticas | ✅ Probada (semana 6) |

---

## Resumen global

| Componente | Tests existentes | Archivos cubiertos ≥80% | Estado |
|---|---|---|---|
| Backend | 15 archivos de test | 5 archivos nuevos cubiertos | 🔄 En progreso |
| Frontend | 11 archivos de test | 0 medidos | 🔄 Pendiente |
| App móvil | 1 archivo de test | 0 medidos | 🔄 Pendiente |
| Base de datos | Migraciones + restauración | ✅ | ✅ Completo |
