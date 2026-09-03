// AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';

export default function AdminRoute({ children }) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasPermission('users.read')) return <Navigate to="/" />;

  return children;
}
