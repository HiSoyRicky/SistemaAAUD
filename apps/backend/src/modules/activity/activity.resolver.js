// activity.resolver.js

import { prisma } from '../../config/prisma.js';

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minuto

async function getResolutionTables() {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;

  const [
    statuses,
    departments,
    ubications,
    users,
    categories,
    devices,
    brands,
    models,
    roles,
    permissions,
    inventories,
    toners,
    incidents,
  ] = await Promise.all([
    prisma.status.findMany({ select: { id: true, name: true } }),
    prisma.departments.findMany({ select: { id: true, name: true } }),
    prisma.ubications.findMany({ select: { id: true, name: true } }),
    prisma.users.findMany({ select: { id: true, nombre_completo: true } }),
    prisma.categories.findMany({ select: { id: true, name: true } }),
    prisma.devices.findMany({ select: { id: true, name: true } }),
    prisma.brands.findMany({ select: { id: true, name: true } }),
    prisma.models.findMany({ select: { id: true, name: true } }),
    prisma.roles.findMany({ select: { id: true, name: true } }),
    prisma.permissions.findMany({ select: { id: true, module: true, action: true } }),
    prisma.bd_inventory.findMany({
      select: {
        id: true,
        tag: true,
        serie: true,
        user: true,
        description: true,
        asset_classification_rule: {
          include: {
            classification: { select: { code_new: true, description: true } },
            asset_type: { select: { code: true, name: true } },
            extension: { select: { code: true, name: true } },
          },
        },
        id_device: true,
        id_brand: true,
        id_model: true,
        inventory_devices: {
          select: {
            id_device: true,
            id_brand: true,
            id_model: true,
            device: { select: { name: true } },
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
      },
    }),
    prisma.toners.findMany({
      select: {
        id: true,
        color: true,
        toner_model: true,
        models: { select: { name: true } },
      },
    }),
    prisma.bd_incidents.findMany({
      select: {
        id: true,
        ticket_number: true,
        reporter_name: true,
        description: true,
      },
    }),
  ]);

  const usersById = Object.fromEntries(users.map((r) => [r.id, r.nombre_completo]));
  const rolesById = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const modelsById = Object.fromEntries(models.map((r) => [r.id, r.name]));
  const brandsById = Object.fromEntries(brands.map((r) => [r.id, r.name]));
  const devicesById = Object.fromEntries(devices.map((r) => [r.id, r.name]));
  const permissionsById = Object.fromEntries(
    permissions.map((r) => [
      r.id,
      `${PERMISSION_MODULE_LABELS[r.module] || r.module} / ${
        PERMISSION_ACTION_LABELS[r.action] || r.action
      }`,
    ])
  );
  const inventoryById = Object.fromEntries(
    inventories.map((r) => [
      r.id,
      [
        r.tag,
        r.description,
        r.serie && `Serie ${r.serie}`,
        r.user && `Asignado a ${r.user}`,
        r.asset_classification_rule?.classification?.description,
        r.asset_classification_rule?.asset_type?.name,
        r.inventory_devices?.device?.name || devicesById[r.id_device],
        r.inventory_devices?.brand?.name || brandsById[r.id_brand],
        r.inventory_devices?.model?.name || modelsById[r.id_model],
      ]
        .filter(Boolean)
        .join(' · '),
    ])
  );
  const tonersById = Object.fromEntries(
    toners.map((r) => [
      r.id,
      [r.toner_model || 'Tóner', r.color, r.models?.name && `para ${r.models.name}`]
        .filter(Boolean)
        .join(' · '),
    ])
  );
  const incidentsById = Object.fromEntries(
    incidents.map((r) => [
      r.id,
      [r.ticket_number && `Ticket #${r.ticket_number}`, r.reporter_name, r.description]
        .filter(Boolean)
        .join(' · '),
    ])
  );

  _cache = {
    id_status: Object.fromEntries(statuses.map((r) => [r.id, r.name])),
    id_department: Object.fromEntries(departments.map((r) => [r.id, r.name])),
    id_ubication: Object.fromEntries(ubications.map((r) => [r.id, r.name])),
    id_user: usersById,
    id_technician: usersById,
    id_category: Object.fromEntries(categories.map((r) => [r.id, r.name])),
    id_device: devicesById,
    id_brand: brandsById,
    id_model: modelsById,
    id_printer_model: modelsById,
    id_role: rolesById,
    id_rol: rolesById,
    requester_id: usersById,
    approver_id: usersById,
    created_by: usersById,
    updated_by: usersById,
    document_uploaded_by: usersById,
    id_permission: permissionsById,
    inventory_id: inventoryById,
    id_inventory: inventoryById,
    id_toner: tonersById,
    id_incident: incidentsById,
    record: {
      BD_INVENTORY: inventoryById,
      bd_inventory: inventoryById,
      INVENTORY_DEVICES: inventoryById,
      inventory_devices: inventoryById,
      BD_INCIDENTS: incidentsById,
      bd_incidents: incidentsById,
      TONERS: tonersById,
      toners: tonersById,
      TONER_MOVEMENTS: null,
      toner_movements: null,
      USERS: usersById,
      users: usersById,
      ROLES: rolesById,
      roles: rolesById,
      PERMISSIONS: permissionsById,
      permissions: permissionsById,
    },
  };
  _cacheTime = now;
  return _cache;
}

const FIELD_LABELS = {
  id: 'ID interno',
  id_status: 'Estado',
  id_department: 'Departamento',
  id_ubication: 'Ubicación',
  id_technician: 'Técnico',
  id_user: 'Usuario',
  id_category: 'Categoría',
  asset_classification_rule_id: 'Regla de clasificación',
  other_category_detail: 'Detalle de categoría',
  id_device: 'Tipo de equipo',
  id_brand: 'Marca',
  id_model: 'Modelo',
  id_condition: 'Condición física',
  id_administrative_area: 'Área administradora',
  id_printer_model: 'Modelo de impresora',
  id_role: 'Rol',
  id_rol: 'Rol',
  requester_id: 'Solicitante',
  approver_id: 'Aprobador',
  inventory_id: 'Equipo',
  id_inventory: 'Activo',
  id_toner: 'Tóner',
  solution: 'Solución',
  solution_date: 'Fecha de solución',
  description: 'Descripción',
  observation: 'Observación',
  user: 'Asignado a',
  tag: 'Etiqueta',
  ip: 'IP',
  reporter_name: 'Reportado por',
  serie: 'Serie',
  email: 'Email',
  username: 'Usuario',
  nombre_completo: 'Nombre completo',
  active: 'Activo',
  must_change_password: 'Debe cambiar contraseña',
  name: 'Nombre',
  model: 'Modelo',
  toner_model: 'Modelo de tóner',
  color: 'Color',
  min_stock: 'Stock mínimo',
  quantity: 'Cantidad',
  movement_type: 'Tipo de movimiento',
  previous_stock: 'Stock anterior',
  new_stock: 'Stock nuevo',
  reference: 'Referencia',
  id_incident: 'Incidente',
  document_status: 'Estado de documento',
  document_uploaded_at: 'Documento subido',
  receiver_name: 'Recibido por',
  signed_document: 'Documento firmado',
  transferdate: 'Fecha de traslado',
  status: 'Estado',
  snapshot: 'Detalle',
  reviewed_at: 'Fecha de revisión',
  requested_at: 'Fecha de solicitud',
  review_notes: 'Notas de revisión',
  module: 'Módulo',
  action: 'Acción',
  allow: 'Permitido',
  id_permission: 'Permiso',
};

const ENTITY_ITEM_LABELS = {
  ROLE_PERMISSIONS: 'Permiso de rol',
  role_permissions: 'Permiso de rol',
  USER_PERMISSIONS: 'Permiso de usuario',
  user_permissions: 'Permiso de usuario',
  TONER_MOVEMENTS: 'Movimiento de tóner',
  toner_movements: 'Movimiento de tóner',
};

const PERMISSION_MODULE_LABELS = {
  incidents: 'Incidencias',
  inventory: 'Inventario',
  toners: 'Tóners',
  toner_movements: 'Movimientos de tóner',
  users: 'Usuarios',
  roles: 'Roles',
  brands: 'Marcas',
  devices: 'Tipos de equipo',
  models: 'Modelos',
  departments: 'Departamentos',
  ubications: 'Ubicaciones',
  status: 'Estados',
  permissions: 'Permisos',
};

const PERMISSION_ACTION_LABELS = {
  read: 'Ver',
  create: 'Crear',
  update: 'Actualizar',
  delete: 'Eliminar',
  assign: 'Asignar',
  update_password: 'Cambiar contraseña',
  update_location: 'Cambiar ubicación',
  update_department: 'Cambiar departamento',
  update_assignee: 'Cambiar asignado',
};

// Campos que nunca deben mostrarse en el diff
const IGNORED_FIELDS = new Set([
  'id',
  'client_ip',
  'created_at',
  'updated_at',
  'ticket_number',
  'creation_date',
  'password',
]);

const FIELD_ORDER = {
  BD_INCIDENTS: [
    'reporter_name',
    'email',
    'id_category',
    'other_category_detail',
    'id_status',
    'description',
    'id_ubication',
    'id_department',
    'id_user',
    'id_technician',
    'solution',
    'solution_date',
  ],
  bd_incidents: [
    'reporter_name',
    'email',
    'id_category',
    'other_category_detail',
    'id_status',
    'description',
    'id_ubication',
    'id_department',
    'id_user',
    'id_technician',
    'solution',
    'solution_date',
  ],
  BD_INVENTORY: [
    'tag',
    'serie',
    'user',
    'id_status',
    'id_device',
    'id_brand',
    'id_model',
    'id_ubication',
    'id_department',
    'ip',
    'transferdate',
    'observation',
    'created_by',
    'updated_by',
  ],
  INVENTORY_DEVICES: ['id_inventory', 'id_device', 'id_brand', 'id_model', 'ip'],
  INVENTORY_ASSET_CLASSIFICATION_RULES: [
    'classification_id',
    'asset_type_id',
    'extension_id',
    'active',
    'is_default',
  ],
  bd_inventory: [
    'tag',
    'serie',
    'user',
    'id_status',
    'id_device',
    'id_brand',
    'id_model',
    'id_ubication',
    'id_department',
    'ip',
    'transferdate',
    'observation',
    'created_by',
    'updated_by',
  ],
  inventory_devices: ['id_inventory', 'id_device', 'id_brand', 'id_model', 'ip'],
  TONER_MOVEMENTS: [
    'id_toner',
    'movement_type',
    'quantity',
    'previous_stock',
    'new_stock',
    'id_user',
    'id_department',
    'id_ubication',
    'id_incident',
    'reference',
    'receiver_name',
    'document_status',
  ],
  toner_movements: [
    'id_toner',
    'movement_type',
    'quantity',
    'previous_stock',
    'new_stock',
    'id_user',
    'id_department',
    'id_ubication',
    'id_incident',
    'reference',
    'receiver_name',
    'document_status',
  ],
  TONERS: ['toner_model', 'color', 'id_printer_model', 'min_stock'],
  toners: ['toner_model', 'color', 'id_printer_model', 'min_stock'],
  USERS: [
    'nombre_completo',
    'username',
    'email',
    'id_rol',
    'id_department',
    'id_ubication',
    'active',
    'must_change_password',
  ],
  users: [
    'nombre_completo',
    'username',
    'email',
    'id_rol',
    'id_department',
    'id_ubication',
    'active',
    'must_change_password',
  ],
  ROLE_PERMISSIONS: ['id_role', 'id_permission'],
  role_permissions: ['id_role', 'id_permission'],
  USER_PERMISSIONS: ['id_user', 'id_permission', 'allow'],
  user_permissions: ['id_user', 'id_permission', 'allow'],
  INVENTORY_TRANSFER_REQUESTS: [
    'inventory_id',
    'requester_id',
    'approver_id',
    'status',
    'snapshot',
    'review_notes',
    'requested_at',
    'reviewed_at',
  ],
  inventory_transfer_requests: [
    'inventory_id',
    'requester_id',
    'approver_id',
    'status',
    'snapshot',
    'review_notes',
    'requested_at',
    'reviewed_at',
  ],
};

function normalizeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function stringifyForCompare(value) {
  return JSON.stringify(normalizeValue(value) ?? null);
}

function formatDiffValue(value) {
  const normalized = normalizeValue(value);

  if (normalized === null || normalized === undefined || normalized === '') {
    return '—';
  }

  if (typeof normalized === 'boolean') {
    return normalized ? 'Sí' : 'No';
  }

  if (typeof normalized === 'object') {
    return JSON.stringify(normalized, null, 2);
  }

  return String(normalized);
}

function formatDateValue(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDiffValue(value);

  return new Intl.DateTimeFormat('es-PA', {
    timeZone: 'America/Panama',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function isDateField(key) {
  return key.endsWith('_at') || key.endsWith('_date') || key === 'transferdate';
}

function resolveFieldValue(tables, key, rawValue) {
  const resolver = tables[key];

  if (!resolver) {
    if (key === 'snapshot' && rawValue && typeof rawValue === 'object') {
      return formatItemSummary(tables, 'BD_INVENTORY', rawValue);
    }

    if (isDateField(key)) {
      return formatDateValue(rawValue);
    }

    return formatDiffValue(rawValue);
  }

  return formatDiffValue(resolver[rawValue] ?? `ID:${rawValue}`);
}

function sortFieldsByEntity(entityType, keys) {
  const order = FIELD_ORDER[entityType] || [];

  return [...keys].sort((left, right) => {
    const leftIndex = order.indexOf(left);
    const rightIndex = order.indexOf(right);
    const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex;
    }

    return left.localeCompare(right);
  });
}

function formatItemSummary(tables, entityType, item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return formatDiffValue(item);
  }

  if (entityType === 'ROLE_PERMISSIONS' || entityType === 'role_permissions') {
    const lines = [
      `Rol: ${resolveFieldValue(tables, 'id_role', item.id_role)}`,
      `Permiso: ${resolveFieldValue(tables, 'id_permission', item.id_permission)}`,
    ];

    return lines.join('\n');
  }

  if (entityType === 'USER_PERMISSIONS' || entityType === 'user_permissions') {
    const lines = [
      `Usuario: ${resolveFieldValue(tables, 'id_user', item.id_user)}`,
      `Permiso: ${resolveFieldValue(tables, 'id_permission', item.id_permission)}`,
      `Permitido: ${formatDiffValue(item.allow)}`,
    ];

    return lines.join('\n');
  }

  if (entityType === 'TONER_MOVEMENTS' || entityType === 'toner_movements') {
    const lines = [
      `Tóner: ${resolveFieldValue(tables, 'id_toner', item.id_toner)}`,
      `Tipo: ${formatDiffValue(item.movement_type)}`,
      `Cantidad: ${formatDiffValue(item.quantity)}`,
      `Stock: ${formatDiffValue(item.previous_stock)} → ${formatDiffValue(item.new_stock)}`,
      `Usuario: ${resolveFieldValue(tables, 'id_user', item.id_user)}`,
      `Departamento: ${resolveFieldValue(tables, 'id_department', item.id_department)}`,
      `Ubicación: ${resolveFieldValue(tables, 'id_ubication', item.id_ubication)}`,
    ];

    if (item.id_incident) {
      lines.push(`Incidente: ${resolveFieldValue(tables, 'id_incident', item.id_incident)}`);
    }

    if (item.reference) {
      lines.push(`Referencia: ${formatDiffValue(item.reference)}`);
    }

    if (item.receiver_name) {
      lines.push(`Recibido por: ${formatDiffValue(item.receiver_name)}`);
    }

    return lines.filter((line) => !line.endsWith('—')).join('\n');
  }

  return sortFieldsByEntity(entityType, Object.keys(item))
    .filter((key) => !IGNORED_FIELDS.has(key))
    .map((key) => `${FIELD_LABELS[key] || key}: ${resolveFieldValue(tables, key, item[key])}`)
    .join('\n');
}

function buildArrayDiff(tables, oldValues, newValues, action, entityType) {
  const source = action === 'DELETE' ? oldValues : newValues;
  const items = Array.isArray(source) ? source : [];
  const itemLabel = ENTITY_ITEM_LABELS[entityType] || 'Registro';

  return items.map((item, index) => ({
    field: `${itemLabel} ${index + 1}`,
    from: action === 'CREATE' ? '—' : formatItemSummary(tables, entityType, item),
    to: action === 'DELETE' ? '—' : formatItemSummary(tables, entityType, item),
  }));
}

function buildFieldChange(tables, key, oldRaw, newRaw, action) {
  if (IGNORED_FIELDS.has(key)) {
    return null;
  }

  if (stringifyForCompare(oldRaw) === stringifyForCompare(newRaw)) {
    return null;
  }

  // Evita falsos positivos en null vs undefined
  if (oldRaw == null && newRaw == null) {
    return null;
  }

  return {
    field: FIELD_LABELS[key] || key,
    from: action === 'CREATE' ? '—' : resolveFieldValue(tables, key, oldRaw),
    to: action === 'DELETE' ? '—' : resolveFieldValue(tables, key, newRaw),
  };
}

export async function buildDiff(oldValues, newValues, action, entityType) {
  if (!oldValues && !newValues) {
    return null;
  }

  const tables = await getResolutionTables();

  if (Array.isArray(oldValues) || Array.isArray(newValues)) {
    const arrayChanges = buildArrayDiff(tables, oldValues, newValues, action, entityType);

    return arrayChanges.length > 0 ? arrayChanges : null;
  }

  const changes = [];
  const keys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);

  for (const key of sortFieldsByEntity(entityType, keys)) {
    const change = buildFieldChange(tables, key, oldValues?.[key], newValues?.[key], action);

    if (change) {
      changes.push(change);
    }
  }

  return changes.length > 0 ? changes : null;
}

export async function buildRecordLabel(entityType, entityId, oldValues, newValues) {
  const tables = await getResolutionTables();
  const recordResolver = tables.record?.[entityType];

  if (recordResolver && entityId && recordResolver[entityId]) {
    return recordResolver[entityId];
  }

  const values = newValues && !Array.isArray(newValues) ? newValues : oldValues;

  if (!values || Array.isArray(values)) {
    return null;
  }

  if (entityType === 'TONER_MOVEMENTS' || entityType === 'toner_movements') {
    return formatItemSummary(tables, entityType, values);
  }

  if (entityType === 'TONER_STOCK' || entityType === 'toner_stock') {
    return `Tóner: ${resolveFieldValue(tables, 'id_toner', values.id_toner)}`;
  }

  if (entityType === 'USER_PERMISSIONS' || entityType === 'user_permissions') {
    return formatItemSummary(tables, entityType, values);
  }

  if (entityType === 'ROLE_PERMISSIONS' || entityType === 'role_permissions') {
    return formatItemSummary(tables, entityType, values);
  }

  if (
    entityType === 'INVENTORY_TRANSFER_REQUESTS' ||
    entityType === 'inventory_transfer_requests'
  ) {
    return `Activo: ${resolveFieldValue(tables, 'inventory_id', values.inventory_id)}`;
  }

  if (entityType === 'TONERS' || entityType === 'toners') {
    return [
      values.toner_model || 'Tóner',
      values.color,
      values.id_printer_model &&
        `para ${resolveFieldValue(tables, 'id_printer_model', values.id_printer_model)}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  if (values.name) {
    return formatDiffValue(values.name);
  }

  if (values.nombre_completo) {
    return formatDiffValue(values.nombre_completo);
  }

  return null;
}
