import { PrismaClient } from '@prisma/client';
import {
  PERMISSIONS_CATALOG,
  buildPermissionCode,
  resolveRoleDefaultPermissionCodes
} from '../src/common/rbac/permissions.catalog.js';

const prisma = new PrismaClient();

function normalizeCodes(codes = []) {
  return [...new Set(codes.map((code) => String(code || '').trim().toLowerCase()).filter(Boolean))];
}

async function ensurePermissionCatalog() {
  for (const permission of PERMISSIONS_CATALOG) {
    await prisma.permissions.upsert({
      where: {
        module_action: {
          module: permission.module,
          action: permission.action
        }
      },
      create: {
        module: permission.module,
        action: permission.action
      },
      update: {}
    });
  }
}

async function assignDefaultsByRole() {
  const [roles, permissions] = await Promise.all([
    prisma.roles.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    }),
    prisma.permissions.findMany({
      select: { id: true, module: true, action: true }
    })
  ]);

  const permissionIdByCode = new Map(
    permissions.map((permission) => [
      buildPermissionCode(permission.module, permission.action),
      permission.id
    ])
  );

  const allPermissionIds = permissions.map((permission) => permission.id);

  for (const role of roles) {
    const defaults = normalizeCodes(resolveRoleDefaultPermissionCodes(role.name));

    if (!defaults.length) {
      continue;
    }

    const permissionIds = defaults.includes('*.*')
      ? allPermissionIds
      : defaults
          .map((code) => permissionIdByCode.get(code))
          .filter((id) => Number.isInteger(id));

    await prisma.$transaction(async (tx) => {
      await tx.role_permissions.deleteMany({
        where: { id_role: role.id }
      });

      if (permissionIds.length) {
        await tx.role_permissions.createMany({
          data: permissionIds.map((permissionId) => ({
            id_role: role.id,
            id_permission: permissionId
          })),
          skipDuplicates: true
        });
      }
    });

    console.log(
      `[seed.permissions] Rol "${role.name}" actualizado con ${permissionIds.length} permisos`
    );
  }
}

async function main() {
  await ensurePermissionCatalog();
  await assignDefaultsByRole();
  console.log('[seed.permissions] Finalizado correctamente');
}

main()
  .catch((error) => {
    console.error('[seed.permissions] Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
