import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getStoredLibros, addToCart } from '../services/api';
import { notify } from '../components/ToastProvider';
import LibroCard from '../components/LibroCard';
import '../styles/catalogo.css';


const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [libros, setLibros]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busqueda, setBusqueda]         = useState(searchParams.get('q') || '');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [addingId, setAddingId]         = useState(null);

  useEffect(() => {
    const cargarLibros = async () => {
      try {
        const response = await getStoredLibros();
        setLibros(response.data);
      } catch (error) {
        console.error('Error al cargar catálogo:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarLibros();
  }, []);

  const categorias = [...new Set(libros.map((libro) => libro.nombre_categoria))];

  const librosFiltrados = libros.filter((libro) => {
    const query = busqueda.toLowerCase();
    const coincideBusqueda =
      (libro.titulo?.toLowerCase().includes(query)) ||
      (libro.autor_libro?.toLowerCase().includes(query)) ||
      (libro.nombre_categoria?.toLowerCase().includes(query));
    const coincideCategoria =
      categoriaSeleccionada === '' ||
      libro.nombre_categoria === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    setSearchParams(valor ? { q: valor } : {});
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
        id_libro:     libro.id_libro,
        cantidad:     1,
        titulo:       libro.titulo,
        autor_libro:  libro.autor_libro,
        precio_libro: libro.precio_libro,
        imagen:       libro.imagen_url || null,
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
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
        📚 Catálogo de libros
      </h1>

      {/* Barra de búsqueda y filtros */}
      <div className="barra-busqueda" style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por título, autor o categoría…"
          value={busqueda}
          onChange={handleBusquedaChange}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Contador de resultados */}
      {!loading && (
        <p style={{ fontSize: '0.82rem', color: '#999', margin: '12px 0 0' }}>
          {librosFiltrados.length === 0
            ? 'Sin resultados'
            : `Mostrando ${librosFiltrados.length} libro${librosFiltrados.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ marginTop: '40px', textAlign: 'center', color: '#999' }}>Cargando catálogo…</p>
      )}

      {/* Estado vacío */}
      {!loading && librosFiltrados.length === 0 && (
        <div className="catalogo-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h3>No encontramos libros</h3>
          <p>Intenta con otro término de búsqueda o categoría diferente.</p>
        </div>
      )}

      {/* Grid de libros */}
      {!loading && librosFiltrados.length > 0 && (
        <div className="catalogo-grid">
          {librosFiltrados.filter(Boolean).map((libro) => (
            <LibroCard
              key={libro.id_libro}
              libro={libro}
              onAdd={handleAddToCart}
              adding={addingId === libro.id_libro}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default Catalogo;