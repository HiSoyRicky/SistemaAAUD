import React, { useEffect, useState } from "react";
import Pagination from "../../../../shared/components/ui/Pagination";
import ActionButton from "../../../../shared/components/ui/ActionButton";

export default function UbicationsManager({
    newUbication,
    setNewUbication,
    addUbication,
    editUbication,
    saveUbication,
    editingId,
    editingName,
    setEditingName,
    currentPage,
    itemsPerPage,
    paginatedUbications,
    totalPages,
    setCurrentPage,
    search,
    setSearch,
    message,
    setMessage,
    setSuccessMessage

}) {

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gestión de Ubicación</h2>
            </div>

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

            {/* Barra de búsqueda */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Buscar ubicación..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                />
            </div>

            {message && (
                <successMessage
                    message={message}
                    type={setSuccessMessage}
                    onClose={() => setMessage('')}
                    duration={3000}
                />
            )}

            {/* Tabla */}
            <table className="w-full text-sm border">
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
