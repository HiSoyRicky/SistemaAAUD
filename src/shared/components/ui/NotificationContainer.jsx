// src/components/ui/NotificationContainer.jsx
import React from "react";
import { X } from "lucide-react";

export default function NotificationContainer({
    notifications = [],
    remove = () => {}
}) {
    const list = Array.isArray(notifications) ? notifications : [];

    if (list.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
            {list.map(({ id, message, type }) => (
                <NotificationItem
                    key={id}
                    id={id}
                    message={message}
                    type={type}
                    remove={remove}
                />
            ))}
        </div>
    );
}

const typeStyles = {
    success: "bg-green-500/90 border-green-600",
    error: "bg-red-500/90 border-red-600",
    warning: "bg-yellow-500/90 border-yellow-600",
    info: "bg-blue-500/90 border-blue-600",
};

function NotificationItem({ id, message, type, remove }) {
    return (
        <div
            className={`relative px-4 py-3 w-80 text-white rounded-xl shadow-lg border
                backdrop-blur-md animate-fade-slide 
                ${typeStyles[type] || typeStyles.info}`}
        >
            <p className="text-sm font-semibold">{message}</p>
            <button
                onClick={() => remove(id)}
                className="absolute top-2 right-2 text-white/80 hover:text-white"
            >
                <X size={16} />
            </button>
        </div>
    );
}
