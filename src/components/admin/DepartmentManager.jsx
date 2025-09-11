import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit } from "lucide-react";

export default function DepartmentsManager() {
    const [departments, setDepartments] = useState([]);
    const [newName, setNewName] = useState("");
    const [newUbication, setNewUbication] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingUbication, setEditingUbication] = useState("");
    const [ubications, setUbications] = useState([]);
    const API_URL = `${import.meta.env.VITE_API_URL}/api/departments`;

    // 🔹 Cargar departamentos
    const fetchDepartments = async () => {
        try {
            const res = await axios.get(API_URL);
            // Ordenar alfabéticamente por name
            const sortedDepartments = res.data.sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            setDepartments(sortedDepartments);
        } catch (err) {
            console.error(err);
        }
    };

    // 🔹 Cargar ubicaciones para los select
    const fetchUbications = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ubications`);
            setUbications(res.data);
        } catch (err) {
            console.error("Error al cargar ubicaciones:", err);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchUbications();
    }, []);

    // 🔹 Agregar
    const handleAdd = async () => {
        if (!newName || !newUbication) return;
        try {
            await axios.post(API_URL, { name: newName, id_ubication: newUbication });
            setNewName(""); setNewUbication("");
            fetchDepartments();
        } catch (err) {
            console.error(err);
        }
    };

    // 🔹 Editar
    const editDepartment = (id, name, id_ubication) => {
        setEditingId(id);
        setEditingName(name);
        setEditingUbication(id_ubication);
    };

    // 🔹 Guardar
    const saveDepartment = async (id) => {
        if (!editingName || !editingUbication) return;
        try {
            await axios.put(`${API_URL}/${id}`, { name: editingName, id_ubication: editingUbication });
            setEditingId(null);
            setEditingName(""); setEditingUbication("");
            fetchDepartments();
        } catch (err) {
            console.error(err);
        }
    };

    // 🔹 Eliminar
    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar este departamento?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchDepartments();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de Departamentos</h2>

            <div className="mb-4 flex gap-2">
                <input
                    type="text"
                    placeholder="Nombre"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border px-2 py-1 rounded"
                />
                <select
                    value={newUbication}
                    onChange={(e) => setNewUbication(e.target.value)}
                    className="border px-2 py-1 rounded"
                >
                    <option value="">Selecciona una ubicación</option>
                    {ubications.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
                <button onClick={handleAdd} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                    Agregar
                </button>
            </div>

            {/* Tabla de departamentos */}
            <table className="bg-white rounded-lg shadow-md p-1">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-3 py-1">Nombre del departamento</th>
                        <th className="border px-3 py-1">Ubicación</th>
                        <th className="border px-3 py-1 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map(d => (
                        <tr key={d.id}>
                            <td className="border px-3 py-1">
                                {editingId === d.id ? (
                                    <input
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="border px-2 py-1 w-full rounded"
                                    />
                                ) : d.name}
                            </td>
                            <td className="border px-3 py-1">
                                {editingId === d.id ? (
                                    <select
                                        value={editingUbication}
                                        onChange={(e) => setEditingUbication(e.target.value)}
                                        className="border px-2 py-1 w-full rounded"
                                    >
                                        {ubications.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    d.ubication_name
                                )}
                            </td>

                            <td className="border px-3 py-1 text-center flex justify-center gap-2">
                                {editingId === d.id ? (
                                    <button onClick={() => saveDepartment(d.id)} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editDepartment(u)} title="Editar departamento">
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
