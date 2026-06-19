# BookyHome

BookyHome es un proyecto e-commerce para venta de libros. Incluye frontend web en React + Vite, backend en FastAPI, base de datos MySQL y una app movil en Expo/React Native.

El entorno web completo se puede levantar con Docker mediante un solo comando. La app movil se ejecuta aparte con Expo y consume la misma API del backend.

## Estructura del proyecto

```text
BookyHome/
  app-movil/              Aplicacion movil Expo/React Native
  backend/                API FastAPI
  database/               Script SQL de inicializacion
  docs/                   Documentacion adicional del proyecto
  frontend/               Aplicacion web React/Vite
  docker-compose.yml      Orquestacion de MySQL, backend y frontend
  package.json            Scripts generales para frontend
  pnpm-lock.yaml          Lockfile de dependencias
  README.md               Documentacion principal
```

## Backend

El backend esta en `backend/` y expone la API usada por el frontend web y la app movil.

Estructura principal:

- `app/main.py`: punto de entrada de FastAPI.
- `app/routers/`: rutas HTTP organizadas por modulo.
  - `usuarios.py`: registro, login, usuarios y bloqueo.
  - `auth.py`: recuperacion y restablecimiento de contrasena.
  - `libreria.py`: registro de librerias/vendedores.
  - `libros.py`: publicacion, edicion, stock, categorias, estadisticas y disponibilidad.
  - `ofertas.py`: gestion de promociones/ofertas.
  - `carrito.py`: carrito autenticado, agregar, eliminar, limpiar y checkout.
  - `payments.py`: pagos, ordenes y confirmaciones.
  - `stored.py`: consultas de catalogo y stored procedures.
- `app/models/`: logica de acceso a datos y operaciones de negocio.
  - `usuarios.py`
  - `tiendas.py`
  - `libro.py`
  - `oferta.py`
  - `carrito.py`
  - `payments.py`
- `app/data/`: almacenamiento local en JSON para carrito/ordenes/pagos de desarrollo.
- `app/auth.py`: hashing de contrasenas y JWT.
- `app/database.py`: conexion a MySQL.
- `app/email.py`: envio de correos de recuperacion.
- `app/schemas.py`: validaciones Pydantic.
- `Dockerfile`: imagen del backend.
- `requirements.txt`: dependencias Python.

Mas detalle en:

```text
backend/README.md
```

## Frontend web

El frontend esta en `frontend/` y esta construido con React, Vite, React Router y Axios.

Estructura principal:

- `src/App.jsx`: configuracion de rutas y layout principal.
- `src/main.jsx`: entrada de React.
- `src/pages/`: paginas publicas y privadas.
  - home
  - catalogo
  - detalle de libro
  - carrito
  - checkout
  - login/registro
  - recuperacion de contrasena
  - area comprador
  - tienda del vendedor
  - publicacion de libros
- `src/components/`: componentes reutilizables.
  - header
  - footer
  - tarjetas de libros
  - rutas privadas
  - seccion de ofertas
  - componentes de dashboard
- `src/services/api.js`: cliente Axios centralizado para consumir el backend.
- `src/hooks/useAuth.js`: utilidades para leer token y rol.
- `src/assets/`: imagenes y recursos visuales.
- `src/index.css`: estilos globales.
- `Dockerfile`: imagen del frontend.

Mas detalle en:

```text
frontend/README.md
```

## App movil

La app movil esta en `app-movil/` y usa Expo/React Native.

Estructura principal:

- `App.js`: entrada principal.
- `src/navigation/`: navegacion de pantallas.
- `src/screens/`: pantallas de la app.
- `src/context/`: autenticacion y carrito.
- `src/services/api.js`: cliente Axios para el backend.
- `src/components/`: componentes reutilizables.
- `src/assets/`: recursos visuales.
- `src/styles/` y `src/theme/`: estilos y tema visual.

La app movil no corre dentro de Docker. Se ejecuta con Expo y debe apuntar a la IP local del computador donde corre el backend.

Mas detalle en:

```text
app-movil/README.md
```

## Base de datos

La carpeta `database/` contiene:

- `bookyhome.sql`: script de inicializacion de la base de datos MySQL.

Cuando se usa Docker, este script se ejecuta automaticamente la primera vez que se crea el contenedor de MySQL.

## Como ejecutar con Docker

### Requisitos

- Tener instalado [Docker](https://www.docker.com/) y Docker Compose.

### Pasos

1. Clonar el repositorio.

2. Crear un archivo `.env` en `backend/` con el siguiente contenido. Ajusta los valores de correo segun corresponda:

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

3. Desde la raiz del proyecto, ejecutar:

```bash
docker compose up -d --build
```

4. Listo. Servicios disponibles:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- MySQL: `localhost:3306`
  - usuario: `root`
  - contrasena: `root`
  - base de datos: `bookyhome`

### Comandos utiles

Ver logs de todos los servicios:

```bash
docker compose logs -f
```

Ver logs de un servicio especifico:

```bash
docker compose logs -f backend
```

Apagar todo:

```bash
docker compose down
```

Apagar y borrar tambien los datos de la base de datos:

```bash
docker compose down -v
```

Reconstruir un solo servicio, por ejemplo backend:

```bash
docker compose up -d --build backend
```

## Notas importantes de Docker

- La base de datos se inicializa automaticamente la primera vez con `database/bookyhome.sql`.
- Si necesitas reiniciar la base de datos desde cero, usa `docker compose down -v` y vuelve a levantar los contenedores.
- El backend espera a que MySQL este saludable antes de iniciar, gracias al `healthcheck` y `depends_on`.
- El frontend web y el backend quedan disponibles en `localhost`.
- La app movil debe usar la IP local del computador, no `localhost`.

## Como ejecutar la app movil con Expo

### Requisitos

- Tener Node.js y `pnpm` instalados.
- Tener Expo Go instalado en el celular.
- El celular y la computadora deben estar conectados a la misma red WiFi.
- El backend debe estar corriendo.

### Pasos

1. Entrar a `app-movil/`:

```powershell
cd app-movil
```

2. Instalar dependencias:

```powershell
pnpm install
```

3. Configurar la URL del backend en `src/services/api.js`. Cambia `baseURL` por la IP local de tu computadora:

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

Busca la direccion IPv4 del adaptador WiFi, por ejemplo `192.168.1.9`.

4. Iniciar Expo:

```powershell
pnpm start
```

5. Escanear el codigo QR con Expo Go desde el celular.

### Notas de app movil

- Asegurate de que el backend este corriendo con `docker compose up -d --build`.
- Si el backend no responde desde el celular, verifica que el firewall permita conexiones al puerto `8000`.
- Si haces cambios y no se reflejan, recarga la app desde Expo Go.
- Si hay errores de cache de Metro:

```powershell
npx expo start -c
```

## Funcionalidades principales

### Comprador

- Registro e inicio de sesion.
- Recuperacion de contrasena.
- Exploracion de catalogo.
- Busqueda y filtros de libros.
- Detalle de libro.
- Favoritos.
- Carrito autenticado.
- Checkout.
- Consulta de compras/ordenes.

### Vendedor

- Registro de libreria.
- Panel de tienda.
- Publicacion de libros.
- Edicion y eliminacion de libros.
- Gestion de stock.
- Alertas de stock bajo.
- Estadisticas de libros y ventas.
- Gestion de ofertas/promociones.
- Perfil del negocio.

### Administracion y soporte

- Listado y gestion de usuarios.
- Bloqueo de usuarios, segun endpoints disponibles.
- Stored procedures para consultas de catalogo/libros.
- Pagos y ordenes mediante endpoints de payments.

## Scripts utiles del frontend desde la raiz

El `package.json` principal contiene accesos rapidos al frontend:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

Estos comandos entran a `frontend/` y ejecutan el script correspondiente.

## Documentacion por modulo

- `frontend/README.md`: detalles del frontend web.
- `backend/README.md`: detalles de la API.
- `app-movil/README.md`: detalles de la app movil.

## Estado general

El proyecto esta organizado por capas:

- Backend con rutas separadas en `routers/`.
- Logica de datos separada en `models/`.
- Validaciones centralizadas con Pydantic.
- Frontend con paginas, componentes, hooks y servicio de API.
- App movil con navegacion, pantallas, contextos y servicios.
- Base de datos inicializada por SQL.
- Entorno web dockerizado para levantar frontend, backend y MySQL con un solo comando.
