// src/pages/Catalogo.jsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LibroCard from '../components/LibroCard';
import './Catalogo.css';

const Catalogo = () => {
  const [libros, setLibros] = useState([]);

  useEffect(() => {
    const cargarLibros = async () => {
      try {
        const response = await api.getStoredLibros();

        console.log("Datos recibidos:", response.data); // ← Agregado

        setLibros(response.data);
      } catch (error) {
        console.error("Error al cargar catálogo:", error);
      }
    };

    cargarLibros();
  }, []);

  return (
    <main className="catalogo-main">
      <h1>Catálogo de Libros</h1>

      <div className="catalogo-grid">
        {libros.map((libro) => (
          <LibroCard
            key={libro.id_libro}
            libro={libro}
          />
        ))}
      </div>
    </main>
  );
};

export default Catalogo;