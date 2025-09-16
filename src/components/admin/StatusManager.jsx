import React, { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "@/components/Pagination";
import ActionButton from "@/components/ui/ActionButton";

export default function StatusesManager() {
    const [statuses, setStatuses] = useState([]);
    const [newStatus, setnewStatus] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/statuses`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const sortedStatuses = [...statuses].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedStatuses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStatuses = sortedStatuses.slice(startIndex, endIndex);

    // 🔹 Cargar dispositivos desde backend
    const fetchStatuses = async () => {
        try {
            const res = await axios.get(API_URL);
            setStatuses(res.data);
        } catch (err) {
            console.error("Error al cargar dispositivos:", err);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);

    // 🔹 Agregar nueva marca
    const addStatus = async () => {
        if (!newStatus.trim()) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/statuses`, { name: newStatus });
            setnewStatus("");
            fetchStatuses();
        }
        catch (err) {
            console.error("Error al agregar marca:", err);
        }
    };

    // 🔹 Iniciar edición
    const editStatus = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    // 🔹 Guardar edición
    const saveStatus = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/statuses/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchStatuses();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar dispositivo:", err);
        }
    };

    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold">Gestión de Estados</h2>

            {/* Agregar */}
            <div className="flex gap-2 mb-4">

                <input
                    type="text"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="Nuevo estado"
                    className="px-2 py-1 border rounded"
                />
                <button onClick={addStatus} className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600">
                    Agregar
                </button>
            </div>

            {successMessage && (
                <div className="p-2 mb-4 text-green-800 bg-green-200 border border-green-800 rounded">
                    {successMessage}
                </div>
            )}

            {/* Tabla */}
            <table className="p-1 bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-1 text-center border">#</th>
                        <th className="px-3 py-1 border">Estados</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedStatuses.map((s, index) => (
                        <tr key={s.id}>
                            {/* Enumeración consecutiva */}
                            <td className="px-3 py-1 text-center border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="px-3 py-1 border">
                                {editingId === s.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    />
                                ) : s.name}
                            </td>
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === s.id ? (
                                    <ActionButton
                                        type={"save"}
                                        value={editingName}
                                        title="Guardar estado"
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onClick={() => saveStatus(s.id)}
                                    />
                                ) : (
                                    <ActionButton
                                        type={"edit"}
                                        title="Editar estado"
                                        onClick={() => editStatus(s.id, s.name)}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />

        </div>
    );
}