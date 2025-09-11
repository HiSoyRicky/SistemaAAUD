import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit } from "lucide-react";

export default function UbicationsManager() {
    const [ubications, setUbications] = useState([]);
    const [newUbication, setNewUbication] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/ubications`;

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

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de Ubicaciones</h2>
            {successMessage && (
                <div className="mb-4 p-2 bg-green-200 text-green-800 rounded">
                    {successMessage}
                </div>
            )}

            {/* Agregar */}
            <div className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={newUbication}
                    onChange={(e) => setNewUbication(e.target.value)}
                    placeholder="Nueva ubicación"
                    className="border rounded px-2 py-1"
                />
                <button
                    onClick={addUbication}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Agregar
                </button>
            </div>

            {/* Tabla */}
            <table className="bg-white rounded-lg shadow-md p-1">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-3 py-1 text-left">Nombre</th>
                        <th className="border px-3 py-1 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {ubications.map((u) => (
                        <tr key={u.id}>
                            <td className="border px-3 py-1">
                                {editingId === u.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="border rounded px-2 py-1 w-full"
                                    />
                                ) : (
                                    u.name
                                )}
                            </td>
                            <td className="border px-3 py-1 text-center flex justify-center gap-2">
                                {editingId === u.id ? (
                                    <button
                                        onClick={() => saveUbication(u.id)}
                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editUbication(u)} title="Editar ubicación">
                                        <Edit className="w-5 h-5 text-yellow-500" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
