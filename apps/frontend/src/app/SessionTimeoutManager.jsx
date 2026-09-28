// SessionTimeoutManager.jsx

import SessionTimeoutModal from '../modules/auth/components/SessionTimeoutModal';
import useAuth from '../shared/hooks/useAuth';
import useSessionTimeout from '../shared/hooks/useSessionTimeout';

export default function SessionTimeoutManager() {
  const { isAuthenticated, logout } = useAuth();

  const { showWarning, secondsRemaining, continueSession } = useSessionTimeout({
    enabled: isAuthenticated,
    inactivityTimeout: 15 * 60 * 1000, // 15 minutos
    warningDuration: 60 * 1000, // 1 minuto
    onTimeout: logout,
  });

  return (
    <SessionTimeoutModal
      open={showWarning}
      secondsRemaining={secondsRemaining}
      onContinue={continueSession}
      onLogout={logout}
    />
  );
}
