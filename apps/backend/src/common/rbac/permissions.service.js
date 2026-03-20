import AppError from '../utils/AppError.js';
import * as repository from './permissions.repository.js';
import {
  buildPermissionCode,
  normalizePermissionCode,
  resolveRoleDefaultPermissionCodes,
  splitPermissionCode
} from './permissions.catalog.js';

function uniquePermissionCodes(codes = []) {
  const normalized = codes
    .map((code) => normalizePermissionCode(code))
    .filter(Boolean);

  return [...new Set(normalized)];
}

function mapPairsToCodes(rows = []) {
  return uniquePermissionCodes(
    rows.map(({ module, action }) => buildPermissionCode(module, action))
  );
}

function mapUserOverrideRows(rows = []) {
  const grants = [];
  const denies = [];

  rows.forEach((row) => {
    const code = buildPermissionCode(row.module, row.action);

    if (row.allow) {
      grants.push(code);
      return;
    }

    denies.push(code);
  });

  return {
    grants: uniquePermissionCodes(grants),
    denies: uniquePermissionCodes(denies)
  };
}

function applyUserOverrides(baseCodes = [], overrides = {}) {
  const effectiveSet = new Set(uniquePermissionCodes(baseCodes));

  (overrides.grants || []).forEach((code) => effectiveSet.add(code));
  (overrides.denies || []).forEach((code) => effectiveSet.delete(code));

  return [...effectiveSet].sort((a, b) => a.localeCompare(b));
}

function isMissingPermissionTableError(error, tableNames = []) {
  if (error?.code !== 'P2021') {
    return false;
  }

  const message = String(error?.message || '').toLowerCase();
  const metaTable = String(error?.meta?.table || '').toLowerCase();

  return tableNames.some((tableName) => {
    const normalized = String(tableName || '').trim().toLowerCase();
    return normalized && (message.includes(normalized) || metaTable.includes(normalized));
  });
}

function buildMigrationRequiredError(message) {
  return new AppError(
    message,
    503,
    'MIGRATION_REQUIRED'
  );
}

export const getRolePermissionCodes = async (roleId) => {
  const parsedRoleId = Number(roleId);

  if (!Number.isInteger(parsedRoleId) || parsedRoleId <= 0) {
    throw new AppError('Rol inválido', 400);
  }

  try {
    const pairs = await repository.findPermissionCodesByRoleId(parsedRoleId);
    return mapPairsToCodes(pairs);
  } catch (error) {
    const missingPermissionInfra = isMissingPermissionTableError(error, [
      'role_permissions',
      'permissions'
    ]);

    if (!missingPermissionInfra) {
      throw error;
    }

    const role = await repository.findRoleById(parsedRoleId);
    if (!role) {
      return [];
    }

    // Compatibilidad temporal: si faltan tablas RBAC, usar defaults por nombre de rol.
    return uniquePermissionCodes(resolveRoleDefaultPermissionCodes(role.name));
  }
};

export const getUserPermissionOverrideCodes = async (userId) => {
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new AppError('Usuario inválido', 400);
  }

  const rows = await repository.findUserPermissionOverridesByUserId(parsedUserId);
  return mapUserOverrideRows(rows);
};

export const getEffectivePermissionCodesForUser = async ({ userId }) => {
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new AppError('Usuario inválido', 400);
  }

  const user = await repository.findUserByIdWithRole(parsedUserId);
  if (!user) {
    return [];
  }

  const resolvedRoleId = Number(user.id_rol);
  if (!Number.isInteger(resolvedRoleId) || resolvedRoleId <= 0) {
    throw new AppError('Rol inválido', 400);
  }

  const [rolePermissions, userOverrides] = await Promise.all([
    getRolePermissionCodes(resolvedRoleId),
    getUserPermissionOverrideCodes(parsedUserId)
  ]);

  return applyUserOverrides(rolePermissions, userOverrides);
};

export const ensurePermissionsByCodes = async (codes = []) => {
  const uniqueCodes = uniquePermissionCodes(codes);

  if (!uniqueCodes.length) {
    return [];
  }

  let pairs = [];
  try {
    pairs = uniqueCodes.map((code) => splitPermissionCode(code));
  } catch (_error) {
    throw new AppError('Formato de permiso inválido', 400, 'INVALID_PERMISSIONS');
  }
  let found = [];
  try {
    found = await repository.findPermissionsByPairs(pairs);
  } catch (error) {
    if (isMissingPermissionTableError(error, ['permissions'])) {
      throw buildMigrationRequiredError(
        'Falta la estructura de permisos. Ejecuta las migraciones de base de datos.'
      );
    }

    throw error;
  }

  if (found.length !== pairs.length) {
    const foundCodes = mapPairsToCodes(found);
    const missing = uniqueCodes.filter((code) => !foundCodes.includes(code));

    throw new AppError(
      `Permisos inválidos: ${missing.join(', ')}`,
      400,
      'INVALID_PERMISSIONS'
    );
  }

  return found;
};

export const setRolePermissionsByCodes = async ({ roleId, codes }) => {
  const parsedRoleId = Number(roleId);

  if (!Number.isInteger(parsedRoleId) || parsedRoleId <= 0) {
    throw new AppError('Rol inválido', 400);
  }

  const role = await repository.findRoleById(parsedRoleId);
  if (!role) {
    throw new AppError('Rol no encontrado', 404);
  }

  const permissions = await ensurePermissionsByCodes(codes);
  let rows = [];
  try {
    rows = await repository.replaceRolePermissions({
      roleId: parsedRoleId,
      permissionIds: permissions.map((permission) => permission.id)
    });
  } catch (error) {
    if (isMissingPermissionTableError(error, ['role_permissions', 'permissions'])) {
      throw buildMigrationRequiredError(
        'Falta la estructura de permisos por rol. Ejecuta las migraciones de base de datos.'
      );
    }

    throw error;
  }

  return {
    role,
    permissions: mapPairsToCodes(
      rows.map((row) => ({
        module: row.permission.module,
        action: row.permission.action
      }))
    )
  };
};

export const setUserPermissionOverridesByCodes = async ({
  userId,
  grants = [],
  denies = []
}) => {
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new AppError('Usuario inválido', 400);
  }

  const user = await repository.findUserByIdWithRole(parsedUserId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const normalizedGrants = uniquePermissionCodes(grants);
  const normalizedDenies = uniquePermissionCodes(denies);

  const overlap = normalizedGrants.filter((code) =>
    normalizedDenies.includes(code)
  );

  if (overlap.length) {
    throw new AppError(
      `No puedes permitir y denegar el mismo permiso: ${overlap.join(', ')}`,
      400,
      'INVALID_USER_PERMISSION_OVERRIDES'
    );
  }

  const allRequested = uniquePermissionCodes([
    ...normalizedGrants,
    ...normalizedDenies
  ]);

  const resolvedPermissions = await ensurePermissionsByCodes(allRequested);
  const permissionIdByCode = new Map(
    resolvedPermissions.map((permission) => [
      buildPermissionCode(permission.module, permission.action),
      permission.id
    ])
  );

  const entries = [
    ...normalizedGrants.map((code) => ({
      permissionId: permissionIdByCode.get(code),
      allow: true
    })),
    ...normalizedDenies.map((code) => ({
      permissionId: permissionIdByCode.get(code),
      allow: false
    }))
  ].filter((entry) => Number.isInteger(entry.permissionId));

  let rows = [];
  try {
    rows = await repository.replaceUserPermissionOverrides({
      userId: parsedUserId,
      entries
    });
  } catch (error) {
    if (isMissingPermissionTableError(error, ['user_permissions'])) {
      throw buildMigrationRequiredError(
        'Falta la estructura de permisos por usuario. Ejecuta las migraciones de base de datos.'
      );
    }

    throw error;
  }

  const overrides = mapUserOverrideRows(
    rows.map((row) => ({
      module: row.permission.module,
      action: row.permission.action,
      allow: row.allow
    }))
  );

  const effectivePermissions = await getEffectivePermissionCodesForUser({
    userId: parsedUserId,
    roleId: user.id_rol
  });

  return {
    user,
    overrides,
    effectivePermissions
  };
};

export const hasPermissionCode = ({ grantedCodes = [], requiredCode }) => {
  const normalizedRequired = normalizePermissionCode(requiredCode);
  if (!normalizedRequired) {
    return true;
  }

  const grantedSet = new Set(uniquePermissionCodes(grantedCodes));

  if (grantedSet.has('*.*')) {
    return true;
  }

  const { module, action } = splitPermissionCode(normalizedRequired);

  return (
    grantedSet.has(normalizedRequired) ||
    grantedSet.has(`${module}.*`) ||
    grantedSet.has(`*.${action}`)
  );
};

export const getResolvedUserPermissionCodes = async (user) => {
  if (!user) {
    return [];
  }

  if (user.permissionsLoaded) {
    return uniquePermissionCodes(user.permissions || []);
  }

  const userId = Number(user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return [];
  }

  const permissionCodes = await getEffectivePermissionCodesForUser({
    userId,
    roleId: user.roleId
  });
  user.permissions = permissionCodes;
  user.permissionsLoaded = true;

  return permissionCodes;
};

export const mapPermissionRowsToCodes = mapPairsToCodes;
export const normalizePermissionCodes = uniquePermissionCodes;
