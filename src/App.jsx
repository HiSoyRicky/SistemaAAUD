// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import IncidentsPage from './pages/incidents/IncidentsPage'; // Esta será tu página principal con el formulario y la tabla
import NotFoundPage from './pages/NotFoundPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import useAuth from './hooks/useAuth';
import IncidentDetails from './pages/incidents/IncidentDetails';
import SelectorPage from './pages/SelectorPage';
import InventoryPage from './pages/inventory/InventoryPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRoute from '../server/routes/AAUD/AdminRoute';
import AdminPage from "./pages/admin/AdminPage";

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
        path="/admin/usuarios"
        element={
          <PrivateRoute allowedUserTypes={['admin']}>
            <AdminUsersPage />
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


      {/* Ruta 404 */}
      <Route
        path="*"
        element={
          <NotFoundPage />
        }
      />

    </Routes>
  );
}

export default App;