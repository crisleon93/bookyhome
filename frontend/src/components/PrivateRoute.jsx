// src/components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function PrivateRoute({ allowedRoles }) {
  // ========================
  // Token y validación inicial
  // ========================
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ========================
  // Estado de validación
  // ========================
  let isRoleAllowed = true;
  let isTokenValid = true;

  // ========================
  // Decodificar token si se requiere rol
  // ========================
  if (allowedRoles) {
    try {
      const payload = jwtDecode(token);
      const userRole = payload.rol || payload.role;

      if (!allowedRoles.includes(userRole)) {
        isRoleAllowed = false;
      }
    } catch {
      isTokenValid = false;
    }
  }

  // ========================
  // Redirección por token inválido
  // ========================
  if (!isTokenValid) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // ========================
  // Redirección por rol no autorizado
  // ========================
  if (!isRoleAllowed) {
    const payload = jwtDecode(token);
    const userRole = payload.rol || payload.role;

    if (userRole === 'vendedor') {
      return <Navigate to="/mi-tienda" replace />;
    }

    return <Navigate to="/post-login" replace />;
  }

  // ========================
  // Ruta permitida
  // ========================
  return <Outlet />;
}

export default PrivateRoute;