// users.service.js

import bcrypt from 'bcrypt';
import AppError from '../../common/utils/AppError.js';
import { buildDeleteDependencyMessage } from '../../common/utils/deleteDependencyMessage.js';
import * as dto from './users.dto.js';
import * as repository from './users.repository.js';

function parseUserId(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID de usuario inválido', 400);
  }
  return id;
}

function parseOptionalId(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('ID inválido', 400);
  }

  return parsed;
}

function parseOptionalRoleId(value) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('El rol no es válido', 400);
  }

  return parsed;
}

async function validateLocationAssignment(idUbication, idDepartment) {
  if (idUbication !== null && idUbication !== undefined) {
    if (!(await repository.findUbicationById(idUbication))) {
      throw new AppError('La ubicación no existe', 400);
    }
  }

  if (idDepartment !== null && idDepartment !== undefined) {
    const department = await repository.findDepartmentById(idDepartment);
    if (!department) throw new AppError('El departamento no existe', 400);
    if (idUbication !== null && idUbication !== undefined && department.id_ubication !== idUbication) {
      throw new AppError('El departamento no pertenece a la ubicación seleccionada', 400);
    }
  }
}

function parseOptionalActive(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;

  throw new AppError('Estado activo inválido', 400);
}

function normalizeRole(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isAdminActor(actor) {
  if (!actor) {
    return false;
  }

  const normalizedRole = normalizeRole(actor.role);
  return normalizedRole.includes('admin');
}

function isAdministratorRoleName(name) {
  return normalizeRole(name) === 'administrador';
}

function parseRequirePasswordChange(value) {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;

  throw new AppError('Valor inválido para requirePasswordChange', 400);
}

export const getAll = async () => {
  return repository.findAll();
};

export const getTechnicians = async () => {
  return repository.findTechnicians();
};

export const getRoles = async () => {
  return repository.findRoles();
};

export const search = async (query) => {
  const q = String(query?.q || '').trim();
  if (q.length < 2) {
    return [];
  }

  const users = await repository.searchByQuery(q);
  return users.filter((user) => user.email && user.email.trim() !== '');
};

export const create = async (payload) => {
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '').trim();
  const nombreCompleto = String(payload.nombre_completo || '').trim();
  const email = String(payload.email || '').trim();

  if (!username || !password || !email) {
    throw new AppError('Faltan campos obligatorios', 400);
  }

  const id_rol = parseOptionalRoleId(payload.id_rol);
  const id_ubication = parseOptionalId(payload.id_ubication) ?? null;
  const id_department = parseOptionalId(payload.id_department) ?? null;
  const active = payload.active ?? true;

  const existingUser = await repository.findByUsername(username);
  if (existingUser) {
    throw new AppError('El nombre de usuario ya existe', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await validateLocationAssignment(id_ubication, id_department);

  const created = await repository.create({
    username,
    nombre_completo: nombreCompleto || null,
    password: hashedPassword,
    must_change_password: true,
    email,
    id_rol,
    id_ubication,
    id_department,
    active: parseOptionalActive(active) ?? true,
  });

  return dto.mapCreateUserResponse(created);
};

export const update = async (idParam, payload) => {
  const userId = parseUserId(idParam);

  const dataToUpdate = {};
  const existingUser = await repository.findByIdWithRole(userId);
  if (!existingUser) throw new AppError('Usuario no encontrado', 404);

  if (isAdministratorRoleName(existingUser.roles?.name)) {
    throw new AppError('El usuario Administrador está protegido y no puede editarse', 403);
  }

  if (payload.username !== undefined) {
    dataToUpdate.username = String(payload.username).trim();
  }

  if (payload.nombre_completo !== undefined) {
    dataToUpdate.nombre_completo = String(payload.nombre_completo).trim();
  }

  if (payload.id_rol !== undefined) {
    dataToUpdate.id_rol = parseOptionalRoleId(payload.id_rol);
  }

  if (payload.email !== undefined) {
    dataToUpdate.email = payload.email ? String(payload.email).trim() : null;
  }

  if (payload.id_ubication !== undefined) {
    dataToUpdate.id_ubication = parseOptionalId(payload.id_ubication);
  }

  if (payload.id_department !== undefined) {
    dataToUpdate.id_department = parseOptionalId(payload.id_department);
  }

  const finalUbication = Object.hasOwn(dataToUpdate, 'id_ubication')
    ? dataToUpdate.id_ubication
    : existingUser.id_ubication;
  const finalDepartment = Object.hasOwn(dataToUpdate, 'id_department')
    ? dataToUpdate.id_department
    : existingUser.id_department;
  await validateLocationAssignment(finalUbication, finalDepartment);

  if (payload.active !== undefined) {
    dataToUpdate.active = parseOptionalActive(payload.active);
  }

  if (Object.keys(dataToUpdate).length === 0) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  const updated = await repository.updateById(userId, dataToUpdate);
  return dto.mapUpdateUserResponse(updated);
};

export const updatePassword = async (
  idParam,
  newPassword,
  { actor, requirePasswordChange } = {}
) => {
  const userId = parseUserId(idParam);
  const password = String(newPassword || '').trim();

  if (!actor?.id) {
    throw new AppError('No autenticado', 401);
  }

  const actorId = Number(actor.id);
  const actorIsAdmin = isAdminActor(actor);
  const isOwnPasswordChange = actorId === userId;

  if (!isOwnPasswordChange && !actorIsAdmin) {
    throw new AppError('No autorizado para cambiar esta contraseña', 403);
  }

  if (!password) {
    throw new AppError('La nueva contraseña es requerida', 400);
  }

  const forceNextLoginChange = parseRequirePasswordChange(requirePasswordChange);
  const hashedPassword = await bcrypt.hash(password, 10);

  await repository.updateById(userId, {
    password: hashedPassword,
    must_change_password: forceNextLoginChange,
  });

  return dto.mapUpdatePasswordResponse();
};

export const remove = async (idParam, { actor } = {}) => {
  const userId = parseUserId(idParam);

  const user = await repository.findByIdWithRole(userId);

  if (!user) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  // No eliminar al administrador principal

  if (user.username.toLowerCase() === 'admin' || isAdministratorRoleName(user.roles?.name)) {
    throw new AppError('El usuario administrador está protegido y no puede eliminarse.', 400);
  }

  // No eliminarse a sí mismo

  if (actor?.id === userId) {
    throw new AppError('No puede eliminar su propio usuario.', 400);
  }

  const history = await repository.countUserHistory(userId);

  const hasHistory =
    history.reportedIncidents > 0 ||
    history.assignedIncidents > 0 ||
    history.tonerMovements > 0 ||
    history.transferRequests > 0 ||
    history.approvedTransfers > 0 ||
    history.activityLogs > 0 ||
    history.userPermissions > 0;

  if (hasHistory) {
    throw new AppError(
      `${buildDeleteDependencyMessage({
        subject: 'el usuario',
        dependencies: [
          { count: history.reportedIncidents, label: 'incidencia(s) reportada(s)' },
          { count: history.assignedIncidents, label: 'incidencia(s) asignada(s)' },
          { count: history.tonerMovements, label: 'movimiento(s) de tóner' },
          { count: history.transferRequests, label: 'solicitud(es) de traslado' },
          { count: history.approvedTransfers, label: 'traslado(s) revisado(s)' },
          { count: history.activityLogs, label: 'registro(s) de actividad' },
          { count: history.userPermissions, label: 'permiso(s)' },
        ],
      })} Puede desactivarlo, pero no eliminarlo.`,
      409
    );
  }

  let deleted;
  try {
    deleted = await repository.deleteById(userId);
  } catch (error) {
    if (error.code === 'P2003') {
      throw new AppError(
        buildDeleteDependencyMessage({
          subject: 'el usuario',
          dependencies: [],
        }),
        409
      );
    }
    throw error;
  }

  return dto.mapDeleteUserResponse(deleted);
};
