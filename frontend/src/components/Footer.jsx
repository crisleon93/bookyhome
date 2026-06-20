import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer>

      <div className="footer-container">

        {/* Columna 1 — BookyHome */}
        <div className="footer-column">
          <h3>BookyHome</h3>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalogo">Catálogo de libros</Link></li>
            <li><Link to="/favoritos">Mis favoritos</Link></li>
            <li><Link to="/libreria">Acerca de nosotros</Link></li>
          </ul>
        </div>

        {/* Columna 2 — Comprar */}
        <div className="footer-column">
          <h3>Comprar</h3>
          <ul>
            <li><Link to="/catalogo">Ver todos los libros</Link></li>
            <li><Link to="/catalogo?categoria=Romance">Romance</Link></li>
            <li><Link to="/catalogo?categoria=Ciencia">Ciencia</Link></li>
            <li><Link to="/catalogo?categoria=Tecnolog%C3%ADa">Tecnología</Link></li>
          </ul>
        </div>

        {/* Columna 3 — Vender */}
        <div className="footer-column">
          <h3>Vender</h3>
          <ul>
            <li><Link to="/libreria" className="highlight">Vender en BookyHome</Link></li>
            <li><Link to="/vendedor/publicar">Publicar un libro</Link></li>
            <li><Link to="/mi-tienda">Mi tienda</Link></li>
            <li><Link to="/libreria">Planes y precios</Link></li>
          </ul>
        </div>

        {/* Columna 4 — Mi Cuenta */}
        <div className="footer-column">
          <h3>Mi Cuenta</h3>
          <ul>
            <li><Link to="/login">Iniciar sesión</Link></li>
            <li><Link to="/register" className="highlight">Crear cuenta</Link></li>
            <li><Link to="/post-login">Dashboard</Link></li>
            <li><Link to="/post-login?seccion=Mis Compras">Mis compras</Link></li>
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