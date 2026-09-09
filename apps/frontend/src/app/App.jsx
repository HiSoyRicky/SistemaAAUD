// App.jsx

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ForcedPasswordChangePage from '../modules/auth/pages/ForcedPasswordChangePage';
import LoginPage from '../modules/auth/pages/LoginPage';

// Incidencias
import IncidentDetails from '../modules/incidents/pages/IncidentDetails';
import IncidentsMonitorPage from '../modules/incidents/pages/IncidentsMonitorPage';
import IncidentsPage from '../modules/incidents/pages/IncidentsPage';

import ActivityLogsPage from '../modules/activity/pages/ActivityLogsPage';
import Dashboard from '../modules/dashboard/pages/Dashboard';
import useAuth from '../shared/hooks/useAuth';
import NotFoundPage from './NotFoundPage';
import NoAccessPage from '../shared/components/pages/NoAccessPage';
import { getDefaultRoute } from '../shared/utils/accessRoutes';

// Inventario
import ProfilePage from '../modules/auth/pages/ProfilePage';
import InventoryMovementsPage from '../modules/inventory/devices/pages/InventoryMovementsPage';
import InventoryPage from '../modules/inventory/devices/pages/InventoryPage';
import TonerMovementsPage from '../modules/inventory/toners/pages/TonerMovementsPage';
import TonersPage from '../modules/inventory/toners/pages/TonersPage';
import WarehousePage from '../modules/warehouse/pages/WarehousePage';

// Rutas de administración
import AdminRoute from '../modules/admin/AdminRoute';
import BrandsManager from '../modules/admin/components/brands/BrandsManager';
import ClassificationRulesManager from '../modules/admin/components/classificationRules/ClassificationRulesManager';
import DepartmentsManager from '../modules/admin/components/departments/DepartmentManager';
import DevicesManager from '../modules/admin/components/devices/DevicesManager';
import ModelsManager from '../modules/admin/components/models/ModelsManager';
import PermissionsManager from '../modules/admin/components/permissions/PermissionsManager';
import StatusManager from '../modules/admin/components/status/StatusManager';
import TonersManager from '../modules/admin/components/toners/TonersManager';
import TransferRequestsManager from '../modules/admin/components/transfers/TransferRequestsManager';
import UbicationsManager from '../modules/admin/components/ubications/UbicationsManager';
import UsersManager from '../modules/admin/components/users/UsersManager';
import WarehouseItemsManager from '../modules/admin/components/warehouseItems/WarehouseItemsManager';
import RolesManager from '../modules/admin/components/roles/RolesManager';
import NotificationRecipientsManager from '../modules/admin/components/notifications/NotificationRecipientsManager';
import AdminPage from '../modules/admin/pages/AdminPage';

import PrivateLayout from '../shared/components/layout/PrivateLayout';

// Componente para proteger rutas
const PrivateRoute = ({ children, allowedUserTypes, allowForcedPasswordChange = false }) => {
  const { isAuthenticated, userType, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>; // O un spinner
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige al login
    return <Navigate to="/login" replace />;
  }

  if (
    mustChangePassword &&
    !allowForcedPasswordChange &&
    location.pathname !== '/cambiar-contraseña'
  ) {
    return <Navigate to="/cambiar-contraseña" replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    return <Navigate to="/" replace />; // O a una página 403
  }
  return children;
};

const DefaultLandingRedirect = () => {
  const { hasAnyPermission } = useAuth();
  return <Navigate to={getDefaultRoute(hasAnyPermission)} replace />;
};

const PermissionRoute = ({ children, permission }) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AnyPermissionRoute = ({ children, permissions }) => {
  const { hasAnyPermission } = useAuth();

  if (!hasAnyPermission(permissions)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { loading, isAuthenticated } = useAuth();

  // Muestra un loader mientras se verifica la autenticación inicial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">Cargando aplicación...</div>
    );
  }

  return (
    <>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/cambiar-contraseña"
          element={
            <PrivateRoute
              allowedUserTypes={['trabajador', 'admin', 'tecnico', 'consultor', 'custom']}
              allowForcedPasswordChange
            >
              <ForcedPasswordChangePage />
            </PrivateRoute>
          }
        />

        {/* Incidencias */}
        <Route
          path="/"
          element={isAuthenticated ? <DefaultLandingRedirect /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/sin-acceso"
          element={
            <PrivateRoute>
              <NoAccessPage />
            </PrivateRoute>
          }
        />

        {/* Ruta pública para ver detalles de incidencia con token */}
        <Route path="/incidencias/view" element={<IncidentDetails />} />

        {/* Página principal de incidencias protegida */}
        <Route
          path="/incidencias"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PrivateLayout>
                <IncidentsPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* Ruta para ver detalles de una incidencia */}
        <Route
          path="/incidencias/:id"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <IncidentDetails />
            </PrivateRoute>
          }
        />

        {/* Monitor de incidencias */}
        <Route
          path="/incidencias/monitor"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PermissionRoute permission="incidents.read">
                <IncidentsMonitorPage />
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        {/* Página de inventario protegida */}
        <Route
          path="/inventario/equipos"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <AnyPermissionRoute permissions={['inventory.read', 'warehouse_stock.read']}>
                <PrivateLayout>
                  <InventoryPage />
                </PrivateLayout>
              </AnyPermissionRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/inventario/equipos/history"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PermissionRoute permission="inventory.read">
                <PrivateLayout>
                  <InventoryMovementsPage />
                </PrivateLayout>
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        {/* Ruta para ver el inventario de los toners */}
        <Route
          path="/inventario/toners"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PermissionRoute permission="toners.read">
                <PrivateLayout>
                  <TonersPage />
                </PrivateLayout>
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        {/* Ruta para ver el historial del inventario de los toners */}
        <Route
          path="/inventario/toners/history"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PermissionRoute permission="toner_movements.read">
                <PrivateLayout>
                  <TonerMovementsPage />
                </PrivateLayout>
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/almacen"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PermissionRoute permission="warehouse_stock.read">
                <PrivateLayout>
                  <WarehousePage />
                </PrivateLayout>
              </PermissionRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/almacen/historial"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PermissionRoute permission="warehouse_movements.read">
                <PrivateLayout>
                  <WarehousePage historyOnly />
                </PrivateLayout>
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <ProfilePage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <AnyPermissionRoute permissions={['incidents.read', 'inventory.read']}>
                <PrivateLayout>
                  <Dashboard />
                </PrivateLayout>
              </AnyPermissionRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/actividad"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador', 'custom']}>
              <PermissionRoute permission="users.read">
                <PrivateLayout>
                  <ActivityLogsPage />
                </PrivateLayout>
              </PermissionRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PrivateLayout>
                <AdminPage />
              </PrivateLayout>
            </AdminRoute>
          }
        >
          <Route path="devices" element={<DevicesManager />} />
          <Route path="classification-rules" element={<ClassificationRulesManager />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="ubications" element={<UbicationsManager />} />
          <Route path="models" element={<ModelsManager />} />
          <Route path="brands" element={<BrandsManager />} />
          <Route path="departments" element={<DepartmentsManager />} />
          <Route path="statuses" element={<StatusManager />} />
          <Route path="toners" element={<TonersManager />} />
          <Route path="warehouse-items" element={<WarehouseItemsManager />} />
          <Route path="permissions" element={<PermissionsManager />} />
          <Route path="roles" element={<RolesManager />} />
          <Route path="notifications" element={<NotificationRecipientsManager />} />
          <Route path="transfers" element={<TransferRequestsManager />} />
          <Route
            index
            element={
              <div className="flex items-center justify-center h-[40vh]">
                <span className="text-3xl font-bold text-gray-700">Selecciona una opción</span>
              </div>
            }
          />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
