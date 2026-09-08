import { useEffect, useState, useMemo, useRef } from 'react';
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

const normalize = (str) =>
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Librerias() {
  const [tiendas, setTiendas]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [busqueda, setBusqueda]       = useState('');
  const [ciudad, setCiudad]           = useState('Todas');
  const [ordenarPor, setOrdenarPor]   = useState('mas_libros');
  const [soloConStock, setSoloConStock] = useState(false);
  const cityScrollRef                 = useRef(null);
  const navigate                      = useNavigate();

  useEffect(() => {
    api.get('/tiendas/destacadas?todas=true')
      .then(res => setTiendas(res.data || []))
      .catch(() => setTiendas([]))
      .finally(() => setLoading(false));
  }, []);

  const conteosCiudades = useMemo(() => {
    const counts = { 'Todas': tiendas.length };
    tiendas.forEach(t => {
      const { ciudad: c } = parseTiendaInfo(t);
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [tiendas]);

  const scrollCiudades = (dir) => {
    if (cityScrollRef.current) {
      cityScrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
    }
  };

  const filtradas = tiendas
    .filter(t => {
      const { ciudad: ciudadTienda, nombre } = parseTiendaInfo(t);
      const matchNombre = normalize(nombre).includes(normalize(busqueda));
      const matchCiudad = ciudad === 'Todas' || normalize(ciudadTienda).includes(normalize(ciudad));
      const matchStock = !soloConStock || ((t.total_libros || 0) > 0);
      return matchNombre && matchCiudad && matchStock;
    })
    .sort((a, b) => {
      if (ordenarPor === 'mas_libros') {
        return (b.total_libros || 0) - (a.total_libros || 0) || (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0);
      }
      if (ordenarPor === 'mejor_calificacion') {
        return (Number(b.calificacion_promedio) || 0) - (Number(a.calificacion_promedio) || 0) || (b.total_calificaciones || 0) - (a.total_calificaciones || 0) || (b.total_libros || 0) - (a.total_libros || 0);
      }
      if (ordenarPor === 'menos_libros') {
        return (a.total_libros || 0) - (b.total_libros || 0);
      }
      if (ordenarPor === 'nombre_asc') {
        const { nombre: nA } = parseTiendaInfo(a);
        const { nombre: nB } = parseTiendaInfo(b);
        return nA.localeCompare(nB);
      }
      if (ordenarPor === 'nombre_desc') {
        const { nombre: nA } = parseTiendaInfo(a);
        const { nombre: nB } = parseTiendaInfo(b);
        return nB.localeCompare(nA);
      }
      return 0;
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
              <span style={{ color: '#888', fontSize: '0.8rem', fontWeight: 600 }}>
                {filtradas.length} {filtradas.length === 1 ? 'librería encontrada' : 'librerías encontradas'}
              </span>
            )}
          </div>

          {/* Barra de Filtros y Orden */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {/* Buscador */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
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

            {/* Selector Ordenar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>
                Ordenar por:
              </span>
              <select
                value={ordenarPor}
                onChange={e => setOrdenarPor(e.target.value)}
                style={{
                  padding: '0.65rem 1rem',
                  border: '1.5px solid #e0dbd4',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: '#fff',
                  color: 'var(--gris-carbon)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="mas_libros">📚 Mayor cantidad de libros</option>
                <option value="mejor_calificacion">⭐ Mejor calificación</option>
                <option value="menos_libros">📖 Menor cantidad de libros</option>
                <option value="nombre_asc">🔤 Nombre: A - Z</option>
                <option value="nombre_desc">🔤 Nombre: Z - A</option>
              </select>
            </div>

            {/* Toggle Solo con Stock */}
            <button
              type="button"
              onClick={() => setSoloConStock(!soloConStock)}
              style={{
                padding: '0.65rem 0.95rem',
                borderRadius: '8px',
                border: soloConStock ? '1.5px solid var(--vinotinto)' : '1.5px solid #e0dbd4',
                background: soloConStock ? '#fdf2f4' : '#fff',
                color: soloConStock ? 'var(--vinotinto)' : '#666',
                fontSize: '0.82rem',
                fontWeight: soloConStock ? 700 : 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <span>{soloConStock ? '✅' : '⚪'}</span>
              <span>Solo con libros</span>
            </button>
          </div>

          {/* Filtros ciudad - Barra alineada al margen con scroll horizontal elegante */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => scrollCiudades(-1)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#fff', border: '1.5px solid #e0dbd4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, color: 'var(--gris-carbon)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }}
              aria-label="Desplazar ciudades a la izquierda"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div
              ref={cityScrollRef}
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                alignItems: 'center',
                flex: 1,
                padding: '2px 0',
              }}
            >
              {CIUDADES.map(c => {
                const isSelected = ciudad === c;
                const count = conteosCiudades[c] || 0;
                if (c !== 'Todas' && count === 0) return null;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCiudad(c)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.4rem 0.9rem',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid var(--vinotinto)' : '1.5px solid #e0dbd4',
                      background: isSelected ? 'var(--vinotinto)' : '#fff',
                      color: isSelected ? '#fff' : '#555',
                      fontFamily: 'inherit',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 750 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(122, 30, 58, 0.22)' : 'none',
                    }}
                  >
                    <span>{c}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(255,255,255,0.22)' : '#f0ece6',
                        color: isSelected ? '#fff' : '#666',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollCiudades(1)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#fff', border: '1.5px solid #e0dbd4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, color: 'var(--gris-carbon)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }}
              aria-label="Desplazar ciudades a la derecha"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="layout-container">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: '280px', borderRadius: '12px', background: 'linear-gradient(90deg,#f0ebe4 25%,#e8e0d8 50%,#f0ebe4 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🔍</p>
            <p style={{ fontWeight: 600, color: '#666' }}>No se encontraron librerías con ese filtro</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {filtradas.map(tienda => {
              const logoUrl = getLogoUrl(tienda.logo_url);
              const { ciudad: ciudadTienda, direccion: dirTienda, descripcion: descTienda, nombre: nombreTienda } = parseTiendaInfo(tienda);
              const calif = Number(tienda.calificacion_promedio) || 0;
              return (
                <button
                  key={tienda.id_tienda}
                  type="button"
                  className="lib-card"
                  onClick={() => navigate(`/tienda/${tienda.id_tienda}`)}
                >
                  {/* Imagen / Logo */}
                  <div className="lib-card__img">
                    <LogoTienda logoUrl={logoUrl} nombre={nombreTienda} />
                  </div>

                  {/* Info */}
                  <div className="lib-card__body">
                    <div className="lib-card__main-info">
                      <span className="lib-card__ciudad">
                        📍 {ciudadTienda}
                      </span>
                      <h3 className="lib-card__nombre" title={nombreTienda}>
                        {nombreTienda}
                      </h3>
                      {dirTienda && (
                        <p className="lib-card__direccion" title={dirTienda}>
                          {dirTienda}
                        </p>
                      )}
                      <p className="lib-card__desc" title={descTienda}>
                        {descTienda}
                      </p>
                    </div>

                    <div className="lib-card__footer">
                      <span className="lib-card__libros">
                        📚 {tienda.total_libros > 0 ? `${tienda.total_libros} ${tienda.total_libros === 1 ? 'libro' : 'libros'}` : '0 libros'}
                      </span>
                      {calif > 0 && (
                        <span style={{ fontSize: '0.76rem', fontWeight: 750, color: '#ca8a04', display: 'flex', alignItems: 'center', gap: '2px' }} title={`${calif} ⭐ (${tienda.total_calificaciones || 0} opiniones)`}>
                          ⭐ {calif.toFixed(1)}
                        </span>
                      )}
                    </div>
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
