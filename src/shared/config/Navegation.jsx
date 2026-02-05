// src/shared/config/navigation.js
import { LayoutDashboard, List, Cpu, Settings, ShieldCheck } from "lucide-react";

export const getNavigation = (userType) => {
    const items = [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "tecnico", "consultor"] },
        { label: "Incidencias", path: "/incidencias", icon: List, roles: ["admin", "tecnico", "consultor"] },
        { label: "Inventario", path: "/inventario", icon: Cpu, roles: ["admin", "tecnico", "consultor"] },
        { label: "Mensajería", path: "/documentos", icon: Settings, roles: ["admin", "mensajeria"] },
        { label: "Administración", path: "/admin", icon: ShieldCheck, roles: ["admin"] },
    ];

    return items.filter(item => item.roles.includes(userType));
};