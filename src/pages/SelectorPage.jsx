// src/pages/SelectorPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

function SelectorPage() {
    const { userType } = useAuth();

    return (
        <div className="flex items-start justify-center py-10 bg-gray-100">
            <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md">
                <h2 className="mb-6 text-2xl font-bold">Seleccione una opción</h2>
                <div className="space-y-4">

                    {/* Solo si NO es secretaria o trabajador */}
                    {!['secretaria', 'trabajador'].includes(userType?.toLowerCase()) && (
                        <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
                        >
                            Menú Principal
                        </Link>
                    )}

                    <Link
                        to="/incidencias"
                        className="block px-4 py-2 text-white bg-green-500 rounded hover:bg-green-700"
                    >
                        Sistema de Incidencias
                    </Link>

                    {/* Solo si NO es trabajador */}
                    {userType?.toLowerCase() !== 'trabajador' && (
                        <Link
                            to="/inventario"
                            className="block px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
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