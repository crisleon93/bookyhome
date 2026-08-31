import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getLogoUrl(logo_url) {
  if (!logo_url) return null;
  if (logo_url.startsWith('http')) return logo_url;
  return `${BASE_URL}${logo_url}`;
}

function Iniciales({ nombre }) {
  const partes = (nombre || '').trim().split(/\s+/);
  const ini = partes.length >= 2
    ? partes[0][0] + partes[1][0]
    : (nombre || '').substring(0, 2);
  return (
    <span style={{
      fontSize: '1.4rem',
      fontWeight: 800,
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      userSelect: 'none',
    }}>
      {ini.toUpperCase()}
    </span>
  );
}

function LogoTienda({ logoUrl, nombre }) {
  const [imgError, setImgError] = useState(false);
  if (!logoUrl || imgError) {
    return <Iniciales nombre={nombre} />;
  }
  return (
    <img
      src={logoUrl}
      alt={nombre}
      onError={() => setImgError(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

export default function LibreriasDestacadas() {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);
  const navigate = useNavigate();

  const scroll = (dir) => {
    if (trackRef.current) trackRef.current.scrollBy({ left: dir * 880, behavior: 'smooth' });
  };

  useEffect(() => {
    api.get('/tiendas/destacadas')
      .then(res => setTiendas(res.data || []))
      .catch(() => setTiendas([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && tiendas.length === 0) return null;

  const handleVerTienda = (tienda) => {
    navigate(`/tienda/${tienda.id_tienda}`);
  };

  const handleVerTodas = () => {
    navigate('/librerias');
  };

  return (
    <section className="librerias-destacadas">
      <div className="layout-container">
        <div className="librerias-destacadas__head">
          <div>
            <h2 className="librerias-destacadas__title">
              <span className="librerias-destacadas__emoji">🏪</span>
              Librerías en BookyHome
            </h2>
            <p className="librerias-destacadas__sub">Vendedores verificados con catálogo activo</p>
          </div>
          <button
            type="button"
            className="librerias-destacadas__link"
            onClick={handleVerTodas}
          >
            Ver todas →
          </button>
        </div>

        {loading ? (
          <div className="bkh-carrusel__wrap">
            <div className="bkh-carrusel__track" style={{ overflow: 'hidden' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="lib-card lib-card--skeleton" style={{ flexShrink: 0, width: '168px' }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bkh-carrusel__wrap">
            <button className="bkh-carrusel__arrow bkh-carrusel__arrow--left" onClick={() => scroll(-1)} aria-label="Anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div ref={trackRef} className="bkh-carrusel__track">
              {tiendas.map((tienda) => {
                const logoUrl = getLogoUrl(tienda.logo_url);
                const ciudad = tienda.ciudad_origen || (tienda.direccion || '').split(',').pop()?.trim() || 'Colombia';
                return (
                  <button
                    key={tienda.id_tienda}
                    type="button"
                    className="lib-card"
                    onClick={() => handleVerTienda(tienda)}
                  >
                    <div className="lib-card__img">
                      <LogoTienda logoUrl={logoUrl} nombre={tienda.nombre_tienda} />
                    </div>
                    <div className="lib-card__body">
                      <span className="lib-card__ciudad">{ciudad}</span>
                      <h3 className="lib-card__nombre">{tienda.nombre_tienda}</h3>
                      {tienda.descripcion && (
                        <p className="lib-card__desc">{tienda.descripcion}</p>
                      )}
                      <p className="lib-card__libros">
                        {tienda.total_libros} {tienda.total_libros === 1 ? 'libro' : 'libros'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button className="bkh-carrusel__arrow bkh-carrusel__arrow--right" onClick={() => scroll(1)} aria-label="Siguiente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
