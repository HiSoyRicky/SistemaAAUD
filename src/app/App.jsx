// App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from '@/features/auth/pages/LoginPage';

// Incidencias
import IncidentsPage from '@/features/incidents/pages/IncidentsPage';
import IncidentDetails from '@/features/incidents/pages/IncidentDetails';

import NotFoundPage from './NotFoundPage';
import Dashboard from '../features/dashboard/pages/Dashboard';
import useAuth from '../shared/hooks/useAuth';

import SelectorPage from '../features/dashboard/pages/SelectorPage';

// Inventario
import InventoryPage from '@/features/inventory/pages/InventoryPage';
import ProfilePage from '../features/auth/pages/ProfilePage';

// Rutas de administración
import AdminRoute from '@/features/admin/AdminRoute';
import AdminPage from "../features/admin/pages/AdminPage";
import DevicesManager from "../features/admin/components/devices/DevicesManager";
import UsersManager from "../features/admin/components/users/UsersManager";
import UbicationsManager from "../features/admin/components/ubications/UbicationsManager";
import DepartmentsManager from "../features/admin/components/departments/DepartmentManager";
import BrandsManager from "../features/admin/components/brands/BrandsManager";
import ModelsManager from '../features/admin/components/models/ModelsManager';
import TonersManager from '../features/admin/components/toners/TonersManager';
import StatusManager from '../features/admin/components/status/StatusManager';


import PrivateLayout from "@/shared/components/layout/PrivateLayout";

// Componente para proteger rutas
const PrivateRoute = ({ children, allowedUserTypes }) => {
  const { isAuthenticated, userType, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>; // O un spinner
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige al login
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {

    return <Navigate to="/" replace />; // O a una página 403
  }
  return children;
};

function App() {
  const { loading } = useAuth();

  // Muestra un loader mientras se verifica la autenticación inicial
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando aplicación...</div>;
  }

  return (
    <>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta pública para ver detalles de incidencia con token */}
        <Route path="/incidencias/view" element={<IncidentDetails />} />

        {/* Selector de sistema */}
        <Route
          path="/selector"
          element={
            <PrivateRoute allowedUserTypes={['trabajador', 'admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <SelectorPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* Página principal de incidencias protegida */}
        <Route
          path="/incidencias"
          element={
            <PrivateRoute allowedUserTypes={['trabajador', 'admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <IncidentsPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* Ruta para ver detalles de una incidencia */}
        <Route
          path="/incidencias/:id" element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor', 'trabajador']}>
              <IncidentDetails />
            </PrivateRoute>
          } />

        {/* Página de inventario protegida */}
        <Route
          path="/inventario"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <InventoryPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute allowedUserTypes={['trabajador', 'admin', 'tecnico', 'consultor']}>
              <PrivateLayout>
                <ProfilePage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico']}>
              <PrivateLayout>
                <Dashboard />
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
        />

        {/* Redirección automática de "/" hacia "/login" */}
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace />}
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
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;