import React from 'react';

const LibroCard = ({ libro, onAdd, adding = false, message = '' }) => {
  const imageUrl = libro.imagen_url || libro.imagen_principal || libro.imagenes?.[0];
  const author = libro.autor_libro || libro.autor || 'Autor no disponible';
  const price = Number(libro.precio_libro ?? libro.precio ?? 0);
  const outOfStock = Number(libro.stock ?? 0) <= 0;

  return (
    <div className="libro-card">
      {imageUrl && (
        <img src={imageUrl} alt={libro.titulo} style={{ width: '100%' }} />
      )}

      <h3>{libro.titulo}</h3>
      <p className="autor">{author}</p>
      <p className="precio">$ {price.toLocaleString('es-CO')}</p>

      <button
        className="btn btn-vinotinto"
        onClick={() => onAdd?.(libro)}
        disabled={adding || outOfStock}
      >
        {outOfStock ? 'Sin stock' : adding ? 'Agregando...' : 'Agregar al carrito'}
      </button>

      {message && <p className="card-feedback">{message}</p>}
    </div>
  );
};

export default LibroCard;
