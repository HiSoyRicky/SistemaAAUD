import React, { useEffect, useState } from "react";
import { Toners } from "../../services/api";
import { Edit } from "lucide-react";

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
    const [newTonerModelName, setNewTonerModelName] = useState(""); // Nuevo estado para nombre de modelo

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
            <h2 className="text-xl font-semibold mb-4">Gestión de tóners</h2>

            {successMessage && (
                <div className="mb-4 p-2 bg-green-200 text-green-800 rounded">
                    {successMessage}
                </div>
            )}

            {/* Agregar nuevo modelo de tóner */}
            <div className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={newTonerModelName}
                    onChange={(e) => setNewTonerModelName(e.target.value)}
                    placeholder="Nuevo modelo de tóner (ej. TK-8337C)"
                    className="border rounded px-2 py-1"
                />
                <button
                    onClick={addTonerModel}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Agregar Modelo
                </button>
            </div>

            {/* Agregar nuevo tóner */}
            <div className="mb-4 flex flex-col gap-2">
                <label>Modelo de Impresora:</label>
                <select value={newPrinterModel} onChange={(e) => setNewPrinterModel(e.target.value)} className="border rounded px-2 py-1">
                    <option value="">Selecciona</option>
                    {printerModels.map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                </select>
                <label>Modelo de Tóner:</label>
                <select value={newTonerModel} onChange={(e) => setNewTonerModel(e.target.value)} className="border rounded px-2 py-1">
                    <option value="">Selecciona</option>
                    {tonerModels.map((tm) => (
                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                </select>
                <label>Color:</label>
                <select value={newColor} onChange={(e) => setNewColor(e.target.value)} className="border rounded px-2 py-1">
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
                    className="border rounded px-2 py-1"
                />
                <label>Estado:</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="border rounded px-2 py-1">
                    <option value="Disponible">Disponible</option>
                    <option value="Agotado">Agotado</option>
                </select>
                <button
                    onClick={addToner}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Agregar Tóner
                </button>
            </div>

            {/* Tabla */}
            <table className="bg-white rounded-lg shadow-md p-1 w-full">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-3 py-1">Impresora</th>
                        <th className="border px-3 py-1">Modelo Tóner</th>
                        <th className="border px-3 py-1">Color</th>
                        <th className="border px-3 py-1">Stock</th>
                        <th className="border px-3 py-1">Estado</th>
                        <th className="border px-3 py-1">Última actualización</th>
                        <th className="border px-3 py-1 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {toners.map((t) => (
                        <tr key={t.id}>
                            <td className="border px-3 py-1">{t.printer_model}</td>
                            <td className="border px-3 py-1">{t.toner_model}</td>
                            <td className="border px-3 py-1">{t.color}</td>
                            <td className="border px-3 py-1">{t.stock}</td>
                            <td className="border px-3 py-1">
                                {editingId === t.id ? (
                                    <select
                                        value={editingStatus}
                                        onChange={(e) => setEditingStatus(e.target.value)}
                                        className="border rounded px-2 py-1"
                                    >
                                        <option value="Disponible">Disponible</option>
                                        <option value="Agotado">Agotado</option>
                                    </select>
                                ) : (
                                    t.status
                                )}
                            </td>
                            <td className="border px-3 py-1">
                                {t.last_update ? new Date(t.last_update).toLocaleString() : "-"}
                            </td>
                            <td className="border px-3 py-1 text-center flex justify-center gap-2">
                                {editingId === t.id ? (
                                    <button
                                        onClick={() => saveToner(t.id)}
                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Guardar
                                    </button>
                                ) : (
                                    <button onClick={() => editToner(t)} title="Editar tóner">
                                        <Edit className="w-5 h-5 text-yellow-500" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setMovementTonerId(movementTonerId === t.id ? null : t.id)}
                                    className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                                >
                                    Movimiento
                                </button>
                            </td>
                        </tr>
                    ))}
                    {/* Formulario de movimiento (por fila, pero solo muestra si seleccionado) */}
                    {toners.map((t) => (
                        movementTonerId === t.id && (
                            <tr key={`movement-${t.id}`}>
                                <td colSpan="7" className="border px-3 py-1">
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
                                            className="border rounded px-2 py-1"
                                        />
                                        <label>Notas:</label>
                                        <input
                                            type="text"
                                            value={movementNotes}
                                            onChange={(e) => setMovementNotes(e.target.value)}
                                            className="border rounded px-2 py-1"
                                        />
                                        <button
                                            onClick={() => addMovement(t.id)}
                                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
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
        </div>
    );
}