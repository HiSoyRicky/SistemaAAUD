// Sidebar.jsx
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "@/shared/hooks/useAuth";
import { getNavigation } from "@/shared/config/Navegation";

function Tooltip({ text }) {
    return (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center z-[9999] pointer-events-none">
            {/* Flechita */}
            <div className="w-0 h-0 border-r-8 border-y-8 border-y-transparent border-r-white" />

            {/* Caja */}
            <div className="px-3 py-2 text-sm font-medium bg-white rounded-lg shadow-lg text-slate-800 whitespace-nowrap">
                {text}
            </div>
        </div>
    );
}

export default function Sidebar({ open, onToggleFixed }) {
    const { userType } = useAuth();
    const menuItems = getNavigation(userType);

    return (
        <aside
            className={`
        hidden md:flex flex-col fixed left-0 z-40
        bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950
        border-r border-white/10 text-white
        top-16 h-[calc(100vh-4rem)]
        ${open ? "w-64" : "w-20"}
        transition-[width] duration-200 ease-out
      `}
        >
            {/* ✅ ESTE contenedor permite que el tooltip salga (NO se recorta) */}
            <div className="flex-1 p-3 overflow-visible">

                {/* ✅ ESTE es el que hace scroll SOLO hacia abajo */}
                <div className="h-full overflow-y-auto custom-scrollbar">
                    <nav className="space-y-0 overflow-visible">

                        {/* ✅ Menú */}
                        <button
                            onClick={onToggleFixed}
                            className="relative flex items-center w-full gap-4 px-3 py-3 text-left transition-colors duration-200 group rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                            <Menu className="w-5 h-5 shrink-0" />

                            {open && <span className="text-sm font-medium"></span>}
                            {!open && <Tooltip text="Menú de navegación" />}
                        </button>

                        {/* ✅ Links */}
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                  relative group flex items-center gap-4 px-3 py-3 rounded-xl transition-colors duration-200
                  ${isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }
                `}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />

                                {open && <span className="text-sm font-medium">{item.label}</span>}
                                {!open && <Tooltip text={item.label} />}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
}