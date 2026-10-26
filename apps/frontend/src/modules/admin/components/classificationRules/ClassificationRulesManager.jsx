import { Check, Edit3, Filter, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Modal from '../../../../shared/components/ui/Modal';
import useAuth from '../../../../shared/hooks/useAuth';

const RULES_URL = '/api/inventory/classification-rules';
const MANAGE_URL = `${RULES_URL}/manage`;
const NO_EXTENSION = '__none__';
const EXPECTED_EXTENSION_BY_TYPE = {
  TECHNOLOGY: 'DEVICES',
  VEHICLE: 'VEHICLES',
  PROPERTY: 'PROPERTIES',
};
const VEHICLE_CLASSIFICATION_CODE = '12040302';
const TECHNOLOGY_EXCLUDED_CODES = new Set(['12040302', '12040322']);
const PROPERTY_EXCLUDED_CODES = new Set(['12040302', '12040320', '12040323', '12040324']);
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
    device_id: rule.device_id == null ? '' : String(rule.device_id),
    asset_type_id: rule.asset_type?.id == null ? '' : String(rule.asset_type.id),
    extension_id: rule.extension?.id == null ? NO_EXTENSION : String(rule.extension.id),
    administrative_area_id:
      rule.administrative_area?.id == null ? '' : String(rule.administrative_area.id),
    classification_id: rule.classification?.id == null ? '' : String(rule.classification.id),
    is_default: Boolean(rule.is_default),
    active: Boolean(rule.active),
  };
}

function isCompatibleRule(rule) {
  const typeCode = rule.asset_type?.code;
  const expectedExtension = EXPECTED_EXTENSION_BY_TYPE[typeCode];
  if (expectedExtension && rule.extension?.code !== expectedExtension) return false;
  if (typeCode === 'VEHICLE' && rule.classification?.code_new !== VEHICLE_CLASSIFICATION_CODE) {
    return false;
  }
  return true;
}

function isClassificationCompatible(typeCode, classificationCode) {
  const code = String(classificationCode || '');
  if (typeCode === 'VEHICLE') return code === VEHICLE_CLASSIFICATION_CODE;
  if (typeCode === 'TECHNOLOGY')
    return code.startsWith('120403') && !TECHNOLOGY_EXCLUDED_CODES.has(code);
  if (typeCode === 'PROPERTY') {
    return (
      (code.startsWith('1204') && !PROPERTY_EXCLUDED_CODES.has(code)) || code.startsWith('1205')
    );
  }
  return false;
}

export default function ClassificationRulesManager() {
  const { hasPermission } = useAuth();
  const canCreate =
    hasPermission('inventory_classification_rules.create') || hasPermission('inventory.update');
  const canUpdate =
    hasPermission('inventory_classification_rules.update') || hasPermission('inventory.update');
  const [rules, setRules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceAssetTypeProfiles, setDeviceAssetTypeProfiles] = useState({});
  const [catalogs, setCatalogs] = useState({
    assetTypes: [],
    extensions: [],
    areas: [],
    classifications: [],
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [filters, setFilters] = useState({
    scope: '',
    device: '',
    assetType: '',
    extension: '',
    area: '',
    classification: '',
    active: '',
    default: '',
  });
  const [deviceSearch, setDeviceSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        ruleResponse,
        deviceResponse,
        assetTypesResponse,
        extensionsResponse,
        areasResponse,
        classificationsResponse,
        deviceProfilesResponse,
      ] = await Promise.all([
        api.get(MANAGE_URL, { params: { limit: 200 } }),
        api.get('/api/devices'),
        api.get('/api/inventory/asset-types'),
        api.get('/api/inventory/asset-extensions'),
        api.get('/api/inventory/administrative-areas'),
        api.get('/api/inventory/classifications'),
        api.get(`${RULES_URL}/device-profiles`),
      ]);
      const firstRulePage = Array.isArray(ruleResponse.data?.data) ? ruleResponse.data.data : [];
      const remainingRulePages = await Promise.all(
        Array.from(
          { length: Math.max(Number(ruleResponse.data?.totalPages || 1) - 1, 0) },
          (_, i) => api.get(MANAGE_URL, { params: { limit: 200, page: i + 2 } })
        )
      );
      setRules([
        ...firstRulePage,
        ...remainingRulePages.flatMap((response) =>
          Array.isArray(response.data?.data) ? response.data.data : []
        ),
      ]);
      setDevices(Array.isArray(deviceResponse.data) ? deviceResponse.data : []);
      setDeviceAssetTypeProfiles(
        Object.fromEntries(
          (Array.isArray(deviceProfilesResponse.data) ? deviceProfilesResponse.data : []).map(
            (profile) => [String(profile.device_id), profile.asset_type_ids.map(String)]
          )
        )
      );
      setCatalogs({
        assetTypes: Array.isArray(assetTypesResponse.data) ? assetTypesResponse.data : [],
        extensions: Array.isArray(extensionsResponse.data) ? extensionsResponse.data : [],
        areas: Array.isArray(areasResponse.data) ? areasResponse.data : [],
        classifications: Array.isArray(classificationsResponse.data)
          ? classificationsResponse.data
          : [],
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

  const filteredRules = useMemo(() => {
    const normalizedSearch = deviceSearch
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es');

    return rules
      .filter((rule) => {
        const scope = rule.scope || (rule.device_id ? 'DEVICE' : 'GENERIC');
        const deviceName = String(rule.device?.name || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('es');
        return (
          (!normalizedSearch || deviceName.includes(normalizedSearch)) &&
          (!filters.scope || scope === filters.scope) &&
          (!filters.device || String(rule.device?.id) === filters.device) &&
          (!filters.assetType || String(rule.asset_type?.id) === filters.assetType) &&
          (!filters.extension || String(rule.extension?.id) === filters.extension) &&
          (!filters.area || String(rule.administrative_area?.id) === filters.area) &&
          (!filters.classification || String(rule.classification?.id) === filters.classification) &&
          (!filters.active || String(rule.active) === filters.active) &&
          (!filters.default || String(rule.is_default) === filters.default)
        );
      })
      .sort((left, right) => {
        const compare = (a, b) =>
          String(a ?? '').localeCompare(String(b ?? ''), 'es', {
            numeric: true,
            sensitivity: 'base',
          });
        const leftDevice = left.device?.name;
        const rightDevice = right.device?.name;

        if (!leftDevice || !rightDevice) {
          if (leftDevice) return -1;
          if (rightDevice) return 1;
        }

        return (
          compare(leftDevice, rightDevice) ||
          compare(left.asset_type?.code, right.asset_type?.code) ||
          compare(left.extension?.code, right.extension?.code) ||
          compare(left.administrative_area?.name, right.administrative_area?.name) ||
          compare(left.classification?.code_new, right.classification?.code_new) ||
          left.id - right.id
        );
      });
  }, [rules, filters, deviceSearch]);

  const availableDevices = useMemo(() => {
    const devicesWithRule = new Set(
      rules
        .filter((rule) => rule.id !== editingId)
        .map((rule) => rule.device_id ?? rule.device?.id)
        .filter((id) => id != null)
        .map(String)
    );
    return devices.filter((item) => !devicesWithRule.has(String(item.id)));
  }, [rules, devices, editingId]);

  const compatibleRulesForType = useMemo(
    () =>
      rules.filter(
        (rule) => isCompatibleRule(rule) && String(rule.asset_type?.id ?? '') === form.asset_type_id
      ),
    [rules, form.asset_type_id]
  );

  const deviceRuleForForm = useMemo(
    () => rules.find((rule) => String(rule.device_id ?? rule.device?.id ?? '') === form.device_id),
    [form.device_id, rules]
  );
  const observedDeviceTypeIds = deviceAssetTypeProfiles[form.device_id] || [];
  const lockDeviceAssetType =
    Boolean(editingId) &&
    form.scope === 'DEVICE' &&
    observedDeviceTypeIds.length === 0 &&
    Boolean(deviceRuleForForm) &&
    isCompatibleRule(deviceRuleForForm);

  const availableAssetTypes = useMemo(() => {
    const typeIds = new Set(
      rules.filter(isCompatibleRule).map((rule) => String(rule.asset_type?.id ?? ''))
    );
    return catalogs.assetTypes.filter((item) => {
      const itemId = String(item.id);
      if (!typeIds.has(itemId)) return false;
      if (observedDeviceTypeIds.length) return observedDeviceTypeIds.includes(itemId);
      if (lockDeviceAssetType) return itemId === String(deviceRuleForForm?.asset_type?.id);
      return true;
    });
  }, [catalogs.assetTypes, deviceRuleForForm, lockDeviceAssetType, observedDeviceTypeIds, rules]);

  const availableExtensions = useMemo(() => {
    const extensionIds = new Set(
      compatibleRulesForType.map((rule) =>
        rule.extension?.id == null ? NO_EXTENSION : String(rule.extension.id)
      )
    );
    return catalogs.extensions.filter((item) => extensionIds.has(String(item.id)));
  }, [catalogs.extensions, compatibleRulesForType]);

  const compatibleRulesForExtension = useMemo(
    () =>
      compatibleRulesForType.filter((rule) =>
        form.extension_id === NO_EXTENSION
          ? rule.extension?.id == null
          : String(rule.extension?.id ?? '') === form.extension_id
      ),
    [compatibleRulesForType, form.extension_id]
  );

  const availableAreas = useMemo(() => {
    return catalogs.areas;
  }, [catalogs.areas]);

  const availableClassifications = useMemo(() => {
    const typeCode = catalogs.assetTypes.find(
      (type) => String(type.id) === form.asset_type_id
    )?.code;
    return catalogs.classifications.filter((item) =>
      isClassificationCompatible(typeCode, item.code_new)
    );
  }, [catalogs.assetTypes, catalogs.classifications, form.asset_type_id]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (rule) => {
    setEditingId(rule.id);
    const normalizedForm = normalizeRule(rule);
    const observedTypeIds = deviceAssetTypeProfiles[String(rule.device_id)] || [];
    if (observedTypeIds.length && !observedTypeIds.includes(normalizedForm.asset_type_id)) {
      normalizedForm.asset_type_id = observedTypeIds.length === 1 ? observedTypeIds[0] : '';
      normalizedForm.extension_id = '';
      normalizedForm.administrative_area_id = '';
      normalizedForm.classification_id = '';
    }
    setForm(normalizedForm);
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const updateForm = (field, value) => {
    setFormError(null);
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'scope' && value === 'DEVICE') next.is_default = false;
      if (field === 'scope' && value === 'GENERIC') next.device_id = '';
      if (field === 'device_id') {
        const typeIds = deviceAssetTypeProfiles[value] || [];
        next.asset_type_id =
          typeIds.length === 1
            ? typeIds[0]
            : typeIds.includes(current.asset_type_id)
              ? current.asset_type_id
              : '';
        next.extension_id = '';
        next.administrative_area_id = '';
        next.classification_id = '';
      }
      if (field === 'asset_type_id') {
        next.extension_id = '';
        next.administrative_area_id = '';
        next.classification_id = '';
      }
      if (field === 'extension_id') {
        next.administrative_area_id = '';
        next.classification_id = '';
      }
      if (field === 'administrative_area_id') next.classification_id = '';
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.scope === 'DEVICE' && !form.device_id) {
      setFormError('Seleccione un device para una regla específica.');
      return;
    }
    if (form.scope === 'GENERIC' && !form.asset_type_id) {
      setFormError('Seleccione un asset type para una regla genérica.');
      return;
    }
    if (!form.classification_id) {
      setFormError('Seleccione una clasificación patrimonial.');
      return;
    }
    if (!availableClassifications.some((item) => String(item.id) === form.classification_id)) {
      setFormError('Esa clasificación no corresponde a la combinación seleccionada.');
      return;
    }
    if (!form.administrative_area_id) {
      setFormError('Seleccione un área administrativa para guardar la regla.');
      return;
    }

    const payload = {
      device_id: form.scope === 'DEVICE' ? Number(form.device_id) : null,
      asset_type_id: Number(form.asset_type_id),
      extension_id:
        form.extension_id && form.extension_id !== NO_EXTENSION ? Number(form.extension_id) : null,
      administrative_area_id: Number(form.administrative_area_id),
      classification_id: Number(form.classification_id),
      is_default: form.scope === 'GENERIC' && Boolean(form.is_default),
      active: Boolean(form.active),
    };

    if (payload.device_id === null) {
      const duplicateGenericRule = rules.find((rule) => {
        const existingAreaId = rule.administrative_area?.id ?? null;
        return (
          rule.id !== editingId &&
          rule.device_id == null &&
          Number(rule.classification?.id) === payload.classification_id &&
          Number(rule.asset_type?.id) === payload.asset_type_id &&
          (rule.extension?.id ?? null) === payload.extension_id &&
          existingAreaId === payload.administrative_area_id
        );
      });
      if (duplicateGenericRule) {
        setFormError(
          'Ya existe una regla genérica para esta clasificación y alcance. Edita la existente.'
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`${RULES_URL}/${editingId}`, payload);
      } else {
        await api.post(RULES_URL, payload);
      }
      const successText = editingId
        ? 'Regla actualizada correctamente.'
        : 'Regla creada correctamente.';
      closeForm();
      await loadData();
      setMessage({ type: 'success', text: successText });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule) => {
    if (!canUpdate) return;
    try {
      await api.patch(`${RULES_URL}/${rule.id}/status`, { active: !rule.active });
      await loadData();
      setMessage({ type: 'success', text: rule.active ? 'Regla desactivada.' : 'Regla activada.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Clasificación patrimonial
          </p>
          <h2 className="text-2xl font-semibold text-slate-800">Reglas de clasificación</h2>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Nueva regla
          </button>
        )}
      </div>

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
        >
          {message.text}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? 'Editar regla' : 'Nueva regla'}
        size="xl"
        closeOnOverlayClick={!saving}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="classification-rule-form"
              disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear regla'}
            </button>
          </div>
        }
      >
        <form id="classification-rule-form" onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Tipo de regla
              <select
                value={form.scope}
                onChange={(e) => updateForm('scope', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                disabled={Boolean(editingId)}
              >
                <option value="DEVICE">Específica por device</option>
                <option value="GENERIC">Genérica</option>
              </select>
            </label>
            {form.scope === 'DEVICE' && (
              <label className="text-sm font-medium text-slate-700">
                Device
                <select
                  required
                  value={form.device_id}
                  onChange={(e) => updateForm('device_id', e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Seleccione...</option>
                  {availableDevices.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm font-medium text-slate-700">
              Asset Type
              <select
                required
                value={form.asset_type_id}
                onChange={(e) => updateForm('asset_type_id', e.target.value)}
                disabled={lockDeviceAssetType}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">Seleccione...</option>
                {availableAssetTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.name}
                  </option>
                ))}
              </select>
              {lockDeviceAssetType && (
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Este equipo ya tiene un tipo definido por su regla vigente.
                </span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              Extension
              <select
                value={form.extension_id}
                onChange={(e) => updateForm('extension_id', e.target.value)}
                disabled={!form.asset_type_id || availableExtensions.length === 0}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">
                  {form.asset_type_id ? 'Seleccione...' : 'Seleccione primero un tipo'}
                </option>
                {compatibleRulesForType.some((rule) => rule.extension?.id == null) && (
                  <option value={NO_EXTENSION}>Sin extensión</option>
                )}
                {availableExtensions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Área administrativa
              <select
                value={form.administrative_area_id}
                onChange={(e) => updateForm('administrative_area_id', e.target.value)}
                disabled={!form.extension_id || availableAreas.length === 0}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">
                  {form.extension_id ? 'Seleccione...' : 'Seleccione primero una extensión'}
                </option>
                {availableAreas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Clasificación
              <select
                required
                value={form.classification_id}
                onChange={(e) => updateForm('classification_id', e.target.value)}
                disabled={!form.administrative_area_id || availableClassifications.length === 0}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">
                  {form.administrative_area_id ? 'Seleccione...' : 'Seleccione primero un área'}
                </option>
                {availableClassifications.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code_new} · {item.description}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateForm('active', e.target.checked)}
              />{' '}
              Activa
            </label>
            {form.scope === 'GENERIC' && (
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => updateForm('is_default', e.target.checked)}
                />{' '}
                Predeterminada
              </label>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Las clasificaciones provienen del catálogo completo y se filtran por tipo de activo.
            Puede crear reglas con clasificaciones que aún no tengan reglas guardadas.
          </p>
        </form>
      </Modal>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter className="h-4 w-4" /> Filtros
          </div>
          <label className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={deviceSearch}
              onChange={(event) => setDeviceSearch(event.target.value)}
              placeholder="Buscar reglas por equipo..."
              aria-label="Buscar reglas por equipo"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {deviceSearch && (
              <button
                type="button"
                onClick={() => setDeviceSearch('')}
                aria-label="Limpiar búsqueda de equipo"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {[
            [
              'scope',
              'Tipo',
              [
                ['DEVICE', 'Específica'],
                ['GENERIC', 'Genérica'],
              ],
            ],
            ['device', 'Device', devices.map((item) => [item.id, item.name])],
            ['assetType', 'Asset Type', catalogs.assetTypes.map((item) => [item.id, item.code])],
            ['extension', 'Extension', catalogs.extensions.map((item) => [item.id, item.code])],
            ['area', 'Área', catalogs.areas.map((item) => [item.id, item.name])],
            [
              'classification',
              'Clasificación',
              catalogs.classifications.map((item) => [item.id, item.code_new]),
            ],
            [
              'active',
              'Estado',
              [
                ['true', 'Activa'],
                ['false', 'Inactiva'],
              ],
            ],
            [
              'default',
              'Default',
              [
                ['true', 'Sí'],
                ['false', 'No'],
              ],
            ],
          ].map(([key, label, options]) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) => setFilters((current) => ({ ...current, [key]: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
              aria-label={label}
            >
              <option value="">{label}</option>
              {options.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              {[
                'Tipo',
                'Device',
                'Asset Type',
                'Extension',
                'Área administrativa',
                'Código patrimonial',
                'Clasificación',
                'Default',
                'Estado',
                'Acciones',
              ].map((heading) => (
                <th key={heading} className="px-3 py-3 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="px-3 py-8 text-center text-slate-500">
                  Cargando reglas...
                </td>
              </tr>
            ) : filteredRules.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-3 py-8 text-center text-slate-500">
                  No hay reglas para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => {
                const specific =
                  (rule.scope || (rule.device_id ? 'DEVICE' : 'GENERIC')) === 'DEVICE';
                return (
                  <tr key={rule.id} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${specific ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {specific ? 'Específica' : 'Genérica'}
                      </span>
                    </td>
                    <td className="px-3 py-3">{rule.device?.name || '—'}</td>
                    <td className="px-3 py-3">{rule.asset_type?.code || '—'}</td>
                    <td className="px-3 py-3">{rule.extension?.code || '—'}</td>
                    <td className="px-3 py-3">
                      {rule.administrative_area?.name || 'Sin área asignada'}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {rule.classification?.code_new || '—'}
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      {rule.classification?.description || '—'}
                    </td>
                    <td className="px-3 py-3">
                      {rule.is_default ? <Check className="h-4 w-4 text-emerald-600" /> : '—'}
                    </td>
                    <td className="px-3 py-3">
                      {rule.active ? (
                        <span className="text-emerald-700">Activa</span>
                      ) : (
                        <span className="text-slate-500">Inactiva</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => openEdit(rule)}
                            className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
