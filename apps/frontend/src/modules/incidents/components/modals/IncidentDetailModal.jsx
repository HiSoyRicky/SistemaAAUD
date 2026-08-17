// IncidentDetailModal.jsx

import { formatDateTime } from '../../../../../../frontend/src/shared/utils/formatDate';

export const formatDateTimeLocal = (date) => {
  return formatDateTime(date, '');
};

const statusMap = {
  1: { label: 'Pendiente', color: 'bg-red-100 text-red-700' },
  2: { label: 'Asignado', color: 'bg-yellow-100 text-yellow-700' },
  3: { label: 'Resuelto', color: 'bg-green-100 text-green-700' },
};

export default function IncidentDetailModal({ isOpen, onClose, incident }) {
  if (!isOpen || !incident) return null;

  const status = statusMap[incident.id_status] || {
    label: 'Desconocido',
    color: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden bg-white shadow-2xl rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Incidencia #{incident.ticket_number}</h2>
            <span
              className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${status.color}`}
            >
              {status.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ✖
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Datos generales */}
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <Info label="Usuario" value={incident.reporter_name} />
            <Info label="Correo" value={incident.reporter_email || 'S/C'} />
            <Info label="Ubicación" value={incident.ubication_name} />
            <Info label="Departamento" value={incident.department_name} />
            <Info label="Categoría" value={incident.category_name || 'S/C'} />
            <Info label="Técnico" value={incident.technician_full_name || 'Sin asignar'} />
            <Info label="Fecha de creación" value={formatDateTimeLocal(incident.creation_date)} />
            <Info
              label="Fecha de solución"
              value={
                incident.solution_date ? formatDateTimeLocal(incident.solution_date) : 'No resuelto'
              }
              muted={!incident.solution_date}
            />
          </div>

          {/* Descripción */}
          <Section title="Descripción">{incident.description}</Section>

          {/* Solución */}
          <Section title="Solución">
            {incident.solution || <span className="italic text-gray-400">Sin resolver</span>}
          </Section>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
const Info = ({ label, value, muted }) => (
  <div>
    <div className="text-xs font-medium text-gray-500">{label}</div>
    <div className={`mt-1 ${muted ? 'italic text-gray-400' : 'text-gray-800'}`}>{value}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <div className="mb-1 text-sm font-semibold">{title}</div>
    <div className="p-3 text-sm whitespace-pre-wrap border rounded-lg bg-gray-50">{children}</div>
  </div>
);
