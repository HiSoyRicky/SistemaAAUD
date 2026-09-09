// accessRoutes.js
// Determina a qué módulo debe aterrizar un usuario autenticado según sus
// permisos reales, en vez de redirigirlo siempre a una ruta fija.

export const MODULE_LANDING_ROUTES = [
  { path: '/incidencias', permissions: ['incidents.read', 'incidents.create'] },
  { path: '/inventario/equipos', permissions: ['inventory.read', 'warehouse_stock.read'] },
  { path: '/almacen', permissions: ['warehouse_stock.read'] },
  { path: '/inventario/toners', permissions: ['toners.read'] },
  {
    path: '/admin',
    permissions: [
      'users.read',
      'roles.read',
      'permissions.read',
      'warehouse_items.read',
      'warehouse_items.create',
      'ubications.read',
      'departments.read',
      'devices.read',
      'inventory_classification_rules.read',
      'brands.read',
      'models.read',
      'notification_settings.read',
    ],
  },
];

export const NO_ACCESS_ROUTE = '/sin-acceso';

export function getDefaultRoute(hasAnyPermission) {
  const match = MODULE_LANDING_ROUTES.find((entry) => hasAnyPermission(entry.permissions));
  return match ? match.path : NO_ACCESS_ROUTE;
}
