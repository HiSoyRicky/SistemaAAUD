import * as repository from './departments.repository.js';
import AppError from '../../common/utils/AppError.js';
import {
  mapDepartment,
  mapCreateDepartmentResponse,
  mapUpdateDepartmentResponse,
  mapDeleteDepartmentResponse
} from './departments.dto.js';

export const getAll = async () => {
  const departments = await repository.findAll();

  return departments.map(mapDepartment);
};

export const create = async (payload) => {
  const { name, id_ubication } = payload;

  if (!name || !id_ubication) {
    throw new AppError('Faltan datos requeridos', 400);
  }

  const ubicationId = Number(id_ubication);
  if (!Number.isInteger(ubicationId) || ubicationId <= 0) {
    throw new AppError('ID de ubicación inválido', 400);
  }

  const ubicationExists = await repository.findUbicationById(ubicationId);
  if (!ubicationExists) {
    throw new AppError('La ubicación especificada no existe', 404);
  }

  const created = await repository.create({
    name: String(name).trim(),
    id_ubication: ubicationId
  });

  return mapCreateDepartmentResponse(created);
};

export const update = async (idParam, payload) => {
  const id = Number(idParam);
  const { name, id_ubication } = payload;

  if (!name || !id_ubication) {
    throw new AppError('Campos requeridos', 400);
  }

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  const ubicationId = Number(id_ubication);
  if (!Number.isInteger(ubicationId) || ubicationId <= 0) {
    throw new AppError('ID inválido', 400);
  }

  const ubicationExists = await repository.findUbicationById(ubicationId);
  if (!ubicationExists) {
    throw new AppError('La ubicación especificada no existe', 400);
  }

  const existing = await repository.findById(id);
  if (!existing) {
    throw new AppError('Departamento no encontrado', 404);
  }

  try {
    const updated = await repository.updateById(id, {
      name: String(name).trim(),
      id_ubication: ubicationId
    });

    return mapUpdateDepartmentResponse(updated);
  } catch (error) {
    if (error.code === 'P2003') {
      throw new AppError('La ubicación especificada no existe', 400);
    }

    if (error.code === 'P2002') {
      throw new AppError('Ya existe un departamento con ese nombre', 400);
    }

    throw new AppError('Error interno del servidor', 500);
  }
};

export const remove = async (idParam, { authorized }) => {
  if (!authorized) {
    throw new AppError('No autorizado para eliminar', 403);
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  try {
    const deleted = await repository.deleteById(id);
    return mapDeleteDepartmentResponse(deleted);
  } catch (error) {
    if (error.code === 'P2025') {
      throw new AppError('Departamento no encontrado', 404);
    }
    throw error;
  }
};
