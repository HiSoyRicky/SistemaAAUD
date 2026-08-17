// models.dto.js

export const mapGetAllModelsResponse = (models) => ({
  data: models,
});

export const mapGetPrintersResponse = (printers) => ({
  data: printers,
});

export const mapCreateModelResponse = (model) => ({
  success: true,
  message: 'Modelo creado exitosamente',
  model,
});

export const mapUpdateModelResponse = (model) => ({
  message: 'Modelo actualizado correctamente',
  model,
});

export const mapDeleteModelResponse = () => ({
  message: 'Modelo eliminado correctamente',
});
