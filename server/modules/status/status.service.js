import AppError from '../../utils/AppError.js';
import * as repository from './status.repository.js';
import {
  mapCreateStatusResponse,
  mapUpdateStatusResponse
} from './status.dto.js';

export const getAll = async () => {
  return repository.findAll();
};

export const create = async (payload) => {
  const name = String(payload.name || '').trim();
  if (!name) {
    throw new AppError('El nombre del estado es requerido', 400);
  }

  const created = await repository.create({ name });
  return mapCreateStatusResponse(created);
};

export const update = async (idParam, payload) => {
  const id = Number(idParam);
  const name = String(payload.name || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID de estado inválido', 400);
  }

  if (!name) {
    throw new AppError('El nombre del estado es requerido', 400);
  }

  const existing = await repository.findById(id);
  if (!existing) {
    throw new AppError('Estado no encontrado', 404);
  }

  const updated = await repository.updateById(id, { name });
  return mapUpdateStatusResponse(updated);
};
