import bcrypt from 'bcrypt';
import AppError from '../../utils/AppError.js';
import * as repository from './users.repository.js';
import * as dto from './users.dto.js';

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

  if (Number(actor.roleId) === 1) {
    return true;
  }

  const normalizedRole = normalizeRole(actor.role);
  return normalizedRole.includes('admin');
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
  const active = payload.active ?? true;

  const existingUser = await repository.findByUsername(username);
  if (existingUser) {
    throw new AppError('El nombre de usuario ya existe', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const created = await repository.create({
    username,
    nombre_completo: nombreCompleto || null,
    password: hashedPassword,
    must_change_password: true,
    email,
    id_rol,
    active: parseOptionalActive(active) ?? true
  });

  return dto.mapCreateUserResponse(created);
};

export const update = async (idParam, payload) => {
  const userId = parseUserId(idParam);

  const dataToUpdate = {};

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
    must_change_password: forceNextLoginChange
  });

  return dto.mapUpdatePasswordResponse();
};

export const remove = async (idParam) => {
  const userId = parseUserId(idParam);
  const deleted = await repository.deleteById(userId);
  return dto.mapDeleteUserResponse(deleted);
};
