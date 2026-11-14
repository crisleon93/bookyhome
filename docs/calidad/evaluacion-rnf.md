# Evaluacion de requisitos no funcionales

## 1. Identificacion

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Fecha | 2026-08-24 |
| Alcance | Seguridad, rendimiento, usabilidad, mantenibilidad, compatibilidad, recuperacion y eficiencia |
| Ambiente | Docker Compose local |

## 2. Metodo

Cada requisito se compara con una evidencia del repositorio o con una medicion ejecutada. Los estados usados son:

- **Cumple:** existe implementacion y evidencia verificable.
- **Parcial:** existe parte de la implementacion, pero falta una prueba, medicion o endurecimiento.
- **Pendiente:** no hay evidencia suficiente para afirmar que se cumple.

La existencia de un documento cuyo estado diga `Implementado` no reemplaza la medicion o prueba del requisito.

## 3. Matriz de evaluacion

| RNF | Atributo evaluado | Evidencia | Estado |
|---|---|---|---|
| RNF-001 | Seguridad de datos | bcrypt, JWT, variables de entorno y validacion de acceso; HTTPS, CSRF, XSS, auditoria y secretos productivos pendientes | Parcial |
| RNF-002 | Seguridad de accesos | JWT, verificacion de correo, roles, bloqueo de inactivos y rutas administrativas protegidas | Parcial |
| RNF-003 | Rendimiento | Paginacion y consultas estructuradas; falta medir busqueda y catalogo por debajo de 3 segundos | Parcial |
| RNF-004 | Escalabilidad | Separacion frontend/backend/MySQL y Docker; no hay replicas, balanceador ni prueba de carga | Parcial |
| RNF-005 | Alta disponibilidad | Healthcheck y reinicio de contenedores; no hay medicion del 99%, alertas ni redundancia | Parcial |
| RNF-006 | Mantenibilidad | Modulos separados, documentación, componentes reutilizables y Git; el lint y la deuda tecnica deben revisarse | Parcial |
| RNF-007 | Compatibilidad | Diseño responsive, frontend web y app movil; falta matriz ejecutada de navegadores, tablets y dispositivos | Parcial |
| RNF-008 | Usabilidad | Navegacion por roles, mensajes, estados de carga, formularios y casos de prueba con capturas | Parcial avanzado |
| RNF-009 | Conformidad legal | Politica de privacidad, terminos, cookies y consentimiento disponibles en la interfaz; falta validacion juridica | Parcial |
| RNF-010 | Tiempo de respuesta | Frontend y `/docs` respondieron HTTP 200; falta medir login, busqueda y publicacion por debajo de 3 segundos | Parcial |
| RNF-011 | Recuperacion | Backup diario, retencion de 30 dias, restauracion documentada y prueba en `bookyhome_prueba` con 75 objetos | Cumple en ambiente local |
| RNF-012 | Eficiencia de recursos | Imagenes ligeras, paginacion y retencion de backups; falta monitoreo de CPU, memoria, red y almacenamiento | Parcial |

## 4. Evidencias ejecutadas

| Prueba | Resultado |
|---|---|
| `pnpm build` | Exitoso |
| `docker compose config` | Exitoso |
| Frontend `http://localhost:5173` | HTTP 200 |
| Backend `http://localhost:8000/docs` | HTTP 200 |
| Tiempo de respuesta del frontend principal | 171.23 ms en medicion local |
| Tiempo de respuesta de `/docs` | 86.05 ms en medicion local |
| Carga inicial de catalogo | 326.44 ms en medicion local |
| Busqueda de libros | 77.30 ms en medicion local |
| Listado de libros | 87.57 ms en medicion local |
| Login con credenciales invalidas | 55.18 ms en medicion local |
| Consumo instantaneo frontend | 7.31% CPU y 144.9 MiB |
| Consumo instantaneo backend | 8.76% CPU y 121.1 MiB |
| Consumo instantaneo MySQL | 0.46% CPU y 443.3 MiB |
| MySQL en Docker | Estado `healthy` |
| `/usuarios` sin token | HTTP 401 |
| `/usuarios/1/bloquear` sin token | HTTP 401 |
| Restauracion de backup en `bookyhome_prueba` | Exitoso, 75 objetos |
| Verificacion de plataforma | Windows 11, 15.87 GB RAM, 650.39 GB libres, puertos 3306/5173/8000 disponibles |

## 5. Mediciones pendientes

Para cerrar completamente los requisitos no funcionales se deben ejecutar y registrar:

1. Tiempo de login valido y publicacion; el login medido fue con credenciales invalidas y las mediciones actuales son ejecuciones individuales, no una prueba de carga.
2. Pruebas en Chrome, Edge y Firefox, en computador, tablet y celular.
3. Consumo de CPU y memoria con los tres servicios activos.
4. Prueba de carga con una cantidad definida de usuarios y publicaciones.
5. Prueba de recuperación y disponibilidad durante un periodo definido.
6. Revisión de dependencias y análisis de seguridad.
7. Validación de usabilidad con usuarios finales.

## 6. Conclusion

BookyHome tiene varias características no funcionales implementadas y evidencias técnicas verificables. El resultado global es **cumple parcialmente**, porque los tiempos de respuesta, disponibilidad, compatibilidad amplia, consumo de recursos y controles de seguridad productivos aún requieren mediciones o pruebas adicionales.
