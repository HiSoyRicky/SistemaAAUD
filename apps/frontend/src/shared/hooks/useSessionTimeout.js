// useSessionTimeout.jsx

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_INACTIVITY_TIMEOUT = 15 * 60 * 1000;
const DEFAULT_WARNING_DURATION = 60 * 1000;

export default function useSessionTimeout({
  enabled,
  onTimeout,
  inactivityTimeout = DEFAULT_INACTIVITY_TIMEOUT,
  warningDuration = DEFAULT_WARNING_DURATION,
}) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(warningDuration / 1000));

  const inactivityTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const activityThrottleRef = useRef(null);

  // Ref para conocer el estado actual del modal
  // dentro de los listeners sin depender del closure.
  const showWarningRef = useRef(false);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearTimers();

    showWarningRef.current = false;
    setShowWarning(false);
    setSecondsRemaining(Math.ceil(warningDuration / 1000));

    inactivityTimerRef.current = setTimeout(() => {
      showWarningRef.current = true;
      setShowWarning(true);

      let remaining = Math.ceil(warningDuration / 1000);

      setSecondsRemaining(remaining);

      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;

        setSecondsRemaining(Math.max(remaining, 0));

        if (remaining <= 0) {
          clearTimers();

          showWarningRef.current = false;
          setShowWarning(false);

          if (onTimeout) {
            onTimeout();
          }
        }
      }, 1000);
    }, inactivityTimeout);
  }, [clearTimers, inactivityTimeout, warningDuration, onTimeout]);

  const continueSession = useCallback(() => {
    startInactivityTimer();
  }, [startInactivityTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();

      showWarningRef.current = false;
      setShowWarning(false);

      return undefined;
    }

    const handleActivity = () => {
      // IMPORTANTE:
      // mientras el modal está visible, ninguna actividad
      // reinicia el temporizador.
      if (showWarningRef.current) {
        return;
      }

      // Evita reiniciar el timer demasiadas veces
      // por mousemove/scroll.
      if (activityThrottleRef.current) {
        return;
      }

      activityThrottleRef.current = setTimeout(() => {
        activityThrottleRef.current = null;

        // Volvemos a comprobar el estado actual.
        // Puede haber aparecido el modal durante estos 500 ms.
        if (showWarningRef.current) {
          return;
        }

        startInactivityTimer();
      }, 500);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, {
        passive: true,
      });
    });

    // Inicia el contador al activar la sesión.
    startInactivityTimer();

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });

      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
        activityThrottleRef.current = null;
      }

      clearTimers();
    };
  }, [enabled, startInactivityTimer, clearTimers]);

  return {
    showWarning,
    secondsRemaining,
    continueSession,
  };
}
