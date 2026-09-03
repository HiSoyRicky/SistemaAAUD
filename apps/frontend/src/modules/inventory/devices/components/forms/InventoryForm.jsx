// InventoryFormModal.jsx

import {
  BadgeCheck,
  Boxes,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  Cpu,
  Info,
  MapPinned,
  Settings2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import UbiDepSelector from '../../../../../shared/common/UbiDepSelector';
import useAuth from '../../../../../shared/hooks/useAuth';
import {
  formatDateOnlyToDDMMYYYY,
  toDateOnlyInputValue,
} from '../../../../../shared/utils/formatDate';
import { Inventory } from '../../services/inventory.api';

const validateInventoryForm = (formData, isDiscardedStatus) => {
  const errors = {};

  if (!formData.tag.trim()) {
    errors.tag = 'El marbete es obligatorio';
  }

  if (!isDiscardedStatus && !formData.id_ubication) {
    errors.id_ubication = 'Seleccione una ubicación';
  }

  if (!isDiscardedStatus && !formData.id_department) {
    errors.id_department = 'Seleccione un departamento';
  }

  const hasTechnologySelection =
    formData.id_device || formData.id_brand || formData.id_model || formData.ip;

  if (hasTechnologySelection) {
    if (!formData.id_device) {
      errors.id_device = 'Seleccione un equipo';
    }

    if (!formData.id_brand) {
      errors.id_brand = 'Seleccione una marca';
    }

    if (!formData.id_model) {
      errors.id_model = 'Seleccione un modelo';
    }
  }

  if (!formData.id_status) {
    errors.id_status = 'Seleccione un estado';
  }

  if (!formData.serie.trim()) {
    errors.serie = 'La serie es obligatoria';
  }

  const ip = formData.ip?.trim();

  if (ip && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    errors.ip = 'La IP no es válida';
  }

  return errors;
};

export default function InventoryFormModal({ initialData = {}, onCancel, onSubmit }) {
  const isEdit = !!initialData.id;
  const { hasPermission } = useAuth();
  const canFullEdit = !isEdit || hasPermission('inventory.update');
  const canEditLocation = !isEdit || canFullEdit || hasPermission('inventory.update_location');
  const canEditDepartment = !isEdit || canFullEdit || hasPermission('inventory.update_department');
  const canEditAssignee = !isEdit || canFullEdit || hasPermission('inventory.update_assignee');
  const canEditAdministrativeArea =
    !isEdit || canFullEdit || hasPermission('inventory.update_administrative_area');

  const [formData, setFormData] = useState({
    tag: initialData.tag || '',
    id_ubication: initialData.id_ubication || null,
    id_department: initialData.id_department || null,
    id_administrative_area: initialData.id_administrative_area || null,
    asset_type_id: initialData.asset_type_id || null,
    extension_id: initialData.extension_id || null,
    user: initialData.user || '',
    id_device: initialData.id_device || '',
    id_brand: initialData.id_brand || '',
    id_model: initialData.id_model || '',
    asset_classification_rule_id: initialData.classification_rule?.id || null,
    serie: initialData.serie || '',
    ip: initialData.ip || '',
    id_status: initialData.id_status || null,
    transferdate: initialData.transferdate
      ? formatDateOnlyToDDMMYYYY(initialData.transferdate)
      : '',
    transferDateInput: initialData.transferdate
      ? toDateOnlyInputValue(initialData.transferdate)
      : '',
    observation: initialData.observation || '',
  });

  const [errors, setErrors] = useState({});
  const [safeMode, setSafeMode] = useState(!!isEdit);
  const [unlocked, setUnlocked] = useState(() => ({}));
  const [showAdvancedClassification, setShowAdvancedClassification] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(() => ({}));
  const [options, setOptions] = useState({
    devices: [],
    brands: [],
    models: [],
    statuses: [],
    administrativeAreas: [],
    assetTypes: [],
    extensions: [],
    classificationRules: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const ALLOWED_STATUS = new Set([
    'Buen estado',
    'Mal estado',
    'Para descarte',
    'Nuevo',
    'Descartado',
  ]);

  const normalizeText = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

  //  Cargar opciones para los selectores
  useEffect(() => {
    async function fetchOptions() {
      try {
        setLoadingOptions(true);
        const [devices, brands, models, statuses, administrativeAreas, assetTypes, extensions] =
          await Promise.all([
            Inventory.fetchDeviceTypes(),
            Inventory.fetchBrands(),
            Inventory.fetchModels(),
            Inventory.fetchStatuses(),
            Inventory.fetchAdministrativeAreas(),
            Inventory.fetchAssetTypes(),
            Inventory.fetchAssetExtensions(),
          ]);
        setOptions({
          devices,
          brands,
          models,
          statuses,
          administrativeAreas,
          assetTypes,
          extensions,
          classificationRules: [],
        });

        if (isEdit) {
          setFormData((previous) => ({
            ...previous,
            asset_type_id:
              previous.asset_type_id ||
              initialData.classification_rule?.asset_type?.id ||
              assetTypes.find((item) => item.code === 'TECHNOLOGY')?.id ||
              null,
            extension_id:
              previous.extension_id ||
              (initialData.technology
                ? extensions.find((item) => item.code === 'DEVICES')?.id
                : initialData.classification_rule?.extension?.id) ||
              null,
          }));
        }
      } catch (error) {
        console.error('Error fetching options:', error);
        setFetchError('Error al cargar opciones. Verifica la conexión o el backend.');
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  // Filtra IDs de marcas por el equipo seleccionado
  const filteredBrandIds = new Set(
    options.models
      .filter((m) => String(m.id_device) === String(formData.id_device))
      .map((m) => m.id_brand)
  );

  // Filtra marcas por el equipo seleccionado
  const filteredBrands = options.brands.filter((b) => filteredBrandIds.has(b.id));

  // Filtra modelos por marca Y por el equipo seleccionado
  const filteredModels = options.models.filter(
    (m) =>
      String(m.id_brand) === String(formData.id_brand) &&
      String(m.id_device) === String(formData.id_device)
  );

  const selectedStatus = options.statuses.find(
    (status) => String(status.id) === String(formData.id_status)
  );
  const [resolvedClassificationRule, setResolvedClassificationRule] = useState(
    initialData.classification_rule || null
  );

  useEffect(() => {
    let cancelled = false;

    if (!formData.id_device) {
      setResolvedClassificationRule(null);
      setFormData((prev) => ({
        ...prev,
        asset_classification_rule_id: null,
      }));
      return undefined;
    }

    Inventory.resolveClassificationRule({
      device_id: Number(formData.id_device),
      asset_type_id: formData.asset_type_id || null,
      extension_id: formData.extension_id || null,
      administrative_area_id: formData.id_administrative_area || null,
    })
      .then((result) => {
        if (cancelled) return;
        setResolvedClassificationRule(
          result?.asset_classification_rule_id
            ? {
                id: result.asset_classification_rule_id,
                classification: result.classification,
                asset_type: result.asset_type,
                extension: result.extension,
                administrative_area: result.administrative_area,
              }
            : null
        );
        setFormData((prev) => ({
          ...prev,
          asset_classification_rule_id: result?.asset_classification_rule_id ?? null,
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        setResolvedClassificationRule(null);
        setErrors((prev) => ({
          ...prev,
          classification: error.response?.data?.message || 'No se pudo resolver la clasificación',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [
    formData.id_device,
    formData.id_administrative_area,
    formData.asset_type_id,
    formData.extension_id,
  ]);

  useEffect(() => {
    if (!formData.id_device || formData.asset_type_id || formData.extension_id) {
      return;
    }

    const technologyType = options.assetTypes.find((item) => item.code === 'TECHNOLOGY');
    const devicesExtension = options.extensions.find((item) => item.code === 'DEVICES');

    if (!technologyType || !devicesExtension) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      asset_type_id: technologyType.id,
      extension_id: devicesExtension.id,
    }));
  }, [
    formData.id_device,
    formData.asset_type_id,
    formData.extension_id,
    options.assetTypes,
    options.extensions,
  ]);

  const isDiscardedStatus = normalizeText(selectedStatus?.name) === 'DESCARTADO';
  const selectedContextExtension = options.extensions.find(
    (extension) => String(extension.id) === String(formData.extension_id)
  );
  const selectedAdministrativeArea = options.administrativeAreas.find(
    (area) => String(area.id) === String(formData.id_administrative_area)
  );
  const selectedAssetType = options.assetTypes.find(
    (assetType) => String(assetType.id) === String(formData.asset_type_id)
  );

  useEffect(() => {
    if (!isDiscardedStatus) return;

    if (formData.id_ubication === null && formData.id_department === null) return;

    setFormData((prev) => ({
      ...prev,
      id_ubication: null,
      id_department: null,
    }));
    setErrors((prev) => ({ ...prev, id_ubication: '', id_department: '' }));
  }, [isDiscardedStatus, formData.id_ubication, formData.id_department]);

  // Manejo de cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'transferDateInput') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        transferdate: value ? formatDateOnlyToDDMMYYYY(value) : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Manejo de cambios en ubicación y departamento desde UbiDepSelector
  const handleUbiDepChange = ({ id_ubication, id_department }) => {
    setFormData((prev) => {
      const nextData = { ...prev };

      if (canEditLocation) {
        nextData.id_ubication = id_ubication ? Number.parseInt(id_ubication) : null;
      }
      if (canEditDepartment) {
        nextData.id_department = id_department ? Number.parseInt(id_department) : null;
      }

      return nextData;
    });
    setErrors((prev) => ({ ...prev, id_ubication: '', id_department: '' }));
  };

  // Validación y envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateInventoryForm(formData, isDiscardedStatus);

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const transferdate = formData.transferDateInput || null;

    const completeSubmitData = {
      ...formData,
      transferdate,
      id_ubication: isDiscardedStatus ? null : formData.id_ubication,
      id_department: isDiscardedStatus ? null : formData.id_department,
      id_administrative_area: formData.id_administrative_area || null,
      asset_type_id: formData.asset_type_id || null,
      extension_id: formData.extension_id || null,
      user: formData.user.trim() === '' ? null : formData.user,
      ip: formData.ip.trim() === '' ? null : formData.ip,
      observation: formData.observation.trim() === '' ? null : formData.observation,
    };

    completeSubmitData.asset_classification_rule_id = resolvedClassificationRule?.id ?? null;

    const submitData =
      isEdit && !canFullEdit
        ? {
            ...(canEditLocation && {
              id_ubication: completeSubmitData.id_ubication,
            }),
            ...(canEditDepartment && {
              id_department: completeSubmitData.id_department,
            }),
            ...(canEditAssignee && {
              user: completeSubmitData.user,
            }),
            ...(canEditAdministrativeArea && {
              id_administrative_area: completeSubmitData.id_administrative_area,
            }),
          }
        : completeSubmitData;

    onSubmit(submitData);
  };

  // Manejo de error en fetch de opciones
  if (fetchError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-40">
        <div className="w-full max-w-lg p-6 bg-white shadow-xl rounded-xl">
          <p className="text-red-500">{fetchError}</p>
          <button type="button" onClick={onCancel} className="px-4 py-2 mt-4 bg-gray-300 rounded">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const LOCKED_ON_EDIT = new Set([
    'tag',
    'id_device',
    'id_brand',
    'id_model',
    'serie',
    'id_ubication',
    'id_department',
  ]);

  const EDITABLE_ALWAYS = new Set(['user', 'ip', 'id_status', 'transferDateInput', 'observation']);

  const isFieldLocked = (name) => {
    if (!isEdit) return false;
    if (!canFullEdit) {
      if (name === 'user') return !canEditAssignee;
      return true;
    }
    if (EDITABLE_ALWAYS.has(name)) return false;
    if (!LOCKED_ON_EDIT.has(name)) return false;
    return safeMode && !unlocked[name];
  };

  const toggleField = (name) => {
    if (!canFullEdit) return;
    setUnlocked((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleSection = (name) => {
    setCollapsedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const classificationCode = resolvedClassificationRule?.classification?.code_new || 'Sin regla';
  const classificationDescription =
    resolvedClassificationRule?.classification?.description || 'Contexto pendiente';
  const classificationType =
    resolvedClassificationRule?.asset_type?.code ||
    selectedAssetType?.code ||
    resolvedClassificationRule?.asset_type?.name ||
    'Tipo';
  const classificationExtension =
    resolvedClassificationRule?.extension?.code ||
    selectedContextExtension?.code ||
    resolvedClassificationRule?.extension?.name ||
    'Sin extensión';
  const classificationArea =
    resolvedClassificationRule?.administrative_area?.name ||
    selectedAdministrativeArea?.name ||
    'Global';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-3">
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950 md:text-xl">
              {isEdit ? `Editar equipo #${formData.tag}` : 'Agregar equipo al inventario'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Información patrimonial, técnica y de asignación.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {isEdit && canFullEdit && (
          <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-5 py-2">
            <span className="text-xs text-gray-600">Edición segura</span>
            <button
              type="button"
              onClick={() => setSafeMode((v) => !v)}
              className={`px-3 py-1 text-xs rounded-full border ${
                safeMode ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
              title={safeMode ? 'Modo seguro (bloqueado)' : 'Modo libre (todo editable)'}
            >
              {safeMode ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        )}

        {loadingOptions ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Cargando opciones...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <CompactSection
                title="Ubicación"
                icon={MapPinned}
                collapsed={collapsedSections.location}
                onToggle={() => toggleSection('location')}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <UbiDepSelector
                      id_ubication={formData.id_ubication}
                      id_department={formData.id_department}
                      onChange={handleUbiDepChange}
                      disabled={isDiscardedStatus}
                      disabledUbication={!canEditLocation}
                      disabledDepartment={!canEditDepartment}
                      errors={{
                        ubication: errors.id_ubication,
                        department: errors.id_department,
                      }}
                      mode="inventory"
                      compact
                    />
                  </div>
                </div>
                {isDiscardedStatus && (
                  <p className="mt-2 text-xs text-slate-500">
                    Para estado descartado, ubicación y departamento se limpian automáticamente.
                  </p>
                )}
              </CompactSection>

              <CompactSection
                title="Estado y asignación"
                icon={BriefcaseBusiness}
                collapsed={collapsedSections.assignment}
                onToggle={() => toggleSection('assignment')}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InputField
                    label="Usuario"
                    name="user"
                    value={formData.user}
                    onChange={handleChange}
                    locked={!canEditAssignee}
                  />
                  <SelectField
                    label="Estado *"
                    name="id_status"
                    value={formData.id_status}
                    onChange={handleChange}
                    options={options.statuses
                      .filter((s) => ALLOWED_STATUS.has(s.name))
                      .map((s) => ({ id: s.id, name: s.name }))}
                    error={errors.id_status}
                    locked={!canFullEdit}
                  />
                </div>
              </CompactSection>

              <CompactSection
                title="Identificación del equipo"
                icon={Cpu}
                collapsed={collapsedSections.identity}
                onToggle={() => toggleSection('identity')}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <InputField
                    label="Marbete *"
                    name="tag"
                    value={formData.tag}
                    onChange={handleChange}
                    error={errors.tag}
                    locked={isFieldLocked('tag')}
                    onToggle={() => toggleField('tag')}
                  />
                  <SelectField
                    label="Nombre del equipo *"
                    name="id_device"
                    value={formData.id_device}
                    onChange={handleChange}
                    options={options.devices.map((d) => ({
                      id: d.id,
                      name: d.name,
                    }))}
                    error={errors.id_device}
                    locked={isFieldLocked('id_device')}
                    onToggle={() => toggleField('id_device')}
                  />
                  <InputField
                    label="Serie *"
                    name="serie"
                    value={formData.serie}
                    onChange={handleChange}
                    error={errors.serie}
                    locked={isFieldLocked('serie')}
                    onToggle={() => toggleField('serie')}
                  />
                  <SelectField
                    label="Marca *"
                    name="id_brand"
                    value={formData.id_brand}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData((prev) => ({ ...prev, id_model: '' }));
                    }}
                    options={filteredBrands.map((b) => ({
                      id: b.id,
                      name: b.name,
                    }))}
                    error={errors.id_brand}
                    disabled={!formData.id_device}
                    locked={isFieldLocked('id_brand')}
                    onToggle={() => toggleField('id_brand')}
                  />
                  <SelectField
                    label="Modelo *"
                    name="id_model"
                    value={formData.id_model}
                    onChange={handleChange}
                    options={filteredModels.map((m) => ({
                      id: m.id,
                      name: m.name,
                    }))}
                    error={errors.id_model}
                    disabled={!formData.id_brand}
                    locked={isFieldLocked('id_model')}
                    onToggle={() => toggleField('id_model')}
                  />
                </div>
              </CompactSection>

              <CompactSection
                title="Información técnica"
                icon={Boxes}
                collapsed={collapsedSections.technical}
                onToggle={() => toggleSection('technical')}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InputField
                    label="IP"
                    name="ip"
                    value={formData.ip}
                    onChange={handleChange}
                    error={errors.ip}
                    locked={!canFullEdit}
                  />
                  <DateField
                    label="Fecha de traslado"
                    name="transferDateInput"
                    value={formData.transferDateInput}
                    onChange={handleChange}
                    disabled={!canFullEdit}
                  />
                </div>
              </CompactSection>

              <CompactSection
                title="Clasificación patrimonial"
                icon={BadgeCheck}
                collapsed={collapsedSections.classification}
                onToggle={() => toggleSection('classification')}
                action={
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <BadgeCheck size={12} />
                    Automática
                  </span>
                }
              >
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {classificationCode} — {classificationDescription}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {classificationType} · {classificationExtension} · {classificationArea}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedClassification((value) => !value)}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Settings2 size={14} />
                      {showAdvancedClassification ? 'Ocultar avanzada' : 'Mostrar avanzada'}
                      <ChevronDown
                        size={14}
                        className={`transition ${showAdvancedClassification ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                  {!resolvedClassificationRule && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                      <Info size={13} />
                      Sin clasificación configurada para el contexto seleccionado.
                    </p>
                  )}
                  {errors.classification && (
                    <p className="mt-2 text-xs text-red-600">{errors.classification}</p>
                  )}
                </div>

                {showAdvancedClassification && (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <SelectField
                      label="Tipo general de activo"
                      name="asset_type_id"
                      value={formData.asset_type_id || ''}
                      onChange={handleChange}
                      options={options.assetTypes.map((item) => ({
                        id: item.id,
                        name: `${item.code} — ${item.name}`,
                      }))}
                      locked={false}
                    />
                    <SelectField
                      label="Extensión técnica"
                      name="extension_id"
                      value={formData.extension_id || ''}
                      onChange={handleChange}
                      options={[
                        { id: '', name: 'Sin extensión' },
                        ...options.extensions.map((item) => ({
                          id: item.id,
                          name: `${item.code} — ${item.name}`,
                        })),
                      ]}
                      locked={false}
                    />
                    <SelectField
                      label="Área administrativa"
                      name="id_administrative_area"
                      value={formData.id_administrative_area}
                      onChange={handleChange}
                      options={options.administrativeAreas}
                      locked={!canEditAdministrativeArea}
                    />
                  </div>
                )}
              </CompactSection>

              <CompactSection
                title="Información adicional"
                icon={ClipboardList}
                collapsed={collapsedSections.additional}
                onToggle={() => toggleSection('additional')}
              >
                <TextAreaField
                  label="Observaciones / ubicación anterior"
                  name="observation"
                  value={formData.observation}
                  onChange={handleChange}
                  disabled={!canFullEdit}
                  maxLength={255}
                />
              </CompactSection>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3">
              <button
                type="button"
                onClick={onCancel}
                className="h-9 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

//  Reutilizables
function CompactSection({ title, icon: Icon, children, collapsed, onToggle, action }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm">
            <Icon size={15} />
          </span>
          <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
          <ChevronDown
            size={15}
            className={`shrink-0 text-slate-400 transition ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
        {action}
      </div>
      {!collapsed && <div className="border-t border-slate-200 px-3 py-3">{children}</div>}
    </section>
  );
}

function InputField({ label, name, value, onChange, error, locked, onToggle }) {
  return (
    <div>
      <div className="mb-1 flex min-h-5 items-center justify-between gap-2">
        <label htmlFor={name} className="block truncate text-xs font-semibold text-slate-700">
          {label}
        </label>
        {locked !== undefined && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 text-[11px] font-medium text-blue-600 hover:text-blue-800"
          >
            {locked ? 'Editar' : 'Bloquear'}
          </button>
        )}
      </div>

      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        disabled={!!locked}
        className={`h-9 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${locked ? 'cursor-not-allowed bg-slate-100 text-slate-500' : 'bg-white text-slate-900'}`}
      />
      {error && (
        <div className="flex items-start gap-2 mt-1 text-xs text-red-600">
          <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold">
            !
          </span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, disabled = false, maxLength }) {
  const currentLength = value?.length ?? 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={name} className="text-xs font-semibold text-slate-700">
          {label}
        </label>

        {maxLength && (
          <span className="text-[11px] text-slate-500">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength}
        rows={3}
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
          disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500' : 'bg-white text-slate-900'
        }`}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  disabled = false,
  error,
  locked,
  onToggle,
}) {
  const finalDisabled = disabled || !!locked;

  return (
    <div>
      <div className="mb-1 flex min-h-5 items-center justify-between gap-2">
        <label htmlFor={name} className="block truncate text-xs font-semibold text-slate-700">
          {label}
        </label>
        {locked !== undefined && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 text-[11px] font-medium text-blue-600 hover:text-blue-800"
          >
            {locked ? 'Editar' : 'Bloquear'}
          </button>
        )}
      </div>

      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={finalDisabled}
        className={`h-9 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${
          finalDisabled
            ? 'cursor-not-allowed bg-slate-100 text-slate-500'
            : 'bg-white text-slate-900'
        }`}
      >
        <option value="">Selecciona {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>

      {error && (
        <div className="flex items-start gap-2 mt-1 text-xs text-red-600">
          <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold">
            !
          </span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function DateField({ label, name, value, onChange, disabled }) {
  return (
    <div>
      <div className="mb-1 flex min-h-5 items-center">
        <label htmlFor={name} className="block truncate text-xs font-semibold text-slate-700">
          {label}
        </label>
      </div>
      <input
        id={name}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
          disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500' : 'bg-white text-slate-900'
        }`}
      />
    </div>
  );
}
