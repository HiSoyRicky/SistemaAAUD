// src/pages/SelectorPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

function SelectorPage() {
    const { userType } = useAuth();

    return (
        <div className="flex items-start justify-center bg-gray-100 py-10">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">Seleccione una opción</h2>
                <div className="space-y-4">

                    {/* Solo si NO es secretaria o trabajador */}
                    {!['secretaria', 'trabajador'].includes(userType?.toLowerCase()) && (
                        <Link
                            to="/dashboard"
                            className="block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
                        >
                            Menú Principal
                        </Link>
                    )}

                    <Link
                        to="/incidencias"
                        className="block bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
                    >
                        Sistema de Incidencias
                    </Link>

                    {/* Solo si NO es trabajador */}
                    {userType?.toLowerCase() !== 'trabajador' && (
                        <Link
                            to="/inventario"
                            className="block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
                        >
                            Sistema de Inventario
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SelectorPage;