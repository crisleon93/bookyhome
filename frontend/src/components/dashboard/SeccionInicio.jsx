import { IconBookOpen, IconStar, IconFavorites, IconBook } from "../Icons";
import CouponsList from "../CouponsList";

export default function SeccionInicio({ userName, librosRecomendados, onGoToCatalog, onVerDetalleLibro }) {
  return (
    <>
      <div className="welcome-card">
        <h1>Bienvenido de nuevo, {userName?.split(" ")[0]}</h1>
        <p>Esta es tu área personal de BookyHome.</p>
      </div>
      {/* RECOMENDACIONES PERSONALIZADAS */}
      {librosRecomendados.length === 0 ? (
        <div className="empty-state">
          <p>Agrega libros a tu lista de deseos para recibir recomendaciones personalizadas</p>
          <button className="btn btn-vinotinto btn-catalog" onClick={onGoToCatalog} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
            Ir a lista de deseos
          </button>
        </div>
      ) : (
        <div className="pl-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <IconStar width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            <div>
              <h2 style={{ margin: 0 }}>Recomendados para ti</h2>
              <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
                Basado en tus listas de deseos
              </p>
            </div>
          </div>
          {librosRecomendados.map((libro) => (
            <div key={libro.id_libro} className="pl-order-row" style={{ cursor: 'pointer' }}
              onClick={() => onVerDetalleLibro(libro)}>
              <div className="pl-order-left">
                <span className="pl-order-emoji" style={{ display: 'flex', alignItems: 'center' }}>
                  <IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                </span>
                <div>
                  <p className="pl-order-title">{libro.titulo}</p>
                  <p className="pl-order-meta">
                    {libro.autor_libro || libro.autor} · {libro.nombre_categoria}
                  </p>
                </div>
              </div>
              <div className="pl-order-right">
                <span className="pl-order-price">
                  ${Number(libro.precio_libro ?? libro.precio ?? 0).toLocaleString('es-CO')}
                </span>
                <span style={{
                  background: '#6b1a2a', color: 'white', padding: '4px 10px',
                  borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <IconFavorites width={12} height={12} strokeWidth={2} style={{ color: 'white' }} />
                  Lista de deseos
                </span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button className="btn btn-vinotinto btn-catalog" onClick={onGoToCatalog} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
              Ver más libros
            </button>
          </div>
        </div>
      )}
      {/* LISTA DE CUPONES DISPONIBLES */}
      <CouponsList />
    </>
  );
}
