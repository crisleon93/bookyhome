import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLibroById } from '../services/api';
import './DetalleLibro.css';

const obtenerImagen = (categoria) => {
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
  return imagenes[categoria] || 'https://images.unsplash.com/photo-1512820790803-83ca734da794';
};

const DetalleLibro = () => {
  const { id } = useParams();
  const [libro, setLibro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [esFavorito, setEsFavorito] = useState(false);
  const [copiadoMsg, setCopiadoMsg] = useState('');

  useEffect(() => {
    cargarLibro();
  }, []);

  const cargarLibro = async () => {
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
  };

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

  if (loading) return <div className="detalle-loading">Cargando libro...</div>;
  if (!libro) return <div className="detalle-loading">Libro no encontrado</div>;

  return (
    <main className="detalle-container">
      <div className="detalle-card">
        <div className="detalle-imagen">
          <img src={obtenerImagen(libro.nombre_categoria)} alt={libro.titulo} />
        </div>

        <div className="detalle-info">
          <span className="detalle-categoria">{libro.nombre_categoria}</span>
          <h1>{libro.titulo}</h1>
          <div className="detalle-precio">
            ${Number(libro.precio_libro).toLocaleString('es-CO')}
          </div>
          <p className="detalle-dato"><strong>Autor:</strong> {libro.autor_libro}</p>
          <p className="detalle-dato"><strong>Tienda:</strong> {libro.nombre_tienda}</p>
          <p className="detalle-dato detalle-disponible">🟢 Disponible</p>

          <button onClick={toggleFavorito} className="btn-favorito">
            {esFavorito ? '❤️ Quitar favorito' : '🤍 Agregar favorito'}
          </button>

          <button className="btn-carrito">Agregar al carrito</button>

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={compartirWhatsApp}
              style={{
                background: '#25D366',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              📲 Compartir por WhatsApp
            </button>

            <button
              onClick={copiarEnlace}
              style={{
                background: 'white',
                color: 'var(--vinotinto)',
                border: '1px solid var(--vinotinto)',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              🔗 Copiar enlace
            </button>
          </div>

          {copiadoMsg && (
            <p style={{ color: 'green', marginTop: '8px', fontWeight: 600 }}>
              {copiadoMsg}
            </p>
          )}
        </div>
      </div>

      <section className="detalle-descripcion">
        <h2>Descripción</h2>
        <p>
          Descubre esta obra disponible en BookyHome.
          Encuentra libros de distintas categorías, autores y librerías registradas en la plataforma.
        </p>
      </section>
    </main>
  );
};

export default DetalleLibro;