import AppError from '../../common/utils/AppError.js';
import * as repository from './roles.repository.js';

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Rol inválido', 400);
  return id;
}

function parseName(value) {
  const name = String(value || '').trim();
  if (!name) throw new AppError('El nombre del rol es requerido', 400);
  if (name.length > 50) throw new AppError('El nombre del rol no puede superar 50 caracteres', 400);
  return name;
}

function isAdministratorRole(name) {
  return String(name || '').trim().toLowerCase() === 'administrador';
}

function mapRole(role) {
  return {
    id: role.id,
    name: role.name,
    users_count: role._count?.users ?? 0,
    permissions_count: role._count?.rolePermissions ?? 0,
  };
}

export const getAll = async () => (await repository.findAll()).map(mapRole);

export const create = async (payload) => {
  const name = parseName(payload?.name);
  if (await repository.findByName(name)) {
    throw new AppError('Ya existe un rol con ese nombre', 409);
  }

  try {
    return mapRole(await repository.create({ name }));
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('Ya existe un rol con ese nombre', 409);
    throw error;
  }
};

export const update = async (idParam, payload) => {
  const id = parseId(idParam);
  const existing = await repository.findById(id);
  if (!existing) throw new AppError('Rol no encontrado', 404);
  const name = parseName(payload?.name);
  if (isAdministratorRole(existing.name) && name !== existing.name) {
    throw new AppError('El rol Administrador está protegido y no puede renombrarse', 403);
  }
  const duplicate = await repository.findByName(name);
  if (duplicate && duplicate.id !== id) throw new AppError('Ya existe un rol con ese nombre', 409);

  try {
    return mapRole(await repository.update(id, { name }));
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('Ya existe un rol con ese nombre', 409);
    throw error;
  }
};

export const remove = async (idParam) => {
  const id = parseId(idParam);
  const role = await repository.findById(id);
  if (!role) throw new AppError('Rol no encontrado', 404);
  if (isAdministratorRole(role.name)) {
    throw new AppError('El rol Administrador está protegido y no puede eliminarse', 403);
  }
  if (role.users_count > 0) {
    throw new AppError('No se puede eliminar un rol asignado a usuarios', 409);
  }

  try {
    await repository.remove(id);
    return { message: 'Rol eliminado correctamente' };
  } catch (error) {
    if (error.code === 'P2003') {
      throw new AppError('No se puede eliminar el rol porque tiene dependencias', 409);
    }
    throw error;
  }
};