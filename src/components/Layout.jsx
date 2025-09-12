// src/components/Layout.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import useAuth from '@/hooks/useAuth';

// Íconos simulados
const GridIcon = () => <span>📊</span>;
const ListIcon = () => <span>📋</span>;
const PlugInIcon = () => <span>🔌</span>;

function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { userType } = useAuth();

    // Definir los ítems del menú con submenús
    const menuItems = [
        {
            icon: <GridIcon />,
            label: 'Dashboard',
            path: '/dashboard',
            allowed: ['admin', 'tecnico'],
        },
        {
            icon: <ListIcon />,
            label: 'Incidencias',
            path: '/incidencias',
            allowed: ['trabajador', 'admin', 'tecnico', 'secretaria'],
        },
        {
            icon: <PlugInIcon />,
            label: 'Inventario',
            path: '/inventario',
            allowed: ['admin', 'tecnico', 'secretaria'],
        },
        {
            icon: <span>🛠</span>,
            label: 'Admin Panel',
            path: '/admin',
            allowed: ['admin'],
        }
    ];

    const filteredMenuItems = menuItems.filter(item => item.allowed.includes(userType));


    return (
        <div className="flex flex-col min-h-screen">
            {/* Sidebar */}
            <aside
                className={`bg-gray-800 text-white flex flex-col transition-all duration-300 fixed h-screen z-40
                ${sidebarOpen ? 'w-64' : 'w-16'} hidden md:flex`}
            >
                <h1 className={`text-2xl font-bold p-4 ${sidebarOpen ? 'block' : 'hidden'}`}>Sistema AAUD</h1>
                <nav className="flex flex-col p-2 gap-2 flex-1">
                    {filteredMenuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `p-2 rounded hover:bg-gray-700 flex items-center gap-2 text-white ${isActive ? 'bg-blue-600' : ''}`
                            }
                        >
                            {item.icon} {sidebarOpen && item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Botón de ocultar/mostrar sidebar */}
                <button
                    className="p-2 m-2 bg-gray-700 rounded-md hover:bg-gray-600"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? '<' : '>'}
                </button>
            </aside>

            {/* Contenido principal */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
                <Header />
                <main className="flex-grow p-6 bg-gray-100">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}

export default Layout;