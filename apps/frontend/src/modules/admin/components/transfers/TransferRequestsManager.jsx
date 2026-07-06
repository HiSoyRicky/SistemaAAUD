import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Printer, RefreshCw, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useNotifications } from '../../../../app/providers/NotificationContext';
import { Inventory } from '../../../inventory/devices/services/inventory.api';
import TransferPrint from '../../../../shared/components/Print/DeviceTransferPrint';
import {
  formatDateTime,
  formatDateToDDMMYYYY,
} from '../../../../shared/utils/formatDate';

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'CORRECTION_REQUESTED', label: 'Corrección solicitada' },
];

function statusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return 'Pendiente';
    case 'APPROVED':
      return 'Aprobada';
    case 'REJECTED':
      return 'Rechazada';
    case 'CORRECTION_REQUESTED':
      return 'Corrección solicitada';
    default:
      return status || 'N/A';
  }
}

function formatDate(value) {
  return formatDateTime(value, '-');
}

function buildPreviewDevice(request) {
  return request?.snapshot || request?.preview_inventory || null;
}

export default function TransferRequestsManager() {
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Traslado de equipo',
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await Inventory.fetchTransferRequests({ status });
      setRequests(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      addNotification('No se pudieron cargar las solicitudes ❌', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [status]);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests]
  );

  const closePreview = () => {
    setSelectedRequest(null);
    setReviewNotes('');
  };

  const openPreview = (request) => {
    setSelectedRequest(request);
    setReviewNotes(request?.review_notes || '');
  };

  const runAction = async (request, action, notesOverride = '') => {
    try {
      setActionLoadingId(request.id);

      if (action === 'approve') {
        await Inventory.approveTransferRequest(request.id, {
          review_notes: notesOverride,
        });
        addNotification('Traslado aprobado ✅', 'success');
      } else if (action === 'reject') {
        await Inventory.rejectTransferRequest(request.id, {
          review_notes: notesOverride,
        });
        addNotification('Traslado rechazado ✅', 'success');
      } else {
        await Inventory.requestTransferCorrection(request.id, {
          review_notes: notesOverride,
        });
        addNotification('Se solicitó corrección ✅', 'success');
      }

      closePreview();
      await loadRequests();
    } catch (error) {
      addNotification(
        error.response?.data?.message || 'No se pudo completar la acción ❌',
        'error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrintPreview = () => {
    if (!selectedRequest) return;
    handlePrint();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Aprobación de traslados
          </h2>
          <p className="text-sm text-slate-500">Pendientes: {pendingCount}</p>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${status === filter.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-left">Equipo</th>
              <th className="px-3 py-3 text-left">Solicitó</th>
              <th className="px-3 py-3 text-left">Estado</th>
              <th className="px-3 py-3 text-left">Destino</th>
              <th className="px-3 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Cargando solicitudes...
                </td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No hay solicitudes para mostrar.
                </td>
              </tr>
            )}

            {!loading &&
              requests.map((request) => {
                const previewDevice = buildPreviewDevice(request);

                return (
                  <tr key={request.id} className="border-t">
                    <td className="px-3 py-3 align-top">
                      {formatDate(request.requested_at)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-slate-900">
                        {request.inventory_snapshot?.tag ||
                          request.preview_inventory?.tag ||
                          '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {request.inventory_snapshot?.device_name ||
                          request.preview_inventory?.device_name ||
                          'Equipo'}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {request.requester?.nombre_completo ||
                        request.requester?.username ||
                        '-'}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : request.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {statusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div>
                        {request.snapshot?.ubication_destino_name || '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {request.snapshot?.department_destino_name || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openPreview(request)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-3 py-2 text-indigo-700 hover:bg-indigo-50"
                        >
                          <Printer size={14} />
                          Ver hoja
                        </button>

                        {request.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => runAction(request, 'approve')}
                            disabled={actionLoadingId === request.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} />
                            Aprobar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {selectedRequest && buildPreviewDevice(selectedRequest) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="flex w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
              <div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Vista previa del traslado
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Solicitud #{selectedRequest.id}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrintPreview}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
                >
                  <Printer size={16} />
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={closePreview}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <X size={16} />
                  Cerrar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-800 p-10">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="rounded-lg bg-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div
                      style={{
                        width: '210mm',
                        minHeight: '290mm',
                        transform: 'scale(0.75)',
                        transformOrigin: 'top center',
                      }}
                    >
                      <TransferPrint
                        ref={printRef}
                        device={buildPreviewDevice(selectedRequest)}
                        fecha={
                          selectedRequest.requested_at
                            ? formatDateToDDMMYYYY(
                                selectedRequest.requested_at,
                                '-'
                              )
                            : formatDateToDDMMYYYY(new Date(), '-')
                        }
                        setDevice={() => {}}
                        departments={[]}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-6 max-w-3xl rounded-xl bg-white p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notas de revisión
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Escribe aquí una corrección, comentario o motivo de rechazo"
                />

                {selectedRequest.status === 'PENDING' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        runAction(selectedRequest, 'approve', reviewNotes)
                      }
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(selectedRequest, 'correction', reviewNotes)
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Solicitar corrección
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(selectedRequest, 'reject', reviewNotes)
                      }
                      className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Esta solicitud ya fue procesada.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
