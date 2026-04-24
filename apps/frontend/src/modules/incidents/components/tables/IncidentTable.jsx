import React from 'react';
import { formatDateToDDMMYYYY, formatDateTime } from '../../../../shared/utils/formatDate.js';
import Pagination from "../../../../shared/components/ui/Pagination";
import ActionButton from '../../../../shared/components/ui/ActionButton.jsx';
import IncidentDetailModal from '../modals/IncidentDetailModal.jsx';

// Función para obtener el nombre legible del estado
const getStatusName = (id_status, technician_full_name) => {
    switch (id_status) {
        case 1:
            return <span title="Pendiente">P</span>;

        case 2:
            return (
                <span title={`Asignado a: ${technician_full_name || 'Sin asignar'}`}>
                    A
                </span>
            );

        case 3:
            return <span title={`Resuelto por ${technician_full_name || 'Sin asignar'}`}>R</span>;

        default:
            return <span title="Desconocido">❓</span>;
    }
};

// Función para obtener el nombre legible de la categoría
const getCategoryName = (id_category) => {
    switch (id_category) {
        case 1: return 'Problemas con el internet';
        case 2: return 'Problemas con el equipo';
        case 3: return 'Problemas con un programa';
        case 4: return 'Otro';
        case 5: return 'Solicitud de tóner';
        default: return 'Desconocida';
    }
};

function IncidentTable({ incidents, userType, onAssign, onResolve, onEdit, visibleColumns }) {
    if (!Array.isArray(incidents)) incidents = [];
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = React.useState(1);

    // Filtrar y paginar los incidentes
    const totalPages = Math.ceil(incidents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const statusPriority = {
        1: 1, // Pendientes
        2: 2, // Asignadas
        3: 3  // Resueltas
    };

    const sortedIncidents = [...incidents].sort((a, b) => {
        const priorityA = statusPriority[a.id_status] || 99;
        const priorityB = statusPriority[b.id_status] || 99;

        // Primero ordenar por estado
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Luego por id_incident descendente
        return b.id_incident - a.id_incident;
    });
    const paginatedIncidents = sortedIncidents.slice(startIndex, endIndex);

    const tdClass = "px-4 py-2 text-center text-sm text-gray-700 border";
    const thClass = "px-4 py-0 text-center text-sm text-gray-700 border";

    const [showDetailModal, setShowDetailModal] = React.useState(false);
    const [selectedIncident, setSelectedIncident] = React.useState(null);

    const handleViewDetails = (incident) => {
        setSelectedIncident(incident);
        setShowDetailModal(true);
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [incidents]);

    const columns = {
        user: true,
        email: false,
        ubication: true,
        department: true,
        category: true,
        description: true,
        date: true,
        id_status: true,
        actions: true
    };

    const show = { ...columns, ...visibleColumns };

    return (
        <div className="relative w-full mx-auto">

            {/* Contenedor scrollable SOLO para la tabla */}
            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[calc(100dvh-16rem)]">
                <table className="border-collapse divide-y divide-gray-200 w-full">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                            {/* Encabezados de la tabla */}
                            {show.user && <th className={tdClass}>Usuario</th>}
                            {show.email && <th className={tdClass}>Correo</th>}
                            {show.ubication && <th className={tdClass}>Ubicación</th>}
                            {show.department && <th className={tdClass}>Departamento</th>}
                            {show.category && <th className={tdClass}>Categoría</th>}
                            {show.description && <th className={tdClass}>Descripción</th>}
                            {show.date && <th className={tdClass}>Fecha Creación</th>}
                            {show.id_status && <th className={tdClass}>Estado</th>}
                            {show.actions &&
                                <th className={thClass}>
                                    Acciones
                                </th>
                            }
                        </tr>
                    </thead>

                    {/* Cuerpo de la tabla */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {incidents.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="px-6 py-4 text-sm text-center text-gray-500 whitespace-normal">
                                    No hay incidencias para mostrar.
                                </td>
                            </tr>
                        ) : (

                            // Mapeo de incidentes paginados
                            paginatedIncidents.map((incident, index) => (
                                <tr key={`${incident.ticket_number}-${index}`}>
                                    {show.user && <td className={`${thClass} border`}>{incident.reporter_name}</td>}
                                    {show.email && <td className={`${thClass} border`}>{incident.reporter_email || 'S/C'}</td>}
                                    {show.ubication && <td className={`${thClass} border`}>{incident.ubication_name || `ID: ${incident.id_ubication}`}</td>}
                                    {show.department && <td className={`${thClass} border`}>{incident.department_name || `ID: ${incident.id_department}`}</td>}
                                    {show.category && <td className={`${thClass} border`}>
                                        {incident.id_category === 4 ? (
                                            <div className="whitespace-pre-wrap">
                                                <strong>Otro:</strong><br />
                                                {incident.other_category_detail || 'Sin detalle'}
                                            </div>
                                        ) : (
                                            getCategoryName(incident.id_category)
                                        )}
                                    </td>
                                    }
                                    {show.description && (
                                        <td className={`${thClass} border max-w-[300px]`}>
                                            <div className="truncate" title={incident.description}>
                                                {incident.description}
                                            </div>
                                        </td>
                                    )}
                                    {show.date && (
                                        <td className={`${thClass} border`}>
                                            <div className="flex flex-col">
                                                <span>{formatDateToDDMMYYYY(incident.creation_date)}</span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDateTime(incident.creation_date).split(' ')[1] + ' ' + formatDateTime(incident.creation_date).split(' ')[2]}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    {show.id_status && (
                                        <td
                                            className={`${thClass} border ${incident.id_status === 1 ? 'text-red-600' :
                                                incident.id_status === 2 ? 'text-yellow-600' :
                                                    incident.id_status === 3 ? 'text-green-600' :
                                                        'text-gray-500'
                                                }`}>
                                            {getStatusName(incident.id_status, incident.technician_full_name)}
                                        </td>
                                    )}

                                    {/* Acciones según el tipo de usuario */}
                                    {show.actions && (
                                        <td className={`${thClass} border`}>
                                            <div className="flex items-center justify-center gap-x-2">

                                                <ActionButton
                                                    type='view'
                                                    title="Ver detalles de la incidencia"
                                                    onClick={() => handleViewDetails(incident)}
                                                >
                                                </ActionButton>

                                                {/* Botón Asignar/Reasignar técnico */}
                                                {(
                                                    (userType === 'consultor' && incident.id_status === 1) ||
                                                    (userType === 'admin' && (incident.id_status === 1 || incident.id_status === 2))
                                                ) && (
                                                        <ActionButton
                                                            type={"assign"}
                                                            title={
                                                                incident.id_status === 1
                                                                    ? "Asignar técnico"
                                                                    : "Reasignar técnico"
                                                            }
                                                            onClick={() => onAssign(incident.id_incident)}
                                                        />
                                                    )}

                                                {/* Botón Resolver */}
                                                {userType === 'tecnico' && incident.id_status !== 3 && (
                                                    <ActionButton
                                                        type={"resolve"}
                                                        title="Resolver"
                                                        onClick={() => onResolve(incident.id_incident)}
                                                    >
                                                    </ActionButton>
                                                )}

                                                {/* Botón Editar */}
                                                {['admin', 'consultor'].includes(userType) && incident.id_status === 1 && (
                                                    <ActionButton
                                                        type={"edit"}
                                                        title="Editar incidencia"
                                                        onClick={() => onEdit(incident)}
                                                    >
                                                    </ActionButton>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div >

            {/* Paginación */}
            < div className="p-2 bg-white border-t" >
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            <IncidentDetailModal
                isOpen={showDetailModal}
                incident={selectedIncident}
                onClose={() => setShowDetailModal(false)}
            />

        </div >
    )
}

export default IncidentTable;
