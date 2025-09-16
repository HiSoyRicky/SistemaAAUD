import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit } from "lucide-react";
import Pagination from "@/components/Pagination";
import ActionButton from "@/components/ui/ActionButton";

export default function UbicationsManager() {
    const [ubications, setUbications] = useState([]);
    const [newUbication, setNewUbication] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/ubications`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 🔹 Cargar ubicaciones desde backend
    const fetchUbications = async () => {
        try {
            const res = await axios.get(API_URL);
            setUbications(res.data);
        } catch (err) {
            console.error("Error al cargar ubicaciones:", err);
        }
    };

    useEffect(() => {
        fetchUbications();
    }, []);

    // 🔹 Agregar nueva ubicación
    const addUbication = async () => {
        if (!newUbication.trim()) return;
        try {
            await axios.post(API_URL, { name: newUbication });
            setNewUbication("");
            fetchUbications();
        } catch (err) {
            console.error("Error al agregar ubicación:", err);
        }
    };

    // 🔹 Iniciar edición
    const editUbication = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    // 🔹 Guardar edición
    const saveUbication = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${API_URL}/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchUbications();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000); // desaparece después de 3s
        } catch (err) {
            console.error("Error al actualizar ubicación:", err);
        }
    };

    const sortedUbications = [...ubications].sort((a, b) => a.id - b.id);

    const totalPages = Math.ceil(sortedUbications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUbications = sortedUbications.slice(startIndex, endIndex);

    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold">Gestión de Ubicaciones</h2>
            {successMessage && (
                <div className="p-2 mb-4 text-green-800 bg-green-200 rounded">
                    {successMessage}
                </div>
            )}

            {/* Agregar */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newUbication}
                    onChange={(e) => setNewUbication(e.target.value)}
                    placeholder="Nueva ubicación"
                    className="px-2 py-1 border rounded"
                />
                <button
                    onClick={addUbication}
                    className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                >
                    Agregar
                </button>
            </div>

            {/* Tabla */}
            <table className="p-1 bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-2 text-center border">#</th>
                        <th className="px-3 py-1 border">Nombre</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedUbications.map((u, index) => (
                        <tr key={u.id}>
                            {/* Enumeración consecutiva */}
                            <td className="px-3 py-1 text-center border">{(currentPage - 1) * itemsPerPage + index + 1}</td>

                            <td className="px-3 py-1 border">
                                {editingId === u.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    />
                                ) : (
                                    u.name
                                )}
                            </td>
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === u.id ? (
                                    <ActionButton
                                        type={"save"}
                                        title="Guardar"
                                        onClick={() => saveUbication(u.id)}
                                    >
                                    </ActionButton>
                                ) : (
                                    <ActionButton
                                        type={"edit"}
                                        title="Editar"
                                        onClick={() => editUbication(u.id, u.name)}
                                    >
                                    </ActionButton>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>

            </table>
            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}
