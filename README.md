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
2. Crear/activar el entorno virtual y activar el venv:
   ```powershell
   cd backend
   py -3.11 -m venv .\venv
   .\venv\Scripts\Activate.ps1
   ```
3. Instalar dependencias:
   ```powershell
   python -m pip install -r requirements.txt
   ```
4. Ejecutar la API:
   ```powershell
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
5. La API estará disponible en `http://127.0.0.1:8000`.

### Frontend
1. Entrar a `frontend/`.
2. Instalar dependencias con:
   ```powershell
   pnpm install
   ```
3. Ejecutar la app con:
   ```powershell
   pnpm dev
   ```
4. Abrir el navegador en la URL que indique Vite.

### Comando alternativo desde la raíz
Desde `c:\Users\USERS\Desktop\BYH FR`, el frontend puede iniciarse directamente con:
```powershell
pnpm dev
```

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
