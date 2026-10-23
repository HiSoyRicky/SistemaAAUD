CREATE TABLE "inventory_vehicle_catalog" (
    "id" SERIAL NOT NULL,
    "id_brand" INTEGER NOT NULL,
    "id_model" INTEGER NOT NULL,
    "model_year" INTEGER NOT NULL,
    "vehicle_type" VARCHAR(50) NOT NULL,
    "fuel_type" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "inventory_vehicle_catalog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_vehicle_catalog_brand_fkey" FOREIGN KEY ("id_brand") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_vehicle_catalog_model_fkey" FOREIGN KEY ("id_model") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "inventory_vehicle_catalog_model_year_type_fuel_key" ON "inventory_vehicle_catalog"("id_model", "model_year", "vehicle_type", "fuel_type");
CREATE INDEX "inventory_vehicle_catalog_id_brand_id_model_idx" ON "inventory_vehicle_catalog"("id_brand", "id_model");
