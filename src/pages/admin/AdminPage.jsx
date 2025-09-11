// src/pages/admin/AdminPage.jsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import Layout from "../../components/Layout";

export default function AdminPage() {
    const menuItems = [
        { path: "users", label: "Usuarios" },
        { path: "ubications", label: "Ubicaciones" },
        { path: "departments", label: "Departamentos" },
        { path: "devices", label: "Equipos" },
        { path: "brands", label: "Marcas" },
        { path: "models", label: "Modelos" },
        { path: "statuses", label: "Estados" },
        { path: "toners", label: "Toners" },
    ];

    return (
        <Layout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Panel de Administración</h1>

                <div className="flex gap-2 mb-6">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `px-3 py-1 rounded ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <Outlet />
            </div>
        </Layout>
    );
}
