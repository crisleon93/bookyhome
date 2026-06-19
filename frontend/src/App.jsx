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

import { getUserRole } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

function MainLayout() {
  const location = useLocation();
  const variant = location.pathname === '/' ? 'white' : 'simple';
  const userRole = getUserRole();

  const isDashboard =
    location.pathname.startsWith('/mi-tienda') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/post-login') ||
    location.pathname.startsWith('/vendedor/publicar');

  return (
    <ToastProvider>
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

        {/* ── RUTAS PROTEGIDAS GENERALES (Cualquier usuario logueado) ── */}
        <Route element={<PrivateRoute />}>
          <Route path="/post-login" element={<PostLogin />} />
          <Route path="/carrito" element={<Navigate to="/post-login?seccion=Carrito" replace />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
        </Route>

        {/* ── RUTAS EXCLUSIVAS DE VENDEDOR ── */}
        <Route element={<PrivateRoute allowedRoles={['vendedor']} />}>
          <Route path="/mi-tienda" element={<MiTienda />} />
          <Route path="/vendedor/publicar" element={<PublicarLibro />} />
        </Route>

        {/* ── RUTAS EXCLUSIVAS DE ADMINISTRADOR ── */}
        <Route element={<PrivateRoute allowedRoles={['admin', 'administrador']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Si tu compañero agrega más páginas de admin como /admin/libros, van aquí adentro */}
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
        
        {/* Catch-all para rutas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isDashboard && <Footer />}
      <CookieBanner />
    </ToastProvider>
  );
}

export default App;
