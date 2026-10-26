// AdminPage.jsx

import {
  Boxes,
  Building,
  Cpu,
  ClipboardCheck,
  Droplet,
  FolderKanban,
  GitBranch,
  Layers,
  Mail,
  MapPin,
  Package,
  Scale,
  Shield,
  ShieldCheck,
  Tag,
  Truck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../../shared/hooks/useAuth';

export default function AdminPage() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const groups = [
    {
      id: 'seguridad', label: 'Seguridad y usuarios', icon: <ShieldCheck className="h-5 w-5" />,
      items: [
        { path: 'users', label: 'Usuarios', icon: <Users className="h-5 w-5" />, permission: 'users.read' },
        { path: 'roles', label: 'Roles', icon: <Shield className="h-5 w-5" />, permission: 'roles.read' },
        { path: 'permissions', label: 'Permisos', icon: <ShieldCheck className="h-5 w-5" />, permission: 'permissions.read' },
        { path: 'notifications', label: 'Correos de notificación', icon: <Mail className="h-5 w-5" />, permission: 'notification_settings.read' },
      ],
    },
    {
      id: 'inventario', label: 'Inventario y catálogos', icon: <Package className="h-5 w-5" />,
      items: [
        { path: 'classification-rules', label: 'Clasificación patrimonial', icon: <Scale className="h-5 w-5" />, permission: 'inventory_classification_rules.read' },
        { path: 'devices', label: 'Activos', icon: <Cpu className="h-5 w-5" />, permission: 'devices.read' },
        { path: 'brands', label: 'Marcas', icon: <Tag className="h-5 w-5" />, permission: 'brands.read' },
        { path: 'models', label: 'Modelos', icon: <Layers className="h-5 w-5" />, permission: 'models.read' },
        { path: 'vehicle-catalog', label: 'Vehículos', icon: <Truck className="h-5 w-5" />, permission: 'inventory_classification_rules.read' },
      ],
    },
    {
      id: 'operaciones', label: 'Operaciones', icon: <FolderKanban className="h-5 w-5" />,
      items: [
        { path: 'warehouse-items', label: 'Almacén', icon: <Boxes className="h-5 w-5" />, permission: 'warehouse_items.read' },
        { path: 'transfers', label: 'Traslados', icon: <GitBranch className="h-5 w-5" />, permission: 'inventory_transfers.read_all' },
        { path: 'creation-requests', label: 'Solicitudes de creación', icon: <ClipboardCheck className="h-5 w-5" />, permission: 'creation_requests.review' },
        { path: 'toners', label: 'Toners', icon: <Droplet className="h-5 w-5" />, permission: 'toners.read' },
      ],
    },
    {
      id: 'organizacion', label: 'Organización', icon: <Building className="h-5 w-5" />,
      items: [
        { path: 'ubications', label: 'Ubicaciones', icon: <MapPin className="h-5 w-5" />, permission: 'ubications.read' },
        { path: 'departments', label: 'Departamentos', icon: <Building className="h-5 w-5" />, permission: 'departments.read' },
      ],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0);

  const activePath = location.pathname.split('/').filter(Boolean).at(-1) || '';
  const matchingGroup = groups.find((group) => group.items.some((item) => item.path === activePath));
  const [selectedGroup, setSelectedGroup] = useState(matchingGroup?.id || groups[0]?.id || '');
  useEffect(() => {
    if (matchingGroup) setSelectedGroup(matchingGroup.id);
  }, [matchingGroup?.id]);
  const visibleGroup = groups.find((group) => group.id === selectedGroup);

  return (
    <div className="p-0">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Panel de Administración</h1>

      <nav aria-label="Grupos de administración" className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            aria-expanded={selectedGroup === group.id}
            aria-controls="admin-group-links"
            onClick={() => setSelectedGroup((current) => current === group.id ? '' : group.id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${selectedGroup === group.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {group.icon}<span>{group.label}</span>
          </button>
        ))}
      </nav>

      {visibleGroup && (
        <div id="admin-group-links" className="mb-6 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {visibleGroup.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}
            >
              {item.icon}<span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Contenido */}
      <div className="bg-white shadow-lg rounded-lg p-6 min-h-[400px]">
        <Outlet />
      </div>
    </div>
  );
}
