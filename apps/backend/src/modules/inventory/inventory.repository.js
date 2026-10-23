// inventory.repository.js

import { prisma } from '../../config/prisma.js';
import { Prisma } from '@prisma/client';
import { runWithActivityLoggingSuppressed } from '../../common/services/activityLogger.js';
import AppError from '../../common/utils/AppError.js';
import {
  sameInventoryAuditState,
  writeInventoryAuditEvent,
} from './services/inventory-audit.service.js';
import { TECHNOLOGY_SCOPE_WHERE } from './services/inventory-scope.service.js';

export const includeRelations = {
  asset_classification_rule: {
    include: {
      device: { select: { id: true, name: true } },
      classification: true,
      asset_type: true,
      extension: true,
      administrative_area: { select: { id: true, name: true } },
    },
  },
  device_details: {
    include: {
      device: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      model: { select: { id: true, name: true } },
    },
  },
  asset_type: true,
  extension: true,
  vehicle_details: true,
  property_details: true,
  real_estate_details: true,
  departments: { select: { id: true, name: true } },
  ubications: { select: { id: true, name: true } },
  status: { select: { id: true, name: true } },
  condition: { select: { id: true, name: true } },
  administrative_area: { select: { id: true, name: true } },
};

const inventoryOrderBy = [
  // El marbete siempre define el orden principal. Mantener el id al final
  // hace deterministas las páginas cuando todos los datos visibles coinciden.
  { tag: 'asc' },
  { asset_type: { name: 'asc' } },
  { asset_classification_rule: { asset_type: { name: 'asc' } } },
  { ubications: { name: 'asc' } },
  { departments: { name: 'asc' } },
  { administrative_area: { name: 'asc' } },
  { user: 'asc' },
  { device_details: { device: { name: 'asc' } } },
  { device_details: { brand: { name: 'asc' } } },
  { device_details: { model: { name: 'asc' } } },
  { device_details: { serie: 'asc' } },
  { description: 'asc' },
  { status: { name: 'asc' } },
  { id: 'asc' },
];

const compareInventoryText = (left, right) =>
  String(left ?? '').localeCompare(String(right ?? ''), 'es', {
    numeric: true,
    sensitivity: 'base',
  });

// El marbete siempre manda. Solo para marbetes repetidos se desempata por
// clasificación, tipo, ubicación y el resto de los datos del inventario.
const compareInventoryRows = (left, right) => {
  const tagComparison = compareInventoryText(left.tag, right.tag);
  if (tagComparison !== 0) return tagComparison;

  const leftHasClassification = Boolean(left.asset_classification_rule?.classification);
  const rightHasClassification = Boolean(right.asset_classification_rule?.classification);
  if (leftHasClassification !== rightHasClassification) return leftHasClassification ? -1 : 1;

  const leftType = left.asset_type?.name || left.asset_classification_rule?.asset_type?.name;
  const rightType = right.asset_type?.name || right.asset_classification_rule?.asset_type?.name;
  const fields = [
    [leftType, rightType],
    [left.ubications?.name, right.ubications?.name],
    [left.departments?.name, right.departments?.name],
    [left.administrative_area?.name, right.administrative_area?.name],
    [left.user, right.user],
    [left.device_details?.device?.name, right.device_details?.device?.name],
    [left.device_details?.brand?.name, right.device_details?.brand?.name],
    [left.device_details?.model?.name, right.device_details?.model?.name],
    [left.device_details?.serie, right.device_details?.serie],
    [left.description, right.description],
    [left.status?.name, right.status?.name],
  ];

  for (const [leftValue, rightValue] of fields) {
    const comparison = compareInventoryText(leftValue, rightValue);
    if (comparison !== 0) return comparison;
  }

  return left.id - right.id;
};

export function sortInventoryRows(rows) {
  return rows.sort(compareInventoryRows);
}

export function getInventoryPage(rows, skip, take) {
  return sortInventoryRows(rows).slice(skip, skip + take);
}

export function collectInventoryAssetTypeIds(rows) {
  return [...new Set(rows
    .map((row) => row.asset_classification_rule?.asset_type_id ?? row.asset_type_id)
    .filter(Number.isInteger))];
}

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

export const findVehicleCatalogById = async (id) => prisma.inventory_vehicle_catalog.findUnique({
  where: { id: Number(id) },
  include: { brand: { select: { id: true, name: true } }, model: { select: { id: true, name: true, id_brand: true } } },
});

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

export const findItemsForClassificationSync = async ({ deviceIds = null } = {}, db = prisma) =>
  db.inventory_items.findMany({
    where: deviceIds === null ? {} : { device_details: { is: { id_device: { in: deviceIds } } } },
    include: { device_details: true },
    orderBy: { id: 'asc' },
  });

let inventoryLocationNullableCache = null;

const TECHNOLOGY_ONLY_CONDITION = TECHNOLOGY_SCOPE_WHERE;

export function buildInventorySearchWhere(search, filters = {}, scope = {}) {
  const relationNameFilter = (relation, value) =>
    value ? { [relation]: { is: { name: { equals: value, mode: 'insensitive' } } } } : null;
  const filterConditions = [
    filters.tag && { tag: { contains: filters.tag, mode: 'insensitive' } },
    filters.serie && { device_details: { is: { serie: { contains: filters.serie, mode: 'insensitive' } } } },
    filters.description && { description: { contains: filters.description, mode: 'insensitive' } },
    filters.user && { user: { contains: filters.user, mode: 'insensitive' } },
    filters.ip && {
      device_details: { is: { ip: { contains: filters.ip, mode: 'insensitive' } } },
    },
    filters.device && {
      device_details: {
        is: { device: { is: { name: { equals: filters.device, mode: 'insensitive' } } } },
      },
    },
    filters.brand && {
      OR: [
        { device_details: { is: { brand: { is: { name: { equals: filters.brand, mode: 'insensitive' } } } } } },
        { vehicle_details: { is: { make: { equals: filters.brand, mode: 'insensitive' } } } },
      ],
    },
    filters.model && {
      OR: [
        { device_details: { is: { model: { is: { name: { equals: filters.model, mode: 'insensitive' } } } } } },
        { vehicle_details: { is: { model: { equals: filters.model, mode: 'insensitive' } } } },
      ],
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
      OR: [
        {
          AND: [
            { asset_classification_rule_id: null },
            { asset_type: { is: { name: { equals: filters.asset_type, mode: 'insensitive' } } } },
          ],
        },
        {
          asset_classification_rule: {
            is: { asset_type: { is: { name: { equals: filters.asset_type, mode: 'insensitive' } } } },
          },
        },
      ],
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
            device_details: {
              is: {
                OR: [
                  { ip: { contains: search, mode: 'insensitive' } },
                  { serie: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
          { observation: { contains: search, mode: 'insensitive' } },
          {
            device_details: {
              is: {
                device: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          {
            device_details: {
              is: {
                brand: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          {
            device_details: {
              is: {
                model: { is: { name: { contains: search, mode: 'insensitive' } } },
              },
            },
          },
          {
            vehicle_details: {
              is: {
                OR: [
                  { make: { contains: search, mode: 'insensitive' } },
                  { model: { contains: search, mode: 'insensitive' } },
                  { plate: { contains: search, mode: 'insensitive' } },
                  { engine: { contains: search, mode: 'insensitive' } },
                  { chassis: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
          {
            real_estate_details: {
              is: {
                OR: [
                  { cadastral_number: { contains: search, mode: 'insensitive' } },
                  { address: { contains: search, mode: 'insensitive' } },
                  { location_geo: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
          { departments: { is: { name: { contains: search, mode: 'insensitive' } } } },
          { ubications: { is: { name: { contains: search, mode: 'insensitive' } } } },
          { administrative_area: { is: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      }
    : {};

  const conditions = scope?.technologyOnly
    ? [...filterConditions, TECHNOLOGY_ONLY_CONDITION]
    : filterConditions;

  return conditions.length ? { AND: [searchConditions, ...conditions] } : searchConditions;
}

export const findAll = async (search, filters = {}, scope = {}) => {
  const inventory = await prisma.inventory_items.findMany({
    where: buildInventorySearchWhere(search, filters, scope),
    include: includeRelations,
    orderBy: inventoryOrderBy,
  });
  return sortInventoryRows(inventory);
};

// Cada filtro de columna solo debe ofrecer valores que aun existan dado el resto
// de filtros ya aplicados (filtrado en cascada / "faceted search").
export const findInventoryFilterOptions = async (filters = {}, scope = {}, search) => {
  const buildWhereExcluding = (excludeKey) => {
    const rest = { ...filters };
    delete rest[excludeKey];
    return buildInventorySearchWhere(search, rest, scope);
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
    assetTypeRows,
  ] = await Promise.all([
    prisma.inventory_items.findMany({
      where: withAnd(buildWhereExcluding('ubication'), { id_ubication: { not: null } }),
      distinct: ['id_ubication'],
      select: { id_ubication: true },
    }),
    prisma.inventory_items.findMany({
      where: withAnd(buildWhereExcluding('department'), { id_department: { not: null } }),
      distinct: ['id_department'],
      select: { id_department: true },
    }),
    prisma.inventory_items.findMany({
      where: withAnd(buildWhereExcluding('administrative_area'), {
        id_administrative_area: { not: null },
      }),
      distinct: ['id_administrative_area'],
      select: { id_administrative_area: true },
    }),
    prisma.inventory_item_devices.findMany({
      where: { item: { is: buildWhereExcluding('device') } },
      distinct: ['id_device'],
      select: { id_device: true },
    }),
    prisma.inventory_item_devices.findMany({
      where: { item: { is: buildWhereExcluding('brand') }, id_brand: { not: null } },
      distinct: ['id_brand'],
      select: { id_brand: true },
    }),
    prisma.inventory_item_devices.findMany({
      where: { item: { is: buildWhereExcluding('model') }, id_model: { not: null } },
      distinct: ['id_model'],
      select: { id_model: true },
    }),
    prisma.inventory_items.findMany({
      where: buildWhereExcluding('status'),
      distinct: ['id_status'],
      select: { id_status: true },
    }),
    prisma.inventory_items.findMany({
      where: withAnd(buildWhereExcluding('user'), { user: { not: null } }),
      distinct: ['user'],
      select: { user: true },
    }),
    prisma.inventory_items.findMany({
      where: buildWhereExcluding('asset_type'),
      select: {
        asset_type_id: true,
        asset_classification_rule: { select: { asset_type_id: true } },
      },
    }),
  ]);

  const [
    ubications,
    departments,
    administrativeAreas,
    devices,
    brands,
    models,
    statuses,
    assetTypes,
  ] = await Promise.all([
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
      prisma.inventory_asset_types.findMany({
        where: {
          id: {
            in: collectInventoryAssetTypeIds(assetTypeRows),
          },
        },
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
    asset_types: assetTypes,
    users: userRows
      .map((row) => row.user)
      .filter(Boolean)
      .sort(),
  };
};

// Estadisticas globales para los KPIs del encabezado (no deben limitarse a la
// pagina actual cuando el listado usa paginacion en el servidor).
export const findInventoryStats = async ({ search, filters, scope }) => {
  const where = buildInventorySearchWhere(search, filters, scope);
  const rows = await prisma.inventory_items.findMany({
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

export const findPage = async ({ search, filters, scope, skip, take }) => {
  const where = buildInventorySearchWhere(search, filters, scope);
  const [data, total] = await prisma.$transaction([
    prisma.inventory_items.findMany({
      where,
      include: includeRelations,
    }),
    prisma.inventory_items.count({ where }),
  ]);

  return { data: getInventoryPage(data, skip, take), total };
};

export const findById = async (id) => {
  return prisma.inventory_items.findUnique({
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

export function buildInventoryMovementFilters({
  action,
  from,
  to,
  inventoryId,
  actor,
  search,
  technologyOnly = false,
}) {
  const baseConditions = [
    Prisma.sql`al.entity_type IN ('BD_INVENTORY', 'INVENTORY_DEVICES')`,
  ];

  if (technologyOnly) {
    baseConditions.push(
      Prisma.sql`al.entity_id IN (
        SELECT ii.id
        FROM inventory_items ii
        LEFT JOIN inventory_asset_classification_rules r ON r.id = ii.asset_classification_rule_id
        LEFT JOIN inventory_asset_extensions e ON e.id = r.extension_id
        WHERE ii.asset_classification_rule_id IS NULL OR e.code = 'DEVICES'
      )`
    );
  }

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
  technologyOnly,
}) => {
  const filters = buildInventoryMovementFilters({
    action,
    from,
    to,
    inventoryId,
    actor,
    search,
    technologyOnly,
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

export const createWithTechnology = async ({ inventoryData, technologyData, vehicleData, realEstateData, propertyData, userId }) => {
  return runWithActivityLoggingSuppressed(
    ['inventory_items', 'inventory_item_devices', 'inventory_item_vehicles', 'inventory_item_properties', 'inventory_item_real_estate'],
    () => prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory_items.create({
        data: inventoryData,
      });

      if (technologyData) {
        await tx.inventory_item_devices.create({
          data: {
            ...technologyData,
            item_id: inventory.id,
          },
        });
      }

      if (vehicleData) {
        await tx.inventory_item_vehicles.create({
          data: { ...vehicleData, item_id: inventory.id },
        });
      }

      if (realEstateData) {
        await tx.inventory_item_real_estate.create({
          data: { ...realEstateData, item_id: inventory.id },
        });
      }

      if (propertyData) {
        await tx.inventory_item_properties.create({
          data: { ...propertyData, item_id: inventory.id },
        });
      }

      const created = await tx.inventory_items.findUnique({
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
  vehicleData,
  realEstateData,
  propertyData,
  updateTechnology = true,
  expectedInventory,
  userId,
}) => {
  return runWithActivityLoggingSuppressed(
    ['inventory_items', 'inventory_item_devices', 'inventory_item_vehicles', 'inventory_item_real_estate'],
    () => prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "inventory_items" WHERE id = ${Number(id)} FOR UPDATE`;

      const current = await tx.inventory_items.findUnique({
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
            JSON.stringify(current.device_details?.[field] ?? current[field] ?? null) !==
            JSON.stringify(technologyData[field] ?? null)
        );

      if (Object.keys(changedInventoryData).length || technologyChanged || vehicleData || realEstateData || propertyData) {
        await tx.inventory_items.update({
          where: { id: Number(id) },
          data: { ...changedInventoryData, updated_by: userId ?? null },
        });
      }

      if (technologyData) {
        await tx.inventory_item_devices.upsert({
          where: { item_id: Number(id) },
          create: {
            ...technologyData,
            item_id: Number(id),
          },
          update: technologyData,
        });
      } else if (updateTechnology) {
        await tx.inventory_item_devices.deleteMany({
          where: { item_id: Number(id) },
        });
      }

      if (vehicleData) {
        await tx.inventory_item_vehicles.upsert({
          where: { item_id: Number(id) },
          create: { ...vehicleData, item_id: Number(id) },
          update: vehicleData,
        });
      }

      if (realEstateData) {
        await tx.inventory_item_real_estate.upsert({
          where: { item_id: Number(id) },
          create: { ...realEstateData, item_id: Number(id) },
          update: realEstateData,
        });
      }

      if (propertyData) {
        await tx.inventory_item_properties.upsert({
          where: { item_id: Number(id) },
          create: { ...propertyData, item_id: Number(id) },
          update: propertyData,
        });
      }

      const updated = await tx.inventory_items.findUnique({
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
