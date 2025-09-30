import React from "react";
import Pagination from "@/components/Pagination";
import ActionButton from "@/components/ui/ActionButton";

export default function DevicesTable( {
    currentPage,
    itemsPerPage,
    editingId,
    editingName,
    setEditingName,
    saveDevice,
    totalPages,
    search,
    setSearch,
    paginatedDevices,
    newDevice,
    setnewDevice,
    addDevice,
    successMessage,
    setCurrentPage,
    editDevice
}) {

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

            {/* Barra de búsqueda */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Buscar equipos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                />
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
                                    <ActionButton
                                        type={"save"}
                                        title="Guardar dispositivo"
                                        onClick={() => saveDevice(d.id)}
                                    >
                                    </ActionButton>
                                ) : (
                                    <ActionButton
                                        type={"edit"}
                                        title="Editar dispositivo"
                                        onClick={() => editDevice(d.id, d.name)}
                                    >
                                    </ActionButton>
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