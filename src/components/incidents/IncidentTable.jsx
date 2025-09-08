// src/components/incidents/IncidentTable.jsx
import React from 'react';
import { formatDateToDDMMYYYY } from '../../utils/formatDate';
import { Pencil, Trash2, Wrench, CheckCircle2 } from 'lucide-react';

// Función para obtener el nombre legible del estado
const getStatusName = (id_status) => {
    switch (id_status) {
        case 1:
            return <span title="Pendiente">P</span>;
        case 2:
            return <span title="Asignado">A</span>;
        case 3:
            return <span title="Resuelto">R</span>;
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
        default: return 'Desconocida';
    }
};

function IncidentTable({ incidents, userType, onAssign, onResolve, onDelete, onEdit }) {
    if (!Array.isArray(incidents)) incidents = [];

    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    const formatId = (id) => id.toString().padStart(6, '0');

    // Filtrar y paginar los incidentes
    const totalPages = Math.ceil(incidents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedIncidents = incidents.slice(startIndex, endIndex);
    const [showExtraColumns, setShowExtraColumns] = React.useState(false);

    const tdClass = "px-4 py-2 text-center text-sm text-gray-700 border";
    const thClass = "px-4 py-0 text-center text-sm text-gray-700 border";

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const toggleExtraColumns = () => {
        setShowExtraColumns(prev => !prev);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-1">
            {/* Contenedor scrollable SOLO para la tabla */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* Encabezados de la tabla */}
                            {showExtraColumns && (
                                <>
                                    <th className={tdClass}>ID</th>
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
                                <td colSpan="13" className="px-6 py-4 whitespace-normal text-center text-sm text-gray-500">
                                    No hay incidencias para mostrar.
                                </td>
                            </tr>
                        ) : (

                            // Mapeo de incidentes paginados
                            paginatedIncidents.map((incident) => (
                                <tr key={incident.id_incident}>
                                    {showExtraColumns && (
                                        <>
                                            {/* ID de la incidencia */}
                                            <td className={`${thClass} border`}>{formatId(incident.id_incident)}</td>
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
                                            <span className="text-xs text-gray-400">{new Date(incident.creation_date).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}</span>
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
                                                            {new Date(incident.solution_date).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span title="Sin resolver">N/A</span>
                                                )}
                                            </td>

                                            {/* Solución de la incidencia */}
                                            <td className={`${thClass} border`}> {incident.solution || <span title="Sin resolver">N/A</span>} </td>
                                        </>
                                    )}

                                    {/* Acciones según el tipo de usuario */}
                                    <td className={`${thClass} border`}>
                                        <div className="flex justify-center items-center h-full gap-2">
                                            {/* Botón Ver detalles */}
                                            <button
                                                className="text-gray-600 hover:text-gray-800"
                                                title={showExtraColumns ? "Ocultar columnas" : "Mostrar columnas"}
                                            >
                                                🔍
                                            </button>

                                            {/* Botón Asignar técnico */}
                                            {['admin', 'secretaria'].includes(userType) && incident.id_status === 1 && (
                                                <button
                                                   onClick={() => onAssign && onAssign(incident.id_incident)}
                                                    className="text-yellow-600 hover:text-yellow-800"
                                                    title="Asignar técnico"
                                                >
                                                    <Wrench className="w-5 h-5" />
                                                </button>
                                            )}

                                            {/* Botón Resolver */}
                                            {userType === 'tecnico' && incident.id_status !== 3 && (
                                                <button
                                                    onClick={() => onResolve && onResolve(incident.id_incident)}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Resolver"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                            )}

                                            {/* Botón Editar */}
                                            {['admin', 'secretaria'].includes(userType) && incident.id_status === 1 && (
                                                <button
                                                    onClick={() => onEdit && onEdit(incident)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                            )}

                                            {/* Botón Eliminar */}
                                            {userType === 'admin' && (
                                                <button
                                                    onClick={() => onDelete && onDelete(incident.id_incident)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Controles de paginación con saltos inteligentes */}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    {/* Botón Anterior */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                        Anterior
                    </button>

                    {/* Lógica de páginas */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                            // Mostrar siempre primera, última y las cercanas a la actual
                            return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 2 && page <= currentPage + 2)
                            );
                        })
                        .reduce((acc, page, idx, arr) => {
                            // Insertar "..." cuando haya saltos
                            if (idx > 0 && page - arr[idx - 1] > 1) {
                                acc.push("...");
                            }
                            acc.push(page);
                            return acc;
                        }, [])
                        .map((item, index) =>
                            item === "..." ? (
                                <span key={`dots-${index}`} className="px-2">...</span>
                            ) : (
                                <button
                                    key={`page-${item}-${index}`}
                                    onClick={() => handlePageChange(item)}
                                    className={`px-3 py-1 rounded ${currentPage === item
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-300"
                                        }`}
                                >
                                    {item}
                                </button>
                            )
                        )}

                    {/* Botón Siguiente */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            <div className="mt-2 flex justify-center">
                <button
                    onClick={toggleExtraColumns}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    {showExtraColumns ? 'Ocultar columnas extra' : 'Mostrar columnas extra'}
                </button>
            </div>
        </div>
    )
}

export default IncidentTable;