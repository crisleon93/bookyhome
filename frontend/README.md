# Frontend BookyHome

Frontend web de BookyHome desarrollado con React, Vite y React Router. Esta aplicacion contiene la experiencia publica del marketplace, el flujo de comprador y las pantallas de vendedor.

## Tecnologias

- React 19
- Vite 8
- React Router DOM 7
- Axios
- Flowbite / Flowbite React
- ESLint
- JWT para sesion y roles

## Estructura

```text
frontend/
  public/                 Archivos publicos servidos por Vite
  src/
    assets/               Imagenes y recursos visuales
    components/           Componentes reutilizables
    context/              Contextos de React
    hooks/                Utilidades como lectura de token/rol
    pages/                Paginas principales de la aplicacion
    services/             Cliente de API centralizado
    styles/               Estilos globales y modulares
    App.jsx               Definicion de rutas y layout principal
    main.jsx              Entrada de React
    index.css             Estilos globales
    App.css               Estilos dependientes del layout
  eslint.config.js        Configuracion de ESLint
  vite.config.js          Configuracion de Vite y Puerto 5173
  package.json            Scripts y dependencias
```

## Paginas principales

- `Home.jsx`: pagina inicial y bienvenida.
- `Catalogo.jsx`: listado de libros, busqueda y filtros.
- `DetalleLibro.jsx`: vista individual de un libro.
- `Carrito.jsx`: carrito del comprador autenticado.
- `Checkout.jsx`: fila de pago y confirmacion.
- `Login.jsx`: inicio de sesion.
- `Register.jsx`: registro de usuario.
- `ForgotPassword.jsx`: solicitud de recuperacion.
- `Resetpassword.jsx`: cambio de nueva contrasena.
- `Libreria.jsx`: registro de libreria/vendedor.
- `PostLogin.jsx`: dashboard principal del comprador.
- `PerfilUsuario.jsx`: gestion de perfil y secciones internas del comprador.
- `MiTienda.jsx`: panel del vendedor.
- `PublicarLibro.jsx`: publicacion de libros para vendedores.
- `Favoritos.jsx`: libros guardados por el comprador.
- `StoredProcedurePage.jsx`: vista de soporte para libros y stored procedures.
- `AdminDashboard.jsx`: panel administrativo (ruta protegida).

## Componentes relevantes

- `Header.jsx`: barra de navegacion superior.
- `Footer.jsx`: pie de pagina.
- `PrivateRoute.jsx`: proteccion de rutas que requieren sesion.
- `DashboardSidebar.jsx`: sidebar interno actual para comprador.
- `SellerSidebarFlowbite.jsx`: sidebar para vistas de vendedor.
- `Icons.jsx`: componentes de iconos reutilizables.
- `ToastProvider.jsx`: notificaciones de usuario.
- `LibroCard.jsx`: tarjeta de libro reutilizable.
- `DashboardHeader.jsx`: encabezado en el dashboard.

## Servicio de API

Las llamadas al backend estan centralizadas en:

```text
src/services/api.js
```

Este archivo configura Axios, define la URL base y agrega automaticamente el token JWT en el header `Authorization` cuando existe en `localStorage`.

Variable opcional:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Si no se define, el frontend usa por defecto:

```text
http://127.0.0.1:8000
```

## Scripts

Instalar dependencias:

```bash
pnpm install
```

Ejecutar en desarrollo:

```bash
pnpm dev
```

Compilar para produccion:

```bash
pnpm build
```

Revisar errores de lint:

```bash
pnpm lint
```

Previsualizar build:

```bash
pnpm preview
```

## Rutas protegidas

Algunas rutas requieren token de sesion:

- `/post-login`
- `/carrito` (redirige a `/post-login?seccion=Carrito`)
- `/checkout/:orderId`
- `/perfil`
- `/mi-tienda`
- `/vendedor/publicar`
- `/admin`

La validacion se hace con `PrivateRoute.jsx` y el token JWT almacenado en `localStorage`.

## Notas de desarrollo

- El frontend se comunica con el backend FastAPI.
- Para usar carrito, checkout, publicar libros y gestionar tienda se requiere iniciar sesion.
- El rol del usuario se obtiene desde el token JWT.
- El flujo de comprador actual utiliza `DashboardSidebar.jsx`.
- El flujo de vendedor utiliza `SellerSidebarFlowbite.jsx`.
- El puerto de desarrollo predeterminado es `5173`.

## Conexion de API

Las principales rutas usadas por el frontend son:

- `POST /login`
- `POST /register`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /libreria`
- `GET /carrito`
- `POST /carrito`
- `POST /carrito/checkout`
- `GET /api/v1/orders`
- `POST /api/v1/payments`
- `GET /api/stored/libros`
- `GET /api/stored/libros/:id`
- `GET /usuarios`

Estas rutas se consumen desde `src/services/api.js`.
