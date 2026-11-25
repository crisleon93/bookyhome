import React, { useEffect, useState } from 'react';
import { compararLibrosApi, getApiBaseUrl } from '../services/api';
import { categoriaColor } from '../utils/catalogo';
import { notify } from './ToastProvider';

const resolveImg = (url) => {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${getApiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ModalCompararLibros({
  librosIniciales = [],
  onClose,
  onQuitarLibro,
  onAgregarAlCarrito,
  darkMode = false,
}) {
  const [librosDetallados, setLibrosDetallados] = useState(librosIniciales);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const ids = librosIniciales.map((l) => l.id_libro).filter(Boolean);
    if (ids.length < 2) {
      setLibrosDetallados(librosIniciales);
      return;
    }

    let cancel = false;
    setCargando(true);
    compararLibrosApi(ids)
      .then((res) => {
        if (!cancel && res.data?.libros) {
          setLibrosDetallados(res.data.libros);
        }
      })
      .catch(() => {
        if (!cancel) setLibrosDetallados(librosIniciales);
      })
      .finally(() => {
        if (!cancel) setCargando(false);
      });

    return () => {
      cancel = true;
    };
  }, [librosIniciales]);

  const dm = {
    bg: darkMode ? '#18181B' : '#FFFFFF',
    cardBg: darkMode ? '#27272A' : '#F9FAFB',
    cardBorder: darkMode ? '#3F3F46' : '#E5E7EB',
    text: darkMode ? '#F4F4F5' : '#111827',
    textSecondary: darkMode ? '#A1A1AA' : '#4B5563',
    muted: darkMode ? '#71717A' : '#6B7280',
    border: darkMode ? '#27272A' : '#E5E7EB',
    rowBgAlt: darkMode ? '#202024' : '#F8FAFC',
    rowHover: darkMode ? '#2D2D32' : '#F1F5F9',
    colDivider: darkMode ? '1px solid #2E2E35' : '1px solid #F1F5F9',
    vinotinto: '#7A1E3A',
    vinotintoDark: '#5E162C',
  };

  const handleQuitar = (idLibro) => {
    onQuitarLibro?.(idLibro);
    const restantes = librosDetallados.filter((l) => l.id_libro !== idLibro);
    setLibrosDetallados(restantes);
    if (restantes.length < 2) {
      notify('Se necesitan al menos 2 libros para comparar', 'info');
      onClose();
    }
  };

  // Calcular cuál libro tiene el precio efectivo más bajo
  const preciosEfectivos = librosDetallados.map((l) => {
    const base = Number(l.precio_libro ?? l.precio ?? 0);
    const oferta = l.oferta;
    const finalPrice = oferta && Number(oferta.precio_descuento) < base ? Number(oferta.precio_descuento) : base;
    return { id: l.id_libro, price: finalPrice };
  });
  const minPrice = Math.min(...preciosEfectivos.map((p) => p.price));

  const renderStars = (rating) => {
    const stars = [];
    const num = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= num ? '#F59E0B' : (darkMode ? '#52525B' : '#D1D5DB'), fontSize: '1rem' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comparativa de libros"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        role="document"
        style={{
          background: dm.bg,
          color: dm.text,
          borderRadius: '22px',
          width: 'min(1180px, 98vw)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          border: `1px solid ${dm.border}`,
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Principal */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: `1.5px solid ${dm.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: darkMode
              ? 'linear-gradient(180deg, #27272A 0%, #18181B 100%)'
              : 'linear-gradient(180deg, #FDF2F4 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7A1E3A 0%, #902345 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                boxShadow: '0 4px 14px rgba(122, 30, 58, 0.35)',
              }}
            >
              ⚖️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: dm.text }}>
                  Comparativa de Libros Lado a Lado
                </h3>
                <span
                  style={{
                    background: dm.vinotinto,
                    color: '#FFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                  }}
                >
                  {librosDetallados.length} libros
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: dm.muted }}>
                Compara precios, promociones activas, autores, estado y librerías para tomar la mejor decisión
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: darkMode ? '#27272A' : '#FFFFFF',
              border: `1px solid ${dm.border}`,
              borderRadius: '50%',
              width: 38,
              height: 38,
              cursor: 'pointer',
              color: dm.textSecondary,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode ? '#27272A' : '#FFFFFF';
              e.currentTarget.style.color = dm.textSecondary;
            }}
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div style={{ overflow: 'auto', flex: 1, padding: '24px 28px' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: dm.muted }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔄</div>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Cargando comparación de libros...</p>
              <p style={{ fontSize: '0.85rem', color: dm.muted }}>Consultando detalles y ofertas activas en tiempo real</p>
            </div>
          ) : librosDetallados.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: dm.muted }}>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Selecciona al menos dos libros para realizar una comparación.</p>
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                fontSize: '0.88rem',
              }}
            >
              <thead>
                <tr>
                  {/* Celda de encabezado de atributos */}
                  <th
                    style={{
                      width: '210px',
                      minWidth: '190px',
                      textAlign: 'left',
                      padding: '16px 18px',
                      color: dm.muted,
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: `2px solid ${dm.border}`,
                      background: dm.bg,
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                    }}
                  >
                    Características
                  </th>

                  {/* Columnas de cada Libro */}
                  {librosDetallados.map((libro) => {
                    const price = Number(libro.precio_libro ?? libro.precio ?? 0);
                    const oferta = libro.oferta;
                    const finalPrice = oferta && Number(oferta.precio_descuento) < price ? Number(oferta.precio_descuento) : price;
                    const isBestPrice = finalPrice === minPrice && librosDetallados.length > 1;

                    return (
                      <th
                        key={libro.id_libro}
                        style={{
                          minWidth: '240px',
                          maxWidth: '280px',
                          padding: '16px 14px 22px',
                          borderBottom: `2px solid ${dm.border}`,
                          borderLeft: dm.colDivider,
                          background: dm.cardBg,
                          borderRadius: '16px 16px 0 0',
                          verticalAlign: 'top',
                        }}
                      >
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {/* Botón quitar libro (dentro del card con margen) */}
                          <button
                            onClick={() => handleQuitar(libro.id_libro)}
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: 2,
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '50%',
                              width: 26,
                              height: 26,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.15)',
                              transition: 'transform 0.15s ease',
                              zIndex: 2,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            title="Quitar de la comparación"
                          >
                            ✕
                          </button>

                          {/* Badge Mejor Precio si aplica */}
                          {isBestPrice ? (
                            <span
                              style={{
                                background: '#DCFCE7',
                                color: '#15803D',
                                border: '1px solid #86EFAC',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                marginBottom: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 5px rgba(22, 101, 52, 0.1)',
                              }}
                            >
                              🏆 Mejor Precio
                            </span>
                          ) : (
                            <div style={{ height: '24px' }} />
                          )}

                          {/* Portada */}
                          <div
                            style={{
                              width: 100,
                              height: 140,
                              borderRadius: '10px',
                              overflow: 'hidden',
                              marginBottom: '12px',
                              boxShadow: '0 8px 18px rgba(0, 0, 0, 0.15)',
                              background: darkMode ? '#333' : '#E5E7EB',
                            }}
                          >
                            {resolveImg(libro.imagen_url || libro.imagen) ? (
                              <img
                                src={resolveImg(libro.imagen_url || libro.imagen)}
                                alt={libro.titulo}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'linear-gradient(135deg, #7A1E3A 0%, #902345 100%)',
                                  color: '#FFF',
                                  fontSize: '1.8rem',
                                }}
                              >
                                📖
                              </div>
                            )}
                          </div>

                          {/* Título */}
                          <h4
                            style={{
                              margin: '0 0 6px',
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: dm.text,
                              lineHeight: 1.3,
                              textAlign: 'center',
                              maxWidth: '220px',
                            }}
                            title={libro.titulo}
                          >
                            {libro.titulo}
                          </h4>

                          {/* Autor */}
                          <span
                            style={{
                              fontSize: '0.82rem',
                              color: dm.muted,
                              fontWeight: 500,
                              textAlign: 'center',
                            }}
                          >
                            por {libro.autor_libro || libro.autor || 'Autor no especificado'}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {/* 1. FILA: PRECIO Y DESCUENTO */}
                <tr style={{ background: dm.rowBgAlt }}>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 800,
                      color: dm.text,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.rowBgAlt,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>💰</span>
                      <span>Precio & Ofertas</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => {
                    const price = Number(libro.precio_libro ?? libro.precio ?? 0);
                    const oferta = libro.oferta;
                    const tieneOferta = oferta && Number(oferta.precio_descuento) < price;

                    return (
                      <td
                        key={libro.id_libro}
                        style={{
                          padding: '16px 14px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${dm.border}`,
                          borderLeft: dm.colDivider,
                        }}
                      >
                        {tieneOferta ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626' }}>
                                ${Math.round(oferta.precio_descuento).toLocaleString('es-CO')}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                }}
                              >
                                {oferta.tipo_descuento === 'porcentaje'
                                  ? `-${Math.round(oferta.valor_descuento)}%`
                                  : 'OFERTA'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.82rem', textDecoration: 'line-through', color: dm.muted }}>
                              ${price.toLocaleString('es-CO')}
                            </span>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: '#166534',
                                background: '#DCFCE7',
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Ahorras ${Math.round(oferta.ahorro || price - oferta.precio_descuento).toLocaleString('es-CO')}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: dm.vinotinto }}>
                            ${price.toLocaleString('es-CO')}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 2. FILA: CATEGORÍA */}
                <tr>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 700,
                      color: dm.muted,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.bg,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🏷️</span>
                      <span>Categoría</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => {
                    const cat = libro.nombre_categoria || 'General';
                    const cColor = categoriaColor(cat, darkMode, false);
                    return (
                      <td
                        key={libro.id_libro}
                        style={{
                          padding: '16px 14px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${dm.border}`,
                          borderLeft: dm.colDivider,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            background: cColor.bg,
                            color: cColor.color,
                            fontSize: '0.8rem',
                            fontWeight: 800,
                          }}
                        >
                          {cat}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. FILA: DISPONIBILIDAD Y STOCK */}
                <tr style={{ background: dm.rowBgAlt }}>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 700,
                      color: dm.muted,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.rowBgAlt,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>📦</span>
                      <span>Disponibilidad</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => {
                    const stock = Number(libro.stock ?? 0);
                    const disponible = stock > 0;
                    return (
                      <td
                        key={libro.id_libro}
                        style={{
                          padding: '16px 14px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${dm.border}`,
                          borderLeft: dm.colDivider,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            color: disponible ? '#15803D' : '#DC2626',
                            background: disponible ? '#DCFCE7' : '#FEE2E2',
                            padding: '4px 12px',
                            borderRadius: '8px',
                          }}
                        >
                          {disponible ? `✓ En stock (${stock} unid.)` : '✕ Agotado'}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 4. FILA: LIBRERÍA VENDEDORA */}
                <tr>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 700,
                      color: dm.muted,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.bg,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🏬</span>
                      <span>Librería Vendedora</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => (
                    <td
                      key={libro.id_libro}
                      style={{
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: dm.vinotinto,
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        borderBottom: `1px solid ${dm.border}`,
                        borderLeft: dm.colDivider,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span>📚</span>
                        <span>{libro.nombre_tienda || 'Librería Asociada'}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 5. FILA: ENVÍO Y DESPACHO */}
                <tr style={{ background: dm.rowBgAlt }}>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 700,
                      color: dm.muted,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.rowBgAlt,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🚚</span>
                      <span>Envío y Despacho</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => {
                    const tarifa = Number(libro.costo_envio_tienda ?? 0);
                    const dias = Number(libro.tiempo_despacho_dias ?? 2);
                    return (
                      <td
                        key={libro.id_libro}
                        style={{
                          padding: '16px 14px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${dm.border}`,
                          borderLeft: dm.colDivider,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontWeight: 800, color: tarifa === 0 ? '#15803D' : dm.text }}>
                            {tarifa === 0 ? 'Envío Gratis' : `$${tarifa.toLocaleString('es-CO')}`}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: dm.muted }}>
                            Despacho estimado: {dias} {dias === 1 ? 'día' : 'días'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 6. FILA: CALIFICACIÓN Y OPINIONES */}
                <tr>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 700,
                      color: dm.muted,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.bg,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>⭐</span>
                      <span>Calificación</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => {
                    const calif = Number(libro.promedio_calificacion || libro.calificacion || 4.0);
                    const resenas = Number(libro.total_resenas || 0);
                    return (
                      <td
                        key={libro.id_libro}
                        style={{
                          padding: '16px 14px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${dm.border}`,
                          borderLeft: dm.colDivider,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {renderStars(calif)}
                            <strong style={{ marginLeft: '4px', color: dm.text }}>{calif.toFixed(1)}</strong>
                          </div>
                          <span style={{ fontSize: '0.76rem', color: dm.muted }}>
                            {resenas === 0 ? 'Sin reseñas aún' : `(${resenas} ${resenas === 1 ? 'reseña' : 'reseñas'})`}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 7. FILA: ESTADO FÍSICO */}
                <tr style={{ background: dm.rowBgAlt }}>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 700,
                      color: dm.muted,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.rowBgAlt,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>✨</span>
                      <span>Condición</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => {
                    const rawEstado = String(libro.estado_libro || 'Nuevo').trim();
                    const estadoText = rawEstado.toLowerCase() === 'visible' ? 'Nuevo / Impecable' : rawEstado;
                    return (
                      <td
                        key={libro.id_libro}
                        style={{
                          padding: '16px 14px',
                          textAlign: 'center',
                          color: dm.text,
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          borderBottom: `1px solid ${dm.border}`,
                          borderLeft: dm.colDivider,
                        }}
                      >
                        <span
                          style={{
                            background: darkMode ? '#333' : '#F3F4F6',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                          }}
                        >
                          {estadoText}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 8. FILA: ISBN */}
                <tr>
                  <td
                    style={{
                      padding: '16px 18px',
                      fontWeight: 700,
                      color: dm.muted,
                      borderBottom: `1px solid ${dm.border}`,
                      position: 'sticky',
                      left: 0,
                      background: dm.bg,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🔢</span>
                      <span>Código ISBN</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => (
                    <td
                      key={libro.id_libro}
                      style={{
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: dm.muted,
                        fontSize: '0.84rem',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        borderBottom: `1px solid ${dm.border}`,
                        borderLeft: dm.colDivider,
                      }}
                    >
                      {libro.isbn ? (
                        <span
                          style={{
                            background: darkMode ? '#27272A' : '#F1F5F9',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: `1px solid ${dm.border}`,
                          }}
                        >
                          {libro.isbn}
                        </span>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: dm.muted }}>No especificado</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 9. FILA: ACCIÓN DE COMPRA */}
                <tr style={{ background: dm.rowBgAlt }}>
                  <td
                    style={{
                      padding: '20px 18px',
                      fontWeight: 800,
                      color: dm.text,
                      position: 'sticky',
                      left: 0,
                      background: dm.rowBgAlt,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🛒</span>
                      <span>Comprar</span>
                    </div>
                  </td>
                  {librosDetallados.map((libro) => {
                    const outOfStock = Number(libro.stock ?? 0) <= 0;
                    return (
                      <td
                        key={libro.id_libro}
                        style={{
                          padding: '20px 14px',
                          textAlign: 'center',
                          borderLeft: dm.colDivider,
                        }}
                      >
                        <button
                          onClick={() => {
                            onAgregarAlCarrito?.(libro);
                            notify(`"${libro.titulo}" añadido al carrito`, 'success');
                          }}
                          disabled={outOfStock}
                          style={{
                            width: '100%',
                            maxWidth: '220px',
                            background: outOfStock
                              ? '#9CA3AF'
                              : 'linear-gradient(135deg, #7A1E3A 0%, #902345 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '11px 18px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.86rem',
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: outOfStock ? 'none' : '0 4px 12px rgba(122, 30, 58, 0.35)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!outOfStock) e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            if (!outOfStock) e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <span>🛒</span>
                          <span>{outOfStock ? 'Agotado' : 'Añadir al carrito'}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Barra Inferior del Modal */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: `1px solid ${dm.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: darkMode ? '#18181B' : '#F9FAFB',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: dm.muted }}>
            Mostrando <strong>{librosDetallados.length}</strong> libros en comparativa simultánea.
          </span>
          <button
            onClick={onClose}
            style={{
              background: darkMode ? '#27272A' : '#FFFFFF',
              border: `1.5px solid ${dm.border}`,
              color: dm.text,
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? '#3F3F46' : '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode ? '#27272A' : '#FFFFFF';
            }}
          >
            Cerrar Comparación
          </button>
        </div>
      </div>
    </div>
  );
}
