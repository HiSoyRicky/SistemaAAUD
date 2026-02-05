// DocumentsStats.jsx
import React from "react";

const Badge = ({ children, variant = "gray" }) => {
    const styles = {
        gray: "bg-gray-100 text-gray-800 border-gray-200",
        green: "bg-green-100 text-green-800 border-green-200",
        blue: "bg-blue-100 text-blue-800 border-blue-200",
        amber: "bg-amber-100 text-amber-800 border-amber-200",
        red: "bg-red-100 text-red-800 border-red-200",
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-xs border rounded-full ${styles[variant] || styles.gray
                }`}
        >
            {children}
        </span>
    );
};

export default function DocumentsStats({ stats }) {
    return (
        <div className="grid gap-3 md:grid-cols-4">
            <div className="p-4 bg-white border rounded-xl">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-2xl font-semibold">{stats.total}</div>
            </div>

            <div className="p-4 bg-white border rounded-xl">
                <div className="text-xs text-gray-500">Entrada</div>
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold">{stats.entrada}</div>
                    <Badge variant="blue">ENTRADA</Badge>
                </div>
            </div>

            <div className="p-4 bg-white border rounded-xl">
                <div className="text-xs text-gray-500">Salida</div>
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold">{stats.salida}</div>
                    <Badge variant="amber">SALIDA</Badge>
                </div>
            </div>

            <div className="p-4 bg-white border rounded-xl">
                <div className="text-xs text-gray-500">Con PDF</div>
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold">{stats.withPdf}</div>
                    <Badge variant="green">Adjunto</Badge>
                </div>
            </div>
        </div>
    );
}
