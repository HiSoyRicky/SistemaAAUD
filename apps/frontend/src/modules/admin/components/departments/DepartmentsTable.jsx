// src/components/admin/DepartmentsTable.jsx
import React from "react";
import ActionButton from "../../../../shared/components/ui/ActionButton";
import Pagination from "../../../../shared/components/ui/Pagination";

export default function DepartmentsTable({
    departments,
    currentPage,
    itemsPerPage,
    editingId,
    editingName,
    editingUbication,
    setEditingId,
    setEditingName,
    setEditingUbication,
    saveDepartment,
    handleDelete,
    totalPages,
    search,
    setSearch,
    ubications,
    paginatedDepartments,
    newName,
    setNewName,
    newUbication,
    setNewUbication,
    addDepartment,
    errorMessage,
    successMessage,
    loading,
    setCurrentPage,
    editDepartment // Asegurarse de recibir editDepartment como prop
}) {
    // Función auxiliar para obtener departamentos únicos
    const getUniqueDepartments = () => {
        if (!departments || !Array.isArray(departments)) return [];
        return Array.from(new Set(departments.map(d => d.name))).sort();
    };

    // Función auxiliar para obtener ubicaciones ordenadas
    const getSortedUbications = () => {
        if (!ubications || !Array.isArray(ubications)) return [];
        return [...ubications].sort((a, b) => a.name.localeCompare(b.name));
    };

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
                    {getUniqueDepartments().map((depName, idx) => (
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
                    {getSortedUbications().map(u => (
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

            {/* Barra de búsqueda */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Buscar departamento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                />
            </div>

            {errorMessage && (
                <div className="px-3 py-2 mb-4 text-red-800 bg-red-100 border border-red-300 rounded">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="px-3 py-2 mb-4 text-green-800 bg-green-100 border border-green-300 rounded">
                    {successMessage}
                </div>
            )}

            {/* Tabla de departamentos */}
            <table className="w-full text-sm border">
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
                                        placeholder="Nombre del departamento"
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
                                        <option value="">Selecciona ubicación</option>
                                        {getSortedUbications().map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                ) : d.ubication_name}
                            </td>

                            {/* Acciones */}
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === d.id ? (
                                    <>
                                        <ActionButton
                                            type={"save"}
                                            title="Guardar"
                                            onClick={() => saveDepartment(d.id)}
                                            disabled={loading}
                                        />
                                        <ActionButton
                                            type={"cancel"}
                                            title="Cancelar"
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditingName("");
                                                setEditingUbication("");
                                            }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <ActionButton
                                            type={"edit"}
                                            title="Editar departamento"
                                            onClick={() => editDepartment(d.id, d.name, d.id_ubication)}
                                        />
                                        <ActionButton
                                            type={"delete"}
                                            title="Eliminar departamento"
                                            onClick={() => handleDelete(d.id, d.name)}
                                        />
                                    </>
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