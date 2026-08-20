// activityLogger.js

import { AsyncLocalStorage } from 'node:async_hooks';

export const activityContext = new AsyncLocalStorage();

const ACTIONS = {
  create: 'CREATE',
  createMany: 'CREATE',
  createManyAndReturn: 'CREATE',
  update: 'UPDATE',
  updateMany: 'UPDATE',
  updateManyAndReturn: 'UPDATE',
  delete: 'DELETE',
  deleteMany: 'DELETE',
};

const ENTITY_MAP = {
  bd_inventory: 'BD_INVENTORY',
  inventory_devices: 'INVENTORY_DEVICES',
  bd_incidents: 'BD_INCIDENTS',
  users: 'USERS',
  departments: 'DEPARTMENTS',
  ubications: 'UBICATIONS',
  status: 'STATUS',
  categories: 'CATEGORIES',
  devices: 'DEVICES',
  brands: 'BRANDS',
  models: 'MODELS',
  roles: 'ROLES',
  permissions: 'PERMISSIONS',
  role_permissions: 'ROLE_PERMISSIONS',
  user_permissions: 'USER_PERMISSIONS',
  toner_movements: 'TONER_MOVEMENTS',
  toners: 'TONERS',
  toner_stock: 'TONER_STOCK',
  inventory_transfer_requests: 'INVENTORY_TRANSFER_REQUESTS',
};

const MANY_OPERATIONS = new Set([
  'createMany',
  'createManyAndReturn',
  'updateMany',
  'updateManyAndReturn',
  'deleteMany',
]);

function toSafeJson(value) {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(value, (_, nestedValue) => {
        if (typeof nestedValue === 'bigint') {
          return nestedValue.toString();
        }

        if (nestedValue instanceof Date) {
          return nestedValue.toISOString();
        }

        return nestedValue;
      })
    );
  } catch {
    return null;
  }
}

function resolveAction(operation, oldValues) {
  if (operation === 'upsert') {
    return oldValues ? 'UPDATE' : 'CREATE';
  }

  return ACTIONS[operation] ?? null;
}

function getEntityId({ model, operation, result, args }) {
  if (model === 'inventory_devices') {
    return args?.data?.id_inventory ?? args?.where?.id_inventory ?? result?.id_inventory ?? null;
  }

  if (result?.id !== undefined && result?.id !== null) {
    return result.id;
  }

  if (MANY_OPERATIONS.has(operation)) {
    return null;
  }

  if (typeof args?.where?.id === 'number') {
    return args.where.id;
  }

  return null;
}

function getNewValues({ operation, args, oldValues }) {
  if (operation === 'delete' || operation === 'deleteMany') {
    return null;
  }

  if (operation === 'upsert') {
    return oldValues ? (args?.update ?? null) : (args?.create ?? null);
  }

  return args?.data ?? null;
}

async function fetchOldValues({ prisma, model, operation, args }) {
  const repository = prisma[model];

  if (!repository) {
    return null;
  }

  const shouldFetchSingle =
    operation === 'update' || operation === 'delete' || operation === 'upsert';
  const shouldFetchMany = operation === 'updateMany' || operation === 'deleteMany';

  if (shouldFetchSingle) {
    return repository.findFirst({
      where: args?.where,
    });
  }

  if (shouldFetchMany) {
    if (!args?.where) {
      return null;
    }

    return repository.findMany({
      where: args.where,
    });
  }

  return null;
}

export function getPrismaWithActivityLogger(prisma) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || model === 'activity_logs') {
            return query(args);
          }

          let oldValues = null;

          try {
            oldValues = await fetchOldValues({ prisma, model, operation, args });
          } catch (e) {
            console.log('Old value fetch error:', e.message);
          }

          const action = resolveAction(operation, oldValues);
          const result = await query(args);

          if (!action) {
            return result;
          }

          let newValues = null;

          if (action === 'UPDATE' && result?.id) {
            try {
              const repository = prisma[model];
              newValues = await repository.findFirst({ where: { id: result.id } });
            } catch {
              // fallback al delta si falla
              newValues = getNewValues({ operation, args, oldValues });
            }
          } else {
            newValues = getNewValues({ operation, args, oldValues });
          }

          const ctx = activityContext.getStore();

          try {
            await prisma.activity_logs.create({
              data: {
                entity_type: ENTITY_MAP[model] || model,
                entity_id: getEntityId({ model, operation, result, args }),
                action,
                old_values: toSafeJson(oldValues),
                new_values: toSafeJson(newValues),
                user_id: ctx?.userId ?? null,
                ip_address: ctx?.ipAddress ?? null,
                user_agent: ctx?.userAgent ?? null,
              },
            });
          } catch (err) {
            console.error('Activity log error:', err);
          }

          return result;
        },
      },
    },
  });
}
