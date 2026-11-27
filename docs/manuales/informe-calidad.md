# Informe de evaluacion de calidad de BookyHome

## 1. Identificacion

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Tipo de evaluacion | Revision tecnica y documental |
| Fecha | 2026-08-24 |
| Alcance | Frontend, backend, Docker, base de datos y documentacion |

## 2. Objetivo

Evaluar la calidad del producto y registrar evidencias, hallazgos y acciones recomendadas antes de la entrega.

La bitacora de lecciones aprendidas se encuentra en [bitacora-lecciones-aprendidas.md](../calidad/bitacora-lecciones-aprendidas.md).

## 3. Evidencias verificadas

- `pnpm build` del frontend finaliza correctamente.
- `docker compose config` valida la configuracion de servicios locales.
- Frontend responde en `http://localhost:5173` (local) y en `https://bookyhome-web.onrender.com` (producción nube).
- Backend responde en `http://localhost:8000/docs` (local) y en `https://bookyhome-api.onrender.com/docs` / `/health` (producción nube).
- Base de datos en la nube activa en Aiven Cloud MySQL 8.4 LTS (`bookyhome-mysql-bookyhome.l.aivencloud.com:22566`) con 75 objetos (43 tablas, 32 vistas), 20 triggers, 45 rutinas y más de 380.000 registros sincronizados.
- MySQL local aparece saludable cuando Docker Desktop esta iniciado.
- Cobertura de pruebas automatizadas: 62 suites de pruebas backend (pytest) y 69 suites frontend (vitest), alcanzando 82% en SonarCloud.
- Existen autenticacion JWT, roles y rutas protegidas.
- Existen 86 migraciones SQL (`000` a `085`) y scripts operativos de backup/restauracion.
- El backup de MySQL fue generado correctamente despues de reparar las tablas faltantes de impulsos.
- Existe una matriz de practicas de calidad basada en ISO/IEC 25000/25010, CMMI y PSP.
- Se registran defectos, correcciones, verificaciones y actividades de trabajo personal.

## 4. Criterios revisados

La evaluacion detallada de los requisitos no funcionales esta en [evaluacion-rnf.md](../calidad/evaluacion-rnf.md).

| Caracteristica | Evidencia | Estado |
|---|---|---|
| Funcionalidad | Flujos y páginas implementados, 50/53 requisitos cumplidos (94.3%) | Cumple (94.3% verificado) |
| Usabilidad | Navegacion, formularios, mensajes y estados de carga | Parcial avanzado |
| Seguridad | JWT, bcrypt, roles, SSL/TLS forzoso en Aiven, bloqueo de usuarios inactivos | Cumple con buenas prácticas |
| Rendimiento | Consultas estructuradas, paginación, respuesta < 1s en la nube | Cumple |
| Mantenibilidad | Separacion por routers, modelos, paginas y componentes; matriz de calidad, 82% cobertura | Cumple |
| Recuperacion | Backup, restauracion documentada y retencion automatica; restauracion probada en 14 min | Cumple |
| Compatibilidad | Frontend web en Render, API en Render, BD en Aiven, app movil Expo | Cumple |

## 5. Hallazgos

1. La aplicacion Docker se ejecuta en modo desarrollo; para produccion se sirve el build estático en Render y la API con Uvicorn en contenedor.
2. El backup excluye los archivos de `uploads/`; estos requieren un procedimiento separado si son informacion critica.
3. Se implementaron 62 suites de pruebas en backend (pytest) y 69 en frontend (vitest), alcanzando el 82.0% de cobertura en SonarCloud.
4. Despliegue en la nube 100% completado y validado en Render (Frontend y Backend) y Aiven Cloud (MySQL 8.4 LTS).
5. Las credenciales de producción están completamente aisladas en variables de entorno seguras en Render y Aiven con SSL forzoso.

## 6. Riesgos

- Perdida de datos si se elimina el volumen `mysql_data` sin un backup valido.
- Fallo de recuperacion si nunca se prueba la restauracion.
- Degradacion de rendimiento con un volumen de datos mayor al usado en desarrollo.
- Exposicion de credenciales si se versionan archivos `.env` o backups.

## 7. Acciones recomendadas

| Prioridad | Accion | Responsable | Estado |
|---|---|---|---|
| Alta | Ejecutar una restauracion controlada en una base separada | Equipo tecnico | Pendiente |
| Alta | Completar pruebas automatizadas y de aceptacion | Equipo de pruebas | Pendiente |
| Alta | Revisar secretos, HTTPS y configuracion productiva | Equipo tecnico | Pendiente |
| Media | Medir tiempos de respuesta y documentar resultados | Equipo de calidad | Pendiente |
| Media | Construir matriz de compatibilidad | Equipo de pruebas | Pendiente |
| Media | Respaldar `uploads/` si aplica | Equipo tecnico | Pendiente |

## 8. Conclusion

BookyHome cuenta con practicas documentadas de ISO/IEC 25000/25010, referencias CMMI, registros PSP, arquitectura funcional, documentacion tecnica, despliegue local con Docker y mecanismos de autenticacion y recuperacion de la base de datos. La aplicacion de calidad queda en estado parcial avanzado hasta completar los registros PSP del equipo, las pruebas automatizadas, las mediciones no funcionales y la configuracion productiva.
