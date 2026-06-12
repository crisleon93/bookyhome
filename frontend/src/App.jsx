// src/App.jsx ← Versión corregida para control de roles y redirecciones

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Libreria from './pages/Libreria'; 
import Catalogo from './pages/Catalogo'; 
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/Resetpassword';
import PostLogin from './pages/PostLogin';
import MiTienda from './pages/MiTienda';
import PrivateRoute from "./components/PrivateRoute";
import Carrito from "./pages/Carrito";
import Checkout from "./pages/Checkout";
import StoredProcedurePage from "./pages/StoredProcedurePage";
import PublicarLibro from './pages/PublicarLibro';
import { getUserRole } from './hooks/useAuth';
import SeccionOfertas from './components/SeccionOfertas';

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

function MainLayout() {
  const location = useLocation();

  // Define el variant: blanco solo en la página principal, vinotinto en el resto
  const variant = location.pathname === '/' ? 'white' : 'simple';

  const userRole = getUserRole();

  return (
    <>
      <Header variant={variant} />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Catálogo de libros */}
        <Route path="/catalogo" element={<Catalogo />} />

        {/* Registro de tienda */}
        <Route path="/libreria" element={<Libreria />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/checkout/:orderId" element={<Checkout />} />
        <Route path="/libros" element={<StoredProcedurePage />} />
        <Route path="/vendedor/publicar" element={<PublicarLibro />} />

        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/post-login" element={<PostLogin />} />
          <Route path="/mi-tienda" element={<MiTienda />} />
        </Route>

        {/* ── REDIRECCIÓN CORREGIDA SEGÚN ROLES EXISTENTES ──────────────────── */}
        <Route
          path="/dashboard"
          element={
            userRole === "vendedor" ? (
              <Navigate to="/mi-tienda" replace />
            ) : (userRole === "usuario" || userRole === "comprador") ? ( 
              // ◄ Ahora acepta "comprador" y no te patea de regreso al login
              <Navigate to="/post-login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;