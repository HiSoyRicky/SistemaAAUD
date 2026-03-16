// TonerTable.jsx

import React, { useState, useMemo } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../../../shared/hooks/useAuth";
import TonerMovementModal from "../modals/TonerMovementsModal";
import Pagination from "../../../../../shared/components/ui/Pagination";

function TonerTable({ toners, onRefresh }) {
    const { userType } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [selectedToner, setSelectedToner] = useState(null);

    const itemsPerPage = 12;

    const colorMap = {
        BLACK: "NEGRO",
        CYAN: "CIAN",
        MAGENTA: "MAGENTA",
        YELLOW: "AMARILLO",
    };

    const translateColor = (color) => colorMap[color] || color;

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return toners.filter(
            (t) =>
                t.brand?.toLowerCase().includes(term) ||
                t.printer_model?.toLowerCase().includes(term) ||
                t.toner_model?.toLowerCase().includes(term) ||
                translateColor(t.color)?.toLowerCase().includes(term)
        );
    }, [toners, search]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const openMovementModal = (toner) => {
        setSelectedToner(toner);
        setMovementModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Inventario de Tóners</h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/inventario/toners/history")}
                        className="px-3 py-1 text-white bg-gray-700 rounded"
                    >
                        Ver Historial
                    </button>

                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-1 px-3 py-1 text-white bg-blue-500 rounded"
                    >
                        <RefreshCw size={16} /> Refrescar
                    </button>
                </div>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Buscar por marca, modelo o color..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
                className="px-3 py-2 border rounded w-72"
            />

            {/* Tabla */}
            <div className="overflow-hidden bg-white rounded shadow">
                <table className="w-full text-sm border border-collapse border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 border border-gray-300">Marca</th>
                            <th className="px-3 py-2 border border-gray-300">Modelo de impresora</th>
                            <th className="px-3 py-2 border border-gray-300">Modelo</th>
                            <th className="px-3 py-2 border border-gray-300">Color</th>
                            <th className="px-3 py-2 border border-gray-300">Stock</th>
                            <th className="px-3 py-2 border border-gray-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((t) => {
                            const lowStock = t.stock <= t.min_stock;

                            return (
                                <tr key={t.id}>
                                    <td className="px-3 py-2 border border-gray-300">
                                        {t.brand || "—"}
                                    </td>
                                    <td className="px-3 py-2 border border-gray-300">
                                        {t.printer_model || "—"}
                                    </td>
                                    <td className="px-3 py-2 border border-gray-300">
                                        {t.toner_model}
                                    </td>
                                    <td className="px-3 py-2 border border-gray-300">
                                        {translateColor(t.color)}
                                    </td>
                                    <td
                                        className={`px-3 py-2 border border-gray-300 font-semibold ${lowStock ? "text-red-600" : "text-green-600"
                                            }`}
                                    >
                                        {t.stock}
                                    </td>
                                    <td className="px-3 py-2 border border-gray-300">
                                        {["admin", "tecnico", "consultor"].includes(userType) && (
                                            <button
                                                onClick={() => openMovementModal(t)}
                                                className="flex items-center gap-1 px-2 py-1 text-white bg-purple-500 rounded"
                                            >
                                                <Plus size={14} /> Movimiento
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {movementModalOpen && (
                <TonerMovementModal
                    toner={selectedToner}
                    onClose={() => setMovementModalOpen(false)}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
}

export default TonerTable;