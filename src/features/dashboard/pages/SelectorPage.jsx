// SelectorPage.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/shared/hooks/useAuth';

function SelectorPage() {
    const { userType } = useAuth();
    const navigate = useNavigate();

    // 🔥 Redirección automática si es trabajador
    useEffect(() => {
        if (userType?.toLowerCase() === 'trabajador') {
            navigate('/incidencias');
        }
    }, [userType, navigate]);

    return (
        <div className="flex items-start justify-center py-10 bg-gray-100">
            <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md">
                <h2 className="mb-6 text-2xl font-bold">Seleccione una opción</h2>

                <div className="space-y-4">
                    {/* Solo si NO es consultor o trabajador */}
                    {!['consultor', 'trabajador'].includes(userType?.toLowerCase()) && (
                        <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
                        >
                            Dashboard
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
