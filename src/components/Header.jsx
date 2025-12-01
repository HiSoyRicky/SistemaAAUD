import { LogOut, Menu, LayoutDashboard, List, Cpu, Settings, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";

function Header() {
  const {
    isAuthenticated = false,
    userType = null,
    loggedUserName = '',
    loggedUserId,
    logout
  } = useAuth();
  const userId = loggedUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const initials = loggedUserName
    ? loggedUserName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "?";

  const handleClick = () => {
    navigate("/dashboard");
  };

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

  const roleLabel =
    userType === "admin"
      ? "Admin"
      : userType === "tecnico"
        ? "Técnico"
        : userType === "secretaria"
          ? "Secretaria"
          : "Trabajador";

  return (
    <header className="sticky top-0 z-50 text-white shadow-md bg-gradient-to-r from-blue-900 to-indigo-600">
      <div className="flex items-center justify-between py-2 mx-auto max-w-7xl">
        {/* Logo / título */}
        <h1
          onClick={handleClick}
          role="button"
          className="text-3xl font-extrabold tracking-wide text-transparent cursor-pointer md:text-5xl bg-clip-text bg-gradient-to-r from-white to-gray-300"
        >
          Sistema AAUD
        </h1>

        {/* Menú de escritorio */}
        {isAuthenticated && (
          <nav
            className={`overflow-hidden transition-all duration-500 ease-in-out md:flex 
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
          <div className="relative flex items-center space-x-3">
            {/* Botón de usuario (avatar + nombre + rol) */}
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2 py-1 text-sm font-medium transition-colors rounded-full hover:bg-blue-800/60"
            >
              {/* Avatar */}
              <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-blue-600 bg-white rounded-full shadow-md ring-1 ring-white">
                {initials}
              </div>

              {/* Nombre + rol (solo desktop) */}
              <span className="hidden md:flex md:flex-col md:items-start">
                <span className="leading-tight">{loggedUserName}</span>
                <span className="text-xs text-blue-100/80">{roleLabel}</span>
              </span>

              {/* Flechita */}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>

            {/* Dropdown usuario */}
            {userMenuOpen && (
              <div className="absolute right-0 z-50 w-40 p-2 mt-2 text-sm text-gray-800 bg-white rounded-lg shadow-lg top-full">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/perfil");
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-left rounded-md hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4" />
                  <span>Mi perfil</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-left text-red-600 rounded-md hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
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
    </header>
  );
}

export default Header;
