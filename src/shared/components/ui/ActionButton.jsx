// src/components/ui/ActionButton.jsx
import React from "react";
import { Pencil, Trash2, CheckCircle2, Save, Wrench, Printer, Key, Repeat,  } from "lucide-react";

const actionConfig = {
    edit: {
        icon: Pencil,
        color: "blue",
        tooltip: "Editar",
    },
    delete: {
        icon: Trash2,
        color: "red",
        tooltip: "Eliminar",
    },
    resolve: {
        icon: CheckCircle2,
        color: "green",
        tooltip: "Resolver",
    },
    save: {
        icon: Save,
        color: "green",
        tooltip: "Guardar",
    },
    assign: {
        icon: Wrench,
        color: "purple",
        tooltip: "Asignar técnico",
    },
    print: {
        icon: Printer,
        color: "red",
        tooltip: "Imprimir",
    },
    reset: {
        icon: Key,
        color: "purple",
        tooltip: "Cambiar contraseña",
    },
    refresh: {
        icon: Repeat,
        color: "purple",
        tooltip: "Movimiento",
    },
};

function ActionButton({ type, onClick, size = 5 }) {
    const config = actionConfig[type];

    if (!config) return null;

    const { icon: Icon, color, tooltip } = config;

    // Mapear colores a clases de Tailwind
    const bgHoverClass = {
        red: "hover:bg-red-100",
        blue: "hover:bg-blue-100",
        green: "hover:bg-green-100",
        purple: "hover:bg-purple-100",
    }[color];

    const textClass = {
        red: "text-red-500",
        blue: "text-blue-500",
        green: "text-green-500",
        purple: "text-purple-500",
    }[color];

    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={`p-2 rounded flex items-center justify-center ${bgHoverClass}`}
        >
            <Icon className={`w-${size} h-${size} ${textClass}`} />
        </button>
    );
}

export default ActionButton;
