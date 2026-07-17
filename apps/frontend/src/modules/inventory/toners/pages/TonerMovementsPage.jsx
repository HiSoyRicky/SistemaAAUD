import {
  ArrowLeft,
  Download,
  FileText,
  FilterX,
  PackageMinus,
  PackagePlus,
  Printer,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useNotifications } from '../../../../app/providers/NotificationContext';
import TonerDeliveryPrint from '../../../../shared/components/Print/TonerDeliveryPrint';
import Pagination from '../../../../shared/components/ui/Pagination';
import { exportTonerMovementsToExcel } from '../../../../shared/utils/exportExcel';
import {
  formatDateTime,
  formatDateToDDMMYYYY,
} from '../../../../shared/utils/formatDate';
import { Toners } from '../services/toners.api';

const MOVEMENT_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'IN', label: 'Entradas' },
  { value: 'OUT', label: 'Salidas' },
  { value: 'ADJUSTMENT', label: 'Ajustes' },
];

const movementLabels = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
};

const movementStyles = {
  IN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  OUT: 'border-rose-200 bg-rose-50 text-rose-700',
  ADJUSTMENT: 'border-amber-200 bg-amber-50 text-amber-700',
};

const COLOR_MAP = {
  BLACK: 'NEGRO',
  CYAN: 'CIAN',
  MAGENTA: 'MAGENTA',
  YELLOW: 'AMARILLO',
};

const colorStyles = {
  BLACK: 'border-slate-300 bg-slate-900 text-white',
  CYAN: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  MAGENTA: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  YELLOW: 'border-yellow-200 bg-yellow-50 text-yellow-700',
};

const emptyMetrics = { total: 0, IN: 0, OUT: 0, ADJUSTMENT: 0 };

const translateColor = (color) => COLOR_MAP[color] || valueOrDash(color);

function valueOrDash(value) {
  if (value === null || value === undefined) return '-';
  const trimmed = String(value).trim();
  return trimmed === '' ? '-' : trimmed;
}

function formatDatePart(date) {
  return date ? formatDateToDDMMYYYY(date, '-') : '-';
}

function formatTimePart(date) {
  if (!date) return '-';
  const full = formatDateTime(date, '-');
  const parts = full.split(',');
  return parts.length > 1 ? parts.slice(1).join(',').trim() : '-';
}

function formatPrintDate(date) {
  return date
    ? formatDateToDDMMYYYY(date, '-')
    : formatDateToDDMMYYYY(new Date(), '-');
}

function movementBadge(type) {
  return (
    <span
      className={`inline-flex min-w-[76px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        movementStyles[type] || 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {movementLabels[type] || valueOrDash(type)}
    </span>
  );
}

function colorBadge(color) {
  if (!color) return <span className="text-xs text-slate-400">-</span>;

  return (
    <span
      className={`inline-flex min-w-[82px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        colorStyles[color] || 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {translateColor(color)}
    </span>
  );
}

function stockDelta(previousStock, newStock) {
  const previous = Number(previousStock);
  const current = Number(newStock);

  if (!Number.isFinite(previous) || !Number.isFinite(current)) return '-';

  const delta = current - previous;
  if (delta === 0) return '0';

  return `${delta > 0 ? '+' : ''}${delta}`;
}

function stockDeltaClass(previousStock, newStock) {
  const previous = Number(previousStock);
  const current = Number(newStock);
  if (!Number.isFinite(previous) || !Number.isFinite(current)) {
    return 'text-slate-500';
  }

  if (current > previous) return 'text-emerald-700';
  if (current < previous) return 'text-rose-700';
  return 'text-slate-500';
}

function TonerMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [previewMovement, setPreviewMovement] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Entrega de tóner',
    onAfterPrint: () => {
      setPreviewMovement(null);
      setPendingPrint(false);
    },
  });

  const hasFilters = Boolean(search || movementType || from || to);
  const summary = useMemo(() => {
    return `${total} movimiento${total === 1 ? '' : 's'} encontrado${
      total === 1 ? '' : 's'
    }`;
  }, [total]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const res = await Toners.fetchMovements({
        page: currentPage,
        search,
        movement_type: movementType,
        from,
        to,
      });

      setMovements(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(Math.max(Number(res?.totalPages) || 1, 1));
      setTotal(Number(res?.total) || 0);
      setMetrics({
        ...emptyMetrics,
        ...(res?.summary || {}),
        total: Number(res?.summary?.total ?? res?.total) || 0,
      });
    } catch (error) {
      console.error('Error cargando historial de tóner:', error);
      setMovements([]);
      setTotalPages(1);
      setTotal(0);
      setMetrics(emptyMetrics);
      setErrorMessage('No se pudo cargar el historial de movimientos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMovements = async () => {
    const firstPage = await Toners.fetchMovements({
      page: 1,
      limit: 100,
      search,
      movement_type: movementType,
      from,
      to,
    });

    const total = Number(firstPage?.totalPages || 1);
    const allMovements = Array.isArray(firstPage?.data)
      ? [...firstPage.data]
      : [];

    for (let page = 2; page <= total; page += 1) {
      const response = await Toners.fetchMovements({
        page,
        limit: 100,
        search,
        movement_type: movementType,
        from,
        to,
      });

      if (Array.isArray(response?.data)) {
        allMovements.push(...response.data);
      }
    }

    return allMovements;
  };

  useEffect(() => {
    loadMovements();
  }, [currentPage, search, movementType, from, to]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch((previous) => {
        const nextValue = searchInput.trim();
        return previous === nextValue ? previous : nextValue;
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, movementType, from, to]);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setMovementType('');
    setFrom('');
    setTo('');
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!pendingPrint || !previewMovement) return;

    setPendingPrint(false);
    handlePrint();
  }, [handlePrint, pendingPrint, previewMovement]);

  const printMovement = (movement) => {
    setPreviewMovement(movement);
    setPendingPrint(true);
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
      addNotification('Historial de tóneres exportado ✅', 'success');
    } catch (error) {
      console.error('Error exportando historial de tóner:', error);
      addNotification('No se pudo exportar el historial ❌', 'error');
    } finally {
      setExporting(false);
    }
  };

  const thClass =
    'border-b border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600';
  const tdClass =
    'border-b border-slate-100 px-3 py-3 text-center text-xs text-slate-700 align-middle';

  return (
    <div className="w-full space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                Historial global de tóner
              </h1>
              <p className="text-sm text-slate-500">{summary}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || loading}
              className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition ${
                exporting || loading
                  ? 'cursor-not-allowed bg-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Download size={16} />
              {exporting ? 'Exportando...' : 'Exportar'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/inventario/toners')}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={16} />
              Volver
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase text-slate-500">
              <SlidersHorizontal size={15} />
              Total
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">
              {metrics.total}
            </div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase text-emerald-600">
              <PackagePlus size={15} />
              Entradas
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">
              {metrics.IN}
            </div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase text-rose-600">
              <PackageMinus size={15} />
              Salidas
            </div>
            <div className="mt-2 text-3xl font-bold text-rose-600">
              {metrics.OUT}
            </div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase text-amber-600">
              <SlidersHorizontal size={15} />
              Ajustes
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600">
              {metrics.ADJUSTMENT}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 md:grid-cols-4 xl:grid-cols-7">
          <div className="relative md:col-span-2 xl:col-span-3">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por tóner, nota, ubicación, departamento o retiró"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {MOVEMENT_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            title="Desde"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            title="Hasta"
          />

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition ${
              hasFilters
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            }`}
          >
            <FilterX size={16} />
            Limpiar
          </button>
        </div>

        {errorMessage && (
          <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px]">
            <thead>
              <tr>
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Tóner</th>
                <th className={thClass}>Color</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Cantidad</th>
                <th className={thClass}>Ubicación</th>
                <th className={thClass}>Departamento</th>
                <th className={thClass}>Nota</th>
                <th className={thClass}>Stock</th>
                <th className={thClass}>Variación</th>
                <th className={thClass}>Entregó</th>
                <th className={thClass}>Retiró</th>
                <th className={thClass}>Hoja</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-400"
                    colSpan={13}
                  >
                    Cargando historial de movimientos...
                  </td>
                </tr>
              )}

              {!loading && movements.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-400"
                    colSpan={13}
                  >
                    No se encontraron movimientos con esos filtros
                  </td>
                </tr>
              )}

              {!loading &&
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50">
                    <td className={tdClass}>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-slate-800">
                          {formatDatePart(movement.created_at)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatTimePart(movement.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>
                      {valueOrDash(movement.toner?.toner_model)}
                    </td>
                    <td className={tdClass}>
                      {colorBadge(movement.toner?.color)}
                    </td>
                    <td className={tdClass}>
                      {movementBadge(movement.movement_type)}
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      {valueOrDash(movement.quantity)}
                    </td>
                    <td className={tdClass}>
                      {valueOrDash(movement.ubication?.name)}
                    </td>
                    <td className={tdClass}>
                      {valueOrDash(movement.department?.name)}
                    </td>
                    <td className={`${tdClass} max-w-[220px] text-left`}>
                      <span className="line-clamp-2">
                        {valueOrDash(movement.reference)}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[11px] text-slate-400">
                          Ant. {valueOrDash(movement.previous_stock)}
                        </span>
                        <span className="font-semibold text-slate-900">
                          Nuevo {valueOrDash(movement.new_stock)}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`${tdClass} font-semibold ${stockDeltaClass(
                        movement.previous_stock,
                        movement.new_stock
                      )}`}
                    >
                      {stockDelta(movement.previous_stock, movement.new_stock)}
                    </td>
                    <td className={tdClass}>
                      {valueOrDash(movement.user?.nombre_completo)}
                    </td>
                    <td className={tdClass}>
                      {valueOrDash(movement.receiver_name)}
                    </td>
                    <td className={tdClass}>
                      {movement.movement_type === 'OUT' ? (
                        <button
                          type="button"
                          onClick={() => printMovement(movement)}
                          className="inline-flex items-center gap-1 rounded-md border border-indigo-300 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                          <Printer size={14} />
                          Imprimir
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Sin hoja</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>

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
