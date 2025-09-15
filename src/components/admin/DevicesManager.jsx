import React, { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "@/components/Pagination";
import { Edit } from "lucide-react";

export default function DevicesManager() {
    const [devices, setDevices] = useState([]);
    const [newDevice, setnewDevice] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/devices`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const sortedDevices = [...devices].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDevices = sortedDevices.slice(startIndex, endIndex);

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
            <h2 className="mb-4 text-xl font-semibold">Gestión de Dispositivos</h2>
            {successMessage && (
                <div className="p-2 mb-4 text-green-800 bg-green-200 rounded">
                    {successMessage}
                </div>
            )}

            {/* Agregar */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newDevice}
                    onChange={(e) => setnewDevice(e.target.value)}
                    placeholder="Nuevo dispositivo"
                    className="px-2 py-1 border rounded"
                />
                <button
                    onClick={addDevice}
                    className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                >
                    Agregar
                </button>
            </div>

            {/* Tabla */}
            <table className="p-1 bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-1 text-center border">#</th>
                        <th className="px-3 py-1 text-left border">Nombre</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedDevices.map((d, index) => (
                        <tr key={d.id}>
                            {/* Enumeración consecutiva */}
                            <td className="px-3 py-1 text-center border">{(currentPage - 1) * itemsPerPage + index + 1}</td>

                            <td className="px-3 py-1 border">
                                {editingId === d.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    />
                                ) : (
                                    d.name
                                )}
                            </td>
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === d.id ? (
                                    <button
                                        onClick={() => saveDevice(d.id)}
                                        className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                                    >
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editDevice(d.id, d.name)} title="Editar dispositivo">
                                        <Edit className="w-5 h-5 text-yellow-500" />
                                    </button>
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