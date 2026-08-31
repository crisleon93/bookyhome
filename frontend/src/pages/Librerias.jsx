import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getApiBaseUrl } from '../services/api';

const BASE_URL = getApiBaseUrl();

const CIUDADES = [
  'Todas', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Santa Marta', 'Bucaramanga', 'Pereira', 'Manizales', 'Armenia',
  'Ibagué', 'Neiva', 'Villavicencio', 'Pasto',
];

function getLogoUrl(logo_url) {
  if (!logo_url) return null;
  if (logo_url.startsWith('http')) return logo_url;
  return `${BASE_URL}${logo_url}`;
}

function LogoTienda({ logoUrl, nombre }) {
  const [err, setErr] = useState(false);
  const partes = (nombre || '').trim().split(/\s+/);
  const ini = partes.length >= 2 ? partes[0][0] + partes[1][0] : (nombre || '').substring(0, 2);
  if (!logoUrl || err) {
    return (
      <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', userSelect: 'none' }}>
        {ini.toUpperCase()}
      </span>
    );
  }
  return <img src={logoUrl} alt={nombre} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

const normalize = (str) =>
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Librerias() {
  const [tiendas, setTiendas]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [ciudad, setCiudad]     = useState('Todas');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tiendas/destacadas?limit=100')
      .then(res => setTiendas(res.data || []))
      .catch(() => setTiendas([]))
      .finally(() => setLoading(false));
  }, []);

  const filtradas = tiendas.filter(t => {
    const matchNombre = normalize(t.nombre_tienda).includes(normalize(busqueda));
    const ciudadTienda = normalize(t.ciudad_origen || '') || normalize((t.direccion || '').split(',').pop());
    const matchCiudad = ciudad === 'Todas' || ciudadTienda.includes(normalize(ciudad));
    return matchNombre && matchCiudad;
  });

  return (
    <main style={{ background: 'var(--beige)', minHeight: '80vh', paddingBottom: '4rem' }}>

      {/* Header */}
      <div style={{ padding: '3rem 0 2rem' }}>
        <div className="layout-container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ color: 'var(--gris-carbon)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>🏪</span> Librerías en BookyHome
              </h1>
              <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>
                Vendedores verificados con catálogo activo
              </p>
            </div>
            {!loading && (
              <span style={{ color: '#888', fontSize: '0.8rem' }}>
                {filtradas.length} {filtradas.length === 1 ? 'librería' : 'librerías'}
              </span>
            )}
          </div>

          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar librería por nombre..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem',
                border: '1.5px solid #e0dbd4', borderRadius: '8px',
                fontFamily: 'inherit', fontSize: '0.88rem',
                background: '#fff', color: 'var(--gris-carbon)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filtros ciudad */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CIUDADES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCiudad(c)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  border: ciudad === c ? '2px solid var(--vinotinto)' : '1.5px solid #e0dbd4',
                  background: ciudad === c ? 'var(--vinotinto)' : '#fff',
                  color: ciudad === c ? '#fff' : '#666',
                  fontFamily: 'inherit', fontSize: '0.76rem',
                  fontWeight: ciudad === c ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="layout-container">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '14px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: '240px', borderRadius: '12px', background: 'linear-gradient(90deg,#f0ebe4 25%,#e8e0d8 50%,#f0ebe4 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🔍</p>
            <p style={{ fontWeight: 600, color: '#666' }}>No se encontraron librerías con ese filtro</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '14px' }}>
            {filtradas.map(tienda => {
              const logoUrl = getLogoUrl(tienda.logo_url);
              const ciudadTienda = tienda.ciudad_origen || (tienda.direccion || '').split(',').pop()?.trim() || 'Colombia';
              return (
                <button
                  key={tienda.id_tienda}
                  type="button"
                  className="lib-card"
                  onClick={() => navigate(`/tienda/${tienda.id_tienda}`)}
                >
                  {/* Imagen / Logo */}
                  <div className="lib-card__img">
                    <LogoTienda logoUrl={logoUrl} nombre={tienda.nombre_tienda} />
                  </div>

                  {/* Info */}
                  <div className="lib-card__body">
                    <span className="lib-card__ciudad">{ciudadTienda}</span>
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
        )}
      </div>
    </main>
  );
}
