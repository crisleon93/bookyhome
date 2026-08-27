# Acta tecnica de despliegue y publicacion

## 1. Objetivo

Registrar la configuracion y verificacion del despliegue local de BookyHome mediante Docker Compose, incluyendo frontend, backend y motor de base de datos.

## 2. Arquitectura desplegada

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

Los servicios se comunican mediante la red interna de Docker Compose. El backend utiliza MySQL como persistencia y expone la API para el frontend web y la app movil.

## 3. Servicios configurados

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

## 7. Pendientes para produccion

El despliegue local esta verificado, pero no debe presentarse como una instalacion productiva completa hasta cerrar estos puntos:

1. Cambiar las credenciales de ejemplo, especialmente el usuario root y la contrasena `root` de MySQL.
2. Usar secretos seguros mediante variables de entorno o un gestor de secretos.
3. Configurar HTTPS/TLS y restringir CORS a los dominios reales.
4. Quitar `--reload` del backend en produccion.
5. Construir el frontend con `pnpm build` y servir el resultado con un servidor web de produccion.
6. No publicar el puerto de MySQL directamente a Internet.
7. Definir firewall, dominio, monitoreo y politica de actualizaciones.

## 8. Resultado

El criterio de despliegue y publicación se cumple para el **ambiente local de desarrollo y demostración**. Queda parcialmente pendiente la preparación de un ambiente productivo endurecido según las políticas de seguridad indicadas.
