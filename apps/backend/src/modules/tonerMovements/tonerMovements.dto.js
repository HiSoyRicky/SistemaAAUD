function mapMovementsPaginatedResponse({ data, total, page, limit }) {
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

function mapCreateMovementResponse(movement) {
  return {
    message: 'Movimiento registrado correctamente',
    movement
  };
}

function mapUploadDocumentResponse(movement) {
  return {
    message: 'Documento subido correctamente',
    movement
  };
}

export { mapMovementsPaginatedResponse,
  mapCreateMovementResponse,
  mapUploadDocumentResponse };