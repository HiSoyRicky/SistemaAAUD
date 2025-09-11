import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit } from "lucide-react";

export default function DevicesManager() {
    const [devices, setDevices] = useState([]);
    const [newDevice, setnewDevice] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/devices`;

    // 🔹 Cargar dispositivos desde backend
    const fetchDevices = async () => {
        try {
            const res = await axios.get(API_URL);
            setDevices(res.data);
        } catch (err) {
            console.error("Error al cargar dispositivos:", err);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    // 🔹 Agregar nuevo dispositivo
    const addDevice = async () => {
        if (!newDevice.trim()) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/devices`, { name: newDevice });
            setnewDevice("");
            fetchDevices();
        }
        catch (err) {
            console.error("Error al agregar ubicación:", err);
        }
    };

    // 🔹 Iniciar edición
    const editDevice = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    // 🔹 Guardar edición
    const saveDevice = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/devices/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchDevices();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar dispositivo:", err);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de Dispositivos</h2>
            {successMessage && (
                <div className="mb-4 p-2 bg-green-200 text-green-800 rounded">
                    {successMessage}
                </div>
            )}

            {/* Agregar */}
            <div className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={newDevice}
                    onChange={(e) => setnewDevice(e.target.value)}
                    placeholder="Nuevo dispositivo"
                    className="border rounded px-2 py-1"
                />
                <button
                    onClick={addDevice}
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
                    {devices.map((u) => (
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
                                        onClick={() => saveDevice(u.id)}
                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editDevice(u)} title="Editar dispositivo">
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