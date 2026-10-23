// inventory-history.service.js

import AppError from '../../../common/utils/AppError.js';

import {
  getResolvedUserPermissionCodes,
  hasPermissionCode,
} from '../../../common/rbac/permissions.service.js';
import {
  isDiscardedStatus,
  parseIntSafe,
  parseOptionalPositiveInt,
  parseTransferDate,
} from '../utils/inventory.parsers.js';

import {
  INVENTORY_FIELD_LABELS,
  INVENTORY_FIELD_PERMISSIONS,
  INVENTORY_UPDATE_FIELDS,
} from '../constants/inventory.constants.js';

import { mapUpdateInventoryResponse } from '../inventory.dto.js';
import { isTechnologyRule, resolveClassificationRule } from './inventory-classification.service.js';

import * as repository from '../inventory.repository.js';
import {
  assertInventoryItemInScope,
  resolveInventoryScope,
} from './inventory-scope.service.js';

const TECHNOLOGY_UPDATE_FIELDS = ['id_device', 'id_brand', 'id_model', 'serie', 'ip'];

async function assertInventoryUpdatePermissions(payload, currentUser) {
  const grantedCodes = await getResolvedUserPermissionCodes(currentUser);
  const hasFullUpdate = hasPermissionCode({
    grantedCodes,
    requiredCode: 'inventory.update',
  });

  if (hasFullUpdate) {
    return;
  }

  const requestedFields = Object.keys(payload || {}).filter(
    (field) => INVENTORY_UPDATE_FIELDS.has(field) && payload[field] !== undefined
  );

  const unauthorizedFields = requestedFields.filter((field) => {
    const requiredPermission = INVENTORY_FIELD_PERMISSIONS[field];

    return (
      !requiredPermission ||
      !hasPermissionCode({
        grantedCodes,
        requiredCode: requiredPermission,
      })
    );
  });

  if (unauthorizedFields.length) {
    const labels = unauthorizedFields.map((field) => INVENTORY_FIELD_LABELS[field] || field);

    throw new AppError(
      `No tienes permiso para modificar: ${labels.join(', ')}`,
      403,
      'INVENTORY_FIELDS_NOT_ALLOWED'
    );
  }
}

function parseUpdateIds(payload) {
  const {
    id_ubication,
    id_department,
    id_device,
    id_brand,
    id_model,
    id_status,
    id_condition,
    id_administrative_area,
  } = payload;

  const ids = {
    parsedUbication: parseOptionalPositiveInt(id_ubication),
    parsedDepartment: parseOptionalPositiveInt(id_department),
    parsedDevice: parseOptionalPositiveInt(id_device),
    parsedBrand: parseOptionalPositiveInt(id_brand),
    parsedModel: parseOptionalPositiveInt(id_model),
    parsedStatus: parseOptionalPositiveInt(id_status),
    parsedCondition: parseOptionalPositiveInt(id_condition),
    parsedAdministrativeArea: parseOptionalPositiveInt(id_administrative_area),
  };

  const validations = [
    ['id_ubication', ids.parsedUbication, 'Ubicación inválida'],
    ['id_department', ids.parsedDepartment, 'Departamento inválido'],
    ['id_device', ids.parsedDevice, 'Dispositivo inválido'],
    ['id_brand', ids.parsedBrand, 'Marca inválida'],
    ['id_model', ids.parsedModel, 'Modelo inválido'],
    ['id_status', ids.parsedStatus, 'Estado inválido'],
    ['id_condition', ids.parsedCondition, 'Condición física inválida'],
    ['id_administrative_area', ids.parsedAdministrativeArea, 'Área administradora inválida'],
  ];

  for (const [field, value, message] of validations) {
    if (payload[field] !== undefined && Number.isNaN(value)) {
      throw new AppError(message, 400);
    }
  }

  return ids;
}

async function validateUpdateReference({ provided, id, finder, message }) {
  if (provided === undefined || id === null) {
    return;
  }

  const result = await finder(id);

  if (!result) {
    throw new AppError(message, 400);
  }
}

async function validateUpdateReferences(payload, ids) {
  await Promise.all([
    validateUpdateReference({
      provided: payload.id_ubication,
      id: ids.parsedUbication,
      finder: repository.findUbicationById,
      message: 'La ubicación proporcionada no existe',
    }),

    validateUpdateReference({
      provided: payload.id_department,
      id: ids.parsedDepartment,
      finder: repository.findDepartmentById,
      message: 'El departamento proporcionado no existe',
    }),

    validateUpdateReference({
      provided: payload.id_device,
      id: ids.parsedDevice,
      finder: repository.findDeviceById,
      message: 'El dispositivo proporcionado no existe',
    }),

    validateUpdateReference({
      provided: payload.id_brand,
      id: ids.parsedBrand,
      finder: repository.findBrandById,
      message: 'La marca proporcionada no existe',
    }),

    validateUpdateReference({
      provided: payload.id_model,
      id: ids.parsedModel,
      finder: repository.findModelById,
      message: 'El modelo proporcionado no existe',
    }),
    validateUpdateReference({
      provided: payload.id_condition,
      id: ids.parsedCondition,
      finder: repository.findConditionById,
      message: 'La condición física proporcionada no existe',
    }),
    validateUpdateReference({
      provided: payload.id_administrative_area,
      id: ids.parsedAdministrativeArea,
      finder: repository.findAdministrativeAreaById,
      message: 'El área administradora proporcionada no existe',
    }),
  ]);
}

function currentDeviceId(existing) {
  return existing.device_details?.id_device ?? existing.asset_classification_rule?.device_id ?? null;
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() || null : null;
}

function parseOptionalNonNegativeInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function resolveEffectiveTechnology(existing, payload, ids) {
  const technology = existing.device_details;

  return {
    id_device: ids.parsedDevice ?? currentDeviceId(existing),
    id_brand: payload.id_brand !== undefined ? ids.parsedBrand : technology?.id_brand ?? null,
    id_model: payload.id_model !== undefined ? ids.parsedModel : technology?.id_model ?? null,
    serie:
      payload.serie !== undefined
        ? normalizeOptionalText(payload.serie)
        : technology?.serie ?? null,
    ip: payload.ip !== undefined ? normalizeOptionalText(payload.ip) : technology?.ip ?? null,
  };
}

function hasTechnicalValues(technology) {
  return [technology.id_brand, technology.id_model, technology.serie, technology.ip].some(
    (value) => value !== null && value !== undefined
  );
}

function vehicleUpdateData(existing, payload, catalogEntry) {
  const current = existing.vehicle_details || {};
  const mileage = payload.vehicle_mileage === undefined
    ? current.mileage ?? null
    : parseOptionalNonNegativeInt(payload.vehicle_mileage);
  if (Number.isNaN(mileage)) throw new AppError('El kilometraje no es válido', 400);
  const text = (key, existingValue) =>
    payload[key] === undefined ? existingValue ?? null : normalizeOptionalText(payload[key]);
  return {
    make: catalogEntry?.brand.name ?? current.make ?? null,
    model: catalogEntry?.model.name ?? current.model ?? null,
    model_year: catalogEntry?.model_year ?? current.model_year ?? null,
    plate: text('vehicle_plate', current.plate),
    engine: text('vehicle_engine', current.engine),
    chassis: text('vehicle_chassis', current.chassis),
    vehicle_type: catalogEntry?.vehicle_type ?? current.vehicle_type ?? null,
    fuel_type: catalogEntry?.fuel_type ?? current.fuel_type ?? null,
    mileage,
  };
}

function realEstateUpdateData(existing, payload) {
  const current = existing.real_estate_details || {};
  const area = payload.real_estate_area_m2 === undefined
    ? current.area_m2 == null ? null : String(current.area_m2)
    : normalizeOptionalText(payload.real_estate_area_m2);
  if (area && !/^\d{1,8}(\.\d{1,2})?$/.test(area)) {
    throw new AppError('El área del terreno debe ser un número positivo con hasta 2 decimales', 400);
  }
  const text = (key, existingValue) =>
    payload[key] === undefined ? existingValue ?? null : normalizeOptionalText(payload[key]);
  return {
    cadastral_number: text('cadastral_number', current.cadastral_number),
    address: text('real_estate_address', current.address),
    area_m2: area,
    location_geo: text('real_estate_location_geo', current.location_geo),
  };
}

function propertyUpdateData(existing, payload) {
  const current = existing.property_details || {};
  const text = (key, existingValue) =>
    payload[key] === undefined ? existingValue ?? null : normalizeOptionalText(payload[key]);
  return {
    material: text('property_material', current.material),
    dimensions: text('property_dimensions', current.dimensions),
  };
}

async function validateTechnologyUpdate(technology) {
  if (![technology.id_device, technology.id_brand, technology.id_model].every(Number.isInteger)) {
    throw new AppError('El activo debe conservar un dispositivo, marca y modelo válidos', 400);
  }

  if (!technology.serie) {
    throw new AppError('El campo serie es obligatorio', 400);
  }

  await validateModelBelongsTo(technology);
}

async function validateOptionalTechnology(technology) {
  if (technology.id_model === null) {
    return;
  }

  if (technology.id_brand === null) {
    throw new AppError('El modelo requiere una marca', 400);
  }

  await validateModelBelongsTo(technology);
}

async function validateModelBelongsTo(technology) {
  const model = await repository.findModelById(technology.id_model);

  if (!model || model.id_brand !== technology.id_brand || model.id_device !== technology.id_device) {
    throw new AppError('El modelo no corresponde a la marca y dispositivo seleccionados', 400);
  }
}

function hasTechnologyUpdate(payload) {
  return TECHNOLOGY_UPDATE_FIELDS.some((field) => payload[field] !== undefined);
}

async function resolveUpdateLocation(existing, payload, ids) {
  const { id_ubication, id_department, id_status } = payload;

  const currentStatus = await repository.findStatusById(existing.id_status);

  if (!currentStatus) {
    throw new AppError('El estado actual del equipo no existe', 400);
  }

  let targetStatus = currentStatus;

  if (id_status !== undefined) {
    const status = await repository.findStatusById(ids.parsedStatus);

    if (!status) {
      throw new AppError('El estado proporcionado no existe', 400);
    }

    targetStatus = status;
  }

  const finalIsDiscarded = isDiscardedStatus(targetStatus.name);

  const supportsNullLocation = finalIsDiscarded
    ? await repository.areInventoryLocationFieldsNullable()
    : true;

  const effectiveUbication =
    id_ubication !== undefined ? ids.parsedUbication : existing.id_ubication;

  const effectiveDepartment =
    id_department !== undefined ? ids.parsedDepartment : existing.id_department;

  if (!finalIsDiscarded) {
    if (!effectiveUbication || !effectiveDepartment) {
      throw new AppError('Ubicación y departamento son obligatorios para este estado', 400);
    }

    const [ubicationExists, departmentExists] = await Promise.all([
      repository.findUbicationById(effectiveUbication),
      repository.findDepartmentById(effectiveDepartment),
    ]);

    if (!ubicationExists) {
      throw new AppError('La ubicación proporcionada no existe', 400);
    }

    if (!departmentExists) {
      throw new AppError('El departamento proporcionado no existe', 400);
    }
  }

  return {
    finalIsDiscarded,
    supportsNullLocation,
    effectiveUbication,
    effectiveDepartment,
  };
}

function applyLocationUpdate(updateData, payload, location, ids, existing) {
  const { id_ubication, id_department } = payload;

  const { parsedUbication, parsedDepartment } = ids;

  const { finalIsDiscarded, supportsNullLocation } = location;

  if (finalIsDiscarded) {
    Object.assign(
      updateData,
      supportsNullLocation
        ? {
            id_ubication: null,
            id_department: null,
          }
        : {
            id_ubication: existing.id_ubication,
            id_department: existing.id_department,
          }
    );

    return;
  }

  if (id_ubication !== undefined) {
    updateData.id_ubication = parsedUbication;
  }

  if (id_department !== undefined) {
    updateData.id_department = parsedDepartment;
  }
}

function applySimpleUpdateFields(updateData, payload, ids) {
  const fields = [
    ['tag', payload.tag],
    ['id_status', ids.parsedStatus],
    ['user', payload.user],
    ['observation', payload.observation],
    ['description', payload.description],
    ['id_condition', ids.parsedCondition],
    ['id_administrative_area', ids.parsedAdministrativeArea],
  ];

  for (const [field, value] of fields) {
    if (payload[field] !== undefined) {
      updateData[field] = field === 'user' && typeof value === 'string' ? value.trim() || null : value;
    }
  }
}

function applyTransferDateUpdate(updateData, transferdate) {
  if (transferdate === undefined) {
    return;
  }

  const parsedTransferDate = parseTransferDate(transferdate);

  if (transferdate && !parsedTransferDate) {
    throw new AppError('El campo transferdate debe ser una fecha válida', 400);
  }

  updateData.transferdate = parsedTransferDate;
}

function buildInventoryUpdateData({ payload, ids, location, userId, existing }) {
  const updateData = {
    updated_by: userId,
  };

  applyLocationUpdate(updateData, payload, location, ids, existing);

  applySimpleUpdateFields(updateData, payload, ids);

  applyTransferDateUpdate(updateData, payload.transferdate);

  return updateData;
}

function handleUpdateError(error) {
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
    return new AppError(
      'La base de datos no permite valores nulos para ubicación/departamento. Falta aplicar la migración.',
      400
    );
  }

  return error;
}

export const update = async (idParam, payload, currentUser) => {
  const id = parseIntSafe(idParam);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const existing = await repository.findById(id);

  if (!existing) {
    throw new AppError('Equipo no encontrado', 404);
  }

  const scope = await resolveInventoryScope(currentUser);
  assertInventoryItemInScope(existing, scope);
  await assertInventoryUpdatePermissions(payload, currentUser);

  const userId = currentUser?.id;

  const selectedRuleId = parseOptionalPositiveInt(payload.classification_rule_id);
  if (Number.isNaN(selectedRuleId)) {
    throw new AppError('La clasificación seleccionada no es válida', 400);
  }
  const selectedRule = selectedRuleId ? await resolveClassificationRule(selectedRuleId) : null;

  const ids = parseUpdateIds(payload);

  await validateUpdateReferences(payload, ids);

  const deviceChanged =
    payload.id_device !== undefined && ids.parsedDevice !== currentDeviceId(existing);

  if (deviceChanged && !Number.isInteger(ids.parsedDevice)) {
    throw new AppError('Debe seleccionar el bien', 400);
  }

  const nextRule = deviceChanged
    ? await resolveClassificationRule({ deviceId: ids.parsedDevice })
    : null;
  const effectiveRule = deviceChanged
    ? nextRule
    : selectedRule || existing.asset_classification_rule;

  const isTechnology = effectiveRule
    ? isTechnologyRule(effectiveRule)
    : deviceChanged ||
      Boolean(existing.device_details) ||
      ['id_brand', 'id_model', 'ip'].some((field) => payload[field] !== undefined);

  if (scope?.technologyOnly && !isTechnology) {
    throw new AppError('Solo puedes administrar bienes tecnológicos', 403, 'INVENTORY_OUT_OF_SCOPE');
  }

  const technology = resolveEffectiveTechnology(existing, payload, ids);
  const technologyTouched = deviceChanged || isTechnology || hasTechnicalValues(technology);

  if (isTechnology) {
    await validateTechnologyUpdate(technology);
  } else {
    await validateOptionalTechnology(technology);
  }

  const location = await resolveUpdateLocation(existing, payload, ids);

  const updateData = buildInventoryUpdateData({
    payload,
    ids,
    location,
    userId,
    existing,
  });

  if (deviceChanged) {
    updateData.asset_classification_rule_id = nextRule?.id ?? null;

    if (nextRule?.administrative_area_id != null && payload.id_administrative_area === undefined) {
      updateData.id_administrative_area = nextRule.administrative_area_id;
    }
  } else if (selectedRule) {
    updateData.asset_classification_rule_id = selectedRule.id;
    updateData.asset_type_id = selectedRule.asset_type_id;
    updateData.extension_id = selectedRule.extension_id;
    if (selectedRule.administrative_area_id != null && payload.id_administrative_area === undefined) {
      updateData.id_administrative_area = selectedRule.administrative_area_id;
    }
  }

  const updateTechnology = technologyTouched || Boolean(existing.device_details);
  const isVehicle = effectiveRule?.extension?.code === 'VEHICLES';
  const isLandOrBuilding = ['120401', '120402'].some((prefix) =>
    effectiveRule?.classification?.code_new?.startsWith(prefix)
  );
  const isProperty = effectiveRule?.asset_type?.code === 'PROPERTY' && !isLandOrBuilding;
  const vehicleCatalogEntry = isVehicle && payload.vehicle_catalog_id !== undefined
    ? await repository.findVehicleCatalogById(payload.vehicle_catalog_id)
    : null;
  if (isVehicle && payload.vehicle_catalog_id !== undefined && !vehicleCatalogEntry) {
    throw new AppError('Seleccione una configuración de vehículo válida', 400);
  }
  const vehicleData = isVehicle ? vehicleUpdateData(existing, payload, vehicleCatalogEntry) : null;
  const realEstateData = isLandOrBuilding ? realEstateUpdateData(existing, payload) : null;
  const propertyData = isProperty ? propertyUpdateData(existing, payload) : null;

  if (
    Object.keys(updateData).length === 1 &&
    !(updateTechnology && hasTechnologyUpdate(payload)) &&
    !vehicleData &&
    !realEstateData &&
    !propertyData
  ) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  try {
    const updated = await repository.updateWithTechnology({
      id,
      inventoryData: updateData,
      technologyData: technologyTouched ? technology : null,
      vehicleData,
      realEstateData,
      propertyData,
      expectedInventory: existing,
      userId,
      updateTechnology,
    });

    return mapUpdateInventoryResponse(updated);
  } catch (error) {
    throw handleUpdateError(error);
  }
};
