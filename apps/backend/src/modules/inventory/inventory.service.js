// inventory.service.js

import AppError from '../../common/utils/AppError.js';
import { mapCreateInventoryResponse, mapInventoryResponse } from './inventory.dto.js';
import * as repository from './inventory.repository.js';

import {
  isDiscardedStatus,
  parseOptionalPositiveInt,
  parseRequiredPositiveInt,
  parseTransferDate,
} from '../inventory/utils/inventory.parsers.js';

export const getAll = async (query) => {
  const rawSearch = typeof query?.search === 'string' ? query.search.trim() : '';
  const search = rawSearch || undefined;
  const inventory = await repository.findAll(search);
  return mapInventoryResponse(inventory);
};

function validateCreateRequiredFields({ tag, id_device, id_brand, id_model, serie, id_status }) {
  if (!tag || !id_device || !id_brand || !id_model || !serie || !id_status) {
    throw new AppError('Faltan campos obligatorios', 400);
  }
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
    repository.findDeviceById(idDevice),
    repository.findBrandById(idBrand),
    repository.findModelById(idModel),
    repository.findStatusById(idStatus),
      idCondition === null ? null : repository.findConditionById(idCondition),
      idAdministrativeArea === null ? null : repository.findAdministrativeAreaById(idAdministrativeArea),
    ]);

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
  } = payload;

  validateCreateRequiredFields({
    tag,
    id_device,
    id_brand,
    id_model,
    serie,
    id_status,
  });

  const ids = {
    idUbication: parseOptionalPositiveInt(id_ubication),
    idDepartment: parseOptionalPositiveInt(id_department),
    idDevice: parseRequiredPositiveInt(id_device),
    idBrand: parseRequiredPositiveInt(id_brand),
    idModel: parseRequiredPositiveInt(id_model),
    idStatus: parseRequiredPositiveInt(id_status),
    idCondition: parseOptionalPositiveInt(id_condition),
    idAdministrativeArea: parseOptionalPositiveInt(id_administrative_area),
  };

  validateCreateIds(ids);

  const statusExists = await validateCreateReferences(ids);

  const location = await resolveCreateLocation({
    idUbication: ids.idUbication,
    idDepartment: ids.idDepartment,
    statusName: statusExists.name,
  });

  const transferDateObj = resolveCreateTransferDate(transferdate);

  try {
    const created = await repository.createWithTechnology({
      inventoryData: {
        tag,
        id_ubication: location.idUbication,
        id_department: location.idDepartment,
        user: user || null,
        description: description || null,
        // Legacy obligatorio por schema actual; inventory_devices sigue siendo la fuente tecnológica.
        id_device: ids.idDevice,
        id_brand: ids.idBrand,
        id_model: ids.idModel,
        serie,
        ip: ip || null,
        id_status: ids.idStatus,
        transferdate: transferDateObj,
        observation: observation || null,
        id_condition: ids.idCondition,
        id_administrative_area: ids.idAdministrativeArea,
        created_by: userId,
        created_at: new Date(),
      },
      technologyData: {
        id_device: ids.idDevice,
        id_brand: ids.idBrand,
        id_model: ids.idModel,
        ip: ip || null,
      },
    });

    return mapCreateInventoryResponse(created);
  } catch (error) {
    throw handleCreateError(error);
  }
};
