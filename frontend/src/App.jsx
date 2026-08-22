// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { ToastProvider } from './components/ToastProvider';

import Home from './pages/Home';
import MiTienda from './pages/MiTienda';
import PrivateRoute from './components/PrivateRoute';
import PublicarLibro from './pages/PublicarLibro';
import AdminDashboard from './pages/AdminDashboard';
import Historial from './pages/Historial';
import ListaDeseos from './pages/ListaDeseos';
import Devoluciones from './pages/Devoluciones';
import BookyPagoFinanzas from './pages/BookyPagoFinanzas';
import Chat from './pages/Chat';

import { getUserRole } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <MainLayout />
        {/* CookieBanner fuera de MainLayout: no se re-monta con cambios de ruta */}
        <CookieBanner />
      </ToastProvider>
    </BrowserRouter>
  );
}

function MainLayout() {
  // ========================
  // Estado de la ruta y UI
  // ========================
  const location = useLocation();
  const variant = location.pathname === '/' ? 'white' : 'simple';
  const userRole = getUserRole();

  // Mostrar header en páginas de comprador y vendedor; ocultarlo solo en admin
  const isDashboard = location.pathname.startsWith('/admin');

  // Detectar si el usuario está autenticado para ajustar el header en Home
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const checkToken = () => {
      setHasToken(!!localStorage.getItem('token'));
    };
    checkToken();
    window.addEventListener('storage', checkToken);
    window.addEventListener('auth-change', checkToken);
    
    // Verificar periódicamente por si el token se estableció
    const interval = setInterval(checkToken, 1000);
    
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('auth-change', checkToken);
      clearInterval(interval);
    };
  }, []);

  // Pasar prop para indicar al Header si debe ajustarse por el sidebar
  const hasSidebar = location.pathname === '/' && hasToken;

  return (
    <>
      {/* Header siempre en Home, excepto en admin */}
      {!isDashboard && <Header variant={variant} hasSidebar={hasSidebar} />}

      <Routes>
        {/* ── RUTAS PÚBLICAS ── */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/" replace />} />
        <Route path="/reset-password" element={<Navigate to="/" replace />} />
        <Route path="/legal" element={<Navigate to="/" replace />} />

        {/* ── RUTAS PROTEGIDAS GENERALES (Cualquier usuario logueado) ── */}
        <Route element={<PrivateRoute />}>
          <Route path="/carrito" element={<Navigate to="/?seccion=Carrito" replace />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/lista-deseos" element={<ListaDeseos />} />
          <Route path="/devoluciones" element={<Devoluciones />} />
          <Route path="/favoritos" element={<Navigate to="/lista-deseos" replace />} />
          <Route path="/chat/:id_sala" element={<Chat />} />
        </Route>

        {/* ── RUTAS EXCLUSIVAS DE VENDEDOR ── */}
        <Route element={<PrivateRoute allowedRoles={['vendedor']} />}>
          <Route path="/mi-tienda" element={<MiTienda />} />
          <Route path="/vendedor/publicar" element={<PublicarLibro />} />
        </Route>

        {/* ── RUTAS EXCLUSIVAS DE ADMINISTRADOR ── */}
        <Route element={<PrivateRoute allowedRoles={['admin', 'administrador']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/finanzas" element={<BookyPagoFinanzas />} />
        </Route>

        {/* ── REDIRECCIÓN LOGÍSTICA POR ROL ── */}
        <Route
          path="/dashboard"
          element={
            userRole === 'vendedor' ? (
              <Navigate to="/mi-tienda" replace />
            ) : (userRole === 'admin' || userRole === 'administrador') ? (
              <Navigate to="/admin" replace />
            ) : (userRole === 'usuario' || userRole === 'comprador') ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Catch-all para rutas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Footer siempre en Home, incluso autenticado */}
      {!isDashboard && <Footer />}
    </>
  );
}

export default App;
