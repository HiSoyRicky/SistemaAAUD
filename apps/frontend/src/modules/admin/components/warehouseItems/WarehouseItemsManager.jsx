import { Boxes, Edit3, Plus, Power, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../../../shared/hooks/useAuth';
import Warehouse from '../../../warehouse/services/warehouse.api';

const UNIT_OPTIONS = ['BID', 'BOL', 'BTO', 'C/U', 'CA', 'CJ', 'CTO', 'DOC', 'FRC', 'GLN', 'GRF', 'KG', 'L', 'LB', 'LTA', 'M', 'M2', 'M3', 'MLR', 'PAA', 'PAQ', 'PIE', 'PLG', 'PT', 'RES', 'ROL', 'SAC', 'TF', 'TRA', 'TUB', 'YD'];
const CATEGORY_OPTIONS = ['Sin categoría', 'Alimentos y bebidas', 'Combustibles y gases', 'Cocina y comedor', 'Electricidad y electrónica', 'Ferretería, construcción y pintura', 'Herramientas y equipos', 'HVAC y climatización', 'Informática y comunicaciones', 'Jardinería y agricultura', 'Limpieza e higiene', 'Llantas y ruedas', 'Lubricantes y fluidos', 'Mobiliario y enseres', 'Médico y laboratorio', 'Papelería y útiles', 'Repuestos y componentes', 'Ropa y uniformes', 'Seguridad y protección', 'Vehículos y transporte'];
const emptyForm = { code: '', name: '', unit: 'C/U', category: '', active: true };

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || 'No se pudo completar la operación';
}

export default function WarehouseItemsManager() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const canCreate = hasPermission('warehouse_items.create');
  const canUpdate = hasPermission('warehouse_items.update');

  const load = async () => {
    try {
      setLoading(true);
      const response = await Warehouse.fetchItems({ search, limit: 50 });
      setItems(response?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const closeForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...form, code: form.code.trim() || null, name: form.name.trim(), category: form.category === 'Sin categoría' ? null : form.category, active: Boolean(form.active) };
    try {
      if (editingId) await Warehouse.updateItem(editingId, payload);
      else await Warehouse.createItem(payload);
      toast.success(editingId ? 'Insumo actualizado' : 'Insumo agregado al catálogo');
      closeForm();
      await load();
    } catch (error) { toast.error(getErrorMessage(error)); }
  };

  const edit = (item) => { setEditingId(item.id); setForm({ code: item.code || '', name: item.name, unit: item.unit, category: item.category || 'Sin categoría', active: item.active }); setShowForm(true); };
  const toggle = async (item) => { try { await Warehouse.updateItem(item.id, { active: !item.active }); toast.success(item.active ? 'Insumo desactivado' : 'Insumo activado'); await load(); } catch (error) { toast.error(getErrorMessage(error)); } };

  return <div className="space-y-5">
    <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white"><Boxes size={22} /></div><div><h2 className="text-2xl font-bold text-slate-900">Catálogo de insumos</h2><p className="text-sm text-slate-500">Administra los productos que pueden utilizarse en Almacén.</p></div></div>
      {canCreate && <button type="button" onClick={() => { closeForm(); setShowForm(true); }} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} />Agregar insumo</button>}
    </header>
    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código o nombre" className="h-10 w-full rounded-md border border-slate-300 px-3" />
    {showForm && <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50 p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">{editingId ? 'Editar insumo' : 'Agregar insumo al catálogo'}</h3><button type="button" onClick={closeForm} title="Cerrar" className="rounded-md p-2 hover:bg-white"><X size={18} /></button></div><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Código<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" /></label><label className="text-sm font-semibold">Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" /></label><label className="text-sm font-semibold">Unidad<select required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">{UNIT_OPTIONS.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label className="text-sm font-semibold">Categoría<select value={form.category || 'Sin categoría'} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">{CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}</select></label></div><div className="mt-4 flex gap-2"><button type="submit" className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white">Guardar</button><button type="button" onClick={closeForm} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold">Cancelar</button></div></form>}
    <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Unidad</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="px-4 py-8 text-center">Cargando...</td></tr> : items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-3 text-slate-500">{item.code || '-'}</td><td className="px-4 py-3 font-semibold">{item.name}</td><td className="px-4 py-3">{item.unit}</td><td className="px-4 py-3">{item.category || 'Sin categoría'}</td><td className="px-4 py-3">{item.active ? 'Activo' : 'Inactivo'}</td><td className="px-4 py-3"><div className="flex justify-end gap-2">{canUpdate && <button type="button" title="Editar" onClick={() => edit(item)} className="rounded-md p-2 text-blue-600 hover:bg-blue-50"><Edit3 size={17} /></button>}{canUpdate && <button type="button" title={item.active ? 'Desactivar' : 'Activar'} onClick={() => toggle(item)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Power size={17} /></button>}</div></td></tr>)}</tbody></table></div>
  </div>;
}