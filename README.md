# BookyHome

Proyecto e-commerce para venta de libros con frontend en React + Vite y backend en FastAPI.

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

- `frontend/`
  - `src/App.jsx`: configuración de rutas y layout principal.
  - `src/pages/`: páginas públicas y privadas de la app.
  - `src/components/`: componentes visuales reutilizables.
  - `src/services/api.js`: cliente centralizado de API para todas las llamadas al backend.
  - `src/hooks/useAuth.js`: utilidades para leer el token JWT y obtener rol/usuario.

## Cómo ejecutar

### Backend
1. Entrar a `backend/`.
2. Instalar dependencias con `pip install -r requirements.txt`.
3. Ejecutar la API con:
   ```bash
   uvicorn app.main:app --reload
   ```
4. La API estará disponible en `http://127.0.0.1:8000`.

### Frontend
1. Entrar a `frontend/`.
2. Instalar dependencias con `pnpm install`.
3. Ejecutar la app con:
   ```bash
   pnpm dev
   ```
4. Abrir el navegador en la URL que indique Vite.

## Notas importantes

- El backend usa MySQL y la conexión se configura en `backend/app/database.py`.
- El frontend usa `frontend/src/services/api.js` para centralizar las llamadas al backend.
- El token JWT se maneja con `frontend/src/hooks/useAuth.js`.

## Qué se ha organizado

- Rutas del backend separadas en `routers/`.
- Lógica de base de datos en `models/`.
- Validaciones en `schemas.py`.
- Frontend limpio y sin llamadas directas repetidas al backend.
- Uso de un servicio común para todas las APIs y un hook para autenticación.
