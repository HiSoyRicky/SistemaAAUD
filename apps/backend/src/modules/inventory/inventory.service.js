// inventory.service.js

import AppError from '../../common/utils/AppError.js';
import { mapCreateInventoryResponse, mapInventoryResponse } from './inventory.dto.js';
import * as repository from './inventory.repository.js';
import {
  isTechnologyRule,
  resolveClassificationRule,
} from './services/inventory-classification.service.js';
import { resolveInventoryScope } from './services/inventory-scope.service.js';

import {
  isDiscardedStatus,
  parseOptionalPositiveInt,
  parseRequiredPositiveInt,
  parseTransferDate,
} from '../inventory/utils/inventory.parsers.js';

export const getAll = async (query, scope = {}) => {
  const rawSearch = typeof query?.search === 'string' ? query.search.trim() : '';
  const search = rawSearch || undefined;
  const filters = {
    tag: query?.tag?.trim(),
    serie: query?.serie?.trim(),
    description: query?.description?.trim(),
    user: query?.user?.trim(),
    ip: query?.ip?.trim(),
    device: query?.device?.trim(),
    brand: query?.brand?.trim(),
    model: query?.model?.trim(),
    ubication: query?.ubication?.trim(),
    department: query?.department?.trim(),
    status: query?.status?.trim(),
    condition: query?.condition?.trim(),
    classification: query?.classification?.trim(),
    asset_type: query?.asset_type?.trim(),
    extension: query?.extension?.trim(),
    administrative_area: query?.administrative_area?.trim(),
  };

  if (query?.page !== undefined || query?.limit !== undefined) {
    const pagination = resolveInventoryPagination(query);
    const [result, stats] = await Promise.all([
      repository.findPage({ search, filters, scope, ...pagination }),
      repository.findInventoryStats({ search, filters, scope }),
    ]);

    return {
      data: mapInventoryResponse(result.data),
      page: pagination.page,
      limit: pagination.take,
      offset: pagination.skip,
      total: result.total,
      totalPages: Math.max(Math.ceil(result.total / pagination.take), 1),
      stats,
    };
  }

  const inventory = await repository.findAll(search, filters, scope);
  return mapInventoryResponse(inventory);
};

export const getAdministrativeAreas = async () => repository.findAdministrativeAreas();

export const getInventoryFilterOptions = async (filters = {}, scope = {}, search) =>
  repository.findInventoryFilterOptions(filters, scope, search);

export const getClassificationRules = async (options = {}) => {
  const findActiveRules = options.findActiveRules ?? repository.findActiveAssetClassificationRules;
  const rules = await findActiveRules();
  const activeRules = rules.filter((rule) => rule?.active === true && rule.administrative_area_id != null);

  return activeRules.map((rule) => ({
    id: rule.id,
    device: rule.device
      ? {
          id: rule.device.id,
          name: rule.device.name,
        }
      : null,
    active: rule.active,
    is_default: rule.is_default,
    classification: rule.classification
      ? {
          id: rule.classification.id,
          code_new: rule.classification.code_new,
          description: rule.classification.description,
          active: rule.classification.active,
          is_assignable: rule.classification.is_assignable,
        }
      : null,
    asset_type: rule.asset_type
      ? {
          id: rule.asset_type.id,
          code: rule.asset_type.code,
          name: rule.asset_type.name,
          active: rule.asset_type.active,
        }
      : null,
    extension: rule.extension
      ? {
          id: rule.extension.id,
          code: rule.extension.code,
          name: rule.extension.name,
          active: rule.extension.active,
        }
      : null,
    administrative_area: rule.administrative_area
      ? {
          id: rule.administrative_area.id,
          name: rule.administrative_area.name,
        }
      : null,
    label: rule.classification
      ? `${rule.classification.code_new} — ${rule.classification.description}`
      : null,
  }));
};

export function resolveInventoryPagination(query = {}) {
  const page = Number(query.page);
  const requestedLimit = Number(query.limit);
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const take =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 200)
      : 25;

  return {
    page: normalizedPage,
    skip: (normalizedPage - 1) * take,
    take,
  };
}

function validateCreateIds(ids) {
  if (Object.values(ids).some((value) => Number.isNaN(value))) {
    throw new AppError('Los IDs deben ser números enteros válidos', 400);
  }
}

async function validateCreateReferences({
  idDevice,
  idBrand,
  idModel,
  idStatus,
  idCondition,
  idAdministrativeArea,
}) {
  const [deviceExists, brandExists, modelExists, statusExists, conditionExists, areaExists] =
    await Promise.all([
      idDevice === null ? null : repository.findDeviceById(idDevice),
      idBrand === null ? null : repository.findBrandById(idBrand),
      idModel === null ? null : repository.findModelById(idModel),
      repository.findStatusById(idStatus),
      idCondition === null ? null : repository.findConditionById(idCondition),
      idAdministrativeArea === null ? null : repository.findAdministrativeAreaById(idAdministrativeArea),
    ]);

  if (idDevice !== null && !deviceExists) {
    throw new AppError('El dispositivo especificado no existe', 400);
  }

  if (idBrand !== null && !brandExists) {
    throw new AppError('La marca especificada no existe', 400);
  }

  if (idModel !== null) {
    if (!modelExists) {
      throw new AppError('El modelo especificado no existe', 400);
    }

    if (
      idBrand === null ||
      modelExists.id_brand !== idBrand ||
      modelExists.id_device !== idDevice
    ) {
      throw new AppError('El modelo no corresponde a la marca y dispositivo seleccionados', 400);
    }
  }

  if (!statusExists) {
    throw new AppError('El estado especificado no existe', 400);
  }

  if (idCondition !== null && !conditionExists) {
    throw new AppError('La condición física especificada no existe', 400);
  }

  if (idAdministrativeArea !== null && !areaExists) {
    throw new AppError('El área administradora especificada no existe', 400);
  }

  return statusExists;
}

function normalizeHolderName(user) {
  return typeof user === 'string' ? user.trim() || null : null;
}

function buildGeneralInventoryData({
  tag,
  location,
  user,
  description,
  ids,
  transferDate,
  observation,
  rule,
  userId,
}) {
  return {
    tag,
    id_ubication: location.idUbication,
    id_department: location.idDepartment,
    user: normalizeHolderName(user),
    description: description || null,
    id_status: ids.idStatus,
    transferdate: transferDate,
    observation: observation || null,
    id_condition: ids.idCondition,
    id_administrative_area: ids.idAdministrativeArea,
    asset_type_id: rule?.asset_type_id ?? ids.idAssetType,
    extension_id: rule?.extension_id ?? ids.idExtension,
    asset_classification_rule_id: rule?.id ?? null,
    created_by: userId,
    created_at: new Date(),
  };
}

function buildTechnologyExtensionData({ idDevice, idBrand, idModel, serie, ip }) {
  return {
    id_device: idDevice,
    id_brand: idBrand,
    id_model: idModel,
    serie,
    ip: ip || null,
  };
}

function normalizeVehicleData(payload, catalogEntry) {
  const modelYear = catalogEntry.model_year;
  const mileage = parseOptionalNonNegativeInt(payload.vehicle_mileage);
  if (Number.isNaN(modelYear) || (modelYear !== null && modelYear < 1886) || modelYear > 2200) {
    throw new AppError('El año del modelo del vehículo no es válido', 400);
  }
  if (Number.isNaN(mileage)) throw new AppError('El kilometraje no es válido', 400);
  return {
    make: catalogEntry.brand.name,
    model: catalogEntry.model.name,
    model_year: modelYear,
    plate: payload.vehicle_plate?.trim() || null,
    engine: payload.vehicle_engine?.trim() || null,
    chassis: payload.vehicle_chassis?.trim() || null,
    vehicle_type: catalogEntry.vehicle_type,
    fuel_type: catalogEntry.fuel_type,
    mileage,
  };
}

function parseOptionalNonNegativeInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function normalizeRealEstateData(payload) {
  const inputArea = payload.real_estate_area_m2?.trim();
  const hectares = inputArea?.match(/^(\d+(?:[.,]\d+)?)\s*has?\s*\+\s*(\d+(?:[.,]\d+)?)\s*m(?:2|²)$/i);
  const areaValue = hectares
    ? (Number(hectares[1].replace(',', '.')) * 10000 + Number(hectares[2].replace(',', '.'))).toFixed(2)
    : inputArea;
  if (areaValue && !/^\d{1,8}(\.\d{1,2})?$/.test(areaValue)) {
    throw new AppError('El área del terreno debe ser un número positivo con hasta 2 decimales', 400);
  }
  return {
    cadastral_number: payload.cadastral_number?.trim() || null,
    address: payload.real_estate_address?.trim() || null,
    area_m2: areaValue || null,
    location_geo: payload.real_estate_location_geo?.trim() || null,
  };
}

function normalizePropertyData(payload) {
  return {
    material: payload.property_material?.trim() || null,
    dimensions: payload.property_dimensions?.trim() || null,
  };
}

async function resolveCreateLocation({ idUbication, idDepartment, statusName }) {
  const shouldDiscardLocation = isDiscardedStatus(statusName);

  const supportsNullLocation = shouldDiscardLocation
    ? await repository.areInventoryLocationFieldsNullable()
    : true;

  if (!shouldDiscardLocation && (idUbication === null || idDepartment === null)) {
    throw new AppError('Ubicación y departamento son obligatorios para este estado', 400);
  }

  if (shouldDiscardLocation && supportsNullLocation) {
    return {
      idUbication: null,
      idDepartment: null,
    };
  }

  if (
    shouldDiscardLocation &&
    !supportsNullLocation &&
    (idUbication === null || idDepartment === null)
  ) {
    throw new AppError(
      'La base de datos aún no permite vaciar ubicación/departamento en DESCARTADO. Solicita aplicar la migración pendiente.',
      400
    );
  }

  const [ubicationExists, departmentExists] = await Promise.all([
    repository.findUbicationById(idUbication),
    repository.findDepartmentById(idDepartment),
  ]);

  if (!ubicationExists) {
    throw new AppError('La ubicación especificada no existe', 400);
  }

  if (!departmentExists) {
    throw new AppError('El departamento especificado no existe', 400);
  }

  return {
    idUbication,
    idDepartment,
  };
}

function resolveCreateTransferDate(transferdate) {
  if (!transferdate) {
    return null;
  }

  const date = parseTransferDate(transferdate);

  if (!date) {
    throw new AppError('El campo transferdate debe ser una fecha válida', 400);
  }

  return date;
}

function handleCreateError(error) {
  if (error instanceof AppError) return error;
  if (error.code === 'P2003') {
    return new AppError('ID de referencia inválido (FK no existe)', 400);
  }

  if (error.code === 'P2002') {
    return new AppError('Ya existe un dispositivo con ese tag o serie', 409);
  }

  if (error.code === 'P2004') {
    return new AppError('Error de restricción en la base de datos', 400);
  }

  if (error.code === 'P2011') {
    return new AppError('Error: campo requerido no puede ser nulo', 400);
  }

  return new AppError('Error al crear dispositivo', 500);
}

export const create = async (payload, currentUser) => {
  const userId = currentUser?.id;

  const {
    tag,
    id_ubication,
    id_department,
    user,
    id_device,
    id_brand,
    id_model,
    serie,
    ip,
    id_status,
    transferdate,
    observation,
    description,
    id_condition,
    asset_type_id,
    classification_rule_id,
  } = payload;

  const idDevice = parseOptionalPositiveInt(id_device);
  const selectedRuleId = parseOptionalPositiveInt(classification_rule_id);
  const selectedAssetTypeId = parseOptionalPositiveInt(asset_type_id);
  if (Number.isNaN(idDevice) || Number.isNaN(selectedRuleId) || Number.isNaN(selectedAssetTypeId)) {
    throw new AppError('La selección del tipo de bien o clasificación no es válida', 400);
  }
  if (idDevice === null && selectedRuleId === null) {
    throw new AppError('Seleccione primero el tipo y la clasificación del bien', 400);
  }

  const rule = selectedRuleId !== null
    ? await resolveClassificationRule(selectedRuleId)
    : await resolveClassificationRule({ deviceId: idDevice });
  const selectedExtensionId = parseOptionalPositiveInt(payload.extension_id);
  if (Number.isNaN(selectedExtensionId)) throw new AppError('La extensión seleccionada no es válida', 400);
  const [selectedAssetType, selectedExtension] = await Promise.all([
    selectedAssetTypeId === null ? null : repository.findAssetTypeById(selectedAssetTypeId),
    selectedExtensionId === null ? null : repository.findAssetExtensionById(selectedExtensionId),
  ]);
  if (selectedAssetTypeId !== null && (!selectedAssetType || !selectedAssetType.active)) {
    throw new AppError('El tipo de bien seleccionado no existe o está inactivo', 400);
  }
  if (selectedExtensionId !== null && (!selectedExtension?.active || !selectedAssetType?.active)) {
    throw new AppError('La extensión seleccionada no existe o está inactiva', 400);
  }
  if (selectedAssetTypeId !== null && rule && rule.asset_type_id !== selectedAssetTypeId) {
    throw new AppError('La clasificación no corresponde al tipo de bien seleccionado', 400);
  }
  if (selectedExtensionId !== null && rule && rule.extension_id !== selectedExtensionId) {
    throw new AppError('La extensión no corresponde a la clasificación seleccionada', 400);
  }
  if (idDevice !== null && rule?.device_id != null && rule.device_id !== idDevice) {
    throw new AppError('La clasificación seleccionada no corresponde al bien elegido', 400);
  }
  if (!rule && idDevice === null) {
    throw new AppError('No hay una regla activa para la clasificación seleccionada', 400);
  }
  if (!rule && selectedAssetType && selectedAssetType.code !== 'TECHNOLOGY') {
    throw new AppError('Este tipo de bien requiere una regla de clasificación activa', 400);
  }
  if (
    !rule && selectedAssetType &&
    (selectedExtension?.code !== 'DEVICES' || !selectedExtension.active)
  ) {
    throw new AppError('Los equipos sin regla individual deben pertenecer a la extensión tecnológica', 400);
  }
  if (!rule && selectedExtension && selectedExtension.code !== 'DEVICES') {
    throw new AppError('La extensión seleccionada requiere una regla de clasificación activa', 400);
  }
  const isTechnology = rule ? isTechnologyRule(rule) : true;
  const selectedTypeCode = rule?.asset_type?.code || selectedAssetType?.code;
  const selectedExtensionCode = rule?.extension?.code || selectedExtension?.code;
  const isVehicle = selectedExtensionCode === 'VEHICLES';
  const isRealEstate = ['120401', '120402', '1205'].some((prefix) =>
    rule?.classification?.code_new?.startsWith(prefix)
  );
  const isProperty = selectedTypeCode === 'PROPERTY' && !isRealEstate;
  if (selectedAssetType && rule && selectedTypeCode !== selectedAssetType.code) {
    throw new AppError('El tipo seleccionado no corresponde a la regla del bien', 400);
  }
  const vehicleCatalogId = isVehicle ? parseRequiredPositiveInt(payload.vehicle_catalog_id) : null;
  const vehicleCatalogEntry = isVehicle ? await repository.findVehicleCatalogById(vehicleCatalogId) : null;
  if (isVehicle && !vehicleCatalogEntry) {
    throw new AppError('Seleccione una configuración de vehículo del catálogo', 400);
  }

  if (!isTechnology && (await resolveInventoryScope(currentUser)).technologyOnly) {
    throw new AppError('Solo puedes dar de alta bienes tecnológicos', 403, 'INVENTORY_OUT_OF_SCOPE');
  }

  const normalizedSerie = typeof serie === 'string' ? serie.trim() : '';
  if (isTechnology && !normalizedSerie) {
    throw new AppError('El campo serie es obligatorio', 400);
  }

  const ids = {
    idUbication: parseOptionalPositiveInt(id_ubication),
    idDepartment: parseOptionalPositiveInt(id_department),
    idDevice,
    idBrand: parseOptionalPositiveInt(id_brand),
    idModel: parseOptionalPositiveInt(id_model),
    idStatus: parseRequiredPositiveInt(id_status),
    idCondition: parseOptionalPositiveInt(id_condition),
    idAdministrativeArea:
      rule?.administrative_area_id ?? parseOptionalPositiveInt(payload.id_administrative_area),
    idAssetType: selectedAssetTypeId,
    idExtension: selectedExtensionId,
  };

  validateCreateIds(ids);

  if (isTechnology && (idDevice === null || ids.idBrand === null || ids.idModel === null)) {
    throw new AppError('Un bien tecnológico requiere marca y modelo', 400);
  }

  const statusExists = await validateCreateReferences(ids);

  const location = await resolveCreateLocation({
    idUbication: ids.idUbication,
    idDepartment: ids.idDepartment,
    statusName: statusExists.name,
  });

  const transferDateObj = resolveCreateTransferDate(transferdate);

  try {
    const created = await repository.createWithTechnology({
      userId,
      inventoryData: buildGeneralInventoryData({
        tag,
        location,
        user,
        description,
        ids,
        transferDate: transferDateObj,
        observation,
        rule,
        userId,
      }),
      technologyData: idDevice === null
        ? null
        : buildTechnologyExtensionData({
            idDevice,
            idBrand: ids.idBrand,
            idModel: ids.idModel,
            serie: normalizedSerie || null,
            ip,
          }),
      vehicleData: isVehicle ? normalizeVehicleData(payload, vehicleCatalogEntry) : null,
      realEstateData: isRealEstate ? normalizeRealEstateData(payload) : null,
      propertyData: isProperty ? normalizePropertyData(payload) : null,
    });

    return mapCreateInventoryResponse(created);
  } catch (error) {
    throw handleCreateError(error);
  }
};
