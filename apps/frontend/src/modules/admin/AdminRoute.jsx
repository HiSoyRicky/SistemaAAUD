// AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';

// Cualquier permiso administrado desde el Panel de Administraci\u00f3n habilita el acceso;
// cada secci\u00f3n interna vuelve a filtrar seg\u00fan su propio permiso.
const ADMIN_PANEL_PERMISSIONS = [
  'users.read',
  'roles.read',
  'permissions.read',
  'warehouse_items.read',
  'inventory.read',
  'ubications.read',
  'departments.read',
  'devices.read',
  'inventory_classification_rules.read',
  'brands.read',
  'models.read',
  'toners.read',
  'notification_settings.read',
];

export default function AdminRoute({ children }) {
  const { isAuthenticated, hasAnyPermission } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasAnyPermission(ADMIN_PANEL_PERMISSIONS)) return <Navigate to="/" />;

  return children;
}
