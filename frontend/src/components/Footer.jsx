import { Link } from 'react-router-dom';

function Footer() {
  const location = window.location.pathname;
  const isDashboardPage = location.startsWith('/mi-tienda') ||
    location.startsWith('/post-login') ||
    location.startsWith('/vendedor') ||
    location.startsWith('/perfil') ||
    location.startsWith('/publicar');

  return (
    <footer style={{ marginLeft: isDashboardPage ? 'var(--dashboard-sidebar-width, 250px)' : undefined, width: isDashboardPage ? 'calc(100% - var(--dashboard-sidebar-width, 250px))' : undefined }}>

      <div className="footer-container">

        {/* Columna 1 — BookyHome */}
        <div className="footer-column">
          <h3>BookyHome</h3>
          <ul>
            <li><Link to="/acerca">Acerca de nosotros</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/terminos">Términos y condiciones</Link></li>
            <li><Link to="/privacidad">Política de privacidad</Link></li>
          </ul>
        </div>

        {/* Columna 2 — Comprar */}
        <div className="footer-column">
          <h3>Comprar</h3>
          <ul>
            <li><Link to="/catalogo">Explorar catálogo</Link></li>
            <li><Link to="/como-comprar">Cómo comprar</Link></li>
            <li><Link to="/envios">Envíos y entregas</Link></li>
            <li><Link to="/devoluciones">Devoluciones</Link></li>
          </ul>
        </div>

        {/* Columna 3 — Vender */}
        <div className="footer-column">
          <h3>Vender</h3>
          <ul>
            <li><Link to="/libreria" className="highlight">Vender en BookyHome</Link></li>
            <li><Link to="/libreria">Planes y tarifas</Link></li>
            <li><Link to="/vendedor/dashboard">Centro de vendedores</Link></li>
            <li><Link to="/faq-vendedores">FAQ vendedores</Link></li>
          </ul>
        </div>

        {/* Columna 4 — Mi Cuenta */}
        <div className="footer-column">
          <h3>Mi Cuenta</h3>
          <ul>
            <li><Link to="/login">Iniciar sesión / Registro</Link></li>
            <li><Link to="/post-login?seccion=Mis Compras">Mis compras</Link></li>
            <li><Link to="/post-login?seccion=Lista%20de%20Deseos">Lista de deseos</Link></li>
            <li><Link to="/soporte">Ayuda y Soporte</Link></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} BookyHome — Todos los derechos reservados.</p>
      </div>

    </footer>
  )
}

export default Footer