import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { addToCart } from '../services/api';
import { notify } from '../components/ToastProvider';
import FiltrosCatalogo from '../components/FiltrosCatalogo';
import LibroCard from '../components/LibroCard';
import '../styles/catalogo.css';


const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [addingId, setAddingId] = useState(null);

  const [filtros, setFiltros] = useState({
    q: searchParams.get('q') || '',
    categoria_id: null,
    precio_min: 0,
    precio_max: 1000000,
    calificacion_min: 0,
    disponible: true,
    ordenar_por: 'relevancia'
  });

  useEffect(() => {
    cargarLibros();
  }, [filtros, pagina]);

  const cargarLibros = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.q) params.append('q', filtros.q);
      if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
      if (filtros.precio_min) params.append('precio_min', filtros.precio_min);
      if (filtros.precio_max) params.append('precio_max', filtros.precio_max);
      if (filtros.calificacion_min) params.append('calificacion_min', filtros.calificacion_min);
      if (filtros.disponible) params.append('disponible', 'true');
      params.append('ordenar_por', filtros.ordenar_por);
      params.append('pagina', pagina);
      params.append('limite', 20);

      const response = await api.get(`/catalogo/busqueda-avanzada?${params}`);
      setLibros(response.data.libros || []);
      setTotalPaginas(response.data.total_paginas || 1);
      setPagina(response.data.pagina || 1);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      notify('Error al cargar el catálogo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPagina(1);
  };

  const handleAddToCart = async (libro) => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión para agregar al carrito', 'error');
      return;
    }
    setAddingId(libro.id_libro);
    try {
      await addToCart({
        id_libro: libro.id_libro,
        cantidad: 1,
        titulo: libro.titulo,
        autor_libro: libro.autor_libro,
        precio_libro: libro.precio_libro,
        imagen: libro.imagen_url || null,
      });
      notify(`"${libro.titulo}" agregado al carrito ✓`, 'success');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo agregar al carrito';
      notify(msg, 'error');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <main className="layout-container catalogo-main">
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>
        📚 Catálogo de libros
      </h1>

      {/* FILTROS AVANZADOS */}
      <FiltrosCatalogo 
        onFiltrosChange={handleFiltrosChange}
        filtrosActivos={filtros}
      />

      {/* RESULTADOS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          Cargando libros...
        </div>
      ) : libros.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: '#faf8f6',
          borderRadius: '12px',
          color: '#999'
        }}>
          <p>No se encontraron libros con los filtros seleccionados</p>
          <button 
            onClick={() => handleFiltrosChange({
              q: '',
              categoria_id: null,
              precio_min: 0,
              precio_max: 1000000,
              calificacion_min: 0,
              disponible: true,
              ordenar_por: 'relevancia'
            })}
            style={{
              background: 'var(--vinotinto)',
              color: 'white',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="libros-grid">
            {libros.map((libro) => (
              <LibroCard
                key={libro.id_libro}
                libro={libro}
                onAddToCart={handleAddToCart}
                isAdding={addingId === libro.id_libro}
              />
            ))}
          </div>

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="paginacion">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
                className="btn-paginacion"
              >
                ← Anterior
              </button>
              <span className="pagina-info">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(pagina + 1)}
                className="btn-paginacion"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Catalogo;