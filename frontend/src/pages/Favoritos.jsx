import React, { useEffect, useState } from 'react';
import LibroCard from '../components/LibroCard';

const Favoritos = () => {
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    const data =
      JSON.parse(localStorage.getItem('favoritos')) || [];

    setFavoritos(data);
  }, []);

  return (
    <main className="catalogo-main">

      <h1>❤️ Mis Favoritos</h1>

      <p className="total-libros">
        Total favoritos: {favoritos.length}
      </p>

      <div className="catalogo-grid">

        {favoritos.map((libro) => (
          <LibroCard
            key={libro.id_libro}
            libro={libro}
          />
        ))}

      </div>

    </main>
  );
};

export default Favoritos;