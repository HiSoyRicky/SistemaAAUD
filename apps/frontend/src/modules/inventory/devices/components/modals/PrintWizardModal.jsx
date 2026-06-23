import React, { useEffect, useMemo, useState } from "react";
import UbiDepSelector from "../../../../../shared/common/UbiDepSelector";

export default function PrintWizardModal({
    open,
    device,
    departments = [],
    authData,
    onClose,
    onPrint,
}) {
    const [docType, setDocType] = useState("transfer");
    const [step, setStep] = useState(1);
    const [localDevice, setLocalDevice] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setDocType("transfer");
        setStep(1);
        setLocalDevice(device ? { ...device } : null);
    }, [open, device]);

    // Cerrar con ESC
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const summary = useMemo(() => {
        if (!localDevice) return [];
        return [
            { label: "Marbete", value: localDevice.tag || "Sin número" },
            { label: "Equipo", value: localDevice.device_name || "Desconocido" },
            { label: "Marca / Modelo", value: `${localDevice.brand_name || "-"} ${localDevice.model_name || ""}`.trim() },
            { label: "Serie", value: localDevice.serie || "No especificada" },
            { label: "Ubicación actual", value: localDevice.ubication_name || "Sin ubicación" },
            { label: "Departamento", value: localDevice.department_name || "Sin departamento" },
            { label: "Usuario asignado", value: localDevice.userRecibe || "Sin asignar" },
        ];
    }, [localDevice]);

    const setRole = (role) => {
        const techName = authData?.name;
        setLocalDevice((prev) => ({
            ...prev,
            role,
            userTransfiere: role === "transfiere" ? techName : (prev?.userTransfiere || ""),
            userRecibe: role === "recibe" ? techName : (prev?.userRecibe || ""),
        }));
    };

    const canNext = () => {
        if (docType === "delete") return true;
        if (step === 2) return !!localDevice?.role;
        if (step === 3) return !!localDevice?.ubication_destino_id && !!localDevice?.department_destino_id;
        return true;
    };

    const next = () => {
        if (!canNext()) return;
        if (docType === "delete") return setStep(2);
        setStep((s) => Math.min(s + 1, 4));
    };

    const back = () => setStep((s) => Math.max(s - 1, 1));

    const handleConfirmPrint = async () => {
        if (!localDevice) return;

        try {
            setSubmitting(true);
            await onPrint?.({
                docType,
                payload: localDevice,
            });
        } catch (_error) {
            // El padre ya muestra la notificación correspondiente.
        } finally {
            setSubmitting(false);
        }
    };

    if (!open || !localDevice) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            {/* click afuera cierra */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-[81] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-4 border-b md:p-5">
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900 md:text-xl">
                            {docType === "transfer" ? "Asistente de impresión — Traslado" : "Asistente de impresión — Descarte"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Configura el documento paso a paso y luego imprime.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-5">
                    {/* Stepper */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {docType === "delete" ? (
                            <>
                                <StepPill n={1} active={step === 1} done={step > 1} label="Tipo" />
                                <StepPill n={2} active={step === 2} done={false} label="Resumen" />
                            </>
                        ) : (
                            <>
                                <StepPill n={1} active={step === 1} done={step > 1} label="Tipo" />
                                <StepPill n={2} active={step === 2} done={step > 2} label="Rol" />
                                <StepPill n={3} active={step === 3} done={step > 3} label="Destino" />
                                <StepPill n={4} active={step === 4} done={false} label="Resumen" />
                            </>
                        )}
                    </div>

                    <div className="p-4 border rounded-2xl bg-gray-50">
                        {/* Paso 1: tipo */}
                        {step === 1 && (
                            <div className="grid gap-3 md:grid-cols-2">
                                <DocTypeCard
                                    title="Traslado"
                                    desc="Genera documento de traslado y define destino y rol del técnico."
                                    icon="🔄"
                                    active={docType === "transfer"}
                                    variant="blue"
                                    onClick={() => setDocType("transfer")}
                                />
                                <DocTypeCard
                                    title="Descarte"
                                    desc="Genera documento de descarte del equipo seleccionado."
                                    icon="🗑️"
                                    active={docType === "delete"}
                                    variant="red"
                                    onClick={() => setDocType("delete")}
                                />
                            </div>
                        )}

                        {/* Paso 2: rol */}
                        {docType === "transfer" && step === 2 && (
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">Selecciona el rol del técnico</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <ChoiceCard
                                        title="Transfiere"
                                        desc="El técnico está entregando el equipo."
                                        icon="📤"
                                        active={localDevice.role === "transfiere"}
                                        onClick={() => setRole("transfiere")}
                                    />
                                    <ChoiceCard
                                        title="Recibe"
                                        desc="El técnico está recibiendo el equipo."
                                        icon="📥"
                                        active={localDevice.role === "recibe"}
                                        onClick={() => setRole("recibe")}
                                    />
                                </div>
                                {!localDevice.role && (
                                    <p className="text-xs text-red-600">Debes seleccionar un rol para continuar.</p>
                                )}
                            </div>
                        )}

                        {/* Paso 3: destino */}
                        {docType === "transfer" && step === 3 && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-4 bg-white border rounded-2xl">
                                    <div className="flex items-center justify-center w-10 h-10 text-indigo-700 bg-indigo-100 rounded-xl">
                                        📍
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">Destino</p>
                                        <p className="mt-1 text-xs text-gray-600">
                                            Selecciona la ubicación y el departamento a donde se trasladará el equipo.
                                        </p>

                                        <div className="mt-3">
                                            <UbiDepSelector
                                                id_ubication={localDevice.ubication_destino_id}
                                                id_department={localDevice.department_destino_id}
                                                departments={departments || []}
                                                onChange={({ id_ubication, id_department, ubication_name, department_name }) => {
                                                    setLocalDevice((prev) => ({
                                                        ...prev,
                                                        ubication_destino_id: id_ubication,
                                                        department_destino_id: id_department,
                                                        ubication_destino_name: ubication_name,
                                                        department_destino_name: department_name,
                                                    }));
                                                }}
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Usuario asignado
                                            </label>
                                            <input
                                                type="text"
                                                value={localDevice.userRecibe || ""}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setLocalDevice((prev) => ({
                                                        ...prev,
                                                        userRecibe: value,
                                                    }));
                                                }}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                                                placeholder="Nombre completo de la persona que recibirá el equipo"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Este dato se guarda en el traslado y queda visible en el historial.
                                            </p>
                                        </div>

                                        {(!localDevice.ubication_destino_id || !localDevice.department_destino_id) && (
                                            <p className="mt-2 text-xs text-red-600">
                                                Selecciona ubicación y departamento para continuar.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resumen */}
                        {((docType === "transfer" && step === 4) || (docType === "delete" && step === 2)) && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-4 bg-white border rounded-2xl">
                                    <div className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-100 rounded-xl">
                                        🧾
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">Resumen</p>
                                        <p className="mt-1 text-xs text-gray-600">Verifica la información antes de imprimir.</p>

                                        <div className="p-3 mt-3 border rounded-xl bg-gray-50">
                                            <ul className="grid gap-2 text-sm text-gray-800 md:grid-cols-2">
                                                {summary.map((row) => (
                                                    <li key={row.label} className="flex justify-between gap-3">
                                                        <span className="font-medium text-gray-600">{row.label}:</span>
                                                        <span className="text-right">{row.value}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {docType === "transfer" && (
                                                <div className="p-3 mt-3 text-sm text-blue-900 border border-blue-100 rounded-xl bg-blue-50">
                                                    <div className="font-semibold">Detalle del traslado</div>
                                                    <div className="mt-1 text-blue-800/90">
                                                        <span className="font-medium">Ubicación destino:</span> {localDevice.ubication_destino_name || "-"}
                                                    </div>
                                                    <div className="mt-1 text-blue-800/90">
                                                        <span className="font-medium">Departamento destino:</span> {localDevice.department_destino_name || "-"}
                                                    </div>
                                                    <div className="mt-1 text-blue-800/90">
                                                        <span className="font-medium">Usuario asignado:</span> {localDevice.userRecibe || "-"}
                                                    </div>
                                                    <div className="mt-2 text-blue-800/90">
                                                        <span className="font-medium">Rol técnico:</span>{" "}
                                                        {localDevice.role === "transfiere" ? "Transfiere" : "Recibe"}
                                                    </div>
                                                </div>
                                            )}

                                            {docType === "delete" && (
                                                <div className="p-3 mt-3 text-sm text-red-900 border border-red-100 rounded-xl bg-red-50">
                                                    <div className="font-semibold">Documento de descarte</div>
                                                    <div className="mt-1 text-red-800/90">
                                                        Confirma que este equipo está listo para proceso de descarte.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-between gap-3 mt-4">
                        <button
                            type="button"
                            onClick={back}
                            disabled={step === 1 || submitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                            Atrás
                        </button>

                        <div className="flex items-center gap-2">
                            {((docType === "delete" && step === 1) || (docType === "transfer" && step < 4)) && (
                                <button
                                    type="button"
                                    onClick={next}
                                    disabled={!canNext() || submitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            )}

                            {((docType === "delete" && step === 2) || (docType === "transfer" && step === 4)) && (
                                <button
                                    type="button"
                                    onClick={handleConfirmPrint}
                                    disabled={submitting}
                                    className={[
                                        "rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60",
                                        docType === "transfer" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700",
                                    ].join(" ")}
                                >
                                    {submitting ? "Procesando..." : (docType === "transfer" ? "Imprimir traslado" : "Imprimir descarte")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- UI helpers ---------- */

function StepPill({ n, active, done, label }) {
    return (
        <div className="flex items-center gap-2">
            <div
                className={[
                    "h-7 w-7 rounded-full grid place-items-center text-xs font-bold",
                    active ? "bg-blue-600 text-white" : done ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700",
                ].join(" ")}
            >
                {n}
            </div>
            <span className={["text-xs md:text-sm", active ? "text-gray-900 font-semibold" : "text-gray-600"].join(" ")}>
                {label}
            </span>
        </div>
    );
}

function DocTypeCard({ title, desc, icon, active, variant = "blue", onClick }) {
    const activeClasses =
        variant === "blue"
            ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-400/30"
            : "border-red-500 bg-red-50 shadow-md ring-2 ring-red-400/30";

    const hoverClasses =
        variant === "blue"
            ? "hover:border-blue-300 hover:bg-blue-50/50"
            : "hover:border-red-300 hover:bg-red-50/50";

    const iconClasses =
        variant === "blue"
            ? active ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white"
            : active ? "bg-red-600 text-white" : "bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white";

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200",
                active ? activeClasses : `border-gray-200 bg-white ${hoverClasses} hover:shadow-sm`,
            ].join(" ")}
        >
            {active && (
                <span
                    className={[
                        "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow",
                        variant === "blue" ? "bg-blue-600" : "bg-red-600",
                    ].join(" ")}
                >
                    ✓ Seleccionado
                </span>
            )}

            <div className="flex items-start gap-4">
                <div className={["flex h-11 w-11 items-center justify-center rounded-xl transition", iconClasses].join(" ")}>
                    {icon}
                </div>

                <div className="flex-1">
                    <div className="text-base font-extrabold text-gray-900">{title}</div>
                    <div className="mt-1 text-sm text-gray-700">{desc}</div>

                    <div
                        className={[
                            "mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            active ? (variant === "blue" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800") : "bg-gray-100 text-gray-700",
                        ].join(" ")}
                    >
                        {active ? "Seleccionado" : "Selecciona para continuar"}
                    </div>
                </div>
            </div>
        </button>
    );
}

function ChoiceCard({ title, desc, icon, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "group relative rounded-2xl border p-5 text-left transition-all duration-200",
                active
                    ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-400/30"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm",
            ].join(" ")}
        >
            {active && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                    ✓ Seleccionado
                </span>
            )}

            <div className="flex items-start gap-4">
                <div
                    className={[
                        "flex h-11 w-11 items-center justify-center rounded-xl transition",
                        active ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
                    ].join(" ")}
                >
                    {icon}
                </div>

                <div className="flex-1">
                    <div className="text-base font-extrabold text-gray-900">{title}</div>
                    <div className="mt-1 text-sm text-gray-700">{desc}</div>
                </div>
            </div>
        </button>
    );
}
