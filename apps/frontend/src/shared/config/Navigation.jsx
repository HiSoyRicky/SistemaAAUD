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
} from 'lucide-react';

export const getNavigation = (userType, hasPermission = () => true) => {
  const items = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'tecnico', 'consultor'],
      permission: 'incidents.read',
    },
    {
      label: 'Incidencias',
      path: '/incidencias',
      icon: AlertTriangle,
      roles: ['admin', 'tecnico', 'consultor'],
      permission: 'incidents.read',
    },
    {
      label: 'Inventario',
      icon: Package,
      roles: ['admin', 'tecnico', 'consultor'],
      permission: 'inventory.read',
      children: [
        {
          label: 'Equipos',
          path: '/inventario/equipos',
          icon: Monitor,
          roles: ['admin', 'tecnico', 'consultor'],
          permission: 'inventory.read',
        },
        {
          label: 'Tóners',
          path: '/inventario/toners',
          icon: Printer,
          roles: ['admin', 'tecnico', 'consultor'],
          permission: 'toners.read',
        },
      ],
    },
    {
      label: 'Administración',
      icon: Users,
      roles: ['admin', 'tecnico', 'consultor'],
      permission: 'inventory.read',
      children: [
        {
          label: 'Actividad',
          path: '/actividad',
          icon: FileText,
          roles: ['admin'],
          permission: 'users.read',
        },
        {
          label: 'Panel principal',
          path: '/admin',
          icon: UserSquare,
          roles: ['admin'],
          permission: 'users.read',
        },
      ],
    },
  ];

  return items

    .filter((item) => item.roles.includes(userType))
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) => {
      if (!item.children) return item;

      const filteredChildren = item.children.filter(
        (child) =>
          child.roles.includes(userType) && (!child.permission || hasPermission(child.permission))
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
