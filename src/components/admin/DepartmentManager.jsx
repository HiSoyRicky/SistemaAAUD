import React, { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "@/components/Pagination";
import { Edit } from "lucide-react";

export default function DepartmentsManager() {
    const [departments, setDepartments] = useState([]);
    const [newName, setNewName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [newUbication, setNewUbication] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingUbication, setEditingUbication] = useState("");
    const [ubications, setUbications] = useState([]);
    const API_URL = `${import.meta.env.VITE_API_URL}/api/departments`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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
    const addDepartment = async () => {
        if (!newName || !newUbication) return;
        try {
            await axios.post(API_URL, { name: newName, id_ubication: newUbication });
            setNewName("");
            setNewUbication("");
            fetchDepartments();
            setSuccessMessage(`✅ Departamento "${newName}" creado correctamente`);
            setTimeout(() => setSuccessMessage(""), 5000);
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
            setSuccessMessage(`✅ Departamento actualizado correctamente`);
            setTimeout(() => setSuccessMessage(""), 5000);
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
            setSuccessMessage(`✅ Departamento "${depName}" eliminado correctamente`);
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error(err);
        }
    };

    const sortedDepartments = [...departments].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedDepartments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDepartments = sortedDepartments.slice(startIndex, endIndex);

    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold">Gestión de Departamentos</h2>

            <div className="flex gap-2 mb-4">
                {/* Nombre del departamento */}
                <select
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-2 py-1 border rounded"
                >
                    <option value="">Selecciona un departamento</option>
                    {Array.from(new Set(departments.map(d => d.name))).map((depName, idx) => (
                        <option key={idx} value={depName}>
                            {depName}
                        </option>
                    ))}
                </select>


                {/* Ubicación */}
                <select
                    value={newUbication}
                    onChange={(e) => setNewUbication(e.target.value)}
                    className="px-2 py-1 border rounded"
                >
                    <option value="">Selecciona una ubicación</option>
                    {ubications.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>

                <button
                    onClick={addDepartment}
                    className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                >
                    Agregar
                </button>
            </div>

            {successMessage && (
                <div className="px-3 py-2 mb-4 text-green-800 bg-green-100 border border-green-300 rounded">
                    {successMessage}
                </div>
            )}

            {/* Tabla de departamentos */}
            <table className="p-1 bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-1 text-center border">#</th>
                        <th className="px-3 py-1 border">Nombre del departamento</th>
                        <th className="px-3 py-1 border">Ubicación</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedDepartments.map((d, index) => (
                        <tr key={d.id}>
                            {/* Enumeración consecutiva */}
                            <td className="px-3 py-1 text-center border">{(currentPage - 1) * itemsPerPage + index + 1}</td>

                            {/* Nombre */}
                            <td className="px-3 py-1 border">
                                {editingId === d.id ? (
                                    <input
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    />
                                ) : d.name}
                            </td>

                            {/* Ubicación */}
                            <td className="px-3 py-1 border">
                                {editingId === d.id ? (
                                    <select
                                        value={editingUbication}
                                        onChange={(e) => setEditingUbication(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    >
                                        {ubications.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                ) : d.ubication_name}
                            </td>

                            {/* Acciones */}
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === d.id ? (
                                    <button onClick={() => saveDepartment(d.id)} className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600">
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editDepartment(d.id, d.name, d.id_ubication)} title="Editar departamento">
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
