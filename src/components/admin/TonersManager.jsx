import React, { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import { Toners } from "@/services/api";
import ActionButton from "@/components/ui/ActionButton";

export default function TonersManager() {
    const [toners, setToners] = useState([]);
    const [printerModels, setPrinterModels] = useState([]);
    const [tonerModels, setTonerModels] = useState([]);
    const [colors, setColors] = useState([]);
    const [newPrinterModel, setNewPrinterModel] = useState("");
    const [newTonerModel, setNewTonerModel] = useState("");
    const [newColor, setNewColor] = useState("");
    const [newStock, setNewStock] = useState(0);
    const [newStatus, setNewStatus] = useState("Disponible");
    const [editingId, setEditingId] = useState(null);
    const [editingStatus, setEditingStatus] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [movementTonerId, setMovementTonerId] = useState(null);
    const [movementType, setMovementType] = useState("Entrada");
    const [movementQuantity, setMovementQuantity] = useState(1);
    const [movementNotes, setMovementNotes] = useState("");
    const [newTonerModelName, setNewTonerModelName] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const sortedToners = [...toners].sort((a, b) => a.id - b.id);

    const totalPages = Math.ceil(sortedToners.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedToners = sortedToners.slice(startIndex, endIndex);

    // Cargar datos iniciales
    const fetchAll = async () => {
        try {
            const data = await Toners.fetchAll();
            setToners(data);
        } catch (err) {
            console.error("Error al cargar toners:", err);
        }
    };

    const fetchLists = async () => {
        try {
            const pm = await Toners.fetchPrinterModels();
            const tm = await Toners.fetchTonerModels();
            const cl = await Toners.fetchColors();
            setPrinterModels(pm);
            setTonerModels(tm);
            setColors(cl);
        } catch (err) {
            console.error("Error al cargar listas:", err);
        }
    };

    useEffect(() => {
        fetchAll();
        fetchLists();
    }, []);

    // Agregar nuevo modelo de tóner
    const addTonerModel = async () => {
        if (!newTonerModelName.trim()) return;
        try {
            await Toners.createTonerModel({ name: newTonerModelName });
            setNewTonerModelName("");
            fetchLists(); // Refresca la lista de modelos
            showSuccess("Modelo de tóner agregado correctamente");
        } catch (err) {
            console.error("Error al agregar modelo de tóner:", err);
        }
    };

    // Agregar nuevo tóner (el resto igual)
    const addToner = async () => {
        if (!newPrinterModel || !newTonerModel || !newColor) return;
        try {
            await Toners.create({
                id_printer_model: Number(newPrinterModel),
                id_toner_model: Number(newTonerModel),
                id_color: Number(newColor),
                stock: Number(newStock),
                status: newStatus,
            });
            setNewPrinterModel("");
            setNewTonerModel("");
            setNewColor("");
            setNewStock(0);
            setNewStatus("Disponible");
            fetchAll();
            showSuccess("Tóner agregado correctamente");
        } catch (err) {
            console.error("Error al agregar tóner:", err);
        }
    };

    // Iniciar edición de status
    const startEdit = (id, status) => {
        setEditingId(id);
        setEditingStatus(status);
    };

    // Iniciar edición de status
    const editToner = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    // Guardar edición de status
    const saveToner = async (id) => {
        if (!editingStatus.trim()) return;
        try {
            await Toners.update(id, { status: editingStatus });
            setEditingId(null);
            setEditingStatus("");
            fetchAll();
            showSuccess("Tóner actualizado correctamente");
        } catch (err) {
            console.error("Error al actualizar tóner:", err);
        }
    };

    // Agregar movimiento
    const addMovement = async (id_toner) => {
        if (movementQuantity <= 0) return;
        try {
            await Toners.addMovement({
                id_toner,
                movement_type: movementType,
                quantity: movementQuantity,
                movement_date: new Date().toISOString(),
                id_user: 1, // Cambia esto por el ID real del usuario logueado
                notes: movementNotes,
            });
            setMovementTonerId(null);
            setMovementType("Entrada");
            setMovementQuantity(1);
            setMovementNotes("");
            fetchAll();
            showSuccess("Movimiento registrado correctamente");
        } catch (err) {
            console.error("Error al registrar movimiento:", err);
        }
    };

    // Mostrar mensaje de éxito
    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold">Gestión de tóners</h2>

            {successMessage && (
                <div className="p-2 mb-4 text-green-800 bg-green-200 rounded">
                    {successMessage}
                </div>
            )}

            {/* Agregar nuevo modelo de tóner */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newTonerModelName}
                    onChange={(e) => setNewTonerModelName(e.target.value)}
                    placeholder="Nuevo modelo de tóner (ej. TK-8337C)"
                    className="px-2 py-1 border rounded"
                />
                <button
                    onClick={addTonerModel}
                    className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    Agregar Modelo
                </button>
            </div>

            {/* Agregar nuevo tóner */}
            <div className="flex flex-col gap-2 mb-4">
                <label>Modelo de Impresora:</label>
                <select value={newPrinterModel} onChange={(e) => setNewPrinterModel(e.target.value)} className="px-2 py-1 border rounded">
                    <option value="">Selecciona</option>
                    {printerModels.map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                </select>
                <label>Modelo de Tóner:</label>
                <select value={newTonerModel} onChange={(e) => setNewTonerModel(e.target.value)} className="px-2 py-1 border rounded">
                    <option value="">Selecciona</option>
                    {tonerModels.map((tm) => (
                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                </select>
                <label>Color:</label>
                <select value={newColor} onChange={(e) => setNewColor(e.target.value)} className="px-2 py-1 border rounded">
                    <option value="">Selecciona</option>
                    {colors.map((cl) => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                </select>
                <label>Stock Inicial:</label>
                <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="px-2 py-1 border rounded"
                />
                <label>Estado:</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="px-2 py-1 border rounded">
                    <option value="Disponible">Disponible</option>
                    <option value="Agotado">Agotado</option>
                </select>
                <button
                    onClick={addToner}
                    className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                >
                    Agregar Tóner
                </button>
            </div>

            {/* Tabla */}
            <table className="w-full p-1 bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-1 border">#</th>
                        <th className="px-3 py-1 border">Impresora</th>
                        <th className="px-3 py-1 border">Modelo Tóner</th>
                        <th className="px-3 py-1 border">Color</th>
                        <th className="px-3 py-1 border">Stock</th>
                        <th className="px-3 py-1 border">Estado</th>
                        <th className="px-3 py-1 border">Última actualización</th>
                        <th className="px-3 py-1 text-center border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedToners.map((t, index) => (
                        <tr key={t.id}>
                            <td className="px-3 py-1 text-center border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="px-3 py-1 border">{t.printer_model}</td>
                            <td className="px-3 py-1 border">{t.toner_model}</td>
                            <td className="px-3 py-1 border">{t.color}</td>
                            <td className="px-3 py-1 border">{t.stock}</td>
                            <td className="px-3 py-1 border">
                                {editingId === t.id ? (
                                    <select
                                        value={editingStatus}
                                        onChange={(e) => setEditingStatus(e.target.value)}
                                        className="px-2 py-1 border rounded"
                                    >
                                        <option value="Disponible">Disponible</option>
                                        <option value="Agotado">Agotado</option>
                                    </select>
                                ) : (
                                    t.status
                                )}
                            </td>
                            <td className="px-3 py-1 border">
                                {t.last_update ? new Date(t.last_update).toLocaleString() : "-"}
                            </td>
                            <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                                {editingId === t.id ? (
                                    <ActionButton
                                        type={"save"}
                                        title="Guardar tóner"
                                        onClick={() => saveToner(t.id)}
                                    >
                                    </ActionButton>
                                ) : (
                                    <ActionButton
                                        type={"edit"}
                                        title="Editar tóner"
                                        onClick={() => editToner(t.id, t.name)}
                                    >
                                    </ActionButton>
                                )}
                                <ActionButton
                                    type={"refresh"}
                                    title="Recargar movimientos"
                                    onClick={() => addMovement(t.id, t.name)}
                                >
                                </ActionButton>
                            </td>
                        </tr>
                    ))}
                    {/* Formulario de movimiento (por fila, pero solo muestra si seleccionado) */}
                    {toners.map((t) => (
                        movementTonerId === t.id && (
                            <tr key={`movement-${t.id}`}>
                                <td colSpan="7" className="px-3 py-1 border">
                                    <div className="flex flex-col gap-2">
                                        <label>Tipo:</label>
                                        <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                                            <option value="Entrada">Entrada</option>
                                            <option value="Salida">Salida</option>
                                        </select>
                                        <label>Cantidad:</label>
                                        <input
                                            type="number"
                                            value={movementQuantity}
                                            onChange={(e) => setMovementQuantity(e.target.value)}
                                            className="px-2 py-1 border rounded"
                                        />
                                        <label>Notas:</label>
                                        <input
                                            type="text"
                                            value={movementNotes}
                                            onChange={(e) => setMovementNotes(e.target.value)}
                                            className="px-2 py-1 border rounded"
                                        />
                                        <button
                                            onClick={() => addMovement(t.id)}
                                            className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                                        >
                                            Registrar Movimiento
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
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