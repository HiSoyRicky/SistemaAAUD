import { useEffect, useMemo, useState } from 'react';
import { Check, Edit3, Filter, Plus, Power, X } from 'lucide-react';
import api from '../../../../shared/api/apiClient';
import useAuth from '../../../../shared/hooks/useAuth';

const RULES_URL = '/api/inventory/classification-rules';
const MANAGE_URL = `${RULES_URL}/manage`;
const EMPTY_FORM = {
  scope: 'DEVICE',
  device_id: '',
  asset_type_id: '',
  extension_id: '',
  administrative_area_id: '',
  classification_id: '',
  is_default: false,
  active: true,
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.details?.message ||
    error?.message ||
    'No fue posible completar la operación.'
  );
}

function normalizeRule(rule) {
  return {
    ...rule,
    scope: rule.scope || (rule.device_id ? 'DEVICE' : 'GENERIC'),
    device_id: rule.device_id ?? '',
    asset_type_id: rule.asset_type?.id ?? '',
    extension_id: rule.extension?.id ?? '',
    administrative_area_id: rule.administrative_area?.id ?? '',
    classification_id: rule.classification?.id ?? '',
    is_default: Boolean(rule.is_default),
    active: Boolean(rule.active),
  };
}

export default function ClassificationRulesManager() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('inventory_classification_rules.create') || hasPermission('inventory.update');
  const canUpdate = hasPermission('inventory_classification_rules.update') || hasPermission('inventory.update');
  const [rules, setRules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [catalogs, setCatalogs] = useState({
    assetTypes: [],
    extensions: [],
    areas: [],
    classifications: [],
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ scope: '', device: '', assetType: '', extension: '', area: '', classification: '', active: '', default: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [reconciliationReport, setReconciliationReport] = useState(null);
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [reconciliationConfirmed, setReconciliationConfirmed] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ruleResponse, deviceResponse, assetTypesResponse, extensionsResponse, areasResponse, classificationsResponse] = await Promise.all([
        api.get(MANAGE_URL, { params: { limit: 200 } }),
        api.get('/api/devices'),
        api.get('/api/inventory/asset-types'),
        api.get('/api/inventory/asset-extensions'),
        api.get('/api/inventory/administrative-areas'),
        api.get('/api/inventory/classifications'),
      ]);
      setRules(Array.isArray(ruleResponse.data?.data) ? ruleResponse.data.data : []);
      setDevices(Array.isArray(deviceResponse.data) ? deviceResponse.data : []);
      setCatalogs({
        assetTypes: Array.isArray(assetTypesResponse.data) ? assetTypesResponse.data : [],
        extensions: Array.isArray(extensionsResponse.data) ? extensionsResponse.data : [],
        areas: Array.isArray(areasResponse.data) ? areasResponse.data : [],
        classifications: Array.isArray(classificationsResponse.data) ? classificationsResponse.data : [],
      });
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRules = useMemo(() => rules.filter((rule) => {
    const scope = rule.scope || (rule.device_id ? 'DEVICE' : 'GENERIC');
    return (!filters.scope || scope === filters.scope) &&
      (!filters.device || String(rule.device?.id) === filters.device) &&
      (!filters.assetType || String(rule.asset_type?.id) === filters.assetType) &&
      (!filters.extension || String(rule.extension?.id) === filters.extension) &&
      (!filters.area || String(rule.administrative_area?.id) === filters.area) &&
      (!filters.classification || String(rule.classification?.id) === filters.classification) &&
      (!filters.active || String(rule.active) === filters.active) &&
      (!filters.default || String(rule.is_default) === filters.default);
  }), [rules, filters]);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage(null);
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setForm(normalizeRule(rule));
    setMessage(null);
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'scope' && value === 'DEVICE') next.is_default = false;
      if (field === 'scope' && value === 'GENERIC') next.device_id = '';
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.scope === 'DEVICE' && !form.device_id) {
      setMessage({ type: 'error', text: 'Seleccione un device para una regla específica.' });
      return;
    }
    if (form.scope === 'GENERIC' && !form.asset_type_id) {
      setMessage({ type: 'error', text: 'Seleccione un asset type para una regla genérica.' });
      return;
    }
    if (!form.classification_id) {
      setMessage({ type: 'error', text: 'Seleccione una clasificación patrimonial.' });
      return;
    }

    const payload = {
      device_id: form.scope === 'DEVICE' ? Number(form.device_id) : null,
      asset_type_id: Number(form.asset_type_id),
      extension_id: form.extension_id ? Number(form.extension_id) : null,
      administrative_area_id: form.administrative_area_id ? Number(form.administrative_area_id) : null,
      classification_id: Number(form.classification_id),
      is_default: form.scope === 'GENERIC' && Boolean(form.is_default),
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`${RULES_URL}/${editingId}`, payload);
      } else {
        await api.post(RULES_URL, payload);
      }
      setMessage({ type: 'success', text: editingId ? 'Regla actualizada correctamente.' : 'Regla creada correctamente.' });
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule) => {
    if (!canUpdate) return;
    try {
      await api.patch(`${RULES_URL}/${rule.id}/status`, { active: !rule.active });
      setMessage({ type: 'success', text: rule.active ? 'Regla desactivada.' : 'Regla activada.' });
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  };

  const canReconcile = hasPermission('inventory_classification_rules.reconcile');

  const openReconciliation = async () => {
    setReconciliationOpen(true);
    setReconciliationLoading(true);
    setReconciliationReport(null);
    setReconciliationResult(null);
    setReconciliationConfirmed(false);
    try {
      const response = await api.post(`${RULES_URL}/reconcile/dry-run`, { batch_size: 200 });
      setReconciliationReport(response.data?.data || response.data || null);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setReconciliationLoading(false);
    }
  };

  const executeReconciliation = async () => {
    if (!reconciliationConfirmed) return;
    setReconciliationLoading(true);
    try {
      const response = await api.post(`${RULES_URL}/reconcile`, { batch_size: 200 });
      setReconciliationResult(response.data?.data || response.data || null);
      setMessage({ type: 'success', text: 'Reconciliación completada correctamente.' });
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setReconciliationLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Clasificación patrimonial</p>
          <h2 className="text-2xl font-semibold text-slate-800">Reglas de clasificación</h2>
        </div>
        {canCreate && (
          <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nueva regla
          </button>
        )}
        {canReconcile && (
          <button type="button" onClick={openReconciliation} className="inline-flex items-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100">
            <Power className="h-4 w-4" /> Reconciliar inventario
          </button>
        )}
      </div>

      {message && <div className={`rounded-md border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

      {reconciliationOpen && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-amber-950">Reconciliar inventario</h3>
              <p className="mt-1 text-sm text-amber-900">Esta operación modificará los inventarios existentes según las reglas activas.</p>
            </div>
            <button type="button" onClick={() => setReconciliationOpen(false)} className="text-amber-700 hover:text-amber-950" title="Cerrar reconciliación"><X className="h-5 w-5" /></button>
          </div>

          {reconciliationLoading && !reconciliationReport && <p className="mt-4 text-sm text-amber-900">Calculando dry-run...</p>}
          {reconciliationReport && !reconciliationResult && (
            <>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                {[
                  ['Total', reconciliationReport.totalInventories ?? reconciliationReport.total],
                  ['Recibirían regla', reconciliationReport.wouldReceiveRule],
                  ['Recibirían área', reconciliationReport.wouldReceiveArea],
                  ['Cambiarían regla', reconciliationReport.wouldChangeRule ?? reconciliationReport.ruleChanged],
                  ['Cambiarían área', reconciliationReport.wouldChangeArea ?? reconciliationReport.areaChanged],
                  ['Sin cambios', reconciliationReport.unchanged ?? 0],
                  ['Sin regla', reconciliationReport.withoutRule],
                  ['Conflictos', reconciliationReport.conflicts],
                  ['Errores', reconciliationReport.errors ?? 0],
                ].map(([label, value]) => <div key={label} className="rounded-md border border-amber-200 bg-white px-3 py-2"><dt className="text-xs text-slate-500">{label}</dt><dd className="text-lg font-semibold text-slate-900">{value ?? 0}</dd></div>)}
              </dl>
              <label className="mt-4 flex items-start gap-2 text-sm font-medium text-amber-950"><input type="checkbox" checked={reconciliationConfirmed} onChange={(event) => setReconciliationConfirmed(event.target.checked)} className="mt-1" /> Confirmo que deseo modificar los inventarios existentes.</label>
              <div className="mt-4 flex justify-end"><button type="button" disabled={!reconciliationConfirmed || reconciliationLoading} onClick={executeReconciliation} className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{reconciliationLoading ? 'Ejecutando...' : 'Confirmar reconciliación'}</button></div>
            </>
          )}
          {reconciliationResult && (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              {Object.entries(reconciliationResult).filter(([key]) => ['total', 'processed', 'updated', 'ruleChanged', 'areaChanged', 'unchanged', 'withoutRule', 'conflicts', 'errors'].includes(key)).map(([label, value]) => <div key={label} className="rounded-md border border-emerald-200 bg-white px-3 py-2"><dt className="text-xs text-slate-500">{label}</dt><dd className="text-lg font-semibold text-slate-900">{value ?? 0}</dd></div>)}
            </dl>
          )}
        </div>
      )}

      {(canCreate || editingId) && (
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{editingId ? 'Editar regla' : 'Nueva regla'}</h3>
            {editingId && <button type="button" onClick={startCreate} className="text-slate-500 hover:text-slate-800" title="Cancelar edición"><X className="h-5 w-5" /></button>}
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Tipo de regla<select value={form.scope} onChange={(e) => updateForm('scope', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" disabled={Boolean(editingId)}><option value="DEVICE">Específica por device</option><option value="GENERIC">Genérica</option></select></label>
            {form.scope === 'DEVICE' && <label className="text-sm font-medium text-slate-700">Device<select required value={form.device_id} onChange={(e) => updateForm('device_id', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Seleccione...</option>{devices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            <label className="text-sm font-medium text-slate-700">Asset Type<select required value={form.asset_type_id} onChange={(e) => updateForm('asset_type_id', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Seleccione...</option>{catalogs.assetTypes.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Extension<select value={form.extension_id} onChange={(e) => updateForm('extension_id', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Sin extensión</option>{catalogs.extensions.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Área administrativa<select value={form.administrative_area_id} onChange={(e) => updateForm('administrative_area_id', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Global</option>{catalogs.areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Clasificación<select required value={form.classification_id} onChange={(e) => updateForm('classification_id', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Seleccione...</option>{catalogs.classifications.map((item) => <option key={item.id} value={item.id}>{item.code_new} · {item.description}</option>)}</select></label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => updateForm('active', e.target.checked)} /> Activa</label>
            {form.scope === 'GENERIC' && <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.is_default} onChange={(e) => updateForm('is_default', e.target.checked)} /> Predeterminada</label>}
          </div>
          <div className="mt-4 flex justify-end"><button disabled={saving} type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear regla'}</button></div>
        </form>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Filter className="h-4 w-4" /> Filtros</div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {[['scope', 'Tipo', [['DEVICE', 'Específica'], ['GENERIC', 'Genérica']]], ['device', 'Device', devices.map((item) => [item.id, item.name])], ['assetType', 'Asset Type', catalogs.assetTypes.map((item) => [item.id, item.code])], ['extension', 'Extension', catalogs.extensions.map((item) => [item.id, item.code])], ['area', 'Área', catalogs.areas.map((item) => [item.id, item.name])], ['classification', 'Clasificación', catalogs.classifications.map((item) => [item.id, item.code_new])], ['active', 'Estado', [['true', 'Activa'], ['false', 'Inactiva']]], ['default', 'Default', [['true', 'Sí'], ['false', 'No']]]].map(([key, label, options]) => <select key={key} value={filters[key]} onChange={(e) => setFilters((current) => ({ ...current, [key]: e.target.value }))} className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm" aria-label={label}><option value="">{label}</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>)}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr>{['Tipo', 'Device', 'Asset Type', 'Extension', 'Área administrativa', 'Código patrimonial', 'Clasificación', 'Default', 'Estado', 'Acciones'].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead>
          <tbody>{loading ? <tr><td colSpan="10" className="px-3 py-8 text-center text-slate-500">Cargando reglas...</td></tr> : filteredRules.length === 0 ? <tr><td colSpan="10" className="px-3 py-8 text-center text-slate-500">No hay reglas para los filtros seleccionados.</td></tr> : filteredRules.map((rule) => { const specific = (rule.scope || (rule.device_id ? 'DEVICE' : 'GENERIC')) === 'DEVICE'; return <tr key={rule.id} className="border-t border-slate-200 align-top"><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${specific ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{specific ? 'Específica' : 'Genérica'}</span></td><td className="px-3 py-3">{rule.device?.name || '—'}</td><td className="px-3 py-3">{rule.asset_type?.code || '—'}</td><td className="px-3 py-3">{rule.extension?.code || '—'}</td><td className="px-3 py-3">{rule.administrative_area?.name || 'Global'}</td><td className="px-3 py-3 font-mono text-xs">{rule.classification?.code_new || '—'}</td><td className="max-w-[220px] px-3 py-3">{rule.classification?.description || '—'}</td><td className="px-3 py-3">{rule.is_default ? <Check className="h-4 w-4 text-emerald-600" /> : '—'}</td><td className="px-3 py-3">{rule.active ? <span className="text-emerald-700">Activa</span> : <span className="text-slate-500">Inactiva</span>}</td><td className="px-3 py-3"><div className="flex gap-2">{canUpdate && <button type="button" onClick={() => startEdit(rule)} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" title="Editar"><Edit3 className="h-4 w-4" /></button>}{canUpdate && <button type="button" onClick={() => toggleActive(rule)} className={`rounded-md border p-2 ${rule.active ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`} title={rule.active ? 'Desactivar' : 'Activar'}><Power className="h-4 w-4" /></button>}</div></td></tr>; })}</tbody>
        </table>
      </div>
    </div>
  );
}