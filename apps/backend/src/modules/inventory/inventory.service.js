import AppError from '../../common/utils/AppError.js';
import * as repository from './inventory.repository.js';
import {
  mapInventoryResponse,
  mapCreateInventoryResponse,
  mapUpdateInventoryResponse
} from './inventory.dto.js';

function parseIntSafe(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

export const getAll = async (query) => {
  const search = query?.search;
  const inventory = await repository.findAll(search);
  return mapInventoryResponse(inventory);
};

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
    observation
  } = payload;

  if (
    !tag ||
    !id_ubication ||
    !id_department ||
    !id_device ||
    !id_brand ||
    !id_model ||
    !serie ||
    !id_status
  ) {
    throw new AppError('Faltan campos obligatorios', 400);
  }

  const idUbication = parseIntSafe(id_ubication);
  const idDepartment = parseIntSafe(id_department);
  const idDevice = parseIntSafe(id_device);
  const idBrand = parseIntSafe(id_brand);
  const idModel = parseIntSafe(id_model);
  const idStatus = parseIntSafe(id_status);

  if (
    [idUbication, idDepartment, idDevice, idBrand, idModel, idStatus].some(
      (value) => Number.isNaN(value)
    )
  ) {
    throw new AppError('Los IDs deben ser números enteros válidos', 400);
  }

  const [
    ubicationExists,
    departmentExists,
    deviceExists,
    brandExists,
    modelExists,
    statusExists
  ] = await Promise.all([
    repository.findUbicationById(idUbication),
    repository.findDepartmentById(idDepartment),
    repository.findDeviceById(idDevice),
    repository.findBrandById(idBrand),
    repository.findModelById(idModel),
    repository.findStatusById(idStatus)
  ]);

  if (!ubicationExists) throw new AppError('La ubicación especificada no existe', 400);
  if (!departmentExists) throw new AppError('El departamento especificado no existe', 400);
  if (!deviceExists) throw new AppError('El dispositivo especificado no existe', 400);
  if (!brandExists) throw new AppError('La marca especificada no existe', 400);
  if (!modelExists) throw new AppError('El modelo especificado no existe', 400);
  if (!statusExists) throw new AppError('El estado especificado no existe', 400);

  let transferDateObj = null;
  if (transferdate) {
    const date = transferdate instanceof Date ? transferdate : new Date(transferdate);
    if (Number.isNaN(date.getTime())) {
      throw new AppError('El campo transferdate debe ser una fecha válida', 400);
    }
    transferDateObj = date;
  }

  try {
    const created = await repository.create({
      tag,
      id_ubication: idUbication,
      id_department: idDepartment,
      user: user || null,
      id_device: idDevice,
      id_brand: idBrand,
      id_model: idModel,
      serie,
      ip: ip || null,
      id_status: idStatus,
      transferdate: transferDateObj,
      observation: observation || null,
      created_by: userId,
      created_at: new Date()
    });

    return mapCreateInventoryResponse(created);
  } catch (error) {
    if (error.code === 'P2003') {
      throw new AppError('ID de referencia inválido (FK no existe)', 400);
    }
    if (error.code === 'P2002') {
      throw new AppError('Ya existe un dispositivo con ese tag o serie', 409);
    }
    if (error.code === 'P2004') {
      throw new AppError('Error de restricción en la base de datos', 400);
    }
    if (error.code === 'P2011') {
      throw new AppError('Error: campo requerido no puede ser nulo', 400);
    }

    throw new AppError('Error al crear dispositivo', 500);
  }
};

export const update = async (idParam, payload, currentUser) => {
  const id = parseIntSafe(idParam);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

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
    observation
  } = payload;

  if (id_ubication && Number.isNaN(parseIntSafe(id_ubication))) {
    throw new AppError('Ubicación inválida', 400);
  }
  if (id_department && Number.isNaN(parseIntSafe(id_department))) {
    throw new AppError('Departamento inválido', 400);
  }
  if (id_device && Number.isNaN(parseIntSafe(id_device))) {
    throw new AppError('Dispositivo inválido', 400);
  }
  if (id_brand && Number.isNaN(parseIntSafe(id_brand))) {
    throw new AppError('Marca inválida', 400);
  }
  if (id_model && Number.isNaN(parseIntSafe(id_model))) {
    throw new AppError('Modelo inválido', 400);
  }
  if (id_status && Number.isNaN(parseIntSafe(id_status))) {
    throw new AppError('Estado inválido', 400);
  }

  if (id_ubication) {
    const ubication = await repository.findUbicationById(parseIntSafe(id_ubication));
    if (!ubication) {
      throw new AppError('La ubicación proporcionada no existe', 400);
    }
  }

  if (id_department) {
    const department = await repository.findDepartmentById(parseIntSafe(id_department));
    if (!department) {
      throw new AppError('El departamento proporcionado no existe', 400);
    }
  }

  if (id_device) {
    const device = await repository.findDeviceById(parseIntSafe(id_device));
    if (!device) {
      throw new AppError('El dispositivo proporcionado no existe', 400);
    }
  }

  const updateData = { updated_by: userId };

  if (tag !== undefined) updateData.tag = tag;
  if (id_ubication !== undefined) updateData.id_ubication = parseIntSafe(id_ubication);
  if (id_department !== undefined) updateData.id_department = parseIntSafe(id_department);
  if (id_device !== undefined) updateData.id_device = parseIntSafe(id_device);
  if (id_brand !== undefined) updateData.id_brand = parseIntSafe(id_brand);
  if (id_model !== undefined) updateData.id_model = parseIntSafe(id_model);
  if (serie !== undefined) updateData.serie = serie;
  if (id_status !== undefined) updateData.id_status = parseIntSafe(id_status);
  if (user !== undefined) updateData.user = user;
  if (ip !== undefined) updateData.ip = ip;
  if (observation !== undefined) updateData.observation = observation;
  if (transferdate !== undefined) {
    updateData.transferdate = transferdate ? new Date(transferdate) : null;
  }

  if (Object.keys(updateData).length === 1) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  const updated = await repository.updateById(id, updateData);
  return mapUpdateInventoryResponse(updated);
};
