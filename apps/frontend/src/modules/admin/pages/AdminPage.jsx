// AdminPage.jsx

import {
  Boxes,
  Building,
  Cpu,
  Droplet,
  GitBranch,
  Layers,
  MapPin,
  Mail,
  Scale,
  Shield,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import useAuth from '../../../shared/hooks/useAuth';

export default function AdminPage() {
  const { hasPermission } = useAuth();
  const menuItems = [
    {
      path: 'users',
      label: 'Usuarios',
      icon: <Users className="w-5 h-5" />,
      permission: 'users.read',
    },
    {
      path: 'roles',
      label: 'Roles',
      icon: <Shield className="w-5 h-5" />,
      permission: 'roles.read',
    },
    {
      path: 'permissions',
      label: 'Permisos',
      icon: <ShieldCheck className="w-5 h-5" />,
      permission: 'permissions.read',
    },
    {
      path: 'warehouse-items',
      label: 'Insumos de Almacén',
      icon: <Boxes className="w-5 h-5" />,
      permission: 'warehouse_items.read',
    },
    {
      path: 'transfers',
      label: 'Traslados',
      icon: <GitBranch className="w-5 h-5" />,
      permission: 'inventory.read',
    },
    {
      path: 'ubications',
      label: 'Ubicaciones',
      icon: <MapPin className="w-5 h-5" />,
      permission: 'ubications.read',
    },
    {
      path: 'departments',
      label: 'Departamentos',
      icon: <Building className="w-5 h-5" />,
      permission: 'departments.read',
    },
    {
      path: 'devices',
      label: 'Equipos',
      icon: <Cpu className="w-5 h-5" />,
      permission: 'devices.read',
    },
    {
      path: 'classification-rules',
      label: 'Clasificación patrimonial',
      icon: <Scale className="w-5 h-5" />,
      permission: 'inventory_classification_rules.read',
    },
    {
      path: 'brands',
      label: 'Marcas',
      icon: <Tag className="w-5 h-5" />,
      permission: 'brands.read',
    },
    {
      path: 'models',
      label: 'Modelos',
      icon: <Layers className="w-5 h-5" />,
      permission: 'models.read',
    },
    // { path: "statuses", label: "Estados", icon: <Home className="w-5 h-5" /> },
    {
      path: 'toners',
      label: 'Toners',
      icon: <Droplet className="w-5 h-5" />,
      permission: 'toners.read',
    },
    {
      path: 'notifications',
      label: 'Correos de Notificación',
      icon: <Mail className="w-5 h-5" />,
      permission: 'notification_settings.read',
    },
  ];

  return (
    <div className="p-0">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Panel de Administración</h1>

      {/* Menú horizontal con scroll para móviles */}
      <div className="flex gap-3 pb-2 mb-6 overflow-x-auto">
        {menuItems
          .filter((item) => !item.permission || hasPermission(item.permission))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200
                                ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
      </div>

      {/* Contenido */}
      <div className="bg-white shadow-lg rounded-lg p-6 min-h-[400px]">
        <Outlet />
      </div>
    </div>
  );
}
