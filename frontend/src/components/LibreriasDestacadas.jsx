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

function parseTiendaInfo(tienda) {
  let ciudad = (tienda.ciudad_origen || '').trim();
  let direccion = (tienda.direccion || '').trim();

  if (direccion.includes(',')) {
    const parts = direccion.split(',');
    const posCiudad = parts.pop().trim();
    if ((!ciudad || ciudad.toLowerCase() === 'colombia') && posCiudad) {
      ciudad = posCiudad;
    }
    direccion = parts.join(',').trim();
  }

  // Normalizar y asegurar nombres de ciudades reales
  const cNorm = (ciudad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (cNorm.includes('bogot')) ciudad = 'Bogotá';
  else if (cNorm.includes('medell')) ciudad = 'Medellín';
  else if (cNorm.includes('cali')) ciudad = 'Cali';
  else if (cNorm.includes('barranqu')) ciudad = 'Barranquilla';
  else if (cNorm.includes('cartag')) ciudad = 'Cartagena';
  else if (cNorm.includes('santa mart')) ciudad = 'Santa Marta';
  else if (cNorm.includes('bucaram')) ciudad = 'Bucaramanga';
  else if (cNorm.includes('perei')) ciudad = 'Pereira';
  else if (cNorm.includes('maniz')) ciudad = 'Manizales';
  else if (cNorm.includes('armen')) ciudad = 'Armenia';
  else if (cNorm.includes('ibag')) ciudad = 'Ibagué';
  else if (cNorm.includes('neiv')) ciudad = 'Neiva';
  else if (cNorm.includes('villav')) ciudad = 'Villavicencio';
  else if (cNorm.includes('past')) ciudad = 'Pasto';
  else if (cNorm.includes('popay')) ciudad = 'Popayán';
  else if (!ciudad || ciudad.toLowerCase() === 'colombia') ciudad = 'Bogotá';

  let dirLimpia = direccion;
  if (dirLimpia.toLowerCase().endsWith(ciudad.toLowerCase())) {
    dirLimpia = dirLimpia.slice(0, -ciudad.length).replace(/,\s*$/, '').trim();
  }

  const nombreLimpio = (tienda.nombre_tienda || '')
    .replace(/Librer\?\?a/g, 'Librería')
    .replace(/Bogot\?\?/g, 'Bogotá');

  let desc = (tienda.descripcion || '').trim();
  if (!desc || desc.includes('??') || desc.toLowerCase().includes('en colombia')) {
    desc = `Librería asociada a BookyHome en ${ciudad}. Catálogo y novedades.`;
  }

  return {
    ciudad,
    direccion: dirLimpia,
    descripcion: desc,
    nombre: nombreLimpio
  };
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
                <div key={i} className="lib-card lib-card--skeleton" style={{ flexShrink: 0, width: '180px', height: '280px' }} />
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
                const { ciudad, direccion, descripcion, nombre } = parseTiendaInfo(tienda);
                return (
                  <button
                    key={tienda.id_tienda}
                    type="button"
                    className="lib-card"
                    onClick={() => handleVerTienda(tienda)}
                  >
                    <div className="lib-card__img">
                      <LogoTienda logoUrl={logoUrl} nombre={nombre} />
                    </div>
                    <div className="lib-card__body">
                      <div className="lib-card__main-info">
                        <span className="lib-card__ciudad">📍 {ciudad}</span>
                        <h3 className="lib-card__nombre" title={nombre}>
                          {nombre}
                        </h3>
                        {direccion && (
                          <p className="lib-card__direccion" title={direccion}>
                            {direccion}
                          </p>
                        )}
                        <p className="lib-card__desc" title={descripcion}>
                          {descripcion}
                        </p>
                      </div>

                      <div className="lib-card__footer">
                        <span className="lib-card__libros">
                          📚 {tienda.total_libros > 0 ? `${tienda.total_libros} ${tienda.total_libros === 1 ? 'libro' : 'libros'}` : '0 libros'}
                        </span>
                        {Number(tienda.calificacion_promedio) > 0 && (
                          <span style={{ fontSize: '0.76rem', fontWeight: 750, color: '#ca8a04', display: 'flex', alignItems: 'center', gap: '2px' }} title={`${Number(tienda.calificacion_promedio).toFixed(1)} ⭐ (${tienda.total_calificaciones || 0} opiniones)`}>
                            ⭐ {Number(tienda.calificacion_promedio).toFixed(1)}
                          </span>
                        )}
                      </div>
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
