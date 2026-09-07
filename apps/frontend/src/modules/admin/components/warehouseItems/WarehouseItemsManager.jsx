import { Boxes, Edit3, Plus, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../../../shared/hooks/useAuth';
import Pagination from '../../../../shared/components/ui/Pagination';
import Warehouse from '../../../warehouse/services/warehouse.api';

const UNIT_OPTIONS = [
  'BID',
  'BOL',
  'BTO',
  'C/U',
  'CA',
  'CJ',
  'CTO',
  'DOC',
  'FRC',
  'GLN',
  'GRF',
  'KG',
  'L',
  'LB',
  'LTA',
  'M',
  'M2',
  'M3',
  'MLR',
  'PAA',
  'PAQ',
  'PIE',
  'PLG',
  'PT',
  'RES',
  'ROL',
  'SAC',
  'TF',
  'TRA',
  'TUB',
  'YD',
];
const CATEGORY_OPTIONS = [
  'Sin categoría',
  'Alimentos y bebidas',
  'Combustibles y gases',
  'Cocina y comedor',
  'Electricidad y electrónica',
  'Ferretería, construcción y pintura',
  'Herramientas y equipos',
  'HVAC y climatización',
  'Informática y comunicaciones',
  'Jardinería y agricultura',
  'Limpieza e higiene',
  'Llantas y ruedas',
  'Lubricantes y fluidos',
  'Mobiliario y enseres',
  'Médico y laboratorio',
  'Papelería y útiles',
  'Repuestos y componentes',
  'Ropa y uniformes',
  'Seguridad y protección',
  'Vehículos y transporte',
];
const emptyForm = { code: '', name: '', unit: 'C/U', category: '', min_stock: 0, active: true };

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    'No se pudo completar la operación'
  );
}

export default function WarehouseItemsManager() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [fieldsUnlocked, setFieldsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const canCreate = hasPermission('warehouse_items.create');
  const canUpdate = hasPermission('warehouse_items.update');

  const load = async () => {
    try {
      setLoading(true);
      const response = await Warehouse.fetchItems({ search, page, limit: 25 });
      setMeta({ total: response?.total || 0, totalPages: response?.totalPages || 1 });
      setItems(response?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page]);
  useEffect(() => { setPage(1); }, [search]);

  const closeForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFieldsUnlocked(false);
    setShowForm(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      code: form.code.trim() || null,
      name: form.name.trim(),
      category: form.category === 'Sin categoría' ? null : form.category,
      min_stock: Number(form.min_stock),
      active: Boolean(form.active),
    };
    try {
      if (editingId) await Warehouse.updateItem(editingId, payload);
      else await Warehouse.createItem(payload);
      toast.success(editingId ? 'Insumo actualizado' : 'Insumo agregado al catálogo');
      closeForm();
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setFieldsUnlocked(false);
    setForm({
      code: item.code || '',
      name: item.name,
      unit: item.unit,
      category: item.category || 'Sin categoría',
      min_stock: Number(item.min_stock || 0),
      active: item.active,
    });
    setShowForm(true);
  };
  const toggle = async (item) => {
    try {
      await Warehouse.updateItem(item.id, { active: !item.active });
      toast.success(item.active ? 'Insumo desactivado' : 'Insumo activado');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Boxes size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Catálogo de insumos</h2>
            <p className="text-sm text-slate-500">
              Administra los productos que pueden utilizarse en Almacén.
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              closeForm();
              setFieldsUnlocked(true);
              setShowForm(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Agregar insumo
          </button>
        )}
      </header>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por código o nombre"
        className="h-10 w-full rounded-md border border-slate-300 px-3"
      />
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="warehouse-item-modal-title"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={closeForm}
            className="absolute inset-0 cursor-default"
          />
          <form
            onSubmit={submit}
            className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {editingId && !fieldsUnlocked ? (
                <>
                  <span>Campos protegidos.</span>
                  <button
                    type="button"
                    onClick={() => setFieldsUnlocked(true)}
                    className="font-semibold underline"
                  >
                    Desbloquear campos
                  </button>
                </>
              ) : (
                <span>{editingId ? 'Edición habilitada.' : 'Nuevo registro de catálogo.'}</span>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Código
                <input
                  disabled={editingId && !fieldsUnlocked}
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Nombre
                <input
                  required
                  disabled={editingId && !fieldsUnlocked}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Unidad
                <select
                  required
                  disabled={editingId && !fieldsUnlocked}
                  value={form.unit}
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Categoría
                <select
                  disabled={editingId && !fieldsUnlocked}
                  value={form.category || 'Sin categoría'}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Stock mínimo
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  disabled={editingId && !fieldsUnlocked}
                  value={form.min_stock}
                  onChange={(event) => setForm({ ...form, min_stock: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Stock mínimo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center">
                  Cargando...
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-500">{item.code || '-'}</td>
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3">{item.category || 'Sin categoría'}</td>
                  <td className="px-4 py-3">{item.min_stock ?? 0}</td>
                  <td className="px-4 py-3">{item.active ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => edit(item)}
                          className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 size={17} />
                        </button>
                      )}
                      {canUpdate && (
                        <button
                          type="button"
                          title={item.active ? 'Desactivar' : 'Activar'}
                          onClick={() => toggle(item)}
                          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Power size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}
