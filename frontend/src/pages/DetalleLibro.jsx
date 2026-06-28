import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getLibroById, addToCart } from '../services/api';
import { notify } from '../components/ToastProvider';
import ResenaLibro from '../components/ResenaLibro';
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
      notify(`"${libro.titulo}" agregado al carrito ✓`, 'success');
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
              {cartLoading ? 'Agregando...' : libro.stock === 0 ? 'Sin stock' : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Agregar al carrito
                </>
              )}
            </button>

            <button onClick={toggleFavorito} className="btn-favorito">
              {esFavorito ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  Quitar de favoritos
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  Agregar a favoritos
                </>
              )}
            </button>
          </div>

          <div className="detalle-share">
            <button
              className="detalle-share-btn detalle-share-whatsapp"
              onClick={compartirWhatsApp}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              className="detalle-share-btn detalle-share-copiar"
              onClick={copiarEnlace}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Copiar enlace
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

      {/* SECCIÓN RESEÑAS */}
      {(() => {
        const token = localStorage.getItem('token');
        let userId = null;
        if (token) {
          try {
            const decoded = jwtDecode(token);
            userId = decoded.sub;
          } catch (error) {
            console.error('Error decodificando token:', error);
          }
        }
        return <ResenaLibro idLibro={libro.id_libro} idUsuario={userId ? parseInt(userId) : null} />;
      })()}
    </main>
  );
};

export default DetalleLibro;
