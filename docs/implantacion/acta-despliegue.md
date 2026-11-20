# Acta tecnica de despliegue y publicacion

## 1. Objetivo

Registrar la configuracion y verificacion del despliegue de BookyHome tanto en ambiente local (Docker Compose) como en ambiente de produccion en la nube (Render + Aiven Cloud MySQL), cubriendo frontend, backend y motor de base de datos relacional.

## 2. Arquitecturas desplegadas

### 2.1 Ambiente local (Docker Desktop)

```text
Usuario web o app movil
          |
          v
Frontend React/Vite :5173
          |
          v
Backend FastAPI :8000
          |
          v
MySQL 8 :3306
```

### 2.2 Ambiente público en la nube (Render + Aiven Cloud)

```text
Usuario / Evaluador SENA
          |
          v
Frontend React (Render Static): https://bookyhome-web.onrender.com
          | (HTTPS / REST)
          v
Backend FastAPI (Render Web Service): https://bookyhome.onrender.com
          | (Conexión segura SSL/TLS - Puerto 22566)
          v
Base de Datos (Aiven MySQL 8.4): bookyhome-mysql-bookyhome.l.aivencloud.com:22566
```

## 3. Servicios configurados

### 3.1 Servicios Cloud Públicos (Criterio D2 - Semanas 3 y 4)

| Servicio | Proveedor | URL / Endpoint Público | Puerto | Tipo de Acceso | Estado |
|---|---|---|---|---|---|
| **Backend API** | Render | `https://bookyhome.onrender.com` | 443 (HTTPS) | Público (`/docs`, `/health`) | Configurado / Desplegado |
| **Frontend Web** | Render | `https://bookyhome-web.onrender.com` | 443 (HTTPS) | Público | Configurado / Desplegado |
| **Base de Datos** | Aiven Cloud | `bookyhome-mysql-bookyhome.l.aivencloud.com` | 22566 | Conexión SSL (`bookyhome`) | Activo (75 tablas y vistas, 20 triggers, 45 rutinas, 380k+ filas) |

### 3.2 Servicios Locales (Docker Compose)

| Servicio | Contenedor | Imagen o tecnologia | Puerto publicado | Persistencia |
|---|---|---|---:|---|
| Base de datos | `bookyhome-mysql` | MySQL 8.0 | 3306 | Volumen `mysql_data` |
| Backend | `contenedor-back` | FastAPI/Uvicorn | 8000 | Volumen `uploads_data` para archivos |
| Frontend | `contenedor-front` | React/Vite | 5173 | Volumen de dependencias |

La configuracion se encuentra en [docker-compose.yml](../../docker-compose.yml). Los detalles de cada imagen estan en `backend/Dockerfile` y `frontend/Dockerfile`.

## 4. Procedimiento de despliegue local

Desde la raiz del proyecto:

```powershell
docker compose up -d --build
docker compose ps
```

Direcciones publicadas:

- Frontend: `http://localhost:5173`
- Backend y documentacion API: `http://localhost:8000/docs`
- MySQL: `localhost:3306`

Para revisar errores:

```powershell
docker compose logs --tail 100 frontend
docker compose logs --tail 100 backend
docker compose logs --tail 100 mysql
```

## 5. Verificacion realizada

El 24 de agosto de 2026 se verifico el despliegue con Docker Desktop activo:

| Verificacion | Resultado |
|---|---|
| MySQL saludable | Cumple |
| Backend iniciado en puerto 8000 | Cumple |
| Frontend iniciado en puerto 5173 | Cumple |
| Frontend responde HTTP | `200` |
| Backend `/docs` responde HTTP | `200` |
| Dependencia backend -> MySQL | Configurada mediante `depends_on` y healthcheck |

## 6. Politicas de seguridad aplicadas

- Las rutas privadas utilizan autenticacion JWT.
- Las contrasenas se almacenan con hash bcrypt.
- El backend valida roles y usuarios activos.
- Las credenciales de correo y claves sensibles deben manejarse con variables de entorno.
- La carpeta de backups esta excluida de Git.

## 7. Estado de las observaciones de produccion (Criterio D2)

Las observaciones técnicas para producción fueron atendidas e implementadas en el ambiente Cloud:

1. **Credenciales seguras**: Se eliminó el uso de credenciales por defecto. La base de datos en la nube (Aiven) utiliza usuario administrativo dedicado con SSL forzoso y contraseña criptográfica fuerte.
2. **Gestión de secretos**: Las variables críticas (`DB_PASSWORD`, `SECRET_KEY`, `MAIL_PASSWORD`, `GEMINI_API_KEY`) se administran como variables de entorno seguras en Render, nunca en el repositorio.
3. **CORS y HTTPS/TLS**: Se configuró HTTPS obligatorio provisto por Render en `https://bookyhome.onrender.com`. El CORS en FastAPI autoriza explícitamente los orígenes de Render (`https://.*\.onrender\.com`).
4. **Optimización de contenedor**: Se eliminó la bandera `--reload` en la ejecución productiva del `Dockerfile` y se implementó enlace dinámico al puerto `${PORT:-8000}`.
5. **Manejo de Base de Datos Cloud**: Se migraron las 43 tablas base y 32 vistas (75 objetos en total) al clúster MySQL 8.4 en Aiven, con soporte SSL nativo en el backend.

## 8. Resultado

El criterio de despliegue y publicación (Criterio D2) se declara **CUMPLIDO SATISFACTORIAMENTE** tanto en el ambiente local de desarrollo (Docker Compose) como en el ambiente público en la nube (Render + Aiven Cloud MySQL), permitiendo la verificación remota de la plataforma BookyHome por parte de los evaluadores del SENA.
