// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import IncidentsPage from './components/incidents/pages/IncidentsPage';
import NotFoundPage from './pages/NotFoundPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import useAuth from './hooks/useAuth';
import IncidentDetails from './components/incidents/pages/IncidentDetails';
import SelectorPage from './pages/SelectorPage';
import InventoryPage from './components/inventory/pages/InventoryPage';
import AdminRoute from '@/components/admin/AdminRoute';
import AdminPage from "./components/admin/pages/AdminPage";
import DevicesManager from "./components/admin/DevicesManager";
import UsersManager from "./components/admin/UsersManager";
import UbicationsManager from "./components/admin/UbicationsManager";
import DepartmentsManager from "./components/admin/DepartmentManager";
import BrandsManager from "./components/admin/BrandsManager";
import ModelsManager from './components/admin/ModelsManager';
import TonersManager from './components/admin/TonersManager';
import StatusManager from './components/admin/StatusManager';

// Componente para proteger rutas
const PrivateRoute = ({ children, allowedUserTypes }) => {
  const { isAuthenticated, userType, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>; // O un spinner
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige al login
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {

    return <Navigate to="/" replace />; // O a una página 403
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const { loading } = useAuth();

  // Muestra un loader mientras se verifica la autenticación inicial
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando aplicación...</div>;
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
            <PrivateRoute allowedUserTypes={['trabajador', 'admin', 'tecnico', 'secretaria']}>
              <SelectorPage />
            </PrivateRoute>
          }
        />

        {/* Página principal de incidencias protegida */}
        <Route
          path="/incidencias"
          element={
            <PrivateRoute allowedUserTypes={['trabajador', 'admin', 'tecnico', 'secretaria']}>
              <IncidentsPage />
            </PrivateRoute>
          }
        />

        {/* Ruta para ver detalles de una incidencia */}
        <Route
          path="/incidencias/:id" element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'secretaria', 'trabajador']}>
              <IncidentDetails />
            </PrivateRoute>
          } />

        {/* Página de inventario protegida */}
        <Route
          path="/inventario"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico', 'secretaria']}>
              <InventoryPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedUserTypes={['admin', 'tecnico']}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
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

        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>}>
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