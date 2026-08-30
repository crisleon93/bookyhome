import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const VINOTINTO = '#7A1E3A';
const VINOTINTO2 = '#9B2648';

const IMAGENES_CAT = {
  'Fantasía':    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',
  'Romance':     'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80',
  'Ciencia':     'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80',
  'Tecnología':  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80',
  'Historia':    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80',
  'Infantil':    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
  'Aventura':    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80',
  'Arte':        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
  'Biografía':   'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',
};
const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

function resolveImg(value) {
  if (!value || typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return `${BASE_URL}/${t.replace(/^\//, '')}`;
}

function getImgSrc(libro) {
  const candidates = [libro.imagen_url, libro.imagen_principal, libro.imagen];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string' && c.includes(',')) {
      for (const part of c.split(',')) {
        const r = resolveImg(part.trim());
        if (r) return r;
      }
    }
    const r = resolveImg(c);
    if (r) return r;
  }
  return IMAGENES_CAT[libro.nombre_categoria] || IMG_DEFAULT;
}

const categoriaColor = (cat = '') => {
  const t = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (t.includes('terror'))    return { bg: '#eee8f7', color: '#603a92' };
  if (t.includes('ciencia'))   return { bg: '#e4f5e9', color: '#1f7a45' };
  if (t.includes('romance'))   return { bg: '#fde8ef', color: '#b4235d' };
  if (t.includes('fantasia'))  return { bg: '#e9edff', color: '#4156a6' };
  if (t.includes('historia'))  return { bg: '#f8eddb', color: '#8c5a1d' };
  if (t.includes('tecnologia'))return { bg: '#e2f4f6', color: '#137783' };
  if (t.includes('infantil'))  return { bg: '#e4f4ff', color: '#2775a7' };
  if (t.includes('aventura'))  return { bg: '#fff0df', color: '#b85f11' };
  if (t.includes('arte'))      return { bg: '#f4e6f6', color: '#86418f' };
  if (t.includes('biografia')) return { bg: '#e8eef8', color: '#365d96' };
  return { bg: '#f4eef0', color: VINOTINTO };
};

/* ── Skeleton card ─────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bkh-pubcard bkh-pubcard--skeleton">
      <div className="bkh-pubcard__img bkh-pubcard__img--skeleton" />
      <div className="bkh-pubcard__body">
        <div className="bkh-skeleton-line" style={{ width: '60%', height: 10, marginBottom: 6 }} />
        <div className="bkh-skeleton-line" style={{ width: '90%', height: 12, marginBottom: 4 }} />
        <div className="bkh-skeleton-line" style={{ width: '70%', height: 10, marginBottom: 10 }} />
        <div className="bkh-skeleton-line" style={{ width: '40%', height: 14 }} />
      </div>
    </div>
  );
}

/* ── Card individual ───────────────────────────────────────────────── */
function BookCard({ libro, onVerDetalles }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = getImgSrc(libro);
  const price   = Number(libro.precio_libro ?? libro.precio ?? 0);
  const cat     = libro.nombre_categoria || '';
  const catColors = categoriaColor(cat);
  const rating  = libro.calificacion_tienda || 0;
  const outOfStock = Number(libro.stock ?? 1) <= 0;

  return (
    <div
      className="bkh-pubcard"
      onClick={() => onVerDetalles && onVerDetalles(libro)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onVerDetalles && onVerDetalles(libro)}
    >
      {/* Portada */}
      <div className="bkh-pubcard__img">
        {!imgError ? (
          <img
            src={imgSrc}
            alt={libro.titulo}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="bkh-pubcard__img-fallback">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="1.2" width="36" height="36">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
        {outOfStock && <span className="bkh-pubcard__badge bkh-pubcard__badge--stock">Sin stock</span>}
      </div>

      {/* Info */}
      <div className="bkh-pubcard__body">
        {cat && (
          <span className="bkh-pubcard__cat" style={{ background: catColors.bg, color: catColors.color }}>
            {cat}
          </span>
        )}
        <p className="bkh-pubcard__title">{libro.titulo}</p>
        <p className="bkh-pubcard__author">{libro.autor_libro || libro.autor || '—'}</p>

        {rating > 0 && (
          <span className="bkh-pubcard__rating">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {rating.toFixed(1)}
          </span>
        )}

        <p className="bkh-pubcard__price">${price.toLocaleString('es-CO')}</p>

        {libro.nombre_tienda && (
          <p className="bkh-pubcard__store">{libro.nombre_tienda}</p>
        )}
      </div>
    </div>
  );
}

/* ── Carrusel con flechas ──────────────────────────────────────────── */
function Carrusel({ libros, loading, onVerDetalles }) {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 880, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="bkh-carrusel__track" style={{ overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!libros.length) return null;

  return (
    <div className="bkh-carrusel__wrap">
      <button
        className="bkh-carrusel__arrow bkh-carrusel__arrow--left"
        onClick={() => scroll(-1)}
        aria-label="Anterior"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div ref={ref} className="bkh-carrusel__track">
        {libros.map(l => (
          <BookCard key={l.id_libro} libro={l} onVerDetalles={onVerDetalles} />
        ))}
      </div>

      <button
        className="bkh-carrusel__arrow bkh-carrusel__arrow--right"
        onClick={() => scroll(1)}
        aria-label="Siguiente"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

/* ── Sección con encabezado ────────────────────────────────────────── */
function SeccionCarrusel({ emoji, titulo, subtitulo, accentColor, libros, loading, onVerDetalles, onVerTodos }) {
  return (
    <div className="bkh-sec">
      <div className="bkh-sec__head">
        <div>
          <h2 className="bkh-sec__title">
            <span className="bkh-sec__emoji">{emoji}</span>
            {titulo}
          </h2>
          {subtitulo && <p className="bkh-sec__sub">{subtitulo}</p>}
        </div>
        <button className="bkh-sec__link" onClick={onVerTodos} style={{ color: accentColor }}>
          Ver todos →
        </button>
      </div>
      <Carrusel libros={libros} loading={loading} onVerDetalles={onVerDetalles} />
    </div>
  );
}

/* ── Componente principal exportado ───────────────────────────────── */
export default function CarruselPublico({ onVerDetalles }) {
  const navigate = useNavigate();

  const [secciones, setSecciones] = useState({
    recientes:   { libros: [], loading: true },
    populares:   { libros: [], loading: true },
    calificados: { libros: [], loading: true },
    economicos:  { libros: [], loading: true },
  });

  const fetchSeccion = async (key, params) => {
    try {
      const res = await api.get('/catalogo/busqueda-avanzada', { params: { limite: 12, ...params } });
      const libros = res.data?.libros || res.data || [];
      setSecciones(prev => ({ ...prev, [key]: { libros, loading: false } }));
    } catch {
      setSecciones(prev => ({ ...prev, [key]: { libros: [], loading: false } }));
    }
  };

  useEffect(() => {
    fetchSeccion('recientes',   { ordenar_por: 'recientes',   pagina: 1 });
    fetchSeccion('populares',   { ordenar_por: 'relevancia',  pagina: 1 });
    fetchSeccion('calificados', { ordenar_por: 'calificacion',pagina: 1 });
    fetchSeccion('economicos',  { ordenar_por: 'precio_asc',  pagina: 1 });
  }, []);

  const irACatalogo = (params) => navigate(`/catalogo?${new URLSearchParams(params).toString()}`);

  const handleVerDetalles = (libro) => {
    if (onVerDetalles) {
      onVerDetalles(libro);
    } else {
      navigate(`/catalogo?q=${encodeURIComponent(libro.titulo)}`);
    }
  };

  return (
    <section className="bkh-carruseles">
      <div className="layout-container">

        <SeccionCarrusel
          emoji="🆕"
          titulo="Recién llegados"
          subtitulo="Los últimos títulos agregados al catálogo"
          accentColor={VINOTINTO}
          libros={secciones.recientes.libros}
          loading={secciones.recientes.loading}
          onVerDetalles={handleVerDetalles}
          onVerTodos={() => irACatalogo({ ordenar_por: 'recientes' })}
        />

        <SeccionCarrusel
          emoji="🔥"
          titulo="Los más populares"
          subtitulo="Lo que más están leyendo ahora mismo"
          accentColor="#e05c1a"
          libros={secciones.populares.libros}
          loading={secciones.populares.loading}
          onVerDetalles={handleVerDetalles}
          onVerTodos={() => irACatalogo({ ordenar_por: 'relevancia' })}
        />

        <SeccionCarrusel
          emoji="⭐"
          titulo="Mejor calificados"
          subtitulo="Los títulos con las mejores reseñas de lectores"
          accentColor="#b8860b"
          libros={secciones.calificados.libros}
          loading={secciones.calificados.loading}
          onVerDetalles={handleVerDetalles}
          onVerTodos={() => irACatalogo({ ordenar_por: 'calificacion' })}
        />

        <SeccionCarrusel
          emoji="💰"
          titulo="Desde los más económicos"
          subtitulo="Grandes lecturas sin gastar mucho"
          accentColor="#2e7d32"
          libros={secciones.economicos.libros}
          loading={secciones.economicos.loading}
          onVerDetalles={handleVerDetalles}
          onVerTodos={() => irACatalogo({ ordenar_por: 'precio_asc' })}
        />

      </div>
    </section>
  );
}
