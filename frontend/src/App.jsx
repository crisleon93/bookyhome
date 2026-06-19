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
import Carrito from './pages/Carrito';
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

  return (
    <ToastProvider>
      <Header variant={variant} />

      <Routes>

        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/libreria" element={<Libreria />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/libros" element={<StoredProcedurePage />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/catalogo/:id" element={<DetalleLibro />} />
        <Route path="/favoritos" element={<Favoritos />} />

        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/post-login" element={<PostLogin />} />
          <Route path="/mi-tienda" element={<MiTienda />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
          <Route path="/vendedor/publicar" element={<PublicarLibro />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Redirección por rol */}
        <Route
          path="/dashboard"
          element={
            userRole === 'vendedor' ? (
              <Navigate to="/mi-tienda" replace />
            ) : userRole === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (userRole === 'usuario' || userRole === 'comprador') ? (
              <Navigate to="/post-login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      <Footer />
      <CookieBanner />
    </ToastProvider>
  );
}

export default App;
