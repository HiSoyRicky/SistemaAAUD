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

import * as repository from '../inventory.repository.js';

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
  const { id_ubication, id_department, id_device, id_brand, id_model, id_status } = payload;

  const ids = {
    parsedUbication: parseOptionalPositiveInt(id_ubication),
    parsedDepartment: parseOptionalPositiveInt(id_department),
    parsedDevice: parseOptionalPositiveInt(id_device),
    parsedBrand: parseOptionalPositiveInt(id_brand),
    parsedModel: parseOptionalPositiveInt(id_model),
    parsedStatus: parseOptionalPositiveInt(id_status),
  };

  const validations = [
    ['id_ubication', ids.parsedUbication, 'Ubicación inválida'],
    ['id_department', ids.parsedDepartment, 'Departamento inválido'],
    ['id_device', ids.parsedDevice, 'Dispositivo inválido'],
    ['id_brand', ids.parsedBrand, 'Marca inválida'],
    ['id_model', ids.parsedModel, 'Modelo inválido'],
    ['id_status', ids.parsedStatus, 'Estado inválido'],
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
  ]);
}

async function validateTechnologyUpdateConsistency(existing, payload, ids) {
  const technology = existing.inventory_devices;
  const effectiveDevice =
    payload.id_device !== undefined ? ids.parsedDevice : technology?.id_device ?? existing.id_device;
  const effectiveBrand =
    payload.id_brand !== undefined ? ids.parsedBrand : technology?.id_brand ?? existing.id_brand;
  const effectiveModel =
    payload.id_model !== undefined ? ids.parsedModel : technology?.id_model ?? existing.id_model;

  if (![effectiveDevice, effectiveBrand, effectiveModel].every(Number.isInteger)) {
    throw new AppError('El activo debe conservar un dispositivo, marca y modelo válidos', 400);
  }

  const model = await repository.findModelById(effectiveModel);

  if (!model || model.id_brand !== effectiveBrand || model.id_device !== effectiveDevice) {
    throw new AppError('El modelo no corresponde a la marca y dispositivo seleccionados', 400);
  }
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
    ['serie', payload.serie],
    ['id_status', ids.parsedStatus],
    ['user', payload.user],
    ['observation', payload.observation],
  ];

  for (const [field, value] of fields) {
    if (payload[field] !== undefined) {
      updateData[field] = value;
    }
  }
}

function hasTechnologyUpdate(payload) {
  return ['id_device', 'id_brand', 'id_model', 'ip'].some(
    (field) => payload[field] !== undefined
  );
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

  await assertInventoryUpdatePermissions(payload, currentUser);

  const userId = currentUser?.id;

  const ids = parseUpdateIds(payload);

  await validateUpdateReferences(payload, ids);
  await validateTechnologyUpdateConsistency(existing, payload, ids);

  const location = await resolveUpdateLocation(existing, payload, ids);

  const updateData = buildInventoryUpdateData({
    payload,
    ids,
    location,
    userId,
    existing,
  });

  if (Object.keys(updateData).length === 1 && !hasTechnologyUpdate(payload)) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  try {
    const technology = existing.inventory_devices;
    const technologyData = {
      id_device:
        payload.id_device !== undefined
          ? ids.parsedDevice
          : technology?.id_device ?? existing.id_device,
      id_brand:
        payload.id_brand !== undefined ? ids.parsedBrand : technology?.id_brand ?? existing.id_brand,
      id_model:
        payload.id_model !== undefined ? ids.parsedModel : technology?.id_model ?? existing.id_model,
      ip: payload.ip !== undefined ? payload.ip : technology?.ip ?? existing.ip,
    };

    const updated = await repository.updateWithTechnology({
      id,
      inventoryData: updateData,
      technologyData,
      updateTechnology: hasTechnologyUpdate(payload) || !technology,
    });

    return mapUpdateInventoryResponse(updated);
  } catch (error) {
    throw handleUpdateError(error);
  }
};
