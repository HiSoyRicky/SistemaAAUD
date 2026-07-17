import { Printer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import TransferPrint from '../../../../shared/components/Print/DeviceTransferPrint';
import Pagination from '../../../../shared/components/ui/Pagination';
import { formatDateToDDMMYYYY } from '../../../../shared/utils/formatDate';
import { Inventory } from '../services/inventory.api';

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Creación' },
  { value: 'UPDATE', label: 'Actualización' },
  { value: 'DELETE', label: 'Eliminación' },
];

function formatDateTime(value) {
  return formatDateToDDMMYYYY(value, '-');
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

  if (value && typeof value === 'object') {
    return (
      value.name ||
      value.label ||
      value.title ||
      value.nombre_completo ||
      value.username ||
      '-'
    );
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? '-' : trimmed;
}

function entityValue(value) {
  return valueOrDash(value);
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
            <div className="text-[11px] font-semibold text-slate-700">
              {change.field}
            </div>
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

function changedFieldValue(changedFields = [], fieldName) {
  if (!Array.isArray(changedFields)) return null;

  const normalizedTarget = normalizeText(fieldName);
  const change = changedFields.find(
    (item) => normalizeText(item?.field) === normalizedTarget
  );
  if (!change) return null;

  return change.to ?? change.from ?? null;
}

function firstNonDash(...values) {
  for (const value of values) {
    const normalized = valueOrDash(value);
    if (normalized !== '-') return normalized;
  }

  return '-';
}

function buildTransferPreviewDevice(item) {
  const snapshot =
    item?.transfer_snapshot && typeof item.transfer_snapshot === 'object'
      ? item.transfer_snapshot
      : null;

  if (snapshot) {
    const snapshotTransfiere = firstNonDash(
      snapshot.userTransfiere,
      snapshot.userName,
      item.moved_by?.name,
      item.previous_user
    );

    return {
      ...snapshot,
      role: snapshot.role || 'transfiere',
      userName: snapshot.userName || snapshotTransfiere,
      userTransfiere: snapshotTransfiere,
      userRecibe: firstNonDash(snapshot.userRecibe, item.new_user),
      ubication_name: firstNonDash(
        snapshot.ubication_name,
        item.previous_ubication
      ),
      department_name: firstNonDash(
        snapshot.department_name,
        item.previous_department
      ),
      ubication_destino_name: firstNonDash(
        snapshot.ubication_destino_name,
        item.new_ubication
      ),
      department_destino_name: firstNonDash(
        snapshot.department_destino_name,
        item.new_department
      ),
      device_name: firstNonDash(
        snapshot.device_name,
        item.device_name,
        item.new_device,
        item.previous_device,
        item.current_active?.device
      ),
      brand_name: firstNonDash(
        snapshot.brand_name,
        item.brand_name,
        item.new_brand,
        item.previous_brand,
        item.current_active?.brand
      ),
      model_name: firstNonDash(
        snapshot.model_name,
        item.model_name,
        item.new_model,
        item.previous_model,
        item.current_active?.model
      ),
      serie: firstNonDash(snapshot.serie, item.serie),
      tag: firstNonDash(snapshot.tag, item.tag),
      status_name: firstNonDash(
        snapshot.status_name,
        item.new_status,
        item.current_active?.status
      ),
      observation: firstNonDash(snapshot.observation, item.new_observation),
    };
  }

  const previousUser = valueOrDash(item.previous_user);
  const newUser = valueOrDash(item.new_user);

  return {
    role: 'transfiere',
    userName: previousUser,
    userRecibe: newUser,
    userTransfiere: previousUser,
    ubication_name: entityValue(item.previous_ubication),
    department_name: entityValue(item.previous_department),
    ubication_destino_name: entityValue(item.new_ubication),
    department_destino_name: entityValue(item.new_department),
    device_name: firstNonDash(
      changedFieldValue(item.changed_fields, 'Equipo'),
      changedFieldValue(item.changed_fields, 'Dispositivo'),
      item.device_name,
      item.new_device,
      item.previous_device,
      item.current_active?.device
    ),
    brand_name: firstNonDash(
      changedFieldValue(item.changed_fields, 'Marca'),
      item.brand_name,
      item.new_brand,
      item.previous_brand,
      item.current_active?.brand
    ),
    model_name: firstNonDash(
      changedFieldValue(item.changed_fields, 'Modelo'),
      item.model_name,
      item.new_model,
      item.previous_model,
      item.current_active?.model
    ),
    serie:
      changedFieldValue(item.changed_fields, 'Serie') ||
      valueOrDash(item.serie),
    tag:
      changedFieldValue(item.changed_fields, 'Marbete') ||
      valueOrDash(item.tag),
    status_name:
      changedFieldValue(item.changed_fields, 'Estado') ||
      entityValue(item.new_status),
    observation:
      changedFieldValue(item.changed_fields, 'Observación') ||
      valueOrDash(item.new_observation),
  };
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
  const [previewRow, setPreviewRow] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Traslado de equipo',
    onAfterPrint: () => {
      setPreviewRow(null);
      setPendingPrint(false);
    },
  });

  const summary = useMemo(() => {
    return `${total} movimiento${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}`;
  }, [total]);

  const previewDevice = useMemo(() => {
    if (!previewRow) return null;
    return buildTransferPreviewDevice(previewRow);
  }, [previewRow]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await Inventory.fetchMovementHistory({
        page: currentPage,
        limit: 10,
        search,
        action,
        from,
        to,
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

  useEffect(() => {
    if (!pendingPrint || !previewRow || !previewDevice) return;

    setPendingPrint(false);
    handlePrint();
  }, [handlePrint, pendingPrint, previewDevice, previewRow]);

  const printRow = (row) => {
    setPreviewRow(row);
    setPendingPrint(true);
  };

  const thClass =
    'px-3 py-2 text-xs font-semibold tracking-wide text-center uppercase border text-slate-600 bg-slate-50';
  const tdClass =
    'px-3 py-2 text-xs text-center border text-slate-700 align-middle';

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Historial de equipos
          </h1>
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
              <th className={thClass}>Imprimir</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  className="px-4 py-8 text-sm text-center text-slate-400"
                  colSpan={13}
                >
                  Cargando historial de movimientos...
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-sm text-center text-slate-400"
                  colSpan={13}
                >
                  No se encontraron movimientos con esos filtros
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className={tdClass}>{formatDateTime(item.moved_at)}</td>
                  <td className={tdClass}>
                    {formatDurationFromMs(item.time_in_previous_location_ms)}
                  </td>
                  <td className={tdClass}>{valueOrDash(item.action)}</td>
                  <td className={`${tdClass} font-semibold`}>
                    {valueOrDash(item.tag)}
                  </td>
                  <td className={tdClass}>{valueOrDash(item.serie)}</td>
                  <td className={tdClass}>
                    {movementCell(item.previous_user, item.new_user)}
                  </td>
                  <td className={tdClass}>
                    {movementCell(item.previous_ubication, item.new_ubication)}
                  </td>
                  <td className={tdClass}>
                    {movementCell(
                      item.previous_department,
                      item.new_department
                    )}
                  </td>
                  <td className={tdClass}>
                    {movementCell(item.previous_status, item.new_status)}
                  </td>
                  <td className={tdClass}>
                    {currentLocationCell(item.current_active)}
                  </td>
                  <td className={tdClass}>
                    {changedFieldsCell(item.changed_fields)}
                  </td>
                  <td className={tdClass}>
                    {valueOrDash(item.moved_by?.name)}
                  </td>
                  <td className={tdClass}>
                    {String(item.action || '').toUpperCase() === 'DELETE' ? (
                      <span className="text-xs text-slate-400">Sin hoja</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => printRow(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                      >
                        <Printer size={14} />
                        Imprimir
                      </button>
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

      {previewRow && previewDevice && (
        <div className="fixed left-[-10000px] top-0" aria-hidden="true">
          <TransferPrint
            ref={printRef}
            device={previewDevice}
            fecha={
              previewRow?.moved_at
                ? formatDateToDDMMYYYY(previewRow.moved_at, '-')
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
