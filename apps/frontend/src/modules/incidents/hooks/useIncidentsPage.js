// useIncidentsPage.js

import { useCallback, useEffect, useRef, useState } from 'react';
import { onIncidentCreated, onIncidentUpdated } from '../../../services/socket/incidentsSocket';
import { connectSocket, disconnectSocket, socket } from '../../../services/socket/socketClient';
import { exportIncidentsToExcel } from '../../../shared/utils/exportExcel';
import { Incidents, Users } from '../services/incidents.api';

export default function useIncidentsPage({
  userType,
  loggedUserName,
  loggedUserId,
  canAssignIncidents = false,
}) {
  const [incidents, setIncidents] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [currentIncidentToResolve, setCurrentIncidentToResolve] = useState(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentToEdit, setIncidentToEdit] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, assigned: 0, resolved: 0 });
  const requestId = useRef(0);

  useEffect(() => { const timer = setTimeout(() => { setPage(1); setDebouncedSearch(search); }, 300); return () => clearTimeout(timer); }, [search]);

  const showNotification = useCallback((msg, type) => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  }, []);

  const getApiErrorMessage = useCallback((error) => {
    return (
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Error inesperado'
    );
  }, []);

  const fetchIncidents = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const result = await Incidents.fetchPage({ page, limit: 25, search: debouncedSearch, ...(userType === 'tecnico' ? { own: 'true' } : {}) });
      if (currentRequest !== requestId.current) return;
      setIncidents(result.data || []);
      setTotalPages(result.totalPages || 1);
      setMetrics(result.metrics || { total: 0, pending: 0, assigned: 0, resolved: 0 });
      if (page > (result.totalPages || 1)) setPage(result.totalPages || 1);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      showNotification('Error al cargar incidencias: ' + getApiErrorMessage(error), 'error');
      setIncidents([]);
    }
  }, [userType, page, debouncedSearch, showNotification, getApiErrorMessage]);
  const fetchRef = useRef(fetchIncidents);
  fetchRef.current = fetchIncidents;

  useEffect(() => {
    if (userType && userType !== 'trabajador' && localStorage.getItem('token')) fetchIncidents();
  }, [userType, fetchIncidents]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const techs = await Users.fetchTechnicians();
      setTechnicians(Array.isArray(techs) ? techs : []);
    } catch (error) {
      console.error('Error al cargar técnicos:', error);
      showNotification('Error al cargar técnicos: ' + error.message, 'error');
      setTechnicians([]);
    }
  }, [showNotification]);

  useEffect(() => {
    if (!userType) return;

    const token = localStorage.getItem('token');
    const canReadIncidents = userType !== 'trabajador' && Boolean(token);

    if (canReadIncidents) {
      connectSocket(token);
    }

    const handleSocketConnect = () => {
      console.log('Socket conectado:', socket.id);

      if (canReadIncidents) {
        fetchRef.current();
      }
    };

    const handleDisconnect = () => {
      console.log('Socket desconectado');
    };

    const handleReconnect = () => {
      console.log('Socket reconectado');
      if (canReadIncidents) {
        fetchRef.current();
      }
    };

    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    const offCreated = onIncidentCreated(() => { if (canReadIncidents) fetchRef.current(); });
    const offUpdated = onIncidentUpdated(() => { if (canReadIncidents) fetchRef.current(); });

    if (canReadIncidents) {
      if (canAssignIncidents) {
        fetchTechnicians();
      }
    }

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      offCreated?.();
      offUpdated?.();
      if (canReadIncidents) {
        disconnectSocket();
      }
    };
  }, [
    userType,
    fetchTechnicians,
    showNotification,
    canAssignIncidents,
  ]);

  const handleAddIncident = useCallback(
    async (newIncidentData) => {
      try {
        const categoryId = Number(newIncidentData.id_category);

        const incidentToCreate = {
          ...newIncidentData,
          id_category: categoryId,
          id_device: newIncidentData.id_device ? Number.parseInt(newIncidentData.id_device) : null,
          id_ubication: newIncidentData.id_ubication
            ? Number.parseInt(newIncidentData.id_ubication)
            : null,
          id_department: newIncidentData.id_department
            ? Number.parseInt(newIncidentData.id_department)
            : null,
          id_printer_model: newIncidentData.id_printer_model
            ? Number.parseInt(newIncidentData.id_printer_model)
            : null,
          id_toner: newIncidentData.id_toner ? Number.parseInt(newIncidentData.id_toner) : null,
          toner_color: newIncidentData.toner_color || null,
          email: newIncidentData.email?.trim() || null,
          other_category_detail: newIncidentData.other_category_detail?.trim() || null,
        };

        const created = await Incidents.create(incidentToCreate);
        return created;
      } catch (error) {
        console.error('Error al reportar incidencia:', error);
        showNotification(
          'Error al reportar incidencia: ' + (error.response?.data?.error || error.message),
          'error'
        );
        throw error;
      }
    },
    [loggedUserName, showNotification]
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
        showNotification('Selecciona una incidencia y un técnico válidos', 'error');
        return;
      }

      const technician = technicians.find((tech) => Number(tech.id) === Number(technicianId));

      // Guardar estado anterior para poder revertir si falla el backend
      const previousIncidents = incidents;

      // ⚡ ACTUALIZACIÓN OPTIMISTA
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id_incident === selectedIncidentId
            ? {
                ...inc,
                id_status: 2,
                id_technician: Number(technicianId),
                technician_full_name: technician?.nombre_completo || null,
              }
            : inc
        )
      );

      // Cerramos inmediatamente el modal
      setShowAssignModal(false);
      setSelectedIncidentId(null);

      try {
        // Persistir en backend
        const updated = await Incidents.assignTechnician(selectedIncidentId, technicianId);

        // Sincronizar con la respuesta real del backend
        if (updated) {
          setIncidents((prev) =>
            prev.map((inc) =>
              inc.id_incident === updated.id_incident
                ? {
                    ...inc,
                    ...updated,
                  }
                : inc
            )
          );
        }
      } catch (error) {
        console.error('Error al asignar técnico:', error);

        // ❌ El backend rechazó la asignación → revertimos
        setIncidents(previousIncidents);

        showNotification('Error al asignar técnico: ' + getApiErrorMessage(error), 'error');
      }
    },
    [selectedIncidentId, technicians, incidents, showNotification, getApiErrorMessage]
  );

  const submitSolution = useCallback(
    async (solutionText) => {
      if (!currentIncidentToResolve || !solutionText) return;

      const idToResolve = currentIncidentToResolve;

      try {
        const updated = await Incidents.resolve(currentIncidentToResolve, solutionText);
        if (updated) {
          setIncidents((prev) =>
            prev.map((inc) => (inc.id_incident === idToResolve ? { ...inc, ...updated } : inc))
          );
        }
        setShowResolveModal(false);
        setCurrentIncidentToResolve(null);
      } catch (error) {
        console.error('Error al resolver incidencia:', error);
        await fetchIncidents();
        showNotification(
          'Error al resolver incidencia: ' + (error.response?.data?.error || error.message),
          'error'
        );
      }
    },
    [currentIncidentToResolve, showNotification, fetchIncidents]
  );

  const handleExportIncidents = useCallback(async () => {
    try {
      const params = { limit: 100, ...(userType === 'tecnico' ? { own: 'true' } : {}) };
      const first = await Incidents.fetchPage({ ...params, page: 1 });
      const rows = [...(first.data || [])];
      for (let n = 2; n <= first.totalPages; n += 1) {
        const result = await Incidents.fetchPage({ ...params, page: n });
        rows.push(...(result.data || []));
      }
      await exportIncidentsToExcel(rows);
      showNotification('Incidencias exportadas a Excel', 'success');
    } catch (error) {
      showNotification('Error al exportar incidencias: ' + getApiErrorMessage(error), 'error');
    }
  }, [userType, showNotification, getApiErrorMessage]);

  const sortedIncidentsForTable = incidents;
  const filteredIncidentsForTable = incidents;

  return {
    incidents,
    page, setPage, totalPages, metrics,
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
