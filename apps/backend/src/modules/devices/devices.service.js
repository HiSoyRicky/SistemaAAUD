import AppError from '../../common/utils/AppError.js';
import * as repository from './devices.repository.js';
import {
  mapCreateDeviceResponse,
  mapUpdateDeviceResponse,
  mapDeleteDeviceResponse
} from './devices.dto.js';

export const getAll = async () => {
  return repository.findAll();
};

export const create = async (payload) => {
  const name = String(payload.name || '').trim();
  if (!name) {
    throw new AppError('Faltan datos requeridos', 400);
  }

  try {
    const existingDevice = await repository.findByName(name);
    if (existingDevice) {
      throw new AppError('El dispositivo ya existe', 409);
    }

    const created = await repository.create({ name });
    return mapCreateDeviceResponse(created);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('El dispositivo ya existe', 409);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Error al agregar dispositivo', 500);
  }
};

export const update = async (idParam, payload) => {
  const id = Number(idParam);
  const name = String(payload.name || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  if (!name) {
    throw new AppError('El nombre es obligatorio', 400);
  }

  const device = await repository.findById(id);
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  const updated = await repository.updateById(id, { name });
  return mapUpdateDeviceResponse(updated);
};

export const remove = async (idParam) => {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  const device = await repository.findById(id);
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  await repository.deleteById(id);
  return mapDeleteDeviceResponse();
};
