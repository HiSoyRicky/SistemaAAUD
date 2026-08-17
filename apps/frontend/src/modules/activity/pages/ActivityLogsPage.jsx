// ActivityLogsPage.jsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '../../../shared/components/ui/Pagination';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { Activity } from '../services/activity.api';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'BD_INCIDENTS', label: 'Incidencias' },
  { value: 'BD_INVENTORY', label: 'Inventario' },
  { value: 'TONER_MOVEMENTS', label: 'Movimientos de tóner' },
  { value: 'TONERS', label: 'Tóners' },
  { value: 'TONER_STOCK', label: 'Stock de tóner' },
  { value: 'USERS', label: 'Usuarios' },
  { value: 'DEPARTMENTS', label: 'Departamentos' },
  { value: 'MODELS', label: 'Modelos' },
  { value: 'BRANDS', label: 'Marcas' },
  { value: 'CATEGORIES', label: 'Categorías' },
  { value: 'DEVICES', label: 'Tipos de equipo' },
  { value: 'STATUS', label: 'Estados' },
  { value: 'UBICATIONS', label: 'Ubicaciones' },
  { value: 'ROLES', label: 'Roles' },
  { value: 'PERMISSIONS', label: 'Permisos' },
  { value: 'ROLE_PERMISSIONS', label: 'Permisos de rol' },
  { value: 'USER_PERMISSIONS', label: 'Permisos de usuario' },
  { value: 'INVENTORY_TRANSFER_REQUESTS', label: 'Solicitudes de traslado' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Creaciones' },
  { value: 'UPDATE', label: 'Actualizaciones' },
  { value: 'DELETE', label: 'Eliminaciones' },
  { value: 'ASSIGN', label: 'Asignaciones' },
  { value: 'STATUS_CHANGE', label: 'Cambios de estado' },
  { value: 'LOGIN', label: 'Inicios de sesión' },
  { value: 'LOGOUT', label: 'Cierres de sesión' },
];

const ACTION_CONFIG = {
  CREATE: {
    label: 'Crear',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: '+',
  },
  UPDATE: {
    label: 'Actualizar',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: '↻',
  },
  DELETE: {
    label: 'Eliminar',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: '×',
  },
  ASSIGN: {
    label: 'Asignar',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: '→',
  },
  STATUS_CHANGE: {
    label: 'Estado',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: '●',
  },
  LOGIN: {
    label: 'Inicio sesión',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: '↪',
  },
  LOGOUT: {
    label: 'Cierre sesión',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: '↩',
  },
};

const ENTITY_LABELS = {
  BD_INCIDENTS: 'Incidencias',
  BD_INVENTORY: 'Inventario',
  TONER_MOVEMENTS: 'Movimientos de tóner',
  TONERS: 'Tóners',
  TONER_STOCK: 'Stock de tóner',
  USERS: 'Usuarios',
  DEPARTMENTS: 'Departamentos',
  MODELS: 'Modelos',
  BRANDS: 'Marcas',
  CATEGORIES: 'Categorías',
  DEVICES: 'Tipos de equipo',
  STATUS: 'Estados',
  UBICATIONS: 'Ubicaciones',
  ROLES: 'Roles',
  PERMISSIONS: 'Permisos',
  ROLE_PERMISSIONS: 'Permisos de rol',
  USER_PERMISSIONS: 'Permisos de usuario',
  INVENTORY_TRANSFER_REQUESTS: 'Solicitudes de traslado',
  bd_incidents: 'Incidencias',
  bd_inventory: 'Inventario',
  toner_movements: 'Movimientos de tóner',
  toners: 'Tóners',
  toner_stock: 'Stock de tóner',
  users: 'Usuarios',
  departments: 'Departamentos',
  models: 'Modelos',
  brands: 'Marcas',
  categories: 'Categorías',
  devices: 'Tipos de equipo',
  status: 'Estados',
  ubications: 'Ubicaciones',
  roles: 'Roles',
  permissions: 'Permisos',
  role_permissions: 'Permisos de rol',
  user_permissions: 'Permisos de usuario',
  inventory_transfer_requests: 'Solicitudes de traslado',
};

const DEFAULT_FILTERS = {
  entityType: '',
  action: '',
  userName: '',
  from: '',
  to: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return '-';

  return formatDateTime(value, '-');
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[objeto]';
    }
  }

  return String(value);
}

function getEntityLabel(entityType, entityLabel) {
  if (entityLabel) return entityLabel;

  return ENTITY_LABELS[entityType] || entityType || '—';
}

function getActionConfig(action) {
  return (
    ACTION_CONFIG[action] || {
      label: action || 'Desconocida',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: '•',
    }
  );
}

function normalizeLogs(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function getTotal(response) {
  return Number(response?.total) || 0;
}

function getTotalPages(response) {
  return Math.max(Number(response?.totalPages) || 1, 1);
}

function buildQueryParams(filters, page) {
  const params = {
    page,
    limit: PAGE_SIZE,
  };

  if (filters.entityType) params.entityType = filters.entityType;
  if (filters.action) params.action = filters.action;
  if (filters.userName) params.userName = filters.userName.trim();
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  return params;
}

function formatNumber(value) {
  if (value === null || value === undefined) return '—';

  return new Intl.NumberFormat('es-PA').format(Number(value) || 0);
}

function getDiff(log) {
  if (Array.isArray(log?.diff)) {
    return log.diff;
  }

  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.9-4M4 5v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.9 4M20 19v-5h-5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, description, type }) {
  const config = {
    total: {
      icon: 'Σ',
      iconClass: 'bg-slate-100 text-slate-700',
    },
    create: {
      icon: '+',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    update: {
      icon: '↻',
      iconClass: 'bg-amber-100 text-amber-700',
    },
    delete: {
      icon: '×',
      iconClass: 'bg-rose-100 text-rose-700',
    },
  };

  const current = config[type] || config.total;

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${current.iconClass}`}
        >
          {current.icon}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Badge
// ─────────────────────────────────────────────────────────────────────────────

function ActionBadge({ action }) {
  const config = getActionConfig(action);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff
// ─────────────────────────────────────────────────────────────────────────────

function DiffCell({ diff, logId }) {
  const [open, setOpen] = useState(false);

  const changes = getDiff({ diff });

  if (changes.length === 0) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  return (
    <div className="min-w-[150px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`activity-diff-${logId}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronIcon open={open} />

        <span>
          {changes.length} {changes.length === 1 ? 'cambio' : 'cambios'}
        </span>
      </button>

      {open && (
        <div
          id={`activity-diff-${logId}`}
          className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          {changes.map((change, index) => (
            <div
              key={`${logId}-${change.field || 'field'}-${index}`}
              className="border-b border-slate-200 pb-2 last:border-0 last:pb-0"
            >
              <div className="mb-2 text-[10px] font-semibold text-slate-400">{index + 1}</div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                <span className="min-w-0 whitespace-pre-wrap break-words rounded-md bg-rose-50 px-2 py-1 text-rose-700 line-through">
                  {formatValue(change.from)}
                </span>

                <span className="text-slate-400">→</span>

                <span className="min-w-0 whitespace-pre-wrap break-words rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                  {formatValue(change.to)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({ filters, total, hasFilters, onChange, onClear, onQuickDate }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <FilterIcon />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">Filtros de auditoría</h2>

              <p className="text-xs text-slate-400">Filtra los registros que deseas consultar</p>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-400">
            {formatNumber(total)} registros
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label
              htmlFor="activity-entity"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Entidad
            </label>

            <select
              id="activity-entity"
              value={filters.entityType}
              onChange={(event) => onChange('entityType', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {ENTITY_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-action"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Acción
            </label>

            <select
              id="activity-action"
              value={filters.action}
              onChange={(event) => onChange('action', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-user"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Usuario
            </label>

            <input
              id="activity-user"
              type="search"
              placeholder="Nombre del usuario"
              value={filters.userName}
              onChange={(event) => onChange('userName', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="activity-from"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Desde
            </label>

            <input
              id="activity-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => onChange('from', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="activity-to"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Hasta
            </label>

            <input
              id="activity-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => onChange('to', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <span className="mr-1 self-center text-xs font-medium text-slate-400">Periodo:</span>

            <button
              type="button"
              onClick={() => onQuickDate('today')}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => onQuickDate('7days')}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Últimos 7 días
            </button>

            <button
              type="button"
              onClick={() => onQuickDate('30days')}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Últimos 30 días
            </button>

            <button
              type="button"
              onClick={() => onQuickDate('month')}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Este mes
            </button>
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasFilters}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpiar filtros
          </button>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Activos:
            </span>

            {filters.entityType && (
              <FilterTag
                label={getEntityLabel(filters.entityType)}
                onRemove={() => onChange('entityType', '')}
              />
            )}

            {filters.action && (
              <FilterTag
                label={getActionConfig(filters.action).label}
                onRemove={() => onChange('action', '')}
              />
            )}

            {filters.userName && (
              <FilterTag
                label={`Usuario: ${filters.userName}`}
                onRemove={() => onChange('userName', '')}
              />
            )}

            {filters.from && (
              <FilterTag label={`Desde ${filters.from}`} onRemove={() => onChange('from', '')} />
            )}

            {filters.to && (
              <FilterTag label={`Hasta ${filters.to}`} onRemove={() => onChange('to', '')} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
      {label}

      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100"
        aria-label={`Quitar filtro ${label}`}
      >
        ×
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-b border-slate-100">
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-4 py-4">
              <div className="h-4 animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
          ◌
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-700">No hay registros</h3>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
          No encontramos actividades que coincidan con los filtros seleccionados.
        </p>
      </td>
    </tr>
  );
}

function renderTableContent(logs, Loading) {
  if (Loading) {
    return <TableSkeleton />;
  }

  if (logs.length === 0) {
    return <EmptyState />;
  }

  return logs.map((log) => <LogRow key={log.id} log={log} />);
}

function LogTable({ logs, loading }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-sm">
          <caption className="sr-only">Historial de actividad del sistema</caption>

          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <TableHeader>Fecha y hora</TableHeader>
              <TableHeader>Acción</TableHeader>
              <TableHeader>Entidad</TableHeader>
              <TableHeader>Registro</TableHeader>
              <TableHeader>Usuario</TableHeader>
              <TableHeader>IP</TableHeader>
              <TableHeader>Cambios</TableHeader>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">{renderTableContent(logs, loading)}</tbody>
        </table>
      </div>
    </section>
  );
}

function TableHeader({ children }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
    >
      {children}
    </th>
  );
}

function LogRow({ log }) {
  return (
    <tr className="group transition-colors hover:bg-slate-50/70">
      <td className="whitespace-nowrap px-4 py-4 align-top">
        <div className="font-mono text-xs font-medium text-slate-700">
          {formatDate(log.createdAt)}
        </div>
      </td>

      <td className="whitespace-nowrap px-4 py-4 align-top">
        <ActionBadge action={log.action} />
      </td>

      <td className="px-4 py-4 align-top">
        <span className="font-medium text-slate-700">
          {getEntityLabel(log.entityType, log.entityLabel)}
        </span>
      </td>

      <td className="px-4 py-4 align-top">
        {log.recordLabel || log.entityId ? (
          <div className="max-w-[260px] space-y-1">
            {log.recordLabel && (
              <p className="line-clamp-3 whitespace-pre-line text-xs font-medium leading-5 text-slate-700">
                {log.recordLabel}
              </p>
            )}

            {log.entityId && (
              <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-medium text-slate-500">
                #{log.entityId}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      <td className="px-4 py-4 align-top">
        {log.user ? (
          <div>
            <p className="text-xs font-semibold text-slate-700">
              {log.user.name || log.user.nombre_completo || 'Usuario'}
            </p>

            {log.user.id && <p className="mt-0.5 text-[10px] text-slate-400">ID #{log.user.id}</p>}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Sistema</span>
        )}
      </td>

      <td className="px-4 py-4 align-top">
        <span className="font-mono text-xs text-slate-500">{log.ipAddress || '—'}</span>
      </td>

      <td className="px-4 py-4 align-top">
        <DiffCell diff={log.diff} logId={log.id} />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    creates: null,
    updates: null,
    deletes: null,
  });

  const hasFilters = useMemo(
    () => Object.values(filters).some((value) => String(value).trim() !== ''),
    [filters]
  );

  const loadLogs = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const response = await Activity.fetchLogs(buildQueryParams(filters, currentPage));

        const responseTotal = getTotal(response);

        setLogs(normalizeLogs(response));
        setTotal(responseTotal);
        setTotalPages(getTotalPages(response));

        /*
         * IMPORTANTE:
         * El backend debe devolver:
         *
         * summary: {
         *   CREATE: 123,
         *   UPDATE: 456,
         *   DELETE: 20
         * }
         */
        setStats({
          total: responseTotal,
          creates: response?.summary?.CREATE ?? null,
          updates: response?.summary?.UPDATE ?? null,
          deletes: response?.summary?.DELETE ?? null,
        });
      } catch (requestError) {
        console.error('Error al cargar historial:', requestError);

        setError(
          requestError?.response?.data?.message || 'No se pudo cargar el historial de actividad.'
        );

        setLogs([]);
        setTotal(0);
        setTotalPages(1);
        setStats({
          total: 0,
          creates: 0,
          updates: 0,
          deletes: 0,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, currentPage]
  );

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));

    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const handleQuickDate = useCallback((range) => {
    const now = new Date();

    const formatInputDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const today = new Date(now);
    let from = new Date(now);

    if (range === '7days') {
      from.setDate(from.getDate() - 6);
    }

    if (range === '30days') {
      from.setDate(from.getDate() - 29);
    }

    if (range === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setFilters((previous) => ({
      ...previous,
      from: formatInputDate(from),
      to: formatInputDate(today),
    }));

    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Auditoría
            </span>

            <span className="text-xs text-slate-400">Registro de operaciones</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Historial de actividad
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Consulta y revisa las operaciones realizadas en el sistema, incluyendo cambios,
            usuarios, fechas y registros afectados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLogs({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />

          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          type="total"
          label="Total de registros"
          value={stats.total}
          description="Registros encontrados"
        />

        <StatCard
          type="create"
          label="Creaciones"
          value={stats.creates}
          description="Operaciones CREATE"
        />

        <StatCard
          type="update"
          label="Actualizaciones"
          value={stats.updates}
          description="Operaciones UPDATE"
        />

        <StatCard
          type="delete"
          label="Eliminaciones"
          value={stats.deletes}
          description="Operaciones DELETE"
        />
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span className="font-bold">!</span>

          <div>
            <p className="font-semibold">No se pudo cargar el historial</p>

            <p className="mt-0.5 text-xs text-rose-600">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        total={total}
        hasFilters={hasFilters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        onQuickDate={handleQuickDate}
      />

      {/* Result header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Actividad registrada</p>

          <p className="text-xs text-slate-400">{formatNumber(total)} registros encontrados</p>
        </div>

        <p className="text-xs text-slate-400">
          Página {currentPage} de {totalPages}
        </p>
      </div>

      {/* Table */}
      <LogTable logs={logs} loading={loading} />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center pt-1">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
