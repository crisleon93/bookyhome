// src/pages/MiTienda.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MiTienda = () => {
  const navigate = useNavigate();
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLibros: 0,
    vendidosHoy: 0,
    ingresosMes: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Datos de ejemplo (sin axios por ahora)
    setTimeout(() => {
      setLibros([
        { 
          id: 1, 
          titulo: "Cien años de soledad", 
          autor: "Gabriel García Márquez", 
          precio: 45000, 
          stock: 12, 
          vendidos: 8 
        },
        { 
          id: 2, 
          titulo: "El principito", 
          autor: "Antoine de Saint-Exupéry", 
          precio: 32000, 
          stock: 25, 
          vendidos: 15 
        },
        { 
          id: 3, 
          titulo: "1984", 
          autor: "George Orwell", 
          precio: 38000, 
          stock: 7, 
          vendidos: 22 
        },
      ]);

      setStats({
        totalLibros: 3,
        vendidosHoy: 5,
        ingresosMes: 2450000,
      });

      setLoading(false);
    }, 800);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Cargando tu tienda...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#7A1E3A', margin: 0 }}>Mi Tienda</h1>
          <p style={{ color: '#666', marginTop: '8px' }}>Bienvenido de nuevo, vendedor</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#7A1E3A',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Estadísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '3rem' 
      }}>
        <div style={{ background: '#F4EDE2', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3>Libros Publicados</h3>
          <h2 style={{ fontSize: '2.8rem', color: '#7A1E3A', margin: '10px 0' }}>{stats.totalLibros}</h2>
        </div>
        <div style={{ background: '#F4EDE2', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3>Vendidos Hoy</h3>
          <h2 style={{ fontSize: '2.8rem', color: '#7A1E3A', margin: '10px 0' }}>{stats.vendidosHoy}</h2>
        </div>
        <div style={{ background: '#F4EDE2', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3>Ingresos este mes</h3>
          <h2 style={{ fontSize: '2.8rem', color: '#7A1E3A', margin: '10px 0' }}>
            ${stats.ingresosMes.toLocaleString('es-CO')}
          </h2>
        </div>
      </div>

      {/* Botón Agregar Libro */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          style={{
            background: '#7A1E3A',
            color: 'white',
            padding: '14px 28px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontWeight: '700'
          }}
          onClick={() => alert('Próximamente: Formulario para agregar nuevo libro')}
        >
          + Agregar Nuevo Libro
        </button>
      </div>

      {/* Lista de Libros */}
      <h2 style={{ marginBottom: '1.5rem', color: '#2A2A2A' }}>Mis Libros</h2>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {libros.map(libro => (
          <div key={libro.id} style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>{libro.titulo}</h3>
              <p style={{ margin: 0, color: '#666' }}>por {libro.autor}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#7A1E3A' }}>
                ${libro.precio.toLocaleString('es-CO')}
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                Stock: {libro.stock} | Vendidos: {libro.vendidos}
              </p>
            </div>
            <div>
              <button style={{
                padding: '8px 16px',
                background: '#C5425A',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                marginRight: '8px',
                cursor: 'pointer'
              }}>
                Editar
              </button>
              <button style={{
                padding: '8px 16px',
                background: '#ddd',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                Ver ventas
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiTienda;