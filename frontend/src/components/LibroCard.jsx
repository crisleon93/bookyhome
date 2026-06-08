// src/components/LibroCard.jsx
import React from 'react';

const LibroCard = ({ libro }) => {
  return (
    <div className="libro-card">
      {/* Si tienes una imagen, se mostrará aquí */}
      {libro.imagen_url && (
        <img src={libro.imagen_url} alt={libro.titulo} style={{ width: '100%' }} />
      )}
      <h3>{libro.titulo}</h3>
      <p className="autor">{libro.autor}</p>
      <p className="precio">
        $ {Number(libro.precio).toLocaleString('es-CO')}
      </p>
      <button className="btn btn-vinotinto">Agregar al carrito</button>
    </div>
  );
};

export default LibroCard;