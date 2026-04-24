import bcrypt from 'bcrypt';
import AppError from '../../common/utils/AppError.js';
import { getIncidentByToken } from '../../common/utils/token.js';
import { createIncident } from './incidentService.js';
import { updateIncident } from './incidentUpdateService.js';
import * as repository from './incidents.repository.js';
import {
  mapIncidentListItem,
  mapIncidentDetail,
  mapDeleteIncidentResponse,
  mapTonerRequestOptions
} from './incidents.dto.js';

function parseIncidentId(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }
  return id;
}

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} inválido`, 400);
  }
  return parsed;
}

export const getAll = async () => {
  const incidents = await repository.findAll();
  return incidents.map(mapIncidentListItem);
};

export const getById = async (idParam) => {
  const id = parseIncidentId(idParam);
  const incident = await repository.findById(id);

  if (!incident) {
    throw new AppError('Incidencia no encontrada', 404);
  }

  return mapIncidentDetail(incident);
};

export const getPublicByToken = async (token) => {
  return getIncidentByToken(token);
};

export const getTonerOptions = async (query) => {
  const id_ubication = parsePositiveInt(query?.id_ubication, 'Ubicación');
  const id_department = parsePositiveInt(query?.id_department, 'Departamento');

  const department = await repository.findDepartmentById(id_department);

  if (!department) {
    throw new AppError('Departamento no encontrado', 404);
  }

  if (Number(department.id_ubication) !== id_ubication) {
    throw new AppError('El departamento no pertenece a la ubicación seleccionada', 400);
  }

  const printerModels = await repository.findPrinterModelsWithTonersByLocationDepartment({
    id_ubication,
    id_department
  });

  return mapTonerRequestOptions(printerModels);
};

export const create = async ({ payload, req, io }) => {
  return createIncident({ payload, req, io });
};

export const update = async ({ idParam, payload, currentUser, io }) => {
  return updateIncident({ idParam, payload, currentUser, io });
};

export const remove = async ({ idParam, password, currentUser, io }) => {
  const id = parseIncidentId(idParam);
  const pwd = String(password || '');

  if (!pwd) {
    throw new AppError('Contraseña requerida', 400);
  }

  if (pwd.length < 6) {
    throw new AppError('Contraseña demasiado corta', 400);
  }

  const userId = Number(currentUser?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('No autenticado', 401);
  }

  const user = await repository.findUserPasswordById(userId);
  if (!user || !user.password) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const passwordMatch = await bcrypt.compare(pwd, user.password);
  if (!passwordMatch) {
    throw new AppError('Contraseña incorrecta', 401);
  }

  const result = await repository.deleteById(id);
  if (result.count === 0) {
    throw new AppError('Incidencia no encontrada', 404);
  }

  if (io) {
    io.emit('incidentDeleted', { id });
  }

  return mapDeleteIncidentResponse();
};
