export const mapCreateBrandResponse = (brand) => ({
  success: true,
  message: 'Marca creada exitosamente',
  brand
});

export const mapUpdateBrandResponse = (brand) => ({
  success: true,
  message: 'Marca actualizada exitosamente',
  brand
});

export const mapDeleteBrandResponse = () => ({
  success: true,
  message: 'Marca eliminada correctamente'
});
