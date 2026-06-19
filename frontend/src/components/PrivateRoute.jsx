// src/components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function PrivateRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');

  // 1. Si no hay token → redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Variables de control fuera del try/catch
  let isRoleAllowed = true;
  let isTokenValid = true;

  // 2. Si se requiere un rol específico, decodificamos SOLO los datos en el try/catch
  if (allowedRoles) {
    try {
      const payload = jwtDecode(token);
      const userRole = payload.rol || payload.role; 

      // Evaluamos si el rol está permitido y guardamos el resultado en la variable
      if (!allowedRoles.includes(userRole)) {
        isRoleAllowed = false;
      }
    } catch{
      isTokenValid = false;
    }
  }

  // 3. Procesamos las redirecciones FUERA del try/catch usando JSX de manera segura
  if (!isTokenValid) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // 3. Procesamos las redirecciones FUERA del try/catch usando JSX de manera segura
  if (!isTokenValid) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // 🔄 REBOTE INTELIGENTE: Evaluamos el rol de forma directa para el JSX
  if (!isRoleAllowed) {
    const payload = jwtDecode(token);
    const userRole = payload.rol || payload.role;

    if (userRole === 'vendedor') {
      return <Navigate to="/mi-tienda" replace />;
    }
    
    // Si es comprador o cualquier otro rol, va a post-login
    return <Navigate to="/post-login" replace />;
  }

  // 4. Si todo está en orden, permite ver los componentes hijos
  return <Outlet />;
}

export default PrivateRoute;