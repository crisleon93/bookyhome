import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../services/api';

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

// Resolver URLs relativas a absolutas
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

const LibroCard = ({ libro, onAdd, adding = false, onVerDetalles }) => {
  const navigate = useNavigate();
  const [addMsg, setAddMsg] = useState('');
  const [esFavorito, setEsFavorito] = useState(false);

  // Verificar si el libro es favorito al montar
  useEffect(() => {
    if (!libro) return;
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const existe = favoritos.some((f) => f.id_libro === libro.id_libro);
    setEsFavorito(existe);
  }, [libro]);

  const toggleFavorito = () => {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const existe = favoritos.some((f) => f.id_libro === libro.id_libro);
    if (existe) {
      const nuevosFavoritos = favoritos.filter((f) => f.id_libro !== libro.id_libro);
      localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
      setEsFavorito(false);
    } else {
      favoritos.push(libro);
      localStorage.setItem('favoritos', JSON.stringify(favoritos));
      setEsFavorito(true);
    }
  };

  if (!libro) return null;

  // Imagen: preferir la real, caer en fallback por categoría
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

  const handleAdd = async () => {
    if (!onAdd) return;
    await onAdd(libro);
    setAddMsg('¡Agregado!');
    setTimeout(() => setAddMsg(''), 2000);
  };

  return (
    <div className="libro-card">
      {/* Imagen */}
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

        {/* Botón principal */}
        <button
          className="btn btn-vinotinto"
          onClick={() => onVerDetalles && onVerDetalles(libro)}
          style={{ marginTop: 'auto' }}
        >
          Ver detalles
        </button>

        {/* Botón favorito */}
        <button
          onClick={toggleFavorito}
          style={{
            width: '100%',
            padding: '8px',
            border: '1.5px solid #7A1E3A',
            background: 'white',
            color: '#7A1E3A',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          {esFavorito ? '♥ Quitar' : '♡ Favorito'}
        </button>

        {addMsg && <p className="card-feedback">{addMsg}</p>}
      </div>
    </div>
  );
};

export default LibroCard;
