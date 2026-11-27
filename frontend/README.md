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
    components/dashboard/ Secciones del dashboard del comprador
    hooks/                Utilidades como lectura de token/rol
    pages/                Paginas principales de la aplicacion
    services/             Cliente de API centralizado
    styles/               Estilos globales y modulares
    test/                 Pruebas automatizadas
    utils/                Funciones auxiliares
    App.jsx               Definicion de rutas y layout principal
    main.jsx              Entrada de React
    index.css             Estilos globales
    App.css               Estilos dependientes del layout
  eslint.config.js        Configuracion de ESLint
  vite.config.js          Configuracion de Vite
  package.json            Scripts y dependencias
```

## Paginas principales

- `Home.jsx`: pagina publica, acceso y dashboard del comprador.
- `Catalogo.jsx`: listado de libros, busqueda y filtros.
- `Librerias.jsx` y `PerfilTienda.jsx`: listado de librerias y perfil de tienda.
- `ResetPassword.jsx`: cambio de contrasena desde el enlace de recuperacion.
- `MiTienda.jsx`: panel del vendedor.
- `PublicarLibro.jsx`: publicacion de libros para vendedores.
- `Historial.jsx`, `ListaDeseos.jsx` y `Devoluciones.jsx`: compras, listas y devoluciones.
- `BookyPagoFinanzas.jsx`: finanzas administrativas y balance de ventas.
- `AdminDashboard.jsx`: panel administrativo integral (moderacion de catalogo, suspension y activacion de tiendas con filtros simetricos, supervision de ordenes con avatares y modal de seguimiento logistico/numero de guia, tickets de soporte y metricas).

El carrito y el checkout se muestran dentro de secciones del dashboard en `Home.jsx`; no son paginas independientes.

## Componentes relevantes

- `Header.jsx`: barra de navegacion superior.
- `Footer.jsx`: pie de pagina.
- `PrivateRoute.jsx`: proteccion de rutas que requieren sesion.
- `CompradorSidebar.jsx`: navegacion del comprador.
- `VendedorSidebar.jsx`: navegacion del vendedor.
- `Icons.jsx`: componentes de iconos reutilizables.
- `ToastProvider.jsx`: notificaciones de usuario.
- `LibroCard.jsx`: tarjeta de libro reutilizable.
- `DashboardHeader.jsx`: encabezado en el dashboard.
- `components/dashboard/`: secciones del dashboard, incluido el carrito y el checkout.

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
http://localhost:8000
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

Ejecutar pruebas:

```bash
pnpm test
pnpm test:coverage
pnpm test:e2e
```

## Rutas protegidas

Algunas rutas requieren token de sesion:

- `/carrito` (redirige a `/?seccion=Carrito`)
- `/historial`
- `/lista-deseos`
- `/devoluciones`
- `/mi-tienda`
- `/vendedor/publicar`
- `/admin`
- `/admin/finanzas`

`/favoritos` redirige a `/lista-deseos`. La autenticacion y el registro se manejan desde la pagina principal.

La validacion se hace con `PrivateRoute.jsx` y el token JWT almacenado en `localStorage`.

## Notas de desarrollo

- El frontend se comunica con el backend FastAPI.
- Para usar carrito, checkout, publicar libros y gestionar tienda se requiere iniciar sesion.
- El rol del usuario se obtiene desde el token JWT.
- El flujo del comprador utiliza `CompradorSidebar.jsx` y secciones en `components/dashboard/`.
- El flujo del vendedor utiliza `VendedorSidebar.jsx`.
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
