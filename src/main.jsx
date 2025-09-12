// src/main.jsx
import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import NotificationsContainer from './components/NotificationsContainer.jsx';

// Importar CSS de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
// Importar JS de Bootstrap (opcional, para modales, dropdowns, etc.)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

class ErrorBoundary extends Component {

  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    console.error('Error capturado:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó:', error, errorInfo);
  }



  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">Algo salió mal</h1>
          <p>{this.state.error?.message || 'Error desconocido'}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </button>
        </div>

      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
            <NotificationsContainer />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);