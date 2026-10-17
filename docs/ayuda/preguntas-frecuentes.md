# Preguntas frecuentes — BookyHome

**Versión:** 1.0.1 · **Fecha:** 2026-10-17

¿No encontraste tu respuesta? Escríbenos por Telegram (@bookyhome_ops) o [abre un reporte de falla](https://github.com/bookyhome/biblioteca/issues/new?template=reporte-de-falla.md).

---

## Cuenta y acceso

**¿Por qué no me llegó el correo de confirmación?**
Primero revisa la carpeta de spam. Si tampoco está, espera 5 minutos e intenta nuevamente con la opción *Reenviar confirmación* en la pantalla de inicio de sesión. Si el problema persiste, verifica que escribiste bien tu correo al registrarte.

**¿Puedo cambiar mi correo electrónico?**
Por el momento no es posible cambiarlo directamente desde la app. Escríbenos a soporte y lo gestionamos manualmente.

**¿Cómo recupero mi contraseña?**
En la pantalla de inicio de sesión toca *¿Olvidaste tu contraseña?*, ingresa tu correo y sigue el enlace que te enviamos. El enlace vence en 30 minutos.

**¿Mi sesión expira?**
Sí. La sesión dura 24 horas. Después necesitarás iniciar sesión de nuevo.

**¿Puedo tener varios roles (comprador y vendedor)?**
Una cuenta puede ser comprador y vendedor al mismo tiempo. El rol de administrador es exclusivo y lo asigna el equipo de BookyHome.

---

## Catálogo y búsqueda

**¿Cómo busco un libro por ISBN?**
Escribe el ISBN directamente en la barra de búsqueda. La búsqueda avanzada también acepta ISBN.

**¿Por qué no aparece el libro que busco?**
El libro puede estar agotado, sin stock o pendiente de publicación. Intenta buscar por título parcial o por el nombre del autor. Si el libro debería estar disponible, avisa al vendedor o al soporte.

**¿Puedo filtrar por precio?**
Sí. En la pantalla de catálogo usa los filtros para definir un rango de precio mínimo y máximo.

---

## Carrito y compras

**¿Cuántos artículos puedo tener en el carrito?**
No hay un límite oficial. Sin embargo, el stock disponible limita la cantidad por libro.

**¿El carrito se guarda si cierro la app?**
Sí, el carrito queda guardado en tu cuenta. Puedes retomarlo desde cualquier dispositivo.

**¿Puedo cancelar un pedido?**
Puedes cancelar un pedido en estado *Pendiente* antes de que el vendedor lo procese. Ve a **Mi perfil → Historial de pedidos → Cancelar**.

**¿Qué métodos de pago acepta BookyHome?**
BookyHome usa el sistema de pagos interno **BookyPago**. Los métodos disponibles dependen de tu cuenta y del saldo disponible.

---

## Vendedores

**¿Cómo activo mi tienda?**
Registra una librería desde **Menú → Mi librería → Registrar librería**. Una vez completado el formulario, tu tienda queda activa de inmediato.

**¿Puedo tener más de un libro con el mismo ISBN?**
No. Cada ISBN identifica una edición única. Si el libro existe en el catálogo de otro vendedor, puedes agregar stock al mismo registro.

**¿Cómo cobro mis ventas?**
BookyHome transfiere las ganancias a tu saldo en BookyPago cada 7 días, descontando la comisión de venta (10%). El pago mínimo es de $50.000 COP.

**¿Qué es un impulso de libro?**
Un impulso destaca tu libro en el catálogo durante un período determinado. Se cobra una comisión de impulso (5%) sobre el precio del libro impulsado.

---

## App móvil

**¿Con qué sistema operativo funciona la app?**
La app móvil BookyHome funciona con Android e iOS. Usa Expo (SDK 54) sobre React Native 0.81.

**¿La app requiere internet para funcionar?**
Sí, requiere conexión a internet. No hay modo sin conexión.

**¿Cómo actualizo la app?**
Actualizala desde Google Play o App Store normalmente. Si la tienda no muestra una actualización disponible, la versión actual es la más reciente.

**¿El escáner de código de barras no funciona. ¿Qué hago?**
Verifica que otorgaste permiso de cámara a la app. En Android: Ajustes → Apps → BookyHome → Permisos → Cámara. En iOS: Ajustes → BookyHome → Cámara.

---

## Técnico y operación

**¿Dónde veo la versión actual del sistema?**
En la API: `GET /health` devuelve la versión. En la app web también aparece en el pie de página.

**¿Qué hago si el sistema no responde?**
Primero verifica tu conexión a internet. Si el problema es del servidor, el equipo de operación (Telegram @bookyhome_ops) ya estará trabajando en ello.

**¿Cómo reporto una falla técnica?**
Usa el formulario de reporte: [Reportar falla en GitHub](https://github.com/bookyhome/biblioteca/issues/new?template=reporte-de-falla.md). Incluye el mensaje de error, tu navegador/dispositivo y los pasos para reproducir el problema.

**¿Los datos están respaldados?**
Sí. El sistema ejecuta un respaldo diario a las 20:00 h con retención de 7 días, 4 semanas y 12 meses. Los respaldos se verifican automáticamente.

---

## Privacidad y datos

**¿BookyHome guarda mis datos de tarjeta?**
No. BookyHome usa su propio sistema de saldo (BookyPago) y no almacena números de tarjeta bancaria.

**¿Puedo eliminar mi cuenta?**
Para solicitar la eliminación de tu cuenta y todos tus datos, contáctanos directamente a través del canal de soporte.
