// src/pages/admin/AdminPage.jsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Users, Home, MapPin, Building, Cpu, Tag, Layers, Droplet } from "lucide-react";

export default function AdminPage() {
    const menuItems = [
        { path: "users", label: "Usuarios", icon: <Users className="w-5 h-5" /> },
        { path: "ubications", label: "Ubicaciones", icon: <MapPin className="w-5 h-5" /> },
        { path: "departments", label: "Departamentos", icon: <Building className="w-5 h-5" /> },
        { path: "devices", label: "Equipos", icon: <Cpu className="w-5 h-5" /> },
        { path: "brands", label: "Marcas", icon: <Tag className="w-5 h-5" /> },
        { path: "models", label: "Modelos", icon: <Layers className="w-5 h-5" /> },
        { path: "statuses", label: "Estados", icon: <Home className="w-5 h-5" /> },
    ];

    return (
            <div className="p-6">
                <h1 className="mb-6 text-3xl font-bold text-gray-800">Panel de Administración</h1>

                {/* Menú horizontal con scroll para móviles */}
                <div className="flex gap-3 pb-2 mb-6 overflow-x-auto">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200
                                ${isActive ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`
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