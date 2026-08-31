import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getApiBaseUrl } from '../services/api';

const BASE_URL = getApiBaseUrl();

function getImgUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

function LogoFallback({ nombre }) {
  const partes = (nombre || '').trim().split(/\s+/);
  const ini = partes.length >= 2 ? partes[0][0] + partes[1][0] : (nombre || '').substring(0, 2);
  return (
    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', userSelect: 'none' }}>
      {ini.toUpperCase()}
    </span>
  );
}

function Logo({ url, nombre }) {
  const [err, setErr] = useState(false);
  if (!url || err) return <LogoFallback nombre={nombre} />;
  return <img src={url} alt={nombre} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <span style={{ color: 'var(--vinotinto)', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#333' }}>{value}</p>
      </div>
    </div>
  );
}

export default function PerfilTienda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/configuracion/${id}`)
      .then(res => {
        const { configuracion } = res.data;
        // Si no tiene ningún dato de configuración relevante, marcar como sin perfil
        const tienePerfil = configuracion && (
          configuracion.descripcion ||
          configuracion.logo_url ||
          configuracion.banner_url ||
          configuracion.horario_atencion ||
          configuracion.email_publico ||
          configuracion.ciudad_origen
        );
        if (!tienePerfil) {
          // Igual mostramos la página pero sin sección de info extra
        }
        setData(res.data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main style={{ background: 'var(--beige)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999' }}>Cargando perfil...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main style={{ background: 'var(--beige)', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ fontSize: '2.5rem' }}>🔍</p>
        <p style={{ fontWeight: 700, color: '#555' }}>Esta librería no existe o no está disponible</p>
        <button type="button" onClick={() => navigate('/librerias')} style={{ background: 'var(--vinotinto)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.4rem', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
          Ver todas las librerías
        </button>
      </main>
    );
  }

  const { tienda, configuracion, libros = [] } = data;
  const logoUrl = getImgUrl(configuracion?.logo_url);
  const bannerUrl = getImgUrl(configuracion?.banner_url);
  const tienePerfil = configuracion && (
    configuracion.descripcion || configuracion.horario_atencion ||
    configuracion.email_publico || configuracion.politica_envios ||
    configuracion.politica_devoluciones
  );

  return (
    <main style={{ background: 'var(--beige)', minHeight: '80vh', paddingBottom: '4rem' }}>

      {/* Banner */}
      <div style={{
        height: '180px',
        background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--vinotinto) 0%, #a32d52 100%)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
      </div>

      <div className="layout-container" style={{ position: 'relative' }}>

        {/* Header con logo */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem', marginTop: '-40px', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--vinotinto) 0%, #a32d52 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            <Logo url={logoUrl} nombre={tienda.nombre_tienda} />
          </div>
          <div style={{ paddingBottom: '4px' }}>
            <h1 style={{ margin: '0 0 2px', fontSize: '1.35rem', fontWeight: 800, color: 'var(--gris-carbon)' }}>
              {tienda.nombre_tienda}
            </h1>
            {configuracion?.ciudad_origen && (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {configuracion.ciudad_origen}
              </p>
            )}
          </div>
          <div style={{ marginLeft: 'auto', paddingBottom: '4px' }}>
            <button
              type="button"
              onClick={() => navigate(`/catalogo?tienda=${tienda.id_tienda}`)}
              style={{ background: 'var(--vinotinto)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.2rem', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Ver catálogo →
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: tienePerfil ? '1fr 300px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Libros recientes */}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gris-carbon)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📚 Libros disponibles
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#999' }}>({libros.length})</span>
            </h2>
            {libros.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '0.88rem' }}>Esta librería aún no tiene libros publicados.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {libros.slice(0, 12).map(libro => (
                  <button
                    key={libro.id_libro}
                    type="button"
                    onClick={() => navigate(`/catalogo?q=${encodeURIComponent(libro.titulo)}`)}
                    style={{ background: '#fff', border: '1px solid #ede8e1', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0, transition: 'transform 0.15s, box-shadow 0.15s', width: '140px', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ height: '120px', background: 'linear-gradient(135deg, #7A1E3A 0%, #a32d52 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      {libro.imagenes?.[0]
                        ? <img src={libro.imagenes[0]} alt={libro.titulo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      }
                    </div>
                    <div style={{ padding: '0.5rem 0.6rem' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '0.78rem', fontWeight: 700, color: '#222', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineClamp: 2 }}>{libro.titulo}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#888' }}>{libro.autor_libro}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.82rem', fontWeight: 800, color: 'var(--vinotinto)' }}>
                        ${Number(libro.precio_libro).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panel info — solo si tiene perfil */}
          {tienePerfil && (
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #ede8e1', position: 'sticky', top: '90px' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--gris-carbon)' }}>Información de la tienda</h3>

              {configuracion.descripcion && (
                <p style={{ fontSize: '0.84rem', color: '#555', lineHeight: 1.6, marginBottom: '1rem', borderBottom: '1px solid #f0ebe4', paddingBottom: '1rem' }}>
                  {configuracion.descripcion}
                </p>
              )}

              <InfoRow icon="🕐" label="Horario" value={configuracion.horario_atencion} />
              <InfoRow icon="📦" label="Política de envíos" value={configuracion.politica_envios} />
              <InfoRow icon="↩️" label="Devoluciones" value={configuracion.politica_devoluciones} />
              <InfoRow icon="✉️" label="Email de contacto" value={configuracion.email_publico} />
              {configuracion.tiempo_despacho_dias > 0 && (
                <InfoRow icon="🚚" label="Tiempo de despacho" value={`${configuracion.tiempo_despacho_dias} días hábiles`} />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
