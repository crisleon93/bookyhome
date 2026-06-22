# Backend BookyHome

Backend de BookyHome construido con FastAPI y MySQL. Expone la API usada por el frontend web y la app movil para autenticacion, catalogo de libros, tiendas, carrito, ofertas, pagos, ordenes y perfil de usuario.

## Tecnologias

- Python
- FastAPI
- Uvicorn
- MySQL
- Pydantic
- JWT
- Passlib/Bcrypt
- Docker

## Estructura

```text
backend/
  app/
    data/                 Archivos JSON usados por carrito/ordenes/pagos locales
    models/               Logica de acceso a datos y operaciones de negocio
    routers/              Rutas HTTP organizadas por modulo
    auth.py               Hashing de contrasenas y manejo de JWT
    database.py           Conexion a MySQL
    email.py              Envio de correos de recuperacion
    main.py               Entrada principal de FastAPI
    schemas.py            Esquemas de validacion Pydantic
  Dockerfile              Imagen del backend
  requirements.txt        Dependencias Python
```

## Routers

Los endpoints estan organizados en `app/routers/`:

- `usuarios.py`: registro, login, listado de usuarios y bloqueo de usuarios.
- `auth.py`: recuperacion y restablecimiento de contrasena.
- `libreria.py`: registro de librerias/vendedores.
- `libros.py`: publicacion, edicion, eliminacion, stock, categorias, estadisticas y disponibilidad de libros.
- `ofertas.py`: creacion, edicion, eliminacion y consulta de ofertas/promociones.
- `carrito.py`: obtener carrito autenticado, agregar libros, eliminar items, limpiar carrito y checkout.
- `payments.py`: consulta de ordenes, pagos y confirmaciones.
- `stored.py`: consultas de catalogo y stored procedures.
- `perfil.py`: perfil de usuario, actualizacion de datos y historial de compras.
- `resenas.py`: creacion, edicion y eliminacion de reseñas.

## Models

La logica de datos vive en `app/models/`:

- `usuarios.py`: usuarios, login, busqueda, actualizacion de contrasena y bloqueo.
- `tiendas.py`: creacion y consulta de tiendas/librerias.
- `libro.py`: operaciones sobre libros, categorias, stock y estadisticas.
- `oferta.py`: operaciones de ofertas y libros asociados.
- `carrito.py`: operaciones de carrito y ordenes.
- `payments.py`: registro de pagos y consulta de ordenes.

## Autenticacion

El backend usa JWT. Las rutas privadas reciben el token con:

```text
Authorization: Bearer TOKEN
```

El token se genera en el login e incluye datos como:

- `sub`: id del usuario.
- `nombre`: nombre del usuario.
- `rol`: rol del usuario.

## Variables de entorno

Para Docker, las variables de base de datos se definen en `docker-compose.yml`:

```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=bookyhome
```

Para correo de recuperacion se usa configuracion tipo:

```env
MAIL_USERNAME=tu_correo@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_FROM=tu_correo@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

## Ejecutar con Docker

Desde la raiz del proyecto:

```bash
docker compose up -d --build
```

La API queda disponible en:

```text
http://localhost:8000
```

## Ejecutar localmente

Si se desea ejecutar el backend sin Docker:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Para esto se necesita tener MySQL disponible y configurar las variables de entorno de conexion.

## Base de datos

La base de datos se inicializa desde:

```text
database/bookyhome.sql
```

Cuando se usa Docker, MySQL carga ese script la primera vez que se crea el volumen.

## Datos locales JSON

La carpeta:

```text
app/data/
```

se usa para almacenar datos locales relacionados con carrito, ordenes o pagos en archivos JSON. Esto facilita el flujo de carrito/checkout durante el desarrollo.

## Verificacion rapida

Comprobar sintaxis Python:

```bash
python -m compileall backend\app
```

Ver logs del backend con Docker:

```bash
docker compose logs -f backend
```
