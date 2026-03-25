// src/pages/PostLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import DashboardHeader from "../components/DashboardHeader";
import Footer from "../components/Footer";

// ==================== ICONOS ====================
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" />
  </svg>
);

const IconPackage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7" />
  </svg>
);

const IconHeart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364" />
  </svg>
);

const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.573-1.066c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00.817 1.194 1.724 1.724 0 01.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 01-2.573-1.066 1.724 1.724 0 01-2.573-1.066c-1.543.94-3.31-.827-2.37-2.37a1.724 1.724 0 01-.817-1.194 1.724 1.724 0 01-.817-1.194c.94-1.543-.827-3.31-2.37-2.37z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function PostLogin() {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState("Inicio");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = jwtDecode(token);
      setUserName(payload.nombre || "Usuario");
    } catch (error) {
      console.error("Error al decodificar token:", error);
      setUserName("Usuario");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const SIDE_LINKS = [
    { name: "Inicio", icon: <IconHome /> },
    { name: "Mis Compras", icon: <IconPackage /> },
    { name: "Mi Perfil", icon: <IconUser /> },
    { name: "Favoritos", icon: <IconHeart /> },
    { name: "Configuración", icon: <IconSettings /> },
  ];

  if (loading) {
    return <div className="auth-main">Cargando dashboard...</div>;
  }

  return (
    <>
      {/* Header limpio con barra de búsqueda */}
      <DashboardHeader userName={userName} />

      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-user">
            <div className="user-avatar-big">{userName.slice(0, 2).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{userName}</p>
              <p className="user-email">usuario@bookyhome.com</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {SIDE_LINKS.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveSide(item.name)}
                className={`sidebar-item ${activeSide === item.name ? "active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} className="sidebar-logout">
            Cerrar sesión
          </button>
        </aside>

        <main className="dashboard-main">
          <div className="welcome-card">
            <h1>Bienvenido de nuevo, {userName.split(" ")[0]} 👋</h1>
            <p>Esta es tu área personal de BookyHome.</p>
          </div>

          <div className="empty-state">
            <p>Próximamente aparecerán tus recomendaciones y novedades</p>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}