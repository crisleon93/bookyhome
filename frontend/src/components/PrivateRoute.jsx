// src/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

function PrivateRoute() {
  const token = localStorage.getItem('token');

  // Si no hay token → redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token → permite ver la ruta
  return <Outlet />;
}

export default PrivateRoute;