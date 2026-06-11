// src/App.jsx ← Versión limpia y sin duplicados

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Libreria from './pages/Libreria';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/Resetpassword'; // Con 'p' minúscula según tu carpeta
import PostLogin from './pages/PostLogin';
import MiTienda from './pages/MiTienda';           // Una sola vez y con 'T' mayúscula
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

// Este componente está DENTRO del BrowserRouter, por eso puede usar useLocation
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

        {/* Redirección después del login según el rol */}
        <Route 
          path="/dashboard" 
          element={
            userRole === "vendedor" ? (
              <Navigate to="/mi-tienda" replace />
            ) : userRole === "usuario" ? (
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
