// ResolveIncidentModal.jsx

import { useEffect, useState } from 'react';

function getStatusUI(status) {
  switch (status) {
    case 'Pendiente':
      return {
        pill: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        dot: 'bg-yellow-500',
      };

    case 'Asignado a un técnico':
      return {
        pill: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-600',
      };

    case 'Resuelto':
      return {
        pill: 'bg-green-50 text-green-800 border-green-200',
        dot: 'bg-green-600',
      };

    default:
      return {
        pill: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
      };
  }
}

function getLabelTitle(incident) {
  if (!incident) {
    return 'Incidencia';
  }

  const category = incident.category_name || 'Incidencia';
  const location = incident.ubication_name ? ` · ${incident.ubication_name}` : '';

  return `${category}${location}`;
}

function IncidentSummary({ incident, loadingIncident, incidentError }) {
  if (loadingIncident) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-3 w-44 rounded bg-slate-200" />
        <div className="h-2.5 w-full rounded bg-slate-200" />
        <div className="h-2.5 w-4/5 rounded bg-slate-200" />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="h-14 rounded bg-slate-200" />
          <div className="h-14 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (incidentError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
        {incidentError}
      </div>
    );
  }

  if (!incident) {
    return <p className="text-xs text-slate-600">No hay datos para mostrar.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Resumen</p>

      <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-3">
        <InfoCard icon="📍" label="Ubicación" title={incident.ubication_name || '—'} />

        <InfoCard icon="🏢" label="Departamento" title={incident.department_name || '—'} />

        <InfoCard
          icon="👤"
          label="Reportado por"
          title={incident.reporter_name || '—'}
          subtitle={incident.reporter_email || '—'}
        />
      </div>

      <IncidentDescription incident={incident} />
    </div>
  );
}

function IncidentDescription({ incident }) {
  const hasDetails = incident.other_category_detail || incident.description;

  if (!hasDetails) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
      {incident.other_category_detail && (
        <p className="text-xs text-slate-700">
          <span className="font-extrabold">Detalle:</span>{' '}
          <span className="font-medium">{incident.other_category_detail}</span>
        </p>
      )}

      <p className={`text-xs text-slate-800 ${incident.other_category_detail ? 'mt-1.5' : ''}`}>
        <span className="font-extrabold">Descripción:</span>{' '}
        <span className="font-medium">{incident.description || '—'}</span>
      </p>
    </div>
  );
}

function IncidentHeader({ incident, statusUI, labelTitle, onClose }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-3 text-white">
      <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/70">
            Número de incidencia
          </p>

          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-extrabold tracking-tight">
              #{incident?.ticket_number || '—'}
            </h3>

            <span className="truncate text-xs text-white/70">{labelTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {incident?.status && <StatusBadge status={incident.status} statusUI={statusUI} />}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-2.5 py-2 text-sm font-extrabold hover:bg-white/15"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, statusUI }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusUI.pill}`}
    >
      <span className={`h-2 w-2 rounded-full ${statusUI.dot}`} />

      {status}
    </span>
  );
}

function SolutionForm({
  solutionText,
  setSolutionText,
  maxChars,
  isSubmitting,
  onSubmit,
  onClose,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <div>
          <label htmlFor="solutionText" className="block text-sm font-extrabold text-slate-900">
            Solución aplicada
          </label>

          <p className="mt-0.5 text-[11px] text-slate-600">
            Describe lo que hiciste (quedará guardado en el historial).
          </p>
        </div>

        <span className="text-[11px] font-semibold text-slate-500">
          {solutionText.length}/{maxChars}
        </span>
      </div>

      <textarea
        id="solutionText"
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
        rows={4}
        maxLength={maxChars}
        placeholder="Ej: Se realizó cambio de tóner y prueba de impresión."
        value={solutionText}
        onChange={(e) => setSolutionText(e.target.value)}
        required
      />

      <div className="sticky bottom-0 mt-2 rounded-b-2xl border-t bg-white/90 backdrop-blur">
        <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-xl px-3.5 py-2 text-sm font-extrabold text-white shadow-sm transition ${
              isSubmitting ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-950 hover:bg-slate-900'
            }`}
          >
            {isSubmitting ? 'Resolviendo...' : 'Resolver incidencia'}
          </button>
        </div>
      </div>
    </form>
  );
}

function ConfirmResolveModal({ solutionText, isSubmitting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h4 className="mb-3 text-lg font-extrabold text-slate-900">Confirmar resolución</h4>

        <p className="mb-2 text-sm text-slate-700">
          ¿Estás seguro de marcar esta incidencia como <strong>resuelta</strong> con la siguiente
          respuesta?
        </p>

        <div className="mb-4 rounded-lg border bg-slate-50 p-3 text-xs text-slate-800">
          {solutionText}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`rounded-xl px-4 py-2 text-sm font-extrabold text-white ${
              isSubmitting ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-950 hover:bg-slate-900'
            }`}
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, title, subtitle }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-base">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-0.5 truncate text-sm font-extrabold text-slate-900">{title}</p>

          {subtitle && <p className="truncate text-[11px] text-slate-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function ResolveIncidentModal({ id_incident, onClose, onConfirm }) {
  const [solutionText, setSolutionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [incident, setIncident] = useState(null);
  const [loadingIncident, setLoadingIncident] = useState(true);
  const [incidentError, setIncidentError] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);

  const maxChars = 500;

  useEffect(() => {
    document.body.classList.add('no-scroll');

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const loadIncident = async () => {
      try {
        setLoadingIncident(true);
        setIncidentError('');
        setIncident(null);

        const token = localStorage.getItem('token');

        const res = await fetch(`/api/incidents/${id_incident}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error('No se pudo cargar el detalle de la incidencia.');
        }

        const data = await res.json();

        if (alive) {
          setIncident(data);
        }
      } catch (error) {
        console.error(error);

        if (alive) {
          setIncidentError('No se pudo cargar el resumen de la incidencia.');
        }
      } finally {
        if (alive) {
          setLoadingIncident(false);
        }
      }
    };

    if (!id_incident) {
      setLoadingIncident(false);
      setIncidentError('No se recibió el identificador de la incidencia.');

      return () => {
        alive = false;
      };
    }

    loadIncident();

    return () => {
      alive = false;
    };
  }, [id_incident]);

  const statusUI = getStatusUI(incident?.status);
  const labelTitle = getLabelTitle(incident);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!solutionText.trim()) {
      alert('Debe ingresar la solución aplicada.');
      return;
    }

    setShowConfirm(true);
  };

  const confirmResolve = async () => {
    try {
      setIsSubmitting(true);

      await onConfirm(solutionText);

      onClose();
    } catch (error) {
      console.error('Error al resolver la incidencia:', error);

      alert('Error al enviar la solución.');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <IncidentHeader
          incident={incident}
          statusUI={statusUI}
          labelTitle={labelTitle}
          onClose={onClose}
        />

        <div className="max-h-[78vh] overflow-y-auto px-4 py-4">
          <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <IncidentSummary
              incident={incident}
              loadingIncident={loadingIncident}
              incidentError={incidentError}
            />
          </div>

          <SolutionForm
            solutionText={solutionText}
            setSolutionText={setSolutionText}
            maxChars={maxChars}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        </div>
      </div>

      {showConfirm && (
        <ConfirmResolveModal
          solutionText={solutionText}
          isSubmitting={isSubmitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmResolve}
        />
      )}
    </div>
  );
}

export default ResolveIncidentModal;
