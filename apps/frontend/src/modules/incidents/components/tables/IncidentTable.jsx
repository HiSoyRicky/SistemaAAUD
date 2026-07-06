import React from 'react';
import { formatDateTimeParts } from '../../../../shared/utils/formatDate.js';
import Pagination from '../../../../shared/components/ui/Pagination';
import ActionButton from '../../../../shared/components/ui/ActionButton.jsx';
import IncidentDetailModal from '../modals/IncidentDetailModal.jsx';

// Función para obtener el nombre legible del estado
const getStatusName = (id_status, technician_full_name) => {
  const technician = technician_full_name || 'Sin asignar';

  switch (id_status) {
    case 1:
      return (
        <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          Pendiente
        </span>
      );

    case 2:
      return (
        <span
          title={`Asignado a: ${technician}`}
          className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
        >
          Asignado
        </span>
      );

    case 3:
      return (
        <span
          title={`Resuelto por ${technician}`}
          className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
        >
          Resuelto
        </span>
      );

    default:
      return (
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Desconocido
        </span>
      );
  }
};

// Función para obtener el nombre legible de la categoría
const getCategoryName = (id_category) => {
  switch (id_category) {
    case 1:
      return 'Problemas con el internet';
    case 2:
      return 'Problemas con el equipo';
    case 3:
      return 'Problemas con un programa';
    case 4:
      return 'Otro';
    case 5:
      return 'Solicitud de tóner';
    default:
      return 'Desconocida';
  }
};

function IncidentTable({
  incidents,
  userType,
  onAssign,
  onResolve,
  onEdit,
  visibleColumns,
}) {
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
    3: 3, // Resueltas
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

  const tdClass =
    'border-x border-slate-100 px-4 py-3 text-center align-middle text-sm text-slate-700';
  const thClass =
    'border-x border-slate-100 px-4 py-3 text-center align-middle text-xs font-bold uppercase tracking-wide text-slate-500';

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
    actions: true,
  };

  const show = { ...columns, ...visibleColumns };

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {/* Encabezados de la tabla */}
              {show.user && <th className={thClass}>Usuario</th>}
              {show.email && <th className={thClass}>Correo</th>}
              {show.ubication && <th className={thClass}>Ubicación</th>}
              {show.department && <th className={thClass}>Departamento</th>}
              {show.category && <th className={thClass}>Categoría</th>}
              {show.description && <th className={thClass}>Descripción</th>}
              {show.date && <th className={thClass}>Fecha de creación</th>}
              {show.id_status && <th className={thClass}>Estado</th>}
              {show.actions && <th className={thClass}>Acciones</th>}
            </tr>
          </thead>

          {/* Cuerpo de la tabla */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan="13"
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No hay incidencias para mostrar.
                </td>
              </tr>
            ) : (
              // Mapeo de incidentes paginados
              paginatedIncidents.map((incident, index) => {
                const created = formatDateTimeParts(incident.creation_date);

                return (
                  <tr
                    key={`${incident.ticket_number}-${index}`}
                    className="transition hover:bg-slate-50"
                  >
                    {show.user && (
                      <td className={tdClass}>
                        <div className="font-semibold text-slate-900">
                          {incident.reporter_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          #{incident.ticket_number || incident.id_incident}
                        </div>
                      </td>
                    )}
                    {show.email && (
                      <td className={tdClass}>
                        {incident.reporter_email || 'S/C'}
                      </td>
                    )}
                    {show.ubication && (
                      <td className={tdClass}>
                        {incident.ubication_name ||
                          `ID: ${incident.id_ubication}`}
                      </td>
                    )}
                    {show.department && (
                      <td className={tdClass}>
                        {incident.department_name ||
                          `ID: ${incident.id_department}`}
                      </td>
                    )}
                    {show.category && (
                      <td className={tdClass}>
                        {incident.id_category === 4 ? (
                          <div className="whitespace-pre-wrap">
                            <strong>Otro:</strong>
                            <br />
                            {incident.other_category_detail || 'Sin detalle'}
                          </div>
                        ) : (
                          getCategoryName(incident.id_category)
                        )}
                      </td>
                    )}
                    {show.description && (
                      <td className={`${tdClass} max-w-[340px]`}>
                        <div
                          className="line-clamp-2 text-center text-slate-600"
                          title={incident.description}
                        >
                          {incident.description}
                        </div>
                      </td>
                    )}
                    {show.date && (
                      <td className={tdClass}>
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-slate-700">
                            {created.date}
                          </span>

                          <span className="text-xs text-slate-400">
                            {created.time}
                          </span>
                        </div>
                      </td>
                    )}
                    {show.id_status && (
                      <td className={tdClass}>
                        {getStatusName(
                          incident.id_status,
                          incident.technician_full_name
                        )}
                      </td>
                    )}

                    {/* Acciones según el tipo de usuario */}
                    {show.actions && (
                      <td className={tdClass}>
                        <div className="flex items-center justify-center gap-x-2">
                          <ActionButton
                            type="view"
                            title="Ver detalles de la incidencia"
                            onClick={() => handleViewDetails(incident)}
                          ></ActionButton>

                          {/* Botón Asignar/Reasignar técnico */}
                          {((userType === 'consultor' &&
                            incident.id_status === 1) ||
                            (userType === 'admin' &&
                              (incident.id_status === 1 ||
                                incident.id_status === 2))) && (
                            <ActionButton
                              type={'assign'}
                              title={
                                incident.id_status === 1
                                  ? 'Asignar técnico'
                                  : 'Reasignar técnico'
                              }
                              onClick={() => onAssign(incident.id_incident)}
                            />
                          )}

                          {/* Botón Resolver */}
                          {userType === 'tecnico' &&
                            incident.id_status !== 3 && (
                              <ActionButton
                                type={'resolve'}
                                title="Resolver"
                                onClick={() => onResolve(incident.id_incident)}
                              ></ActionButton>
                            )}

                          {/* Botón Editar */}
                          {['admin', 'consultor'].includes(userType) &&
                            incident.id_status === 1 && (
                              <ActionButton
                                type={'edit'}
                                title="Editar incidencia"
                                onClick={() => onEdit(incident)}
                              ></ActionButton>
                            )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
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
    </div>
  );
}

export default IncidentTable;
