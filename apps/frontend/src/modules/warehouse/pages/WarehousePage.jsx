// WareHousePage.jsx

import {
  ArrowLeft,
  ClipboardList,
  Download,
  History,
  Plus,
  RefreshCw,
  Trash2,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../../shared/hooks/useAuth';
import { formatDateTime } from '../../../shared/utils/formatDate';
import {
  exportWarehouseMovementsToExcel,
  exportWarehouseStockToExcel,
} from '../../../shared/utils/exportExcel';
import Warehouse from '../services/warehouse.api';
import WarehouseMovementModal from '../components/WarehouseMovementModal';

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
  const [dispatchLines, setDispatchLines] = useState([]);

  const canCreateMovement = hasPermission('warehouse_movements.create');

  const load = async () => {
    setLoading(true);
    try {
      const requests = [
        Warehouse.fetchStock({ search: stockSearch, limit: 200 }),
        Warehouse.fetchMovements({ search: historySearch, limit: 200 }),
        Warehouse.fetchUbications(),
        Warehouse.fetchDepartments(),
      ];
      const [stockData, movementData, ubicationData, departmentData] = await Promise.all(requests);
      setStock(stockData?.data || []);
      setMovements(movementData?.data || []);
      setUbications(Array.isArray(ubicationData) ? ubicationData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar Almacén');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [stockSearch, historySearch]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!hasPermission('warehouse_items.read')) return;
      try {
        const result = await Warehouse.fetchItems({ search: movementSearch, limit: 25 });
        setMovementItems(result?.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'No se pudo buscar el catálogo');
      }
    }, 250);
    return () => clearTimeout(timer);
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
          ubication_id: Number(movementForm.ubication_id),
          department_id: Number(movementForm.department_id),
          receiver_name: movementForm.receiver_name,
          items,
        });
      } else {
        await Warehouse.createMovement({
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
      { item_id: selectedMovementItem.id, quantity: Number(movementForm.quantity), item: selectedMovementItem },
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
      await exportWarehouseStockToExcel(await fetchAllPages(Warehouse.fetchStock, { search: stockSearch }));
    } catch (error) {
      toast.error('No se pudieron exportar las existencias');
    }
  };

  const exportMovements = async () => {
    try {
      await exportWarehouseMovementsToExcel(await fetchAllPages(Warehouse.fetchMovements, { search: historySearch }));
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
          {!historyOnly && (
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
                <button type="button" onClick={addDispatchLine} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  <Plus size={15} /> Agregar a la salida
                </button>
              )}
              {movementForm.movement_type === 'OUT' && dispatchLines.length > 0 && (
                <div className="mt-2 space-y-1 rounded-md border border-slate-200 p-2">
                  {dispatchLines.map((line) => (
                    <div key={line.item_id} className="flex items-center justify-between gap-2 text-sm">
                      <span>{line.item?.name || line.item_id} x {line.quantity}</span>
                      <button type="button" title="Quitar artículo" onClick={() => setDispatchLines((lines) => lines.filter((current) => current.item_id !== line.item_id))} className="text-red-600"><Trash2 size={15} /></button>
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
            <div className="flex flex-wrap gap-2"><input value={stockSearch} onChange={(event) => setStockSearch(event.target.value)} placeholder="Buscar insumo, código o ubicación" className="h-9 rounded-md border border-slate-300 px-3 text-sm" /><button type="button" onClick={exportStock} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-semibold"><Download size={15} />Exportar</button></div>
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
        </section>
      )}

      {historyOnly && (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">Últimos movimientos</h2>
            <div className="flex flex-wrap gap-2"><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar movimiento" className="h-9 rounded-md border border-slate-300 px-3 text-sm" /><button type="button" onClick={exportMovements} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-semibold"><Download size={15} />Exportar</button></div>
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
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-t border-slate-100">
                    <td className="px-5 py-3">{formatDateTime(movement.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-700">{movement.item?.name || '-'}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Código: {movement.item?.code || 'Sin código'}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {{ IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste' }[
                        movement.movement_type
                      ] || movement.movement_type}
                    </td>
                    <td className="px-5 py-3">{movement.quantity}</td>
                    <td className="px-5 py-3">{movement.ubication?.name || '-'}</td>
                    <td className="px-5 py-3">{movement.department?.name || '-'}</td>
                    <td className="px-5 py-3">{movement.receiver_name || '-'}</td>
                    <td className="px-5 py-3">
                      {movement.user?.nombre_completo || movement.user?.username || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default WarehousePage;
