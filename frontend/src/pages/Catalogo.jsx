import React, { useEffect, useState } from 'react';
import { getStoredLibros } from '../services/api';
import LibroCard from '../components/LibroCard';
import './Catalogo.css';

const Catalogo = () => {
  const [libros, setLibros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  useEffect(() => {
    const cargarLibros = async () => {
      try {
        const response = await getStoredLibros();
        setLibros(response.data);
      } catch (error) {
        console.error('Error al cargar catálogo:', error);
      }
    };
    cargarLibros();
  }, []);

  const categorias = [
    ...new Set(libros.map((libro) => libro.nombre_categoria))
  ];

  const librosFiltrados = libros.filter((libro) => {
    const coincideBusqueda =
      libro.titulo?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      categoriaSeleccionada === '' ||
      libro.nombre_categoria === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <main className="catalogo-main">
      <h1>📚 Catálogo de Libros</h1>
      <p className="total-libros">Descubre tu próxima lectura</p>

      <div className="barra-busqueda">
        <input
          type="text"
          placeholder="🔍 Buscar libros..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      <div className="catalogo-grid">
        {librosFiltrados.filter(Boolean).map((libro) => (
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