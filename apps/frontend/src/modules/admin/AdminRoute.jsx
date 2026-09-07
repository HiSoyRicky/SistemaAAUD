// AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';

export default function AdminRoute({ children }) {
  const { isAuthenticated, userType } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (userType !== 'admin') return <Navigate to="/" />;

  return children;
}
