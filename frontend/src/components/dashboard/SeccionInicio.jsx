import { useState, useEffect, useRef } from "react";
import { IconBookOpen, IconFavorites, IconBook, IconChevronLeft } from "../Icons";
import CouponsList from "../CouponsList";
import CatalogoLibroCard from "../LibroCard";
import { getStoredLibros, getOrdenes, getCuponesDisponibles } from "../../services/api";

const VINOTINTO = '#7A1E3A';
const VINOTINTO2 = '#9B2648';
const BEIGE = '#F4EDE2';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function getEstadoCompraProps(estado) {
  const estadoNormalizado = String(estado || '').toLowerCase().trim();
  if (estadoNormalizado.includes('entreg')) {
    return { background: '#FDF2F4', color: '#7A1E3A', border: '1px solid #F8D2DA' };
  }
  if (estadoNormalizado.includes('pagad') || estadoNormalizado.includes('aprob')) {
    return { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' };
  }
  if (estadoNormalizado.includes('enviad') || estadoNormalizado.includes('transit')) {
    return { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
  }
  if (estadoNormalizado.includes('cancel')) {
    return { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' };
  }
  return { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' };
}

function CarruselLibros({ libros, onVerLibro, darkMode }) {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const scroll = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 12 : 172;
    const loopWidth = track.scrollWidth / 2;
    offsetRef.current += dir * step;
    if (offsetRef.current < 0) offsetRef.current += loopWidth;
    if (offsetRef.current >= loopWidth) offsetRef.current -= loopWidth;
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  };
  useEffect(() => {
    if (libros.length <= 1) return undefined;
    const measure = () => {
      if (trackRef.current) loopWidthRef.current = trackRef.current.scrollWidth / 2;
    };
    measure();
    window.addEventListener('resize', measure);
    let frameId;
    let previousTime;
    const animate = (time) => {
      const track = trackRef.current;
      if (track) {
        const elapsed = previousTime ? time - previousTime : 0;
        const loopWidth = loopWidthRef.current;
        offsetRef.current += (elapsed / 1000) * 28;
        if (loopWidth > 0 && offsetRef.current >= loopWidth) offsetRef.current -= loopWidth;
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      previousTime = time;
      frameId = window.requestAnimationFrame(animate);
    };
    frameId = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', measure);
    };
  }, [libros.length]);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: '4px' }}>
      {/* Flecha izquierda */}
      <button onClick={() => scroll(-1)} style={{
        position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
        zIndex: 2, background: darkMode ? '#3a3a3a' : 'white', border: `1px solid ${darkMode ? '#ff4f83' : '#ddd'}`, borderRadius: '50%',
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: darkMode ? '0 3px 12px rgba(0,0,0,0.55)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <IconChevronLeft width={16} height={16} strokeWidth={2.5} style={{ color: darkMode ? '#ff6b97' : '#444' }} />
      </button>
      {/* Carrusel */}
      <div ref={ref} style={{ overflow: 'hidden', paddingBottom: '0' }}>
        <div ref={trackRef} style={{ display: 'flex', gap: '12px', width: 'max-content', willChange: 'transform' }}>
          {[...libros, ...libros].map((libro, index) => (
            <div key={`${libro.id_libro}-${index}`} style={{ flex: '0 0 220px' }}>
              <CatalogoLibroCard libro={libro} onVerDetalles={onVerLibro} />
            </div>
          ))}
        </div>
      </div>
      {/* Flecha derecha */}
      <button onClick={() => scroll(1)} style={{
        position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%) rotate(180deg)',
        zIndex: 2, background: darkMode ? '#3a3a3a' : 'white', border: `1px solid ${darkMode ? '#ff4f83' : '#ddd'}`, borderRadius: '50%',
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: darkMode ? '0 3px 12px rgba(0,0,0,0.55)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <IconChevronLeft width={16} height={16} strokeWidth={2.5} style={{ color: darkMode ? '#ff6b97' : '#444' }} />
      </button>
    </div>
  );
}

export default function SeccionInicio({ userName, onSelectSeccion, onVerDetalleLibro }) {
  const [novedades, setNovedades] = useState([]);
  const [ultimasCompras, setUltimasCompras] = useState([]);
  const [cupones, setCupones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const handleDarkModeChange = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handleDarkModeChange);
    window.addEventListener('storage', handleDarkModeChange);
    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange);
      window.removeEventListener('storage', handleDarkModeChange);
    };
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = userName?.split(' ')[0] || 'lector';

  useEffect(() => {
    // Novedades — todos los libros ordenados por recientes
    getStoredLibros({ limite: 12 })
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
      .then(res => setCupones(res.data || []))
      .catch(() => setCupones([]));
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
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBookOpen width={48} height={48} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
        </div>
      </section>

      {/* ── CUPONES ── */}
      {cupones?.length > 0 && (
        <section>
          <CouponsList initialCoupons={cupones} darkMode={darkMode} />
        </section>
      )}

      {/* ── NOVEDADES ── */}
      <section style={{ background: darkMode ? '#1e1e1e' : 'white', borderRadius: '14px', padding: '1.25rem', border: `1px solid ${darkMode ? '#454545' : '#eee6df'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO2} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <IconBookOpen width={20} height={20} strokeWidth={1.8} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: darkMode ? '#ececec' : '#1a1a1a' }}>Recién llegados</h2>
          </div>
          <button onClick={() => onSelectSeccion('Catálogo')} style={{ background: darkMode ? '#252525' : 'white', border: `1px solid ${darkMode ? '#ff4f83' : VINOTINTO}`, borderRadius: '7px', padding: '6px 12px', color: darkMode ? '#ff6b97' : VINOTINTO, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Ver todos
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
            <CarruselLibros darkMode={darkMode} libros={novedades} onVerLibro={(l) => { if (onVerDetalleLibro) { onVerDetalleLibro(l); } else { onSelectSeccion('Catálogo'); } }} />
        )}
      </section>

      {/* ── ÚLTIMAS COMPRAS ── */}
      {ultimasCompras.length > 0 && (
        <section style={{ background: darkMode ? '#1e1e1e' : 'white', borderRadius: '14px', padding: '1.25rem', border: `1px solid ${darkMode ? '#454545' : '#eee6df'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO2} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <IconBook width={20} height={20} strokeWidth={1.8} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: darkMode ? '#ececec' : '#1a1a1a' }}>Tus últimas compras</h2>
            </div>
            <button onClick={() => onSelectSeccion('Mis Compras')} style={{ background: darkMode ? '#252525' : 'white', border: `1px solid ${darkMode ? '#ff4f83' : VINOTINTO}`, borderRadius: '7px', padding: '6px 12px', color: darkMode ? '#ff6b97' : VINOTINTO, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Ver todas
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ultimasCompras.map((orden, i) => {
              const estadoCompra = orden.estado || orden.estado_orden || 'Procesando';
              const estadoCompraProps = getEstadoCompraProps(estadoCompra);

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
                    background: darkMode ? '#252525' : 'white', 
                    borderRadius: '12px', 
                    padding: '14px',
                    border: `1px solid ${darkMode ? '#606060' : '#e8e2d9'}`, 
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
                        color: darkMode ? '#ececec' : '#1a1a1a',
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
                        ...estadoCompraProps,
                        flexShrink: 0,
                      }}>
                        {estadoCompra}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: darkMode ? '#aaa' : '#888', marginBottom: '6px' }}>
                      Orden #{orden.id_orden || orden.id || i + 1} • {orden.fecha_orden ? new Date(orden.fecha_orden).toLocaleDateString('es-CO') : '—'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: darkMode ? '#ff4f83' : VINOTINTO }}>
                      ${Number(orden.total ?? 0).toLocaleString('es-CO')}
                    </p>
                  </div>

                  {/* Flecha indicadora */}
                  <div style={{ 
                    flexShrink: 0, 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: darkMode ? '#303030' : '#f8f5f2',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#ff4f83' : VINOTINTO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
