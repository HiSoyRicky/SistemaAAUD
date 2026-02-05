// documents.api.js
import api from "@/shared/api/apiClient";

const Documents = {
    fetchAll: () => api.get("/api/documents").then(r => r.data),
    fetchDocTypes: () => api.get("/api/documents/doc-types").then(r => r.data),
    fetchExternalEntities: () => api.get("/api/documents/external-entities").then(r => r.data),

    create: (payload) => api.post("/api/documents", payload).then(r => r.data),
    update: (doc, payload) => {
        const { id, id_ubication, id_department, id_doc_type } = doc;
        return api
            .put(`/api/documents/${id}/${id_ubication}/${id_department}/${id_doc_type}`, payload)
            .then(r => r.data);
    },

    uploadDocumentPdf: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post("/api/documents/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }).then(r => r.data);
    },
};

export { Documents };
