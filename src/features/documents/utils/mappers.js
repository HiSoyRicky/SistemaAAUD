// mappers.js
export const buildCreatePayload = (form) => ({
    ...form,
    id_doc_type: Number(form.id_doc_type),
    year: Number(form.year),
    id_origin: form.id_origin ? Number(form.id_origin) : null,
    document_date: form.document_date ? new Date(form.document_date).toISOString() : null,
    received_at: form.received_at ? new Date(form.received_at).toISOString() : null,
    sent_at: form.sent_at ? new Date(form.sent_at).toISOString() : null,
    closed_at: form.closed_at ? new Date(form.closed_at).toISOString() : null,
});

export const buildEditPayload = (editForm) => ({
    ...editForm,
    id_doc_type: Number(editForm.id_doc_type),
    year: Number(editForm.year),
    id_origin: editForm.id_origin ? Number(editForm.id_origin) : null,
    document_date: editForm.document_date ? new Date(editForm.document_date).toISOString() : null,
    received_at: editForm.received_at ? new Date(editForm.received_at).toISOString() : null,
    sent_at: editForm.sent_at ? new Date(editForm.sent_at).toISOString() : null,
    closed_at: editForm.closed_at ? new Date(editForm.closed_at).toISOString() : null,
});

export const indexDocsForSearch = (docs = []) =>
    docs.map((d) => ({
        ...d,
        _search: `${d.subject || ""} ${d.description || ""} ${d.observations || ""} ${d.doc_type_name || ""
            } ${d.origin_name || ""}`.toLowerCase(),
    }));
