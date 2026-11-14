import React from 'react';
import { IconCheck, IconClose } from './Icons';

export function LegalModal({ open, onClose, onAccept, title, accepted, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
        <h2 className="modal-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{title}</h2>

        {accepted && (
          <div className="flash flash--success" style={{ marginBottom: '0.8rem', padding: '0.5rem 0.8rem' }}>
            <IconCheck /> Ya aceptaste este documento
          </div>
        )}

        <div style={{ fontSize: '0.85rem', color: '#444', lineHeight: '1.7', textAlign: 'left', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
          {children}
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
          {!accepted ? (
            <>
              <button className="btn btn-vinotinto" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={onAccept}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Acepto
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '6px', border: '1.5px solid #ccc', background: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '600', color: '#666' }}>
                Denegar
              </button>
            </>
          ) : (
            <button onClick={onClose}
              style={{ flex: 1, padding: '0.85rem', borderRadius: '6px', border: '1.5px solid #ccc', background: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '600', color: '#666' }}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const AcercaDeNosotros = () => (
  <>
    <p><strong>BookyHome</strong> es una plataforma colombiana creada para conectar lectores, compradores, tiendas y vendedores de libros en un mismo espacio digital.</p>
    <h3>Nuestra misión</h3>
    <p>Facilitar la compra y venta de libros de forma sencilla, segura y cercana, ayudando a que más personas encuentren títulos relevantes y a que independientemente de su tamaño, las librerías y vendedores puedan llegar a más clientes.</p>
    <h3>¿Qué hacemos?</h3>
    <p>En BookyHome puedes explorar un catálogo de libros, encontrar ofertas, comparar opciones y comprar desde una experiencia pensada para la comodidad del usuario. También brindamos un espacio para que vendedores y tiendas publiquen sus productos, gestionen sus ventas y conecten con compradores interesados.</p>
    <h3>¿Por qué existimos?</h3>
    <p>Creemos que el libro es un producto cultural, educativo y personal, por eso buscamos crear una comunidad donde la compra sea clara, accesible y confiable. Queremos apoyar tanto a quienes buscan leer como a quienes hacen posible la venta y distribución de libros.</p>
    <h3>Compromiso</h3>
    <p>BookyHome trabaja para ofrecer una experiencia amigable, transparente y fácil de usar, con foco en la calidad de la información, la atención al cliente y la confianza entre compradores y vendedores.</p>
  </>
);

export const Contacto = () => (
  <>
    <p>Si necesitas ayuda, tienes dudas sobre un pedido o quieres comunicarte con el equipo de BookyHome, puedes contactarnos a través de los siguientes canales.</p>
    <h3>Soporte y atención</h3>
    <p><strong>Email:</strong> soporte@bookyhome.com</p>
    <p><strong>Privacidad:</strong> privacidad@bookyhome.com</p>
    <h3>Horario</h3>
    <p>Atendemos consultas de lunes a viernes, en horario hábil. En caso de necesitar respuesta sobre pedidos o incidencias, te responderemos en el menor tiempo posible.</p>
    <h3>¿Qué puedes comunicar?</h3>
    <p>Podemos ayudarte con dudas sobre compras, entregas, devoluciones, pagos, publicaciones de vendedores, problemas con tu cuenta o cualquier inquietud relacionada con la plataforma.</p>
  </>
);

export const VenderEnBookyHome = () => (
  <>
    <p>BookyHome te permite vender libros de forma sencilla, con visibilidad para compradores interesados y herramientas para gestionar tus publicaciones.</p>
    <h3>¿Cómo funciona?</h3>
    <p>Creas tu cuenta de vendedor, publicas tus libros con información clara, defines el precio y disponibilidad, y gestionas tus ventas desde un panel sencillo.</p>
    <h3>Ventajas</h3>
    <p>Acceso a un público activo de lectores, mejor visibilidad para tus títulos, organización de ventas y un espacio para crecer tu negocio literario.</p>
    <h3>Objetivo</h3>
    <p>Queremos apoyar a librerías, vendedores independientes y marcas que quieran conectar con lectores en Colombia en una experiencia segura y ordenada.</p>
  </>
);

export const PlanesYTarifas = () => (
  <>
    <p>BookyHome ofrece un modelo de venta pensado para librerías pequeñas, grandes tiendas y vendedores independientes.</p>
    <h3>Publicación</h3>
    <p>Puedes comenzar a publicar tus libros con una estructura simple y clara, adaptada a tu catálogo y disponibilidad.</p>
    <h3>Gestión</h3>
    <p>Controla tus ventas, pedidos y atención al cliente desde un mismo lugar, con herramientas para mantener tus publicaciones actualizadas.</p>
    <h3>Flexibilidad</h3>
    <p>El plan se adapta al volumen de publicaciones y al tipo de negocio que deseas impulsar dentro de la plataforma.</p>
  </>
);

export const CentroDeVendedores = () => (
  <>
    <p>El centro de vendedores es el punto de referencia para administrar tu negocio en BookyHome.</p>
    <h3>Desde ahí puedes</h3>
    <p>Ver tus publicaciones, revisar ventas, conocer el estado de pedidos, responder mensajes y actualizar información de tus libros o tienda.</p>
    <h3>Soporte</h3>
    <p>También encontrarás información útil para mejorar tu presencia, mantener tus productos actualizados y ofrecer una mejor experiencia a tus clientes.</p>
  </>
);

export const FAQVendedores = () => (
  <>
    <p>Estas son algunas preguntas frecuentes que suelen aparecer al comenzar a vender en BookyHome.</p>
    <h3>¿Necesito ser una librería para vender?</h3>
    <p>No. Puedes vender como tienda, librería o vendedor independiente siempre que cumplas con los requisitos de la plataforma y publiques información verídica.</p>
    <h3>¿Cómo gestiono mis pedidos?</h3>
    <p>Desde tu panel de vendedor puedes revisar las ventas, confirmar el estado del pedido y comunicarte con el comprador si es necesario.</p>
    <h3>¿Qué pasa si tengo una duda?</h3>
    <p>Puedes comunicarte con el equipo de soporte para resolver dudas sobre publicaciones, ventas, pagos, entregas o atención al cliente.</p>
  </>
);

export const ComoComprar = () => (
  <>
    <p>Comprar en BookyHome es sencillo y seguro. Estos son los pasos básicos para completar una compra.</p>
    <h3>1. Explora el catálogo</h3>
    <p>Busca por título, autor, categoría o tienda para encontrar el libro que necesitas.</p>
    <h3>2. Revisa la información</h3>
    <p>Consulta la descripción, disponibilidad, precio, vendedor y condiciones de entrega antes de comprar.</p>
    <h3>3. Agrega al carrito</h3>
    <p>Cuando encuentres el libro correcto, agrégalo al carrito y confirma los datos del pedido.</p>
    <h3>4. Finaliza el pago</h3>
    <p>Completa la compra con el método de pago disponible y confirma la operación desde la plataforma.</p>
    <h3>5. Sigue tu pedido</h3>
    <p>Podrás consultar el estado de tu compra y recibir notificaciones sobre envío, entrega o soporte.</p>
  </>
);

export const EnviosYEntregas = () => (
  <>
    <p>Los tiempos de entrega dependen del vendedor, la ciudad y la empresa de mensajería que realice la logística.</p>
    <h3>¿Cómo se gestionan?</h3>
    <p>Una vez confirmada la compra, el vendedor prepara el pedido y lo envía según la información publicada en la plataforma.</p>
    <h3>Tiempos estimados</h3>
    <p>Los tiempos pueden variar entre 2 y 10 días hábiles, dependiendo de la ubicación y la disponibilidad del producto.</p>
    <h3>Seguimiento</h3>
    <p>Podrás ver el estado del pedido desde tu cuenta y recibir notificaciones cuando el envío esté en tránsito o entregado.</p>
  </>
);

export const DevolucionesInfo = () => (
  <>
    <p>Si el libro recibido no coincide con la publicación, llega dañado o presenta un problema, puedes solicitar una devolución.</p>
    <h3>Cuándo puedes devolver</h3>
    <p>Se puede solicitar devolución por producto defectuoso, incorrecto, no coincidente con la descripción o entregado en mal estado.</p>
    <h3>Proceso</h3>
    <p>Debes indicar el motivo y, si aplica, adjuntar información y comentarios del caso. La solicitud será revisada por la plataforma y el vendedor.</p>
    <h3>Reembolso</h3>
    <p>El reembolso o cambio se gestionará según la política del vendedor y la validación del caso por parte de BookyHome.</p>
  </>
);

export const Privacidad = () => (
  <>
    <p><strong>Última actualización: 30 de Agosto de 2026</strong></p>
    <h3>1. Información que Recopilamos</h3>
    <p>Recopilamos información necesaria para crear y administrar tu cuenta, como nombre, correo electrónico, contraseña, dirección de entrega, datos de contacto, historial de compras, preferencias de navegación, reseñas, mensajes y cualquier información que proporciones al usar la plataforma.</p>
    <h3>2. Cómo Usamos tu Información</h3>
    <p>Usamos tus datos para gestionar tu registro, procesar pedidos, facilitar la atención al cliente, mejorar la experiencia de compra, enviar confirmaciones y notificaciones, prevenir fraudes, mantener la seguridad de la plataforma y mejorar la calidad de nuestros servicios.</p>
    <h3>3. Compartir Información con terceros</h3>
    <p>No vendemos tus datos personales. Sin embargo, podemos compartir información con vendedores, socios logísticos, proveedores de pagos, servicios de soporte o autoridades cuando sea necesario para completar una compra, atender un reclamo, cumplir con una obligación legal o proteger los derechos de la plataforma y de sus usuarios.</p>
    <h3>4. Cookies y tecnologías similares</h3>
    <p>Utilizamos cookies, almacenamiento local y herramientas analíticas para reconocer tu sesión, recordar tus preferencias, mantener la seguridad, medir tráfico y mejorar la navegación dentro de la app o sitio web. Puedes configurar tu navegador para aceptar, rechazar o eliminar cookies, aunque algunas funciones pueden verse limitadas.</p>
    <h3>5. Seguridad de tus Datos</h3>
    <p>Aplicamos medidas razonables de seguridad para proteger tu información frente a accesos no autorizados, uso indebido o pérdida. Sin embargo, ninguna transmisión por internet es completamente segura; por ello, recomendamos mantener tus credenciales protegidas y notificar cualquier sospecha de uso no autorizado.</p>
    <h3>6. Tus Derechos</h3>
    <p>Tienes derecho a acceder, corregir, actualizar o solicitar la eliminación de tus datos personales, así como a limitar o rechazar determinados usos. Para ejercer estos derechos, puedes contactarnos a través de nuestro soporte o correo de privacidad.</p>
    <h3>7. Retención y eliminación</h3>
    <p>Conservamos la información mientras tu cuenta esté activa o mientras sea necesario para cumplir con obligaciones legales, resolver disputas, prevenir fraudes y mejorar la operación de la plataforma. Cuando la información ya no sea necesaria, procederemos a su eliminación o anonimización según corresponda.</p>
    <h3>8. Menores de Edad</h3>
    <p>BookyHome no está destinado a menores de edad sin supervisión. Si detectamos o recibimos información de un menor sin la debida autorización, podremos bloquear o eliminar esa cuenta y la información asociada.</p>
    <h3>9. Contacto</h3>
    <p>Si tienes dudas sobre esta política, deseas ejercer tus derechos o reportar un problema relacionado con tus datos, puedes comunicarte con nosotros en soporte@bookyhome.com o privacidad@bookyhome.com.</p>
  </>
);

export const Terminos = () => (
  <>
    <p><strong>Última actualización: 30 de Agosto de 2026</strong></p>
    <h3>1. Aceptación de los Términos</h3>
    <p>Al registrarte en BookyHome, declaras que eres mayor de edad o cuentas con la autorización de tu tutor legal, y aceptas cumplir estos términos y condiciones en su totalidad.</p>
    <h3>2. Descripción del Servicio</h3>
    <p>BookyHome es una plataforma digital de comercio electrónico especializada en libros, diseñada para conectar compradores con librerías, tiendas y vendedores independientes en Colombia. La plataforma actúa como intermediario para facilitar la publicación, búsqueda, compra, pago y seguimiento de pedidos.</p>
    <h3>3. Registro y Cuenta de Usuario</h3>
    <p>Debes proporcionar información verídica, completa y actualizada al registrarte. Eres responsable de mantener la confidencialidad de tus credenciales, así como de cualquier actividad realizada desde tu cuenta. BookyHome puede suspender, limitar o eliminar cuentas que incumplan estas condiciones o afecten la seguridad o el buen funcionamiento de la plataforma.</p>
    <h3>4. Compras, Pagos y Protección al Comprador</h3>
    <p>Los precios, disponibilidad y condiciones de venta son definidos por cada vendedor o tienda. BookyHome facilita la operación y puede ofrecer mecanismos de protección para compras, verificaciones y atención a reclamos. Sin embargo, la venta final se realiza entre el comprador y el vendedor, y BookyHome no es propietario de los libros ofertados ni de los inventarios publicados.</p>
    <h3>5. Envíos, Entregas y Responsabilidad</h3>
    <p>Los tiempos de entrega dependen de la logística del vendedor, la ubicación del comprador y los servicios de mensajería. BookyHome no garantiza tiempos de entrega exactos ni es responsable por retrasos atribuibles a terceros, fallas logísticas, condiciones climáticas, impagos, huelgas o causas ajenas a la plataforma.</p>
    <h3>6. Devoluciones y Reembolsos</h3>
    <p>El comprador podrá solicitar una devolución o reembolso cuando el producto recibido no corresponda a la publicación, presente un daño evidente, o exista una situación conforme a la política de la plataforma y las condiciones del vendedor. Los tiempos y procedimientos de devolución se gestionarán según el caso, la categoría del producto y la política de cada tienda, siempre dentro de los mecanismos habilitados por BookyHome.</p>
    <h3>7. Publicaciones, contenido y vendedores</h3>
    <p>Los vendedores son responsables de la veracidad, calidad, disponibilidad y legalidad de la información publicada en sus anuncios, así como del cumplimiento de las condiciones de venta y entrega. Queda prohibido publicar contenido falso, engañoso, infractor, ilegal o que vulneré derechos de terceros.</p>
    <h3>8. Conducta del Usuario</h3>
    <p>Está prohibido usar la plataforma para actividades ilegales, suplantar identidades, publicar contenido fraudulento, intentar acceder a cuentas ajenas, manipular reseñas, compras o evaluaciones, o interferir con la operación normal de la aplicación.</p>
    <h3>9. Soporte, notificaciones y comunicaciones</h3>
    <p>BookyHome puede enviar mensajes, notificaciones, confirmaciones y avisos relacionados con pedidos, seguridad, cambios en la plataforma o atención al cliente. El usuario acepta recibir estas comunicaciones en la medida en que sean necesarias para la operación del servicio.</p>
    <h3>10. Propiedad Intelectual</h3>
    <p>El nombre, logotipo, diseño, contenido y estructura de BookyHome son propiedad de la plataforma o de sus respectivos titulares. Se prohíbe la reproducción, uso no autorizado o apropiación indebida de cualquier elemento de la marca, la interfaz o los contenidos protegidos.</p>
    <h3>11. Ley aplicable y jurisdicción</h3>
    <p>Estos términos se rigen por la legislación vigente de la República de Colombia. Cualquier controversia relacionada con su interpretación, ejecución o cumplimiento será sometida a la jurisdicción de los tribunales competentes de la ciudad de Bogotá D.C., Colombia, salvo que la ley aplicable establezca otra competencia.</p>
    <h3>12. Modificaciones</h3>
    <p>BookyHome puede actualizar estos términos y condiciones en cualquier momento para reflejar cambios legales, funcionales o operativos del servicio. Los cambios entrarán en vigor a partir de su publicación dentro de la plataforma y serán aplicables a nuevos usos o actividades posteriores.</p>
  </>
);
