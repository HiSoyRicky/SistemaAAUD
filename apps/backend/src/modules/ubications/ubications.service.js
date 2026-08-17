// ubications.service.js

import { logger } from '../../common/logger.js';
import AppError from '../../common/utils/AppError.js';
import { mapUpdateUbicationResponse } from './ubications.dto.js';
import * as repository from './ubications.repository.js';

export const getAll = async () => {
  return repository.findAll();
};

export const update = async (idParam, payload) => {
  const id = Number(idParam);
  const name = String(payload.name || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }

  if (!name) {
    throw new AppError('El nombre de la ubicación es requerido', 400);
  }

  const existing = await repository.findById(id);
  if (!existing) {
    throw new AppError('Ubicación no encontrada', 404);
  }

  const updated = await repository.updateById(id, { name });
  return mapUpdateUbicationResponse(updated);
};

export const create = async (payload) => {
  const name = String(payload.name || '');

  if (!name) {
    throw new AppError('El nombre de la ubicación es requerido', 400);
  }

  try {
    const created = await repository.create({ name });
    return created;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('La ubicación ya existe', 409);
    }

    logger.error({ error }, 'Error inesperado creando ubicación');

    throw error;
  }
};
