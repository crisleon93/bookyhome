import React, { useState } from 'react';
import LibroCard from '../components/LibroCard';
import './Catalogo.css';

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
    <main className="catalogo-main">
      <h1>❤️ Mis Favoritos</h1>
      <p className="total-libros">Total: {favoritos.length} libro(s)</p>

      {favoritos.length === 0 ? (
        <p style={{ marginTop: '30px', color: '#666' }}>
          No tienes libros en favoritos. ¡Agrega algunos desde el catálogo!
        </p>
      ) : (
        <div className="catalogo-grid">
          {favoritos.map((libro) => (
            <div key={libro.id_libro}>
              <LibroCard libro={libro} />
              <button
                onClick={() => handleEliminar(libro.id_libro)}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  background: 'white',
                  border: '1px solid #e53935',
                  color: '#e53935',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                🗑 Eliminar de favoritos
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Favoritos;
