-- Additive inventory general-asset structure.
-- Existing inventory rows remain NULL for the new fields.

CREATE TABLE "inventory_conditions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    CONSTRAINT "inventory_conditions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_conditions_name_key"
  ON "inventory_conditions" ("name");

CREATE TABLE "inventory_administrative_areas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    CONSTRAINT "inventory_administrative_areas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_administrative_areas_name_key"
  ON "inventory_administrative_areas" ("name");

ALTER TABLE "bd_inventory"
  ADD COLUMN "description" VARCHAR(255),
  ADD COLUMN "id_condition" INTEGER,
  ADD COLUMN "id_administrative_area" INTEGER;

CREATE INDEX "bd_inventory_id_condition_idx"
  ON "bd_inventory" ("id_condition");

CREATE INDEX "bd_inventory_id_administrative_area_idx"
  ON "bd_inventory" ("id_administrative_area");

ALTER TABLE "bd_inventory"
  ADD CONSTRAINT "fk_bd_inventory_condition"
  FOREIGN KEY ("id_condition") REFERENCES "inventory_conditions"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_bd_inventory_administrative_area"
  FOREIGN KEY ("id_administrative_area") REFERENCES "inventory_administrative_areas"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

INSERT INTO "inventory_conditions" ("name") VALUES
  ('NUEVO'),
  ('BUEN ESTADO'),
  ('REGULAR'),
  ('MAL ESTADO')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "inventory_administrative_areas" ("name") VALUES
  ('TECNOLOGÍA'),
  ('BIENES PATRIMONIALES')
ON CONFLICT ("name") DO NOTHING;
