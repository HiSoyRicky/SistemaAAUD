// NotFoundPage.jsx

import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/login', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 text-white bg-gradient-to-br from-gray-900 to-gray-700">
      <div className="w-full max-w-lg p-8 text-center transition-all duration-300 ease-in-out transform bg-gray-800 border border-gray-700 rounded-lg shadow-2xl md:p-12 hover:scale-105">
        <h1 className="mb-4 font-extrabold text-blue-500 text-9xl animate-bounce">404</h1>
        <h2 className="mb-4 text-4xl font-bold text-gray-100">¡Ups! Página no encontrada.</h2>
        <p className="mb-8 text-lg text-gray-300">
          Parece que te has perdido. La página que buscas no existe.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={handleGoHome}
            className="px-6 py-3 font-semibold text-white transition-all duration-300 ease-in-out transform bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          >
            Ir a Inicio
          </button>
          <button
            type="button"
            onClick={handleGoBack}
            className="px-6 py-3 font-semibold text-white transition-all duration-300 ease-in-out transform bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
          >
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
