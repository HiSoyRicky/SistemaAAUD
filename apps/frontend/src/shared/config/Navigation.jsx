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

export const getNavigation = (_userType, hasPermission = () => true) => {
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
          permission: 'users.read',
        },
      ],
    },
  ];

  return items

    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) => {
      if (!item.children) return item;

      const filteredChildren = item.children.filter(
        (child) => !child.permission || hasPermission(child.permission)
      );

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
