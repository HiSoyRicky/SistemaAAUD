//TonerMovementsModal.jsx

import React, { useEffect, useRef, useState } from "react";
import UbiDepSelector from "@/shared/common/UbiDepSelector";
import { Toners } from "@/features/inventory/toners/services/toners.api";
import { useNotifications } from "@/app/providers/NotificationContext";
import TonerDeliveryPrint from "@/shared/components/Print/TonerDeliveryPrint";
import { useReactToPrint } from "react-to-print";
import { Package, ArrowRightLeft, X } from "lucide-react";

function TonerMovementModal({ toner, onClose, onSuccess }) {
    const { addNotification } = useNotifications();

    const [movementType, setMovementType] = useState("IN");
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedUbication, setSelectedUbication] = useState(null);
    const [loading, setLoading] = useState(false);

    const [receiverName, setReceiverName] = useState("");
    const [movementForPrint, setMovementForPrint] = useState(null);
    const [pendingPrint, setPendingPrint] = useState(false);
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Entrega de tóner",
        onAfterPrint: () => {
            setMovementForPrint(null);
            onSuccess?.();
            onClose?.();
        },
        onPrintError: () => {
            setMovementForPrint(null);
            addNotification("No se pudo iniciar la impresión ❌", "error");
            onSuccess?.();
            onClose?.();
        },
    });

    useEffect(() => {
        if (!pendingPrint || !movementForPrint) return;

        handlePrint();
        setPendingPrint(false);
    }, [pendingPrint, movementForPrint, handlePrint]);

    const handleMovement = async () => {
        if (Number(quantity) <= 0) {
            addNotification("La cantidad debe ser mayor a 0 ❌", "error");
            return;
        }

        if (movementType === "OUT") {
            if (!selectedUbication || !selectedDepartment) {
                addNotification("Debe seleccionar ubicación y departamento ❌", "error");
                return;
            }

            if (!receiverName.trim()) {
                addNotification("Debe indicar quién retira el tóner ❌", "error");
                return;
            }
        }

        if (movementType === "ADJUSTMENT" && !notes.trim()) {
            addNotification("Debe indicar motivo del ajuste ❌", "error");
            return;
        }

        try {
            setLoading(true);

            const res = await Toners.addMovement({
                id_toner: toner.id,
                movement_type: movementType,
                quantity: Number(quantity),
                id_department:
                    movementType === "OUT" ? Number(selectedDepartment) : null,
                id_ubication:
                    movementType === "OUT" ? Number(selectedUbication) : null,
                reference: notes,
                
                receiver_name: movementType === "OUT" ? receiverName.trim() : null,
            });

            addNotification("Movimiento registrado ✅", "success");

            if (movementType === "OUT" && res?.movement) {
                setMovementForPrint(res.movement);
                setPendingPrint(true);
                return;
            }

            onSuccess?.();
            onClose?.();
        } catch (error) {
            addNotification(
                error.response?.data?.message || "Error al registrar movimiento ❌",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const isOut = movementType === "OUT";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-[620px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">
                                Movimiento de Tóner
                            </h2>
                            <p className="text-sm text-gray-500">
                                {toner?.toner_model} • Stock actual:{" "}
                                <span className="font-semibold text-gray-800">
                                    {toner?.stock}
                                </span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1 transition rounded-md hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">

                    {/* Tipo de movimiento */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Tipo de Movimiento
                        </label>

                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setMovementType("IN")}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition ${movementType === "IN"
                                    ? "bg-green-50 border-green-400 text-green-700"
                                    : "border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <ArrowRightLeft size={16} />
                                Entrada
                            </button>

                            <button
                                type="button"
                                onClick={() => setMovementType("OUT")}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition ${movementType === "OUT"
                                    ? "bg-red-50 border-red-400 text-red-700"
                                    : "border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <ArrowRightLeft size={16} />
                                Salida
                            </button>

                            <button
                                type="button"
                                onClick={() => setMovementType("ADJUSTMENT")}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition ${movementType === "ADJUSTMENT"
                                    ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                                    : "border-gray-300 hover:bg-gray-50"
                                    }`}

                            >
                                Ajuste
                            </button>
                        </div>
                    </div>

                    {/* Ubicación y Departamento */}
                    {isOut && (
                        <div className="pt-2">
                            <h3 className="mb-2 text-sm font-semibold text-gray-700">
                                Destino del Tóner
                            </h3>
                            <UbiDepSelector
                                id_ubication={selectedUbication}
                                id_department={selectedDepartment}
                                onChange={({ id_ubication, id_department }) => {
                                    setSelectedUbication(id_ubication);
                                    setSelectedDepartment(id_department);
                                }}
                                errors={{}}
                                mode="inventory"
                            />
                        </div>
                    )}

                    {/* Cantidad */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Cantidad
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full px-4 py-2 transition border rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            placeholder="Ingrese cantidad"
                        />
                    </div>

                    {isOut && (
                        <div>
                            <label className="block mb-2 text-sm font-medium">
                                Nombre de quien retira
                            </label>
                            <input
                                type="text"
                                value={receiverName}
                                onChange={(e) => setReceiverName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>
                    )}

                    {/* Notas */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Referencia / Notas
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 transition border rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            placeholder="Ej: Incidencia #123, reposición mensual, ajuste manual..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 transition bg-white border rounded-lg hover:bg-gray-100"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleMovement}
                        disabled={loading}
                        className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition ${loading
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {loading ? "Guardando..." : "Guardar Movimiento"}
                    </button>
                </div>
            </div>

            {movementForPrint && (
                <div style={{ display: "none" }}>
                    <TonerDeliveryPrint
                        ref={printRef}
                        movement={movementForPrint}
                        fecha={
                            movementForPrint.created_at
                                ? new Date(movementForPrint.created_at).toLocaleDateString("es-PA")
                                : new Date().toLocaleDateString("es-PA")
                        }
                    />
                </div>
            )}
        </div>
    );
}

export default TonerMovementModal;
