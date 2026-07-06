import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '../../../shared/components/ui/Pagination';
import { Activity } from '../services/activity.api';
import { formatDateTime } from '../../../shared/utils/formatDate';

// ─── Constants ───────────────────────────────────────────────────────────────

const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'BD_INCIDENTS', label: 'Incidencias' },
  { value: 'BD_INVENTORY', label: 'Inventario' },
  { value: 'TONER_MOVEMENTS', label: 'Movimientos de tóner' },
  { value: 'TONERS', label: 'Tóners' },
  { value: 'USERS', label: 'Usuarios' },
  { value: 'DEPARTMENTS', label: 'Departamentos' }
];

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Crear' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
  { value: 'ASSIGN', label: 'Asignar' },
  { value: 'STATUS_CHANGE', label: 'Cambio de estado' },
  { value: 'LOGIN', label: 'Inicio de sesión' },
  { value: 'LOGOUT', label: 'Cierre de sesión' }
];

const DEFAULT_FILTERS = {
  entityType: '',
  action: '',
  userId: '',
  from: '',
  to: ''
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value) {
  return formatDateTime(value, '-');
}

function getActionBadge(action) {
  const map = {
    CREATE: 'bg-emerald-100 text-emerald-800',
    UPDATE: 'bg-amber-100 text-amber-800',
    DELETE: 'bg-rose-100 text-rose-800',
    LOGIN: 'bg-sky-100 text-sky-800',
    LOGOUT: 'bg-slate-100 text-slate-700',
    ASSIGN: 'bg-violet-100 text-violet-800',
    STATUS_CHANGE: 'bg-indigo-100 text-indigo-800'
  };
  return map[action] ?? 'bg-slate-100 text-slate-700';
}

function buildQueryParams(filters, page) {
  return {
    page,
    limit: 25,
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.action && { action: filters.action }),
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to })
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
        {value ?? '—'}
      </p>
    </div>
  );
}

function ActionBadge({ action }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-semibold tracking-wide ${getActionBadge(action)}`}
    >
      {action}
    </span>
  );
}

function DiffRow({ change, index, logId }) {
  return (
    <li
      key={`${logId}-${change.field}-${index}`}
      className="border-l-2 border-slate-300 pl-3 py-1"
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
        {change.field}
      </p>
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-rose-600 line-through">{change.from}</span>
        <span className="text-slate-400">→</span>
        <span className="text-emerald-700">{change.to}</span>
      </div>
    </li>
  );
}

function DiffCell({ diff, logId }) {
  const [open, setOpen] = useState(false);

  if (!Array.isArray(diff) || diff.length === 0) {
    return <span className="text-slate-300 text-xs">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6.293 7.293a1 1 0 011.414 0L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
        </svg>
        <span>
          {diff.length} cambio{diff.length !== 1 ? 's' : ''}
        </span>
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {diff.map((change, index) => (
            <DiffRow
              key={`${logId}-${change.field}-${index}`}
              change={change}
              index={index}
              logId={logId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterBar({ filters, stats, hasFiltersApplied, onFilterChange, onClear }) {
  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <select
          value={filters.entityType}
          onChange={(e) => onFilterChange('entityType', e.target.value)}
          className={inputClass}
        >
          {ENTITY_OPTIONS.map((opt) => (
            <option key={opt.value || 'all-entity'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.action}
          onChange={(e) => onFilterChange('action', e.target.value)}
          className={inputClass}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value || 'all-action'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="ID de usuario"
          value={filters.userId}
          onChange={(e) => onFilterChange('userId', e.target.value)}
          className={inputClass}
        />

        <input
          type="date"
          value={filters.from}
          onChange={(e) => onFilterChange('from', e.target.value)}
          className={inputClass}
        />

        <input
          type="date"
          value={filters.to}
          onChange={(e) => onFilterChange('to', e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {stats.filtered !== stats.total
            ? `${stats.filtered} resultado${stats.filtered !== 1 ? 's' : ''} de ${stats.total} registros`
            : `${stats.total} registros en total`}
        </p>
        <button
          onClick={onClear}
          disabled={!hasFiltersApplied}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}

function LogTable({ logs, loading }) {
  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 align-top';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className={thClass}>Fecha y hora</th>
              <th className={thClass}>Acción</th>
              <th className={thClass}>Entidad</th>
              <th className={thClass}>ID registro</th>
              <th className={thClass}>Usuario</th>
              <th className={thClass}>IP</th>
              <th className={thClass}>Cambios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  Cargando historial de actividad...
                </td>
              </tr>
            )}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No se encontraron registros con los filtros aplicados.
                </td>
              </tr>
            )}

            {!loading &&
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 transition-colors duration-100"
                >
                  <td className={`${tdClass} font-mono text-xs text-slate-500 whitespace-nowrap`}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <ActionBadge action={log.action} />
                  </td>
                  <td className={`${tdClass} text-slate-600`}>
                    {log.entityLabel || log.entityType || '-'}
                  </td>
                  <td className={`${tdClass} font-mono text-xs text-slate-400`}>
                    {log.entityId ? `#${log.entityId}` : '-'}
                  </td>
                  <td className={`${tdClass} font-medium text-slate-800`}>
                    {log.user?.name || '-'}
                  </td>
                  <td className={`${tdClass} font-mono text-xs text-slate-400`}>
                    {log.ipAddress || '-'}
                  </td>
                  <td className={tdClass}>
                    <DiffCell diff={log.diff} logId={log.id} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [globalStats, setGlobalStats] = useState({ creates: 0, updates: 0, deletes: 0 });

  const hasFiltersApplied = useMemo(
    () => Object.values(filters).some((value) => String(value).trim() !== ''),
    [filters]
  );

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [response, statsResponse] = await Promise.all([
        Activity.fetchLogs(buildQueryParams(filters, currentPage)),
        // Fetch global stats only once (no filters) to populate the stat cards.
        // If your API doesn't support this, remove statsResponse and its usage below.
        Activity.fetchLogs({ page: 1, limit: 1 })
      ]);

      setLogs(Array.isArray(response?.data) ? response.data : []);
      setTotal(Number(response?.total) || 0);
      setTotalPages(Math.max(Number(response?.totalPages) || 1, 1));

      // Derive global action counts from summary if the API provides them,
      // otherwise fall back to counting within the current page (approximate).
      setGlobalStats({
        total: Number(statsResponse?.total) || Number(response?.total) || 0,
        creates: response?.summary?.CREATE ?? null,
        updates: response?.summary?.UPDATE ?? null,
        deletes: response?.summary?.DELETE ?? null
      });
    } catch (requestError) {
      console.error('Error al cargar activity logs:', requestError);
      setError(
        requestError?.response?.data?.message ||
          'No se pudo cargar el historial de actividad.'
      );
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Historial de actividad
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Consulta los cambios registrados por acción, entidad, usuario y rango de fechas.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total registros" value={globalStats.total || total} />
        <StatCard label="Creaciones" value={globalStats.creates} />
        <StatCard label="Actualizaciones" value={globalStats.updates} />
        <StatCard label="Eliminaciones" value={globalStats.deletes} />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        stats={{ filtered: total, total: globalStats.total || total }}
        hasFiltersApplied={hasFiltersApplied}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <LogTable logs={logs} loading={loading} />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}