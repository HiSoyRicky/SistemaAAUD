import React, { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import { Toners } from "@/services/api";
import ActionButton from "@/components/ui/ActionButton";

export default function TonersManager() {
    const [toners, setToners] = useState([]);
    const [models, setModels] = useState([]); // Cambiado de printerModels a models
    const [tonerModels, setTonerModels] = useState([]);
    const [colors, setColors] = useState([]);

    // Formulario de agregar tóner
    const [newPrinterModel, setNewPrinterModel] = useState("");
    const [newTonerModel, setNewTonerModel] = useState("");
    const [newColor, setNewColor] = useState("");
    const [newStock, setNewStock] = useState(0);
    const [newStatus, setNewStatus] = useState("Disponible");

    // Formulario de agregar modelo de tóner
    const [newTonerModelName, setNewTonerModelName] = useState("");

    // Edición
    const [editingId, setEditingId] = useState(null);
    const [editingStatus, setEditingStatus] = useState("");
    const [editingStock, setEditingStock] = useState(0);

    // Movimientos
    const [movementTonerId, setMovementTonerId] = useState(null);
    const [movementType, setMovementType] = useState("Entrada");
    const [movementQuantity, setMovementQuantity] = useState(1);
    const [movementNotes, setMovementNotes] = useState("");

    // Mensajes
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const sortedToners = [...toners].sort((a, b) => a.id - b.id);
    const totalPages = Math.ceil(sortedToners.length / itemsPerPage);
    const paginatedToners = sortedToners.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // === Cargar datos ===
    const fetchAll = async () => {
        try {
            const response = await Toners.fetchAll();
            setToners(Array.isArray(response) ? response : []);
        } catch (err) {
            console.error("Error al cargar toners:", err);
            setErrorMessage("Error al cargar tóneres");
        }
    };

    const fetchLists = async () => {
        try {

        } catch (err) {
            console.error("Error al cargar listas:", err);
        }
    };

    // Cargar modelos de impresora desde el inventario
    const fetchPrinterModels = async () => {
        try {
            const response = await fetch('/api/models'); // Ajusta según tu endpoint
            const data = await response.json();
            setModels(data.data || []);
        } catch (err) {
            console.error("Error al cargar modelos de impresora:", err);
        }
    };

    useEffect(() => {
        fetchAll();
        fetchLists();
        fetchPrinterModels();
    }, []);

    // === Funciones ===
    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setErrorMessage("");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const showError = (msg) => {
        setErrorMessage(msg);
        setSuccessMessage("");
        setTimeout(() => setErrorMessage(""), 5000);
    };

    const addToner = async () => {
        if (!newPrinterModel || !newTonerModel || !newColor) {
            showError("Por favor complete todos los campos requeridos");
            return;
        }

        try {
            await Toners.create({
                id_printer_model: Number(newPrinterModel),
                toner_model: newTonerModel,
                color: newColor,
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
            showError("Error al agregar tóner");
        }
    };

    const startEdit = (id, status, stock) => {
        setEditingId(id);
        setEditingStatus(status);
        setEditingStock(stock);
    };

    const saveToner = async (id) => {
        if (!editingStatus.trim()) {
            showError("El estado es requerido");
            return;
        }

        try {
            await Toners.update(id, {
                status: editingStatus,
                stock: editingStock
            });

            setEditingId(null);
            setEditingStatus("");
            setEditingStock(0);

            fetchAll();
            showSuccess("Tóner actualizado correctamente");
        } catch (err) {
            console.error("Error al actualizar tóner:", err);
            showError("Error al actualizar tóner");
        }
    };

    const deleteToner = async (id) => {
        if (!window.confirm("¿Está seguro de eliminar este tóner?")) return;

        try {
            await Toners.delete(id);
            fetchAll();
            showSuccess("Tóner eliminado correctamente");
        } catch (err) {
            console.error("Error al eliminar tóner:", err);
            showError("Error al eliminar tóner");
        }
    };

    const addMovement = async (id_toner) => {
        if (movementQuantity <= 0) {
            showError("La cantidad debe ser mayor a 0");
            return;
        }

        try {
            await Toners.addMovement({
                id_toner,
                movement_type: movementType,
                quantity: movementQuantity,
                id_user: 1, // Cambia por el ID real del usuario
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
            showError(err.response?.data?.message || "Error al registrar movimiento");
        }
    };

    // === Helpers ===
    const getPrinterModelName = (id) => models.find(m => m.id === id)?.name || "—";
    const getTonerModelName = (name) => name || "—";
    const getColorName = (name) => name || "—";

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Gestión de tóners</h2>

            {(successMessage || errorMessage) && (
                <div className={`p-2 mb-4 rounded ${successMessage ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {successMessage || errorMessage}
                </div>
            )}

            {/* === Formularios === */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Formulario Tóner */}
                <div className="p-4 bg-white rounded shadow">
                    <h3 className="mb-2 font-medium">Agregar Tóner</h3>
                    <div className="flex flex-col gap-2">
                        <select
                            value={newPrinterModel}
                            onChange={(e) => setNewPrinterModel(e.target.value)}
                            className="px-2 py-1 border rounded"
                        >
                            <option value="">Modelo de Impresora</option>
                            {models.map((model) => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>

                        <select
                            value={newTonerModel}
                            onChange={(e) => setNewTonerModel(e.target.value)}
                            className="px-2 py-1 border rounded"
                        >
                            <option value="">Modelo de Tóner</option>
                            {tonerModels.map((tm) => (
                                <option key={tm.id} value={tm.name}>{tm.name}</option>
                            ))}
                        </select>

                        <select
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="px-2 py-1 border rounded"
                        >
                            <option value="">Color</option>
                            {colors.map((cl) => (
                                <option key={cl.id} value={cl.name}>{cl.name}</option>
                            ))}
                        </select>

                        <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            placeholder="Stock inicial"
                            className="px-2 py-1 border rounded"
                        />

                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="px-2 py-1 border rounded"
                        >
                            <option value="Disponible">Disponible</option>
                            <option value="Agotado">Agotado</option>
                            <option value="En uso">En uso</option>
                        </select>

                        <button
                            onClick={addToner}
                            className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                        >
                            Agregar Tóner
                        </button>
                    </div>
                </div>
            </div>

            {/* === Tabla === */}
            <div className="p-4 bg-white rounded shadow">
                <table className="w-full text-sm border rounded">
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
                                <td className="px-3 py-1 text-center border">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </td>
                                <td className="px-3 py-1 border">{getPrinterModelName(t.id_printer_model)}</td>
                                <td className="px-3 py-1 border">{getTonerModelName(t.toner_model)}</td>
                                <td className="px-3 py-1 border">{getColorName(t.color)}</td>
                                <td className="px-3 py-1 border">{t.stock}</td>
                                <td className="px-3 py-1 border">
                                    {editingId === t.id ? (
                                        <div className="flex flex-col gap-1">
                                            <select
                                                value={editingStatus}
                                                onChange={(e) => setEditingStatus(e.target.value)}
                                                className="px-2 py-1 border rounded"
                                            >
                                                <option value="Disponible">Disponible</option>
                                                <option value="Agotado">Agotado</option>
                                                <option value="En uso">En uso</option>
                                            </select>
                                            <input
                                                type="number"
                                                value={editingStock}
                                                onChange={(e) => setEditingStock(e.target.value)}
                                                className="px-2 py-1 border rounded"
                                            />
                                        </div>
                                    ) : (
                                        t.status
                                    )}
                                </td>
                                <td className="px-3 py-1 border">
                                    {t.last_update ? new Date(t.last_update).toLocaleString() : "-"}
                                </td>
                                <td className="flex justify-center gap-2 px-3 py-1 border">
                                    {editingId === t.id ? (
                                        <div className="flex gap-1">
                                            <ActionButton
                                                type="save"
                                                title="Guardar"
                                                onClick={() => saveToner(t.id)}
                                            />
                                            <ActionButton
                                                type="cancel"
                                                title="Cancelar"
                                                onClick={() => setEditingId(null)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <ActionButton
                                                type="edit"
                                                title="Editar"
                                                onClick={() => startEdit(t.id, t.status, t.stock)}
                                            />
                                            <ActionButton
                                                type="trash"
                                                title="Eliminar"
                                                onClick={() => deleteToner(t.id)}
                                            />
                                        </div>
                                    )}
                                    <ActionButton
                                        type="refresh"
                                        title="Registrar movimiento"
                                        onClick={() => setMovementTonerId(movementTonerId === t.id ? null : t.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Formulario de movimientos */}
                {movementTonerId && (
                    <div className="p-3 mt-4 border rounded bg-gray-50">
                        <h4 className="font-medium">Registrar Movimiento</h4>
                        <div className="flex flex-col gap-2 mt-2">
                            <select
                                value={movementType}
                                onChange={(e) => setMovementType(e.target.value)}
                                className="px-2 py-1 border rounded"
                            >
                                <option value="Entrada">Entrada</option>
                                <option value="Salida">Salida</option>
                            </select>
                            <input
                                type="number"
                                value={movementQuantity}
                                onChange={(e) => setMovementQuantity(e.target.value)}
                                placeholder="Cantidad"
                                className="px-2 py-1 border rounded"
                            />
                            <input
                                type="text"
                                value={movementNotes}
                                onChange={(e) => setMovementNotes(e.target.value)}
                                placeholder="Notas"
                                className="px-2 py-1 border rounded"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => addMovement(movementTonerId)}
                                    className="px-3 py-1 text-white bg-purple-500 rounded hover:bg-purple-600"
                                >
                                    Guardar Movimiento
                                </button>
                                <button
                                    onClick={() => setMovementTonerId(null)}
                                    className="px-3 py-1 text-white bg-gray-500 rounded hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}