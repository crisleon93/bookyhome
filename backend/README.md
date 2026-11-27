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
  pyproject.toml          Dependencias directas y configuracion del proyecto
  uv.lock                 Resolucion reproducible de dependencias
```

## Routers

Los endpoints estan organizados en `app/routers/`:

- `usuarios.py`: registro, login, listado de usuarios y bloqueo de usuarios.
- `auth.py`: recuperacion y restablecimiento de contrasena.
- `libreria.py`: registro de librerias/vendedores.
- `libros.py`: publicacion, edicion, eliminacion, stock, categorias, estadisticas y disponibilidad de libros.
- `ofertas.py`: creacion, edicion, eliminacion y consulta de ofertas/promociones.
- `carrito.py`: obtener carrito autenticado, agregar libros, eliminar items, limpiar carrito y checkout.
- `payments.py`: consulta de ordenes, pagos, trazabilidad logistica admin e items de compra.
- `envios.py`: calculo de flete, asignacion de guia de mensajeria y actualizacion a enviada.
- `bookypago_finanzas.py`: gestion de saldo, ingresos, historial de ventas y finanzas de tiendas.
- `direcciones.py`: direcciones de entrega de los compradores.
- `devoluciones.py`: solicitudes y aprobacion de devoluciones y reembolsos.
- `chat.py`: mensajeria y soporte entre usuarios, vendedores y administracion.
- `asistente.py`: endpoint del asistente virtual interactivo con IA.
- `stored.py`: consultas de catalogo y stored procedures.
- `perfil.py`: perfil de usuario, persistencia de foto y preferencias, historial de compras.
- `resenas.py`: creacion, edicion y eliminacion de reseñas.

## Models

La logica de datos vive en `app/models/`:

- `usuarios.py`: usuarios, login, busqueda, actualizacion de contrasena y bloqueo.
- `tiendas.py`: creacion y consulta de tiendas/librerias.
- `libro.py`: operaciones sobre libros, categorias, stock y estadisticas.
- `oferta.py`: operaciones de ofertas y libros asociados.
- `carrito.py`: operaciones de carrito y ordenes.
- `payments.py`: registro de pagos, trazabilidad logistica y consulta de ordenes.
- `envios.py`: calculo de tarifas de envio, asignacion de guia de mensajeria y estados de envio.
- `bookypago_finanzas.py`: gestion financiera de tiendas, balances y transacciones.
- `direcciones.py`: almacenamiento y validacion de direcciones de despacho.

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

Para Docker, la configuracion local de la base de datos se define en `docker-compose.yml`. No reutilices sus credenciales de desarrollo en produccion. Para otros entornos, configura las variables de base de datos en `backend/.env` usando `backend/.env.example` como referencia; nunca guardes credenciales reales en Git.

Para correo de recuperacion se usa configuracion tipo:

```env
MAIL_USERNAME=tu_correo@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_FROM=tu_correo@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

### Asistente IA

El asistente funciona con respuestas locales si no hay un proveedor de IA configurado. Para habilitar Gemini, configura estas variables **solo** en `backend/.env` (nunca en el frontend):

```env
GEMINI_API_KEY=tu_clave_de_gemini
GEMINI_MODEL=gemini-3.8-flash
```

Si Gemini no esta configurado, puedes usar OpenAI como alternativa:

```env
OPENAI_API_KEY=tu_clave_de_openai
OPENAI_MODEL=gpt-4o-mini
```

El endpoint `POST /asistente/chat` recibe el mensaje actual y hasta 12 mensajes previos. El frontend ya envia ese historial automaticamente.

## Ejecutar con Docker

Desde la raiz del proyecto:

```bash
docker compose up -d --build
```

La API queda disponible en:

```text
http://localhost:8000
```

## Pruebas y cobertura

Instala las dependencias de desarrollo y ejecuta las pruebas con cobertura:

```bash
cd backend
uv sync --locked --group dev
uv run pytest tests/ --cov=app --cov-report=term-missing --cov-report=xml:coverage/coverage.xml
```

El reporte XML se guarda en `coverage/coverage.xml` y lo importa SonarCloud.

## Ejecutar localmente

Si se desea ejecutar el backend sin Docker:

```bash
cd backend
uv sync --frozen
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Instala `uv` previamente siguiendo sus instrucciones oficiales. `uv sync --frozen` crea el entorno virtual e instala exactamente las versiones de `uv.lock`; `uv run` ejecuta el servidor dentro de ese entorno. Para esto se necesita tener MySQL disponible y configurar las variables de entorno de conexion.

## Base de datos

La base de datos se inicializa desde:

```text
database/bookyhome.sql
```

Cuando se usa Docker, MySQL carga el esquema y los archivos de `database/migrations/` al inicializar por primera vez el volumen.

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
