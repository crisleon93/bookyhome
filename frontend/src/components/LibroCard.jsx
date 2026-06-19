import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LibroCard = ({ libro, onAdd, adding = false, message = '' }) => {
  const navigate = useNavigate();
  const [favMsg, setFavMsg] = useState('');

  if (!libro) return null;

  const imageUrl = libro.imagen_url || libro.imagen_principal || libro.imagenes?.[0];
  const author = libro.autor_libro || libro.autor || 'Autor no disponible';
  const price = Number(libro.precio_libro ?? libro.precio ?? 0);
  const outOfStock = Number(libro.stock ?? 0) <= 0;
  const categoria = libro.nombre_categoria || '';

  const handleFavorito = () => {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const yaEsta = favoritos.some((f) => f.id_libro === libro.id_libro);
    if (!yaEsta) {
      favoritos.push(libro);
      localStorage.setItem('favoritos', JSON.stringify(favoritos));
      setFavMsg('✓ Agregado a favoritos');
    } else {
      setFavMsg('Ya está en favoritos');
    }
    setTimeout(() => setFavMsg(''), 2000);
  };

  return (
    <div className="libro-card">
      {imageUrl && (
        <img src={imageUrl} alt={libro.titulo} style={{ width: '100%' }} />
      )}

      {categoria && (
        <span className="categoria-badge">{categoria}</span>
      )}

      <h3>{libro.titulo}</h3>
      <p className="autor">{author}</p>

      <p className="disponibilidad">
        <span className={outOfStock ? 'punto-rojo' : 'punto-verde'}>●</span>
        {outOfStock ? ' Sin stock' : ' Disponible'}
      </p>

      {libro.nombre_tienda && (
        <p className="tienda">{libro.nombre_tienda}</p>
      )}

      <p className="precio">
        ${price.toLocaleString('es-CO')}
      </p>

      <button className="btn btn-favorito" onClick={handleFavorito}>
        ♥ Agregar favorito
      </button>

      {favMsg && <p className="card-feedback">{favMsg}</p>}

      <button
        className="btn btn-vinotinto"
        onClick={() => navigate(`/catalogo/${libro.id_libro}`)}
      >
        Ver detalles
      </button>

      {onAdd && (
        <button
          className="btn btn-outline"
          onClick={() => onAdd(libro)}
          disabled={adding || outOfStock}
          style={{ marginTop: '8px' }}
        >
          {outOfStock ? 'Sin stock' : adding ? 'Agregando...' : 'Agregar al carrito'}
        </button>
      )}

      {message && <p className="card-feedback">{message}</p>}
    </div>
  );
};

export default LibroCard;
