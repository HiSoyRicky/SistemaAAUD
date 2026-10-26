// TransferRequestsManager.jsx

import { useNotifications } from '@/app/providers/NotificationContext';
import { Inventory } from '@/modules/inventory/devices/services/inventory.api';
import TransferPrint from '@/shared/components/Print/DeviceTransferPrint';
import { formatDateTime, formatDateToDDMMYYYY } from '@/shared/utils/formatDate';
import { CheckCircle2, Printer, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import useAuth from '../../../../shared/hooks/useAuth';
import ModalLayer from '@/shared/components/ui/ModalLayer';

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

function statusClass(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800';
    case 'CORRECTION_REQUESTED':
      return 'bg-violet-100 text-violet-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

function formatDate(value) {
  return formatDateTime(value, '-');
}

function buildPreviewDevice(request) {
  return request?.snapshot || request?.preview_inventory || null;
}

function TransferDetail({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="break-words text-sm text-slate-700">{value || '-'}</div>
    </div>
  );
}

export default function TransferRequestsManager() {
  const { addNotification } = useNotifications();
  const { hasPermission } = useAuth();
  const canReview = hasPermission('inventory_transfers.review');
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [printableRequest, setPrintableRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [pendingPrint, setPendingPrint] = useState(false);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Traslado de equipo',
    onAfterPrint: () => {
      setPrintableRequest(null);
      setPendingPrint(false);
    },
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
    void loadRequests();
  }, [status]);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING').length,
    [requests]
  );
  const selectedDevice = buildPreviewDevice(selectedRequest);
  const currentDevice = selectedRequest?.inventory_snapshot || selectedDevice;

  useEffect(() => {
    if (!pendingPrint || !printableRequest || !buildPreviewDevice(printableRequest)) {
      return;
    }

    setPendingPrint(false);
    handlePrint();
  }, [handlePrint, pendingPrint, printableRequest]);

  const closeReview = () => {
    setSelectedRequest(null);
    setPrintableRequest(null);
    setReviewNotes('');
    setPendingPrint(false);
  };

  const openReview = (request) => {
    setSelectedRequest(request);
    setReviewNotes(request?.review_notes || '');
  };

  const sendToPrint = (request) => {
    if (!buildPreviewDevice(request)) {
      addNotification('No hay datos suficientes para imprimir esta solicitud ❌', 'error');
      return;
    }

    setPrintableRequest(request);
    setPendingPrint(true);
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

      closeReview();
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

  const handlePrintSelectedRequest = () => {
    if (!selectedRequest) return;
    sendToPrint(selectedRequest);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Aprobación de traslados</h2>
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
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Cargando solicitudes...
                </td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No hay solicitudes para mostrar.
                </td>
              </tr>
            )}

            {!loading &&
              requests.map((request) => {
                return (
                  <tr key={request.id} className="border-t">
                    <td className="px-3 py-3 align-top">{formatDate(request.requested_at)}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-slate-900">
                        {request.inventory_snapshot?.device_name ||
                          request.preview_inventory?.device_name ||
                          'Equipo'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Marbete {request.inventory_snapshot?.tag || request.preview_inventory?.tag || '-'}
                        {' · '}Serie {request.inventory_snapshot?.serie || request.preview_inventory?.serie || '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {[request.inventory_snapshot?.brand_name || request.preview_inventory?.brand_name,
                          request.inventory_snapshot?.model_name || request.preview_inventory?.model_name]
                          .filter(Boolean)
                          .join(' · ') || 'Marca y modelo no disponibles'}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {request.requester?.nombre_completo || request.requester?.username || '-'}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(request.status)}`}
                      >
                        {statusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div>{request.snapshot?.ubication_destino_name || '-'}</div>
                      <div className="text-xs text-slate-500">
                        {request.snapshot?.department_destino_name || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => sendToPrint(request)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-3 py-2 text-indigo-700 hover:bg-indigo-50"
                        >
                          <Printer size={14} />
                          Imprimir
                        </button>

                        {canReview && request.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => openReview(request)}
                            disabled={actionLoadingId === request.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} />
                            Revisar
                          </button>
                        )}

                        {canReview && request.status !== 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => openReview(request)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            Ver revisión
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
        <ModalLayer><div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
              <div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Revisión de traslado</h2>
                <p className="mt-1 text-sm text-slate-500">Solicitud #{selectedRequest.id}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrintSelectedRequest}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
                >
                  <Printer size={16} />
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={closeReview}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <X size={16} />
                  Cerrar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 p-6">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-sm font-semibold text-slate-800">
                  Identificación del equipo
                </h3>
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <TransferDetail label="Equipo" value={selectedDevice.device_name} />
                  <TransferDetail label="Marbete" value={selectedDevice.tag} />
                  <TransferDetail label="Número de serie" value={selectedDevice.serie} />
                  <TransferDetail label="Marca" value={selectedDevice.brand_name} />
                  <TransferDetail label="Modelo" value={selectedDevice.model_name} />
                  <TransferDetail label="Dirección IP" value={selectedDevice.ip} />
                  <TransferDetail label="Descripción" value={selectedDevice.description} />
                  <TransferDetail
                    label="Clasificación"
                    value={selectedDevice.classification?.description}
                  />
                  <TransferDetail label="Tipo de activo" value={selectedDevice.asset_type?.name} />
                  <TransferDetail label="Condición" value={currentDevice.condition_name} />
                  <TransferDetail label="Estado del equipo" value={currentDevice.status_name} />
                  <TransferDetail label="Usuario actual" value={currentDevice.user} />
                  <TransferDetail
                    label="Observación"
                    value={selectedDevice.observation}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                </div>
              </section>

              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-sm font-semibold text-slate-800">Datos del traslado</h3>
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <TransferDetail label="Ubicación actual" value={currentDevice.ubication_name} />
                  <TransferDetail label="Departamento actual" value={currentDevice.department_name} />
                  <TransferDetail
                    label="Área administradora actual"
                    value={currentDevice.administrative_area_name}
                  />
                  <TransferDetail label="Ubicación de destino" value={selectedDevice.ubication_destino_name} />
                  <TransferDetail
                    label="Departamento de destino"
                    value={selectedDevice.department_destino_name}
                  />
                  <TransferDetail
                    label="Área administradora de destino"
                    value={
                      selectedDevice.administrative_area_destino_name ||
                      selectedDevice.administrative_area_name
                    }
                  />
                  <TransferDetail label="Estado de la solicitud" value={statusLabel(selectedRequest.status)} />
                  <TransferDetail
                    label="Solicitó"
                    value={
                      selectedRequest.requester?.nombre_completo ||
                      selectedRequest.requester?.username
                    }
                  />
                  <TransferDetail label="Fecha de solicitud" value={formatDate(selectedRequest.requested_at)} />
                  <TransferDetail label="Usuario receptor" value={selectedRequest.snapshot?.userRecibe} />
                </div>
              </section>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <label
                  htmlFor="review-Notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notas de revisión
                </label>
                <textarea
                  id="review-Notes"
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
                      onClick={() => runAction(selectedRequest, 'approve', reviewNotes)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(selectedRequest, 'correction', reviewNotes)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Solicitar corrección
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(selectedRequest, 'reject', reviewNotes)}
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
        </div></ModalLayer>
      )}

      {printableRequest && buildPreviewDevice(printableRequest) && (
        <div className="fixed left-[-10000px] top-0" aria-hidden="true">
          <TransferPrint
            ref={printRef}
            device={buildPreviewDevice(printableRequest)}
            fecha={
              printableRequest.requested_at
                ? formatDateToDDMMYYYY(printableRequest.requested_at, '-')
                : formatDateToDDMMYYYY(new Date(), '-')
            }
            setDevice={() => {}}
            departments={[]}
          />
        </div>
      )}
    </div>
  );
}
