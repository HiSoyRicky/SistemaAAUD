export const mapCreateModelResponse = (model) => ({
  success: true,
  message: 'Modelo creado exitosamente',
  model
});

export const mapUpdateModelResponse = (model) => ({
  message: 'Modelo actualizado correctamente',
  model
});

export const mapDeleteModelResponse = () => ({
  message: 'Modelo eliminado correctamente'
});
