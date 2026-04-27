import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    onIncidentCreated,
    onIncidentUpdated,
} from "../../../services/socket/incidentsSocket";
import {
    socket,
    connectSocket,
    disconnectSocket,
} from "../../../services/socket/socketClient";
import { exportIncidentsToExcel } from "../../../shared/utils/exportExcel";
import { Incidents, Users } from "../services/incidents.api";

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

    const joinedRoomsRef = useRef(new Set());

    const [search, setSearch] = useState('');

    const showNotification = useCallback((msg, type) => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification({ message: "", type: "" }), 5000);
    }, []);

    const getApiErrorMessage = useCallback((error) => {
        return (
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Error inesperado"
        );
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
            fetched.forEach((inc) => joinRoom(inc.id_incident));
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

        const token = localStorage.getItem("token");
        const canReadIncidents = userType !== "trabajador" && Boolean(token);

        if (canReadIncidents) {
            connectSocket(token);
        }

        const handleSocketConnect = () => {
            console.log("Socket conectado:", socket.id);

            joinedRoomsRef.current.forEach((id) =>
                socket.emit("joinIncidentRoom", id)
            );

            if (canReadIncidents) {
                fetchIncidents();
            }
        };

        const handleDisconnect = () => {
            console.log("Socket desconectado");
        };

        const handleReconnect = () => {
            console.log("Socket reconectado");
            if (canReadIncidents) {
                fetchIncidents();
            }
        };

        socket.on("connect", handleSocketConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect", handleReconnect);

        const offCreated = onIncidentCreated((newIncident) => {
            const techId = parseInt(loggedUserId);

            if (
                userType === "tecnico" &&
                newIncident.id_technician !== techId
            ) {
                return;
            }

            setIncidents((prev) => {
                // Evitar duplicados
                const exists = prev.some(
                    (i) => i.id_incident === newIncident.id_incident
                );
                if (exists) return prev;

                return [...prev, newIncident].sort(
                    (a, b) =>
                        new Date(b.creation_date) - new Date(a.creation_date)
                );
            });

            joinRoom(newIncident.id_incident);
        });

        const offUpdated = onIncidentUpdated((updated) => {
            setIncidents((prev) => {
                const techId = parseInt(loggedUserId);
                const exists = prev.some(
                    (i) => i.id_incident === updated.id_incident
                );

                // Técnico: solo incidencias propias
                if (userType === "tecnico") {
                    if (updated.id_technician !== techId) {
                        return prev.filter(
                            (i) => i.id_incident !== updated.id_incident
                        );
                    }

                    if (!exists) {
                        return [...prev, updated].sort(
                            (a, b) =>
                                new Date(b.creation_date) - new Date(a.creation_date)
                        );
                    }
                }

                if (!exists) {
                    return [...prev, updated].sort(
                        (a, b) =>
                            new Date(b.creation_date) - new Date(a.creation_date)
                    );
                }

                return prev
                    .map((inc) =>
                        inc.id_incident === updated.id_incident
                            ? { ...inc, ...updated }
                            : inc
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.creation_date) - new Date(a.creation_date)
                    );
            });

            showNotification(
                updated.id_status === 3
                    ? "Incidencia resuelta por técnico"
                    : "Incidencia actualizada",
                "success"
            );
        });

        if (canReadIncidents) {
            fetchIncidents();
            fetchTechnicians();
        }

        return () => {
            socket.off("connect", handleSocketConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnect", handleReconnect);
            offCreated?.();
            offUpdated?.();
            leaveAllRooms();
            if (canReadIncidents) {
                disconnectSocket();
            }
        };
    }, [userType, fetchIncidents, fetchTechnicians, showNotification, joinRoom, leaveAllRooms]);

    const handleAddIncident = useCallback(
        async (newIncidentData) => {
            try {
                const categoryId = Number(newIncidentData.id_category);

                const incidentToCreate = {
                    ...newIncidentData,
                    username: loggedUserName,
                    status: newIncidentData.status || "Pendiente",
                    id_category: categoryId,
                    id_device: newIncidentData.id_device ? parseInt(newIncidentData.id_device) : null,
                    id_ubication: newIncidentData.id_ubication ? parseInt(newIncidentData.id_ubication) : null,
                    id_department: newIncidentData.id_department ? parseInt(newIncidentData.id_department) : null,
                    id_printer_model: newIncidentData.id_printer_model
                        ? parseInt(newIncidentData.id_printer_model)
                        : null,
                    id_toner: newIncidentData.id_toner ? parseInt(newIncidentData.id_toner) : null,
                    toner_color: newIncidentData.toner_color || null,
                    email: newIncidentData.email?.trim() || null,
                    other_category_detail: newIncidentData.other_category_detail?.trim() || null,
                };

                const created = await Incidents.create(incidentToCreate);
                joinRoom(created.id_incident || created.id);
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

    const handleOpenAssignModal = useCallback((id_incident) => {
        setSelectedIncidentId(id_incident);
        setShowAssignModal(true);
    }, []);

    const handleOpenResolveModal = useCallback((id_incident) => {
        setCurrentIncidentToResolve(id_incident);
        setShowResolveModal(true);
    }, []);

    const confirmAssign = useCallback(
        async (technicianId) => {
            if (!selectedIncidentId || !technicianId) {
                return showNotification(
                    "Selecciona una incidencia y un técnico válidos",
                    "error"
                );
            }

            try {
                await Incidents.assignTechnician(
                    selectedIncidentId,
                    technicianId
                );

                showNotification("Técnico asignado correctamente", "success");
            } catch (error) {
                console.error("Error al asignar técnico:", error);
                showNotification(
                    "Error al asignar técnico: " +
                    getApiErrorMessage(error),
                    "error"
                );
            } finally {
                setShowAssignModal(false);
                setSelectedIncidentId(null);
            }
        },
        [selectedIncidentId, showNotification, getApiErrorMessage]
    );

    const submitSolution = useCallback(
        async (solutionText) => {
            if (!currentIncidentToResolve || !solutionText) return;

            const idToResolve = currentIncidentToResolve;

            try {
                const updated = await Incidents.resolve(currentIncidentToResolve, solutionText);
                if (updated) {
                    setIncidents((prev) =>
                        prev.map((inc) =>
                            inc.id_incident === idToResolve ? { ...inc, ...updated } : inc
                        )
                    );
                }
                showNotification("Incidencia resuelta correctamente", "success");
                setShowResolveModal(false);
                setCurrentIncidentToResolve(null);
            } catch (error) {
                console.error("Error al resolver incidencia:", error);
                await fetchIncidents();
                showNotification(
                    "Error al resolver incidencia: " + (error.response?.data?.error || error.message),
                    "error"
                );
            }
        },
        [currentIncidentToResolve, showNotification, fetchIncidents]
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

    const getCategoryText = (id) => {
        switch (id) {
            case 1: return "internet";
            case 2: return "equipo";
            case 3: return "programa";
            case 4: return "otro";
            default: return "";
        }
    };

    const getStatusText = (id) => {
        switch (id) {
            case 1: return "pendiente";
            case 2: return "asignado";
            case 3: return "resuelto";
            default: return "";
        }
    };

    const filteredIncidentsForTable = useMemo(() => {
        if (!search.trim()) return sortedIncidentsForTable;

        const text = search.toLowerCase();

        const safe = (val) =>
            val === null || val === undefined ? "" : String(val).toLowerCase();

        return sortedIncidentsForTable.filter((inc) =>
            safe(inc.reporter_name).includes(text) ||
            safe(inc.reporter_email).includes(text) ||
            safe(inc.ubication_name).includes(text) ||
            safe(inc.department_name).includes(text) ||
            safe(inc.description).includes(text) ||
            safe(inc.other_category_detail).includes(text) ||
            getCategoryText(inc.id_category).includes(text) ||
            getStatusText(inc.id_status).includes(text)
        );
    }, [search, sortedIncidentsForTable]);

    return {
        incidents,
        technicians,
        sortedIncidentsForTable,
        filteredIncidentsForTable,
        search,
        setSearch,

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
        handleOpenAssignModal,
        handleOpenResolveModal,
        confirmAssign,
        submitSolution,
        handleExportIncidents,
    };
}
