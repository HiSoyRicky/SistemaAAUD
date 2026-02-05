// DocumentForm.jsx
import React from "react";
import { Documents } from "@/features/documents/services/documents.api";

export default function DocumentForm({ form, setForm, onSubmit, docTypes, entities }) {
    const onChange = (k) => (ev) => setForm((p) => ({ ...p, [k]: ev.target.value }));

    return (
        <div className="bg-white border rounded-2xl">
            <div className="px-5 py-4 border-b">
                <h2 className="text-lg font-semibold">Crear documento</h2>
                <p className="text-sm text-gray-500">Completa los campos (los opcionales pueden ir en blanco).</p>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <div>
                        <label className="block text-sm text-gray-700">Tipo documento *</label>
                        <select className="w-full p-2 border rounded-lg" value={form.id_doc_type} onChange={onChange("id_doc_type")} required>
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
                        <select className="w-full p-2 border rounded-lg" value={form.direction} onChange={onChange("direction")} required>
                            <option value="ENTRADA">ENTRADA</option>
                            <option value="SALIDA">SALIDA</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Año</label>
                        <input className="w-full p-2 border rounded-lg" type="number" value={form.year} onChange={onChange("year")} />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Origen (Entidad externa)</label>
                        <select className="w-full p-2 border rounded-lg" value={form.id_origin} onChange={onChange("id_origin")}>
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
                        <input className="w-full p-2 border rounded-lg" value={form.sent_by} onChange={onChange("sent_by")} placeholder="Ej: Juan Pérez" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Enviado a</label>
                        <input className="w-full p-2 border rounded-lg" value={form.sent_to} onChange={onChange("sent_to")} placeholder="Ej: Dirección / Persona" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Fecha documento</label>
                        <input className="w-full p-2 border rounded-lg" type="date" value={form.document_date} onChange={onChange("document_date")} />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Recibido</label>
                        <input className="w-full p-2 border rounded-lg" type="datetime-local" value={form.received_at} onChange={onChange("received_at")} />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Enviado</label>
                        <input className="w-full p-2 border rounded-lg" type="datetime-local" value={form.sent_at} onChange={onChange("sent_at")} />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Cerrado</label>
                        <input className="w-full p-2 border rounded-lg" type="datetime-local" value={form.closed_at} onChange={onChange("closed_at")} />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-700">Asunto</label>
                        <input className="w-full p-2 border rounded-lg" value={form.subject} onChange={onChange("subject")} placeholder="Asunto del memo/documento" />
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
                                const data = await Documents(file);
                                setForm((p) => ({ ...p, attachment: data.url }));
                            }}
                        />

                        {form.attachment ? (
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-green-600">PDF cargado ✅</p>
                                <a className="text-xs text-blue-600 underline" href={form.attachment} target="_blank" rel="noreferrer">
                                    Ver
                                </a>
                            </div>
                        ) : (
                            <p className="mt-2 text-xs text-gray-500">Opcional. Máx 10MB.</p>
                        )}
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm text-gray-700">Descripción</label>
                        <textarea className="w-full p-2 border rounded-lg" rows={3} value={form.description} onChange={onChange("description")} />
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm text-gray-700">Observaciones</label>
                        <textarea className="w-full p-2 border rounded-lg" rows={2} value={form.observations} onChange={onChange("observations")} />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button className="px-4 py-2 text-white bg-black rounded-lg hover:opacity-90">Guardar</button>
                </div>
            </form>
        </div>
    );
}
