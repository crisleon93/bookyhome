# App Movil BookyHome

Aplicacion movil de BookyHome desarrollada con Expo y React Native. Consume la misma API FastAPI que el frontend web y permite usar funcionalidades de comprador desde un celular.

## Tecnologias

- Expo
- React Native
- React Navigation
- Axios
- AsyncStorage
- JWT

## Estructura

```text
app-movil/
  src/
    assets/               Imagenes y recursos de la app
    components/           Componentes reutilizables
    context/              Contextos globales de autenticacion y carrito
    hooks/                Hooks reutilizables
    navigation/           Navegacion principal de la app
    screens/              Pantallas de la aplicacion
    services/             Cliente Axios para consumir el backend
    styles/               Estilos compartidos
    theme/                Variables visuales o tema
  App.js                  Entrada principal de la app
  app.json                Configuracion de Expo
  package.json            Scripts y dependencias
```

## Contextos principales

- `src/context/AuthContext.jsx`: guarda/restaura el token, decodifica el JWT y configura el header `Authorization`.
- `src/context/CartContext.jsx`: carga el carrito, agrega libros, elimina items y limpia el carrito.

## Servicio de API

El cliente Axios esta en:

```text
src/services/api.js
```

La app movil no debe usar `localhost` para conectarse al backend, porque desde el celular `localhost` apunta al propio dispositivo. Debe usarse la IP local del computador.

Ejemplo:

```javascript
const api = axios.create({
  baseURL: 'http://192.168.1.9:8000',
  timeout: 10000,
});
```

## Funcionalidades actuales

- Inicio de sesion.
- Registro.
- Recuperacion de contrasena.
- Consulta de libros.
- Detalle de libros, segun pantallas disponibles.
- Carrito autenticado.
- Checkout.
- Consulta/procesamiento de ordenes y pagos.
- Registro de libreria, segun flujo disponible.

## Requisitos

- Node.js
- pnpm
- Expo Go instalado en el celular
- Backend corriendo en la misma red local
- Celular y computador conectados a la misma red WiFi

## Instalacion

```bash
cd app-movil
pnpm install
```

## Configurar backend

Editar:

```text
src/services/api.js
```

y cambiar `baseURL` por la IP local del computador:

```javascript
baseURL: 'http://TU_IP_LOCAL:8000'
```

En Windows se puede consultar con:

```powershell
ipconfig
```

Buscar la direccion IPv4 del adaptador WiFi.

## Ejecutar

Iniciar Expo:

```bash
pnpm start
```

Luego escanear el codigo QR con Expo Go.

Tambien existen scripts:

```bash
pnpm android
pnpm ios
pnpm web
```

## Notas importantes

- El backend debe estar corriendo antes de abrir la app.
- Si la app no conecta, revisar IP local, firewall y que el puerto `8000` este disponible.
- Si hay problemas de cache, ejecutar:

```bash
npx expo start -c
```

- Las rutas de carrito requieren token JWT. El token se configura en `AuthContext` sobre el cliente Axios compartido.
