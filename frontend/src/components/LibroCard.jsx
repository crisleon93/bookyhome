import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const LibroCard = ({ libro, onAdd, adding = false }) => {
  const navigate = useNavigate();
  const [addMsg, setAddMsg] = useState('');

  if (!libro) return null;

  // Imagen: preferir la real, caer en fallback por categoría
  const imageUrl =
    libro.imagen_url ||
    libro.imagen_principal ||
    libro.imagenes?.[0] ||
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
        {categoria && <span className="categoria-badge">{categoria}</span>}

        <h3>{libro.titulo}</h3>
        <p className="autor">{author}</p>

        {libro.nombre_tienda && (
          <p className="tienda">📍 {libro.nombre_tienda}</p>
        )}

        <p className="disponibilidad">
          <span className={outOfStock ? 'punto-rojo' : 'punto-verde'}>●</span>
          {outOfStock ? ' Sin stock' : ' Disponible'}
        </p>

        <p className="precio">${price.toLocaleString('es-CO')}</p>

        {/* Botón principal */}
        <button
          className="btn btn-vinotinto"
          onClick={() => navigate(`/catalogo/${libro.id_libro}`)}
          style={{ marginTop: 'auto' }}
        >
          Ver detalles
        </button>

        {/* Botón secundario de carrito — solo si se pasa onAdd */}
        {onAdd && (
          <button
            className="btn btn-outline"
            onClick={handleAdd}
            disabled={adding || outOfStock}
            style={{ marginTop: '6px' }}
          >
            {outOfStock ? 'Sin stock' : adding ? 'Agregando…' : '🛒 Al carrito'}
          </button>
        )}

        {addMsg && <p className="card-feedback">{addMsg}</p>}
      </div>
    </div>
  );
};

export default LibroCard;
