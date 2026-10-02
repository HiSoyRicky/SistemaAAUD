// AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';

// El acceso al contenedor requiere admin.panel.read; las secciones conservan sus permisos propios.
export default function AdminRoute({ children }) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasPermission('admin.panel.read')) return <Navigate to="/" />;

  return children;
}
