import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const MaintenanceContext = createContext(null);

const HEALTH_CHECK_INTERVAL = 30000; // 30 segundos

export const MaintenanceProvider = ({ children }) => {
  const [maintenance, setMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkSystemHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        setMaintenance(true);
        return false;
      }

      const data = await response.json();

      if (data?.status === 'ok' && data?.database === 'ok') {
        setMaintenance(false);
        return true;
      }

      setMaintenance(true);
      return false;
    } catch (error) {
      console.error('Health Check falló:', error);
      setMaintenance(true);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Primera comprobación al cargar la aplicación
    checkSystemHealth();

    // Comprobar periódicamente
    const interval = setInterval(() => {
      checkSystemHealth();
    }, HEALTH_CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [checkSystemHealth]);

  const enableMaintenance = useCallback(() => {
    setMaintenance(true);
  }, []);

  const disableMaintenance = useCallback(() => {
    setMaintenance(false);
    checkSystemHealth();
  }, [checkSystemHealth]);

  const retry = useCallback(async () => {
    return checkSystemHealth();
  }, [checkSystemHealth]);

  return (
    <MaintenanceContext.Provider
      value={{
        maintenance,
        checking,
        enableMaintenance,
        disableMaintenance,
        checkSystemHealth,
        retry,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);

  if (!context) {
    throw new Error('useMaintenance debe utilizarse dentro de MaintenanceProvider');
  }

  return context;
};
