import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Libreria from './pages/Libreria';
import Home from './pages/Home';
import ResetPassword from './pages/Resetpassword.jsx';
import MiTienda from './pages/MiTienda';

function App() {
  const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol;        // "vendedor" o "usuario"
    } catch (e) {
      return null;
    }
  };

  const userRole = getUserRole();

  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/libreria" element={<Libreria />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard del VENDEDOR */}
        <Route 
          path="/mi-tienda" 
          element={userRole === "vendedor" ? <MiTienda /> : <Navigate to="/login" replace />} 
        />

        {/* Redirección después del login */}
        <Route 
          path="/dashboard" 
          element={
            userRole === "vendedor" ? (
              <Navigate to="/mi-tienda" replace />
            ) : userRole === "usuario" ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;