import React, { useEffect, useMemo, useState } from "react";

function ResolveIncidentModal({ id_incident, onClose, onConfirm }) {
    const [solutionText, setSolutionText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [incident, setIncident] = useState(null);
    const [loadingIncident, setLoadingIncident] = useState(true);
    const [incidentError, setIncidentError] = useState("");

    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        document.body.classList.add("no-scroll");
        return () => document.body.classList.remove("no-scroll");
    }, []);

    useEffect(() => {
        let alive = true;

        const loadIncident = async () => {
            try {
                setLoadingIncident(true);
                setIncidentError("");

                const token = localStorage.getItem("token");
                const res = await fetch(`/api/incidents/${id_incident}`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!res.ok) throw new Error("No se pudo cargar el detalle de la incidencia.");
                const data = await res.json();
                if (alive) setIncident(data);
            } catch (err) {
                console.error(err);
                if (alive) setIncidentError("No se pudo cargar el resumen de la incidencia.");
            } finally {
                if (alive) setLoadingIncident(false);
            }
        };

        if (id_incident) loadIncident();
        return () => {
            alive = false;
        };
    }, [id_incident]);

    const statusUI = useMemo(() => {
        const s = incident?.status || "Desconocido";
        if (s === "Pendiente") return { pill: "bg-yellow-50 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" };
        if (s === "Asignado a un técnico") return { pill: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-600" };
        if (s === "Resuelto") return { pill: "bg-green-50 text-green-800 border-green-200", dot: "bg-green-600" };
        return { pill: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-500" };
    }, [incident?.status]);

    const labelTitle = useMemo(() => {
        if (!incident) return "Incidencia";
        const cat = incident.category_name || "Incidencia";
        const ubi = incident.ubication_name ? ` · ${incident.ubication_name}` : "";
        return `${cat}${ubi}`;
    }, [incident]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!solutionText.trim()) {
            alert("Debe ingresar la solución aplicada.");
            return;
        }

        setShowConfirm(true);
    };

    const confirmResolve = async () => {
        try {
            setIsSubmitting(true);
            await onConfirm(solutionText);
            onClose();
        } catch (error) {
            console.error("Error al resolver la incidencia:", error);
            alert("Error al enviar la solución.");
        } finally {
            setIsSubmitting(false);
            setShowConfirm(false);
        }
    };


    const maxChars = 500;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/45">
            <div className="w-full max-w-3xl overflow-hidden bg-white shadow-2xl rounded-2xl ring-1 ring-black/5">
                {/* HEADER (más bajo) */}
                <div className="relative px-4 py-3 overflow-hidden text-white bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800">
                    <div className="absolute rounded-full w-44 h-44 -right-20 -top-20 bg-white/10 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/70">
                                Número de incidencia
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-lg font-extrabold tracking-tight">
                                    #{incident?.ticket_number || "—"}
                                </h3>
                                <span className="text-xs truncate text-white/70">{labelTitle}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!!incident?.status && (
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusUI.pill}`}
                                >
                                    <span className={`h-2 w-2 rounded-full ${statusUI.dot}`} />
                                    {incident.status}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-2.5 py-2 text-sm font-extrabold rounded-xl bg-white/10 hover:bg-white/15"
                                aria-label="Cerrar"
                                title="Cerrar"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {/* BODY con scroll interno (menos padding) */}
                <div className="max-h-[78vh] overflow-y-auto px-4 py-4">
                    {/* RESUMEN (más compacto) */}
                    <div className="p-3 mb-3 border rounded-2xl border-slate-100 bg-slate-50/70">
                        {loadingIncident ? (
                            <div className="space-y-2 animate-pulse">
                                <div className="h-3 rounded w-44 bg-slate-200" />
                                <div className="w-full h-2.5 rounded bg-slate-200" />
                                <div className="w-4/5 h-2.5 rounded bg-slate-200" />
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div className="rounded h-14 bg-slate-200" />
                                    <div className="rounded h-14 bg-slate-200" />
                                </div>
                            </div>
                        ) : incidentError ? (
                            <div className="p-2 text-xs font-semibold text-red-700 border border-red-200 rounded-xl bg-red-50">
                                {incidentError}
                            </div>
                        ) : !incident ? (
                            <p className="text-xs text-slate-600">No hay datos para mostrar.</p>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Resumen</p>

                                <div className="grid items-stretch grid-cols-1 gap-2 sm:grid-cols-3">
                                    <InfoCard icon="📍" label="Ubicación" title={incident.ubication_name || "—"} subtitle="" />
                                    <InfoCard icon="🏢" label="Departamento" title={incident.department_name || "—"} subtitle="" />
                                    <InfoCard icon="👤" label="Reportado por" title={incident.reporter_name || "—"} subtitle={incident.reporter_email || "—"} />
                                </div>

                                {(incident.other_category_detail || incident.description) && (
                                    <div className="p-3 bg-white shadow-sm rounded-xl ring-1 ring-slate-100">
                                        {incident.other_category_detail ? (
                                            <p className="text-xs text-slate-700">
                                                <span className="font-extrabold">Detalle:</span>{" "}
                                                <span className="font-medium">{incident.other_category_detail}</span>
                                            </p>
                                        ) : null}

                                        <p className={`${incident.other_category_detail ? "mt-1.5" : ""} text-xs text-slate-800`}>
                                            <span className="font-extrabold">Descripción:</span>{" "}
                                            <span className="font-medium">{incident.description || "—"}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SOLUCIÓN (más compacto) */}
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="flex items-end justify-between gap-2">
                            <div>
                                <label htmlFor="solutionText" className="block text-sm font-extrabold text-slate-900">
                                    Solución aplicada
                                </label>
                                <p className="mt-0.5 text-[11px] text-slate-600">
                                    Describe lo que hiciste (quedará guardado en el historial).
                                </p>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">
                                {solutionText.length}/{maxChars}
                            </span>
                        </div>

                        <textarea
                            id="solutionText"
                            className="w-full px-3 py-2.5 text-sm transition bg-white border shadow-sm outline-none resize-none rounded-2xl border-slate-200 text-slate-900 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                            rows="4"
                            maxLength={maxChars}
                            placeholder="Ej: Se realizó cambio de tóner y prueba de impresión."
                            value={solutionText}
                            onChange={(e) => setSolutionText(e.target.value)}
                            required
                        />

                        {/* Barra sticky (más delgada y sin -mx grande) */}
                        <div className="sticky bottom-0 mt-2 border-t bg-white/90 backdrop-blur rounded-b-2xl">
                            <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className={`rounded-xl px-3.5 py-2 text-sm font-extrabold text-white shadow-sm transition ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-slate-950 hover:bg-slate-900"
                                        }`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Resolviendo..." : "Resolver incidencia"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md p-5 bg-white shadow-xl rounded-2xl">
                        <h4 className="mb-3 text-lg font-extrabold text-slate-900">
                            Confirmar resolución
                        </h4>

                        <p className="mb-2 text-sm text-slate-700">
                            ¿Estás seguro de marcar esta incidencia como <strong>resuelta</strong> con la siguiente respuesta?
                        </p>

                        <div className="p-3 mb-4 text-xs border rounded-lg bg-slate-50 text-slate-800">
                            {solutionText}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm font-extrabold border rounded-xl border-slate-200 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={confirmResolve}
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-sm font-extrabold text-white rounded-xl ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-slate-950 hover:bg-slate-900"}`}
                            >
                                {isSubmitting ? "Confirmando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

function InfoCard({ icon, label, title, subtitle }) {
    return (
        <div className="p-3 bg-white shadow-sm rounded-2xl ring-1 ring-slate-100">
            <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-base">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-0.5 text-sm font-extrabold truncate text-slate-900">{title}</p>
                    {subtitle ? <p className="text-[11px] truncate text-slate-600">{subtitle}</p> : null}
                </div>
            </div>
        </div>
    );
}

export default ResolveIncidentModal;
