// Navigation.jsx

import {
  AlertTriangle,
  FileText,
  LayoutDashboard,
  Monitor,
  Package,
  Printer,
  Users,
  UserSquare,
  Warehouse,
} from 'lucide-react';

export const getNavigation = (userType, hasPermission = () => true) => {
  const items = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      permission: 'incidents.read',
    },
    {
      label: 'Incidencias',
      path: '/incidencias',
      icon: AlertTriangle,
      permission: 'incidents.read',
    },
    {
      label: 'Inventario',
      icon: Package,
      children: [
        {
          label: 'Equipos',
          path: '/inventario/equipos',
          icon: Monitor,
          permission: 'inventory.read',
        },
        {
          label: 'Tóners',
          path: '/inventario/toners',
          icon: Printer,
          permission: 'toners.read',
        },
        {
          label: 'Almacén',
          path: '/almacen',
          icon: Warehouse,
          permission: 'warehouse_stock.read',
        },
      ],
    },

    {
      label: 'Administración',
      icon: Users,
      permission: 'admin.panel.read',
      children: [
        {
          label: 'Actividad',
          path: '/actividad',
          icon: FileText,
          permission: 'users.read',
        },
        {
          label: 'Panel principal',
          path: '/admin',
          icon: UserSquare,
          permission: 'admin.panel.read',
        },
      ],
    },
  ];

  const matchesPermission = (permission) => {
    if (!permission) return true;
    if (Array.isArray(permission)) return permission.some((code) => hasPermission(code));
    return hasPermission(permission);
  };

  return items

    .filter((item) => matchesPermission(item.permission))
    .map((item) => {
      if (!item.children) return item;

      const filteredChildren = item.children.filter((child) => matchesPermission(child.permission));

      if (filteredChildren.length === 0) {
        return null;
      }

      return {
        ...item,
        children: filteredChildren,
      };
    })
    .filter(Boolean);
};
