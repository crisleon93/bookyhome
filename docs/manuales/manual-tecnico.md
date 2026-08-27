# Manual tecnico de BookyHome

## 1. Arquitectura

BookyHome esta compuesto por:

- Frontend web en React 19, Vite y React Router.
- Backend API en FastAPI y Uvicorn.
- MySQL 8 como base de datos.
- App movil en Expo/React Native, ejecutada por separado.
- Docker Compose para coordinar MySQL, backend y frontend.

## 2. Servicios y puertos

| Servicio | Contenedor | Puerto | Funcion |
|---|---|---:|---|
| MySQL | `bookyhome-mysql` | 3306 | Persistencia de datos |
| Backend | `contenedor-back` | 8000 | API FastAPI |
| Frontend | `contenedor-front` | 5173 | Aplicacion web Vite |

## 3. Backend

El punto de entrada es `backend/app/main.py`. Las rutas se organizan en `backend/app/routers/` y la logica de persistencia en `backend/app/models/`. La conexion a MySQL se centraliza en `backend/app/database.py`.

La autenticacion usa JWT. El token contiene el identificador, nombre y rol del usuario. `get_current_user` valida el token y el estado de la cuenta; `require_role` restringe las operaciones por rol.

## 4. Frontend

La entrada es `frontend/src/main.jsx` y las rutas principales se configuran en `frontend/src/App.jsx`. Las llamadas HTTP se centralizan en `frontend/src/services/api.js`, que agrega el token JWT cuando existe.

El puerto de desarrollo predeterminado es `5173`. El comando de Docker ejecuta Vite en modo desarrollo para facilitar la recarga durante el trabajo del equipo.

## 5. Base de datos

- Script inicial: `database/bookyhome.sql`.
- Migraciones: `database/migrations/`.
- Volumen persistente: `mysql_data`.
- Archivos cargados: volumen `uploads_data` en `/app/uploads`.

Las migraciones nuevas deben aplicarse y probarse en una base de datos de desarrollo antes de usarse en una instalacion con datos importantes.

## 6. Configuracion sensible

Las contrasenas, claves JWT y credenciales de correo deben manejarse mediante variables de entorno y no deben subirse al repositorio. En una instalacion real se deben reemplazar las credenciales de ejemplo y configurar HTTPS.

## 7. Operacion

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Para construir el frontend fuera de Docker:

```powershell
Set-Location frontend
pnpm install
pnpm build
```

## 8. Backup y recuperacion

Los scripts de operacion estan en `scripts/backups/` y `scripts/verification/`. El backup de MySQL se crea con `backup-db.ps1`, la restauracion se ejecuta con `restore-db.ps1` y la tarea diaria se registra con `configure-backup-task.ps1`. Consultar [la guia de scripts](../../scripts/README.md).
