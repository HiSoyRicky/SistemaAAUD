// IncidentDetailModal.jsx

import { formatDateTime } from '../../../../../../frontend/src/shared/utils/formatDate';

export const formatDateTimeLocal = (date) => {
  return date ? formatDateTime(date, '') : '—';
};

const statusMap = {
  1: {
    label: 'Pendiente',
    icon: '●',
    classes: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  2: {
    label: 'Asignado',
    icon: '●',
    classes: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
  3: {
    label: 'Resuelto',
    icon: '●',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
};

export default function IncidentDetailModal({
  isOpen,
  onClose,
  incident,
  canAssignIncidents = false,
  userType,
  onAssign,
}) {
  if (!isOpen || !incident) return null;

  const status = statusMap[incident.id_status] || {
    label: 'Desconocido',
    classes: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  };

  const details = [
    {
      label: 'Técnico asignado',
      value: incident.technician_full_name || 'Sin asignar',
      icon: 'wrench',
    },
    {
      label: 'Categoría',
      value: incident.category_name || 'Sin categoría',
      icon: 'layers',
    },
    {
      label: 'Fecha de creación',
      value: formatDateTimeLocal(incident.creation_date),
      icon: 'calendar',
    },
    {
      label: 'Fecha de asignación',
      value: incident.assigned_at
        ? formatDateTimeLocal(incident.assigned_at)
        : 'Pendiente de asignación',
      icon: 'calendar-clock',
      muted: !incident.assigned_at,
    },
    {
      label: 'Asignado por',
      value: incident.assigned_by_name || (incident.assigned_at ? 'No registrado' : '—'),
      icon: 'user',
      muted: !incident.assigned_by_name,
    },
    {
      label: 'Fecha de solución',
      value: incident.solution_date
        ? formatDateTimeLocal(incident.solution_date)
        : 'Pendiente de resolución',
      icon: 'calendar-check',
      muted: !incident.solution_date,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
        bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-modal-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col
          overflow-hidden rounded-2xl bg-white shadow-2xl
          ring-1 ring-black/5"
      >
        {/* Header */}
        <header
          className="flex items-start justify-between gap-4
          border-b border-slate-200 px-5 py-5 sm:px-7"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center
              justify-center rounded-xl bg-indigo-50 text-indigo-600"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M8 9h8M8 13h5M8 17h3" />
              </svg>
            </div>

            <div className="min-w-0">
              <p
                className="mb-1 text-xs font-semibold uppercase
                tracking-[0.14em] text-slate-400"
              >
                Gestión de incidencias
              </p>

              <h2
                id="incident-modal-title"
                className="break-words text-xl font-bold
                  tracking-tight text-slate-900 sm:text-2xl"
              >
                Incidencia #{incident.ticket_number}
              </h2>

              <p className="mt-1 text-sm text-slate-500">Detalle completo del reporte</p>

              <span
                className={`mt-3 inline-flex items-center gap-2
                  rounded-full px-3 py-1 text-xs font-semibold
                  ring-1 ring-inset ${status.classes}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            {/* Cerrar modal */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle de incidencia"
              className="flex h-9 w-9 items-center justify-center
      rounded-xl text-slate-400 transition
      hover:bg-slate-100 hover:text-slate-700
      focus:outline-none focus-visible:ring-2
      focus-visible:ring-indigo-500"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>

            {/* Asignar o reasignar técnico */}
            {canAssignIncidents &&
              ((userType === 'consultor' && incident.id_status === 1) ||
                (userType === 'admin' &&
                  (incident.id_status === 1 || incident.id_status === 2))) && (
                <button
                  type="button"
                  onClick={() => onAssign?.(incident.id_incident)}
                  className="inline-flex items-center justify-center gap-2
          whitespace-nowrap rounded-xl bg-indigo-600
          px-4 py-2.5 text-sm font-semibold text-white
          shadow-sm transition
          hover:bg-indigo-700 hover:shadow-md
          focus:outline-none focus-visible:ring-2
          focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="8" r="4" />
                    <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
                    <path d="M19 8v6M16 11h6" />
                  </svg>

                  {incident.id_status === 1 ? 'Asignar técnico' : 'Reasignar técnico'}
                </button>
              )}
          </div>
        </header>

        {/* Contenido desplazable */}
        <main
          className="flex-1 space-y-7 overflow-y-auto
          overscroll-contain px-5 py-6 sm:px-7"
        >
          {/* Reportante y ubicación */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard
              label="Reportado por"
              value={incident.reporter_name}
              detail={incident.reporter_email || 'Correo no registrado'}
              icon="user"
            />

            <InfoCard
              label="Ubicación"
              value={incident.ubication_name || 'Sin ubicación'}
              detail={incident.department_name || 'Sin departamento'}
              icon="map"
            />
          </section>

          {/* Información general */}
          <section>
            <SectionHeading
              title="Información de la incidencia"
              subtitle="Datos de seguimiento y atención"
            />

            <div
              className="mt-4 grid grid-cols-1 gap-x-6
              gap-y-5 rounded-xl border border-slate-200
              bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {details.map((item) => (
                <MetaItem key={item.label} {...item} />
              ))}
            </div>
          </section>

          {/* Descripción */}
          <section>
            <SectionHeading title="Descripción" />

            <div
              className="mt-3 rounded-xl border border-slate-200
              bg-slate-50/80 p-4 sm:p-5"
            >
              <p
                className="whitespace-pre-wrap break-words
                text-sm leading-7 text-slate-700"
              >
                {incident.description || 'No se proporcionó una descripción.'}
              </p>
            </div>
          </section>

          {incident.printer_ip_links?.length > 0 && (
            <section>
              <SectionHeading
                title="IP de la impresora"
                subtitle="Enlace interno para verificación técnica"
              />
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                <div className="flex flex-wrap gap-3">
                  {incident.printer_ip_links.map((ip) => {
                    const href = ip.includes(':') ? `http://[${ip}]` : `http://${ip}`;
                    return (
                      <a
                        key={ip}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
                      >
                        {ip}
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Solución */}
          <section>
            <SectionHeading title="Solución aplicada" />

            <div
              className={`mt-3 rounded-xl border p-4 sm:p-5 ${
                incident.solution
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-dashed border-slate-300 bg-slate-50'
              }`}
            >
              {incident.solution ? (
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0
                    items-center justify-center rounded-lg
                    bg-emerald-100 text-emerald-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </div>

                  <p
                    className="whitespace-pre-wrap break-words
                    text-sm leading-7 text-slate-700"
                  >
                    {incident.solution}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0
                    items-center justify-center rounded-lg
                    bg-white text-slate-400 ring-1 ring-slate-200"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4l2.5 2" />
                    </svg>
                  </span>

                  <div>
                    <p className="text-sm font-medium text-slate-600">Sin solución registrada</p>
                    <p className="mt-1 text-xs text-slate-400">
                      La resolución todavía no ha sido documentada.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer
          className="flex items-center justify-between gap-3
          border-t border-slate-200 bg-slate-50/80
          px-5 py-4 sm:px-7"
        >
          <p className="hidden text-xs text-slate-400 sm:block">
            Información de seguimiento de la incidencia
          </p>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-xl bg-slate-900
              px-5 py-2.5 text-sm font-semibold text-white
              shadow-sm transition hover:bg-slate-700
              focus:outline-none focus-visible:ring-2
              focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            Cerrar detalle
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Componentes auxiliares ---------- */

function InfoCard({ label, value, detail, icon }) {
  const icons = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </>
    ),
    map: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  };

  return (
    <div
      className="flex min-w-0 items-start gap-3 rounded-xl
      border border-slate-200 bg-white p-4 transition
      hover:border-slate-300 hover:shadow-sm"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center
        justify-center rounded-lg bg-slate-100 text-slate-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-5 w-5"
          aria-hidden="true"
        >
          {icons[icon]}
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value || 'No registrado'}
        </p>
        <p className="mt-1 break-all text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

function MetaItem({ label, value, muted }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1.5 break-words text-sm font-medium ${
          muted ? 'text-slate-400' : 'text-slate-800'
        }`}
      >
        {value || '—'}
      </p>
    </div>
  );
}
