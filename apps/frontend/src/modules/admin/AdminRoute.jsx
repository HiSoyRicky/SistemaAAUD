// AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';

export default function AdminRoute({ children }) {
  const { userType } = useAuth();

  if (!userType) return <Navigate to="/login" />;
  if (userType !== 'admin') return <Navigate to="/" />;

  return children;
}
