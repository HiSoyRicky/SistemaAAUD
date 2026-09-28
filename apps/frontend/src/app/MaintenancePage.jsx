import { RefreshCw, Wrench } from 'lucide-react';
import { useState } from 'react';

const MaintenancePage = ({ onRetry }) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;

    setRetrying(true);

    try {
      if (onRetry) {
        await onRetry();
      } else {
        window.location.reload();
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-lg text-center">
        {/* Icono */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-100">
            <Wrench className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Sistema temporalmente no disponible
        </h1>

        {/* Mensaje principal */}
        <p className="text-gray-600 text-lg leading-relaxed mb-3">
          El Sistema Institucional AAUD se encuentra temporalmente fuera de servicio.
        </p>

        {/* Explicación */}
        <p className="text-gray-500 leading-relaxed mb-4">
          Estamos realizando trabajos de mantenimiento o el sistema está experimentando una
          interrupción temporal.
        </p>

        {/* Botón */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                     bg-blue-600 text-white font-medium
                     hover:bg-blue-700
                     disabled:opacity-60
                     disabled:cursor-not-allowed
                     transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />

          {retrying ? 'Comprobando...' : 'Reintentar'}
        </button>
      </div>
    </div>
  );
};

export default MaintenancePage;
