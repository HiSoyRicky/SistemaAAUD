// Sidebar.jsx
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getNavigation } from "../../config/Navegation";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function Tooltip({ text, children }) {
    const content = children ?? text;
    if (!content) return null;
    return (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center z-[9999] pointer-events-none">
            <div className="w-0 h-0 border-r-8 border-y-8 border-y-transparent border-r-white" />
            <div className="px-3 py-2 text-sm font-medium bg-white rounded-lg shadow-lg text-slate-800 whitespace-nowrap">
                {content}
            </div>
        </div>
    );
}

function FlyoutMenu({ label, items }) {
    if (!items?.length) return null;
    return (
        <div className="absolute left-full top-0 ml-3 z-[9999] opacity-0 pointer-events-none translate-x-1 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0">
            <div className="min-w-[220px] rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="px-4 py-2 text-xs font-semibold tracking-wide uppercase text-slate-500 bg-slate-50">
                    {label}
                </div>
                <div className="py-1">
                    {items.map((child) => (
                        <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2 text-sm transition-colors
                                ${isActive
                                    ? "bg-slate-100 text-slate-900"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`
                            }
                        >
                            <child.icon className="w-4 h-4 text-slate-500" />
                            <span>{child.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ open, onToggleFixed }) {
    const { userType } = useAuth();
    const menuItems = getNavigation(userType);
    const [openMenus, setOpenMenus] = useState({});
    const [hovered, setHovered] = useState(false);
    const isExpanded = open || hovered;

    const scrollClass = isExpanded
        ? "overflow-y-auto custom-scrollbar"
        : "overflow-y-auto no-scrollbar";
    const overflowXClass = isExpanded ? "overflow-x-hidden" : "overflow-x-visible";

    const toggleMenu = (label) => {
        setOpenMenus((prev) => ({
            ...prev,
            [label]: !prev[label],
        }));
    };



    return (
        <aside
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`
    hidden md:flex flex-col fixed left-0 z-40
    bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950
    border-r border-white/10 text-white
    top-16 h-[calc(100vh-4rem)]
    ${isExpanded ? "w-64" : "w-20"}
    transition-[width] duration-200 ease-out
    ${overflowXClass}
  `}
        >

            <div className="flex-1 p-3 overflow-visible">

                <div className={`h-full ${scrollClass}`}>
                    <nav className="space-y-0 overflow-visible">

                        {/* Menú */}
                        <button
                            onClick={onToggleFixed}
                            className="relative flex items-center w-full gap-4 px-3 py-3 text-left transition-colors duration-200 group rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                            <Menu className="w-5 h-5 shrink-0" />

                            {isExpanded && <span className="text-sm font-medium"></span>}
                            {!isExpanded && <Tooltip text="Menú de navegación" />}
                        </button>

                        {/* Links */}
                        {menuItems.map((item) => {
                            const isOpen = openMenus[item.label];

                            if (item.children) {
                                return (
                                    <div key={item.label} className="space-y-1">
                                        <button
                                            onClick={() => toggleMenu(item.label)}
                                            className="relative flex items-center w-full gap-4 px-3 py-3 group rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
                                            {isExpanded && (
                                                <span className="ml-auto">
                                                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </span>
                                            )}
                                            {!isExpanded && <FlyoutMenu label={item.label} items={item.children} />}

                                        </button>

                                        {isOpen && isExpanded && (
                                            <div className="ml-10 space-y-1">
                                                {item.children.map((child) => (
                                                    <NavLink
                                                        key={child.path}
                                                        to={child.path}
                                                        className={({ isActive }) =>
                                                            `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                                                            ${isActive
                                                                ? "bg-indigo-600 text-white"
                                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                            }`
                                                        }
                                                    >
                                                        <child.icon className="w-4 h-4" />
                                                        {isExpanded && <span>{child.label}</span>}

                                                        {!isExpanded && (
                                                            <Tooltip>
                                                                {item.label}
                                                            </Tooltip>
                                                        )}
                                                    </NavLink>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `relative group flex items-center gap-4 px-3 py-3 rounded-xl transition-colors
                                        ${isActive
                                            ? "bg-indigo-600 text-white"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
                                    {!isExpanded && <Tooltip text={item.label} />}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </aside>
    );
}
