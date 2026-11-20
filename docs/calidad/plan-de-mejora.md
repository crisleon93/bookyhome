# Plan de Mejora Continua de la Calidad — BookyHome

**Proyecto:** BookyHome — Plataforma Web y Móvil de Comercio de Libros  
**Ficha SENA ADSO:** 3171618  
**Dimensión Instrumento T7:** D3 — Aseguramiento de la Calidad (Criterio 11)  
**Marco Metodológico:** PSP / CMMI-DEV y Ciclo PDCA (*Plan-Do-Check-Act*)  
**Fecha de Emisión:** Noviembre 2026  
**Responsables:** Cristopher León (Líder / DBA), Liz Nayibe, Juan Pineda, Andrés Murcia  

---

## 1. Introducción y Justificación

El presente Plan de Mejora Continua formaliza las acciones correctivas, preventivas y de optimización técnica derivadas de las revisiones de código estático (SonarCloud), las pruebas dinámicas (Pytest y Vitest), los análisis de seguridad aplicativa (OWASP Top 10) y la auditoría de arquitectura del proyecto BookyHome.

El objetivo es asegurar el cumplimiento estricto del umbral del **80% de cobertura de código**, garantizar la estabilidad en el pipeline de Integración Continua (CI/CD) y mitigar riesgos de seguridad e inyección antes de la sustentación final y el paso a etapa productiva.

---

## 2. Diagnóstico Inicial y Hallazgos de Calidad (Línea Base)

A partir del informe de feedback del Instrumento T7 y la auditoría estática del repositorio, se identificaron los siguientes hallazgos:

1. **Hallazgo H-01 (Cobertura de Código en SonarCloud):**  
   Varios componentes y páginas nuevas de la interfaz web y móvil carecían de cobertura unitaria, lo que ponía en riesgo el Quality Gate del proyecto. Se requería alcanzar un umbral mínimo del 80% en código nuevo.
2. **Hallazgo H-02 (Seguridad en Base de Datos y Principio de Mínimo Privilegio - OWASP A01/A03):**  
   El acceso a MySQL se realizaba inicialmente con credenciales homogéneas sin segregación de roles entre el administrador, los desarrolladores y la API en producción.
3. **Hallazgo H-03 (Higiene de Código y Trazabilidad en Producción):**  
   Existencia de sentencias `console.log()` en el frontend web/móvil y `print()` directos en el backend en lugar de logging estructurado por niveles (`INFO`, `WARNING`, `ERROR`).
4. **Hallazgo H-04 (Organización y Limpieza del Repositorio):**  
   Presencia de archivos duplicados o temporales en la raíz (`autenticacion.md`, `registro.md`, `reportes.md`, copias de testing), afectando la calificación del Criterio D4.

---

## 3. Matriz de Acciones de Mejora

Se establecen cuatro acciones de mejora prioritarias, con trazabilidad directa a los hallazgos diagnosticados:

| ID Acción | Acción de Mejora | Hallazgo Asociado | Meta Objetivo | Estado Actual | Evidencia y Resultado |
|---|---|---|---|---|---|
| **ACT-01** | **Ampliación de Cobertura de Pruebas Unitarias en SonarCloud** | H-01 | Cobertura en código nuevo ≥ 80% | **IMPLEMENTADA (100%)** | Cobertura alcanzada: **82.0%** en SonarCloud. 14 módulos frontend/móvil/backend cubiertos con Vitest y Pytest. |
| **ACT-02** | **Segregación de Roles y Mínimo Privilegio en Base de Datos (OWASP)** | H-02 | Separar cuentas DBA, desarrolladores y servicio API | **IMPLEMENTADA (100%)** | Migración `000_usuarios_y_privilegios_equipo.sql` ejecutada. Comprobado bloqueo `ERROR 1142: DROP command denied` en MySQL Workbench. |
| **ACT-03** | **Depuración y Estandarización de la Raíz del Repositorio** | H-04 | 0 archivos temporales o notas sueltas en raíz | **IMPLEMENTADA (100%)** | Notas migradas a `docs/modulos/`, duplicados eliminados y plan de pruebas formalizado en `docs/calidad/`. |
| **ACT-04** | **Reemplazo Progresivo de Logs a Consola por Módulo `logging`** | H-03 | Sustituir `print()` y `console.log()` por logger estructurado | **EN CURSO (75%)** | Módulo de logging centralizado implementado en backend; sanitización de salidas en routers críticos. |

---

## 4. Detalle de las Acciones Implementadas

### Acción ACT-01: Aumento de Cobertura en SonarCloud al 82%
- **Problema:** Módulos críticos como `Chat.jsx`, `Libreria.jsx`, `PublicarLibro.jsx`, `ListaDeseos.jsx`, `AdminDashboard.jsx`, `MiTienda.jsx`, `BarcodeScanner.jsx` y `database.py` requerían pruebas unitarias para validar ramas lógicas y flujos de error.
- **Implementación:** Se construyeron suites de pruebas simulando interacciones de usuario, respuestas mockeadas de la API REST y eventos de escaneo.
- **Resultado:** **82% de cobertura de código nuevo en SonarCloud**, superando la meta fijada del 80% y garantizando un Quality Gate verde.

### Acción ACT-02: Implementación de Mínimo Privilegio y Seguridad de BD
- **Problema:** El uso indiscriminado de la cuenta `root` o roles con permisos DDL en la aplicación exponía la base de datos a destrucción ante inyecciones SQL.
- **Implementación:** Se diseñó e implementó la migración `database/migrations/000_usuarios_y_privilegios_equipo.sql`:
  - `cristopher_admin`: Rol DBA con `ALL PRIVILEGES` y `GRANT OPTION`.
  - `liz_nayibe`, `juan_pineda`, `andres_murcia`: Roles de desarrollo DML (`SELECT, INSERT, UPDATE, DELETE`) sin privilegios destructivos (`DROP`, `ALTER`).
  - `bookyhome_app`: Rol de servicio exclusivo para la API en producción.
- **Verificación Técnica:** En MySQL Workbench se comprobó la prueba negativa:
  ```text
  DROP TABLE usuarios;
  --> Error Code: 1142. DROP command denied to user 'liz_nayibe'@'172.18.0.1' for table 'usuarios'
  ```
  Y la prueba positiva:
  ```text
  SELECT id_libro, titulo, autor_libro, precio_libro, stock FROM libros LIMIT 5;
  --> 5 filas devueltas exitosamente.
  ```

### Acción ACT-03: Saneamiento y Estructuración de Documentación
- **Implementación:**
  - Se movieron los borradores `autenticacion.md`, `registro.md` y `reportes.md` a `docs/modulos/`.
  - Se eliminó el archivo duplicado `docs/requisitos/REPORTE_REQUISITOS.md` para unificar la verdad en `docs/REPORTE_REQUISITOS.md` (92.7% RF).
  - Se renombró el plan de pruebas eliminando sufijos informales `(Copy)` a `docs/calidad/plan-de-pruebas.md`.

---

## 5. Cuadro Comparativo de Impacto (Antes vs. Después)

| Parámetro Evaluado | Línea Base (Antes) | Estado Actual (Después de la Mejora) | Impacto en la Evaluación T7 |
|---|---|---|---|
| **Cobertura SonarCloud (Código Nuevo)** | < 60% (Riesgo en Quality Gate) | **82.0% (Aprobado)** | Cumplimiento del umbral exigido por bc-testing-adso. |
| **Control de Acceso a BD (DCL)** | Cuentas genéricas sin restricción | 5 roles diferenciados con Mínimo Privilegio | Cumplimiento de OWASP A01 y rúbrica de Seguridad S06. |
| **Estructura del Repositorio** | Archivos duplicados y notas en raíz | Raíz limpia, módulos en `docs/modulos/` | Subida de puntaje en Criterio D4 (Documentación de Entrega). |
| **Calidad de Despliegue** | Puerto fijo (8000) incompatible con nube | Puerto dinámico `${PORT:-8000}` y health check `HEAD /` | Habilita despliegue continuo en Render. |

---

## 6. Firma y Compromiso del Equipo de Desarrollo

El equipo suscribe el presente plan de mejora y certifica que las acciones documentadas han sido puestas a prueba y verificadas en los ambientes correspondientes:

- **Cristopher León** — *Líder de Proyecto / Administrador DBA*
- **Liz Nayibe** — *Desarrolladora Frontend y Pruebas*
- **Juan Pineda** — *Desarrollador Backend*
- **Andrés Murcia** — *Desarrollador Móvil y Calidad*
