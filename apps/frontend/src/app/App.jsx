// App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from '../modules/auth/pages/LoginPage';
import ForcedPasswordChangePage from '../modules/auth/pages/ForcedPasswordChangePage';

// Incidencias
import IncidentsPage from '../modules/incidents/pages/IncidentsPage';
import IncidentDetails from '../modules/incidents/pages/IncidentDetails';
import IncidentsMonitorPage from '../modules/incidents/pages/IncidentsMonitorPage';

import NotFoundPage from './NotFoundPage';
import Dashboard from '../modules/dashboard/pages/Dashboard';
import ActivityLogsPage from '../modules/activity/pages/ActivityLogsPage';
import useAuth from '../shared/hooks/useAuth';

// Inventario
import InventoryPage from '../modules/inventory/devices/pages/InventoryPage';
import InventoryMovementsPage from '../modules/inventory/devices/pages/InventoryMovementsPage';
import ProfilePage from '../modules/auth/pages/ProfilePage';
import TonersPage from '../modules/inventory/toners/pages/TonersPage';
import TonerMovementsPage from '../modules/inventory/toners/pages/TonerMovementsPage';

// Rutas de administración
import AdminRoute from '../modules/admin/AdminRoute';
import AdminPage from "../modules/admin/pages/AdminPage";
import DevicesManager from "../modules/admin/components/devices/DevicesManager";
import UsersManager from "../modules/admin/components/users/UsersManager";
import UbicationsManager from "../modules/admin/components/ubications/UbicationsManager";
import DepartmentsManager from "../modules/admin/components/departments/DepartmentManager";
import BrandsManager from "../modules/admin/components/brands/BrandsManager";
import ModelsManager from '../modules/admin/components/models/ModelsManager';
import TonersManager from '../modules/admin/components/toners/TonersManager';
import StatusManager from '../modules/admin/components/status/StatusManager';
import PermissionsManager from '../modules/admin/components/permissions/PermissionsManager';


import PrivateLayout from "../shared/components/layout/PrivateLayout";

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

  if (mustChangePassword && !allowForcedPasswordChange && location.pathname !== '/cambiar-contrasena') {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {

    return <Navigate to="/" replace />; // O a una página 403
  }
  return children;
};

function App() {
  const { loading, isAuthenticated } = useAuth();

  // Muestra un loader mientras se verifica la autenticación inicial
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando aplicación...</div>;
  }

  return (
    <>
      <Routes>
        {/* Login público */}
        <Route
          path="/login"
          element={
            <LoginPage />

          }
        />



        <Route
          path="/cambiar-contrasena"
          element={
            <PrivateRoute
              allowedUserTypes={['trabajador', 'admin', 'tecnico', 'consultor']}
              allowForcedPasswordChange
            >
              <ForcedPasswordChangePage />
            </PrivateRoute>
          }
        />

        {/* Incidencias */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/incidencias" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Ruta pública para ver detalles de incidencia con token */}
        <Route
          path="/incidencias/view"
          element={
            <IncidentDetails />
          }
        />

        {/* Página principal de incidencias protegida */}
        <Route
          path="/incidencias"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador']}>
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
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador']}>
              <IncidentDetails />
            </PrivateRoute>
          }
        />

        {/* Monitor de incidencias */}
        <Route
          path="/incidencias/monitor"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <IncidentsMonitorPage />
            </PrivateRoute>
          }
        />

        {/* Página de inventario protegida */}
        <Route
          path="/inventario/equipos"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <InventoryPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/inventario/equipos/history"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <InventoryMovementsPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* Ruta para ver el inventario de los toners */}
        <Route
          path="/inventario/toners"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <TonersPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* Ruta para ver el historial del inventario de los toners */}
        <Route
          path="/inventario/toners/history"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <TonerMovementsPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <ProfilePage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <Dashboard />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/actividad"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <ActivityLogsPage />
              </PrivateLayout>
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
          <Route path="users" element={<UsersManager />} />
          <Route path="ubications" element={<UbicationsManager />} />
          <Route path="models" element={<ModelsManager />} />
          <Route path="brands" element={<BrandsManager />} />
          <Route path="departments" element={<DepartmentsManager />} />
          <Route path="statuses" element={<StatusManager />} />
          <Route path="toners" element={<TonersManager />} />
          <Route path="permissions" element={<PermissionsManager />} />
          <Route
            index
            element={
              <div className="flex items-center justify-center h-[40vh]">
                <span className="text-3xl font-bold text-gray-700">
                  Selecciona una opción
                </span>
              </div>
            }
          />
        </Route>

        {/* Ruta 404 */}
        <Route
          path="*"
          element={
            <NotFoundPage />
          }
        />

      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

    </>
  );
}

export default App;
