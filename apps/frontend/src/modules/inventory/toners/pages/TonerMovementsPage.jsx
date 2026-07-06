import React, { useEffect, useRef, useState } from 'react';
import { Toners } from '../services/toners.api';
import Pagination from '../../../../shared/components/ui/Pagination';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../../app/providers/NotificationContext';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import TonerDeliveryPrint from '../../../../shared/components/Print/TonerDeliveryPrint';
import { exportTonerMovementsToExcel } from '../../../../shared/utils/exportExcel';
import {
  formatDateTime,
  formatDateToDDMMYYYY,
} from '../../../../shared/utils/formatDate';

function TonerMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploadingMovementId, setUploadingMovementId] = useState(null);
  const [previewMovement, setPreviewMovement] = useState(null);
  const [exporting, setExporting] = useState(false);

  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Entrega de tóner',
  });

  const loadMovements = async () => {
    try {
      setLoading(true);

      const res = await Toners.fetchMovements({
        page: currentPage,
        search,
      });

      setMovements(res.data);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMovements = async () => {
    const firstPage = await Toners.fetchMovements({
      page: 1,
      search,
    });

    const total = Number(firstPage?.totalPages || 1);
    const allMovements = Array.isArray(firstPage?.data)
      ? [...firstPage.data]
      : [];

    for (let page = 2; page <= total; page += 1) {
      const response = await Toners.fetchMovements({
        page,
        search,
      });

      if (Array.isArray(response?.data)) {
        allMovements.push(...response.data);
      }
    }

    return allMovements;
  };

  useEffect(() => {
    loadMovements();
  }, [currentPage, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Traducción de los movimientos
  const movementLabels = {
    IN: 'Entrada',
    OUT: 'Salida',
    ADJUSTMENT: 'Ajuste',
  };

  // Formateo de fecha y hora
  const formatDatePart = (date) => {
    return formatDateToDDMMYYYY(date, '-');
  };

  const formatTimePart = (date) => {
    const full = formatDateTime(date, '-');
    const parts = full.split(',');
    return parts.length > 1 ? parts.slice(1).join(',').trim() : '-';
  };

  const formatPrintDate = (date) => {
    return date
      ? formatDateToDDMMYYYY(date, '-')
      : formatDateToDDMMYYYY(new Date(), '-');
  };

  const openPreview = (movement) => {
    setPreviewMovement(movement);
  };

  const closePreview = () => {
    setPreviewMovement(null);
  };

  const handlePreviewPrint = () => {
    if (!previewMovement) return;
    handlePrint();
  };
  const handleExport = async () => {
    try {
      setExporting(true);
      const allMovements = await fetchAllMovements();

      if (allMovements.length === 0) {
        addNotification('No hay movimientos para exportar ❌', 'error');
        return;
      }

      await exportTonerMovementsToExcel(allMovements);
      addNotification('Historial de tóners exportado ✅', 'success');
    } catch (error) {
      console.error(error);
      addNotification('No se pudo exportar el historial ❌', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <p className="p-6">Cargando historial...</p>;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold">Historial Global de Movimientos</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por modelo de tóner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded w-72"
        />

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white ${exporting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {exporting ? 'Exportando...' : 'Exportar historial'}
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-center">Fecha</th>
              <th className="px-3 py-2 text-center">Tóner</th>
              <th className="px-3 py-2 text-center">Tipo</th>
              <th className="px-3 py-2 text-center">Cantidad</th>
              <th className="px-3 py-2 text-center">Ubicación</th>
              <th className="px-3 py-2 text-center">Departamento</th>
              <th className="px-3 py-2 text-center">Nota</th>
              <th className="px-3 py-2 text-center">Stock Ant.</th>
              <th className="px-3 py-2 text-center">Stock Nuevo</th>
              <th className="px-3 py-2 text-center">Entregó</th>
              <th className="px-3 py-2 text-center">Retiró</th>
              <th className="px-3 py-2 text-center">Ver</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2 text-center border">
                  <div className="flex flex-col">
                    <span>{formatDatePart(m.created_at)}</span>
                    <span className="text-xs text-gray-400">
                      {formatTimePart(m.created_at)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  {m.toner?.toner_model}
                </td>
                <td className="px-3 py-2 text-center">
                  {movementLabels[m.movement_type] || m.movement_type}
                </td>
                <td className="px-3 py-2 text-center">{m.quantity}</td>
                <td className="px-3 py-2 text-center">
                  {m.ubication?.name || '-'}
                </td>
                <td className="px-3 py-2 text-center">
                  {m.department?.name || '-'}
                </td>
                <td className="px-3 py-2 text-center">{m.reference || '-'}</td>
                <td className="px-3 py-2 text-center">{m.previous_stock}</td>
                <td className="px-3 py-2 text-center">{m.new_stock}</td>
                <td className="px-3 py-2 text-center">
                  {m.user?.nombre_completo || '-'}
                </td>
                <td className="px-3 py-2 text-center">
                  {m.receiver_name || '-'}
                </td>
                <td className="px-3 py-2 text-center">
                  {m.movement_type === 'OUT' ? (
                    <button
                      type="button"
                      onClick={() => openPreview(m)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                    >
                      <Printer size={14} />
                      Vista previa
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {previewMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="flex w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
              <div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Hoja de Entrega de Tóner
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {previewMovement?.toner?.toner_model}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePreviewPrint}
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
                  {/* Hoja */}
                  <div className="rounded-lg bg-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div
                      style={{
                        width: '210mm',
                        minHeight: '297mm',
                        transform: 'scale(0.75)',
                        transformOrigin: 'top center',
                      }}
                    >
                      <TonerDeliveryPrint
                        movement={previewMovement}
                        fecha={formatPrintDate(previewMovement.created_at)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewMovement && (
        <div className="fixed left-[-10000px] top-0" aria-hidden="true">
          <TonerDeliveryPrint
            ref={printRef}
            movement={previewMovement}
            fecha={formatPrintDate(previewMovement.created_at)}
          />
        </div>
      )}
    </div>
  );
}

export default TonerMovementsPage;
