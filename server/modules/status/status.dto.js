export const mapCreateStatusResponse = (created) => {
  return {
    message: 'Estatus creado',
    created
  };
};

export const mapUpdateStatusResponse = (updated) => {
  return {
    message: 'Estado actualizado',
    updated
  };
};
