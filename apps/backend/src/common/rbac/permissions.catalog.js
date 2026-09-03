// permissions.catalog.js

const PERMISSIONS_CATALOG = [
  { module: 'incidents', action: 'read' },
  { module: 'incidents', action: 'create' },
  { module: 'incidents', action: 'update' },
  { module: 'incidents', action: 'delete' },
  { module: 'inventory', action: 'read' },
  { module: 'inventory', action: 'create' },
  { module: 'inventory', action: 'update' },
  { module: 'inventory', action: 'update_location' },
  { module: 'inventory', action: 'update_department' },
  { module: 'inventory', action: 'update_assignee' },
  { module: 'inventory', action: 'update_condition' },
  { module: 'inventory', action: 'update_administrative_area' },
  { module: 'inventory', action: 'delete' },
  { module: 'inventory_classification_rules', action: 'read' },
  { module: 'inventory_classification_rules', action: 'create' },
  { module: 'inventory_classification_rules', action: 'update' },
  { module: 'inventory_classification_rules', action: 'delete' },
  { module: 'inventory_classification_rules', action: 'reconcile' },
  { module: 'toners', action: 'read' },
  { module: 'toners', action: 'create' },
  { module: 'toners', action: 'update' },
  { module: 'toners', action: 'delete' },
  { module: 'toner_movements', action: 'read' },
  { module: 'toner_movements', action: 'create' },
  { module: 'warehouse_items', action: 'read' },
  { module: 'warehouse_items', action: 'create' },
  { module: 'warehouse_items', action: 'update' },
  { module: 'warehouse_stock', action: 'read' },
  { module: 'warehouse_movements', action: 'read' },
  { module: 'warehouse_movements', action: 'create' },
  { module: 'users', action: 'read' },
  { module: 'users', action: 'create' },
  { module: 'users', action: 'update' },
  { module: 'users', action: 'delete' },
  { module: 'users', action: 'update_password' },
  { module: 'roles', action: 'read' },
  { module: 'roles', action: 'create' },
  { module: 'roles', action: 'update' },
  { module: 'roles', action: 'delete' },
  { module: 'brands', action: 'read' },
  { module: 'brands', action: 'create' },
  { module: 'brands', action: 'update' },
  { module: 'brands', action: 'delete' },
  { module: 'devices', action: 'read' },
  { module: 'devices', action: 'create' },
  { module: 'devices', action: 'update' },
  { module: 'devices', action: 'delete' },
  { module: 'models', action: 'read' },
  { module: 'models', action: 'create' },
  { module: 'models', action: 'update' },
  { module: 'models', action: 'delete' },
  { module: 'departments', action: 'read' },
  { module: 'departments', action: 'create' },
  { module: 'departments', action: 'update' },
  { module: 'departments', action: 'delete' },
  { module: 'ubications', action: 'read' },
  { module: 'ubications', action: 'create' },
  { module: 'ubications', action: 'update' },
  { module: 'ubications', action: 'delete' },
  { module: 'status', action: 'read' },
  { module: 'status', action: 'create' },
  { module: 'status', action: 'update' },
  { module: 'status', action: 'delete' },
  { module: 'permissions', action: 'read' },
  { module: 'permissions', action: 'assign' },
];

export const buildPermissionCode = (moduleName, actionName) =>
  `${String(moduleName || '')
    .trim()
    .toLowerCase()}.${String(actionName || '')
    .trim()
    .toLowerCase()}`;

export const normalizePermissionCode = (code) =>
  String(code || '')
    .trim()
    .toLowerCase();

export const splitPermissionCode = (code) => {
  const normalized = normalizePermissionCode(code);
  const chunks = normalized.split('.');

  if (chunks.length !== 2 || !chunks[0] || !chunks[1]) {
    throw new Error(`Código de permiso inválido: ${code}`);
  }

  return {
    module: chunks[0],
    action: chunks[1],
  };
};

export const PERMISSION_CODES = PERMISSIONS_CATALOG.map(({ module, action }) =>
  buildPermissionCode(module, action)
);

function normalizeRoleName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const ROLE_DEFAULT_PERMISSION_CODES = {
  admin: ['*.*'],
  tecnico: [
    'incidents.read',
    'incidents.update',
    'inventory.read',
    'toners.read',
    'toner_movements.read',
    'toner_movements.create',
    'devices.read',
    'models.read',
    'brands.read',
    'departments.read',
    'ubications.read',
    'status.read',
    'users.read',
    'roles.read',
  ],
  consultor: [
    'incidents.read',
    'incidents.update',
    'inventory.read',
    'toners.read',
    'toner_movements.read',
    'devices.read',
    'models.read',
    'brands.read',
    'departments.read',
    'ubications.read',
    'status.read',
    'users.read',
    'roles.read',
  ],
  trabajador: ['incidents.create', 'departments.read', 'ubications.read'],
};

export const resolveRoleDefaultPermissionCodes = (roleName) => {
  const normalized = normalizeRoleName(roleName);

  if (normalized.includes('admin')) {
    return ROLE_DEFAULT_PERMISSION_CODES.admin;
  }

  if (normalized.includes('tecnico')) {
    return ROLE_DEFAULT_PERMISSION_CODES.tecnico;
  }

  if (normalized.includes('consultor')) {
    return ROLE_DEFAULT_PERMISSION_CODES.consultor;
  }

  if (normalized.includes('trabajador') || normalized.includes('usuario')) {
    return ROLE_DEFAULT_PERMISSION_CODES.trabajador;
  }

  return [];
};

export { PERMISSIONS_CATALOG };
