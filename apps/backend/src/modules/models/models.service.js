// models.service.js

import AppError from '../../common/utils/AppError.js';
import { buildDeleteDependencyMessage } from '../../common/utils/deleteDependencyMessage.js';
import {
  mapCreateModelResponse,
  mapDeleteModelResponse,
  mapUpdateModelResponse,
} from './models.dto.js';
import * as repository from './models.repository.js';

export const getAll = async () => {
  return repository.findAll();
};

export const getPrinters = async () => {
  return repository.findPrinterModels();
};

export const create = async (payload) => {
  const name = String(payload.name || '').trim();
  const id_brand = Number(payload.id_brand);
  const id_device = payload.id_device === undefined || payload.id_device === null || payload.id_device === ''
    ? null
    : Number(payload.id_device);

  if (!name || !Number.isInteger(id_brand) || id_brand < 1 || (id_device !== null && (!Number.isInteger(id_device) || id_device < 1))) {
    throw new AppError('Faltan datos requeridos', 400);
  }

  const brand = await repository.findBrandById(id_brand);
  if (!brand) throw new AppError('La marca seleccionada no existe', 400);

  try {
    const existingModel = await repository.findByNameBrandDevice({
      name,
      id_brand,
      id_device,
    });

    if (existingModel) {
      throw new AppError('El modelo ya existe para esta marca y tipo de dispositivo', 409);
    }

    const created = await repository.create({
      name,
      id_brand,
      id_device,
    });

    return mapCreateModelResponse(created);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('El modelo ya existe para esta marca y tipo de dispositivo', 409);
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
  const id_device = payload.id_device === undefined || payload.id_device === null || payload.id_device === ''
    ? null
    : Number(payload.id_device);

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

  const brand = await repository.findBrandById(id_brand);
  if (!brand) throw new AppError('La marca seleccionada no existe', 400);
  if (id_device !== null && (!Number.isInteger(id_device) || id_device < 1)) {
    throw new AppError('Seleccione un dispositivo tecnológico válido', 400);
  }

  const duplicateModel = await repository.findDuplicateNameBrandDevice({
    name,
    id_brand,
    id_device,
    excludeId: id,
  });
  if (duplicateModel) {
    throw new AppError('El modelo ya existe para esta marca y tipo de dispositivo', 409);
  }

  const updated = await repository.updateById(id, {
    name,
    id_brand,
    id_device,
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

  const [inventoryCount, tonersCount] = await Promise.all([
    repository.countInventoryByModelId(id),
    repository.countTonersByPrinterModelId(id),
  ]);

  if (inventoryCount > 0 || tonersCount > 0) {
    throw new AppError(
      buildDeleteDependencyMessage({
        subject: 'el modelo',
        dependencies: [
          { count: inventoryCount, label: 'registro(s) de inventario' },
          { count: tonersCount, label: 'tóner(s)' },
        ],
      }),
      409
    );
  }

  try {
    await repository.deleteById(id);
  } catch (error) {
    if (error.code === 'P2003') {
      throw new AppError(
        buildDeleteDependencyMessage({
          subject: 'el modelo',
          dependencies: [],
        }),
        409
      );
    }
    throw error;
  }

  return mapDeleteModelResponse();
};
