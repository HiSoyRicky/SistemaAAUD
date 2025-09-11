import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit } from "lucide-react";

export default function BrandsManager() {
    const [brands, setbrands] = useState([]);
    const [newBrand, setnewBrand] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/brands`;

    // 🔹 Cargar dispositivos desde backend
    const fetchbrands = async () => {
        try {
            const res = await axios.get(API_URL);
            setbrands(res.data);
        } catch (err) {
            console.error("Error al cargar dispositivos:", err);
        }
    };

    useEffect(() => {
        fetchbrands();
    }, []);

    // 🔹 Agregar nueva marca
    const addBrand = async () => {
        if (!newBrand.trim()) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/brands`, { name: newBrand });
            setnewBrand("");
            fetchbrands();
        }
        catch (err) {
            console.error("Error al agregar marca:", err);
        }
    };

    // 🔹 Iniciar edición
    const editBrand = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    // 🔹 Guardar edición
    const saveBrand = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/brands/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchbrands();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar dispositivo:", err);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de marcas</h2>
            {successMessage && (
                <div className="mb-4 p-2 bg-green-200 text-green-800 rounded">
                    {successMessage}
                </div>
            )}

            {/* Agregar */}
            <div className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setnewBrand(e.target.value)}
                    placeholder="Nueva marca"
                    className="border rounded px-2 py-1"
                />
                <button
                    onClick={addBrand}
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
                    {brands.map((u) => (
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
                                        onClick={() => saveBrand(u.id)}
                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editBrand(u)} title="Editar marca">
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