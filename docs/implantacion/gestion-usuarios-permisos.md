# Gestion de usuarios, roles y permisos

## 1. Objetivo

Definir como BookyHome controla el acceso a la informacion y a las operaciones segun el usuario autenticado y su rol.

## 2. Roles

| Rol | Permisos principales |
|---|---|
| `comprador` | Catalogo, favoritos, carrito, pedidos, direcciones, perfil, resenas y solicitudes propias |
| `vendedor` | Su tienda, libros, inventario, ofertas, pedidos, ventas y herramientas propias |
| `admin` / `administrador` | Usuarios, libros, tiendas, ordenes, finanzas, quejas y soporte administrativo |

## 3. Controles implementados

- El usuario inicia sesion mediante correo y contrasena.
- El backend genera un token JWT con identificador, nombre y rol.
- `get_current_user` valida el token, consulta el usuario en MySQL y rechaza cuentas bloqueadas o inactivas.
- `require_role` restringe endpoints a los roles autorizados.
- El registro publico solo admite `comprador` o `vendedor`; no permite registrarse como `admin`.
- El listado y bloqueo de usuarios requieren `admin` o `administrador`.
- Las rutas protegidas del frontend requieren token y, cuando corresponde, el rol autorizado.

## 4. Flujo de administracion

1. El administrador inicia sesion.
2. El frontend permite entrar al panel administrativo solo con el rol correspondiente.
3. El backend vuelve a validar el token y el rol en cada endpoint protegido.
4. El administrador puede consultar usuarios y bloquear o activar cuentas.
5. Un usuario bloqueado recibe una respuesta `403` y no puede continuar usando las funciones privadas.

## 5. Seguridad de credenciales

- Las contrasenas se almacenan con bcrypt.
- Los tokens JWT tienen expiracion.
- Las claves y credenciales deben mantenerse en variables de entorno.
- En produccion se deben reemplazar secretos de ejemplo y usar HTTPS.

## 6. Evidencia

La implementacion principal se encuentra en `backend/app/auth.py`, `backend/app/schemas.py`, `backend/app/routers/usuarios.py` y `frontend/src/components/PrivateRoute.jsx`.

El frontend no reemplaza la seguridad del backend: aunque una ruta se oculte en la interfaz, la API vuelve a comprobar autenticacion y permisos.

## 7. Pruebas recomendadas

- Intentar registrar un usuario con rol `admin`: debe rechazarse.
- Consultar `/usuarios` sin token: debe rechazarse.
- Consultar `/usuarios` con comprador o vendedor: debe responder `403`.
- Consultar `/usuarios` con administrador: debe permitirse.
- Bloquear un usuario y verificar que no pueda acceder a rutas privadas.