// src/modules/documents/pages/DocumentsPage.jsx
import React from "react";
import useAuth from "../../../shared/hooks/useAuth";
import { Documents } from "../services/documents.api";

import DocumentsStats from "../components/DocumentsStats";
import DocumentForm from "../components/forms/DocumentForm";
import DocumentsFilters from "../components/filters/DocumentsFilters";
import DocumentsTable from "../components/tables/DocumentsTable";
import DocumentDetailModal from "../components/modals/DocumentDetailModal";

import { toDateInput, toDateTimeLocalInput } from "../utils/formatters";
import { buildCreatePayload, buildEditPayload, indexDocsForSearch } from "../utils/mappers";

export default function DocumentsPage() {
    const { loggedUserId } = useAuth();

    const [docs, setDocs] = React.useState([]);
    const [docTypes, setDocTypes] = React.useState([]);
    const [entities, setEntities] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const [selected, setSelected] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState(null);

    const [q, setQ] = React.useState("");
    const [fYear, setFYear] = React.useState("");
    const [fDirection, setFDirection] = React.useState("");
    const [fDocType, setFDocType] = React.useState("");
    const [fOrigin, setFOrigin] = React.useState("");

    const [form, setForm] = React.useState({
        id_doc_type: "",
        direction: "ENTRADA",
        year: new Date().getFullYear(),
        id_origin: "",
        sent_by: "",
        sent_to: "",
        document_date: "",
        received_at: "",
        sent_at: "",
        closed_at: "",
        subject: "",
        description: "",
        observations: "",
        attachment: "",
    });

    const loadAll = async () => {
        setLoading(true);
        try {
            const [d, t, e] = await Promise.all([
                Documents.fetchAll(),
                Documents.fetchDocTypes(),
                Documents.fetchExternalEntities(),
            ]);
            setDocs(d || []);
            setDocTypes(t || []);
            setEntities(e || []);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadAll();
        setSelected(null);
        setIsEditing(false);
        setEditForm(null);
    }, [loggedUserId]);

    const years = React.useMemo(() => {
        return Array.from(new Set((docs || []).map((d) => d.year).filter(Boolean))).sort((a, b) => b - a);
    }, [docs]);

    const stats = React.useMemo(() => {
        const total = docs.length;
        const entrada = docs.filter((d) => (d.direction || "").toUpperCase() === "ENTRADA").length;
        const salida = docs.filter((d) => (d.direction || "").toUpperCase() === "SALIDA").length;
        const withPdf = docs.filter((d) => !!d.attachment).length;
        return { total, entrada, salida, withPdf };
    }, [docs]);

    const docsIndexed = React.useMemo(() => indexDocsForSearch(docs), [docs]);

    const filtered = React.useMemo(() => {
        const qq = q.trim().toLowerCase();

        return docsIndexed.filter((d) => {
            const matchesQ = !qq || (d._search || "").includes(qq);
            const matchesYear = !fYear || String(d.year) === String(fYear);
            const matchesDir = !fDirection || String(d.direction || "") === String(fDirection);
            const matchesType = !fDocType || String(d.id_doc_type) === String(fDocType);
            const matchesOrigin = !fOrigin || String(d.id_origin) === String(fOrigin);

            return matchesQ && matchesYear && matchesDir && matchesType && matchesOrigin;
        });
    }, [docsIndexed, q, fYear, fDirection, fDocType, fOrigin]);

    const onSubmitCreate = async (e) => {
        e.preventDefault();
        const payload = buildCreatePayload(form);

        await Documents.create(payload);
        await loadAll();

        setForm((p) => ({
            ...p,
            subject: "",
            description: "",
            observations: "",
            attachment: "",
            sent_by: "",
            sent_to: "",
            document_date: "",
            received_at: "",
            sent_at: "",
            closed_at: "",
        }));

        alert("Documento creado ✅");
    };

    const openDetail = (d) => {
        setSelected(d);
        setIsEditing(false);

        setEditForm({
            id_doc_type: d.id_doc_type ?? "",
            direction: d.direction ?? "ENTRADA",
            year: d.year ?? new Date().getFullYear(),
            id_origin: d.id_origin ?? "",
            sent_by: d.sent_by ?? "",
            sent_to: d.sent_to ?? "",
            subject: d.subject ?? "",
            description: d.description ?? "",
            observations: d.observations ?? "",
            attachment: d.attachment ?? "",
            document_date: toDateInput(d.document_date),
            received_at: toDateTimeLocalInput(d.received_at),
            sent_at: toDateTimeLocalInput(d.sent_at),
            closed_at: toDateTimeLocalInput(d.closed_at),
        });
    };

    const saveEdit = async () => {
        const payload = buildEditPayload(editForm);
        await Documents.update(selected.id, payload); // 👈 importante: pasa ID (no el objeto entero)
        await loadAll();

        // refrescar selected con la data nueva
        setSelected((prev) => (docs || []).find((x) => x.id === prev?.id) || prev);

        setIsEditing(false);
        alert("Documento actualizado ✅");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Mensajería</h1>
                </div>

                <div className="flex items-center gap-2">
                    {loading && <span className="text-sm text-gray-500">cargando...</span>}
                    <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50" onClick={loadAll} type="button">
                        Recargar
                    </button>
                </div>
            </div>

            <DocumentsStats stats={stats} />

            <DocumentForm form={form} setForm={setForm} onSubmit={onSubmitCreate} docTypes={docTypes} entities={entities} />

            <DocumentsFilters
                q={q}
                setQ={setQ}
                years={years}
                fYear={fYear}
                setFYear={setFYear}
                fDirection={fDirection}
                setFDirection={setFDirection}
                docTypes={docTypes}
                fDocType={fDocType}
                setFDocType={setFDocType}
                entities={entities}
                fOrigin={fOrigin}
                setFOrigin={setFOrigin}
                onClear={() => {
                    setQ("");
                    setFYear("");
                    setFDirection("");
                    setFDocType("");
                    setFOrigin("");
                }}
            />

            <DocumentsTable
                filtered={filtered}
                loading={loading}
                onDetail={openDetail}
            />

            <DocumentDetailModal
                selected={selected}
                onClose={() => {
                    setSelected(null);
                    setIsEditing(false);
                    setEditForm(null);
                }}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                editForm={editForm}
                setEditForm={setEditForm}
                docTypes={docTypes}
                entities={entities}
                onSave={saveEdit}
            />
        </div>
    );
}