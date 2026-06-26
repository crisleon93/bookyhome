// src/App.jsx
import Favoritos from './pages/Favoritos';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { ToastProvider } from './components/ToastProvider';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Libreria from './pages/Libreria';
import Catalogo from './pages/Catalogo';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/Resetpassword';
import PostLogin from './pages/PostLogin';
import MiTienda from './pages/MiTienda';
import PrivateRoute from './components/PrivateRoute';
import Checkout from './pages/Checkout';
import StoredProcedurePage from './pages/StoredProcedurePage';
import PublicarLibro from './pages/PublicarLibro';
import DetalleLibro from './pages/DetalleLibro';
import AdminDashboard from './pages/AdminDashboard';
import PerfilUsuario from './pages/PerfilUsuario';
import Chat from './pages/Chat';
import Notificaciones from './pages/Notificaciones';
import Historial from './pages/Historial';

import { getUserRole } from './hooks/useAuth';
import LegalPage from './pages/LegalPage';

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

  return (
    <>
      {/* Header solo en páginas públicas */}
      {!isDashboard && <Header variant={variant} />}

      <Routes>
        {/* ── RUTAS PÚBLICAS ── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/libreria" element={<Libreria />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/libros" element={<StoredProcedurePage />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/catalogo/:id" element={<DetalleLibro />} />
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/legal" element={<LegalPage />} />

        {/* ── RUTAS PROTEGIDAS GENERALES (Cualquier usuario logueado) ── */}
        <Route element={<PrivateRoute />}>
          <Route path="/post-login" element={<PostLogin />} />
          <Route path="/carrito" element={<Navigate to="/post-login?seccion=Carrito" replace />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id_sala" element={<Chat />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/historial" element={<Historial />} />
        </Route>

        {/* ── RUTAS EXCLUSIVAS DE VENDEDOR ── */}
        <Route element={<PrivateRoute allowedRoles={['vendedor']} />}>
          <Route path="/mi-tienda" element={<MiTienda />} />
          <Route path="/vendedor/publicar" element={<PublicarLibro />} />
        </Route>

        {/* ── RUTAS EXCLUSIVAS DE ADMINISTRADOR ── */}
        <Route element={<PrivateRoute allowedRoles={['admin', 'administrador']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
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
              <Navigate to="/post-login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* El carrito vive dentro del dashboard (PostLogin), no como página propia */}
        <Route path="/carrito" element={<Navigate to="/post-login?seccion=Carrito" replace />} />

        {/* Catch-all para rutas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Footer solo en páginas públicas */}
      {!isDashboard && <Footer />}
    </>
  );
}

export default App;
