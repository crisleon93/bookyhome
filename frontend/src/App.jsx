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
import Checkout from "./pages/Checkout";
import StoredProcedurePage from "./pages/StoredProcedurePage";
import PublicarLibro from './pages/PublicarLibro';
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
    <>
      <Header variant={variant} />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/libreria" element={<Libreria />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/libros" element={<StoredProcedurePage />} />
        <Route path="/vendedor/publicar" element={<PublicarLibro />} />

        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/post-login" element={<PostLogin />} />
          <Route path="/mi-tienda" element={<MiTienda />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
        </Route>

        {/* Redirección por rol */}
        <Route
          path="/dashboard"
          element={
            userRole === "vendedor" ? (
              <Navigate to="/mi-tienda" replace />
            ) : (userRole === "usuario" || userRole === "comprador") ? (
              <Navigate to="/post-login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Si alguien va a /carrito lo mandamos al dashboard */}
        <Route path="/carrito" element={<Navigate to="/post-login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;