import React from 'react';
import { formatDateToDDMMYYYY, formatDateTime } from '@/shared/utils/formatDate.js';
import Pagination from "@/shared/components/ui/Pagination";
import ActionButton from '@/shared/components/ui/ActionButton.jsx';

// Función para obtener el nombre legible del estado
const getStatusName = (id_status) => {
    switch (id_status) {
        case 1: return <span title="Pendiente">P</span>;
        case 2: return <span title="Asignado">A</span>;
        case 3: return <span title="Resuelto">R</span>;
        default: return <span title="Desconocido">❓</span>;
    }
};

// Función para obtener el nombre legible de la categoría
const getCategoryName = (id_category) => {
    switch (id_category) {
        case 1: return 'Problemas con el internet';
        case 2: return 'Problemas con el equipo';
        case 3: return 'Problemas con un programa';
        case 4: return 'Otro';
        default: return 'Desconocida';
    }
};

function IncidentTable({ incidents, userType, onAssign, onResolve, onDelete, onEdit }) {
    if (!Array.isArray(incidents)) incidents = [];
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    const [showExtraColumns, setShowExtraColumns] = React.useState(false);

    // Filtrar y paginar los incidentes
    const totalPages = Math.ceil(incidents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const sortedIncidents = [...incidents].sort((a, b) => b.id_incident - a.id_incident);
    const paginatedIncidents = sortedIncidents.slice(startIndex, endIndex);

    const tdClass = "px-4 py-2 text-center text-sm text-gray-700 border";
    const thClass = "px-4 py-0 text-center text-sm text-gray-700 border";

    const handlePageChange = (page) => setCurrentPage(page);
    const toggleExtraColumns = () => setShowExtraColumns(prev => !prev);
    const formatId = (id) => id.toString().padStart(6, '0');

    return (
        <div className="p-1 bg-white rounded-lg shadow-md">

            {/* Contenedor scrollable SOLO para la tabla */}
            <div className="overflow-x-scroll overflow-y-visible">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* Encabezados de la tabla */}
                            {showExtraColumns && (
                                <>
                                    <th className={tdClass}>ID</th>
                                    <th className={tdClass}>ID Usuario</th>
                                </>
                            )}
                            <th className={tdClass}>Usuario</th>
                            <th className={tdClass}>Correo</th>
                            <th className={tdClass}>Ubicación</th>
                            <th className={tdClass}>Departamento</th>
                            <th className={tdClass}>Categoría</th>
                            <th className={tdClass}>Descripción</th>
                            <th className={tdClass}>Fecha Creación</th>
                            <th className={tdClass}>Estado</th>
                            {showExtraColumns && (
                                <>
                                    <th className={tdClass}>Técnico Asignado</th>
                                    <th className={tdClass}>Fecha Solución</th>
                                    <th className={tdClass}>Solución</th>
                                </>
                            )}

                            <th className={thClass}>
                                Acciones
                            </th>
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
                                <tr key={`${incident.id_incident}-${index}`}>
                                    {showExtraColumns && (
                                        <>
                                            {/* ID de la incidencia */}
                                            <td className={`${thClass} border`}>{formatId(incident.id_incident)}</td>

                                            <td className={`${thClass} border`}>{incident.id_user}</td>
                                        </>
                                    )}
                                    <td className={`${thClass} border`}>{incident.reporter_name}</td>
                                    <td className={`${thClass} border`}>{incident.reporter_email || 'S/C'}</td>
                                    <td className={`${thClass} border`}>{incident.ubication_name || `ID: ${incident.id_ubication}`}</td>
                                    <td className={`${thClass} border`}>{incident.department_name || `ID: ${incident.id_department}`}</td>
                                    <td className={`${thClass} border`}>
                                        {incident.id_category === 4 ? (
                                            <div className="whitespace-pre-wrap">
                                                <strong>Otro:</strong><br />
                                                {incident.other_category_detail || 'Sin detalle'}
                                            </div>
                                        ) : (
                                            getCategoryName(incident.id_category)
                                        )}
                                    </td>
                                    <td className={`${thClass} border`}>{incident.description}</td>
                                    <td className={`${thClass} border`}>
                                        <div className="flex flex-col">
                                            <span>{formatDateToDDMMYYYY(incident.creation_date)}</span>
                                            <span className="text-xs text-gray-400">
                                                {formatDateTime(incident.creation_date).split(' ')[1] + ' ' + formatDateTime(incident.creation_date).split(' ')[2]}
                                            </span>
                                        </div>
                                    </td>
                                    <td
                                        className={`${thClass} border ${incident.id_status === 1 ? 'text-red-600' :
                                            incident.id_status === 2 ? 'text-yellow-600' :
                                                incident.id_status === 3 ? 'text-green-600' :
                                                    'text-gray-500'
                                            }`}>
                                        {getStatusName(incident.id_status)}
                                    </td>

                                    {showExtraColumns && (
                                        <>
                                            {/* Técnico asignado */}
                                            <td className={`${thClass} border`}>
                                                {incident.technician_full_name || (incident.id_technician ? `ID: ${incident.id_technician}` : <span title="Sin asignar">N/A</span>)}
                                            </td>

                                            {/* Fecha de solución */}
                                            <td className={`${thClass} border`}>
                                                {incident.solution_date ? (
                                                    <div className="flex flex-col">
                                                        <span>{formatDateToDDMMYYYY(incident.solution_date)}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {formatDateTime(incident.solution_date).split(' ')[1] + ' ' + formatDateTime(incident.solution_date).split(' ')[2]}
                                                        </span>

                                                    </div>
                                                ) : (
                                                    <span title="Sin resolver">N/A</span>
                                                )}
                                            </td>

                                            {/* Solución de la incidencia */}
                                            <td className={`${thClass} border`}>
                                                <div className="max-w-[300px] max-h-[120px] overflow-y-auto whitespace-pre-wrap text-left text-sm">
                                                    {incident.solution || <span className="italic text-gray-400">Sin resolver</span>}
                                                </div>
                                            </td>

                                        </>
                                    )}

                                    {/* Acciones según el tipo de usuario */}
                                    <td className={`${thClass} border`}>
                                        <div className="flex items-center justify-center gap-x-2">

                                            <button
                                                className="p-1 text-gray-600 rounded hover:text-gray-800 hover:bg-blue-200"
                                                title={showExtraColumns ? 'Ocultar columnas' : 'Mostrar columnas'}
                                                onClick={toggleExtraColumns}
                                            >
                                                🔍
                                            </button>

                                            {/* Botón Asignar técnico */}
                                            {['admin', 'consultor'].includes(userType) && incident.id_status === 1 && (
                                                <ActionButton
                                                    type={"assign"}
                                                    title="Asignar técnico"
                                                    onClick={() => onAssign(incident.id_incident)}
                                                >
                                                </ActionButton>
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

                                            {/* Botón Eliminar */}
                                            {userType === 'admin' && (
                                                <ActionButton
                                                    type={"delete"}
                                                    title="Eliminar incidencia"
                                                    onClick={() => onDelete(incident.id_incident)}
                                                >
                                                </ActionButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    )
}

export default IncidentTable;