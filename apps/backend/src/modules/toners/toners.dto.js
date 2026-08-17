// toner.dto.js

function mapTonerListItem(toner) {
  const stock = toner.stock?.quantity ?? 0;

  return {
    id: toner.id,
    color: toner.color,
    toner_model: toner.toner_model,
    brand: toner.models?.brands?.name ?? null,
    printer_model: toner.models?.name ?? null,
    stock,
    min_stock: toner.min_stock,
    low_stock: stock <= toner.min_stock,
  };
}

function mapCreatedTonerResponse(toner) {
  return {
    id: toner.id,
    message: 'Tóner creado correctamente',
  };
}

function mapUpdatedTonerResponse(toner) {
  return {
    message: 'Tóner actualizado',
    toner,
  };
}

function mapDeletedTonerResponse() {
  return {
    message: 'Tóner eliminado correctamente',
  };
}

export {
  mapCreatedTonerResponse,
  mapDeletedTonerResponse,
  mapTonerListItem,
  mapUpdatedTonerResponse,
};
