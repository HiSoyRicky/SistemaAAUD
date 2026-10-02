// inventory.repository.js

import { prisma } from '../../config/prisma.js';
import { Prisma } from '@prisma/client';
import { runWithActivityLoggingSuppressed } from '../../common/services/activityLogger.js';
import AppError from '../../common/utils/AppError.js';
import {
  sameInventoryAuditState,
  writeInventoryAuditEvent,
} from './services/inventory-audit.service.js';

const includeRelations = {
  asset_classification_rule: {
    include: {
      device: { select: { id: true, name: true } },
      classification: true,
      asset_type: true,
      extension: true,
    },
  },
  devices: { select: { id: true, name: true } },
  brands: { select: { id: true, name: true } },
  models: { select: { id: true, name: true } },
  inventory_devices: {
    include: {
      device: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      model: { select: { id: true, name: true } },
    },
  },
  departments: { select: { id: true, name: true } },
  ubications: { select: { id: true, name: true } },
  status: { select: { id: true, name: true } },
  condition: { select: { id: true, name: true } },
  administrative_area: { select: { id: true, name: true } },
};

export const findAssetClassificationRuleById = async (id) => {
  return prisma.inventory_asset_classification_rules.findUnique({
    where: { id: Number(id) },
    include: {
      device: { select: { id: true, name: true } },
      classification: true,
      asset_type: true,
      extension: true,
      administrative_area: true,
    },
  });
};

export const findActiveAssetClassificationRules = async () => {
  return prisma.inventory_asset_classification_rules.findMany({
    where: { active: true },
    include: {
      classification: {
        select: {
          id: true,
          code_new: true,
          description: true,
          active: true,
          is_assignable: true,
        },
      },
      device: {
        select: {
          id: true,
          name: true,
        },
      },
      asset_type: {
        select: {
          id: true,
          code: true,
          name: true,
          active: true,
        },
      },
      extension: {
        select: {
          id: true,
          code: true,
          name: true,
          active: true,
        },
      },
      administrative_area: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ classification: { code_new: 'asc' } }, { id: 'asc' }],
  });
};

export const findAssetClassificationRulesByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.inventory_asset_classification_rules.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      classification: { select: { code_new: true, description: true } },
      asset_type: { select: { code: true, name: true } },
      extension: { select: { code: true, name: true } },
    },
  });
};

export const findAssetsForClassificationPreview = async () => {
  return prisma.bd_inventory.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      tag: true,
      asset_classification_rule: {
        include: {
          classification: true,
          asset_type: true,
          extension: true,
        },
      },
    },
  });
};

export const findAssetClassificationExtensionByCode = async (code) => {
  return prisma.inventory_asset_extensions.findUnique({
    where: { code },
    select: { id: true, code: true, active: true },
  });
};

export const findAssetTypeByCode = async (code) =>
  prisma.inventory_asset_types.findUnique({
    where: { code },
    select: { id: true, code: true, active: true },
  });

export const findInventoryClassificationBatch = async ({ cursorId = null, take = 200 }) =>
  prisma.bd_inventory.findMany({
    ...(cursorId !== null && { cursor: { id: cursorId }, skip: 1 }),
    take,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      id_device: true,
      id_administrative_area: true,
      asset_classification_rule_id: true,
      inventory_devices: { select: { id: true } },
      asset_classification_rule: {
        select: {
          id: true,
          asset_type_id: true,
          extension_id: true,
          administrative_area_id: true,
        },
      },
    },
  });

export const updateReconciledInventory = async (id, data, db) =>
  db.bd_inventory.update({
    where: { id: Number(id) },
    data,
    select: {
      id: true,
      asset_classification_rule_id: true,
      id_administrative_area: true,
    },
  });

export const findActiveClassificationCandidates = async ({ deviceId, assetTypeId, extensionId }) =>
  prisma.inventory_asset_classification_rules.findMany({
    where: {
      active: true,
      extension_id: extensionId,
      classification: { is: { active: true, is_assignable: true } },
      asset_type: { is: { active: true } },
      OR: [
        { device_id: Number(deviceId) },
        { device_id: null, asset_type_id: Number(assetTypeId), is_default: true },
      ],
    },
    select: {
      id: true,
      device_id: true,
      asset_type_id: true,
      extension_id: true,
      administrative_area_id: true,
    },
  });

let inventoryLocationNullableCache = null;

function buildInventorySearchWhere(search, filters = {}) {
  const relationNameFilter = (relation, value) =>
    value ? { [relation]: { is: { name: { equals: value, mode: 'insensitive' } } } } : null;
  const filterConditions = [
    filters.tag && { tag: { contains: filters.tag, mode: 'insensitive' } },
    filters.serie && { serie: { contains: filters.serie, mode: 'insensitive' } },
    filters.description && { description: { contains: filters.description, mode: 'insensitive' } },
    filters.user && { user: { contains: filters.user, mode: 'insensitive' } },
    filters.ip && {
      inventory_devices: { is: { ip: { contains: filters.ip, mode: 'insensitive' } } },
    },
    filters.device && {
      inventory_devices: {
        is: { device: { is: { name: { equals: filters.device, mode: 'insensitive' } } } },
      },
    },
    filters.brand && {
      inventory_devices: {
        is: { brand: { is: { name: { equals: filters.brand, mode: 'insensitive' } } } },
      },
    },
    filters.model && {
      inventory_devices: {
        is: { model: { is: { name: { equals: filters.model, mode: 'insensitive' } } } },
      },
    },
    relationNameFilter('departments', filters.department),
    relationNameFilter('ubications', filters.ubication),
    relationNameFilter('status', filters.status),
    relationNameFilter('condition', filters.condition),
    relationNameFilter('administrative_area', filters.administrative_area),
    filters.classification && {
      asset_classification_rule: {
        is: {
          classification: {
            is: { description: { equals: filters.classification, mode: 'insensitive' } },
          },
        },
      },
    },
    filters.asset_type && {
      asset_classification_rule: {
        is: { asset_type: { is: { name: { equals: filters.asset_type, mode: 'insensitive' } } } },
      },
    },
    filters.extension && {
      asset_classification_rule: {
        is: { extension: { is: { name: { equals: filters.extension, mode: 'insensitive' } } } },
      },
    },
  ].filter(Boolean);

  const searchConditions = search
    ? {
        OR: [
          { serie: { contains: search, mode: 'insensitive' } },
          { tag: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { user: { contains: search, mode: 'insensitive' } },
          { status: { is: { name: { contains: search, mode: 'insensitive' } } } },
          {
            condition: {
              is: { name: { contains: search, mode: 'insensitive' } },
            },
          },
          {
            asset_classification_rule: {
              is: {
                classification: {
                  is: { code_new: { contains: search, mode: 'insensitive' } },
                },
              },
            },
          },
          {
            asset_classification_rule: {
              is: {
                classification: {
                  is: { description: { contains: search, mode: 'insensitive' } },
                },
              },
            },
          },
          {
            asset_classification_rule: {
              is: {
                asset_type: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          {
            asset_classification_rule: {
              is: {
                extension: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          {
            inventory_devices: {
              is: { ip: { contains: search, mode: 'insensitive' } },
            },
          },
          { observation: { contains: search, mode: 'insensitive' } },
          {
            inventory_devices: {
              is: {
                device: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          {
            inventory_devices: {
              is: {
                brand: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          {
            inventory_devices: {
              is: {
                model: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          { departments: { is: { name: { contains: search, mode: 'insensitive' } } } },
          { ubications: { is: { name: { contains: search, mode: 'insensitive' } } } },
          { administrative_area: { is: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      }
    : {};

  return filterConditions.length
    ? { AND: [searchConditions, ...filterConditions] }
    : searchConditions;
}

export const findAll = async (search, filters = {}) => {
  return prisma.bd_inventory.findMany({
    where: buildInventorySearchWhere(search, filters),
    include: includeRelations,
    orderBy: { id: 'asc' },
  });
};

// Cada filtro de columna solo debe ofrecer valores que aun existan dado el resto
// de filtros ya aplicados (filtrado en cascada / "faceted search").
export const findInventoryFilterOptions = async (filters = {}) => {
  const buildWhereExcluding = (excludeKey) => {
    const rest = { ...filters };
    delete rest[excludeKey];
    return buildInventorySearchWhere('', rest);
  };

  const withAnd = (where, extra) => ({ AND: [where, extra] });

  const [
    locationRows,
    departmentRows,
    administrativeAreaRows,
    deviceRows,
    brandRows,
    modelRows,
    statusRows,
    userRows,
  ] = await Promise.all([
    prisma.bd_inventory.findMany({
      where: withAnd(buildWhereExcluding('ubication'), { id_ubication: { not: null } }),
      distinct: ['id_ubication'],
      select: { id_ubication: true },
    }),
    prisma.bd_inventory.findMany({
      where: withAnd(buildWhereExcluding('department'), { id_department: { not: null } }),
      distinct: ['id_department'],
      select: { id_department: true },
    }),
    prisma.bd_inventory.findMany({
      where: withAnd(buildWhereExcluding('administrative_area'), {
        id_administrative_area: { not: null },
      }),
      distinct: ['id_administrative_area'],
      select: { id_administrative_area: true },
    }),
    prisma.bd_inventory.findMany({
      where: buildWhereExcluding('device'),
      distinct: ['id_device'],
      select: { id_device: true },
    }),
    prisma.bd_inventory.findMany({
      where: buildWhereExcluding('brand'),
      distinct: ['id_brand'],
      select: { id_brand: true },
    }),
    prisma.bd_inventory.findMany({
      where: buildWhereExcluding('model'),
      distinct: ['id_model'],
      select: { id_model: true },
    }),
    prisma.bd_inventory.findMany({
      where: buildWhereExcluding('status'),
      distinct: ['id_status'],
      select: { id_status: true },
    }),
    prisma.bd_inventory.findMany({
      where: withAnd(buildWhereExcluding('user'), { user: { not: null } }),
      distinct: ['user'],
      select: { user: true },
    }),
  ]);

  const [ubications, departments, administrativeAreas, devices, brands, models, statuses] =
    await Promise.all([
      prisma.ubications.findMany({
        where: { id: { in: locationRows.map((row) => row.id_ubication) } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.departments.findMany({
        where: { id: { in: departmentRows.map((row) => row.id_department) } },
        select: { id: true, name: true, id_ubication: true },
        orderBy: { name: 'asc' },
      }),
      prisma.inventory_administrative_areas.findMany({
        where: { id: { in: administrativeAreaRows.map((row) => row.id_administrative_area) } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.devices.findMany({
        where: { id: { in: deviceRows.map((row) => row.id_device) } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.brands.findMany({
        where: { id: { in: brandRows.map((row) => row.id_brand) } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.models.findMany({
        where: { id: { in: modelRows.map((row) => row.id_model) } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.status.findMany({
        where: { id: { in: statusRows.map((row) => row.id_status) } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

  return {
    ubications,
    departments,
    administrative_areas: administrativeAreas,
    devices,
    brands,
    models,
    statuses,
    users: userRows
      .map((row) => row.user)
      .filter(Boolean)
      .sort(),
  };
};

// Estadisticas globales para los KPIs del encabezado (no deben limitarse a la
// pagina actual cuando el listado usa paginacion en el servidor).
export const findInventoryStats = async ({ search, filters }) => {
  const where = buildInventorySearchWhere(search, filters);
  const rows = await prisma.bd_inventory.findMany({
    where,
    select: {
      status: { select: { name: true } },
      ubications: { select: { name: true } },
    },
  });

  const DISCARD_STATUSES = new Set(['DESCARTADO', 'PARA DESCARTE', 'MAL ESTADO']);
  const REVIEW_STATUSES = new Set(['PARA DESCARTE', 'MAL ESTADO']);

  let active = 0;
  let warning = 0;
  const locations = new Set();

  for (const row of rows) {
    const statusName = String(row.status?.name || '').toUpperCase();
    if (statusName && !DISCARD_STATUSES.has(statusName)) active += 1;
    if (REVIEW_STATUSES.has(statusName)) warning += 1;
    if (row.ubications?.name) locations.add(row.ubications.name);
  }

  return { total: rows.length, active, warning, locations: locations.size };
};

export const findPage = async ({ search, filters, skip, take }) => {
  const where = buildInventorySearchWhere(search, filters);
  const [data, total] = await prisma.$transaction([
    prisma.bd_inventory.findMany({
      where,
      include: includeRelations,
      orderBy: { id: 'asc' },
      skip,
      take,
    }),
    prisma.bd_inventory.count({ where }),
  ]);

  return { data, total };
};

export const findById = async (id) => {
  return prisma.bd_inventory.findUnique({
    where: { id: Number(id) },
    include: includeRelations,
  });
};

export const findUbicationById = async (id) => {
  return prisma.ubications.findUnique({ where: { id: Number(id) } });
};

export const findDepartmentById = async (id) => {
  return prisma.departments.findUnique({ where: { id: Number(id) } });
};

export const findDeviceById = async (id) => {
  return prisma.devices.findUnique({ where: { id: Number(id) } });
};

export const findBrandById = async (id) => {
  return prisma.brands.findUnique({ where: { id: Number(id) } });
};

export const findModelById = async (id) => {
  return prisma.models.findUnique({ where: { id: Number(id) } });
};

export const findStatusById = async (id) => {
  return prisma.status.findUnique({ where: { id: Number(id) } });
};

export const findConditionById = async (id) => {
  return prisma.inventory_conditions.findUnique({ where: { id: Number(id) } });
};

export const findAdministrativeAreaById = async (id) => {
  return prisma.inventory_administrative_areas.findUnique({ where: { id: Number(id) } });
};

export const findAssetTypeById = async (id) =>
  prisma.inventory_asset_types.findUnique({ where: { id: Number(id) } });

export const findAssetExtensionById = async (id) =>
  prisma.inventory_asset_extensions.findUnique({ where: { id: Number(id) } });

export const findAdministrativeAreas = async () => {
  return prisma.inventory_administrative_areas.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
};

function escapeLikeTerm(value) {
  const escape = String.fromCodePoint(92);
  return `%${String(value).replace(/[\\%_]/g, (character) => escape + character)}%`;
}

export function buildInventoryMovementFilters({ action, from, to, inventoryId, actor, search }) {
  const baseConditions = [
    Prisma.sql`al.entity_type IN ('BD_INVENTORY', 'INVENTORY_DEVICES')`,
  ];

  if (inventoryId) baseConditions.push(Prisma.sql`al.entity_id = ${inventoryId}`);
  if (action) baseConditions.push(Prisma.sql`al.action = ${action}::"ActivityAction"`);
  if (from) baseConditions.push(Prisma.sql`al.created_at >= ${from}`);
  if (to) baseConditions.push(Prisma.sql`al.created_at <= ${to}`);
  if (actor) {
    baseConditions.push(
      Prisma.sql`u.nombre_completo ILIKE ${escapeLikeTerm(actor)} ESCAPE E'\\\\'`
    );
  }

  const base = Prisma.join(baseConditions, ' AND ');
  const searchTerm = search ? escapeLikeTerm(search) : null;
  const searchScoped = searchTerm
    ? Prisma.sql`(
        scoped.entity_id::text ILIKE ${searchTerm} ESCAPE E'\\\\'
        OR COALESCE(scoped.old_values::text, '') ILIKE ${searchTerm} ESCAPE E'\\\\'
        OR COALESCE(scoped.new_values::text, '') ILIKE ${searchTerm} ESCAPE E'\\\\'
        OR COALESCE(scoped.actor_name, '') ILIKE ${searchTerm} ESCAPE E'\\\\'
      )`
    : Prisma.sql`TRUE`;
  const searchCount = searchTerm
    ? Prisma.sql`(
        al.entity_id::text ILIKE ${searchTerm} ESCAPE E'\\\\'
        OR COALESCE(al.old_values::text, '') ILIKE ${searchTerm} ESCAPE E'\\\\'
        OR COALESCE(al.new_values::text, '') ILIKE ${searchTerm} ESCAPE E'\\\\'
        OR COALESCE(u.nombre_completo, '') ILIKE ${searchTerm} ESCAPE E'\\\\'
      )`
    : Prisma.sql`TRUE`;

  return { base, searchScoped, searchCount };
}

export function buildInventoryMovementPageQuery(filters, limit, skip) {
  return Prisma.sql`
    WITH scoped AS (
      SELECT
        al.id,
        al.entity_type,
        al.entity_id,
        al.action,
        al.old_values,
        al.new_values,
        al.user_id,
        al.ip_address,
        al.user_agent,
        al.source,
        al.created_at,
        u.id AS actor_id,
        u.nombre_completo AS actor_name,
        LEAD(al.created_at) OVER (
          PARTITION BY al.entity_id
          ORDER BY al.created_at DESC, al.id DESC
        ) AS previous_movement_at
      FROM "activity_logs" al
      LEFT JOIN "users" u ON u.id = al.user_id
      WHERE ${filters.base}
    )
    SELECT *
    FROM scoped
    WHERE ${filters.searchScoped}
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit} OFFSET ${skip}
  `;
}

export function getInventoryMovementPageMetadata(page, limit, total) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { page: Math.min(page, totalPages), totalPages };
}

export const findInventoryMovementLogs = async ({
  action,
  from,
  to,
  inventoryId,
  actor,
  search,
  page,
  limit,
}) => {
  const filters = buildInventoryMovementFilters({
    action,
    from,
    to,
    inventoryId,
    actor,
    search,
  });

  return prisma.$transaction(
    async (tx) => {
      const [countRow] = await tx.$queryRaw(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "activity_logs" al
        LEFT JOIN "users" u ON u.id = al.user_id
        WHERE ${filters.base} AND ${filters.searchCount}
      `);

      const total = Number(countRow?.total || 0);
      const { page: safePage, totalPages } = getInventoryMovementPageMetadata(
        page,
        limit,
        total
      );
      const skip = (safePage - 1) * limit;
      const data = await tx.$queryRaw(buildInventoryMovementPageQuery(filters, limit, skip));

      return {
        data: data.map((row) => ({
          ...row,
          user: row.actor_id
            ? { id: row.actor_id, nombre_completo: row.actor_name }
            : null,
        })),
        total,
        page: safePage,
        totalPages,
      };
    },
    { isolationLevel: 'RepeatableRead' }
  );
};

export const findUbicationsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.ubications.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findDepartmentsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.departments.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findStatusesByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.status.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findDevicesByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.devices.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findBrandsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.brands.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findModelsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.models.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findConditionsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.inventory_conditions.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findAdministrativeAreasByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.inventory_administrative_areas.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findCurrentInventoryByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.bd_inventory.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      asset_classification_rule: {
        include: {
          classification: true,
          asset_type: true,
          extension: true,
        },
      },
      ubications: { select: { name: true } },
      departments: { select: { name: true } },
      administrative_area: { select: { name: true } },
      status: { select: { name: true } },
      inventory_devices: {
        include: {
          device: { select: { name: true } },
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
      },
    },
  });
};

export const areInventoryLocationFieldsNullable = async () => {
  if (inventoryLocationNullableCache !== null) {
    return inventoryLocationNullableCache;
  }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT BOOL_AND(is_nullable = 'YES') AS all_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bd_inventory'
      AND column_name IN ('id_ubication', 'id_department');
  `);

  const value = rows?.[0]?.all_nullable;
  inventoryLocationNullableCache = value === true || value === 't' || value === 'true';

  return inventoryLocationNullableCache;
};

export const withTransaction = async (callback) => prisma.$transaction(callback);

export const createWithTechnology = async ({ inventoryData, technologyData, userId }) => {
  return runWithActivityLoggingSuppressed(['bd_inventory', 'inventory_devices'], () =>
    prisma.$transaction(async (tx) => {
      const inventory = await tx.bd_inventory.create({
        data: inventoryData,
      });

      if (technologyData) {
        await tx.inventory_devices.create({
          data: {
            ...technologyData,
            id_inventory: inventory.id,
          },
        });
      }

      const created = await tx.bd_inventory.findUnique({
        where: { id: inventory.id },
        include: includeRelations,
      });
      await writeInventoryAuditEvent(tx, {
        action: 'CREATE',
        newRecord: created,
        userId,
        source: 'inventory.create',
      });

      return created;
    })
  );
};

export const updateWithTechnology = async ({
  id,
  inventoryData,
  technologyData,
  updateTechnology = true,
  expectedInventory,
  userId,
}) => {
  return runWithActivityLoggingSuppressed(['bd_inventory', 'inventory_devices'], () =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "bd_inventory" WHERE id = ${Number(id)} FOR UPDATE`;

      const current = await tx.bd_inventory.findUnique({
        where: { id: Number(id) },
        include: includeRelations,
      });

      if (!current) {
        throw new AppError('Equipo no encontrado', 404);
      }

      if (expectedInventory && !sameInventoryAuditState(current, expectedInventory)) {
        throw new AppError(
          'El equipo cambió mientras se editaba. Recarga los datos y vuelve a intentarlo.',
          409,
          'INVENTORY_CONCURRENT_UPDATE'
        );
      }

      const changedInventoryData = Object.fromEntries(
        Object.entries(inventoryData).filter(([field, value]) => {
          if (field === 'updated_by') return false;
          return JSON.stringify(current[field] ?? null) !== JSON.stringify(value ?? null);
        })
      );

      const technologyChanged =
        updateTechnology &&
        technologyData &&
        ['id_device', 'id_brand', 'id_model', 'ip'].some(
          (field) =>
            JSON.stringify(current.inventory_devices?.[field] ?? current[field] ?? null) !==
            JSON.stringify(technologyData[field] ?? null)
        );

      if (Object.keys(changedInventoryData).length || technologyChanged) {
        await tx.bd_inventory.update({
          where: { id: Number(id) },
          data: { ...changedInventoryData, updated_by: userId ?? null },
        });
      }

      if (updateTechnology && technologyData) {
        await tx.inventory_devices.upsert({
          where: { id_inventory: Number(id) },
          create: {
            ...technologyData,
            id_inventory: Number(id),
          },
          update: technologyData,
        });
      }

      if (updateTechnology === false && technologyData === null) {
        await tx.inventory_devices.deleteMany({
          where: { id_inventory: Number(id) },
        });
      }

      const updated = await tx.bd_inventory.findUnique({
        where: { id: Number(id) },
        include: includeRelations,
      });

      if (!sameInventoryAuditState(current, updated)) {
        await writeInventoryAuditEvent(tx, {
          action: 'UPDATE',
          oldRecord: current,
          newRecord: updated,
          userId,
          source: 'inventory.update',
        });
      }

      return updated;
    })
  );
};
