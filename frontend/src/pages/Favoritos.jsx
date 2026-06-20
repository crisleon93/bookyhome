import React, { useState } from 'react';
import LibroCard from '../components/LibroCard';
import '../styles/catalogo.css';

const Favoritos = () => {
  const [favoritos, setFavoritos] = useState(() => {
    const data = JSON.parse(localStorage.getItem('favoritos')) || [];
    return data;
  });

  const handleEliminar = (id_libro) => {
    const nuevos = favoritos.filter((f) => f.id_libro !== id_libro);
    setFavoritos(nuevos);
    localStorage.setItem('favoritos', JSON.stringify(nuevos));
  };

  return (
    <main className="layout-container catalogo-main">
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>❤️ Mis favoritos</h1>
      <p style={{ fontSize: '0.82rem', color: '#999', margin: '4px 0 16px' }}>
        {favoritos.length === 0 ? 'Aún no tienes favoritos' : `${favoritos.length} libro${favoritos.length !== 1 ? 's' : ''} guardado${favoritos.length !== 1 ? 's' : ''}`}
      </p>

      {favoritos.length === 0 ? (
        <div className="catalogo-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <h3>Sin favoritos aún</h3>
          <p>Agrega libros desde el catálogo tocando el corazón.</p>
        </div>
      ) : (
        <div className="catalogo-grid">
          {favoritos.map((libro) => (
            <div key={libro.id_libro}>
              <LibroCard libro={libro} />
              <button
                className="btn-quitar-favorito"
                onClick={() => handleEliminar(libro.id_libro)}
              >
                🗑 Quitar de favoritos
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Favoritos;
