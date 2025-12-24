import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    socket,
    connectSocket,
    disconnectSocket,
    onIncidentCreated,
    onIncidentUpdated,
    onIncidentDeleted,
} from "@/services/socket";
import { exportIncidentsToExcel } from "@/shared/utils/exportExcel";
import { Incidents, Users } from "@/features/incidents/services/incidents.api"; // AJUSTA RUTA

export default function useIncidentsPage({ userType, loggedUserName, loggedUserId }) {
    const [incidents, setIncidents] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [currentIncidentToResolve, setCurrentIncidentToResolve] = useState(null);
    const [showIncidentForm, setShowIncidentForm] = useState(false);
    const [incidentToEdit, setIncidentToEdit] = useState(null);
    const [notification, setNotification] = useState({ message: "", type: "" });

    // Para abandonar rooms en cleanup sin depender de "incidents" en deps
    const joinedRoomsRef = useRef(new Set());

    const showNotification = useCallback((msg, type) => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification({ message: "", type: "" }), 5000);
    }, []);

    const joinRoom = useCallback((incidentId) => {
        if (!incidentId) return;
        if (joinedRoomsRef.current.has(incidentId)) return;
        joinedRoomsRef.current.add(incidentId);
        socket.emit("joinIncidentRoom", incidentId);
    }, []);

    const leaveAllRooms = useCallback(() => {
        joinedRoomsRef.current.forEach((id) => socket.emit("leaveIncidentRoom", id));
        joinedRoomsRef.current.clear();
    }, []);

    const fetchIncidents = useCallback(async () => {
        try {
            let fetched = await Incidents.fetchAll();
            fetched = Array.isArray(fetched) ? fetched : [];

            const techId = parseInt(loggedUserId);
            if (userType === "tecnico" && loggedUserId && !isNaN(techId)) {
                fetched = fetched.filter((inc) => inc.id_technician === techId);
            }

            setIncidents(fetched);
            fetched.forEach((inc) => joinRoom(inc.id));
        } catch (error) {
            console.error("Error al cargar incidencias:", error);
            showNotification("Error al cargar incidencias: " + error.message, "error");
            setIncidents([]);
        }
    }, [userType, loggedUserId, showNotification, joinRoom]);

    const fetchTechnicians = useCallback(async () => {
        try {
            const techs = await Users.fetchTechnicians();
            setTechnicians(Array.isArray(techs) ? techs : []);
        } catch (error) {
            console.error("Error al cargar técnicos:", error);
            showNotification("Error al cargar técnicos: " + error.message, "error");
            setTechnicians([]);
        }
    }, [showNotification]);

    useEffect(() => {
        if (!userType) return;

        connectSocket();

        const offCreated = onIncidentCreated((newIncident) => {
            setIncidents((prev) =>
                [...prev, newIncident].sort(
                    (a, b) => new Date(b.creation_date) - new Date(a.creation_date)
                )
            );
            joinRoom(newIncident.id);
            showNotification("Nueva incidencia creada", "success");
        });

        const offUpdated = onIncidentUpdated((updated) => {
            setIncidents((prev) =>
                prev
                    .map((inc) => (inc.id === updated.id ? updated : inc))
                    .sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date))
            );

            const message =
                updated.id_status === 3 ? "Incidencia resuelta por técnico" : "Incidencia actualizada";
            showNotification(message, "success");
        });

        const offDeleted = onIncidentDeleted(({ id }) => {
            setIncidents((prev) => prev.filter((inc) => inc.id !== id));
            joinedRoomsRef.current.delete(id);
            socket.emit("leaveIncidentRoom", id);
            showNotification("Incidencia eliminada", "success");
        });

        fetchIncidents();
        fetchTechnicians();

        return () => {
            offCreated?.();
            offUpdated?.();
            offDeleted?.();
            
            disconnectSocket();
        };
    }, [userType, fetchIncidents, fetchTechnicians, showNotification, joinRoom, leaveAllRooms]);

    const handleAddIncident = useCallback(
        async (newIncidentData) => {
            try {
                const incidentToCreate = {
                    ...newIncidentData,
                    username: loggedUserName,
                    status: newIncidentData.status || "Pendiente",
                    id_category: parseInt(newIncidentData.id_category),
                    id_device: newIncidentData.id_device ? parseInt(newIncidentData.id_device) : null,
                    id_ubication: newIncidentData.id_ubication ? parseInt(newIncidentData.id_ubication) : null,
                    id_department: newIncidentData.id_department ? parseInt(newIncidentData.id_department) : null,
                    email: newIncidentData.email?.trim() || null,
                    other_category_detail:
                        newIncidentData.id_category === 4
                            ? newIncidentData.other_category_detail?.trim() || null
                            : null,
                };

                const created = await Incidents.create(incidentToCreate);
                joinRoom(created.id);
                return created;
            } catch (error) {
                console.error("Error al reportar incidencia:", error);
                showNotification(
                    "Error al reportar incidencia: " + (error.response?.data?.error || error.message),
                    "error"
                );
                throw error;
            }
        },
        [loggedUserName, showNotification, joinRoom]
    );

    const handleDeleteIncident = useCallback(
        async (id_incident) => {
            const password = prompt("Por favor, ingresa tu contraseña para confirmar la eliminación:");
            if (!password) return showNotification("Eliminación cancelada", "warning");

            try {
                await Incidents.delete(id_incident, password);
                showNotification("Incidencia eliminada con éxito", "success");
            } catch (error) {
                console.error("Error al eliminar incidencia:", error);
                showNotification(
                    "Error al eliminar incidencia: " + (error.response?.data?.error || error.message),
                    "error"
                );
            }
        },
        [showNotification]
    );

    const handleOpenAssignModal = useCallback((id_incident) => {
        setSelectedIncidentId(id_incident);
        setShowAssignModal(true);
    }, []);

    const handleOpenResolveModal = useCallback((id_incident) => {
        setCurrentIncidentToResolve(id_incident);
        setShowResolveModal(true);
    }, []);

    const confirmAssign = useCallback(
        async (technicianUsername) => {
            if (!selectedIncidentId || !technicianUsername) {
                return showNotification("Selecciona una incidencia y un técnico válidos", "error");
            }

            try {
                await Incidents.assignTechnician(selectedIncidentId, technicianUsername);
                showNotification("Técnico asignado correctamente", "success");
            } catch (error) {
                console.error("Error al asignar técnico:", error);
                showNotification(
                    "Error al asignar técnico: " + (error.response?.data?.error || error.message),
                    "error"
                );
            } finally {
                setShowAssignModal(false);
                setSelectedIncidentId(null);
            }
        },
        [selectedIncidentId, showNotification]
    );

    const submitSolution = useCallback(
        async (solutionText) => {
            if (!currentIncidentToResolve || !solutionText) return;

            try {
                await Incidents.resolve(currentIncidentToResolve, solutionText);
                showNotification("Incidencia resuelta correctamente", "success");
                setShowResolveModal(false);
                setCurrentIncidentToResolve(null);
            } catch (error) {
                console.error("Error al resolver incidencia:", error);
                showNotification(
                    "Error al resolver incidencia: " + (error.response?.data?.error || error.message),
                    "error"
                );
            }
        },
        [currentIncidentToResolve, showNotification]
    );

    const handleExportIncidents = useCallback(() => {
        exportIncidentsToExcel(incidents);
        showNotification("Incidencias exportadas a Excel", "success");
    }, [incidents, showNotification]);

    const sortedIncidentsForTable = useMemo(() => {
        const arr = Array.isArray(incidents) ? incidents : [];
        const techId = parseInt(loggedUserId);

        const filtered =
            userType === "tecnico" && loggedUserId && !isNaN(techId)
                ? arr.filter((inc) => inc.id_technician && inc.id_technician === techId)
                : arr;

        return filtered.slice().sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
    }, [incidents, userType, loggedUserId]);

    return {
        incidents,
        technicians,
        sortedIncidentsForTable,

        showAssignModal,
        showResolveModal,
        selectedIncidentId,
        currentIncidentToResolve,
        showIncidentForm,
        incidentToEdit,
        notification,

        setShowAssignModal,
        setShowResolveModal,
        setSelectedIncidentId,
        setCurrentIncidentToResolve,
        setShowIncidentForm,
        setIncidentToEdit,
        setNotification,

        showNotification,

        handleAddIncident,
        handleDeleteIncident,
        handleOpenAssignModal,
        handleOpenResolveModal,
        confirmAssign,
        submitSolution,
        handleExportIncidents,
    };
}
