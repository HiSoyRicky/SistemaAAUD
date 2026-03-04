import React from "react";
import ActionButton from "@/shared/components/ui/ActionButton";

export default function BrandsTable({
    brands,
    editBrand,
    saveBrand,
    addBrand,
    newBrand,
    setnewBrand,
    editingId,
    editingName,
    setEditingName,
    currentPage = 1,
    itemsPerPage = 10,
    devices = [],
    selectedDevice,
    setSelectedDevice,
    models = [],
    editingDevice,
    setEditingDevice
}) {

    return (
        <div>
            {/* Agregar */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setnewBrand(e.target.value)}
                    placeholder="Nueva Marca"
                    className="px-2 py-1 border rounded"
                />
                <button
                    onClick={addBrand}
                    className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                >
                    Agregar
                </button>
            </div>

            {/* Tabla */}
            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-1 text-center border">#</th>
                        <th className="px-3 py-1 text-left border">Nombre</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {brands.map((b, index) => (
                        <tr key={b.id}>
                            {/* Enumeración consecutiva */}
                            <td className="px-3 py-1 text-center border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="px-3 py-1 border">
                                {editingId === b.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    />
                                ) : (
                                    b.name
                                )}
                            </td>
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === b.id ? (
                                    <ActionButton
                                        type={"save"}
                                        value={editingName}
                                        title="Guardar marca"
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onClick={() => saveBrand(b.id)}
                                    />
                                ) : (
                                    <ActionButton
                                        type={"edit"}
                                        title="Editar marca"
                                        onClick={() => editBrand(b.id, b.name)}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}