import { useState } from "react";
import { IconBookOpen, IconFavorites } from "../Icons";

export default function SeccionFavoritos({ onGoToCatalog, onSetActiveSide }) {
  const [favoritos, setFavoritos] = useState(() =>
    JSON.parse(localStorage.getItem('favoritos')) || []
  );
  const IMAGENES_CATEGORIA = {
    'Fantasía': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',
    'Romance': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80',
    'Ciencia': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80',
    'Tecnología': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80',
    'Historia': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80',
    'Infantil': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    'Aventura': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80',
    'Terror': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80',
    'Biografía': 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',
    'Educación': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',
    'Arte': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
    'Comedia': 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80',
  };
  const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

  const obtenerImagen = (libro) => {
    if (libro?.imagen_url) return libro.imagen_url;
    if (libro?.imagen_principal) return libro.imagen_principal;
    if (libro?.imagenes?.[0]) return libro.imagenes[0];
    return IMAGENES_CATEGORIA[libro?.nombre_categoria] || IMG_DEFAULT;
  };

  const handleEliminarFavorito = (id_libro) => {
    const nuevos = favoritos.filter((f) => f.id_libro !== id_libro);
    localStorage.setItem('favoritos', JSON.stringify(nuevos));
    setFavoritos(nuevos);
  };

  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconFavorites width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Mis Favoritos</h2>
        </div>
      </div>
      {favoritos.length === 0 ? (
        <div className="empty-state">
          <p>No tienes libros en favoritos. ¡Agrega algunos desde el catálogo!</p>
          <button className="btn btn-vinotinto btn-catalog" onClick={onGoToCatalog} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
            Ir al catálogo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {favoritos.map((libro) => (
            <div 
              key={libro.id_libro}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                gap: '24px',
                padding: '24px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e0dbd4',
                boxShadow: 'var(--sombra-suave)'
              }}
            >
              <div>
                <img
                  src={obtenerImagen(libro)}
                  alt={libro.titulo}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {libro.nombre_categoria && (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#fce4ec',
                    color: '#8b0000',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    marginBottom: '8px',
                    width: 'fit-content'
                  }}>
                    {libro.nombre_categoria}
                  </span>
                )}
                <h2 style={{
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  margin: '0 0 4px 0',
                  lineHeight: '1.2',
                  color: '#2c2c2c'
                }}>
                  {libro.titulo}
                </h2>
                <p style={{
                  fontSize: '1rem',
                  color: '#666',
                  fontWeight: '600',
                  margin: '0 0 12px 0'
                }}>
                  {libro.autor_libro || libro.autor || 'Autor no disponible'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: '#faf8f6', borderRadius: '8px', border: '1px solid #e0dbd4' }}>
                    <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 4px 0' }}>Precio</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#8b0000', margin: 0 }}>
                      ${Number(libro.precio_libro || libro.precio || 0).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: '#faf8f6', borderRadius: '8px', border: '1px solid #e0dbd4' }}>
                    <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 4px 0' }}>Stock</p>
                    <p style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: libro.stock > 0 ? '#4caf50' : '#e53935', 
                      margin: 0 
                    }}>
                      {libro.stock > 0 ? `${libro.stock} disponibles` : 'Agotado'}
                    </p>
                  </div>
                  {libro.nombre_tienda && (
                    <div style={{ padding: '12px', background: '#faf8f6', borderRadius: '8px', border: '1px solid #e0dbd4' }}>
                      <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 4px 0' }}>Tienda</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>
                        {libro.nombre_tienda}
                      </p>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 8px 0', color: '#2c2c2c' }}>
                    Descripción
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#555',
                    lineHeight: '1.6',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {libro.descripcion_libro || 'Este libro es una excelente adición a tu colección. Escrito por un autor reconocido, ofrece una narrativa cautivadora que te mantendrá enganchado desde la primera página hasta la última.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onSetActiveSide('Catálogo')}
                    className="btn btn-vinotinto"
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '12px 24px',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}
                  >
                    Ver en catálogo
                  </button>
                  <button
                    onClick={() => handleEliminarFavorito(libro.id_libro)}
                    style={{
                      minWidth: '140px',
                      background: 'white',
                      color: '#e53935',
                      border: '2px solid #e53935',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Quitar de favoritos
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
