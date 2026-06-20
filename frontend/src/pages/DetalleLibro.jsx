import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLibroById, addToCart } from '../services/api';
import { notify } from '../components/ToastProvider';
import '../styles/detalle.css';


const obtenerImagen = (libro) => {
  if (libro?.imagen_url) return libro.imagen_url;
  const imagenes = {
    Fantasía: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176',
    Romance: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2',
    Ciencia: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564',
    Tecnología: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
    Historia: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1',
    Infantil: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
    Aventura: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    Terror: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c',
    Biografía: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353',
    Educación: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f',
    Arte: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b',
    Comedia: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f'
  };
  return imagenes[libro?.nombre_categoria] || 'https://images.unsplash.com/photo-1512820790803-83ca734da794';
};

const DetalleLibro = () => {
  const { id } = useParams();
  const [libro, setLibro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [esFavorito, setEsFavorito] = useState(false);
  const [copiadoMsg, setCopiadoMsg] = useState('');
  const [cartLoading, setCartLoading] = useState(false);

  const cargarLibro = useCallback(async () => {
    try {
      const response = await getLibroById(id);
      setLibro(response.data);
      const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
      const existe = favoritos.some((f) => f.id_libro === response.data.id_libro);
      setEsFavorito(existe);
    } catch (error) {
      console.error('Error cargando libro:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarLibro();
  }, [cargarLibro]);

  const toggleFavorito = () => {
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const existe = favoritos.some((f) => f.id_libro === libro.id_libro);
    if (existe) {
      favoritos = favoritos.filter((f) => f.id_libro !== libro.id_libro);
      setEsFavorito(false);
    } else {
      favoritos.push(libro);
      setEsFavorito(true);
    }
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  };

  const compartirWhatsApp = () => {
    const url = window.location.href;
    const texto = `¡Mira este libro en BookyHome! "${libro.titulo}" de ${libro.autor_libro} - ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiadoMsg('¡Enlace copiado!');
      setTimeout(() => setCopiadoMsg(''), 2000);
    });
  };

  const handleAgregarCarrito = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión para agregar al carrito', 'error');
      return;
    }
    setCartLoading(true);
    try {
      await addToCart({
        id_libro:    libro.id_libro,
        cantidad:    1,
        titulo:      libro.titulo,
        autor_libro: libro.autor_libro,
        precio_libro: libro.precio_libro,
        imagen:      libro.imagen_url || obtenerImagen(libro),
      });
      notify(`"​${libro.titulo}" agregado al carrito ✓`, 'success');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo agregar al carrito';
      notify(msg, 'error');
    } finally {
      setCartLoading(false);
    }
  };

  if (loading) return <div className="detalle-loading">Cargando libro...</div>;
  if (!libro) return <div className="detalle-loading">Libro no encontrado</div>;

  return (
    <main className="layout-container detalle-container">
      <div className="detalle-card">
        <div className="detalle-imagen">
          <img src={obtenerImagen(libro)} alt={libro.titulo} />
        </div>

        <div className="detalle-info">
          <span className="detalle-categoria">{libro.nombre_categoria}</span>
          <h1>{libro.titulo}</h1>
          <div className="detalle-precio">
            ${Number(libro.precio_libro).toLocaleString('es-CO')}
          </div>
          <p className="detalle-dato"><strong>Autor:</strong> {libro.autor_libro}</p>
          <p className="detalle-dato"><strong>Tienda:</strong> {libro.nombre_tienda}</p>
          <p className="detalle-dato detalle-disponible">
            {libro.stock > 0 ? `🟢 Disponible (${libro.stock} en stock)` : '🔴 Sin stock'}
          </p>

          <div className="detalle-actions">
            <button
              className="btn-carrito"
              onClick={handleAgregarCarrito}
              disabled={cartLoading || libro.stock === 0}
            >
              {cartLoading ? 'Agregando...' : libro.stock === 0 ? 'Sin stock' : '🛒 Agregar al carrito'}
            </button>

            <button onClick={toggleFavorito} className="btn-favorito">
              {esFavorito ? '❤️ Quitar de favoritos' : '🤍 Agregar a favoritos'}
            </button>
          </div>

          <div className="detalle-share">
            <button
              className="detalle-share-btn detalle-share-whatsapp"
              onClick={compartirWhatsApp}
            >
              📲 WhatsApp
            </button>
            <button
              className="detalle-share-btn detalle-share-copiar"
              onClick={copiarEnlace}
            >
              🔗 Copiar enlace
            </button>
            {copiadoMsg && <span className="detalle-share-copiado">{copiadoMsg}</span>}
          </div>
        </div>
      </div>

      <section className="detalle-descripcion">
        <h2>Descripción</h2>
        <p>
          {libro.descripcion_libro
            ? libro.descripcion_libro
            : 'Este libro no tiene una descripción disponible aún.'}
        </p>
      </section>
    </main>
  );
};

export default DetalleLibro;
