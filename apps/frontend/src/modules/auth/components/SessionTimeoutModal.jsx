// SessionTimeoutModal.jsx

import { Clock3 } from 'lucide-react';
import Modal from '../../../shared/components/ui/Modal';

export default function SessionTimeoutModal({ open, secondsRemaining, onContinue, onLogout }) {
  return (
    <Modal
      open={open}
      title="¿Sigues ahí?"
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <div className="text-center">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 text-amber-600 bg-amber-100 rounded-full">
          <Clock3 size={28} />
        </div>

        <p className="text-gray-700">No hemos detectado actividad recientemente.</p>

        <p className="mt-2 text-sm text-gray-500">
          Por seguridad, tu sesión se cerrará automáticamente si no confirmas que deseas continuar.
        </p>

        <div className="my-6">
          <div className="text-4xl font-bold text-gray-900">{secondsRemaining}</div>

          <div className="mt-1 text-sm text-gray-500">segundos restantes</div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-4 py-2.5 font-medium text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cerrar sesión
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full px-4 py-2.5 font-medium text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </Modal>
  );
}
