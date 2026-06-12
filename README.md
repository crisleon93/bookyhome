# BookyHome

Proyecto e-commerce para venta de libros con frontend en React + Vite, backend en FastAPI y base de datos MySQL. Todo el proyecto corre con Docker mediante un solo comando.

## Estructura del proyecto

- `backend/`
  - `app/main.py`: punto de entrada de la API FastAPI.
  - `app/routers/`: contiene las rutas organizadas por responsabilidad.
    - `usuarios.py` → registro, login y listado de usuarios.
    - `auth.py` → recuperación y restablecimiento de contraseña.
    - `libreria.py` → registro de librerías/vendedores.
    - `carrito.py` → consulta del carrito del usuario.
    - `stored.py` → llamadas a stored procedures y libros.
  - `app/models/`: lógica de acceso a datos.
    - `usuarios.py` → consultas y operaciones sobre usuarios.
    - `tiendas.py` → creación de librerías y tiendas.
    - `carrito.py` → lectura del carrito de usuario.
  - `app/auth.py`: hashing de contraseñas y JWT.
  - `app/database.py`: conexión a MySQL.
  - `app/email.py`: envío de correos de recuperación.
  - `app/schemas.py`: validaciones Pydantic.
  - `Dockerfile`: imagen del backend (FastAPI + Uvicorn).

- `frontend/`
  - `src/App.jsx`: configuración de rutas y layout principal.
  - `src/pages/`: páginas públicas y privadas de la app.
  - `src/components/`: componentes visuales reutilizables.
  - `src/services/api.js`: cliente centralizado de API para todas las llamadas al backend.
  - `src/hooks/useAuth.js`: utilidades para leer el token JWT y obtener rol/usuario.
  - `Dockerfile`: imagen del frontend (Vite).

- `database/`
  - `bookyhome.sql`: script de inicialización de la base de datos, se ejecuta automáticamente al crear el contenedor de MySQL.

- `docker-compose.yml`: orquesta los tres servicios (MySQL, backend, frontend).

## Cómo ejecutar (con Docker)

### Requisitos
- Tener instalado [Docker](https://www.docker.com/) y Docker Compose.

### Pasos
1. Clonar el repositorio.
2. Crear un archivo `.env` en `backend/` con el siguiente contenido (ajusta los valores de correo según corresponda):
```dotenv
   MAIL_USERNAME=tu_correo@gmail.com
   MAIL_PASSWORD=tu_app_password
   MAIL_FROM=tu_correo@gmail.com
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587

   # Variables de la Base de Datos para Docker y Backend
   DB_HOST=mysql
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=bookyhome
```
3. Desde la raíz del proyecto, ejecutar:
```bash
   docker compose up -d --build
```
4. Listo. Servicios disponibles:
   - **Frontend**: `http://localhost:5173`
   - **Backend (API)**: `http://localhost:8000`
   - **MySQL**: `localhost:3306` (usuario `root`, contraseña `root`, base de datos `bookyhome`)

### Comandos útiles
- Ver logs de todos los servicios:
```bash
  docker compose logs -f
```
- Ver logs de un servicio específico:
```bash
  docker compose logs -f backend
```
- Apagar todo:
```bash
  docker compose down
```
- Apagar y borrar también los datos de la base de datos (reinicia desde cero):
```bash
  docker compose down -v
```
- Reconstruir un solo servicio (por ejemplo, después de cambiar dependencias del backend):
```bash
  docker compose up -d --build backend
```

## Notas importantes

- La base de datos se inicializa automáticamente la primera vez con el script `database/bookyhome.sql`. Si necesitas reiniciar la base de datos desde cero, usa `docker compose down -v` y vuelve a levantar los contenedores.
- El backend espera a que MySQL esté saludable (`healthcheck`) antes de iniciar, gracias a `depends_on: condition: service_healthy`.

## Cómo ejecutar la app móvil (Expo)

### Requisitos
- Tener [Node.js](https://nodejs.org/) y `pnpm` instalados.
- Tener la app **Expo Go** instalada en tu celular (disponible en Play Store / App Store).
- El celular y la computadora deben estar conectados a la **misma red WiFi**.

### Pasos
1. Entrar a `app-movil/`:
```powershell
   cd app-movil
```

2. Instalar dependencias:
```powershell
   pnpm install
```

3. Configurar la URL del backend en `src/services/api.js`. Cambia `baseURL` por la IP local de tu computadora (no `localhost`):
```javascript
   const api = axios.create({
     baseURL: 'http://TU_IP_LOCAL:8000',
     timeout: 10000,
   });
```
   Para obtener tu IP local en Windows:
```powershell
   ipconfig
```
   Busca la `Dirección IPv4` del adaptador WiFi (ejemplo: `192.168.1.9`).

4. Iniciar Expo:
```powershell
   npx expo start
```

5. Escanea el código QR que aparece en la terminal con la app **Expo Go** desde tu celular.

### Notas
- Asegúrate de que el backend (Docker) esté corriendo con `docker compose up -d --build` antes de abrir la app móvil, ya que la app consume la API en `http://TU_IP_LOCAL:8000`.
- Si el backend no responde desde el celular, verifica que el firewall de Windows permita conexiones entrantes al puerto `8000`.
- Si haces cambios en el código y no se reflejan, recarga la app desde Expo Go (sacude el dispositivo o presiona `r` en la terminal).
- Si ves errores relacionados con caché de Metro, limpia con:
```powershell
  npx expo start -c
```

## Qué se ha organizado

- Rutas del backend separadas en `routers/`.
- Lógica de base de datos en `models/`.
- Validaciones en `schemas.py`.
- Frontend limpio y sin llamadas directas repetidas al backend.
- Uso de un servicio común para todas las APIs y un hook para autenticación.
- Todo el entorno (frontend, backend y base de datos) dockerizado para levantar el proyecto con un solo comando.