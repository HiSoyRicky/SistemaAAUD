// WareHousePage.jsx

import {
  ArrowLeft,
  ClipboardList,
  Download,
  Eye,
  History,
  Plus,
  RefreshCw,
  Trash2,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import Pagination from '../../../shared/components/ui/Pagination';
import Modal from '../../../shared/components/ui/Modal';
import useAuth from '../../../shared/hooks/useAuth';
import {
  exportWarehouseMovementsToExcel,
  exportWarehouseStockToExcel,
} from '../../../shared/utils/exportExcel';
import { formatDateTime } from '../../../shared/utils/formatDate';
import WarehouseMovementModal from '../components/WarehouseMovementModal';
import Warehouse from '../services/warehouse.api';

const emptyMovement = {
  item_id: '',
  ubication_id: '',
  quantity: 1,
  movement_type: 'OUT',
  department_id: '',
  receiver_name: '',
  reference: '',
  observation: '',
};

function WarehousePage({ historyOnly = false }) {
  const navigate = useNavigate();
  const { hasPermission, loggedUserName } = useAuth();
  const [movementSearch, setMovementSearch] = useState('');
  const [movementItems, setMovementItems] = useState([]);
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [ubications, setUbications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [loading, setLoading] = useState(true);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [stockMeta, setStockMeta] = useState({ total: 0, totalPages: 1 });
  const [historyMeta, setHistoryMeta] = useState({ total: 0, totalPages: 1 });
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyUbication, setHistoryUbication] = useState('');
  const [historyDepartment, setHistoryDepartment] = useState('');
  const [dispatchLines, setDispatchLines] = useState([]);
  const loadRequest = useRef(0);

  const canCreateMovement = hasPermission('warehouse_movements.create');

  const load = async () => {
    const requestId = ++loadRequest.current;
    setLoading(true);
    try {
      const requests = [];
      if (!historyOnly && hasPermission('warehouse_stock.read')) {
        requests.unshift(Warehouse.fetchStock({ search: stockSearch, page: stockPage, limit: 25 }));
      }
      if (historyOnly && hasPermission('warehouse_movements.read')) {
        requests.splice(
          0,
          0,
          Warehouse.fetchMovements({
            search: historySearch,
            movement_type: movementTypeFilter,
            ubication_id: historyUbication || undefined,
            department_id: historyDepartment || undefined,
            from: historyFrom,
            to: historyTo,
            page: historyPage,
            limit: 25,
          })
        );
      }
      const responses = await Promise.all(requests);
      if (requestId !== loadRequest.current) return;
      const hasStockResponse = !historyOnly && hasPermission('warehouse_stock.read');
      const stockData = hasStockResponse ? responses[0] : null;
      const offset = hasStockResponse ? 1 : 0;
      const hasMovementResponse = historyOnly && hasPermission('warehouse_movements.read');
      const movementData = hasMovementResponse ? responses[offset] : null;
      setStock(stockData?.data || []);
      setStockMeta({ total: stockData?.total || 0, totalPages: stockData?.totalPages || 1 });
      setMovements(movementData?.data || []);
      setHistoryMeta({
        total: movementData?.total || 0,
        totalPages: movementData?.totalPages || 1,
      });
      if (movementData && historyPage > movementData.totalPages) {
        setHistoryPage(movementData.totalPages || 1);
      }
    } catch (error) {
      if (requestId !== loadRequest.current) return;
      toast.error(error.response?.data?.message || 'No se pudo cargar Almacén');
    } finally {
      if (requestId === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([Warehouse.fetchUbications(), Warehouse.fetchDepartments()])
      .then(([locations, departmentsData]) => {
        if (cancelled) return;
        setUbications(Array.isArray(locations) ? locations : []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      })
      .catch(() => { if (!cancelled) toast.error('No se pudieron cargar las ubicaciones y departamentos'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => { clearTimeout(timer); loadRequest.current += 1; };
  }, [
    stockSearch,
    historySearch,
    stockPage,
    historyPage,
    movementTypeFilter,
    historyFrom,
    historyTo,
    historyUbication,
    historyDepartment,
    historyOnly,
  ]);

  useEffect(() => {
    setStockPage(1);
  }, [stockSearch]);
  useEffect(() => {
    setHistoryPage(1);
  }, [
    historySearch,
    movementTypeFilter,
    historyFrom,
    historyTo,
    historyUbication,
    historyDepartment,
  ]);

  useEffect(() => {
    setHistoryDepartment('');
  }, [historyUbication]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!hasPermission('warehouse_items.read')) return;
      try {
        const result = await Warehouse.fetchItems({ search: movementSearch, limit: 25 });
        if (cancelled) return;
        setMovementItems(result?.data || []);
      } catch (error) {
        if (cancelled) return;
        toast.error(error.response?.data?.message || 'No se pudo buscar el catálogo');
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [movementSearch, hasPermission]);

  const selectedMovementItem = movementItems.find(
    (item) => Number(item.id) === Number(movementForm.item_id)
  );
  const availableDepartments = departments.filter(
    (department) => Number(department.id_ubication) === Number(movementForm.ubication_id)
  );

  const itemDetails = (item) =>
    item ? (
      <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <strong className="text-slate-900">{item.name}</strong>
        <span className="ml-3">Código: {item.code || '-'}</span>
        <span className="ml-3">Unidad: {item.unit}</span>
        <span className="ml-3">Categoría: {item.category || '-'}</span>
      </div>
    ) : null;

  const submitMovement = async (event) => {
    event.preventDefault();
    try {
      if (movementForm.movement_type === 'OUT') {
        const items = [
          ...dispatchLines,
          { item_id: Number(movementForm.item_id), quantity: Number(movementForm.quantity) },
        ];
        await Warehouse.createBatchOut({
          idempotency_key: uuidv4(),
          ubication_id: Number(movementForm.ubication_id),
          department_id: Number(movementForm.department_id),
          receiver_name: movementForm.receiver_name,
          reference: movementForm.reference || null,
          observation: movementForm.observation || null,
          items,
        });
      } else {
        await Warehouse.createMovement({
          idempotency_key: uuidv4(),
          ...movementForm,
          item_id: Number(movementForm.item_id),
          quantity: Number(movementForm.quantity),
        });
      }
      setMovementForm(emptyMovement);
      setDispatchLines([]);
      toast.success('Movimiento registrado');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar el movimiento');
    }
  };

  const addDispatchLine = () => {
    if (!selectedMovementItem || Number(movementForm.quantity) < 1) return;
    if (dispatchLines.some((line) => line.item_id === selectedMovementItem.id)) {
      toast.info('Ese insumo ya está en la salida');
      return;
    }
    setDispatchLines((lines) => [
      ...lines,
      {
        item_id: selectedMovementItem.id,
        quantity: Number(movementForm.quantity),
        item: selectedMovementItem,
      },
    ]);
    setMovementForm((current) => ({ ...current, item_id: '', quantity: 1 }));
    setMovementSearch('');
  };

  const fetchAllPages = async (fetchPage, filters) => {
    const firstPage = await fetchPage({ ...filters, page: 1, limit: 200 });
    const rows = [...(firstPage?.data || [])];
    for (let page = 2; page <= (firstPage?.totalPages || 1); page += 1) {
      const result = await fetchPage({ ...filters, page, limit: 200 });
      rows.push(...(result?.data || []));
    }
    return rows;
  };

  const exportStock = async () => {
    try {
      await exportWarehouseStockToExcel(
        await fetchAllPages(Warehouse.fetchStock, { search: stockSearch })
      );
    } catch (error) {
      toast.error('No se pudieron exportar las existencias');
    }
  };

  const exportMovements = async () => {
    try {
      const groups = await fetchAllPages(Warehouse.fetchMovements, {
        search: historySearch,
        movement_type: movementTypeFilter,
        ubication_id: historyUbication || undefined,
        department_id: historyDepartment || undefined,
        from: historyFrom,
        to: historyTo,
      });
      await exportWarehouseMovementsToExcel(
        groups.flatMap((movement) => movement.group_items || [movement])
      );
    } catch (error) {
      toast.error('No se pudieron exportar los movimientos');
    }
  };

  const field = (label, value, onChange, type = 'text', required = false) => (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <WarehouseIcon size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Almacén</h1>
            <p className="text-sm text-slate-500">Insumos físicos, existencias y movimientos.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!historyOnly && canCreateMovement && (
            <button
              type="button"
              onClick={() => setMovementModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <ClipboardList size={16} />
              Registrar movimiento
            </button>
          )}
          {!historyOnly && hasPermission('warehouse_movements.read') && (
            <button
              type="button"
              onClick={() => navigate('/almacen/historial')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <History size={16} />
              Historial
            </button>
          )}
          {historyOnly && (
            <button
              type="button"
              onClick={() => navigate('/almacen')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Existencias
            </button>
          )}
          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </header>

      {!historyOnly && canCreateMovement && showMovementForm && false && (
        <form
          onSubmit={submitMovement}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <ClipboardList size={20} /> Registrar movimiento
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Insumo
              <input
                value={movementSearch}
                onChange={(event) => setMovementSearch(event.target.value)}
                placeholder="Buscar por nombre o código"
                className="h-10 rounded-md border border-slate-300 px-3"
              />
              <select
                required
                value={movementForm.item_id}
                onChange={(event) =>
                  setMovementForm({ ...movementForm, item_id: event.target.value })
                }
                className="h-10 rounded-md border border-slate-300 px-3"
              >
                <option value="">Seleccione un resultado</option>
                {movementItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code ? `${item.code} - ` : ''}
                    {item.name}
                  </option>
                ))}
              </select>
              {itemDetails(selectedMovementItem)}
              {movementForm.movement_type === 'OUT' && (
                <button
                  type="button"
                  onClick={addDispatchLine}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
                >
                  <Plus size={15} /> Agregar a la salida
                </button>
              )}
              {movementForm.movement_type === 'OUT' && dispatchLines.length > 0 && (
                <div className="mt-2 space-y-1 rounded-md border border-slate-200 p-2">
                  {dispatchLines.map((line) => (
                    <div
                      key={line.item_id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span>
                        {line.item?.name || line.item_id} x {line.quantity}
                      </span>
                      <button
                        type="button"
                        title="Quitar artículo"
                        onClick={() =>
                          setDispatchLines((lines) =>
                            lines.filter((current) => current.item_id !== line.item_id)
                          )
                        }
                        className="text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Movimiento
              <select
                value={movementForm.movement_type}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    movement_type: event.target.value,
                    ...(['IN', 'ADJUSTMENT'].includes(event.target.value) && {
                      ubication_id: '',
                      department_id: '',
                    }),
                  })
                }
                className="h-10 rounded-md border border-slate-300 px-3"
              >
                <option value="OUT">Salida</option>
                <option value="IN">Entrada</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </label>

            {movementForm.movement_type === 'OUT' && (
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Ubicación
                <select
                  required
                  value={movementForm.ubication_id}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      ubication_id: event.target.value,
                      department_id: '',
                    })
                  }
                  className="h-10 rounded-md border border-slate-300 px-3"
                >
                  <option value="">Seleccione</option>
                  {ubications.map((ubication) => (
                    <option key={ubication.id} value={ubication.id}>
                      {ubication.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {movementForm.movement_type === 'OUT' && (
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Departamento solicitante
                <select
                  required
                  disabled={!movementForm.ubication_id}
                  value={movementForm.department_id}
                  onChange={(event) =>
                    setMovementForm({ ...movementForm, department_id: event.target.value })
                  }
                  className="h-10 rounded-md border border-slate-300 px-3"
                >
                  <option value="">
                    {movementForm.ubication_id
                      ? 'Seleccione un departamento'
                      : 'Seleccione ubicación primero'}
                  </option>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {field(
              'Cantidad',
              movementForm.quantity,
              (value) => setMovementForm({ ...movementForm, quantity: value }),
              'number'
            )}

            {movementForm.movement_type === 'OUT' && (
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Receptor
                <input
                  value={movementForm.receiver_name}
                  onChange={(event) =>
                    setMovementForm({ ...movementForm, receiver_name: event.target.value })
                  }
                  required
                  placeholder="Nombre de quien retira"
                  className="h-10 rounded-md border border-slate-300 px-3 text-slate-700"
                />
              </label>
            )}
            {movementForm.movement_type === 'IN' && (
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Receptor de entrada
                <input
                  value={loggedUserName || 'Usuario de la sesión'}
                  readOnly
                  className="h-10 rounded-md border border-slate-300 bg-slate-100 px-3 text-slate-700"
                />
              </label>
            )}
            {movementForm.movement_type === 'ADJUSTMENT' && (
              <>
                {field(
                  'Motivo del ajuste',
                  movementForm.reference,
                  (value) => setMovementForm({ ...movementForm, reference: value }),
                  'text',
                  true
                )}
                {field('Observación (opcional)', movementForm.observation, (value) =>
                  setMovementForm({ ...movementForm, observation: value })
                )}
              </>
            )}
          </div>

          <button className="mt-4 h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            Registrar movimiento
          </button>
        </form>
      )}

      {!historyOnly && canCreateMovement && (
        <WarehouseMovementModal
          open={movementModalOpen}
          ubications={ubications}
          departments={departments}
          loggedUserName={loggedUserName}
          onClose={() => setMovementModalOpen(false)}
          onSaved={load}
        />
      )}

      {!historyOnly && (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">Existencias actuales</h2>
            <div className="flex flex-wrap items-end gap-2">
              <input
                value={stockSearch}
                onChange={(event) => setStockSearch(event.target.value)}
                placeholder="Buscar insumo por nombre o código"
                className="h-9 w-full sm:w-auto sm:min-w-[260px] rounded-md border border-slate-300 px-3 text-sm"
              />
              <button
                type="button"
                onClick={exportStock}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-semibold"
              >
                <Download size={15} />
                Exportar
              </button>
            </div>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Cargando existencias...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Insumo</th>
                    <th className="px-5 py-3">Unidad</th>
                    <th className="px-5 py-3">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-semibold">
                        <div>{entry.item?.name || '-'}</div>
                        <div className="mt-1 text-xs font-normal text-slate-400">
                          Código: {entry.item?.code || 'Sin código'}
                        </div>
                      </td>
                      <td className="px-5 py-3">{entry.item?.unit || '-'}</td>
                      <td className="px-5 py-3">{entry.quantity}</td>
                    </tr>
                  ))}
                  {!stock.length && (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-500">
                        No hay existencias registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            currentPage={stockPage}
            totalPages={stockMeta.totalPages}
            onPageChange={setStockPage}
          />
        </section>
      )}

      {historyOnly && (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">Últimos movimientos</h2>
            <div className="flex flex-wrap items-end gap-2">
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Buscar por nombre, código o persona"
                className="h-9 w-full sm:w-56 sm:min-w-[260px] rounded-md border border-slate-300 px-3 text-sm"
              />
              <select
                value={movementTypeFilter}
                onChange={(event) => setMovementTypeFilter(event.target.value)}
                className="h-9 rounded-md border border-slate-300 px-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="IN">Entradas</option>
                <option value="OUT">Salidas</option>
                <option value="ADJUSTMENT">Ajustes</option>
              </select>
              <select
                value={historyUbication}
                onChange={(event) => setHistoryUbication(event.target.value)}
                className="h-9 rounded-md border border-slate-300 px-2 text-sm"
              >
                <option value="">Todas las ubicaciones</option>
                {[...ubications]
                  .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                  .map((ubication) => (
                    <option key={ubication.id} value={ubication.id}>
                      {ubication.name}
                    </option>
                  ))}
              </select>
              <select
                value={historyDepartment}
                onChange={(event) => setHistoryDepartment(event.target.value)}
                disabled={!historyUbication}
                className="h-9 rounded-md border border-slate-300 px-2 text-sm"
              >
                <option value="">
                  {historyUbication ? 'Todos los departamentos' : 'Seleccione ubicación primero'}
                </option>
                {departments
                  .filter(
                    (department) => Number(department.id_ubication) === Number(historyUbication)
                  )
                  .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                  .map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
              </select>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Fecha de inicio
                <input
                  aria-label="Fecha de inicio"
                  type="date"
                  value={historyFrom}
                  onChange={(event) => setHistoryFrom(event.target.value)}
                  className="h-9 rounded-md border border-slate-300 px-2 text-sm font-normal"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Fecha de fin
                <input
                  aria-label="Fecha de fin"
                  type="date"
                  value={historyTo}
                  onChange={(event) => setHistoryTo(event.target.value)}
                  className="h-9 rounded-md border border-slate-300 px-2 text-sm font-normal"
                />
              </label>
              <button
                type="button"
                onClick={exportMovements}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-semibold"
              >
                <Download size={15} />
                Exportar
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Insumo</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Cantidad</th>
                  <th className="px-5 py-3">Ubicación</th>
                  <th className="px-5 py-3">Departamento</th>
                  <th className="px-5 py-3">Quién recibió / retiró</th>
                  <th className="px-5 py-3">Despachado por</th>
                  <th className="px-5 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-t border-slate-100">
                    <td className="px-5 py-3">{formatDateTime(movement.created_at)}</td>
                    <td className="px-5 py-3">
                      {movement.group_items?.length > 1 ? (
                        <details className="group min-w-[240px] rounded-lg border border-blue-100 bg-blue-50/50">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-blue-900 [&::-webkit-details-marker]:hidden">
                            <span>
                              <span className="block font-semibold">Salida agrupada</span>
                              <span className="text-xs text-blue-700">{movement.group_items.length} insumos · Ver detalle</span>
                            </span>
                            <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-180">⌄</span>
                          </summary>
                          <ul className="divide-y divide-blue-100 border-t border-blue-100 bg-white px-3">
                            {movement.group_items.map((line) => (
                              <li key={line.id} className="flex items-start justify-between gap-3 py-2.5">
                                <span className="min-w-0">
                                  <span className="block font-medium text-slate-700">{line.item?.name || '-'}</span>
                                  <span className="block text-xs text-slate-500">Código: {line.item?.code || 'Sin código'}</span>
                                </span>
                                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{line.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-700">{movement.item?.name || '-'}</div>
                          <div className="mt-1 text-xs text-slate-500">Código: {movement.item?.code || 'Sin código'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {{ IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste' }[
                        movement.movement_type
                      ] || movement.movement_type}
                    </td>
                    <td className="px-5 py-3">
                      {movement.group_items?.length > 1 ? `${movement.group_items.length} insumos` : movement.quantity}
                    </td>
                    <td className="px-5 py-3">{movement.ubication?.name || '-'}</td>
                    <td className="px-5 py-3">{movement.department?.name || '-'}</td>
                    <td className="px-5 py-3">{movement.receiver_name || '-'}</td>
                    <td className="px-5 py-3">
                      {movement.user?.nombre_completo || movement.user?.username || '-'}
                    </td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => setSelectedMovement(movement)} aria-label="Ver detalle del movimiento" title="Ver detalle" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                        <Eye size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={historyPage}
            totalPages={historyMeta.totalPages}
            onPageChange={setHistoryPage}
          />
          <Modal open={Boolean(selectedMovement)} onClose={() => setSelectedMovement(null)} title="Detalle del movimiento" size="2xl" constrainToViewport>
            {selectedMovement && (
              <div className="space-y-5 text-sm text-slate-700">
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Fecha', formatDateTime(selectedMovement.created_at)],
                    ['Tipo', { IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste' }[selectedMovement.movement_type] || selectedMovement.movement_type],
                    ['Ubicación', selectedMovement.ubication?.name],
                    ['Departamento', selectedMovement.department?.name],
                    ['Quién recibió / retiró', selectedMovement.receiver_name],
                    ['Despachado por', selectedMovement.user?.nombre_completo || selectedMovement.user?.username],
                    ['Referencia', selectedMovement.reference],
                  ].map(([label, value]) => (
                    <div key={label}><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 break-words">{value || '—'}</dd></div>
                  ))}
                </dl>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">Insumos</h3>
                  <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                    {(selectedMovement.group_items || [selectedMovement]).map((line) => (
                      <li key={line.id} className="flex justify-between gap-4 px-4 py-3">
                        <div className="min-w-0"><p className="font-medium text-slate-900">{line.item?.name || 'Insumo'}</p><p className="mt-1 text-xs text-slate-500">Código: {line.item?.code || 'Sin código'}</p>{line.observation && line.observation !== selectedMovement.observation && <p className="mt-2 whitespace-pre-wrap break-words">Observación: {line.observation}</p>}</div>
                        <span className="shrink-0 font-semibold">{line.quantity} {line.item?.unit || ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-slate-50 p-4"><h3 className="font-semibold text-slate-900">Observación</h3><p className="mt-1 whitespace-pre-wrap break-words">{selectedMovement.observation || 'Sin observación'}</p></div>
              </div>
            )}
          </Modal>
        </section>
      )}
    </div>
  );
}

export default WarehousePage;
