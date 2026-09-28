// main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/App.jsx';

import { MaintenanceProvider } from './app/MaintenanceContext.jsx';
import { AuthProvider } from './app/providers/AuthContext.jsx';
import { NotificationProvider } from './app/providers/NotificationContext.jsx';

import './index.css';

import ErrorBoundary from './shared/components/ui/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <MaintenanceProvider>
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </MaintenanceProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
