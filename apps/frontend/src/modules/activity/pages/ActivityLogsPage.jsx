import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '../../../shared/components/ui/Pagination';
import { Activity } from '../services/activity.api';

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

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const day = date.toLocaleDateString('es-PA');
  const time = date.toLocaleTimeString('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return `${day} ${time}`;
}

function getActionBadgeClass(action) {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-100 text-emerald-800';
    case 'UPDATE':
      return 'bg-amber-100 text-amber-800';
    case 'DELETE':
      return 'bg-rose-100 text-rose-800';
    case 'LOGIN':
      return 'bg-sky-100 text-sky-800';
    case 'LOGOUT':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-violet-100 text-violet-800';
  }
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

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const hasFiltersApplied = useMemo(
    () => Object.values(filters).some((value) => String(value).trim() !== ''),
    [filters]
  );

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await Activity.fetchLogs(buildQueryParams(filters, currentPage));

      setLogs(Array.isArray(response?.data) ? response.data : []);
      setTotal(Number(response?.total) || 0);
      setTotalPages(Math.max(Number(response?.totalPages) || 1, 1));
    } catch (requestError) {
      console.error('Error al cargar activity logs:', requestError);
      setError(requestError?.response?.data?.message || 'No se pudo cargar el historial de actividad.');
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
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial de actividad</h1>
        <p className="text-sm text-slate-600 mt-1">
          Consulta los cambios registrados por acción, entidad, usuario y rango de fechas.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <select
            value={filters.entityType}
            onChange={(event) => handleFilterChange('entityType', event.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {ENTITY_OPTIONS.map((option) => (
              <option key={option.value || 'all-entity'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(event) => handleFilterChange('action', event.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value || 'all-action'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="ID de usuario"
            value={filters.userId}
            onChange={(event) => handleFilterChange('userId', event.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />

          <input
            type="date"
            value={filters.from}
            onChange={(event) => handleFilterChange('from', event.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(event) => handleFilterChange('to', event.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-slate-500">Total de registros: {total}</p>
          <button
            onClick={clearFilters}
            disabled={!hasFiltersApplied}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Acción</th>
                <th className="px-4 py-3 text-left font-semibold">Entidad</th>
                <th className="px-4 py-3 text-left font-semibold">Registro</th>
                <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold">IP</th>
                <th className="px-4 py-3 text-left font-semibold">Cambios</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Cargando historial...
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No se encontraron registros de actividad.
                  </td>
                </tr>
              )}

              {!loading &&
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">{log.entityLabel || log.entityType || '-'}</td>
                    <td className="px-4 py-3">{log.entityId || '-'}</td>
                    <td className="px-4 py-3">{log.user?.name || '-'}</td>
                    <td className="px-4 py-3">{log.ipAddress || '-'}</td>
                    <td className="px-4 py-3">
                      {!Array.isArray(log.diff) || log.diff.length === 0 ? (
                        <span className="text-slate-400">Sin cambios detallados</span>
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-indigo-700 hover:text-indigo-900 font-medium">
                            Ver {log.diff.length} cambio(s)
                          </summary>
                          <ul className="mt-2 space-y-1 list-disc list-inside text-slate-700">
                            {log.diff.map((change, index) => (
                              <li key={`${log.id}-${change.field}-${index}`}>
                                <span className="font-semibold">{change.field}:</span> {change.from} {'→'} {change.to}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
