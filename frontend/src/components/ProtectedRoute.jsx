import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const auth = useAuth();
  const location = useLocation();

  // Verificación de autenticación
  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificación de autorización por roles
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = auth.user?.roles || [];
    const has = userRoles.some(r => allowedRoles.includes(r));
    if (!has) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}


