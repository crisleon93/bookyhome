import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToCart, getStoredLibros } from '../services/api';
import LibroCard from '../components/LibroCard';
import './Catalogo.css';

const Catalogo = () => {
  const [libros, setLibros] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [messages, setMessages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const cargarLibros = async () => {
      try {
        const response = await getStoredLibros();
        setLibros(response.data);
      } catch (error) {
        console.error('Error al cargar catalogo:', error);
      }
    };

    cargarLibros();
  }, []);

  const handleAddToCart = async (libro) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setAddingId(libro.id_libro);
    setMessages((prev) => ({ ...prev, [libro.id_libro]: '' }));

    try {
      await addToCart({
        id_libro: libro.id_libro,
        cantidad: 1,
        titulo: libro.titulo,
        autor_libro: libro.autor_libro,
        precio_libro: libro.precio_libro,
        imagen: libro.imagen_url || libro.imagen_principal || libro.imagenes?.[0],
      });
      setMessages((prev) => ({ ...prev, [libro.id_libro]: 'Agregado al carrito' }));
    } catch (error) {
      setMessages((prev) => ({
        ...prev,
        [libro.id_libro]: error.response?.data?.detail || 'No se pudo agregar',
      }));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <main className="catalogo-main">
      <h1>Catalogo de Libros</h1>

      <div className="catalogo-grid">
        {libros.map((libro) => (
          <LibroCard
            key={libro.id_libro}
            libro={libro}
            onAdd={handleAddToCart}
            adding={addingId === libro.id_libro}
            message={messages[libro.id_libro]}
          />
        ))}
      </div>
    </main>
  );
};

export default Catalogo;
