import { LogOut, Menu, LayoutDashboard, List, Cpu, Settings } from "lucide-react"; // Agregado: Icons reales de lucide-react para menús (reemplaza placeholders).
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";

function Header() {
  const { isAuthenticated = false, userType = null, loggedUserName = '', logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Iniciales del usuario
  const initials = loggedUserName
    ? loggedUserName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "?";

  const handleClick = () => {
    navigate('/dashboard');
  };

  // Menús dinámicos por rol (con icons lucide para look pro)
  const menuItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard",
      path: "/dashboard",
      allowed: ["admin", "tecnico"],
    },
    {
      icon: <List className="w-5 h-5" />,
      label: "Incidencias",
      path: "/incidencias",
      allowed: ["trabajador", "admin", "tecnico", "secretaria"],
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      label: "Inventario",
      path: "/inventario",
      allowed: ["admin", "tecnico", "secretaria"],
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Admin Panel",
      path: "/admin",
      allowed: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.allowed.includes(userType)
  );

  return (
    <header className="sticky top-0 z-50 text-white shadow-md bg-gradient-to-r from-blue-900 to-indigo-600">
      <div className="flex items-center justify-between py-2 mx-auto max-w-7xl">
        {/* Logo / título */}
        <h1
          onClick={handleClick}
          role="button"
          className="text-3xl font-extrabold tracking-wide text-transparent md:text-5xl bg-clip-text bg-gradient-to-r from-white to-gray-300">
          Sistema AAUD
        </h1>

        {/* Menú de escritorio */}
        {isAuthenticated && (
          <nav
            className={` overflow-hidden transition-all duration-500 ease-in-out md:flex 
              ${menuOpen ? "max-h-96" : "max-h-0 md:max-h-full"}`}
          >
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-1 rounded-full flex items-center gap-1 text-sm transition-all text-white
                  ${isActive ? "bg-indigo-600" : "hover:bg-indigo-400"}`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Botón hamburguesa (solo móvil) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 transition-colors rounded-full md:hidden hover:bg-blue-700"
        >
          <Menu className="w-6 h-6" />
        </button>

        {isAuthenticated && (
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-blue-600 bg-white rounded-full shadow-md ring-1 ring-white">
              {initials}
            </div>
            {/* Nombre y rol */}
            <span className="hidden text-sm font-medium md:inline">
              {loggedUserName} (
              {userType === "admin"
                ? "Admin"
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
              className="flex gap-2 px-3 py-2 font-semibold text-white transition-all transform rounded-full shadow-md items-left bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2">
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline"></span>
            </button>
          </div>
        )}
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <nav className="flex flex-col mt-2 space-y-1 md:hidden animate-fadeIn">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg flex items-center gap-2 text-sm 
                   ${isActive ? "bg-indigo-700 text-white" : "hover:bg-indigo-500"}`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header >
  );
}

export default Header;