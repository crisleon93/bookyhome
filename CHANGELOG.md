# Changelog — BookyHome

Todos los cambios notables de este proyecto se documentan en este archivo.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).  
Versiones siguiendo [Versionado Semántico](https://semver.org/lang/es/) — `MAYOR.MENOR.PARCHE`.

---

## [1.0.0] — 2026-10-17

### Primera versión de producción

#### Añadido

**Plataforma principal**
- Catálogo público de libros con búsqueda por título, autor, categoría e ISBN
- Registro e inicio de sesión de compradores, vendedores y administradores con JWT
- Verificación de correo electrónico al registrarse
- Recuperación de contraseña por correo
- Carrito de compras persistente con gestión de stock en tiempo real
- Flujo de checkout completo con dirección de envío y resumen de pedido
- Historial de compras y seguimiento de órdenes

**Tiendas y vendedores**
- Perfil público de tienda con banner, descripción y calificación promedio
- Publicación, edición y gestión de inventario de libros (físicos y digitales)
- Panel de pedidos con confirmación y despacho
- Herramientas de promoción: cupones, descuentos e impulsos de visibilidad
- Planes de suscripción para vendedores (Básico, Pro, Premium)
- Panel de finanzas con balance BookyPago, retiros y comisiones

**Interacción y comunidad**
- Reseñas y calificaciones por libro (1–5 estrellas)
- Chat en tiempo real entre comprador y tienda (WebSocket)
- Notificaciones en tiempo real para pedidos, mensajes y promociones
- Lista de deseos por comprador
- Favoritos de libros

**Administración**
- Panel de administración con gestión de usuarios y tiendas
- Moderación de quejas y reclamos
- Estadísticas de ventas y finanzas del marketplace
- Gestión de categorías y configuración global

**Asistente IA**
- Asistente Booky integrado en la web (Google Gemini) para recomendaciones de libros

**Infraestructura**
- Stack: FastAPI 0.135 + MySQL 8 + React/Vite 8, orquestado con Docker Compose
- Reverse proxy Caddy con HTTPS automático (Let's Encrypt en producción, CA local en desarrollo)
- 83 migraciones de base de datos aplicadas en orden con `docker-entrypoint-initdb.d`
- Scripts de respaldo (`respaldar.sh`) y restauración (`restaurar.sh`) con `mysqldump`
- Script de verificación de requisitos (`verificar-requisitos.sh`)
- Script de prueba de humo (`smoke-test.sh`)
- Configuración de producción en `deploy/` (Compose, Caddyfile, env.prod.example, render.yaml)
- App móvil Expo/React Native (cliente independiente, distribuida por separado)

#### Esquema SemVer del proyecto

| Tipo de cambio | Qué incrementa | Ejemplo |
|---|---|---|
| Cambio incompatible en la API o la BD | MAYOR (X.0.0) | Eliminar un endpoint, cambiar estructura de tabla sin migración compatible |
| Nueva funcionalidad compatible | MENOR (0.X.0) | Nuevo endpoint, nueva pantalla, nueva tabla con FK opcional |
| Corrección de errores, ajuste de datos | PARCHE (0.0.X) | Fix de bug, corrección de migración de datos, ajuste de estilo |

---

## [Unreleased]

- Integración con pasarela de pagos externa real
- Notificaciones push móviles (FCM)
- Panel de analíticas avanzadas para vendedores
- Soporte multilenguaje (i18n)
