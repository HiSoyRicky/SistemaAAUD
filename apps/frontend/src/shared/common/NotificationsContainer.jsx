// NotificationsContainer.jsx

import { useEffect, useState } from 'react';
import { useNotifications } from '../../app/providers/NotificationContext';

const NOTIFICATION_COLORS = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

const bgColor = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.info;

export default function NotificationsContainer() {
  const { notifications, removeNotification } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications.map((n) => ({ ...n, visible: true })));
  }, [notifications]);

  if (visibleNotifications.length === 0) return null;

  return (
    // Fondo oscuro semi-transparente
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black pointer-events-none bg-opacity-40">
      <div className="flex flex-col gap-4">
        {visibleNotifications.map(({ id, message, type, visible }) => {
          return (
            <button
              type="button"
              key={id}
              className={`
                ${bgColor} text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-2xl
                transform transition-all duration-300 ease-out
                ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-90'}
                pointer-events-auto
                max-w-xl text-center
                `}
              onClick={() => removeNotification(id)}
            >
              {message}
            </button>
          );
        })}
      </div>
    </div>
  );
}
