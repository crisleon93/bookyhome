import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Terminos,
  Privacidad,
  AcercaDeNosotros,
  Contacto,
  ComoComprar,
  EnviosYEntregas,
  DevolucionesInfo,
  VenderEnBookyHome,
  PlanesYTarifas,
  CentroDeVendedores,
  FAQVendedores,
} from './Legal';

function Footer() {
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isDashboardPage = location.startsWith('/mi-tienda') ||
    location.startsWith('/post-login') ||
    location.startsWith('/vendedor') ||
    location.startsWith('/perfil') ||
    location.startsWith('/publicar');

  const [activeLegal, setActiveLegal] = useState(null);

  const openAuthModal = (type = 'join') => {
    const eventMap = {
      join: 'bookyhome:open-join',
      login: 'bookyhome:open-login',
      register: 'bookyhome:open-register',
    };
    window.dispatchEvent(new CustomEvent(eventMap[type] || 'bookyhome:open-join'));
  };

  const handleAccountAction = (target) => {
    const hasToken = !!localStorage.getItem('token');

    if (!hasToken) {
      if (target === 'join') {
        openAuthModal('join');
      } else {
        openAuthModal('join');
      }
      return;
    }

    if (target === 'compras') navigate('/?seccion=Mis%20Compras');
    else if (target === 'favoritos') navigate('/lista-deseos');
    else if (target === 'soporte') navigate('/?seccion=Soporte%20t%C3%A9cnico');
    else openAuthModal('join');
  };

  const legalContent = activeLegal === 'acerca' ? <AcercaDeNosotros />
    : activeLegal === 'contacto' ? <Contacto />
    : activeLegal === 'como-comprar' ? <ComoComprar />
    : activeLegal === 'envios' ? <EnviosYEntregas />
    : activeLegal === 'devoluciones' ? <DevolucionesInfo />
    : activeLegal === 'vender' ? <VenderEnBookyHome />
    : activeLegal === 'planes' ? <PlanesYTarifas />
    : activeLegal === 'centro-vendedores' ? <CentroDeVendedores />
    : activeLegal === 'faq-vendedores' ? <FAQVendedores />
    : activeLegal === 'terminos' ? <Terminos />
    : activeLegal === 'privacidad' ? <Privacidad />
    : null;

  const legalTitle = activeLegal === 'acerca' ? 'Acerca de nosotros'
    : activeLegal === 'contacto' ? 'Contacto'
    : activeLegal === 'como-comprar' ? 'Cómo comprar'
    : activeLegal === 'envios' ? 'Envíos y entregas'
    : activeLegal === 'devoluciones' ? 'Devoluciones'
    : activeLegal === 'vender' ? 'Vender en BookyHome'
    : activeLegal === 'planes' ? 'Planes y tarifas'
    : activeLegal === 'centro-vendedores' ? 'Centro de vendedores'
    : activeLegal === 'faq-vendedores' ? 'FAQ vendedores'
    : activeLegal === 'terminos' ? 'Términos y condiciones'
    : activeLegal === 'privacidad' ? 'Política de privacidad'
    : '';

  return (
    <>
      <footer style={{ marginLeft: isDashboardPage ? 'var(--dashboard-sidebar-width, 250px)' : undefined, width: isDashboardPage ? 'calc(100% - var(--dashboard-sidebar-width, 250px))' : undefined }}>

        <div className="footer-container">

          {/* Columna 1 — BookyHome */}
          <div className="footer-column">
            <h3>BookyHome</h3>
            <ul>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('acerca')}>Acerca de nosotros</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('contacto')}>Contacto</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('terminos')}>Términos y condiciones</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('privacidad')}>Política de privacidad</button></li>
            </ul>
          </div>

          {/* Columna 2 — Comprar */}
          <div className="footer-column">
            <h3>Comprar</h3>
            <ul>
              <li><Link to="/catalogo">Explorar catálogo</Link></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('como-comprar')}>Cómo comprar</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('envios')}>Envíos y entregas</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('devoluciones')}>Devoluciones</button></li>
            </ul>
          </div>

          {/* Columna 3 — Vender */}
          <div className="footer-column">
            <h3>Vender</h3>
            <ul>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('vender')}>Vender en BookyHome</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('planes')}>Planes y tarifas</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('centro-vendedores')}>Centro de vendedores</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => setActiveLegal('faq-vendedores')}>FAQ vendedores</button></li>
            </ul>
          </div>

          {/* Columna 4 — Mi Cuenta */}
          <div className="footer-column">
            <h3>Mi Cuenta</h3>
            <ul>
              <li><button type="button" className="footer-legal-button" onClick={() => handleAccountAction('join')}>Iniciar sesión / Registro</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => handleAccountAction('compras')}>Mis compras</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => handleAccountAction('favoritos')}>Lista de deseos</button></li>
              <li><button type="button" className="footer-legal-button" onClick={() => handleAccountAction('soporte')}>Ayuda y Soporte</button></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BookyHome — Todos los derechos reservados.</p>
        </div>

      </footer>

      {activeLegal && (
        <div className="legal-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setActiveLegal(null);
        }}>
          <div className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
            <div className="legal-modal-header">
              <h3 id="legal-modal-title">{legalTitle}</h3>
              <button type="button" className="legal-modal-close" onClick={() => setActiveLegal(null)} aria-label="Cerrar">×</button>
            </div>
            <div className="legal-modal-content">
              {legalContent}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Footer