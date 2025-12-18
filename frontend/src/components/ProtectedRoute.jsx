import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = auth.user?.roles || [];
    const has = userRoles.some(r => allowedRoles.includes(r));
    if (!has) {
      // Usuario autenticado pero no autorizado para esta ruta
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
