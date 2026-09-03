// inventory.service.js

import AppError from '../../common/utils/AppError.js';
import { mapCreateInventoryResponse, mapInventoryResponse } from './inventory.dto.js';
import * as repository from './inventory.repository.js';
import {
  resolveClassificationRule,
  validateExtensionCompatibility,
} from './services/inventory-classification.service.js';

import {
  isDiscardedStatus,
  parseOptionalPositiveInt,
  parseRequiredPositiveInt,
  parseTransferDate,
} from '../inventory/utils/inventory.parsers.js';

export const getAll = async (query) => {
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
    const result = await repository.findPage({ search, filters, ...pagination });

    return {
      data: mapInventoryResponse(result.data),
      page: pagination.page,
      limit: pagination.take,
      offset: pagination.skip,
      total: result.total,
      totalPages: Math.max(Math.ceil(result.total / pagination.take), 1),
    };
  }

  const inventory = await repository.findAll(search, filters);
  return mapInventoryResponse(inventory);
};

export const getAdministrativeAreas = async () => repository.findAdministrativeAreas();

export const getClassificationRules = async (options = {}) => {
  const findActiveRules = options.findActiveRules ?? repository.findActiveAssetClassificationRules;
  const rules = await findActiveRules();
  const activeRules = rules.filter((rule) => rule?.active === true);

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

const GENERIC_TECHNOLOGY_FALLBACK = {
  deviceId: 12,
  brandId: 19,
  modelId: 93,
};

function hasTechnologyPayload({ id_device, id_brand, id_model }) {
  return [id_device, id_brand, id_model].some(
    (value) => value !== undefined && value !== null && value !== ''
  );
}

function validateCreateRequiredFields({ tag, serie, id_status }) {
  if (!tag || !serie || !id_status) {
    throw new AppError('Faltan campos obligatorios', 400);
  }
}

function normalizeHolderName(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function resolveTechnologyIds(payload) {
  const hasTechnology = hasTechnologyPayload(payload);

  if (!hasTechnology) {
    return {
      idDevice: GENERIC_TECHNOLOGY_FALLBACK.deviceId,
      idBrand: GENERIC_TECHNOLOGY_FALLBACK.brandId,
      idModel: GENERIC_TECHNOLOGY_FALLBACK.modelId,
      hasTechnology: false,
    };
  }

  const missingTechnologyFields = [
    ['id_device', payload.id_device],
    ['id_brand', payload.id_brand],
    ['id_model', payload.id_model],
  ].filter(([, value]) => value === undefined || value === null || value === '');

  if (missingTechnologyFields.length > 0) {
    throw new AppError('Si indica tecnología debe completar equipo, marca y modelo', 400);
  }

  return {
    idDevice: Number(payload.id_device),
    idBrand: Number(payload.id_brand),
    idModel: Number(payload.id_model),
    hasTechnology: true,
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
  assetTypeId,
  extensionId,
  hasTechnology,
}) {
  const [deviceExists, brandExists, modelExists, statusExists, conditionExists, areaExists, assetTypeExists, extensionExists] =
    await Promise.all([
      repository.findDeviceById(idDevice),
      repository.findBrandById(idBrand),
      repository.findModelById(idModel),
      repository.findStatusById(idStatus),
      idCondition === null ? null : repository.findConditionById(idCondition),
      idAdministrativeArea === null ? null : repository.findAdministrativeAreaById(idAdministrativeArea),
      assetTypeId === null ? null : repository.findAssetTypeById(assetTypeId),
      extensionId === null ? null : repository.findAssetExtensionById(extensionId),
    ]);

  if (hasTechnology) {
    if (!deviceExists) {
      throw new AppError('El dispositivo especificado no existe', 400);
    }

    if (!brandExists) {
      throw new AppError('La marca especificada no existe', 400);
    }

    if (!modelExists) {
      throw new AppError('El modelo especificado no existe', 400);
    }

    if (modelExists.id_brand !== idBrand || modelExists.id_device !== idDevice) {
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

  if (assetTypeId !== null && (!assetTypeExists || !assetTypeExists.active)) {
    throw new AppError('El tipo general de activo no existe o está inactivo', 400);
  }

  if (extensionId !== null && (!extensionExists || !extensionExists.active)) {
    throw new AppError('La extensión técnica no existe o está inactiva', 400);
  }

  return statusExists;
}

export const resolveOptionalTechnologyClassification = async (
  ruleId,
  {
    resolveRule = resolveClassificationRule,
    findDevicesExtension = repository.findAssetClassificationExtensionByCode,
  } = {}
) => {
  if (ruleId === null || ruleId === undefined) {
    return null;
  }

  const rule = await resolveRule(ruleId);
  const devicesExtension = await findDevicesExtension('DEVICES');

  if (!devicesExtension) {
    throw new AppError('La extensión tecnológica DEVICES no está configurada', 500);
  }

  if (!devicesExtension.active) {
    throw new AppError('La extensión tecnológica DEVICES está inactiva', 400);
  }

  return validateExtensionCompatibility({
    rule,
    extensionId: devicesExtension.id,
  });
};

export const resolveCreationMode = async (
  ruleId,
  options = {},
) => {
  if (ruleId === null || ruleId === undefined) {
    return { mode: 'LEGACY', rule: null };
  }

  const rule = await resolveOptionalTechnologyClassification(ruleId, options);
  return { mode: 'TECHNOLOGY', rule };
};

export const resolveInventoryClassification = async ({
  ruleId = null,
  deviceId = null,
  assetTypeId = null,
  extensionId = null,
  administrativeAreaId = null,
}) => {
  if (ruleId !== null && ruleId !== undefined) {
    const selectedRule = await resolveClassificationRule(ruleId);
    const resolvedRule = await resolveClassificationRule({
      deviceId: deviceId ?? selectedRule.device_id ?? null,
      assetTypeId: assetTypeId ?? selectedRule.asset_type_id ?? null,
      extensionId: extensionId ?? selectedRule.extension_id ?? null,
      administrativeAreaId:
        administrativeAreaId ?? selectedRule.administrative_area_id ?? null,
    });

    if (!resolvedRule || resolvedRule.id !== selectedRule.id) {
      throw new AppError('La regla de clasificación no corresponde al contexto enviado', 400);
    }

    return resolvedRule;
  }

  return resolveClassificationRule({
    deviceId,
    assetTypeId,
    extensionId,
    administrativeAreaId,
  });
};

function buildGeneralInventoryData({
  tag,
  location,
  user,
  description,
  ids,
  serie,
  ip,
  transferDate,
  observation,
  classificationRule,
  userId,
}) {
  return {
    tag,
    id_ubication: location.idUbication,
    id_department: location.idDepartment,
    user: normalizeHolderName(user),
    description: description || null,
    id_device: ids.idDevice,
    id_brand: ids.idBrand,
    id_model: ids.idModel,
    serie,
    ip: ip || null,
    id_status: ids.idStatus,
    transferdate: transferDate,
    observation: observation || null,
    id_condition: ids.idCondition,
    id_administrative_area: ids.idAdministrativeArea,
    asset_classification_rule_id: classificationRule?.id ?? null,
    created_by: userId,
    created_at: new Date(),
  };
}

function buildTechnologyExtensionData({ idDevice, idBrand, idModel, ip, hasTechnology = true }) {
  if (!hasTechnology) {
    return null;
  }

  return {
    id_device: idDevice,
    id_brand: idBrand,
    id_model: idModel,
    ip: ip || null,
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
    id_administrative_area,
    asset_classification_rule_id,
    asset_type_id,
    extension_id,
  } = payload;

  validateCreateRequiredFields({
    tag,
    serie,
    id_status,
  });

  const technologyChoice = resolveTechnologyIds({
    id_device,
    id_brand,
    id_model,
  });

  const ids = {
    idUbication: parseOptionalPositiveInt(id_ubication),
    idDepartment: parseOptionalPositiveInt(id_department),
    idDevice: technologyChoice.idDevice,
    idBrand: technologyChoice.idBrand,
    idModel: technologyChoice.idModel,
    idStatus: parseRequiredPositiveInt(id_status),
    idCondition: parseOptionalPositiveInt(id_condition),
    idAdministrativeArea: parseOptionalPositiveInt(id_administrative_area),
    assetClassificationRuleId: parseOptionalPositiveInt(asset_classification_rule_id),
    assetTypeId: parseOptionalPositiveInt(asset_type_id),
    extensionId: parseOptionalPositiveInt(extension_id),
    hasTechnology: technologyChoice.hasTechnology,
  };

  validateCreateIds(ids);

  const classificationRule = await resolveInventoryClassification({
    ruleId: ids.assetClassificationRuleId,
    deviceId: ids.hasTechnology ? ids.idDevice : null,
    assetTypeId: ids.assetTypeId,
    extensionId: ids.extensionId,
    administrativeAreaId: ids.idAdministrativeArea,
  });

  const mode = classificationRule ? 'TECHNOLOGY' : 'LEGACY';

  if (mode !== 'LEGACY' && !classificationRule) {
    throw new AppError('La clasificación del activo no pudo resolverse', 400);
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
      inventoryData: buildGeneralInventoryData({
        tag,
        location,
        user,
        description,
        ids,
        serie,
        ip,
        transferDate: transferDateObj,
        observation,
        classificationRule,
        userId,
      }),
      technologyData: buildTechnologyExtensionData({
        idDevice: ids.idDevice,
        idBrand: ids.idBrand,
        idModel: ids.idModel,
        ip,
        hasTechnology: ids.hasTechnology,
      }),
    });

    return mapCreateInventoryResponse(created);
  } catch (error) {
    throw handleCreateError(error);
  }
};
