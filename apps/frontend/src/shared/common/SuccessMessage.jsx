// SuccessMessage.jsx

import { AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

function SuccessMessage({ message, type = 'success', onClose, duration = 3000 }) {
  if (!message) return null;

  const bgColors = {
    success: 'bg-green-100',
    error: 'bg-red-100',
    info: 'bg-blue-100',
    warning: 'bg-yellow-100',
  };

  const textColors = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700',
    warning: 'text-yellow-700',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 mr-2 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 mr-2 text-red-600" />,
  };

  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`${bgColors[type]} ${textColors[type]} p-4 rounded mb-4 shadow flex items-center`}
    >
      {icons[type] || null}
      <span>{message}</span>
    </div>
  );
}

export default SuccessMessage;
