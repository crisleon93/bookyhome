import React, { useState, useEffect } from 'react';
import { agregarFavorito, eliminarFavorito, getFavoritos, getOfertaActivaLibro } from '../services/api';
import { notify } from './ToastProvider';
import { categoriaColor, resolveLibroCandidate } from '../utils/catalogo';

const IMAGENES_CATEGORIA = {
  'Fantasía':    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',
  'Romance':     'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80',
  'Ciencia':     'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80',
  'Tecnología':  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80',
  'Historia':    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80',
  'Infantil':    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
  'Aventura':    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80',
  'Terror':      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80',
  'Biografía':   'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',
  'Educación':   'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',
  'Arte':        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
  'Comedia':     'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80',
};
const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

const VINOTINTO = '#7A1E3A';
const VINOTINTO2 = '#9B2648';

const LibroCard = ({ libro, onVerDetalles, onToggleComparar, isComparando = false }) => {
  const [enFavoritos, setEnFavoritos] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [oferta, setOferta] = useState(libro?.oferta || null);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  // ── Lógica de imagen con fallback en cascada ──────────────────────
  // Fuente 1: URL almacenada en BD (Google Books por ISBN)
  // Fuente 2: Google Books construida desde isbn del objeto (si BD no lo tiene)
  // Fuente 3: Imagen genérica por categoría
  // Fuente 4: Imagen por defecto
  const isbn = libro.isbn || '';
  const googleBooksUrl = isbn
    ? `https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`
    : null;

  const initialImgSrc =
    resolveLibroCandidate(libro.imagen_url) ||
    resolveLibroCandidate(libro.imagen_principal) ||
    resolveLibroCandidate(libro.imagenes) ||
    resolveLibroCandidate(libro.imagen) ||
    googleBooksUrl ||
    IMAGENES_CATEGORIA[libro.nombre_categoria] ||
    IMG_DEFAULT;

  const [imgSrc, setImgSrc] = useState(initialImgSrc);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImgError = () => {
    const cat = libro.nombre_categoria || '';
    const catFallback = IMAGENES_CATEGORIA[cat] || IMG_DEFAULT;
    // Si la URL actual no es ya el fallback de categoría, intentar con él
    if (imgSrc !== catFallback && imgSrc !== IMG_DEFAULT) {
      setImgSrc(catFallback);
    } else {
      setImgFailed(true);
    }
  };
  // ─────────────────────────────────────────────────────────────────

  const calificacionTienda = libro?.calificacion_tienda || 0;
  const totalOpinionesTienda = libro?.total_opiniones_tienda || 0;

  useEffect(() => {
    if (!libro?.id_libro) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const cargarEstado = async () => {
      try {
        const res = await getFavoritos();
        setEnFavoritos((res.data || []).some((item) => item.id_libro === libro.id_libro));
      } catch {
        // Sin listas o sin sesión válida
      }
    };

    void cargarEstado();
  }, [libro]);

  useEffect(() => {
    if (!libro?.id_libro || libro.oferta) return;
    let cancel = false;
    getOfertaActivaLibro(libro.id_libro)
      .then((res) => {
        if (!cancel && res.data && res.data.id_oferta) {
          setOferta(res.data);
        }
      })
      .catch(() => {});
    return () => { cancel = true; };
  }, [libro?.id_libro, libro?.oferta]);

  const agregarAFavoritos = async () => {
    setWishlistLoading(true);
    try {
      await agregarFavorito(libro.id_libro);
      setEnFavoritos(true);
      notify('Libro agregado a favoritos', 'success');
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo agregar a la lista';
      notify(msg, 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const quitarDeFavoritos = async () => {
    setWishlistLoading(true);
    try {
      await eliminarFavorito(libro.id_libro);
      setEnFavoritos(false);
      notify('Libro eliminado de favoritos', 'success');
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo quitar de la lista';
      notify(msg, 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const toggleListaDeseos = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión para usar listas de deseos', 'error');
      return;
    }

    if (enFavoritos) {
      await quitarDeFavoritos();
      return;
    }

    await agregarAFavoritos();
  };

  if (!libro) return null;

  const author    = libro.autor_libro || libro.autor || 'Autor no disponible';
  const price     = Number(libro.precio_libro ?? libro.precio ?? 0);
  const outOfStock = Number(libro.stock ?? 0) <= 0;
  const categoria  = libro.nombre_categoria || '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: darkMode ? '#252525' : 'white',
        borderRadius: '10px',
        overflow: 'visible',
        border: `1px solid ${darkMode ? '#606060' : '#d8cec6'}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
        boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.38)' : '0 3px 10px rgba(36,27,31,0.1)',
        height: '100%',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = darkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = darkMode ? '0 4px 14px rgba(0,0,0,0.38)' : '0 3px 10px rgba(36,27,31,0.1)'; }}
    >
      {/* Portada */}
      <div style={{ height: 180, background: `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO2} 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '9px 9px 0 0', flexShrink: 0 }}>
        {!imgFailed ? (
          <img
            src={imgSrc}
            alt={libro.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={handleImgError}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.4,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="white" strokeWidth="1.2" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
        
        {/* Badge estado sin stock — dentro del overflow:hidden está bien */}
        {outOfStock ? (
          <span style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            fontSize: '0.65rem',
            padding: '2px 7px',
            borderRadius: '20px',
            fontWeight: 600
          }}>Sin stock</span>
        ) : oferta ? (
          <span style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
            color: 'white',
            fontSize: '0.68rem',
            padding: '3px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.45)',
            letterSpacing: '0.02em',
            zIndex: 2,
          }}>
            {(oferta.tipo_descuento || '').toLowerCase() === 'porcentaje'
              ? `-${Math.round(oferta.valor_descuento)}%`
              : 'OFERTA'}
          </span>
        ) : null}

        {/* Botón favoritos superpuesto */}
        <button
          onClick={(e) => { e.stopPropagation(); void toggleListaDeseos(); }}
          disabled={wishlistLoading}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: wishlistLoading ? 'not-allowed' : 'pointer',
            opacity: wishlistLoading ? 0.7 : 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          {wishlistLoading ? (
            <span style={{ fontSize: '0.8rem' }}>...</span>
          ) : enFavoritos ? (
            <span style={{ fontSize: '1.2rem', color: VINOTINTO }}>♥</span>
          ) : (
            <span style={{ fontSize: '1.2rem', color: '#666' }}>♡</span>
          )}
        </button>
      </div>

      {/* Badge impulsado — FUERA del overflow:hidden, superpuesto sobre la card */}
      {Boolean(libro.es_impulsado) && (() => {
        const tipo = libro.impulso_tipo || 'home';
        const config = {
          home:      { icon: '⭐', label: 'Destacado',    bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#78350f', shadow: 'rgba(251,191,36,0.45)', tooltip: 'Libro destacado en la página principal' },
          categoria: { icon: '🏷️', label: 'En categoría', bg: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', color: '#fff',    shadow: 'rgba(99,102,241,0.45)', tooltip: 'Aparece en el banner de su categoría' },
          libro_dia: { icon: '🔥', label: 'Libro del día', bg: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', color: '#fff',    shadow: 'rgba(239,68,68,0.45)',  tooltip: 'Seleccionado como Libro del Día' },
          email:     { icon: '📧', label: 'Recomendado',  bg: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', color: '#fff',    shadow: 'rgba(16,185,129,0.45)', tooltip: 'Recomendado por email a suscriptores' },
        };
        const c = config[tipo] || config.home;
        return (
          <span className="impulso-badge" style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: c.bg,
            color: c.color,
            fontSize: '0.62rem',
            padding: '3px 8px',
            borderRadius: '20px',
            fontWeight: 700,
            boxShadow: `0 2px 8px ${c.shadow}`,
            userSelect: 'none',
            letterSpacing: '0.02em',
            cursor: 'default',
          }}>
            <span style={{ fontSize: '0.78rem' }}>{c.icon}</span>
            {c.label}
          </span>
        );
      })()}

      {/* Info */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {categoria && (
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
            background: categoriaColor(categoria, darkMode, false).bg,
            color: categoriaColor(categoria, darkMode, false).color,
            fontSize: '0.65rem', fontWeight: '700', marginBottom: '6px', alignSelf: 'flex-start',
          }}>{categoria}</span>
        )}

        <p style={{
          margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 700,
          color: darkMode ? '#ececec' : '#1a1a1a',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: 1.3, minHeight: '2.6em',
        }}>{libro.titulo}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 8px 0', overflow: 'hidden' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#888' : '#9b8ea0'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <p style={{ margin: 0, fontSize: '0.74rem', color: darkMode ? '#c8c8c8' : '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
            {author}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {calificacionTienda > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: darkMode ? '#c8c8c8' : '#666' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              {calificacionTienda.toFixed(1)}
              {totalOpinionesTienda > 0 && <span style={{ fontSize: '0.65rem', color: '#999' }}>({totalOpinionesTienda})</span>}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem', fontWeight: 600, color: outOfStock ? '#f87171' : (darkMode ? '#4ade80' : '#16a34a') }}>
            {outOfStock ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
            {outOfStock ? 'Sin stock' : 'Disponible'}
          </span>
        </div>

        {oferta && Number(oferta.precio_descuento) < price ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '0 0 4px 0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#DC2626' }}>
              ${Math.round(oferta.precio_descuento).toLocaleString('es-CO')}
            </span>
            <span style={{ fontSize: '0.76rem', textDecoration: 'line-through', color: darkMode ? '#888' : '#9CA3AF', fontWeight: 600 }}>
              ${price.toLocaleString('es-CO')}
            </span>
            {(oferta.tipo_descuento || '').toLowerCase() === 'porcentaje' && (
              <span style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 800, background: '#FEE2E2', padding: '1px 5px', borderRadius: '4px' }}>
                -{Math.round(oferta.valor_descuento)}%
              </span>
            )}
          </div>
        ) : (
          <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: darkMode ? '#ff4f83' : VINOTINTO }}>
            ${price.toLocaleString('es-CO')}
          </p>
        )}
        
        {libro.nombre_tienda && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 8px 0', overflow: 'hidden' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7A1E3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p style={{ margin: 0, fontSize: '0.7rem', color: darkMode ? '#e05a7a' : '#7A1E3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, opacity: 0.9 }}>
              {libro.nombre_tienda}
            </p>
          </div>
        )}

        {/* Botones de Acción - uno abajo del otro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
          <button
            onClick={() => onVerDetalles && onVerDetalles(libro)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: VINOTINTO,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = VINOTINTO2; }}
            onMouseLeave={e => { e.currentTarget.style.background = VINOTINTO; }}
          >
            Ver detalles
          </button>
          {onToggleComparar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComparar(libro);
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                background: isComparando ? '#166534' : (darkMode ? '#303030' : '#F3F4F6'),
                color: isComparando ? '#FFFFFF' : (darkMode ? '#ECECEC' : '#374151'),
                border: isComparando ? '1.5px solid #166534' : `1.5px solid ${darkMode ? '#4A4A4A' : '#D1D5DB'}`,
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
              title={isComparando ? 'Quitar de la comparación' : 'Agregar a la comparación'}
            >
              <span>⇄</span>
              <span>{isComparando ? 'Comparando' : 'Comparar'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibroCard;