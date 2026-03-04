import AppError from '../../utils/AppError.js';
import * as repository from './models.repository.js';
import {
  mapCreateModelResponse,
  mapUpdateModelResponse,
  mapDeleteModelResponse
} from './models.dto.js';

export const getAll = async () => {
  return repository.findAll();
};

export const getPrinters = async () => {
  return repository.findPrinterModels();
};

export const create = async (payload) => {
  const name = String(payload.name || '').trim();
  const id_brand = Number(payload.id_brand);
  const id_device = Number(payload.id_device);

  if (!name || !id_brand || !id_device) {
    throw new AppError('Faltan datos requeridos', 400);
  }

  try {
    const existingModel = await repository.findByNameBrandDevice({
      name,
      id_brand,
      id_device
    });

    if (existingModel) {
      throw new AppError(
        'El modelo ya existe para esta marca y tipo de dispositivo',
        409
      );
    }

    const created = await repository.create({
      name,
      id_brand,
      id_device
    });

    return mapCreateModelResponse(created);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError(
        'El modelo ya existe para esta marca y tipo de dispositivo',
        409
      );
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Error al agregar modelo', 500);
  }
};

export const update = async (idParam, payload) => {
  const id = Number(idParam);
  const name = String(payload.name || '').trim();
  const id_brand = Number(payload.id_brand);
  const id_device = Number(payload.id_device);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  if (!name) {
    throw new AppError('El nombre es obligatorio', 400);
  }

  const model = await repository.findById(id);
  if (!model) {
    throw new AppError('Modelo no encontrado', 404);
  }

  const updated = await repository.updateById(id, {
    name,
    id_brand,
    id_device
  });

  return mapUpdateModelResponse(updated);
};

export const remove = async (idParam) => {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  const model = await repository.findById(id);
  if (!model) {
    throw new AppError('Modelo no encontrado', 404);
  }

  await repository.deleteById(id);
  return mapDeleteModelResponse();
};
