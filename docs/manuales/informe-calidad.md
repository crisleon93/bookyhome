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
- `docker compose config` valida la configuracion de servicios.
- Frontend responde en `http://localhost:5173`.
- Backend responde en `http://localhost:8000/docs`.
- MySQL aparece saludable cuando Docker Desktop esta iniciado.
- Existen autenticacion JWT, roles y rutas protegidas.
- Existen migraciones SQL y scripts operativos de backup/restauracion.
- El backup de MySQL fue generado correctamente despues de reparar las tablas faltantes de impulsos.
- Existe una matriz de practicas de calidad basada en ISO/IEC 25000/25010, CMMI y PSP.
- Se registran defectos, correcciones, verificaciones y actividades de trabajo personal.

## 4. Criterios revisados

La evaluacion detallada de los requisitos no funcionales esta en [evaluacion-rnf.md](../calidad/evaluacion-rnf.md).

| Caracteristica | Evidencia | Estado |
|---|---|---|
| Funcionalidad | Flujos y paginas implementados | Parcial: falta una bateria formal de pruebas |
| Usabilidad | Navegacion, formularios, mensajes y estados de carga | Parcial: falta validacion con usuarios |
| Seguridad | JWT, bcrypt, roles y bloqueo de usuarios inactivos | Parcial: faltan endurecimiento productivo y pruebas de seguridad |
| Rendimiento | Consultas con paginacion en algunos modulos | Pendiente de medir con datos representativos |
| Mantenibilidad | Separacion por routers, modelos, paginas y componentes; matriz de calidad | Parcial: lint y deuda tecnica deben revisarse |
| Recuperacion | Backup, restauracion documentada y retencion automatica | Parcial: falta prueba de restauracion en una base separada |
| Compatibilidad | Frontend web y app movil | Pendiente de matriz de navegadores y dispositivos |

## 5. Hallazgos

1. La aplicacion Docker se ejecuta en modo desarrollo; para produccion se debe quitar `--reload` del backend y servir el build del frontend.
2. El backup excluye los archivos de `uploads/`; estos requieren un procedimiento separado si son informacion critica.
3. No se encontraron pruebas automatizadas formales dentro del repositorio al momento de esta evaluacion.
4. No se encontraron mediciones de rendimiento, cobertura, disponibilidad o pruebas de usabilidad.
5. Deben reemplazarse las credenciales de ejemplo y revisar la configuracion de seguridad antes de publicar en Internet.

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
