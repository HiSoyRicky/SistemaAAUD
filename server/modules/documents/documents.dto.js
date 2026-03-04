export const mapDocumentList = (documents) => {
  return documents.map((d) => ({
    id: d.id,
    id_ubication: d.id_ubication,
    ubication_name: d.ubications?.name ?? null,

    id_department: d.id_department,
    department_name: d.departments?.name ?? null,

    id_doc_type: d.id_doc_type,
    doc_type_name: d.doc_type?.name ?? null,

    id_origin: d.id_origin,
    origin_name: d.external_entities?.name ?? null,

    direction: d.direction,
    year: d.year,
    consecutive: d.consecutive,

    sent_by: d.sent_by,
    sent_to: d.sent_to,

    document_date: d.document_date,
    received_at: d.received_at,
    sent_at: d.sent_at,
    closed_at: d.closed_at,

    subject: d.subject,
    description: d.description,
    observations: d.observations,
    attachment: d.attachment,

    created_by: d.created_by,
    created_by_name: d.users?.nombre_completo ?? null,

    created_at: d.created_at,
    updated_at: d.updated_at
  }));
};

export const mapUploadResponse = (filename) => {
  return {
    filename,
    url: `/uploads/documents/${filename}`
  };
};
