// src/pages/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
    const navigate = useNavigate();
    //const { logout } = useAuth();

    const handleGoHome = () => {
        //logout();
        navigate('/login', { replace: true });
    };

    const handleGoBack = () => {
        navigate(-1); // Intenta regresar a la página anterior
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6">
            <div className="text-center bg-gray-800 p-8 md:p-12 rounded-lg shadow-2xl border border-gray-700 max-w-lg w-full transform transition-all duration-300 ease-in-out hover:scale-105">
                <h1 className="text-9xl font-extrabold text-blue-500 mb-4 animate-bounce">
                    404
                </h1>
                <h2 className="text-4xl font-bold mb-4 text-gray-100">
                    ¡Ups! Página no encontrada.
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                    Parece que te has perdido. La página que buscas no existe.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={handleGoHome}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                    >
                        Ir a Inicio
                    </button>
                    <button
                        onClick={handleGoBack}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
                    >
                        Regresar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotFoundPage;