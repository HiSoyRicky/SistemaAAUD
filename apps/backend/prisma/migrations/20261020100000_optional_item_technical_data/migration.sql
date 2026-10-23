-- Datos técnicos (marca, modelo, serie) opcionales para bienes no tecnológicos
ALTER TABLE "inventory_item_devices"
  ALTER COLUMN "id_brand" DROP NOT NULL,
  ALTER COLUMN "id_model" DROP NOT NULL,
  ALTER COLUMN "serie" DROP NOT NULL;
