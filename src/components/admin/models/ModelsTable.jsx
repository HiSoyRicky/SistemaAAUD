// ModelsTable.jsx
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
    selectedBrand,
    setSelectedBrand,
    editingId,
    editingName,
    editingBrand,
    setEditingName,
    setEditingBrand,
    editModel,
    saveModel,
    selectedDevice,
    setSelectedDevice,
    devices,
    editingDevice,
    setEditingDevice
}) {

    return (
        <div>
            {/* Agregar */}
            <div className="flex gap-2 mb-4">

                <select
                    value={selectedDevice}
                    onChange={(e) => {
                        setSelectedDevice(e.target.value);
                        setSelectedBrand("");
                    }}
                    className="px-2 py-1 border rounded"
                >
                    <option value="">Seleccione un dispositivo</option>
                    {devices.map((device) => (
                        <option key={device.id} value={device.id}>
                            {device.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value === "" ? "" : Number(e.target.value))}
                    className="px-2 py-1 border rounded"
                    disabled={!selectedDevice}
                >
                    <option value="">Seleccionar Marca</option>
                    {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

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
                    disabled={!selectedDevice || !selectedBrand || !newModel.trim()}
                >
                    Agregar
                </button>

            </div>

            {/* Tabla */}
            <table className="p-1 bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-1 text-center border">#</th>
                        <th className="px-3 py-1 border">Nombre</th>
                        <th className="px-3 py-1 border">Marca</th>
                        <th className="px-3 py-1 border">Dispositivo</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {models.map((m, index) => {
                        // Determinar los IDs de marca y dispositivo
                        const brandId = m.id_brand;
                        const deviceId = m.id_device;

                        return (
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
                                            value={editingBrand ?? ""}
                                            onChange={(e) => setEditingBrand(e.target.value === "" ? "" : Number(e.target.value))}
                                            className="w-full px-2 py-1 border rounded"
                                        >
                                            <option value="">Seleccionar Marca</option>
                                            {brands.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        brandId && brands.find(b => b.id === brandId)
                                            ? brands.find(b => b.id === brandId).name
                                            : "S/M"
                                    )}
                                </td>

                                <td className="px-3 py-1 border">
                                    {editingId === m.id ? (
                                        <select
                                            value={editingDevice ?? ""}
                                            onChange={(e) => setEditingDevice(e.target.value === "" ? "" : Number(e.target.value))}
                                            className="w-full px-2 py-1 border rounded"
                                        >
                                            <option value="">Seleccionar Dispositivo</option>
                                            {devices.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        deviceId && devices.find(d => d.id === deviceId)
                                            ? devices.find(d => d.id === deviceId).name
                                            : "S/D"
                                    )}
                                </td>

                                <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                    {editingId === m.id ? (
                                        <ActionButton
                                            type={"save"}
                                            title="Guardar modelo"
                                            onClick={() => saveModel(m.id)}
                                        />
                                    ) : (
                                        <ActionButton
                                            type={"edit"}
                                            title="Editar modelo"
                                            onClick={() => editModel(m)}
                                        />
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}