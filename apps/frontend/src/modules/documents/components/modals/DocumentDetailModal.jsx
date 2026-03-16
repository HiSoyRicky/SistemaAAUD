// DocumentDetailModal.jsx
import React from "react";
import { fmtDate, fmtDateTime } from "../../utils/formatters";
import { Documents } from "../../services/documents.api";

const Badge = ({ children, variant = "gray" }) => {
    const styles = {
        gray: "bg-gray-100 text-gray-800 border-gray-200",
        green: "bg-green-100 text-green-800 border-green-200",
        blue: "bg-blue-100 text-blue-800 border-blue-200",
        amber: "bg-amber-100 text-amber-800 border-amber-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs border rounded-full ${styles[variant] || styles.gray}`}>
            {children}
        </span>
    );
};

export default function DocumentDetailModal({
    selected,
    onClose,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    docTypes,
    entities,
    onSave,
}) {
    if (!selected) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 md:items-center">
            <div className="w-full max-w-3xl overflow-hidden bg-white shadow-2xl rounded-2xl">
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Documento #{selected.year}-{String(selected.consecutive ?? "").padStart(4, "0")}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {selected.doc_type_name || "—"} • {selected.department_name || "—"} • {selected.ubication_name || "—"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button className="px-3 py-2 text-sm text-white bg-black rounded-lg hover:opacity-90" onClick={() => setIsEditing(true)} type="button">
                                Editar
                            </button>
                        ) : (
                            <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50" onClick={() => setIsEditing(false)} type="button">
                                Volver
                            </button>
                        )}

                        <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50" onClick={onClose} type="button">
                            Cerrar
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {!isEditing ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={(selected.direction || "").toUpperCase() === "ENTRADA" ? "blue" : "amber"}>{selected.direction || "—"}</Badge>
                                {selected.attachment ? <Badge variant="green">Tiene PDF</Badge> : <Badge variant="gray">Sin PDF</Badge>}
                                <Badge variant="gray">ID: {selected.id}</Badge>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Asunto</div>
                                    <div className="font-medium">{selected.subject || "—"}</div>
                                </div>

                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Entidad externa</div>
                                    <div className="font-medium">{selected.origin_name || "—"}</div>
                                </div>

                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Enviado por</div>
                                    <div className="font-medium">{selected.sent_by || "—"}</div>
                                </div>

                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Enviado a</div>
                                    <div className="font-medium">{selected.sent_to || "—"}</div>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Fecha documento</div>
                                    <div className="font-medium">{fmtDate(selected.document_date)}</div>
                                </div>

                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Recibido</div>
                                    <div className="font-medium">{fmtDateTime(selected.received_at)}</div>
                                </div>

                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Enviado</div>
                                    <div className="font-medium">{fmtDateTime(selected.sent_at)}</div>
                                </div>

                                <div className="p-4 border rounded-xl">
                                    <div className="text-xs text-gray-500">Cerrado</div>
                                    <div className="font-medium">{fmtDateTime(selected.closed_at)}</div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-xl">
                                <div className="text-xs text-gray-500">Descripción</div>
                                <div className="mt-1 whitespace-pre-wrap">{selected.description || "—"}</div>
                            </div>

                            <div className="p-4 border rounded-xl">
                                <div className="text-xs text-gray-500">Observaciones</div>
                                <div className="mt-1 whitespace-pre-wrap">{selected.observations || "—"}</div>
                            </div>

                            {selected.attachment && (
                                <div className="flex items-center justify-between p-4 border rounded-xl">
                                    <div>
                                        <div className="text-xs text-gray-500">Adjunto</div>
                                        <div className="font-medium">PDF</div>
                                    </div>
                                    <a className="px-4 py-2 text-sm text-white bg-black rounded-lg hover:opacity-90" href={selected.attachment} target="_blank" rel="noreferrer">
                                        Abrir PDF
                                    </a>
                                </div>
                            )}
                        </>
                    ) : (
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSave();
                            }}
                        >
                            <div className="grid gap-3 md:grid-cols-3">
                                <div>
                                    <label className="block text-sm text-gray-700">Tipo documento *</label>
                                    <select className="w-full p-2 border rounded-lg" value={editForm?.id_doc_type ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, id_doc_type: e.target.value }))} required>
                                        <option value="">Seleccione...</option>
                                        {docTypes.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Dirección *</label>
                                    <select className="w-full p-2 border rounded-lg" value={editForm?.direction ?? "ENTRADA"} onChange={(e) => setEditForm((p) => ({ ...p, direction: e.target.value }))} required>
                                        <option value="ENTRADA">ENTRADA</option>
                                        <option value="SALIDA">SALIDA</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Año</label>
                                    <input className="w-full p-2 border rounded-lg" type="number" value={editForm?.year ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, year: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Origen (Entidad externa)</label>
                                    <select className="w-full p-2 border rounded-lg" value={editForm?.id_origin ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, id_origin: e.target.value }))}>
                                        <option value="">(Opcional)</option>
                                        {entities.map((x) => (
                                            <option key={x.id} value={x.id}>
                                                {x.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Enviado por</label>
                                    <input className="w-full p-2 border rounded-lg" value={editForm?.sent_by ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, sent_by: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Enviado a</label>
                                    <input className="w-full p-2 border rounded-lg" value={editForm?.sent_to ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, sent_to: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Fecha documento</label>
                                    <input className="w-full p-2 border rounded-lg" type="date" value={editForm?.document_date ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, document_date: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Recibido</label>
                                    <input className="w-full p-2 border rounded-lg" type="datetime-local" value={editForm?.received_at ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, received_at: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Enviado</label>
                                    <input className="w-full p-2 border rounded-lg" type="datetime-local" value={editForm?.sent_at ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, sent_at: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Cerrado</label>
                                    <input className="w-full p-2 border rounded-lg" type="datetime-local" value={editForm?.closed_at ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, closed_at: e.target.value }))} />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-700">Asunto</label>
                                    <input className="w-full p-2 border rounded-lg" value={editForm?.subject ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, subject: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700">Adjuntar PDF</label>
                                    <input
                                        className="w-full"
                                        type="file"
                                        accept="application/pdf"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const data = await Documents.uploadPdf(file);
                                            setEditForm((p) => ({ ...p, attachment: data.url }));
                                        }}
                                    />
                                    {editForm?.attachment ? (
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-green-600">PDF cargado ✅</p>
                                            <a className="text-xs text-blue-600 underline" href={editForm.attachment} target="_blank" rel="noreferrer">
                                                Ver
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-xs text-gray-500">Opcional. Máx 10MB.</p>
                                    )}
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-sm text-gray-700">Descripción</label>
                                    <textarea className="w-full p-2 border rounded-lg" rows={3} value={editForm?.description ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-sm text-gray-700">Observaciones</label>
                                    <textarea className="w-full p-2 border rounded-lg" rows={2} value={editForm?.observations ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, observations: e.target.value }))} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50" onClick={() => setIsEditing(false)}>
                                    Volver
                                </button>
                                <button className="px-4 py-2 text-sm text-white bg-black rounded-lg hover:opacity-90">Guardar cambios</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
