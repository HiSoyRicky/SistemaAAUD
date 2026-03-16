import React, { useEffect, useState } from "react";
import { Toners } from "../services/toners.api";
import Pagination from "../../../../shared/components/ui/Pagination";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../../app/providers/NotificationContext";
import { Eye, Paperclip } from "lucide-react";

function TonerMovementsPage() {

    const [movements, setMovements] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [uploadingMovementId, setUploadingMovementId] = useState(null);

    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const loadMovements = async () => {
        try {
            setLoading(true);

            const res = await Toners.fetchMovements({
                page: currentPage,
                search,
            });

            setMovements(res.data);
            setTotalPages(res.totalPages);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMovements();
    }, [currentPage, search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Traducción de los movimientos
    const movementLabels = {
        IN: "Entrada",
        OUT: "Salida",
        ADJUSTMENT: "Ajuste",
    };

    // Formateo de fecha y hora
    const formatDatePart = (date) => {
        return new Date(date).toLocaleDateString("es-PA");
    };

    const formatTimePart = (date) => {
        return new Date(date).toLocaleTimeString("es-PA", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const handleUpload = async (e, movementId) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingMovementId(movementId);
            const formData = new FormData();
            formData.append("document", file);

            await Toners.uploadDocument(movementId, formData);
            addNotification("Documento firmado adjuntado ✅", "success");
            await loadMovements();
        } catch (error) {
            addNotification(
                error.response?.data?.message || "No se pudo adjuntar el documento ❌",
                "error"
            );
        } finally {
            setUploadingMovementId(null);
            e.target.value = "";
        }
    };

    if (loading) return <p className="p-6">Cargando historial...</p>;

    return (
        <div className="p-6 space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
                ← Volver
            </button>

            <h1 className="text-2xl font-bold">
                Historial Global de Movimientos
            </h1>

            <input
                type="text"
                placeholder="Buscar por modelo de tóner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded w-72"
            />

            <div className="bg-white rounded shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-center">Fecha</th>
                            <th className="px-3 py-2 text-center">Tóner</th>
                            <th className="px-3 py-2 text-center">Tipo</th>
                            <th className="px-3 py-2 text-center">Cantidad</th>
                            <th className="px-3 py-2 text-center">Ubicación</th>
                            <th className="px-3 py-2 text-center">Departamento</th>
                            <th className="px-3 py-2 text-center">Nota</th>
                            <th className="px-3 py-2 text-center">Stock Ant.</th>
                            <th className="px-3 py-2 text-center">Stock Nuevo</th>
                            <th className="px-3 py-2 text-center">Entregó</th>
                            <th className="px-3 py-2 text-center">Retiró</th>
                            <th className="px-3 py-2 text-center">Documento Firmado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map((m) => (
                            <tr key={m.id} className="border-t">
                                <td className="px-3 py-2 text-center border">
                                    <div className="flex flex-col">
                                        <span>{formatDatePart(m.created_at)}</span>
                                        <span className="text-xs text-gray-400">
                                            {formatTimePart(m.created_at)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.toner?.toner_model}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {movementLabels[m.movement_type] || m.movement_type}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.quantity}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.ubication?.name || "-"}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.department?.name || "-"}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.reference || "-"}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.previous_stock}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.new_stock}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.user?.nombre_completo || "-"}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.receiver_name || "-"}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {m.signed_document && (
                                        <a
                                            href={`/uploads/documents/${m.signed_document}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 mr-2 text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
                                        >
                                            <Eye size={14} />
                                            Ver
                                        </a>
                                    )}

                                    {!m.signed_document && m.movement_type === "OUT" && (
                                        <label className="inline-flex items-center gap-1 px-2 py-1 text-indigo-700 border border-indigo-300 rounded cursor-pointer hover:bg-indigo-50">
                                            <Paperclip size={14} />
                                            {uploadingMovementId === m.id ? "Subiendo..." : "Adjuntar"}
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                className="hidden"
                                                disabled={uploadingMovementId === m.id}
                                                onChange={(e) => handleUpload(e, m.id)}
                                            />
                                        </label>
                                    )}

                                    {!m.signed_document && m.movement_type !== "OUT" && "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

        </div>
    );
}

export default TonerMovementsPage;
