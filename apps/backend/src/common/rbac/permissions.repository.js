import { prisma } from '../../config/prisma.js';
import { PERMISSIONS_CATALOG } from './permissions.catalog.js';

export const findRoleById = async (roleId) =>
  prisma.roles.findUnique({
    where: { id: Number(roleId) },
    select: { id: true, name: true }
  });

export const findUserByIdWithRole = async (userId) =>
  prisma.users.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      nombre_completo: true,
      username: true,
      id_rol: true,
      roles: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

export const findRoles = async () =>
  prisma.roles.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true
    }
  });

export const findAllPermissions = async () => {
  try {
    return await prisma.permissions.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
      select: {
        id: true,
        module: true,
        action: true
      }
    });
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    const tableMeta = String(error?.meta?.table || '').toLowerCase();
    const isMissingPermissionsTable =
      error?.code === 'P2021' &&
      (message.includes('permissions') || tableMeta.includes('permissions'));

    if (!isMissingPermissionsTable) {
      throw error;
    }

    // Compatibilidad temporal: catálogo estático mientras se aplican migraciones.
    return PERMISSIONS_CATALOG.map((permission, index) => ({
      id: -(index + 1),
      module: permission.module,
      action: permission.action
    }));
  }
};

export const findPermissionCodesByRoleId = async (roleId) => {
  const rows = await prisma.role_permissions.findMany({
    where: { id_role: Number(roleId) },
    select: {
      permission: {
        select: {
          module: true,
          action: true
        }
      }
    }
  });

  return rows.map((row) => ({
    module: row.permission.module,
    action: row.permission.action
  }));
};

export const findUserPermissionOverridesByUserId = async (userId) => {
  let rows = [];

  try {
    rows = await prisma.user_permissions.findMany({
      where: { id_user: Number(userId) },
      select: {
        allow: true,
        permission: {
          select: {
            module: true,
            action: true
          }
        }
      }
    });
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    const tableMeta = String(error?.meta?.table || '').toLowerCase();
    const isMissingUserPermissionsTable =
      error?.code === 'P2021' &&
      (message.includes('user_permissions') || tableMeta.includes('user_permissions'));

    if (isMissingUserPermissionsTable) {
      return [];
    }

    throw error;
  }

  return rows.map((row) => ({
    module: row.permission.module,
    action: row.permission.action,
    allow: Boolean(row.allow)
  }));
};

export const findPermissionsByPairs = async (pairs) => {
  const OR = pairs.map(({ module, action }) => ({ module, action }));

  if (!OR.length) {
    return [];
  }

  return prisma.permissions.findMany({
    where: { OR },
    select: {
      id: true,
      module: true,
      action: true
    }
  });
};

export const upsertPermission = async ({ module, action }) =>
  prisma.permissions.upsert({
    where: {
      module_action: {
        module,
        action
      }
    },
    create: {
      module,
      action
    },
    update: {}
  });

export const replaceRolePermissions = async ({ roleId, permissionIds }) => {
  const normalizedRoleId = Number(roleId);

  return prisma.$transaction(async (tx) => {
    await tx.role_permissions.deleteMany({
      where: { id_role: normalizedRoleId }
    });

    if (permissionIds.length) {
      await tx.role_permissions.createMany({
        data: permissionIds.map((permissionId) => ({
          id_role: normalizedRoleId,
          id_permission: permissionId
        })),
        skipDuplicates: true
      });
    }

    return tx.role_permissions.findMany({
      where: { id_role: normalizedRoleId },
      select: {
        permission: {
          select: {
            module: true,
            action: true
          }
        }
      }
    });
  });
};

export const replaceUserPermissionOverrides = async ({ userId, entries }) => {
  const normalizedUserId = Number(userId);

  return prisma.$transaction(async (tx) => {
    await tx.user_permissions.deleteMany({
      where: { id_user: normalizedUserId }
    });

    if (entries.length) {
      await tx.user_permissions.createMany({
        data: entries.map((entry) => ({
          id_user: normalizedUserId,
          id_permission: entry.permissionId,
          allow: Boolean(entry.allow)
        })),
        skipDuplicates: true
      });
    }

    return tx.user_permissions.findMany({
      where: { id_user: normalizedUserId },
      select: {
        allow: true,
        permission: {
          select: {
            module: true,
            action: true
          }
        }
      }
    });
  });
};
