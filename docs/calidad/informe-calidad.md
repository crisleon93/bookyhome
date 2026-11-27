# Informe Final de Verificación de Calidad — BookyHome

**Proyecto:** BookyHome — Plataforma Web y Móvil de Comercio de Libros  
**Ficha SENA ADSO:** 3171618  
**Versión:** 1.0.0 (Entrega Final)  
**Fecha de cierre:** Noviembre 2026  
**Responsables:** Cristopher León · Liz Nayibe · Juan Pineda · Andrés Murcia  

---

## 1. Resumen Ejecutivo

| Indicador | Resultado |
|---|---|
| Quality Gate SonarCloud | ✅ **PASSED** |
| Cobertura código nuevo (SonarCloud) | ✅ **85%+** (meta: ≥ 80%) |
| Bugs reportados por SonarCloud | ✅ **0** |
| Vulnerabilidades de seguridad | ✅ **0** |
| Duplicación de código | ✅ **1.7%** (umbral aceptable: < 5%) |
| Suites de prueba activas | ✅ **114+ archivos** |
| Defectos críticos pendientes | ✅ **0** |
| Defectos menores pendientes | 🟡 **3** (documentados, aceptados) |

---

## 2. Alcance de las Pruebas

Las pruebas se ejecutaron sobre tres componentes del sistema:

| Componente | Tecnología | Herramienta | Cobertura Final |
|---|---|---|---|
| Backend API | FastAPI / Python 3.12 | Pytest + pytest-cov | **86.4%** |
| Frontend Web | React / Vite | Vitest + RTL | **84.8%** |
| App Móvil | Expo / React Native | Vitest | **82.5%** |
| Análisis estático global | Todos | SonarCloud | **85%+ código nuevo** |

---

## 3. Tipos de Pruebas Ejecutadas

| Tipo | Descripción | Resultado |
|---|---|---|
| **Pruebas unitarias** | Funciones puras, modelos, hooks y servicios aislados | ✅ Ejecutadas |
| **Pruebas de integración** | Endpoints FastAPI con BD mockeada | ✅ Ejecutadas |
| **Prueba de humo (smoke test)** | `scripts/smoke-test.sh` contra URLs de producción | ✅ 7/7 PASS |
| **Análisis estático** | SonarCloud: bugs, vulnerabilidades, code smells | ✅ Quality Gate verde |
| **Pruebas de seguridad (OWASP)** | Auth, inyección SQL, CORS, mínimo privilegio BD | ✅ Implementado |
| **Pruebas E2E** | Playwright: login, carrito→checkout, publicación | ✅ 3 flujos críticos |

---

## 4. Tabla de Defectos — Resueltos

| ID | Severidad | Componente | Descripción | Estado | Commit de cierre |
|---|---|---|---|---|---|
| **D-001** | Alta | Backend | 58 sentencias `print()` en código productivo sin nivel de log | ✅ Resuelto | `3627559f` |
| **D-002** | Alta | Frontend/Móvil | 27 `console.log()` en código desplegado | ✅ Resuelto | Anterior a corte |
| **D-003** | Alta | Base de datos | Acceso con credenciales homogéneas sin segregación de roles | ✅ Resuelto | Migración `000_usuarios_y_privilegios_equipo.sql` |
| **D-004** | Alta | CI/CD | Quality Gate en ERROR — cobertura código nuevo < 60% | ✅ Resuelto | `db332c98` → 85%+ |
| **D-005** | Media | Repositorio | Archivos duplicados y temporales en raíz del proyecto | ✅ Resuelto | `c4f1bd67` |
| **D-006** | Media | Backend | 5 archivos JSON de runtime versionados en git (`app/data/`) | ✅ Resuelto | `bc02b913` |
| **D-007** | Media | Seguridad | 7 issues SonarCloud: SSRF, accesibilidad, promesas sin manejar | ✅ Resuelto | `913d18ec` |
| **D-008** | Media | Despliegue | Puerto frontend fijo (8000) incompatible con Render | ✅ Resuelto | `7a3e8e03` |
| **D-009** | Baja | Backend | CVE en dependencias de `react-native-webview` | ✅ Resuelto | `c0232e51` |
| **D-010** | Baja | Docs | `cobertura-tests.md` indicaba 29% cuando Sonar reportaba 58.6% | ✅ Resuelto | `d3e459d6` |

---

## 5. Tabla de Defectos — Pendientes Aceptados

Los siguientes defectos fueron identificados, analizados y aceptados como pendientes con justificación técnica. No bloquean la entrega.

| ID | Severidad | Componente | Descripción | Justificación de aceptación |
|---|---|---|---|---|
| **P-001** | Baja | Backend | ACT-04 logging al 75%: algunos `print()` de arranque en `config.py` | Son mensajes de fallo temprano antes de que el logger esté disponible. Se ejecutan en `sys.stderr` antes de `sys.exit(1)`. Comportamiento técnicamente correcto. |
| **P-002** | Baja | RNF | Prueba de carga formal con usuarios concurrentes no ejecutada | El entorno de producción (Render Free Tier) tiene limitaciones de CPU que distorsionarían resultados. Se midieron tiempos de respuesta individuales (catálogo: 326 ms, búsqueda: 77 ms). |
| **P-003** | Baja | RNF | Prueba de compatibilidad en matriz de navegadores y dispositivos no formalizada | Sistema probado manualmente en Chrome, Firefox y dispositivos Android/iOS durante el desarrollo. No se documentó en matriz formal por tiempo. |

---

## 6. Verificación de Requisitos No Funcionales

| RNF | Atributo | Estado | Evidencia |
|---|---|---|---|
| RNF-001 | Seguridad de datos | 🟡 Parcial avanzado | bcrypt, JWT 24h, HTTPS en prod, CORS restringido, secrets en variables de entorno |
| RNF-002 | Seguridad de accesos | ✅ Cumple | JWT + `require_role`, verificación de correo, bloqueo de usuarios inactivos |
| RNF-003 | Rendimiento | 🟡 Parcial | Catálogo: 326 ms · Búsqueda: 77 ms · Frontend: 171 ms (todos < 1 s localmente) |
| RNF-004 | Escalabilidad | 🟡 Parcial | Docker Compose + servicios separados. Sin load balancer (fuera de alcance) |
| RNF-005 | Alta disponibilidad | 🟡 Parcial | Healthcheck activo, reinicio automático de contenedores, Aiven con SLA |
| RNF-006 | Mantenibilidad | ✅ Cumple | Módulos separados, logging estructurado, 86 migraciones versionadas, CI/CD |
| RNF-007 | Compatibilidad | 🟡 Parcial | Responsive web + app móvil Expo. Sin matriz formal de dispositivos |
| RNF-008 | Usabilidad | ✅ Cumple | Navegación por roles, mensajes de error, estados de carga, FAQ documentada |
| RNF-009 | Conformidad legal | 🟡 Parcial | Política de privacidad, términos y consentimiento implementados en interfaz |
| RNF-010 | Tiempo de respuesta | ✅ Cumple | Todos los endpoints medidos < 400 ms. Health check en producción: 1025 ms (BD remota) |
| RNF-011 | Recuperación | ✅ Cumple | Backup diario Restic, retención 30 días, restauración probada (75 objetos, 4 min 12 s) |
| RNF-012 | Eficiencia de recursos | 🟡 Parcial | Frontend: 7.31% CPU / 144.9 MiB · Backend: 8.76% CPU / 121.1 MiB (medición puntual) |

---

## 7. Resultados del Pipeline CI/CD

El pipeline de GitHub Actions ejecuta automáticamente en cada push y PR a `main`:

| Paso | Herramienta | Resultado |
|---|---|---|
| Prueba de humo en contenedores | Docker Compose + `smoke-test.sh` | ✅ Verde |
| Pruebas backend | Pytest (64 suites) | ✅ Verde |
| Análisis estático y cobertura | SonarCloud | ✅ Quality Gate PASSED |
| Cobertura frontend/móvil | Vitest + lcov | ✅ 84.8% / 82.5% |

**URL de producción verificada el 21 de noviembre de 2026:**
- Frontend: `https://bookyhome-web.onrender.com` → HTTP 200
- Backend: `https://bookyhome-api.onrender.com/health` → `{"status":"ok","database":{"status":"ok"}}`

---

## 8. Conclusión

El sistema BookyHome supera todos los umbrales de calidad exigidos para la entrega final SENA ADSO. El Quality Gate de SonarCloud está en estado **PASSED**, la cobertura de código nuevo supera el **85%**, no existen bugs ni vulnerabilidades reportados, y los defectos identificados durante el proceso fueron resueltos en su totalidad a excepción de tres ítems de severidad baja aceptados con justificación técnica.

La plataforma está desplegada y accesible públicamente, con base de datos en producción activa (380k+ registros), pipeline CI/CD funcional y documentación completa de pruebas, despliegue y mantenimiento.

---

*Informe generado por el equipo BookyHome — Ficha 3171618 — Noviembre 2026*
