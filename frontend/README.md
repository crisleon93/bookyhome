# Frontend BookyHome

Frontend web de BookyHome desarrollado con React, Vite y React Router. Esta aplicacion contiene la experiencia publica del marketplace, el flujo de comprador y las pantallas principales del vendedor.

## Tecnologias

- React 19
- Vite 8
- React Router DOM
- Axios
- ESLint
- JWT para sesion y roles

## Estructura

```text
frontend/
  public/                 Archivos publicos servidos por Vite
  src/
    assets/               Imagenes y recursos visuales
    components/           Componentes reutilizables
    context/              Contextos de React, si aplican
    hooks/                Utilidades como lectura de token/rol
    pages/                Paginas principales de la aplicacion
    services/             Cliente de API centralizado
    App.jsx               Definicion de rutas y layout principal
    main.jsx              Entrada de React
    index.css             Estilos globales
    App.css               Estilos complementarios
  eslint.config.js        Configuracion de ESLint
  vite.config.js          Configuracion de Vite
  package.json            Scripts y dependencias
```

## Paginas principales

- `Home.jsx`: pagina inicial de BookyHome.
- `Catalogo.jsx`: listado de libros, busqueda y filtros.
- `DetalleLibro.jsx`: vista individual de un libro.
- `Carrito.jsx`: carrito del comprador autenticado.
- `Checkout.jsx`: formulario y flujo de pago.
- `PostLogin.jsx`: area privada del comprador.
- `MiTienda.jsx`: panel principal del vendedor.
- `PublicarLibro.jsx`: publicacion de libros.
- `Libreria.jsx`: registro de libreria o vendedor.
- `Login.jsx` y `Register.jsx`: autenticacion y registro.
- `ForgotPassword.jsx` y `Resetpassword.jsx`: recuperacion de contrasena.
- `Favoritos.jsx`: libros guardados por el comprador.
- `StoredProcedurePage.jsx`: vista de apoyo para libros/procedimientos almacenados.

## Componentes relevantes

- `Header.jsx`: navegacion superior general.
- `Footer.jsx`: pie de pagina global.
- `PrivateRoute.jsx`: proteccion de rutas que requieren sesion.
- `LibroCard.jsx`: tarjeta reutilizable para libros.
- `SeccionOfertas.jsx`: gestion de promociones/ofertas del vendedor.
- `DashboardSidebar.jsx`: navegacion lateral usada por pantallas internas actuales.
- `DashboardHeader.jsx`: encabezado de dashboard.
- `Icons.jsx`: iconos reutilizables.

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
- `/mi-tienda`
- `/carrito`
- `/checkout/:orderId`
- `/vendedor/publicar`

La validacion se hace con `PrivateRoute.jsx`.

## Notas de desarrollo

- El frontend se comunica con el backend FastAPI.
- Para usar carrito, checkout, publicar libros y gestionar tienda se requiere iniciar sesion.
- El rol del usuario se obtiene desde el token JWT.
- El catalogo consume libros desde el backend.
- El proyecto actualmente combina paginas publicas normales con pantallas internas tipo dashboard; si se redisenan las vistas, conviene unificar la navegacion bajo un solo header.
