import { Check, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';

const TYPE_LABELS = {
  INVENTORY: 'Activo de inventario',
  BRAND: 'Marca',
  MODEL: 'Modelo',
  DEVICE: 'Tipo de activo',
};
const STATUS_LABELS = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

function requestTitle(request) {
  const payload = request.payload || {};
  if (request.type === 'INVENTORY') return `Activo: ${payload.tag || 'Sin marbete'}`;
  if (request.type === 'MODEL') return `Modelo: ${payload.name || 'Sin nombre'}`;
  if (request.type === 'DEVICE') return `Tipo de activo: ${payload.name || 'Sin nombre'}`;
  return `Marca: ${payload.name || 'Sin nombre'}`;
}

export default function CreationRequestsManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/creation-requests');
      setRequests(Array.isArray(data) ? data : []);
      setError('');
    } catch (cause) {
      setError(cause.response?.data?.message || 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (request, action) => {
    setBusyId(request.id);
    try {
      if (action === 'approve') await api.post(`/api/creation-requests/${request.id}/approve`);
      else
        await api.post(`/api/creation-requests/${request.id}/reject`, {
          review_notes: 'Rechazada por administración.',
        });
      await load();
    } catch (cause) {
      setError(cause.response?.data?.message || 'No se pudo procesar la solicitud.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Solicitudes de creación</h2>
          <p className="text-sm text-slate-500">
            Revisa las altas propuestas antes de agregarlas al sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        >
          <RefreshCw size={15} /> Actualizar
        </button>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {loading ? (
        <p className="py-8 text-center text-slate-500">Cargando solicitudes…</p>
      ) : requests.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">No hay solicitudes.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const pending = request.status === 'PENDING';
            const retryable =
              request.status === 'PROCESSING' &&
              request.reviewed_at &&
              Date.now() - new Date(request.reviewed_at).getTime() > 15 * 60 * 1000;
            return (
              <article key={request.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{requestTitle(request)}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Solicita:{' '}
                      {request.requester?.nombre_completo ||
                        request.requester?.username ||
                        'Usuario'}{' '}
                      · {new Date(request.requested_at).toLocaleString('es-PA')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {TYPE_LABELS[request.type]}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${pending ? 'bg-amber-100 text-amber-800' : request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : request.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {STATUS_LABELS[request.status] || request.status}
                  </span>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-blue-700">
                    Ver datos propuestos
                  </summary>
                  {request.display_data?.length ? (
                    <dl className="mt-2 grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {request.display_data.map(({ label, value }) => (
                        <div key={label} className="min-w-0 rounded-md bg-white px-3 py-2">
                          <dt className="text-xs font-medium text-slate-500">{label}</dt>
                          <dd className="mt-0.5 break-words text-sm font-semibold text-slate-800">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No hay datos descriptivos para mostrar.</p>
                  )}
                </details>
                {request.review_notes && (
                  <p className="mt-2 text-sm text-slate-600">Nota: {request.review_notes}</p>
                )}
                {(pending || retryable) && (
                  <div className="mt-3 flex justify-end gap-2">
                    {pending && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === request.id}
                          onClick={() => act(request, 'reject')}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-50"
                        >
                          <X size={15} /> Rechazar
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={busyId === request.id}
                      onClick={() => act(request, 'approve')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      <Check size={15} /> {retryable ? 'Reintentar aprobación' : 'Aprobar y crear'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
