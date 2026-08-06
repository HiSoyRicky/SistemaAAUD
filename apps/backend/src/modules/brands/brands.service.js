import AppError from '../../common/utils/AppError.js';
import { buildDeleteDependencyMessage } from '../../common/utils/deleteDependencyMessage.js';
import * as repository from './brands.repository.js';
import {
  mapCreateBrandResponse,
  mapDeleteBrandResponse,
  mapUpdateBrandResponse
} from './brands.dto.js';

export const getAll = async () => {
  return repository.findAll();
};

export const create = async (payload) => {
  const name = String(payload.name || '').trim();
  if (!name) {
    throw new AppError('Faltan datos requeridos', 400);
  }

  try {
    const existingBrand = await repository.findByName(name);
    if (existingBrand) {
      throw new AppError('La marca ya existe', 409);
    }

    const created = await repository.create({ name });
    return mapCreateBrandResponse(created);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('La marca ya existe', 409);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Error al agregar marca', 500);
  }
};

export const update = async (idParam, payload) => {
  const id = Number(idParam);
  const name = String(payload.name || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }
  if (!name) {
    throw new AppError('Nombre es requerido', 400);
  }

  const existingBrand = await repository.findById(id);
  if (!existingBrand) {
    throw new AppError('Marca no encontrada', 404);
  }

  const duplicateBrand = await repository.findByName(name, id);
  if (duplicateBrand) {
    throw new AppError('Ya existe una marca con este nombre', 409);
  }

  const updated = await repository.updateById(id, { name });
  return mapUpdateBrandResponse(updated);
};

export const remove = async (idParam) => {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  const existingBrand = await repository.findById(id);
  if (!existingBrand) {
    throw new AppError('Marca no encontrada', 404);
  }

  const [inventoryCount, modelsCount] = await Promise.all([
    repository.countInventoryByBrandId(id),
    repository.countModelsByBrandId(id)
  ]);

  if (inventoryCount > 0 || modelsCount > 0) {
    throw new AppError(
      buildDeleteDependencyMessage({
        subject: 'la marca',
        associatedWord: 'asociada',
        dependencies: [
          { count: inventoryCount, label: 'registro(s) de inventario' },
          { count: modelsCount, label: 'modelo(s)' }
        ]
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
          subject: 'la marca',
          associatedWord: 'asociada',
          dependencies: []
        }),
        409
      );
    }
    throw error;
  }

  return mapDeleteBrandResponse();
};
