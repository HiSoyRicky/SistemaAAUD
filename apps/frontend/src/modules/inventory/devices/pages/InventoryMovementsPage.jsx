import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inventory } from '../services/inventory.api';
import Pagination from '../../../../shared/components/ui/Pagination';

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Creación' },
  { value: 'UPDATE', label: 'Actualización' },
  { value: 'DELETE', label: 'Eliminación' }
];

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('es-PA');
}

function formatDurationFromMs(value) {
  if (value === null || value === undefined) return '-';

  const totalMs = Number(value);
  if (!Number.isFinite(totalMs) || totalMs <= 0) return '-';

  const days = Math.floor(totalMs / 86400000);

  return `${days} día${days === 1 ? '' : 's'}`;
}

function valueOrDash(value) {
  if (value === null || value === undefined) return '-';

  const trimmed = String(value).trim();
  return trimmed === '' ? '-' : trimmed;
}

function movementCell(previousValue, newValue) {
  const from = valueOrDash(previousValue);
  const to = valueOrDash(newValue);

  if (from === to) {
    return <span>{to}</span>;
  }

  return (
    <div className="flex flex-col text-center leading-tight">
      <span className="text-xs text-red-600 line-through">{from}</span>
      <span className="text-xs text-gray-400">→</span>
      <span className="text-xs text-emerald-700">{to}</span>
    </div>
  );
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function currentLocationCell(currentActive) {
  if (!currentActive) {
    return <span>-</span>;
  }

  const status = valueOrDash(currentActive.status);
  const isDiscarded = normalizeText(currentActive.status) === 'DESCARTADO';
  const ubication = valueOrDash(currentActive.ubication);
  const department = valueOrDash(currentActive.department);

  if (isDiscarded) {
    return (
      <div className="flex flex-col text-center leading-tight">
        <span className="font-medium text-red-600">Descartado</span>
        <span className="text-[11px] text-gray-400">Sin ubicación activa</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-center leading-tight">
      <span>{ubication}</span>
      <span className="text-[11px] text-gray-500">{department}</span>
      <span className="text-[11px] text-indigo-600">{status}</span>
    </div>
  );
}

function changedFieldsCell(changedFields = []) {
  if (!Array.isArray(changedFields) || changedFields.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="text-left">
      {changedFields.map((change, index) => {
        if (!change || typeof change !== 'object') {
          return null;
        }

        const from = valueOrDash(change.from);
        const to = valueOrDash(change.to);

        return (
          <div key={`${change.field}-${index}`} className="mb-1 leading-tight">
            <div className="text-[11px] font-semibold text-slate-700">{change.field}</div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-red-600 line-through">{from}</span>
              <span className="text-gray-400">→</span>
              <span className="text-emerald-700">{to}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InventoryMovementsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const summary = useMemo(() => {
    return `${total} movimiento${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}`;
  }, [total]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await Inventory.fetchMovementHistory({
        page: currentPage,
        limit: 10,
        search,
        action,
        from,
        to
      });

      setRows(Array.isArray(response?.data) ? response.data : []);
      setTotalPages(Math.max(Number(response?.totalPages) || 1, 1));
      setTotal(Number(response?.total) || 0);
    } catch (error) {
      console.error('Error cargando historial de equipos:', error);
      setRows([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentPage, search, action, from, to]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch((previous) => {
        const nextValue = searchInput.trim();
        return previous === nextValue ? previous : nextValue;
      });
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, action, from, to]);

  const thClass = 'px-3 py-2 text-xs font-semibold tracking-wide text-center uppercase border text-slate-600 bg-slate-50';
  const tdClass = 'px-3 py-2 text-xs text-center border text-slate-700 align-middle';

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de equipos</h1>
          <p className="text-sm text-slate-500">{summary}</p>
        </div>

        <button
          onClick={() => navigate('/inventario/equipos')}
          className="px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
        >
          Volver a Equipos
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 bg-white border rounded-lg shadow-sm md:grid-cols-4 xl:grid-cols-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por marbete, serie, usuario, ubicación, depto..."
          className="px-3 py-2 text-sm border rounded md:col-span-2 xl:col-span-3"
        />

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-3 py-2 text-sm border rounded"
        >
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value || 'all-actions'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 text-sm border rounded"
          title="Desde"
        />

        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 text-sm border rounded"
          title="Hasta"
        />

        <button
          onClick={() => {
            setSearchInput('');
            setSearch('');
            setAction('');
            setFrom('');
            setTo('');
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-sm border rounded text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className={thClass}>Fecha</th>
              <th className={thClass}>Tiempo</th>
              <th className={thClass}>Acción</th>
              <th className={thClass}>Marbete</th>
              <th className={thClass}>Serie</th>
              <th className={thClass}>Usuario</th>
              <th className={thClass}>Ubicación</th>
              <th className={thClass}>Departamento</th>
              <th className={thClass}>Estado</th>
              <th className={thClass}>Ubicación actual</th>
              <th className={thClass}>Cambios</th>
              <th className={thClass}>Responsable</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-8 text-sm text-center text-slate-400" colSpan={12}>
                  Cargando historial de movimientos...
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-sm text-center text-slate-400" colSpan={12}>
                  No se encontraron movimientos con esos filtros
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className={tdClass}>{formatDateTime(item.moved_at)}</td>
                  <td className={tdClass}>{formatDurationFromMs(item.time_in_previous_location_ms)}</td>
                  <td className={tdClass}>{valueOrDash(item.action)}</td>
                  <td className={`${tdClass} font-semibold`}>{valueOrDash(item.tag)}</td>
                  <td className={tdClass}>{valueOrDash(item.serie)}</td>
                  <td className={tdClass}>
                    {movementCell(item.previous_user, item.new_user)}
                  </td>
                  <td className={tdClass}>
                    {movementCell(item.previous_ubication, item.new_ubication)}
                  </td>
                  <td className={tdClass}>
                    {movementCell(item.previous_department, item.new_department)}
                  </td>
                  <td className={tdClass}>
                    {movementCell(item.previous_status, item.new_status)}
                  </td>
                  <td className={tdClass}>{currentLocationCell(item.current_active)}</td>
                  <td className={tdClass}>{changedFieldsCell(item.changed_fields)}</td>
                  <td className={tdClass}>{valueOrDash(item.moved_by?.name)}</td>
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
    </div>
  );
}
