import AppError from '../../common/utils/AppError.js';
import * as permissionsRepository from '../../common/rbac/permissions.repository.js';
import { buildPermissionCode } from '../../common/rbac/permissions.catalog.js';
import {
  getEffectivePermissionCodesForUser,
  getRolePermissionCodes,
  getUserPermissionOverrideCodes,
  setRolePermissionsByCodes,
  setUserPermissionOverridesByCodes,
  normalizePermissionCodes
} from '../../common/rbac/permissions.service.js';

function parseRoleId(idParam) {
  const roleId = Number(idParam);

  if (!Number.isInteger(roleId) || roleId <= 0) {
    throw new AppError('Rol inválido', 400);
  }

  return roleId;
}

function mapPermissions(permissions = []) {
  return permissions.map((permission) => ({
    id: permission.id,
    module: permission.module,
    action: permission.action,
    code: buildPermissionCode(permission.module, permission.action)
  }));
}

function mapRolePermissionSummary(role, permissionCodes) {
  return {
    id: role.id,
    name: role.name,
    permissions: normalizePermissionCodes(permissionCodes)
  };
}

function mapUserSummary(user) {
  return {
    id: user.id,
    username: user.username,
    nombre_completo: user.nombre_completo,
    role: {
      id: user.roles?.id ?? user.id_rol,
      name: user.roles?.name || null
    }
  };
}

export const getOverview = async () => {
  const [roles, permissions] = await Promise.all([
    permissionsRepository.findRoles(),
    permissionsRepository.findAllPermissions()
  ]);

  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const permissionCodes = await getRolePermissionCodes(role.id);
      return mapRolePermissionSummary(role, permissionCodes);
    })
  );

  return {
    permissions: mapPermissions(permissions),
    roles: rolesWithPermissions
  };
};

export const getCurrentUserPermissions = async (currentUser) => {
  const userId = Number(currentUser?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Usuario no autenticado', 401);
  }

  return {
    permissions: await getEffectivePermissionCodesForUser({ userId })
  };
};

export const getRolePermissions = async (idRoleParam) => {
  const roleId = parseRoleId(idRoleParam);

  const role = await permissionsRepository.findRoleById(roleId);
  if (!role) {
    throw new AppError('Rol no encontrado', 404);
  }

  const permissionCodes = await getRolePermissionCodes(roleId);

  return mapRolePermissionSummary(role, permissionCodes);
};

export const updateRolePermissions = async (idRoleParam, payload) => {
  const roleId = parseRoleId(idRoleParam);

  const requestedPermissions = Array.isArray(payload?.permissions)
    ? payload.permissions
    : [];

  const normalized = normalizePermissionCodes(requestedPermissions);

  const result = await setRolePermissionsByCodes({
    roleId,
    codes: normalized
  });

  return {
    message: 'Permisos de rol actualizados correctamente',
    role: {
      id: result.role.id,
      name: result.role.name
    },
    permissions: result.permissions
  };
};

export const getUserPermissions = async (idUserParam) => {
  const userId = Number(idUserParam);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Usuario inválido', 400);
  }

  const user = await permissionsRepository.findUserByIdWithRole(userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const [rolePermissions, overrides, effectivePermissions] = await Promise.all([
    getRolePermissionCodes(user.id_rol),
    getUserPermissionOverrideCodes(userId),
    getEffectivePermissionCodesForUser({
      userId,
      roleId: user.id_rol
    })
  ]);

  return {
    user: mapUserSummary(user),
    rolePermissions,
    userOverrides: overrides,
    effectivePermissions
  };
};

export const updateUserPermissions = async (idUserParam, payload) => {
  const userId = Number(idUserParam);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Usuario inválido', 400);
  }

  const grants = Array.isArray(payload?.grants) ? payload.grants : [];
  const denies = Array.isArray(payload?.denies) ? payload.denies : [];

  const result = await setUserPermissionOverridesByCodes({
    userId,
    grants,
    denies
  });

  return {
    message: 'Permisos por usuario actualizados correctamente',
    user: mapUserSummary(result.user),
    userOverrides: result.overrides,
    effectivePermissions: result.effectivePermissions
  };
};
