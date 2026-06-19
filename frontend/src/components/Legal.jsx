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
              <button className="btn btn-vinotinto" style={{ flex: 1 }} onClick={onAccept}>
                ✓ Acepto
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

export const Terminos = () => (
  <>
    <p><strong>Última actualización: 21 de Marzo de 2026</strong></p>
    <h3>1. Aceptación de los Términos</h3>
    <p>Al registrarte en BookyHome, declaras que tienes al menos 18 años o cuentas con autorización de un tutor legal, y aceptas cumplir estos términos en su totalidad.</p>
    <h3>2. Descripción del Servicio</h3>
    <p>BookyHome es una plataforma de comercio electrónico especializada en libros que conecta compradores con librerías y vendedores independientes. Actuamos como intermediarios y no somos propietarios de los libros listados.</p>
    <h3>3. Registro y Cuenta de Usuario</h3>
    <p>Debes proporcionar información verídica al registrarte. Eres el único responsable de mantener la confidencialidad de tu contraseña. BookyHome se reserva el derecho de suspender cuentas que violen estos términos.</p>
    <h3>4. Compras y Pagos</h3>
    <p>Los precios son establecidos por cada vendedor. Las transacciones están protegidas por nuestro sistema de Compra Protegida. BookyHome no garantiza la disponibilidad permanente de ningún producto.</p>
    <h3>5. Envíos y Entregas</h3>
    <p>Los tiempos de entrega varían según el vendedor y la ubicación. BookyHome no se responsabiliza por retrasos causados por empresas de mensajería o circunstancias externas.</p>
    <h3>6. Devoluciones y Reembolsos</h3>
    <p>Tienes hasta 15 días calendario desde la recepción del producto para solicitar una devolución. Los reembolsos se procesan en 5 a 10 días hábiles.</p>
    <h3>7. Conducta del Usuario</h3>
    <p>Está prohibido publicar información falsa, usar la plataforma para actividades ilegales, copiar contenido protegido o intentar acceder a cuentas ajenas.</p>
    <h3>8. Propiedad Intelectual</h3>
    <p>El nombre BookyHome, logo, diseño y contenido son propiedad exclusiva de BookyHome. Queda prohibida su reproducción sin autorización expresa.</p>
    <h3>9. Modificaciones</h3>
    <p>BookyHome puede actualizar estos términos en cualquier momento. Los cambios entran en vigor 30 días después de su publicación.</p>
  </>
);

export const Privacidad = () => (
  <>
    <p><strong>Última actualización: 21 de Marzo de 2026</strong></p>
    <h3>1. Información que Recopilamos</h3>
    <p>Recopilamos nombre completo, email, contraseña encriptada, dirección de envío, historial de pedidos y datos de navegación.</p>
    <h3>2. Cómo Usamos tu Información</h3>
    <p>Usamos tus datos para gestionar tu cuenta, procesar pedidos, enviarte confirmaciones y mejorar nuestros servicios.</p>
    <h3>3. Compartir tu Información</h3>
    <p>No vendemos tu información a terceros. Solo la compartimos con vendedores para procesar pedidos, empresas de mensajería y autoridades cuando la ley lo exija.</p>
    <h3>4. Seguridad de tus Datos</h3>
    <p>Tu contraseña se almacena encriptada con bcrypt. Usamos HTTPS para todas las transacciones y realizamos auditorías periódicas de seguridad.</p>
    <h3>5. Cookies</h3>
    <p>Usamos cookies para mantener tu sesión, recordar tus preferencias y analizar el tráfico. Puedes desactivarlas desde tu navegador.</p>
    <h3>6. Tus Derechos</h3>
    <p>Tienes derecho a acceder, rectificar y eliminar tus datos. Contáctanos en privacidad@bookyhome.com</p>
    <h3>7. Retención de Datos</h3>
    <p>Conservamos tus datos mientras tu cuenta esté activa. Si la eliminas, borramos tus datos en máximo 30 días.</p>
    <h3>8. Menores de Edad</h3>
    <p>BookyHome no está dirigida a menores de 18 años. Si eres tutor y crees que tu hijo proporcionó datos, contáctanos para eliminarlos.</p>
  </>
);
