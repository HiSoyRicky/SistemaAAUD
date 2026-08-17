// TonerTable.jsx

import {
  AlertTriangle,
  Boxes,
  Droplets,
  History,
  PackageCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../../../../../shared/components/ui/ActionButton';
import Pagination from '../../../../../shared/components/ui/Pagination';
import useAuth from '../../../../../shared/hooks/useAuth';
import TonerMovementModal from '../modals/TonerMovementsModal';

const COLOR_MAP = {
  BLACK: 'NEGRO',
  CYAN: 'CIAN',
  MAGENTA: 'MAGENTA',
  YELLOW: 'AMARILLO',
  TRI_COLOR: 'TRES COLORES',
};

const COLOR_HEX_MAP = {
  BLACK: '#000',
  CYAN: '#00bcd4',
  MAGENTA: '#e91e63',
  YELLOW: '#ffeb3b',
  TRI_COLOR: '#9c27b0',
};

const getColorHex = (color) => COLOR_HEX_MAP[color] || '#ccc';

const translateColor = (color) => COLOR_MAP[color] || color;

function TonerTableRow({ toner, tdClass, canCreateMovement, onMovement }) {
  const lowStock = toner.stock <= toner.min_stock;

  return (
    <tr className="transition hover:bg-slate-50">
      <td className={tdClass}>{toner.brand || '—'}</td>

      <td className={tdClass}>{toner.printer_model || '—'}</td>

      <td className={tdClass}>{toner.toner_model || '—'}</td>

      <td className={tdClass}>
        <div className="flex items-center justify-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: getColorHex(toner.color) }}
          />
          {translateColor(toner.color)}
        </div>
      </td>

      <td className={`${tdClass} font-semibold ${lowStock ? 'text-red-600' : 'text-green-600'}`}>
        {toner.stock}

        {lowStock && <span className="ml-2 text-xs text-red-500">(bajo)</span>}
      </td>

      <td className={tdClass}>
        <div className="flex justify-center">
          {canCreateMovement && (
            <ActionButton onClick={() => onMovement(toner)} type="refresh">
              Movimiento
            </ActionButton>
          )}
        </div>
      </td>
    </tr>
  );
}

function TonerTable({ toners = [], onRefresh }) {
  const { userType } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedToner, setSelectedToner] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const itemsPerPage = 12;

  // 🔹 FILTRADO
  const filtered = useMemo(() => {
    const term = search.toLowerCase();

    return toners.filter((t) => {
      return (
        t.brand?.toLowerCase().includes(term) ||
        t.printer_model?.toLowerCase().includes(term) ||
        t.toner_model?.toLowerCase().includes(term) ||
        translateColor(t.color)?.toLowerCase().includes(term)
      );
    });
  }, [toners, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage]);

  const openMovementModal = (toner) => {
    setSelectedToner(toner);
    setMovementModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      await onRefresh?.();
    } catch (err) {
      console.error(err);
      setError('Error al refrescar datos');
    } finally {
      setLoading(false);
    }
  };

  const canCreateMovement = ['admin', 'tecnico', 'consultor'].includes(userType);
  const metrics = useMemo(() => {
    const totalModels = toners.length;
    const totalStock = toners.reduce((sum, toner) => sum + Number(toner.stock || 0), 0);
    const lowStock = toners.filter(
      (toner) => Number(toner.stock || 0) <= Number(toner.min_stock || 0)
    ).length;
    const colors = new Set(toners.map((toner) => toner.color).filter(Boolean)).size;

    return { totalModels, totalStock, lowStock, colors };
  }, [toners]);

  const tdClass =
    'border-x border-slate-100 px-4 py-3 text-center align-middle text-sm text-slate-700';
  const thClass =
    'border-x border-slate-100 px-4 py-3 text-center align-middle text-xs font-bold uppercase tracking-wide text-slate-500';

  return (
    <div className="w-full space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Droplets size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">Inventario de tóneres</h1>
              <p className="text-sm text-slate-500">
                Consulta existencias, modelos y movimientos de tóneres.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/inventario/toners/history')}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <History size={16} />
              Historial
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Boxes size={15} />
              Modelos
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">{metrics.totalModels}</div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <PackageCheck size={15} />
              Stock total
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">{metrics.totalStock}</div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-600">
              <AlertTriangle size={15} />
              Bajo stock
            </div>
            <div className="mt-2 text-3xl font-bold text-rose-600">{metrics.lowStock}</div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <Droplets size={15} />
              Colores
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{metrics.colors}</div>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Listado de tóneres</h2>
            <p className="text-sm text-slate-500">
              Mostrando {filtered.length} de {toners.length} registros
            </p>
          </div>

          <div className="relative w-full lg:max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por marca, modelo o color"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>Marca</th>
                <th className={thClass}>Modelo de impresora</th>
                <th className={thClass}>Modelo</th>
                <th className={thClass}>Color</th>
                <th className={thClass}>Stock</th>
                <th className={thClass}>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    No hay resultados
                  </td>
                </tr>
              ) : (
                paginated.map((toner) => (
                  <TonerTableRow
                    key={toner.id}
                    toner={toner}
                    tdClass={tdClass}
                    canCreateMovement={canCreateMovement}
                    onMovement={openMovementModal}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>

      {/* MODAL */}
      {movementModalOpen && (
        <TonerMovementModal
          toner={selectedToner}
          onClose={() => setMovementModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

export default TonerTable;
