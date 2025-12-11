// src/components/SummaryCards.jsx
import React from 'react';
import useAuth from '@/hooks/useAuth';

function SummaryCards({ incidents, userType, loggedUserId }) {
    const total = incidents.length;

    const pending = incidents.filter(i => {
        if (userType === 'tecnico') {
            return i.id_status === 2 && i.id_technician === loggedUserId; // Asignadas al técnico y sin resolver
        }
        return i.id_status === 1; // Pendientes sin asignar
    }).length;

    const resolved = incidents.filter(i => i.id_status === 3).length;

    return (
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
            <div className="p-6 text-center bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700">Total de Incidencias</h3>
                <p className="text-4xl font-bold text-blue-600">{total}</p>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700">Incidencias Pendientes</h3>
                <p className="text-4xl font-bold text-orange-600">{pending}</p>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700">Incidencias Resueltas</h3>
                <p className="text-4xl font-bold text-green-600">{resolved}</p>
            </div>
        </div>
    );
}

export default SummaryCards;
