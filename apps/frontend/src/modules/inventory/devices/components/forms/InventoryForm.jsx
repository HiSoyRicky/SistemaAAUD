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
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import UbiDepSelector from '../../../../../shared/common/UbiDepSelector';
import ModalLayer from '../../../../../shared/components/ui/ModalLayer';
import useAuth from '../../../../../shared/hooks/useAuth';
import {
  formatDateOnlyToDDMMYYYY,
  toDateOnlyInputValue,
} from '../../../../../shared/utils/formatDate';
import { Inventory } from '../../services/inventory.api';

const validateInventoryForm = (
  formData,
  isDiscardedStatus,
  isTechnology,
  hasSelectedItem,
  isVehicle,
  hasVehicleCatalog
) => {
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

  if (!formData.asset_type_id) {
    errors.asset_type_id = 'Seleccione primero el tipo de bien';
  }

  if (!hasSelectedItem) {
    errors.item_selection = 'Seleccione una clasificación o bien';
  }

  if (isTechnology) {
    if (!formData.id_brand) {
      errors.id_brand = 'Seleccione una marca';
    }

    if (!formData.id_model) {
      errors.id_model = 'Seleccione un modelo';
    }
  }

  const ip = formData.ip?.trim();

  if (ip && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    errors.ip = 'La IP no es válida';
  }

  if (!formData.id_status) {
    errors.id_status = 'Seleccione un estado';
  }

  if (isTechnology && !formData.serie.trim()) {
    errors.serie = 'La serie es obligatoria';
  }
  if (isVehicle && !hasVehicleCatalog) {
    errors.vehicle_catalog_id =
      'Seleccione marca, modelo, año, tipo y combustible desde el catálogo';
  }

  return errors;
};

const PROPERTY_MATERIALS = [
  'Metal',
  'Madera',
  'Plástico',
  'Vidrio',
  'Tela',
  'Concreto',
  'Aluminio',
  'Acero',
  'Cuero',
  'Otro',
];

export default function InventoryFormModal({ initialData = {}, onCancel, onSubmit }) {
  const isEdit = !!initialData.id;
  const { hasPermission } = useAuth();
  const canFullEdit = !isEdit || hasPermission('inventory.update');
  const canEditLocation = !isEdit || canFullEdit || hasPermission('inventory.update_location');
  const canEditDepartment = !isEdit || canFullEdit || hasPermission('inventory.update_department');
  const canEditAssignee = !isEdit || canFullEdit || hasPermission('inventory.update_assignee');

  const [formData, setFormData] = useState({
    tag: initialData.tag || '',
    id_ubication: initialData.id_ubication || null,
    id_department: initialData.id_department || null,
    id_administrative_area: initialData.id_administrative_area || '',
    user: initialData.user || '',
    id_device: initialData.id_device || '',
    asset_type_id:
      initialData.asset_type?.id || initialData.classification_rule?.asset_type?.id || '',
    extension_id: initialData.extension?.extension?.id || '',
    classification_rule_id: initialData.classification_rule?.id || '',
    item_selection: initialData.classification_rule?.id
      ? `rule:${initialData.classification_rule.id}`
      : initialData.id_device
        ? `device:${initialData.id_device}`
        : '',
    id_brand: initialData.id_brand || '',
    id_model: initialData.id_model || '',
    serie: initialData.serie || '',
    vehicle_make: initialData.vehicle_details?.make || '',
    vehicle_model: initialData.vehicle_details?.model || '',
    vehicle_model_year: initialData.vehicle_details?.model_year || '',
    vehicle_catalog_brand_id: '',
    vehicle_catalog_model_id: '',
    vehicle_catalog_year: '',
    vehicle_catalog_type: '',
    vehicle_catalog_fuel: '',
    vehicle_catalog_id: initialData.vehicle_details?.catalog_id || '',
    vehicle_plate: initialData.vehicle_details?.plate || '',
    vehicle_engine: initialData.vehicle_details?.engine || '',
    vehicle_chassis: initialData.vehicle_details?.chassis || '',
    vehicle_mileage: initialData.vehicle_details?.mileage ?? '',
    cadastral_number: initialData.real_estate_details?.cadastral_number || '',
    real_estate_address: initialData.real_estate_details?.address || '',
    real_estate_area_m2: initialData.real_estate_details?.area_m2 || '',
    real_estate_location_geo: initialData.real_estate_details?.location_geo || '',
    property_material: initialData.property_details?.material || '',
    property_dimensions: initialData.property_details?.dimensions || '',
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
  const [collapsedSections, setCollapsedSections] = useState(() => ({}));
  const [options, setOptions] = useState({
    devices: [],
    brands: [],
    models: [],
    statuses: [],
    assetTypes: [],
    assetExtensions: [],
    classificationRules: [],
    vehicleCatalog: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const requestCatalogCreation = async (type, idBrand = null, idDevice = null) => {
    const name = window
      .prompt(`Nombre de la nueva ${type === 'BRAND' ? 'marca' : 'modelo'}:`)
      ?.trim();
    if (!name) return;
    try {
      const payload =
        type === 'BRAND'
          ? { name }
          : {
              name,
              id_brand: Number(idBrand),
              id_device: idDevice == null || idDevice === '' ? null : Number(idDevice),
            };
      await Inventory.requestCreation(type, payload);
      window.alert(
        'Solicitud enviada al administrador. Podrás seleccionar el registro cuando sea aprobada.'
      );
    } catch (error) {
      window.alert(error.response?.data?.message || 'No se pudo enviar la solicitud.');
    }
  };

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

  useEffect(() => {
    async function fetchOptions() {
      try {
        setLoadingOptions(true);
        const [
          devices,
          brands,
          models,
          statuses,
          assetTypes,
          assetExtensions,
          classificationRules,
          vehicleCatalog,
        ] = await Promise.all([
          Inventory.fetchDeviceTypes(),
          Inventory.fetchBrands(),
          Inventory.fetchModels(),
          Inventory.fetchStatuses(),
          Inventory.fetchAssetTypes(),
          Inventory.fetchAssetExtensions(),
          Inventory.fetchClassificationRules(),
          Inventory.fetchVehicleCatalog().catch(() => []),
        ]);
        const currentRule = initialData.classification_rule?.id
          ? {
              ...initialData.classification_rule,
              label:
                initialData.classification_rule.label ||
                initialData.classification_rule.classification?.description ||
                initialData.classification?.description,
              asset_type: initialData.classification_rule.asset_type || initialData.asset_type,
              extension:
                initialData.classification_rule.extension || initialData.extension?.extension,
            }
          : null;
        const rulesWithAssignedLegacy =
          currentRule &&
          !classificationRules.some((rule) => String(rule.id) === String(currentRule.id))
            ? [...classificationRules, currentRule]
            : classificationRules.map((rule) =>
                String(rule.id) === String(currentRule?.id) ? currentRule : rule
              );
        setOptions({
          devices,
          brands,
          models,
          statuses,
          assetTypes,
          assetExtensions,
          classificationRules: rulesWithAssignedLegacy,
          vehicleCatalog,
        });

        const isVehicleRecord =
          initialData.asset_type?.code === 'VEHICLE' || Boolean(initialData.vehicle_details);
        const vehicleRule = classificationRules.find(
          (rule) =>
            rule.asset_type?.code === 'VEHICLE' &&
            rule.extension?.code === 'VEHICLES' &&
            rule.classification?.code_new === '12040302'
        );

        if (isVehicleRecord && !initialData.classification_rule?.id && vehicleRule) {
          setFormData((current) => ({
            ...current,
            asset_type_id: current.asset_type_id || String(vehicleRule.asset_type.id),
            extension_id: current.extension_id || String(vehicleRule.extension.id),
            classification_rule_id: String(vehicleRule.id),
            item_selection: `rule:${vehicleRule.id}`,
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

  const filteredBrands = options.brands.filter(
    (brand, index, all) =>
      all.findIndex((candidate) => normalizeText(candidate.name) === normalizeText(brand.name)) ===
      index
  );

  const filteredModels = options.models.filter(
    (m) =>
      String(m.id_brand) === String(formData.id_brand) &&
      String(m.id_device) === String(formData.id_device)
  );
  const selectedModel = options.models.find(
    (model) => String(model.id) === String(formData.id_model)
  );
  const modelBrand = options.brands.find(
    (brand) => String(brand.id) === String(selectedModel?.id_brand)
  );
  const brandOptionList = [
    ...filteredBrands.filter((brand) => String(brand.id) !== String(modelBrand?.id)),
    ...(modelBrand ? [modelBrand] : []),
  ];

  const selectedStatus = options.statuses.find(
    (status) => String(status.id) === String(formData.id_status)
  );

  const selectedAssetType = options.assetTypes.find(
    (type) => String(type.id) === String(formData.asset_type_id)
  );
  const selectedTypeCode = selectedAssetType?.code;
  const rulesForSelectedType = options.classificationRules.filter(
    (rule) => rule.asset_type?.code === selectedTypeCode
  );
  const deviceRuleIds = new Set(
    options.classificationRules
      .filter((rule) => rule.device?.id)
      .map((rule) => String(rule.device.id))
  );
  const availableItemOptions = (() => {
    if (!selectedTypeCode) return [];
    const typedRules = rulesForSelectedType.filter((rule) => rule.extension?.active !== false);
    const optionsFromRules = typedRules
      .filter((rule) => selectedTypeCode !== 'TECHNOLOGY' || rule.device?.id)
      .filter(
        (rule) =>
          selectedTypeCode !== 'PROPERTY' ||
          rule.device?.id ||
          /^(12040[12]|1205)/.test(rule.classification?.code_new || '')
      )
      .map((rule) => ({
        value: `rule:${rule.id}`,
        label:
          rule.device?.name ||
          rule.label ||
          rule.classification?.description ||
          'Sin clasificación',
        rule,
        deviceId: rule.device?.id || '',
      }));
    if (selectedTypeCode !== 'TECHNOLOGY') {
      return optionsFromRules.sort((a, b) =>
        a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
      );
    }
    const unclassifiedTechnologyDevices = options.devices
      .filter((device) => !deviceRuleIds.has(String(device.id)))
      .map((device) => ({
        value: `device:${device.id}`,
        label: device.name,
        rule: null,
        deviceId: device.id,
      }));
    return [...optionsFromRules, ...unclassifiedTechnologyDevices].sort((a, b) =>
      a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
    );
  })();
  const selectedItemOption = availableItemOptions.find(
    (option) => option.value === formData.item_selection
  );
  const selectedRule =
    selectedItemOption?.rule || (isEdit ? initialData.classification_rule : null);
  const isVehicle = selectedTypeCode === 'VEHICLE';
  const isProperty = selectedTypeCode === 'PROPERTY';
  const isRealEstate = Boolean(
    selectedRule?.classification?.code_new &&
    /^(120401|120402|1205)/.test(selectedRule.classification.code_new)
  );
  const hasSelectedItem = Boolean(
    selectedItemOption || (isEdit && initialData.classification_rule?.id)
  );
  const existingVehicleCatalog = options.vehicleCatalog.find(
    (entry) =>
      isVehicle &&
      entry.brand.name === formData.vehicle_make &&
      entry.model.name === formData.vehicle_model &&
      String(entry.model_year) === String(formData.vehicle_model_year) &&
      entry.vehicle_type === initialData.vehicle_details?.vehicle_type &&
      entry.fuel_type === initialData.vehicle_details?.fuel_type
  );
  const vehicleBrandId =
    formData.vehicle_catalog_brand_id || existingVehicleCatalog?.id_brand || '';
  const vehicleModelId =
    formData.vehicle_catalog_model_id || existingVehicleCatalog?.id_model || '';
  const vehicleYear = formData.vehicle_catalog_year || existingVehicleCatalog?.model_year || '';
  const vehicleType = formData.vehicle_catalog_type || existingVehicleCatalog?.vehicle_type || '';
  const vehicleFuel = formData.vehicle_catalog_fuel || existingVehicleCatalog?.fuel_type || '';
  const vehicleBrandOptions = [
    ...new Map(
      options.vehicleCatalog.map((entry) => [String(entry.id_brand), entry.brand])
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  const vehicleModels = options.vehicleCatalog.filter(
    (entry) => String(entry.id_brand) === String(vehicleBrandId)
  );
  const vehicleModelOptions = [
    ...new Map(vehicleModels.map((entry) => [String(entry.id_model), entry.model])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  const vehicleYears = [
    ...new Set(
      vehicleModels
        .filter((entry) => String(entry.id_model) === String(vehicleModelId))
        .map((entry) => String(entry.model_year))
    ),
  ].sort((a, b) => Number(b) - Number(a));
  const vehicleTypes = [
    ...new Set(
      vehicleModels
        .filter(
          (entry) =>
            String(entry.id_model) === String(vehicleModelId) &&
            String(entry.model_year) === String(vehicleYear)
        )
        .map((entry) => entry.vehicle_type)
    ),
  ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  const vehicleFuels = [
    ...new Set(
      vehicleModels
        .filter(
          (entry) =>
            String(entry.id_model) === String(vehicleModelId) &&
            String(entry.model_year) === String(vehicleYear) &&
            entry.vehicle_type === vehicleType
        )
        .map((entry) => entry.fuel_type)
    ),
  ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  const selectedVehicleCatalog = options.vehicleCatalog.find(
    (entry) =>
      String(entry.id_brand) === String(vehicleBrandId) &&
      String(entry.id_model) === String(vehicleModelId) &&
      String(entry.model_year) === String(vehicleYear) &&
      entry.vehicle_type === vehicleType &&
      entry.fuel_type === vehicleFuel
  );

  const isDiscardedStatus = normalizeText(selectedStatus?.name) === 'DESCARTADO';
  const isTechnology =
    selectedTypeCode === 'TECHNOLOGY' ||
    (!selectedTypeCode && isEdit && Boolean(initialData.id_device));
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

  const handleAssetTypeChange = (event) => {
    const typeId = event.target.value;
    const type = options.assetTypes.find((item) => String(item.id) === typeId);
    const expectedExtensionCode = {
      TECHNOLOGY: 'DEVICES',
      VEHICLE: 'VEHICLES',
      PROPERTY: 'PROPERTIES',
    }[type?.code];
    const extension = options.assetExtensions.find((item) => item.code === expectedExtensionCode);
    setFormData((current) => ({
      ...current,
      asset_type_id: typeId,
      extension_id: extension ? String(extension.id) : '',
      classification_rule_id: selectedTypeCode === type?.code ? current.classification_rule_id : '',
      item_selection: selectedTypeCode === type?.code ? current.item_selection : '',
      id_device: '',
      id_brand: '',
      id_model: '',
      serie: '',
      vehicle_catalog_id: '',
    }));
    setErrors((current) => ({
      ...current,
      asset_type_id: '',
      item_selection: '',
      classification: '',
    }));
  };

  const handleItemSelectionChange = (event) => {
    const value = event.target.value;
    const option = availableItemOptions.find((item) => item.value === value);
    const legacyCurrentRule =
      isEdit && String(value) === `rule:${initialData.classification_rule?.id}`
        ? initialData.classification_rule
        : null;
    setFormData((current) => ({
      ...current,
      item_selection: value,
      classification_rule_id: option?.rule
        ? String(option.rule.id)
        : legacyCurrentRule
          ? String(legacyCurrentRule.id)
          : '',
      id_device: option?.deviceId
        ? String(option.deviceId)
        : legacyCurrentRule?.device?.id
          ? String(legacyCurrentRule.device.id)
          : legacyCurrentRule?.device_id
            ? String(legacyCurrentRule.device_id)
            : '',
      vehicle_catalog_id: '',
      vehicle_catalog_brand_id: '',
      vehicle_catalog_model_id: '',
      vehicle_catalog_year: '',
      vehicle_catalog_type: '',
      vehicle_catalog_fuel: '',
      id_brand:
        legacyCurrentRule && legacyCurrentRule.id === initialData.classification_rule?.id
          ? current.id_brand
          : '',
      id_model:
        legacyCurrentRule && legacyCurrentRule.id === initialData.classification_rule?.id
          ? current.id_model
          : '',
      serie:
        legacyCurrentRule && legacyCurrentRule.id === initialData.classification_rule?.id
          ? current.serie
          : '',
    }));
    setErrors((current) => ({ ...current, item_selection: '', classification: '' }));
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateInventoryForm(
      formData,
      isDiscardedStatus,
      isTechnology,
      hasSelectedItem,
      isVehicle,
      Boolean(selectedVehicleCatalog)
    );

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const completeSubmitData = {
      ...formData,
      asset_type_id: formData.asset_type_id ? Number(formData.asset_type_id) : null,
      extension_id: formData.extension_id ? Number(formData.extension_id) : null,
      classification_rule_id: formData.classification_rule_id
        ? Number(formData.classification_rule_id)
        : null,
      id_administrative_area: formData.id_administrative_area
        ? Number(formData.id_administrative_area)
        : null,
      id_device: formData.id_device ? Number(formData.id_device) : null,
      id_brand: formData.id_brand ? Number(formData.id_brand) : null,
      id_model: formData.id_model ? Number(formData.id_model) : null,
      vehicle_model_year: formData.vehicle_model_year ? Number(formData.vehicle_model_year) : null,
      vehicle_catalog_id: isVehicle
        ? selectedVehicleCatalog
          ? Number(selectedVehicleCatalog.id)
          : null
        : undefined,
      vehicle_mileage: formData.vehicle_mileage === '' ? null : Number(formData.vehicle_mileage),
      cadastral_number: formData.cadastral_number || null,
      real_estate_address: formData.real_estate_address || null,
      real_estate_area_m2: formData.real_estate_area_m2 || null,
      real_estate_location_geo: formData.real_estate_location_geo || null,
      property_material: formData.property_material || null,
      property_dimensions: formData.property_dimensions || null,
      transferdate: formData.transferDateInput || null,
      id_ubication: isDiscardedStatus ? null : formData.id_ubication,
      id_department: isDiscardedStatus ? null : formData.id_department,
      user: formData.user.trim() === '' ? null : formData.user,
      ip: formData.ip.trim() === '' ? null : formData.ip,
      observation: formData.observation.trim() === '' ? null : formData.observation,
    };

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
          }
        : completeSubmitData;

    onSubmit(submitData);
  };

  if (fetchError) {
    return (
      <ModalLayer>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/55 p-3 backdrop-blur-md">
        <div className="w-full max-w-lg p-6 bg-white shadow-xl rounded-xl">
          <p className="text-red-500">{fetchError}</p>
          <button type="button" onClick={onCancel} className="px-4 py-2 mt-4 bg-gray-300 rounded">
            Cerrar
          </button>
        </div>
      </div>
      </ModalLayer>
    );
  }

  const EDITABLE_ALWAYS = new Set(['user', 'ip', 'id_status', 'transferDateInput', 'observation']);

  const isFieldLocked = (name) => {
    if (!isEdit) return false;
    if (!canFullEdit) {
      if (name === 'user') return !canEditAssignee;
      return true;
    }
    if (!safeMode || EDITABLE_ALWAYS.has(name)) return false;
    return !unlocked[name];
  };

  const toggleField = (name) => {
    if (!canFullEdit) return;
    setUnlocked((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleSection = (name) => {
    setCollapsedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <ModalLayer>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-md">
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950 md:text-xl">
              {isEdit ? `Editar equipo #${formData.tag}` : 'Agregar bien al inventario'}
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
                title="Identificación del bien"
                icon={Cpu}
                collapsed={collapsedSections.identity}
                onToggle={() => toggleSection('identity')}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <SelectField
                    label="Tipo de bien / clasificación *"
                    name="asset_type_id"
                    value={formData.asset_type_id}
                    onChange={handleAssetTypeChange}
                    options={options.assetTypes.map((type) => ({ id: type.id, name: type.name }))}
                    error={errors.asset_type_id}
                    locked={isFieldLocked('asset_type_id')}
                    onToggle={() => toggleField('asset_type_id')}
                  />
                  <SelectField
                    label={isVehicle ? 'Clasificación del vehículo *' : 'Bien / categoría *'}
                    name="item_selection"
                    value={formData.item_selection}
                    onChange={handleItemSelectionChange}
                    options={[
                      ...(!selectedItemOption && isEdit && initialData.classification_rule?.id
                        ? [
                            {
                              id: `rule:${initialData.classification_rule.id}`,
                              name:
                                selectedRule?.classification?.description ||
                                initialData.classification?.description ||
                                'Clasificación actual del activo',
                            },
                          ]
                        : []),
                      ...availableItemOptions.map((option) => ({
                        id: option.value,
                        name: option.label,
                      })),
                    ]}
                    error={errors.item_selection}
                    disabled={!formData.asset_type_id}
                    locked={isFieldLocked('item_selection')}
                    onToggle={() => toggleField('item_selection')}
                  />
                  <InputField
                    label="Marbete *"
                    name="tag"
                    value={formData.tag}
                    onChange={handleChange}
                    error={errors.tag}
                    locked={isFieldLocked('tag')}
                    onToggle={() => toggleField('tag')}
                  />
                  {isTechnology && (
                    <>
                      <SelectField
                        label="Marca *"
                        name="id_brand"
                        value={formData.id_brand}
                        onChange={(event) => {
                          handleChange(event);
                          setFormData((current) => ({ ...current, id_model: '' }));
                        }}
                        options={brandOptionList.map((brand) => ({
                          id: brand.id,
                          name: brand.name,
                        }))}
                        error={errors.id_brand}
                        disabled={!formData.id_device}
                        locked={isFieldLocked('id_brand')}
                        onToggle={() => toggleField('id_brand')}
                        belowAction={
                          !hasPermission('brands.create') && (
                            <RequestCatalogAction
                              onClick={() => requestCatalogCreation('BRAND')}
                              label="Solicitar marca"
                            />
                          )
                        }
                      />
                      <SelectField
                        label="Modelo *"
                        name="id_model"
                        value={formData.id_model}
                        onChange={handleChange}
                        options={filteredModels.map((model) => ({
                          id: model.id,
                          name: model.name,
                        }))}
                        error={errors.id_model}
                        disabled={!formData.id_brand}
                        locked={isFieldLocked('id_model')}
                        onToggle={() => toggleField('id_model')}
                        belowAction={
                          !hasPermission('models.create') &&
                          formData.id_brand && (
                            <RequestCatalogAction
                              onClick={() =>
                                requestCatalogCreation(
                                  'MODEL',
                                  formData.id_brand,
                                  formData.id_device
                                )
                              }
                              label="Solicitar modelo"
                            />
                          )
                        }
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
                    </>
                  )}
                  {!isTechnology &&
                    !isVehicle &&
                    hasSelectedItem &&
                    selectedItemOption?.deviceId && (
                      <>
                        <SelectField
                          label="Marca"
                          name="id_brand"
                          value={formData.id_brand}
                          onChange={(event) => {
                            handleChange(event);
                            setFormData((current) => ({ ...current, id_model: '' }));
                          }}
                          options={brandOptionList.map((brand) => ({
                            id: brand.id,
                            name: brand.name,
                          }))}
                          disabled={!formData.id_device}
                          locked={isFieldLocked('id_brand')}
                          onToggle={() => toggleField('id_brand')}
                          belowAction={
                            !hasPermission('brands.create') && (
                              <RequestCatalogAction
                                onClick={() => requestCatalogCreation('BRAND')}
                                label="Solicitar marca"
                              />
                            )
                          }
                        />
                        <SelectField
                          label="Modelo"
                          name="id_model"
                          value={formData.id_model}
                          onChange={handleChange}
                          options={filteredModels.map((model) => ({
                            id: model.id,
                            name: model.name,
                          }))}
                          disabled={!formData.id_brand}
                          locked={isFieldLocked('id_model')}
                          onToggle={() => toggleField('id_model')}
                          belowAction={
                            !hasPermission('models.create') &&
                            formData.id_brand && (
                              <RequestCatalogAction
                                onClick={() =>
                                  requestCatalogCreation(
                                    'MODEL',
                                    formData.id_brand,
                                    formData.id_device
                                  )
                                }
                                label="Solicitar modelo"
                              />
                            )
                          }
                        />
                        <InputField
                          label="Serie"
                          name="serie"
                          value={formData.serie}
                          onChange={handleChange}
                          locked={isFieldLocked('serie')}
                          onToggle={() => toggleField('serie')}
                        />
                      </>
                    )}
                  {isVehicle && (
                    <>
                      <SelectField
                        label="Marca *"
                        name="vehicle_catalog_brand_id"
                        value={vehicleBrandId}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            vehicle_catalog_brand_id: event.target.value,
                            vehicle_catalog_model_id: '',
                            vehicle_catalog_year: '',
                            vehicle_catalog_type: '',
                            vehicle_catalog_fuel: '',
                            vehicle_catalog_id: '',
                          }))
                        }
                        options={vehicleBrandOptions.map((brand) => ({
                          id: brand.id,
                          name: brand.name,
                        }))}
                        locked={isFieldLocked('vehicle_catalog_brand_id')}
                        onToggle={() => toggleField('vehicle_catalog_brand_id')}
                        belowAction={
                          !hasPermission('brands.create') && (
                            <RequestCatalogAction
                              onClick={() => requestCatalogCreation('BRAND')}
                              label="Solicitar marca"
                            />
                          )
                        }
                      />
                      <SelectField
                        label="Modelo *"
                        name="vehicle_catalog_model_id"
                        value={vehicleModelId}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            vehicle_catalog_model_id: event.target.value,
                            vehicle_catalog_year: '',
                            vehicle_catalog_type: '',
                            vehicle_catalog_fuel: '',
                            vehicle_catalog_id: '',
                          }))
                        }
                        options={vehicleModelOptions.map((model) => ({
                          id: model.id,
                          name: model.name,
                        }))}
                        disabled={!vehicleBrandId}
                        locked={isFieldLocked('vehicle_catalog_model_id')}
                        onToggle={() => toggleField('vehicle_catalog_model_id')}
                        belowAction={
                          !hasPermission('models.create') &&
                          vehicleBrandId && (
                            <RequestCatalogAction
                              onClick={() => requestCatalogCreation('MODEL', vehicleBrandId, null)}
                              label="Solicitar modelo"
                            />
                          )
                        }
                      />
                      <SelectField
                        label="Año de modelo *"
                        name="vehicle_catalog_year"
                        value={vehicleYear}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            vehicle_catalog_year: event.target.value,
                            vehicle_catalog_type: '',
                            vehicle_catalog_fuel: '',
                            vehicle_catalog_id: '',
                          }))
                        }
                        options={vehicleYears.map((year) => ({ id: year, name: year }))}
                        disabled={!vehicleModelId}
                        locked={isFieldLocked('vehicle_catalog_year')}
                        onToggle={() => toggleField('vehicle_catalog_year')}
                      />
                      <SelectField
                        label="Tipo de vehículo *"
                        name="vehicle_catalog_type"
                        value={vehicleType}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            vehicle_catalog_type: event.target.value,
                            vehicle_catalog_fuel: '',
                            vehicle_catalog_id: '',
                          }))
                        }
                        options={vehicleTypes.map((type) => ({ id: type, name: type }))}
                        disabled={!vehicleYear}
                        locked={isFieldLocked('vehicle_catalog_type')}
                        onToggle={() => toggleField('vehicle_catalog_type')}
                      />
                      <SelectField
                        label="Combustible *"
                        name="vehicle_catalog_fuel"
                        value={vehicleFuel}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            vehicle_catalog_fuel: event.target.value,
                            vehicle_catalog_id: '',
                          }))
                        }
                        options={vehicleFuels.map((fuel) => ({ id: fuel, name: fuel }))}
                        disabled={!vehicleType}
                        error={errors.vehicle_catalog_id}
                        locked={isFieldLocked('vehicle_catalog_fuel')}
                        onToggle={() => toggleField('vehicle_catalog_fuel')}
                      />
                      <InputField
                        label="Placa"
                        name="vehicle_plate"
                        value={formData.vehicle_plate}
                        onChange={handleChange}
                        locked={isFieldLocked('vehicle_plate')}
                        onToggle={() => toggleField('vehicle_plate')}
                      />
                      <InputField
                        label="Motor"
                        name="vehicle_engine"
                        value={formData.vehicle_engine}
                        onChange={handleChange}
                        locked={isFieldLocked('vehicle_engine')}
                        onToggle={() => toggleField('vehicle_engine')}
                      />
                      <InputField
                        label="Chasis"
                        name="vehicle_chassis"
                        value={formData.vehicle_chassis}
                        onChange={handleChange}
                        locked={isFieldLocked('vehicle_chassis')}
                        onToggle={() => toggleField('vehicle_chassis')}
                      />
                      <InputField
                        label="Kilometraje"
                        name="vehicle_mileage"
                        value={formData.vehicle_mileage}
                        onChange={handleChange}
                        locked={isFieldLocked('vehicle_mileage')}
                        onToggle={() => toggleField('vehicle_mileage')}
                      />
                    </>
                  )}
                  {isRealEstate && hasSelectedItem && (
                    <>
                      <InputField
                        label="Número catastral"
                        name="cadastral_number"
                        value={formData.cadastral_number}
                        onChange={handleChange}
                        locked={isFieldLocked('cadastral_number')}
                        onToggle={() => toggleField('cadastral_number')}
                      />
                      <InputField
                        label="Área (m²)"
                        name="real_estate_area_m2"
                        value={formData.real_estate_area_m2}
                        onChange={handleChange}
                        locked={isFieldLocked('real_estate_area_m2')}
                        onToggle={() => toggleField('real_estate_area_m2')}
                      />
                      <InputField
                        label="Dirección"
                        name="real_estate_address"
                        value={formData.real_estate_address}
                        onChange={handleChange}
                        locked={isFieldLocked('real_estate_address')}
                        onToggle={() => toggleField('real_estate_address')}
                      />
                      <InputField
                        label="Ubicación geográfica"
                        name="real_estate_location_geo"
                        value={formData.real_estate_location_geo}
                        onChange={handleChange}
                        locked={isFieldLocked('real_estate_location_geo')}
                        onToggle={() => toggleField('real_estate_location_geo')}
                      />
                    </>
                  )}
                  {isProperty && !isRealEstate && hasSelectedItem && (
                    <>
                      <SelectField
                        label="Material"
                        name="property_material"
                        value={formData.property_material}
                        onChange={handleChange}
                        options={[
                          ...(formData.property_material &&
                          !PROPERTY_MATERIALS.includes(formData.property_material)
                            ? [{ id: formData.property_material, name: formData.property_material }]
                            : []),
                          ...PROPERTY_MATERIALS.map((material) => ({
                            id: material,
                            name: material,
                          })),
                        ]}
                        locked={isFieldLocked('property_material')}
                        onToggle={() => toggleField('property_material')}
                      />
                      <InputField
                        label="Dimensiones"
                        name="property_dimensions"
                        value={formData.property_dimensions}
                        onChange={handleChange}
                        locked={isFieldLocked('property_dimensions')}
                        onToggle={() => toggleField('property_dimensions')}
                      />
                    </>
                  )}
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
                  {selectedRule ? (
                    <>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {selectedRule.label ||
                          selectedRule.classification?.description ||
                          'Clasificación actual'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {selectedRule.asset_type?.name || selectedTypeCode || 'Tipo no disponible'}{' '}
                        ·{' '}
                        {selectedRule.extension?.name ||
                          selectedRule.extension?.code ||
                          'Sin extensión'}{' '}
                        · {selectedRule.administrative_area?.name || 'Sin área asignada'}
                      </p>
                    </>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Info size={13} />
                      {hasSelectedItem && selectedTypeCode === 'TECHNOLOGY'
                        ? 'Este equipo no tiene regla individual; se registrará dentro de Tecnología.'
                        : 'Seleccione primero el tipo de bien y después la clasificación.'}
                    </p>
                  )}
                  {errors.classification && (
                    <p className="mt-2 text-xs text-red-600">{errors.classification}</p>
                  )}
                </div>
              </CompactSection>

              <CompactSection
                title="Información técnica"
                icon={Boxes}
                collapsed={collapsedSections.technical}
                onToggle={() => toggleSection('technical')}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {(isTechnology || Boolean(selectedItemOption?.deviceId)) && (
                    <InputField
                      label="IP"
                      name="ip"
                      value={formData.ip}
                      onChange={handleChange}
                      error={errors.ip}
                      locked={!canFullEdit}
                    />
                  )}
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

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3">
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
    </ModalLayer>
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
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700">
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
  belowAction,
}) {
  const finalDisabled = disabled || !!locked;

  return (
    <div>
      <div className="mb-1 flex min-h-5 items-center justify-between gap-2">
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700">
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
      {belowAction}

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

function RequestCatalogAction({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 block text-[11px] font-medium text-blue-700 hover:underline"
    >
      {label}
    </button>
  );
}

function DateField({ label, name, value, onChange, disabled }) {
  return (
    <div>
      <div className="mb-1 flex min-h-5 items-center">
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700">
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
