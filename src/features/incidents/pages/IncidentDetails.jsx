// src/pages/incidents/IncidentDetails.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { onIncidentUpdated } from '@/services/socket/incidentsSocket';
import { connectSocket, disconnectSocket } from '@/services/socket/socketClient';
import { formatDateToDDMMYYYY, formatDateTime } from '@/shared/utils/formatDate';


function IncidentDetails() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const thClass = "font-semibold text-blue-300";

    const statusInfo = {
        1: { text: 'Pendiente', color: 'text-red-400' },
        2: { text: 'Asignado a un técnico', color: 'text-yellow-400' },
        3: { text: 'Resuelto', color: 'text-green-400' },
    };

    useEffect(() => {
        connectSocket();

        const fetchData = async () => {
            try {
                let response;
                if (token) {
                    response = await axios.get(`/api/incidents/public/${token}`);
                    setIncident(response.data.data);
                } else if (id) {
                    response = await axios.get(`/api/incidents/${id}`);
                    setIncident(response.data);
                } else {
                    throw new Error('ID o token no proporcionado');
                }
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'No se pudo cargar la incidencia.'
                );

            } finally {
                setLoading(false);
            }
        };

        fetchData();

        socket.on('connect', () => {
            console.log('Socket conectado en IncidentDetails');
            if (id) socket.emit('joinIncidentRoom', id);
            else if (token) socket.emit('joinIncidentRoomByToken', token);
        });

        onIncidentUpdated((updatedIncident) => {
            if (
                (id && updatedIncident.id === parseInt(id)) ||
                (token && updatedIncident.token === token)
            ) {
                setIncident(updatedIncident);
            }
        });

        return () => {
            disconnectSocket();
        };
    }, [id, token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
                <p className="text-xl">Cargando incidencia...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
                <div className="text-center">
                    <h1 className="mb-4 text-3xl font-bold">Error</h1>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 mt-6 transition transform bg-blue-600 rounded-md hover:bg-blue-700 hover:scale-105"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-6 text-white bg-gradient-to-br from-gray-900 to-gray-700">
            <div className="bg-gray-800 p-8 md:p-12 rounded-lg shadow-2xl border border-gray-700 max-w-xl w-full transform transition-all duration-300 ease-in-out hover:scale-[1.01]">
                <h2 className="mb-6 text-3xl font-bold text-center text-blue-400 md:text-4xl">
                    Detalle de la Incidencia #{String(incident.id).padStart(6, '0')}
                </h2>

                <div className="space-y-4 text-gray-200">
                    <p>
                        <span className={thClass}>Reportado por:</span>{' '}
                        {incident.reporter_name}
                    </p>

                    <p>
                        <span className={thClass}>Correo:</span>{' '}
                        {incident.reporter_email || 'No proporcionado'} 
                    </p>

                    <p>
                        <span className={thClass}>Ubicación:</span>{' '}
                        {incident.ubication_name}
                    </p>

                    <p>
                        <span className={thClass}>Departamento:</span>{' '}
                        {incident.department_name}
                    </p>

                    <p>
                        <span className={thClass}>Categoría:</span>{' '}
                        {incident.category_name}
                    </p>

                    {incident.other_category_detail && (
                        <p>
                            <span className={thClass}>Otra categoría:</span>{' '}
                            {incident.other_category_detail}
                        </p>
                    )}
                    <p>
                        <span className={thClass}>Descripción:</span>{' '}
                        {incident.description}
                    </p>

                    <p>
                        <p>
                            <span className={thClass}>Fecha de creación:</span>{' '}
                            {formatDateToDDMMYYYY(incident.creation_date)}{' '}
                        </p>


                    </p>

                    <p className={statusInfo[incident.id_status]?.color || 'text-gray-400'}>
                        <span className={thClass}>Estado:</span> {statusInfo[incident.id_status]?.text || 'Desconocido'}
                    </p>

                    <p className={statusInfo[incident.id_status]?.color || 'text-gray-200'}>
                        <span className={thClass}>Técnico asignado:</span>{' '}
                        {incident.technician_full_name || 'No asignado'}
                    </p>

                    {incident.solution && (
                        <p>
                            <span className={thClass}>Solución:</span>{' '}
                            {incident.solution}
                        </p>
                    )}

                    {incident.solution_date && (
                        <p>
                            <span className={thClass}>Fecha de solución:</span>{' '}
                            {formatDateToDDMMYYYY(incident.solution_date)}
                        </p>
                    )}

                </div>

                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 font-semibold text-white transition-all duration-300 ease-in-out transform bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}

export default IncidentDetails;