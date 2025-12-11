// src/pages/incidents/IncidentsPage.jsx

import React, { useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import IncidentForm from '@/components/incidents/forms/IncidentForm';
import SummaryCards from '@/components/SummaryCards';
import IncidentTable from '@/components/incidents/tables/IncidentTable';
import ResolveIncidentModal from '@/components/incidents/modals/ResolveIncidentModal';
import SuccessMessage from '@/components/SuccessMessage';
import IncidentEditForm from '@/components/incidents/forms/IncidentEditForm';
import AssignTechnicianModal from '@/components/incidents/modals/AssignTechnicianModal';
import axios from 'axios';
import { exportIncidentsToExcel } from '@/utils/exportExcel';
import { Button, Container, Row, Col } from "react-bootstrap";
import { socket, connectSocket, disconnectSocket, onIncidentCreated, onIncidentUpdated, onIncidentDeleted } from '@/services/socket';
import { API_BASE_URL as API_URL } from '@/config/apiBaseUrl.js';

// Componente principal de la página de incidentes
function IncidentsPage() {
    const { userType, loggedUserName, loggedUserId } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [currentIncidentToResolve, setCurrentIncidentToResolve] = useState(null);
    const [showIncidentForm, setShowIncidentForm] = useState(false);
    const [incidentToEdit, setIncidentToEdit] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

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

    const showNotification = (msg, type) => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    };

    const fetchIncidents = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/incidents/`);
            let fetchedIncidents = Array.isArray(response.data) ? response.data : [];

            if (userType === 'tecnico' && loggedUserId && !isNaN(parseInt(loggedUserId))) {
                fetchedIncidents = fetchedIncidents.filter(
                    (inc) => inc.id_technician === parseInt(loggedUserId)
                );
            }

            setIncidents(fetchedIncidents);

            // Solo si es array:
            fetchedIncidents.forEach((inc) => socket.emit('joinIncidentRoom', inc.id));
        } catch (error) {
            console.error('Error al cargar incidencias:', error);
            showNotification('Error al cargar incidencias: ' + error.message, 'error');
            setIncidents([]);
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
                id_category: parseInt(newIncidentData.id_category),
                id_device: newIncidentData.id_device ? parseInt(newIncidentData.id_device) : null,
                id_ubication: newIncidentData.id_ubication ? parseInt(newIncidentData.id_ubication) : null,
                id_department: newIncidentData.id_department ? parseInt(newIncidentData.id_department) : null,
                email: newIncidentData.email?.trim() || null,
                other_category_detail: newIncidentData.id_category === 4 ? newIncidentData.other_category_detail?.trim() || null : null,
            };

            console.log('Datos a enviar al backend:', JSON.stringify(incidentToCreate, null, 2));

            const response = await axios.post(`${API_URL}/api/incidents/`, incidentToCreate, {
                headers: { 'Content-Type': 'application/json' },
            });

            socket.emit('joinIncidentRoom', response.data.id);
            return response.data;
        } catch (error) {
            console.error('Error al reportar incidencia:', error);
            showNotification('Error al reportar incidencia: ' + (error.response?.data?.error || error.message), 'error');
            throw error;
        }
    };


    const handleDeleteIncident = async (id_incident) => {
        const password = prompt('Por favor, ingresa tu contraseña para confirmar la eliminación:');
        if (!password) {
            showNotification('Eliminación cancelada: contraseña no proporcionada', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Envía la contraseña junto con la petición DELETE (en body o headers)
            await axios.delete(`${API_URL}/api/incidents/${id_incident}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { password }
            });
            showNotification('Incidencia eliminada con éxito', 'success');
        } catch (error) {
            console.error('Error al eliminar incidencia:', error);
            showNotification('Error al eliminar incidencia: ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    const handleOpenAssignModal = (id_incident) => {
        console.log('Abriendo modal para incidencia:', id_incident);
        setSelectedIncidentId(id_incident);
        setShowAssignModal(true);
    };

    const handleOpenResolveModal = (id_incident) => {
        setCurrentIncidentToResolve(id_incident);
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
                setNotification({ message: 'Incidencia resuelta correctamente', type: 'success' });
                setShowResolveModal(false);
                setCurrentIncidentToResolve(null);
            } catch (error) {
                console.error('Error al resolver incidencia:', error);
                setNotification({
                    message: 'Error al resolver incidencia: ' + (error.response?.data?.error || error.message),
                    type: 'error',
                });
            }
        }
    };

    const handleExportIncidents = () => {
        exportIncidentsToExcel(incidents);
        showNotification('Incidencias exportadas a Excel', 'success');
    };

    const incidentsArray = Array.isArray(incidents) ? incidents : [];

    const filteredIncidentsForTable =
        userType === 'tecnico' && loggedUserId && !isNaN(parseInt(loggedUserId))
            ? incidentsArray.filter(
                (inc) => inc.id_technician && inc.id_technician === parseInt(loggedUserId)
            )
            : incidentsArray;

    const sortedIncidentsForTable = filteredIncidentsForTable
        .slice()
        .sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));

    return (
        <Container fluid className="p-4">
            {notification.message && (
                <SuccessMessage
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ message: "", type: "" })}
                />
            )}

            {/* Botón para mostrar formulario */}
            {["admin", "tecnico", "consultor"].includes(userType) && (
                <Row className="mb-4 text-center">
                    <Col>
                        <Button
                            onClick={() => setShowIncidentForm((prev) => !prev)}
                            variant={showIncidentForm ? "secondary" : "primary"}
                        >
                            {showIncidentForm ? "Cerrar formulario" : "Reportar Nueva Incidencia"}
                        </Button>
                    </Col>
                </Row>
            )}

            {/* Formulario para trabajadores */}
            {userType === "trabajador" ? (
                <section className="mb-4">
                    <h2 className="mb-3 h3">Reportar Nueva Incidencia</h2>
                    <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                </section>
            ) : (
                showIncidentForm && (
                    <section className="mb-4">
                        <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                    </section>
                )
            )}

            {/* Tarjetas resumen */}
            {userType && userType !== "trabajador" && (
                <section className="mb-4">
                    <SummaryCards
                        incidents={incidents}
                        userType={userType}
                        loggedUserId={parseInt(loggedUserId)}
                    />
                </section>
            )}

            {/* Tabla de incidencias */}
            {userType && userType !== "trabajador" && (
                <section>
                    <h2 className="mb-3 text-center h3">Listado de Incidencias</h2>

                    {userType === "admin" && (
                        <div className="mb-3 text-center">
                            <Button variant="success" onClick={handleExportIncidents}>
                                Exportar a Excel
                            </Button>
                        </div>
                    )}

                    <div id="scroll-container" className="overflow-x-auto w-100">
                        <IncidentTable
                            incidents={sortedIncidentsForTable}
                            userType={userType}
                            onAssign={["admin", "consultor"].includes(userType) ? handleOpenAssignModal : null}
                            onResolve={userType === "tecnico" ? handleOpenResolveModal : null}
                            onDelete={userType === "admin" ? handleDeleteIncident : null}
                            onEdit={setIncidentToEdit}
                        />
                    </div>
                </section>
            )}

            {/* Formularios de edición */}
            {incidentToEdit && incidentToEdit.id_incident ? (
                <div style={{ border: "2px solid red", padding: "10px", background: "white" }}>
                    <IncidentEditForm
                        incident={incidentToEdit}
                        onCancel={() => setIncidentToEdit(null)}
                        onSave={(updatedIncident) => {
                            setIncidents((prev) =>
                                prev.map((i) => (i.id === updatedIncident.id ? updatedIncident : i))
                            );
                            setIncidentToEdit(null);
                            showNotification("Incidencia actualizada con éxito", "success");
                        }}
                    />
                </div>
            ) : (

                incidentToEdit && <div>Error: Incidencia no válida</div>

            )}

            {/* Modales */}
            {showAssignModal && (
                <AssignTechnicianModal
                    id_incident={selectedIncidentId}
                    technicians={technicians}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedIncidentId(null);
                    }}
                    onConfirm={confirmAssign}
                />
            )}

            {showResolveModal && (
                <ResolveIncidentModal
                    id_incident={currentIncidentToResolve}
                    onClose={() => setShowResolveModal(false)}
                    onConfirm={submitSolution}
                />
            )}
        </Container>
    );
}

export default IncidentsPage;