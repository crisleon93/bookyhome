import React, { useState, useEffect } from 'react';
import { agregarFavorito, eliminarFavorito, getApiBaseUrl, getFavoritos } from '../services/api';
import { notify } from './ToastProvider';

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

const categoriaClase = (categoria = '') => {
  const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (texto.includes('terror')) return 'categoria--terror';
  if (texto.includes('ciencia') || texto.includes('cientifica')) return 'categoria--ciencia';
  if (texto.includes('romance')) return 'categoria--romance';
  if (texto.includes('fantasia')) return 'categoria--fantasia';
  if (texto.includes('historia')) return 'categoria--historia';
  if (texto.includes('tecnologia')) return 'categoria--tecnologia';
  if (texto.includes('juvenil')) return 'categoria--juvenil';
  if (texto.includes('infantil')) return 'categoria--infantil';
  if (texto.includes('aventura')) return 'categoria--aventura';
  if (texto.includes('arte')) return 'categoria--arte';
  if (texto.includes('biografia')) return 'categoria--biografia';
  if (texto.includes('educacion')) return 'categoria--educacion';
  return 'categoria--general';
};

const resolveImageUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${getApiBaseUrl()}${trimmed}`;
  return `${getApiBaseUrl()}/${trimmed}`;
};

const resolveLibroCandidate = (candidate) => {
  if (!candidate) return null;
  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const resolved = resolveImageUrl(item);
      if (resolved) return resolved;
    }
    return null;
  }
  if (typeof candidate === "string" && candidate.includes(",")) {
    for (const part of candidate.split(",")) {
      const resolved = resolveImageUrl(part);
      if (resolved) return resolved;
    }
    return null;
  }
  return resolveImageUrl(candidate);
};

const VINOTINTO = '#7A1E3A';
const VINOTINTO2 = '#9B2648';

const categoriaColor = (categoria = '') => {
  const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (texto.includes('terror')) return { bg: '#eee8f7', color: '#603a92' };
  if (texto.includes('ciencia') || texto.includes('cientifica')) return { bg: '#e4f5e9', color: '#1f7a45' };
  if (texto.includes('romance')) return { bg: '#fde8ef', color: '#b4235d' };
  if (texto.includes('fantasia')) return { bg: '#e9edff', color: '#4156a6' };
  if (texto.includes('historia')) return { bg: '#f8eddb', color: '#8c5a1d' };
  if (texto.includes('tecnologia')) return { bg: '#e2f4f6', color: '#137783' };
  if (texto.includes('juvenil')) return { bg: '#fff2d7', color: '#a25d00' };
  if (texto.includes('infantil')) return { bg: '#e4f4ff', color: '#2775a7' };
  if (texto.includes('aventura')) return { bg: '#fff0df', color: '#b85f11' };
  if (texto.includes('arte')) return { bg: '#f4e6f6', color: '#86418f' };
  if (texto.includes('biografia')) return { bg: '#e8eef8', color: '#365d96' };
  if (texto.includes('educacion')) return { bg: '#e8f3e9', color: '#397542' };
  if (texto.includes('ficcion')) return { bg: '#fce4ec', color: '#8b0000' };
  return { bg: '#f4eef0', color: '#7a1e3a' };
};

const LibroCard = ({ libro, onVerDetalles }) => {
  const [enFavoritos, setEnFavoritos] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

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

    cargarEstado();
  }, [libro]);

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
        background: 'white',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #e8e2d9',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        height: '100%',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'; }}
    >
      {/* Portada */}
      <div style={{ height: 180, background: `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO2} 100%)`, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
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
        
        {/* Badge estado */}
        {outOfStock && (
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
        )}
        
        {/* Botón favoritos superpuesto */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleListaDeseos(); }}
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

      {/* Info */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Categoría */}
        {categoria && (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '12px',
            background: categoriaColor(categoria).bg,
            color: categoriaColor(categoria).color,
            fontSize: '0.65rem',
            fontWeight: '700',
            marginBottom: '6px',
            alignSelf: 'flex-start',
          }}>
            {categoria}
          </span>
        )}

        <p style={{
          margin: '0 0 4px 0',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#1a1a1a',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.3,
          minHeight: '2.6em',
        }}>{libro.titulo}</p>
        
        {/* Autor con icono */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 8px 0', overflow: 'hidden' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9b8ea0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
            {author}
          </p>
        </div>

        {/* Calificación y disponibilidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {calificacionTienda > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: '#666' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              {calificacionTienda.toFixed(1)}
              {totalOpinionesTienda > 0 && <span style={{ fontSize: '0.65rem', color: '#999' }}>({totalOpinionesTienda})</span>}
            </span>
          )}
          
          <span style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '2px', 
            fontSize: '0.65rem',
            fontWeight: 600,
            color: outOfStock ? '#dc2626' : '#16a34a',
          }}>
            {outOfStock ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {outOfStock ? 'Sin stock' : 'Disponible'}
          </span>
        </div>

        <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: VINOTINTO }}>
          ${price.toLocaleString('es-CO')}
        </p>
        
        {libro.nombre_tienda && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 8px 0', overflow: 'hidden' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7A1E3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#7A1E3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, opacity: 0.8 }}>
              {libro.nombre_tienda}
            </p>
          </div>
        )}

        {/* Botón Ver detalles - siempre al fondo */}
        <button
          onClick={() => onVerDetalles && onVerDetalles(libro)}
          style={{
            width: '100%',
            marginTop: 'auto',
            padding: '10px 12px',
            background: VINOTINTO,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = VINOTINTO2; }}
          onMouseLeave={e => { e.currentTarget.style.background = VINOTINTO; }}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default LibroCard;