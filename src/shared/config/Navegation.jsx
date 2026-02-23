// src/shared/config/navigation.js
import {
  LayoutDashboard,
  AlertTriangle,
  Package,
  Monitor,
  Printer,
  FileText,
  Users
} from "lucide-react";

export const getNavigation = (userType) => {
  const items = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "tecnico", "consultor"],
    },
    {
      label: "Incidencias",
      path: "/incidencias",
      icon: AlertTriangle,
      roles: ["admin", "tecnico", "consultor"],
    },
    {
      label: "Inventario",
      icon: Package,
      roles: ["admin", "tecnico", "consultor"],
      children: [
        {
          label: "Equipos",
          path: "/inventario/equipos",
          icon: Monitor,
          roles: ["admin", "tecnico", "consultor"],
        },
        {
          label: "Tóners",
          path: "/inventario/toners",
          icon: Printer,
          roles: ["admin"],
        },
      ],
    },
    {
      label: "Mensajería",
      path: "/documentos",
      icon: FileText,
      roles: ["admin", "mensajeria"],
    },
    {
      label: "Administración",
      path: "/admin",
      icon: Users,
      roles: ["admin"],
    },
  ];

  return items

    .filter((item) => item.roles.includes(userType))
    .map((item) => {
      if (!item.children) return item;

      const filteredChildren = item.children.filter((child) =>
        child.roles.includes(userType)
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