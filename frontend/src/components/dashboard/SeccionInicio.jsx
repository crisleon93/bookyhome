import { useState, useEffect, useRef } from "react";
import { IconBookOpen, IconFavorites, IconBook, IconChevronLeft } from "../Icons";
import CouponsList from "../CouponsList";
import { getStoredLibros, getOrdenes, getCuponesDisponibles } from "../../services/api";
import api from "../../services/api";

const VINOTINTO = '#7A1E3A';
const VINOTINTO2 = '#9B2648';
const BEIGE = '#F4EDE2';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function resolveImagen(imagen) {
  if (!imagen) return null;
  if (imagen.startsWith('http')) return imagen;
  return `${BASE_URL}/${imagen.replace(/^\//, '')}`;
}

function LibroCard({ libro, onClick }) {
  const imgSrc = resolveImagen(libro.imagen || libro.imagen_url);
  return (
    <div
      onClick={() => onClick && onClick(libro)}
      style={{
        width: 160, flexShrink: 0, background: 'white', borderRadius: '10px',
        overflow: 'hidden', border: '1px solid #e8e2d9', cursor: 'pointer',
        transition: 'all 0.15s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'; }}
    >
      {/* Portada */}
      <div style={{ height: 170, background: `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO2} 100%)`, position: 'relative', overflow: 'hidden' }}>
        {imgSrc ? (
          <img src={imgSrc} alt={libro.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBook width={44} height={44} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
        )}
        {/* Badge estado */}
        {libro.estado && libro.estado !== 'nuevo' && (
          <span style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(0,0,0,0.6)', color: 'white',
            fontSize: '0.65rem', padding: '2px 7px', borderRadius: '20px', fontWeight: 600,
          }}>{libro.estado}</span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        <p style={{
          margin: '0 0 3px 0', fontSize: '0.8rem', fontWeight: 700, color: '#1a1a1a',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3,
        }}>{libro.titulo}</p>
        <p style={{ margin: '0 0 6px 0', fontSize: '0.7rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {libro.autor_libro || '—'}
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: VINOTINTO }}>
          ${Number(libro.precio_libro ?? 0).toLocaleString('es-CO')}
        </p>
        {libro.nombre_tienda && (
          <p style={{ margin: '3px 0 0', fontSize: '0.65rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {libro.nombre_tienda}
          </p>
        )}
      </div>
    </div>
  );
}

function CarruselLibros({ libros, onVerLibro }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };
  return (
    <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: '4px' }}>
      {/* Flecha izquierda */}
      <button onClick={() => scroll(-1)} style={{
        position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
        zIndex: 2, background: 'white', border: '1px solid #ddd', borderRadius: '50%',
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <IconChevronLeft width={16} height={16} strokeWidth={2.5} style={{ color: '#444' }} />
      </button>
      {/* Carrusel */}
      <div ref={ref} style={{
        display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '0',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}
        className="carrusel-scroll"
      >
        {libros.map(libro => (
          <LibroCard key={libro.id_libro} libro={libro} onClick={onVerLibro} />
        ))}
      </div>
      {/* Flecha derecha */}
      <button onClick={() => scroll(1)} style={{
        position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%) rotate(180deg)',
        zIndex: 2, background: 'white', border: '1px solid #ddd', borderRadius: '50%',
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <IconChevronLeft width={16} height={16} strokeWidth={2.5} style={{ color: '#444' }} />
      </button>
    </div>
  );
}

export default function SeccionInicio({ userName, onGoToCatalog, onSelectSeccion, onVerDetalleLibro }) {
  const [novedades, setNovedades] = useState([]);
  const [ultimasCompras, setUltimasCompras] = useState([]);
  const [tieneCupones, setTieneCupones] = useState(false);
  const [loading, setLoading] = useState(true);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = userName?.split(' ')[0] || 'lector';

  useEffect(() => {
    // Novedades — todos los libros ordenados por recientes
    getStoredLibros()
      .then(res => setNovedades((res.data || []).slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Últimas compras
    getOrdenes()
      .then(res => {
        const orders = res.data?.orders || res.data || [];
        setUltimasCompras(orders.slice(0, 3));
      })
      .catch(() => {});

    // Cupones
    getCuponesDisponibles()
      .then(res => setTieneCupones((res.data || []).length > 0))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(135deg, ${VINOTINTO} 0%, #3a0d1a 100%)`,
        borderRadius: '14px', padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'white', position: 'relative', overflow: 'hidden', minHeight: 140,
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 120, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 2px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>{saludo},</p>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 800 }}>{nombre} 👋</h1>
          <p style={{ margin: '0 0 18px', color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', maxWidth: 380 }}>
            ¿Qué quieres leer hoy? Miles de títulos de las mejores librerías.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => onSelectSeccion('Catálogo')} style={{
              background: 'white', color: VINOTINTO, border: 'none',
              padding: '9px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}>Explorar catálogo</button>
            {tieneCupones && (
              <button onClick={() => onSelectSeccion('Notificaciones')} style={{
                background: 'rgba(255,255,255,0.12)', color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '9px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}>🎟️ Ver cupones</button>
            )}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBookOpen width={48} height={48} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
        </div>
      </section>

      {/* ── CUPONES ── */}
      {tieneCupones && (
        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#1a1a1a' }}>🎟️ Cupones disponibles</h2>
          <CouponsList />
        </section>
      )}

      {/* ── NOVEDADES ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1a1a' }}>📚 Recién llegados</h2>
          <button onClick={() => onSelectSeccion('Catálogo')} style={{ background: 'none', border: 'none', color: VINOTINTO, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
            Ver todos →
          </button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', gap: '12px', overflow: 'hidden' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ width: 160, flexShrink: 0, height: 240, background: '#f0ece6', borderRadius: '10px' }} />
            ))}
          </div>
        ) : novedades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', background: BEIGE, borderRadius: '12px', color: '#888', fontSize: '0.9rem' }}>
            No hay libros disponibles aún
          </div>
        ) : (
          <CarruselLibros libros={novedades} onVerLibro={(l) => { if (onVerDetalleLibro) { onVerDetalleLibro(l); } else { onSelectSeccion('Catálogo'); } }} />
        )}
      </section>

      {/* ── ÚLTIMAS COMPRAS ── */}
      {ultimasCompras.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1a1a' }}>🛍️ Tus últimas compras</h2>
            <button onClick={() => onSelectSeccion('Mis Compras')} style={{ background: 'none', border: 'none', color: VINOTINTO, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
              Ver todas →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ultimasCompras.map((orden, i) => {
              // Intentar obtener libros de diferentes estructuras posibles
              const libros = orden.libros || orden.items || orden.productos || orden.detalles || [];
              const primerLibro = Array.isArray(libros) && libros.length > 0 ? libros[0] : null;
              
              // Obtener imagen con múltiples fallbacks
              const libroImagen = primerLibro?.imagen_url || primerLibro?.imagen || primerLibro?.portada || 
                                primerLibro?.foto || orden.imagen || orden.portada || null;
              
              // Obtener título con múltiples fallbacks
              const libroTitulo = primerLibro?.titulo || primerLibro?.nombre_libro || 
                                primerLibro?.nombre || orden.titulo || orden.nombre_libro || 
                                (Array.isArray(libros) && libros.length > 0 ? `${libros.length} libro${libros.length > 1 ? 's' : ''}` : 'Compra');
              
              // Construir URL de imagen
              let imgSrc = null;
              if (libroImagen) {
                if (libroImagen.startsWith('http://') || libroImagen.startsWith('https://')) {
                  imgSrc = libroImagen;
                } else {
                  imgSrc = `${BASE_URL}/${libroImagen.replace(/^\//, '')}`;
                }
              }
              
              return (
                <div 
                  key={i} 
                  onClick={() => onSelectSeccion('Mis Compras')}
                  style={{
                    background: 'white', 
                    borderRadius: '12px', 
                    padding: '14px',
                    border: '1px solid #e8e2d9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                >
                  {/* Imagen o placeholder del libro */}
                  <div style={{ 
                    width: 60, 
                    height: 75, 
                    borderRadius: '8px', 
                    background: `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO2} 100%)`,
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {imgSrc ? (
                      <img 
                        src={imgSrc} 
                        alt={libroTitulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
                        <IconBook width={28} height={28} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.6)' }} />
                        {Array.isArray(libros) && libros.length > 0 && (
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: '4px' }}>
                            {libros.length}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Cantidad de libros */}
                    {Array.isArray(libros) && libros.length > 1 && (
                      <span style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '10px',
                      }}>
                        +{libros.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Información */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        color: '#1a1a1a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {libroTitulo}
                      </p>
                      <span style={{
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.65rem', 
                        fontWeight: 600,
                        background: orden.estado === 'entregada' ? '#dcfce7' : orden.estado === 'enviado' ? '#dbeafe' : orden.estado === 'cancelado' ? '#fee2e2' : '#fef9c3',
                        color: orden.estado === 'entregada' ? '#16a34a' : orden.estado === 'enviado' ? '#2563eb' : orden.estado === 'cancelado' ? '#dc2626' : '#854d0e',
                        flexShrink: 0,
                      }}>
                        {orden.estado || orden.estado_orden || 'Procesando'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888', marginBottom: '6px' }}>
                      Orden #{orden.id_orden || orden.id || i + 1} • {orden.fecha_orden ? new Date(orden.fecha_orden).toLocaleDateString('es-CO') : '—'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: VINOTINTO }}>
                      ${Number(orden.total ?? 0).toLocaleString('es-CO')}
                    </p>
                  </div>

                  {/* Flecha indicadora */}
                  <div style={{ 
                    flexShrink: 0, 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: '#f8f5f2',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={VINOTINTO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
