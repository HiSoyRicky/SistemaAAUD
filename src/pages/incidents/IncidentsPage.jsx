// src/pages/incidents/IncidentsPage.jsx

import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import IncidentForm from '../../components/incidents/IncidentForm';
import SummaryCards from '../../components/SummaryCards';
import IncidentTable from '../../components/incidents/IncidentTable';
import ResolveIncidentModal from '../../components/incidents/ResolveIncidentModal';
import SuccessMessage from '../../components/SuccessMessage';
import IncidentEditForm from '../../components/incidents/IncidentEditForm';
import AssignTechnicianModal from '../../components/incidents/AssignTechnicianModal';
import axios from 'axios';
import { exportIncidentsToExcel } from '../../utils/exportExcel';
import { socket, connectSocket, disconnectSocket, onIncidentCreated, onIncidentUpdated, onIncidentDeleted } from '../../services/socket';
const API_URL = import.meta.env.VITE_API_URL;

// Componente principal de la página de incidentes
function IncidentsPage() {
    const { userType, loggedUserName, loggedUserId} = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [currentIncidentToResolve, setCurrentIncidentToResolve] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showIncidentForm, setShowIncidentForm] = useState(false);
    const [incidentToEdit, setIncidentToEdit] = useState(null);

    useEffect(() => {
        if (userType) {

            // Conectar a Socket.IO
            connectSocket();

            // Escuchar eventos de Socket.IO
            onIncidentCreated((newIncident) => {
                setIncidents((prev) => [...prev, newIncident].sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date)));
                socket.emit('joinIncidentRoom', newIncident.id); // Unirse a la sala de la nueva incidencia
                showNotification('Nueva incidencia creada', 'success');
            });

            onIncidentUpdated((updatedIncident) => {
                setIncidents((prev) =>
                    prev.map((inc) => (inc.id === updatedIncident.id ? updatedIncident : inc)).sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date))
                );
                // Mensaje específico si la incidencia fue resuelta
                const message = updatedIncident.id_status === 3 ? 'Incidencia resuelta por técnico' : 'Incidencia actualizada';
                showNotification(message, 'success');
            });

            onIncidentDeleted(({ id }) => {
                console.log('Incidencia eliminada recibida:', id);
                setIncidents((prev) => prev.filter((inc) => inc.id !== id));
                socket.emit('leaveIncidentRoom', id); // Abandonar sala
                showNotification('Incidencia eliminada', 'success');
            });

            // Cargar datos iniciales
            fetchIncidents();
            fetchTechnicians();

            // Desconectar y abandonar todas las salas al desmontar
            return () => {
                incidents.forEach((inc) => socket.emit('leaveIncidentRoom', inc.id));
                disconnectSocket();
            };
        }
    }, [userType]);

    const fetchIncidents = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/incidents/`);
            let fetchedIncidents = response.data;
            if (userType === 'tecnico' && loggedUserId && !isNaN(parseInt(loggedUserId))) {
                fetchedIncidents = fetchedIncidents.filter((inc) => inc.id_technician === parseInt(loggedUserId));
            }
            setIncidents(fetchedIncidents);
            // Unirse a las salas de todas las incidencias cargadas
            fetchedIncidents.forEach((inc) => socket.emit('joinIncidentRoom', inc.id));
        } catch (error) {
            console.error('Error al cargar incidencias:', error);
            showNotification('Error al cargar incidencias: ' + error.message, 'error');
        }
    };

    const fetchTechnicians = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/users/technicians`);
            setTechnicians(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error al cargar técnicos:', error);
            showNotification('Error al cargar técnicos: ' + error.message, 'error');
            setTechnicians([]);
        }
    };

    const handleAddIncident = async (newIncidentData) => {
        try {
            const incidentToCreate = {
                ...newIncidentData,
                username: loggedUserName,
                status: newIncidentData.status || 'Pendiente',
            };
            const response = await axios.post(`${API_URL}/api/incidents/`, incidentToCreate);
            socket.emit('joinIncidentRoom', response.data.id);
            showNotification('Incidencia reportada exitosamente!', 'success');
            return response.data;
        } catch (error) {
            console.error('Error al reportar incidencia:', error);
            showNotification('Error al reportar incidencia: ' + (error.response?.data?.error || error.message), 'error');
            throw error;
        }
    };

    const handleDeleteIncident = async (incidentId) => {
        const password = prompt('Por favor, ingresa tu contraseña para confirmar la eliminación:');
        if (!password) {
            showNotification('Eliminación cancelada: contraseña no proporcionada', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Envía la contraseña junto con la petición DELETE (en body o headers)
            await axios.delete(`${API_URL}/api/incidents/${incidentId}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { password }
            });
            showNotification('Incidencia eliminada con éxito', 'success');
        } catch (error) {
            console.error('Error al eliminar incidencia:', error);
            showNotification('Error al eliminar incidencia: ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    const showNotification = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 10000);
    };

    const handleOpenAssignModal = (incidentId) => {
        console.log('Abriendo modal para incidencia:', incidentId);
        setSelectedIncidentId(incidentId);
        setShowAssignModal(true);
    };

    const handleOpenResolveModal = (incidentId) => {
        setCurrentIncidentToResolve(incidentId);
        setShowResolveModal(true);
    };

    const confirmAssign = async (technicianUsername) => {
        if (!selectedIncidentId || !technicianUsername) {
            console.error('Faltan selectedIncidentId o technicianUsername:', { selectedIncidentId, technicianUsername });
            showNotification('Error: Selecciona una incidencia y un técnico válidos', 'error');
            return;
        }

        try {
            console.log('Asignando técnico:', technicianUsername, 'a incidencia:', selectedIncidentId);
            await axios.put(`${API_URL}/api/incidents/${selectedIncidentId}`, {
                technician: technicianUsername,
                status: 'Asignado',
            });
            showNotification('Técnico asignado correctamente', 'success');
        } catch (error) {
            console.error('Error al asignar técnico:', error);
            showNotification('Error al asignar técnico: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setShowAssignModal(false);
            setSelectedIncidentId(null);
        }
    };

    const submitSolution = async (solutionText) => {
        if (currentIncidentToResolve && solutionText) {
            try {
                await axios.put(`${API_URL}/api/incidents/${currentIncidentToResolve}`, {
                    status: 'Resuelto',
                    solution: solutionText,
                    solution_date: new Date().toISOString(),
                });
                showNotification('Incidencia resuelta correctamente', 'success');
                setShowResolveModal(false);
                setCurrentIncidentToResolve(null);
            } catch (error) {
                console.error('Error al resolver incidencia:', error);
                showNotification('Error al resolver incidencia: ' + (error.response?.data?.error || error.message), 'error');
            }
        }
    };

    const handleExportIncidents = () => {
        exportIncidentsToExcel(incidents);
        showNotification('Incidencias exportadas a Excel', 'success');
    };

    const filteredIncidentsForTable =
        userType === 'tecnico' && loggedUserId && !isNaN(parseInt(loggedUserId))
            ? incidents.filter((inc) => inc.id_technician && inc.id_technician === parseInt(loggedUserId))
            : incidents;

    const sortedIncidentsForTable = filteredIncidentsForTable.slice().sort((a, b) =>
        new Date(b.creation_date) - new Date(a.creation_date)
    );

    return (
        <div className="container mx-auto p-4">
            {message && <SuccessMessage message={message} type={messageType} />}

            {['admin', 'tecnico', 'secretaria'].includes(userType) && (
                <div className="mb-6 flex justify-center">
                    <button
                        onClick={() => setShowIncidentForm((prev) => !prev)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {showIncidentForm ? 'Cerrar formulario' : 'Reportar Nueva Incidencia'}
                    </button>
                </div>
            )}

            {showIncidentForm && (
                <section className="mb-8">
                    <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                </section>
            )}

            {['trabajador'].includes(userType) && (
                <section className="mb-8">
                    <h2 className="text-3xl font-bold mb-4">Reportar Nueva Incidencia</h2>
                    <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                </section>
            )}

            {userType && userType !== 'trabajador' && (
                <section className="mb-8">
                    <SummaryCards
                        incidents={incidents}
                        userType={userType}
                        loggedUserId={parseInt(loggedUserId)}
                    />
                </section>
            )}

            {userType && userType !== 'trabajador' && (
                <section>
                    <h2 className="text-3xl font-bold mb-4 text-center">Listado de Incidencias</h2>
                    <div className="flex justify-center mb-4">
                        {userType === 'admin' && (
                            <button
                                onClick={handleExportIncidents}
                                className="mb-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Exportar a Excel
                            </button>
                        )}
                    </div>
                    <div id="scroll-container" className="overflow-x-auto w-full">
                        <IncidentTable
                            incidents={sortedIncidentsForTable}
                            userType={userType}
                            onAssign={['admin', 'secretaria'].includes(userType) ? handleOpenAssignModal : null}
                            onResolve={userType === 'tecnico' ? handleOpenResolveModal : null}
                            onDelete={userType === 'admin' ? handleDeleteIncident : null}
                            onEdit={setIncidentToEdit}
                        />
                    </div>
                </section>
            )}

            {incidentToEdit && incidentToEdit.id ? (
                <div style={{ border: '2px solid red', padding: '10px', background: 'white' }}>
                    <IncidentEditForm
                        incident={incidentToEdit}
                        onCancel={() => setIncidentToEdit(null)}
                        onSave={(updatedIncident) => {
                            setIncidents((prev) =>
                                prev.map((i) => (i.id === updatedIncident.id ? updatedIncident : i))
                            );
                            setIncidentToEdit(null);
                            showNotification('Incidencia actualizada con éxito', 'success');
                        }}
                    />
                </div>
            ) : (
                incidentToEdit && <div>Error: Incidencia no válida</div>
            )}

            {showAssignModal && (
                <AssignTechnicianModal
                    incidentId={selectedIncidentId}
                    technicians={technicians}
                    onClose={() => {
                        console.log('Cerrando modal de asignación');
                        setShowAssignModal(false);
                        setSelectedIncidentId(null);
                    }}
                    onConfirm={confirmAssign}
                />
            )}

            {showResolveModal && (
                <ResolveIncidentModal
                    incidentId={currentIncidentToResolve}
                    onClose={() => setShowResolveModal(false)}
                    onConfirm={submitSolution}
                />
            )}
        </div>
    );
}

export default IncidentsPage;