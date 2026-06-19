// src/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function PrivateRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');

  // 1. Si no hay token → redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si se requiere un rol específico (como el de administrador)
  if (allowedRoles) {
    try {
      const payload = jwtDecode(token);
      // Ajusta 'payload.rol' o 'payload.role' según cómo lo envíe tu backend en FastAPI
      const userRole = payload.rol || payload.role; 

      // Si el rol del usuario no está entre los permitidos, lo rebota al PostLogin común
      if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/post-login" replace />;
      }
    } catch (error) {
      // Si el token es inválido o está corrupto, limpiamos y al login
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}

export default PrivateRoute;