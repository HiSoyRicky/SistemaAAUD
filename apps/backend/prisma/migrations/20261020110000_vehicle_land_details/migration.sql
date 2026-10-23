-- Campos descriptivos para vehículos y terrenos. Se agregan como opcionales
-- para que los bienes existentes sigan siendo válidos durante la migración gradual.
ALTER TABLE "inventory_item_vehicles"
  ADD COLUMN "make" VARCHAR(80),
  ADD COLUMN "model" VARCHAR(100),
  ADD COLUMN "model_year" INTEGER,
  ADD COLUMN "serial_number" VARCHAR(80);

ALTER TABLE "inventory_item_real_estate"
  ADD COLUMN "cadastral_number" VARCHAR(80);

