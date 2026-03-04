import AppError from '../../utils/AppError.js';
import * as repository from './ubications.repository.js';
import { mapUpdateUbicationResponse } from './ubications.dto.js';

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
