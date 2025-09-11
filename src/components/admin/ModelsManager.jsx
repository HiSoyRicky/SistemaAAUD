import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit } from "lucide-react";

export default function ModelsManager() {
    const [models, setModels] = useState([]);
    const [brands, setBrands] = useState([]);
    const [newModel, setnewModel] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [editingBrand, setEditingBrand] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/models`;

    // 🔹 Cargar dispositivos desde backend
    const fetchModels = async () => {
        try {
            const res = await axios.get(API_URL);
            setModels(res.data);
        } catch (err) {
            console.error("Error al cargar dispositivos:", err);
        }
    };

    const fetchBrands = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/brands`);
            setBrands(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchModels();
        fetchBrands();
    }, []);

    // 🔹 Agregar nueva marca
    const addModel = async () => {
        if (!newModel.trim() || !selectedBrand) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/models`, { name: newModel });
            setnewModel("");
            setSelectedBrand("");
            fetchModels();
        }
        catch (err) {
            console.error("Error al agregar marca:", err);
        }
    };

    // 🔹 Iniciar edición
    const editModel = (id, name) => {
        setEditingId(id);
        setEditingName(name);
        setEditingBrand(id_brand);
    };

    // 🔹 Guardar edición
    const saveModel = async (id) => {
        if (!editingName.trim() || !editingBrand) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/models/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            setEditingBrand("");
            fetchModels();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar dispositivo:", err);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de Modelos</h2>

            {/* Agregar */}
            <div className="mb-4 flex gap-2">
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="border px-2 py-1 rounded"
                >
                    <option value="">Selecciona una marca</option>
                    {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="Nuevo modelo"
                    className="border rounded px-2 py-1"
                />
                <button onClick={addModel} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                    Agregar
                </button>
            </div>

            {/* Tabla */}
            <table className="bg-white rounded-lg shadow-md p-1">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-3 py-1">Modelo</th>
                        <th className="border px-3 py-1">Marca</th>
                        <th className="border px-3 py-1 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {models.map((m) => (
                        <tr key={m.id}>
                            <td className="border px-3 py-1">
                                {editingId === m.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="border rounded px-2 py-1 w-full"
                                    />
                                ) : m.name}
                            </td>
                            <td className="border px-3 py-1">
                                {editingId === m.id ? (
                                    <select
                                        value={editingBrand}
                                        onChange={(e) => setEditingBrand(e.target.value)}
                                        className="border rounded px-2 py-1 w-full"
                                    >
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                ) : m.brand_name}
                            </td>
                            <td className="border px-3 py-1 text-center flex justify-center gap-2">
                                {editingId === m.id ? (
                                    <button
                                        onClick={() => saveModel(m.id)}
                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editModel(u)} title="Editar modelo">
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