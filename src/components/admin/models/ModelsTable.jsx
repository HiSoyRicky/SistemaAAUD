import React from "react";
import ActionButton from "@/components/ui/ActionButton";

export default function ModelsTable({
    models,
    currentPage,
    itemsPerPage,
    brands,
    newModel,
    setnewModel,
    addModel,
    editingId,
    editingName,
    editingBrand,
    setEditingName,
    setEditingBrand,
    editModel,
    saveModel
}) {
    return (
        <div>
            {/* Agregar */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setnewModel(e.target.value)}
                    placeholder="Nuevo Modelo"
                    className="px-2 py-1 border rounded"
                />
                <button
                    onClick={addModel}
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
                        <th className="px-3 py-1 border">Modelo</th>
                        <th className="px-3 py-1 border">Marca</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {models.map((m, index) => (
                        <tr key={m.id}>
                            <td className="px-3 py-1 text-center border">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-3 py-1 border">
                                {editingId === m.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    />
                                ) : (
                                    m.name
                                )}
                            </td>
                            <td className="px-3 py-1 border">
                                {editingId === m.id ? (
                                    <select
                                        value={editingBrand}
                                        onChange={(e) => setEditingBrand(e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                    >
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    brands.find(b => b.id === m.brand_id)?.name || "S/M"
                                )}
                            </td>
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === m.id ? (
                                    <ActionButton
                                        type={"save"}
                                        title="Guardar modelo"
                                        onClick={() => saveModel(m.id)}
                                    >
                                    </ActionButton>
                                ) : (
                                    <ActionButton
                                        type={"edit"}
                                        title="Editar modelo"
                                        onClick={() => editModel(m.id, m.name, m.brand_id)}
                                    >
                                    </ActionButton>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
