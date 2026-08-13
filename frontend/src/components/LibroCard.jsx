import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, getListasDeseos, agregarLibroListaDeseos, eliminarLibroListaDeseos } from '../services/api';
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

const LibroCard = ({ libro, onAdd, onVerDetalles }) => {
  const [addMsg, setAddMsg] = useState('');
  const [enListaDeseos, setEnListaDeseos] = useState(false);
  const [listaDeseosId, setListaDeseosId] = useState(null);
  const [mostrarSelectorLista, setMostrarSelectorLista] = useState(false);
  const [listasDisponibles, setListasDisponibles] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const calificacionTienda = libro?.calificacion_tienda || 0;
  const totalOpinionesTienda = libro?.total_opiniones_tienda || 0;

  useEffect(() => {
    if (!libro?.id_libro) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const cargarEstado = async () => {
      try {
        const res = await getListasDeseos();
        const listas = res.data || [];
        for (const lista of listas) {
          const librosRes = await import('../services/api').then((m) => m.getLibrosListaDeseos(lista.id_lista));
          const libros = librosRes.data || [];
          const encontrado = libros.find((item) => item.id_libro === libro.id_libro);
          if (encontrado) {
            setEnListaDeseos(true);
            setListaDeseosId(lista.id_lista);
            break;
          }
        }
      } catch {
        // Sin listas o sin sesión válida
      }
    };

    cargarEstado();
  }, [libro]);

  const cargarListas = async () => {
    const res = await getListasDeseos();
    return res.data || [];
  };

  const agregarALista = async (idLista) => {
    setWishlistLoading(true);
    try {
      await agregarLibroListaDeseos(idLista, { id_libro: libro.id_libro });
      setEnListaDeseos(true);
      setListaDeseosId(idLista);
      setMostrarSelectorLista(false);
      notify('Libro agregado a la lista de deseos', 'success');
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo agregar a la lista';
      notify(msg, 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const quitarDeLista = async () => {
    if (!listaDeseosId) return;
    setWishlistLoading(true);
    try {
      await eliminarLibroListaDeseos(listaDeseosId, libro.id_libro);
      setEnListaDeseos(false);
      setListaDeseosId(null);
      notify('Libro eliminado de la lista', 'success');
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

    if (enListaDeseos) {
      await quitarDeLista();
      return;
    }

    setWishlistLoading(true);
    try {
      const listas = await cargarListas();
      if (listas.length === 0) {
        notify('Crea una lista de deseos desde tu dashboard primero', 'error');
        return;
      }
      if (listas.length === 1) {
        await agregarALista(listas[0].id_lista);
        return;
      }
      setListasDisponibles(listas);
      setMostrarSelectorLista(true);
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudieron cargar las listas', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (!libro) return null;

  const imageUrl =
    resolveLibroCandidate(libro.imagen_url) ||
    resolveLibroCandidate(libro.imagen_principal) ||
    resolveLibroCandidate(libro.imagenes) ||
    IMAGENES_CATEGORIA[libro.nombre_categoria] ||
    IMG_DEFAULT;

  const author    = libro.autor_libro || libro.autor || 'Autor no disponible';
  const price     = Number(libro.precio_libro ?? libro.precio ?? 0);
  const outOfStock = Number(libro.stock ?? 0) <= 0;
  const categoria  = libro.nombre_categoria || '';

  return (
    <div className="libro-card">
      <img
        className="libro-card-img"
        src={imageUrl}
        alt={libro.titulo}
        loading="lazy"
      />

      <div className="libro-card-body">
        {categoria && (
          <span className="categoria-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            {categoria}
          </span>
        )}

        <h3>{libro.titulo}</h3>
        <p className="autor">{author}</p>

        {libro.nombre_tienda && (
          <p className="tienda">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {libro.nombre_tienda}
          </p>
        )}

        {calificacionTienda > 0 && (
          <p className="calificacion-tienda">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            {calificacionTienda.toFixed(1)}
            {totalOpinionesTienda > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '4px' }}>
                ({totalOpinionesTienda})
              </span>
            )}
          </p>
        )}

        <p className="disponibilidad">
          {outOfStock ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
          {outOfStock ? ' Sin stock' : ' Disponible'}
        </p>

        <p className="precio">${price.toLocaleString('es-CO')}</p>

        <button
          className="btn btn-vinotinto"
          onClick={() => onVerDetalles && onVerDetalles(libro)}
          style={{ marginTop: 'auto' }}
        >
          Ver detalles
        </button>

        <button
          onClick={toggleListaDeseos}
          disabled={wishlistLoading}
          style={{
            width: '100%',
            padding: '8px',
            border: '1.5px solid #7A1E3A',
            background: 'white',
            color: '#7A1E3A',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: wishlistLoading ? 'not-allowed' : 'pointer',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            opacity: wishlistLoading ? 0.7 : 1,
          }}
        >
          {wishlistLoading ? 'Procesando…' : enListaDeseos ? '♥ En lista' : '♡ Lista de deseos'}
        </button>

        {mostrarSelectorLista && (
          <div style={{ marginTop: '8px', padding: '10px', border: '1px solid #e0dbd4', borderRadius: '8px', background: '#faf8f6' }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: '#444' }}>Elegir lista</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {listasDisponibles.map((lista) => (
                <button
                  key={lista.id_lista}
                  type="button"
                  onClick={() => agregarALista(lista.id_lista)}
                  disabled={wishlistLoading}
                  style={{
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {lista.nombre_lista}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMostrarSelectorLista(false)}
              style={{ marginTop: '8px', background: 'none', border: 'none', color: '#666', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        )}

        {addMsg && <p className="card-feedback">{addMsg}</p>}
      </div>
    </div>
  );
};

export default LibroCard;
