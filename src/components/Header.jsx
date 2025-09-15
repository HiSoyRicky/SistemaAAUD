// src/components/Header.jsx
import { LogOut, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";

// Íconos de ejemplo (puedes cambiarlos por lucide-react)
const GridIcon = () => <span>📊</span>;
const ListIcon = () => <span>📋</span>;
const PlugInIcon = () => <span>🔌</span>;
const AdminIcon = () => <span>🛠</span>;

function Header() {
  const { isAuthenticated, userType, loggedUserName, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Iniciales del usuario
  const initials = loggedUserName
    ? loggedUserName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "";

  // Menús dinámicos por rol
  const menuItems = [
    {
      icon: <GridIcon />,
      label: "Dashboard",
      path: "/dashboard",
      allowed: ["admin", "tecnico"],
    },
    {
      icon: <ListIcon />,
      label: "Incidencias",
      path: "/incidencias",
      allowed: ["trabajador", "admin", "tecnico", "secretaria"],
    },
    {
      icon: <PlugInIcon />,
      label: "Inventario",
      path: "/inventario",
      allowed: ["admin", "tecnico", "secretaria"],
    },
    {
      icon: <AdminIcon />,
      label: "Admin Panel",
      path: "/admin",
      allowed: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.allowed.includes(userType)
  );

  return (
    <header className="text-white shadow-md bg-gradient-to-r from-blue-900 to-indigo-600">
      <div className="px-4 py-4 mx-auto max-w-7xl">
        {/* Fila superior con logo, avatar y logout */}
        <div className="flex items-center justify-between">
          {/* Logo / título */}
          <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">
            Sistema AAUD
          </h1>

          {/* Botón hamburguesa (solo móvil) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md md:hidden hover:bg-blue-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          {isAuthenticated && (
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex items-center justify-center w-10 h-10 font-bold text-blue-600 bg-white rounded-full shadow-md">
                {initials}
              </div>
              {/* Nombre y rol */}
              <span className="hidden text-lg font-medium md:inline">
                {loggedUserName} (
                {userType === "admin"
                  ? "Administrador"
                  : userType === "tecnico"
                    ? "Técnico"
                    : userType === "secretaria"
                      ? "Secretaria"
                      : "Trabajador"}
                )
              </span>
              {/* Botón logout */}
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="flex items-center gap-2 px-3 py-2 font-semibold text-white transition-all transform rounded-lg shadow-md bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Menú de navegación justo debajo del título */}
        {isAuthenticated && (
          <nav className="flex flex-wrap mt-4 space-x-2 md:space-x-4">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md flex items-center gap-2 transition-colors text-white
                ${isActive ? "bg-gray-700" : "hover:bg-blue-500"}`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Menú móvil (vertical) */}
        {menuOpen && (
          <nav className="flex flex-col mt-4 space-y-2 md:hidden">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md flex items-center gap-2 transition-colors 
                   ${isActive ? "bg-blue-800 text-white" : "hover:bg-blue-700"
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
