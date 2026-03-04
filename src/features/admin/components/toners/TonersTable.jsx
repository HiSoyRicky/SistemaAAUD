import React, { useState, useMemo } from "react";
import ActionButton from "@/shared/components/ui/ActionButton";

export default function TonersTable({
    toners,
    currentPage,
    itemsPerPage,
    editingToner,
    startEdit,
    updateToner,
    deleteToner,
}) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        return toners.filter(t =>
            t.toner_model?.toLowerCase().includes(search.toLowerCase()) ||
            t.color?.toLowerCase().includes(search.toLowerCase())
        );
    }, [toners, search]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-4 space-y-3 bg-white rounded shadow">

            {/* 🔎 Barra búsqueda */}
            <input
                type="text"
                placeholder="Buscar por modelo o color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2 py-1 border rounded"
            />

            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-1 text-center border">#</th>
                        <th className="px-3 py-1 border">Modelo</th>
                        <th className="px-3 py-1 border">Color</th>
                        <th className="px-3 py-1 text-center border">Stock</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {paginated.map((t, i) => (
                        <tr key={t.id}>
                            <td className="px-3 py-1 text-center border">{(currentPage - 1) * itemsPerPage + i + 1}</td>

                            <td className="px-3 py-1 border">{t.toner_model}</td>
                            <td className="px-3 py-1 border">{t.color}</td>
                            <td className="px-3 py-1 text-center border">{t.stock}</td>

                            <td className="px-3 py-1 border flex justify-center gap-2">
                                {editingToner === t.id ? (
                                    <button
                                        onClick={updateToner}
                                        className="px-2 py-1 text-white bg-blue-500 rounded"
                                    >
                                        Guardar
                                    </button>
                                ) : (
                                    <ActionButton
                                        type="edit"
                                        onClick={() => startEdit(t)}
                                    />
                                )}

                                <ActionButton
                                    type="trash"
                                    onClick={() => deleteToner(t.id)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}